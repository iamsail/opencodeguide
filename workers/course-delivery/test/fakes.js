/**
 * 测试替身：内存版 D1 + 可控的 mailer。
 *
 * 只实现 Worker 实际用到的那几条 SQL（见 src/store.js），
 * 万一 SQL 改了而这里没跟上，会直接报 "unsupported sql" —— 这正是想要的提醒。
 */

function normalize(sql) {
  return sql.replace(/\s+/g, " ").trim();
}

export function createFakeD1() {
  const orders = new Map();
  const events = new Map();
  /** key = `${email}\u0000${courseSlug}`，value 形如 entitlements 表的一行 */
  const entitlements = new Map();
  /** key = token_hash */
  const magicLinks = new Map();
  /** key = 限流窗口 key */
  const attempts = new Map();

  function execute(sql, params) {
    const statement = normalize(sql).toLowerCase().replace(/\s*;$/, "");

    if (statement.startsWith("insert or ignore into processed_events")) {
      const [eventId, type, receivedAt] = params;
      if (events.has(eventId)) return { changes: 0 };
      events.set(eventId, { event_id: eventId, type, received_at: receivedAt });
      return { changes: 1 };
    }

    if (statement.startsWith("delete from processed_events where event_id = ?")) {
      const existed = events.delete(params[0]);
      return { changes: existed ? 1 : 0 };
    }

    if (statement.startsWith("insert or ignore into orders")) {
      const [
        id,
        sessionId,
        paymentIntent,
        email,
        locale,
        courseSlug,
        planId,
        amountCents,
        currency,
        status,
        emailStatus,
        deliveryNote,
        createdAt,
        updatedAt,
      ] = params;
      const duplicate = [...orders.values()].some((row) => row.stripe_session_id === sessionId);
      if (duplicate) return { changes: 0 };
      orders.set(id, {
        id,
        stripe_session_id: sessionId,
        stripe_payment_intent: paymentIntent,
        email,
        locale,
        course_slug: courseSlug,
        plan_id: planId,
        amount_cents: amountCents,
        currency,
        status,
        email_status: emailStatus,
        delivery_note: deliveryNote,
        created_at: createdAt,
        updated_at: updatedAt,
        refunded_at: null,
        revoked_at: null,
      });
      return { changes: 1 };
    }

    if (statement.startsWith("select * from orders where stripe_session_id = ?")) {
      return first([...orders.values()].filter((row) => row.stripe_session_id === params[0]));
    }

    if (statement.includes("where stripe_payment_intent = ?")) {
      const matches = [...orders.values()]
        .filter((row) => row.stripe_payment_intent === params[0])
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
      return first(matches);
    }

    if (statement.startsWith("update orders set")) {
      const assignmentPart = normalize(sql).match(/set (.+?) where id = \?$/i);
      if (!assignmentPart) throw new Error(`fake d1: cannot parse update: ${sql}`);
      const columns = assignmentPart[1]
        .split(",")
        .map((piece) => piece.split("=")[0].trim());
      const id = params[params.length - 1];
      const row = orders.get(id);
      if (!row) return { changes: 0 };
      columns.forEach((column, index) => {
        row[column] = params[index];
      });
      return { changes: 1 };
    }

    if (statement.startsWith("insert into entitlements")) {
      const [id, email, courseSlug, planId, orderId, grantedAt] = params;
      const key = `${email}\u0000${courseSlug}`;
      const existing = entitlements.get(key);
      if (existing) {
        existing.plan_id = planId;
        existing.order_id = orderId;
        existing.granted_at = grantedAt;
        existing.revoked_at = null;
        return { changes: 1 };
      }
      entitlements.set(key, {
        id,
        email,
        course_slug: courseSlug,
        plan_id: planId,
        order_id: orderId,
        granted_at: grantedAt,
        revoked_at: null,
      });
      return { changes: 1 };
    }

    if (statement.startsWith("update entitlements set revoked_at")) {
      const [revokedAt, orderId] = params;
      let changes = 0;
      for (const row of entitlements.values()) {
        if (row.order_id === orderId && row.revoked_at === null) {
          row.revoked_at = revokedAt;
          changes += 1;
        }
      }
      return { changes };
    }

    if (statement.startsWith("insert into magic_links")) {
      const [tokenHash, email, expiresAt, createdAt, ip] = params;
      magicLinks.set(tokenHash, {
        token_hash: tokenHash,
        email,
        expires_at: expiresAt,
        created_at: createdAt,
        used_at: null,
        ip,
      });
      return { changes: 1 };
    }

    if (statement.startsWith("select * from magic_links where token_hash = ?")) {
      return first([magicLinks.get(params[0])].filter(Boolean));
    }

    if (statement.startsWith("update magic_links set used_at")) {
      const [usedAt, tokenHash] = params;
      const row = magicLinks.get(tokenHash);
      if (!row || row.used_at) return { changes: 0 };
      row.used_at = usedAt;
      return { changes: 1 };
    }

    if (statement.startsWith("insert into auth_attempts")) {
      const [key, at] = params;
      const existing = attempts.get(key);
      if (existing) {
        existing.count += 1;
        existing.updated_at = at;
        return { changes: 1 };
      }
      attempts.set(key, { key, count: 1, updated_at: at });
      return { changes: 1 };
    }

    if (statement.startsWith("select count from auth_attempts")) {
      const row = attempts.get(params[0]);
      return first(row ? [{ count: row.count }] : []);
    }

    if (statement.startsWith("delete from auth_attempts where updated_at < ?")) {
      let changes = 0;
      for (const [key, row] of attempts) {
        if (row.updated_at < params[0]) {
          attempts.delete(key);
          changes += 1;
        }
      }
      return { changes };
    }

    if (statement.startsWith("select course_slug, plan_id, granted_at, revoked_at from entitlements")) {
      const rows = [...entitlements.values()]
        .filter((row) => row.email === params[0])
        .sort((a, b) => a.course_slug.localeCompare(b.course_slug))
        .map((row) => ({
          course_slug: row.course_slug,
          plan_id: row.plan_id,
          granted_at: row.granted_at,
          revoked_at: row.revoked_at,
        }));
      return { rows };
    }

    if (statement.startsWith("select 1 from entitlements")) {
      const [email, courseSlug] = params;
      const row = entitlements.get(`${email}\u0000${courseSlug}`);
      return first(row && row.revoked_at === null ? [{ 1: 1 }] : []);
    }

    throw new Error(`fake d1: unsupported sql -> ${sql}`);
  }

  function first(rows) {
    return { row: rows[0] ?? null };
  }

  function statementFor(sql) {
    return {
      run: async (params) => ({ success: true, meta: execute(sql, params) }),
      first: async (params) => execute(sql, params).row ?? null,
      all: async (params) => ({ results: execute(sql, params).rows ?? [] }),
      bind: (...params) => ({
        run: async () => ({ success: true, meta: execute(sql, params) }),
        first: async () => execute(sql, params).row ?? null,
        all: async () => ({ results: execute(sql, params).rows ?? [] }),
      }),
    };
  }

  return {
    /** 测试断言用 */
    _orders: orders,
    _events: events,
    _entitlements: entitlements,
    _magicLinks: magicLinks,
    _attempts: attempts,
    prepare: (sql) => statementFor(sql),
  };
}

export function createFakeMailer({ onSend } = {}) {
  const sent = [];
  return {
    sent,
    async send(message) {
      if (onSend) await onSend(message, sent);
      sent.push(message);
      return { id: `msg_${sent.length}` };
    },
  };
}

export function createTestEnv({ db, overrides = {} } = {}) {
  return {
    DB: db,
    STRIPE_WEBHOOK_SECRET: "whsec_test",
    RESEND_API_KEY: "re_test",
    ADMIN_TOKEN: "admin_test",
    SUPPORT_EMAIL: "ops@example.com",
    SITE_URL: "https://opencodeguide.com",
    BRAND_NAME: "OpenCode Guide",
    MAIL_FROM: "OpenCode Guide <courses@opencodeguide.com>",
    REFUND_DAYS: "7",
    ALL_ACCESS_COURSES: "ai-coding-workflow,indie-saas-launch,cross-border-store,global-site-seo",
    REVOKE_ON_DISPUTE: "0",
    SESSION_SECRET: "test_session_secret",
    LEARN_URL: "https://learn.example.com",
    COURSE_DELIVERY: JSON.stringify({
      "ai-coding-workflow:*": {
        watch: "https://stream.example.com/ai-coding",
        repo: "https://github.com/example/course/invitations",
        community: "https://discord.gg/example",
      },
    }),
    EMAIL_DRY_RUN: "1",
    ...overrides,
  };
}

export function checkoutSession({
  sessionId = "cs_test_123",
  email = "buyer@example.com",
  reference = "ai-coding-workflow:single",
  amount = 7900,
  currency = "usd",
  locale = "zh",
  metadata = { course_slug: "ai-coding-workflow", plan_id: "single" },
  mode = "payment",
  paymentStatus = "paid",
  paymentIntent = "pi_test_123",
} = {}) {
  return {
    id: sessionId,
    object: "checkout.session",
    mode,
    payment_status: paymentStatus,
    amount_total: amount,
    currency,
    locale,
    client_reference_id: reference,
    payment_intent: paymentIntent,
    customer_details: { email },
    metadata,
  };
}

export function checkoutEvent(options = {}, eventId = "evt_checkout_1") {
  return {
    id: eventId,
    type: "checkout.session.completed",
    data: { object: checkoutSession(options) },
  };
}

export function refundEvent({
  chargeId = "ch_test_1",
  paymentIntent = "pi_test_123",
  amount = 7900,
  amountRefunded = 7900,
  currency = "usd",
  eventId = "evt_refund_1",
} = {}) {
  return {
    id: eventId,
    type: "charge.refunded",
    data: {
      object: {
        id: chargeId,
        object: "charge",
        payment_intent: paymentIntent,
        amount,
        amount_refunded: amountRefunded,
        currency,
      },
    },
  };
}
