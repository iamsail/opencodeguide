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
  };
}
