/**
 * D1 存储层。
 *
 * 为什么用 D1：订单量很小（每单一次写入），不需要 Supabase 那样的
 * 外部项目与连接池；D1 与 Worker 同域部署、延迟低、免费额度足够。
 * 需要会员中心时，再把这几个函数换成 Supabase 客户端即可（接口不变）。
 *
 * 幂等三道锁：
 *   1. processed_events.event_id 主键 —— Stripe 重复投递直接跳过；
 *   2. orders.stripe_session_id 唯一 —— 同一 checkout session 只发一次货；
 *   3. 价格/邮箱以事件内容为准，不做「覆盖式更新」，避免乱序事件回滚状态。
 */

/** 允许更新的列（同时接受 camelCase 与数据库列名，统一映射到列名） */
const COLUMN_MAP = {
  status: "status",
  emailStatus: "email_status",
  email_status: "email_status",
  deliveryNote: "delivery_note",
  delivery_note: "delivery_note",
  stripePaymentIntent: "stripe_payment_intent",
  refundedAt: "refunded_at",
  refunded_at: "refunded_at",
  revokedAt: "revoked_at",
  revoked_at: "revoked_at",
  updatedAt: "updated_at",
  updated_at: "updated_at",
};

export function createStore(db) {
  if (!db) throw new Error("D1 binding `DB` 未配置");

  async function run(sql, params = []) {
    const statement = db.prepare(sql);
    return params.length > 0 ? statement.bind(...params).run() : statement.run();
  }

  return {
    /** @returns {Promise<boolean>} true = 首次收到该事件 */
    async markEventProcessed(eventId, type, at) {
      const result = await run(
        "insert or ignore into processed_events (event_id, type, received_at) values (?, ?, ?)",
        [eventId, type, at],
      );
      return (result?.meta?.changes ?? 0) > 0;
    },

    /** 处理失败时撤销标记，让 Stripe 重试能再次进入处理逻辑 */
    async unmarkEvent(eventId) {
      await run("delete from processed_events where event_id = ?", [eventId]);
    },

    /** @returns {Promise<boolean>} true = 新订单（false 表示 session 已处理过） */
    async insertOrder(order) {
      const result = await run(
        `insert or ignore into orders (
          id, stripe_session_id, stripe_payment_intent, email, locale,
          course_slug, plan_id, amount_cents, currency, status,
          email_status, delivery_note, created_at, updated_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order.id,
          order.stripeSessionId,
          order.stripePaymentIntent,
          order.email,
          order.locale,
          order.courseSlug,
          order.planId,
          order.amountCents,
          order.currency,
          order.status,
          order.emailStatus,
          order.deliveryNote,
          order.createdAt,
          order.updatedAt,
        ],
      );
      return (result?.meta?.changes ?? 0) > 0;
    },

    async findBySession(sessionId) {
      const statement = db.prepare("select * from orders where stripe_session_id = ?");
      return (await statement.bind(sessionId).first()) ?? null;
    },

    async findByPaymentIntent(paymentIntent) {
      const statement = db.prepare(
        "select * from orders where stripe_payment_intent = ? order by created_at desc limit 1",
      );
      return (await statement.bind(paymentIntent).first()) ?? null;
    },

    async updateOrder(id, patch) {
      const columns = new Map();
      for (const [key, value] of Object.entries(patch)) {
        const column = COLUMN_MAP[key];
        if (!column) continue;
        columns.set(column, value);
      }
      if (columns.size === 0) return;
      const assignments = [...columns.keys()].map((column) => `${column} = ?`).join(", ");
      await run(`update orders set ${assignments} where id = ?`, [...columns.values(), id]);
    },

    /* ---------------- 权益（P2.1） ---------------- */

    /**
     * 写权益（幂等）。
     * unique(email, course_slug) 上的 upsert：重复购买会「复活」同一条记录并指向新订单，
     * 而不是堆出两条——否则 /account 里会出现重复课程，退款也容易只撤一半。
     */
    async grantEntitlement(ent) {
      await run(
        `insert into entitlements (id, email, course_slug, plan_id, order_id, granted_at, revoked_at)
         values (?, ?, ?, ?, ?, ?, null)
         on conflict(email, course_slug) do update set
           plan_id    = excluded.plan_id,
           order_id   = excluded.order_id,
           granted_at = excluded.granted_at,
           revoked_at = null`,
        [ent.id, ent.email, ent.courseSlug, ent.planId, ent.orderId, ent.grantedAt],
      );
    },

    /** 按订单回收权益（全额退款/可选拒付），返回本次真正被撤销的条数 */
    async revokeEntitlementsByOrder(orderId, revokedAt) {
      const result = await run(
        "update entitlements set revoked_at = ? where order_id = ? and revoked_at is null",
        [revokedAt, orderId],
      );
      return result?.meta?.changes ?? 0;
    },

    /** 门禁查询：该邮箱现在能否读这门课（每次请求都查库，所以退款即时生效） */
    async hasEntitlement(email, courseSlug) {
      const statement = db.prepare(
        "select 1 from entitlements where email = ? and course_slug = ? and revoked_at is null limit 1",
      );
      const row = await statement.bind(email, courseSlug).first();
      return Boolean(row);
    },

    /** 账户页：该邮箱的全部权益（含已撤销，便于排查） */
    async listEntitlementsByEmail(email) {
      const statement = db.prepare(
        `select course_slug, plan_id, granted_at, revoked_at
           from entitlements where email = ? order by course_slug`,
      );
      const result = await statement.bind(email).all();
      return result?.results ?? [];
    },

    /* ---------------- 登录令牌与限流（P2.2） ---------------- */

    /** 只存 sha256(token)；ip 仅用于排查 */
    async insertMagicLink(link) {
      await run(
        "insert into magic_links (token_hash, email, expires_at, created_at, ip) values (?, ?, ?, ?, ?)",
        [link.tokenHash, link.email, link.expiresAt, link.createdAt, link.ip ?? null],
      );
    },

    async findMagicLink(tokenHash) {
      const statement = db.prepare("select * from magic_links where token_hash = ?");
      return (await statement.bind(tokenHash).first()) ?? null;
    },

    /** 单次使用：只有第一次 update 会命中 used_at is null，天然防并发重放 */
    async markMagicLinkUsed(tokenHash, usedAt) {
      const result = await run(
        "update magic_links set used_at = ? where token_hash = ? and used_at is null",
        [usedAt, tokenHash],
      );
      return (result?.meta?.changes ?? 0) > 0;
    },

    /** 固定窗口计数，返回自增后的次数 */
    async incrementAttempt(key, at) {
      await run(
        `insert into auth_attempts (key, count, updated_at) values (?, 1, ?)
         on conflict(key) do update set count = count + 1, updated_at = excluded.updated_at`,
        [key, at],
      );
      const statement = db.prepare("select count from auth_attempts where key = ?");
      const row = await statement.bind(key).first();
      return Number(row?.count ?? 1);
    },

    /** 清掉过期窗口，避免计数表无限增长 */
    async pruneAttempts(before) {
      await run("delete from auth_attempts where updated_at < ?", [before]);
    },
  };
}
