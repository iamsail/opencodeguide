/**
 * 极简 Stripe 客户端（REST + form encoding，零依赖）。
 *
 * 只做两件事：
 *   1. 按邮箱找/建 Customer —— 让「登录身份」和「付款人」是同一个邮箱，
 *      Checkout 页面上邮箱不可改，身份不会漂移；
 *   2. 创建 Checkout Session —— 取代 Payment Link，从而能在下单前要求登录。
 *
 * 为什么传 customer 而不是 customer_email：customer_email 只是预填，
 * 买家在 Stripe 页面还能改；绑定 Customer 后邮箱是锁死的。
 */

const API = "https://api.stripe.com/v1";
export const STRIPE_API_VERSION = "2024-06-20";

function encode(params, prefix = "", out = []) {
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const name = prefix ? `${prefix}[${key}]` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      encode(value, name, out);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item !== null && typeof item === "object") encode(item, `${name}[${index}]`, out);
        else out.push([`${name}[${index}]`, String(item)]);
      });
    } else {
      out.push([name, String(value)]);
    }
  }
  return out;
}

export function createStripeClient({ secretKey, fetchImpl = fetch, apiVersion = STRIPE_API_VERSION }) {
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY 未配置");

  async function request(method, pathname, body) {
    const headers = { authorization: `Bearer ${secretKey}`, "Stripe-Version": apiVersion };
    const init = { method, headers };
    if (body) {
      headers["content-type"] = "application/x-www-form-urlencoded";
      init.body = new URLSearchParams(encode(body)).toString();
    }

    const response = await fetchImpl(`${API}${pathname}`, init);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = payload?.error?.message || response.statusText;
      throw new Error(`Stripe ${method} ${pathname} 失败：${message}`);
    }
    return payload;
  }

  return {
    /** 先按邮箱查，找不到再建；同一个邮箱永远只有一个 Customer */
    async ensureCustomer({ email, name, metadata = {} }) {
      const query = new URLSearchParams({ email, limit: "1" });
      const existing = await request("GET", `/customers?${query.toString()}`);
      const found = existing?.data?.[0];
      if (found) return found;

      return request("POST", "/customers", {
        email,
        ...(name ? { name } : {}),
        metadata,
      });
    },

    /**
     * 创建 Checkout Session：用 `price_data` 现场报价，不需要预建 Product / Price。
     *
     * 为什么不用预建 Price：课程是买断制，价格来自 content/courses/*.json，预建 9 个
     * Product/Price 只多一份要同步的 ID，换 live 时还会因为「catalog 换了、密钥没换」
     * 报 `No such price`。动态报价把金额的唯一来源留在仓库里（见 catalog.js）。
     */
    async createCheckoutSession({
      customerId,
      amount,
      currency = "usd",
      title,
      successUrl,
      cancelUrl,
      locale = "zh",
      metadata = {},
      automaticTax = false,
      taxBehavior = "exclusive",
    }) {
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error(`结账金额无效：${amount}`);
      }

      return request("POST", "/checkout/sessions", {
        mode: "payment",
        customer: customerId,
        line_items: [
          {
            price_data: {
              currency,
              unit_amount: Math.round(amount),
              product_data: { name: title },
              // Stripe Tax 要求价格带 tax_behavior（inclusive / exclusive），
              // 只在开启自动计税时传，避免默认行为被改变
              ...(automaticTax ? { tax_behavior: taxBehavior } : {}),
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        locale,
        allow_promotion_codes: true,
        invoice_creation: { enabled: true },
        ...(automaticTax ? { automatic_tax: { enabled: true } } : {}),
        // 我们对账与授权都靠 metadata：它比 industry 里的 client_reference_id 更可靠
        metadata,
      });
    },

    /** 对账用：按 session id 取回会话（含 payment_status 与 metadata） */
    async retrieveCheckoutSession(sessionId) {
      return request("GET", `/checkout/sessions/${encodeURIComponent(sessionId)}`);
    },
  };
}
