/**
 * 开通邮件 / 退款邮件的双语模板。
 *
 * 不引入模板引擎：这里的动态量很少，手写字符串更好审计，
 * 也避免多一个有供应链风险的依赖。所有插值都经过 escapeHtml。
 */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout({ brandName, siteUrl, preheader, bodyHtml }) {
  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f6f7f9;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;font-size:15px;line-height:1.65;color:#111827;">
    <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;margin-bottom:20px;">
      ${escapeHtml(brandName)}
    </div>
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;padding:28px 24px;">
      ${bodyHtml}
    </div>
    <div style="margin-top:20px;font-size:12px;color:#9ca3af;line-height:1.6;">
      <a href="${escapeHtml(siteUrl)}" style="color:#9ca3af;text-decoration:underline;">${escapeHtml(
        siteUrl.replace(/^https?:\/\//, ""),
      )}</a>
    </div>
  </div>
</body>
</html>`;
}

function button(href, label) {
  return `<a href="${escapeHtml(
    href,
  )}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600;font-size:14px;">${escapeHtml(
    label,
  )}</a>`;
}

function accessRow(label, value, note) {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;vertical-align:top;width:38%;color:#6b7280;font-size:13px;">${escapeHtml(
      label,
    )}</td>
    <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;vertical-align:top;font-size:14px;word-break:break-all;">
      <a href="${escapeHtml(value)}" style="color:#1d4ed8;text-decoration:underline;">${escapeHtml(
        value,
      )}</a>
      ${note ? `<div style="color:#9ca3af;font-size:12px;margin-top:2px;">${escapeHtml(note)}</div>` : ""}
    </td>
  </tr>`;
}

/**
 * 付款成功后的开通邮件。
 * @param {object} params
 * @param {"zh"|"en"} params.locale
 * @param {object} params.order  { id, email, amountCents, currency, createdAt }
 * @param {string} params.courseTitle
 * @param {string} params.planLabel
 * @param {{watch:string, repo?:string|null, community?:string|null}} params.delivery
 * @param {object} params.settings { brandName, siteUrl, supportEmail, refundDays }
 */
export function buildGrantEmail({ locale, order, courseTitle, planLabel, delivery, settings }) {
  const support = settings.supportEmail || "";
  const amount = order.formattedAmount || "";
  const orderLine = order.id ? `<div style="font-size:12px;color:#9ca3af;margin-top:12px;">#${
    escapeHtml(order.id)
  }${amount ? ` · ${escapeHtml(amount)}` : ""}</div>` : "";

  if (locale === "zh") {
    const subject = `《${courseTitle}》已开通 · 观看链接与社群邀请`;
    const rows = [
      accessRow("课程观看入口", delivery.watch, "永久访问，建议收藏本邮件"),
      delivery.repo ? accessRow("私有模板仓库", delivery.repo, "首次访问需接受 GitHub 邀请") : "",
      delivery.community ? accessRow("社群邀请", delivery.community, "30 天答疑期内有效") : "",
    ]
      .filter(Boolean)
      .join("");

    const html = layout({
      brandName: settings.brandName,
      siteUrl: settings.siteUrl,
      preheader: `《${courseTitle}》的观看链接与社群邀请`,
      bodyHtml: `
        <h1 style="margin:0 0 6px;font-size:20px;line-height:1.4;">付款成功，课程已开通 🎉</h1>
        <p style="margin:0 0 4px;color:#4b5563;">你好，感谢购买《${escapeHtml(courseTitle)}》（${escapeHtml(
          planLabel,
        )}）。</p>
        ${orderLine}
        <table style="width:100%;border-collapse:collapse;margin:18px 0 4px;">${rows}</table>
        <div style="margin:22px 0 0;">${button(delivery.watch, "开始学习")}</div>
        <div style="margin-top:22px;padding-top:18px;border-top:1px solid #f3f4f6;font-size:13px;color:#6b7280;">
          <p style="margin:0 0 8px;"><strong style="color:#374151;">${settings.refundDays} 天无理由退款。</strong>
          在 ${settings.refundDays} 天内，如果不适合你，回复本邮件即可全额退款，不需要理由。</p>
          ${
            support
              ? `<p style="margin:0;">遇到问题？回信或联系 <a href="mailto:${escapeHtml(
                  support,
                )}" style="color:#1d4ed8;">${escapeHtml(support)}</a>，我们会在 1 个工作日内回复。</p>`
              : ""
          }
        </div>`,
    });

    const text = [
      `《${courseTitle}》（${planLabel}）已开通。`,
      "",
      `观看入口：${delivery.watch}`,
      delivery.repo ? `私有模板仓库：${delivery.repo}` : null,
      delivery.community ? `社群邀请：${delivery.community}` : null,
      "",
      order.id ? `订单号：${order.id}${amount ? ` · ${amount}` : ""}` : null,
      `${settings.refundDays} 天无理由退款：回复本邮件即可。`,
      support ? `问题咨询：${support}` : null,
      settings.siteUrl,
    ]
      .filter((line) => line !== null)
      .join("\n");

    return { subject, html, text };
  }

  const subject = `${courseTitle} — your access is ready`;
  const rows = [
    accessRow("Course access", delivery.watch, "Lifetime access — bookmark this email"),
    delivery.repo ? accessRow("Private template repo", delivery.repo, "Accept the GitHub invite on first visit") : "",
    delivery.community ? accessRow("Community invite", delivery.community, "Valid for 30 days") : "",
  ]
    .filter(Boolean)
    .join("");

  const html = layout({
    brandName: settings.brandName,
    siteUrl: settings.siteUrl,
    preheader: `Your access to ${courseTitle}`,
    bodyHtml: `
      <h1 style="margin:0 0 6px;font-size:20px;line-height:1.4;">Payment received — you're in 🎉</h1>
      <p style="margin:0 0 4px;color:#4b5563;">Thanks for buying ${escapeHtml(
        courseTitle,
      )} (${escapeHtml(planLabel)}).</p>
      ${orderLine}
      <table style="width:100%;border-collapse:collapse;margin:18px 0 4px;">${rows}</table>
      <div style="margin:22px 0 0;">${button(delivery.watch, "Start learning")}</div>
      <div style="margin-top:22px;padding-top:18px;border-top:1px solid #f3f4f6;font-size:13px;color:#6b7280;">
        <p style="margin:0 0 8px;"><strong style="color:#374151;">${settings.refundDays}-day refund, no questions asked.</strong>
        If the course isn't for you, reply to this email within ${settings.refundDays} days for a full refund.</p>
        ${
          support
            ? `<p style="margin:0;">Need help? Reply here or email <a href="mailto:${escapeHtml(
                support,
              )}" style="color:#1d4ed8;">${escapeHtml(support)}</a> — we reply within one business day.</p>`
            : ""
        }
      </div>`,
  });

  const text = [
    `${courseTitle} (${planLabel}) — access granted.`,
    "",
    `Course access: ${delivery.watch}`,
    delivery.repo ? `Private template repo: ${delivery.repo}` : null,
    delivery.community ? `Community invite: ${delivery.community}` : null,
    "",
    order.id ? `Order: ${order.id}${amount ? ` · ${amount}` : ""}` : null,
    `${settings.refundDays}-day refund: just reply to this email.`,
    support ? `Support: ${support}` : null,
    settings.siteUrl,
  ]
    .filter((line) => line !== null)
    .join("\n");

  return { subject, html, text };
}

/** 退款通知：告知到账时间与权益已回收，减少「退款了怎么还能看」的误会 */
export function buildRefundEmail({ locale, order, courseTitle, planLabel, settings, partial = false }) {
  const support = settings.supportEmail || "";
  const amount = order.formattedAmount || "";

  if (locale === "zh") {
    const subject = `${partial ? "部分退款" : "退款"}已处理 ·《${courseTitle}》`;
    const html = layout({
      brandName: settings.brandName,
      siteUrl: settings.siteUrl,
      preheader: `《${courseTitle}》退款已处理`,
      bodyHtml: `
        <h1 style="margin:0 0 6px;font-size:20px;line-height:1.4;">${partial ? "部分退款" : "退款"}已处理</h1>
        <p style="margin:0 0 12px;color:#4b5563;">《${escapeHtml(courseTitle)}》（${escapeHtml(
          planLabel,
        )}）的退款已经发起。</p>
        <table style="width:100%;border-collapse:collapse;margin:12px 0;">
          <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:38%;">退款金额</td><td style="padding:8px 0;font-size:14px;">${escapeHtml(
            amount || "—",
          )}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">到账时间</td><td style="padding:8px 0;font-size:14px;">3–10 个工作日（由发卡行决定）</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">课程权限</td><td style="padding:8px 0;font-size:14px;">已关闭</td></tr>
        </table>
        <p style="margin:16px 0 0;font-size:13px;color:#6b7280;">如果这笔退款不是你申请的，或者金额有疑问，请立即回复本邮件${
          support ? `或联系 ${escapeHtml(support)}` : ""
        }。</p>`,
    });
    const text = [
      `《${courseTitle}》（${planLabel}）的${partial ? "部分退款" : "退款"}已处理。`,
      amount ? `退款金额：${amount}` : null,
      "退款将在 3–10 个工作日退回原支付方式，课程权限已关闭。",
      support ? `问题咨询：${support}` : null,
    ]
      .filter(Boolean)
      .join("\n");
    return { subject, html, text };
  }

  const subject = `${partial ? "Partial refund" : "Refund"} processed — ${courseTitle}`;
  const html = layout({
    brandName: settings.brandName,
    siteUrl: settings.siteUrl,
    preheader: `Refund processed for ${courseTitle}`,
    bodyHtml: `
      <h1 style="margin:0 0 6px;font-size:20px;line-height:1.4;">${partial ? "Partial refund" : "Refund"} processed</h1>
      <p style="margin:0 0 12px;color:#4b5563;">We've issued a refund for ${escapeHtml(
        courseTitle,
      )} (${escapeHtml(planLabel)}).</p>
      <table style="width:100%;border-collapse:collapse;margin:12px 0;">
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:38%;">Amount</td><td style="padding:8px 0;font-size:14px;">${escapeHtml(
          amount || "—",
        )}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Timeline</td><td style="padding:8px 0;font-size:14px;">3–10 business days (set by your bank)</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Access</td><td style="padding:8px 0;font-size:14px;">Revoked</td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:13px;color:#6b7280;">If you didn't request this refund, reply right away${
        support ? ` or contact ${escapeHtml(support)}` : ""
      }.</p>`,
  });
  const text = [
    `Refund processed for ${courseTitle} (${planLabel}).`,
    amount ? `Amount: ${amount}` : null,
    "Funds return to the original payment method in 3–10 business days; course access has been revoked.",
    support ? `Support: ${support}` : null,
  ]
    .filter(Boolean)
    .join("\n");
  return { subject, html, text };
}

/** 内部告警：需要人工交付 / 无法识别订单时发给运营 */
export function buildOpsAlert({ subject, lines }) {
  const html = layout({
    brandName: "Ops alert",
    siteUrl: "https://opencodeguide.com",
    preheader: subject,
    bodyHtml: `
      <h1 style="margin:0 0 12px;font-size:18px;">${escapeHtml(subject)}</h1>
      <ul style="margin:0;padding-left:18px;color:#374151;font-size:14px;">
        ${lines.map((line) => `<li style="margin:6px 0;">${escapeHtml(line)}</li>`).join("")}
      </ul>`,
  });
  return {
    subject: `[course-delivery] ${subject}`,
    html,
    text: [subject, "", ...lines].join("\n"),
  };
}

/**
 * 登录邮件（P2.2）。一次性链接，15 分钟过期。
 * 文案要能解释「为什么收到」和「不是本人怎么办」，减少用户举报/丢信。
 */
export function buildLoginEmail({ locale, email, loginUrl, expiresMinutes = 15, settings }) {
  const support = settings.supportEmail || "";

  if (locale === "zh") {
    const subject = "登录课程阅读区 · 一次性链接（15 分钟内有效）";
    const html = layout({
      brandName: settings.brandName,
      siteUrl: settings.siteUrl,
      preheader: "点一次即可登录，链接 15 分钟后过期",
      bodyHtml: `
        <h1 style="margin:0 0 6px;font-size:20px;line-height:1.4;">你的登录链接</h1>
        <p style="margin:0 0 4px;color:#4b5563;">点击下面的按钮即可登录课程阅读区（${escapeHtml(
          email,
        )}）。</p>
        <div style="margin:22px 0 0;">${button(loginUrl, "登录并开始阅读")}</div>
        <div style="margin-top:22px;padding-top:18px;border-top:1px solid #f3f4f6;font-size:13px;color:#6b7280;">
          <p style="margin:0 0 8px;">链接 ${expiresMinutes} 分钟内有效，且只能用一次。</p>
          <p style="margin:0 0 8px;">如果你没有请求登录，忽略本邮件即可，不会有人进入你的账户。</p>
          ${
            support
              ? `<p style="margin:0;">遇到问题？回信或联系 <a href="mailto:${escapeHtml(
                  support,
                )}" style="color:#1d4ed8;">${escapeHtml(support)}</a>。</p>`
              : ""
          }
        </div>`,
    });

    const text = [
      `登录课程阅读区（${email}）：${loginUrl}`,
      `${expiresMinutes} 分钟内有效，且只能用一次。`,
      "不是你本人操作？忽略本邮件即可。",
      support ? `问题咨询：${support}` : null,
      settings.siteUrl,
    ]
      .filter(Boolean)
      .join("\n");

    return { subject, html, text };
  }

  const subject = "Your course sign-in link (valid for 15 minutes)";
  const html = layout({
    brandName: settings.brandName,
    siteUrl: settings.siteUrl,
    preheader: "One click to sign in — the link expires in 15 minutes",
    bodyHtml: `
      <h1 style="margin:0 0 6px;font-size:20px;line-height:1.4;">Here's your sign-in link</h1>
      <p style="margin:0 0 4px;color:#4b5563;">Click the button below to open the course library for ${escapeHtml(
        email,
      )}.</p>
      <div style="margin:22px 0 0;">${button(loginUrl, "Sign in and start reading")}</div>
      <div style="margin-top:22px;padding-top:18px;border-top:1px solid #f3f4f6;font-size:13px;color:#6b7280;">
        <p style="margin:0 0 8px;">The link works once and expires in ${expiresMinutes} minutes.</p>
        <p style="margin:0 0 8px;">Didn't request this? Ignore the email — nobody can access your account with it.</p>
        ${
          support
            ? `<p style="margin:0;">Need help? Reply to this email or contact <a href="mailto:${escapeHtml(
                support,
              )}" style="color:#1d4ed8;">${escapeHtml(support)}</a>.</p>`
            : ""
        }
      </div>`,
  });

  const text = [
    `Sign in to the course library (${email}): ${loginUrl}`,
    `Valid for ${expiresMinutes} minutes, single use.`,
    "Didn't request it? Just ignore this email.",
    support ? `Support: ${support}` : null,
    settings.siteUrl,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}
