import assert from "node:assert/strict";
import test from "node:test";

import { buildGrantEmail, buildOpsAlert, buildRefundEmail } from "../src/templates.js";

const settings = {
  brandName: "OpenCode Guide",
  siteUrl: "https://opencodeguide.com",
  supportEmail: "support@opencodeguide.com",
  refundDays: 7,
};

const delivery = {
  watch: "https://stream.example.com/ai-coding",
  repo: "https://github.com/example/repo/invitations",
  community: "https://discord.gg/example",
};

const order = { id: "ord_1", formattedAmount: "$79" };

test("中文开通信包含三门交付物与退款说明", () => {
  const mail = buildGrantEmail({
    locale: "zh",
    order,
    courseTitle: "AI 编程实战",
    planLabel: "单课版",
    delivery,
    settings,
  });

  assert.match(mail.subject, /AI 编程实战/);
  assert.match(mail.subject, /已开通/);
  assert.match(mail.html, /https:\/\/stream\.example\.com\/ai-coding/);
  assert.match(mail.html, /github\.com\/example\/repo\/invitations/);
  assert.match(mail.html, /discord\.gg\/example/);
  assert.match(mail.text, /7 天无理由退款/);
  assert.match(mail.text, /support@opencodeguide\.com/);
});

test("英文开通信不复用中文文案", () => {
  const mail = buildGrantEmail({
    locale: "en",
    order,
    courseTitle: "AI Coding Workflow",
    planLabel: "Single",
    delivery,
    settings,
  });

  assert.match(mail.subject, /AI Coding Workflow/);
  assert.match(mail.text, /7-day refund/);
  assert.ok(!mail.text.includes("退款"));
  assert.match(mail.html, /Start learning/);
});

test("缺少 repo / community 时不渲染空行", () => {
  const mail = buildGrantEmail({
    locale: "zh",
    order,
    courseTitle: "仅视频课",
    planLabel: "单课版",
    delivery: { watch: "https://stream.example.com/only" },
    settings,
  });

  assert.match(mail.text, /^观看入口：https:\/\/stream\.example\.com\/only/m);
  assert.ok(!mail.text.includes("私有模板仓库"));
  assert.ok(!mail.text.includes("社群邀请"));
});

test("动态内容被转义，不会注入 HTML", () => {
  const mail = buildGrantEmail({
    locale: "zh",
    order,
    courseTitle: '<script>alert("x")</script>',
    planLabel: "单课版",
    delivery,
    settings,
  });

  assert.ok(!mail.html.includes("<script>"));
  assert.match(mail.html, /&lt;script&gt;/);
});

test("退款邮件说明到账时间与权限回收", () => {
  const zh = buildRefundEmail({
    locale: "zh",
    order: { id: "ord_1", formattedAmount: "$79" },
    courseTitle: "AI 编程实战",
    planLabel: "单课版",
    settings,
  });
  assert.match(zh.subject, /退款已处理/);
  assert.match(zh.text, /3–10 个工作日/);
  assert.match(zh.text, /权限已关闭/);

  const en = buildRefundEmail({
    locale: "en",
    order: { id: "ord_1", formattedAmount: "$79" },
    courseTitle: "AI Coding Workflow",
    planLabel: "Single",
    settings,
    partial: true,
  });
  assert.match(en.subject, /Partial refund/);
  assert.match(en.text, /3–10 business days/);
});

test("运营告警带统一前缀，便于邮箱规则分流", () => {
  const alert = buildOpsAlert({ subject: "有订单需要人工交付", lines: ["订单：cs_1", "原因：x"] });
  assert.match(alert.subject, /^\[course-delivery\]/);
  assert.match(alert.text, /cs_1/);
});
