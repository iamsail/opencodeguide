/**
 * 邮件发送（Resend）。
 *
 * 选择 Resend 的原因：域名验证简单（SPF/DKIM 自动生成）、
 * 有幂等键、免费额度 3000 封/月，足够课程交付使用。
 * 发送失败不抛出业务错误——订单已落库，运营可以通过
 * `POST /admin/resend` 补发，Stripe 不该因为邮件失败而重试。
 */

import { getSettings } from "./config.js";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function createMailer(env = {}, { fetchImpl = fetch, logger = console } = {}) {
  const settings = getSettings(env);

  return {
    settings,

    async send({ to, subject, html, text, idempotencyKey }) {
      if (!to) throw new Error("邮件收件人为空");
      if (!subject) throw new Error("邮件主题为空");

      if (settings.dryRun) {
        logger.info(`[email:dry-run] to=${to} subject=${subject}`);
        return { id: "dry-run", dryRun: true };
      }
      if (!settings.resendApiKey) {
        throw new Error("RESEND_API_KEY 未配置");
      }

      const headers = {
        authorization: `Bearer ${settings.resendApiKey}`,
        "content-type": "application/json",
      };
      // 同一订单重复补发时，Resend 侧的幂等键避免用户收到多封
      if (idempotencyKey) headers["idempotency-key"] = idempotencyKey;

      const response = await fetchImpl(RESEND_ENDPOINT, {
        method: "POST",
        headers,
        body: JSON.stringify({
          from: settings.fromEmail,
          to: [to],
          subject,
          html,
          text,
          ...(settings.replyTo ? { reply_to: settings.replyTo } : {}),
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload?.message || payload?.error || response.statusText;
        throw new Error(`Resend ${response.status}: ${message}`);
      }
      return payload ?? {};
    },
  };
}
