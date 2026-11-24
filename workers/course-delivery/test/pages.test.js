import test from "node:test";
import assert from "node:assert/strict";

import {
  renderAccountPage,
  renderBuyPage,
  renderDeniedPage,
  renderErrorPage,
  renderLoginPage,
  renderUnavailablePage,
} from "../src/pages.js";
import { accentFor, escapeHtml } from "../src/ui.js";

test("所有页面共用站点骨架：头部、页脚、主题脚本", () => {
  const html = renderLoginPage({ locale: "zh", next: "/account" });
  assert.match(html, /<header class="site-header">/);
  assert.match(html, /<footer class="site-footer">/);
  assert.match(html, /id="theme-toggle"/);
  assert.match(html, /localStorage\.getItem\("theme"\)/);
  assert.match(html, /OpenCode Guide/);
});

test("页面保持 noindex，不随样式改动丢失", () => {
  for (const html of [
    renderLoginPage({ locale: "zh" }),
    renderBuyPage({ locale: "zh", courseTitle: "x", planLabel: "y", total: "US$1" }),
    renderAccountPage({ locale: "zh", email: "a@b.c", courses: [] }),
    renderDeniedPage({ locale: "zh" }),
    renderUnavailablePage({ locale: "zh" }),
    renderErrorPage({ locale: "zh" }),
  ]) {
    assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  }
});

test("登录页：Google 按钮与回跳地址", () => {
  const html = renderLoginPage({ locale: "zh", next: "/buy/ai-coding-workflow/single" });
  assert.match(html, /\/auth\/google\?next=%2Fbuy%2Fai-coding-workflow%2Fsingle/);
  assert.match(html, /使用 Google 账号继续/);
  assert.match(html, /class="btn btn-primary"/);
});

test("登录页：错误信息走提示条且被转义", () => {
  const html = renderLoginPage({ locale: "zh", error: "<script>alert(1)</script>" });
  assert.match(html, /class="alert"/);
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});

test("购买页：课程渐变、订单明细与 /checkout 表单", () => {
  const html = renderBuyPage({
    locale: "zh",
    courseTitle: "AI 编程实战",
    planLabel: "单课版",
    total: "US$79",
    accent: "from-emerald-500 via-teal-500 to-cyan-500",
    form: { course: "ai-coding-workflow", plan: "single" },
  });
  assert.match(html, /class="card-accent" style="background-image:linear-gradient\(135deg,#10b981/);
  assert.match(html, /action="\/checkout"/);
  assert.match(html, /name="course" value="ai-coding-workflow"/);
  assert.match(html, /US\$79/);
  // 课程名只出现一次（标题），不再在明细里重复
  assert.equal(html.split("AI 编程实战").length - 1, 1);
});

test("购买页：未知名 accent 回退到默认渐变", () => {
  const html = renderBuyPage({
    locale: "zh",
    courseTitle: "x",
    planLabel: "y",
    total: "US$1",
    accent: "from-pink-500 to-rose-500",
    form: {},
  });
  assert.match(html, /linear-gradient\(135deg,#6366f1/);
});

test("账户页：课程卡片带进入链接，空态给出去课程页入口", () => {
  const withCourses = renderAccountPage({
    locale: "zh",
    email: "buyer@example.com",
    courses: [{ courseSlug: "ai-coding-workflow", title: "AI 编程实战", planLabel: "单课版" }],
  });
  assert.match(withCourses, /buyer@example\.com/);
  assert.match(withCourses, /\/zh\/courses\/ai-coding-workflow/);
  assert.match(withCourses, /继续学习/);
  assert.match(withCourses, /1 门课/);

  const empty = renderAccountPage({ locale: "zh", email: "new@example.com", courses: [] });
  assert.match(empty, /这个邮箱还没有已购课程/);
  assert.match(empty, /https:\/\/opencodeguide\.com\/zh\/courses/);
});

test("错误页按原因区分文案（买课 404 不再说登录失败）", () => {
  const unknown = renderErrorPage({ locale: "zh", reason: "unknown-course" });
  assert.match(unknown, /课程暂时无法购买/);
  assert.doesNotMatch(unknown, /登录没有完成/);

  const payment = renderErrorPage({ locale: "zh", reason: "payment", next: "/buy/a/b" });
  assert.match(payment, /支付没有完成/);

  const login = renderErrorPage({ locale: "zh" });
  assert.match(login, /登录没有完成/);
  assert.match(login, /\/login\?next=%2Faccount/);
});

test("英文页面复用同一骨架，文案切到英文", () => {
  const html = renderLoginPage({ locale: "en", next: "/account" });
  assert.match(html, /<html lang="en">/);
  assert.match(html, /Sign in to start learning/);
  assert.match(html, /Continue with Google/);
  assert.match(html, /Course library/);
});

test("accentFor 只接受白名单类名", () => {
  assert.match(accentFor({ accent: "from-sky-500 via-blue-500 to-indigo-500" }), /#0ea5e9/);
  assert.match(accentFor({ accent: "javascript:alert(1)" }), /#6366f1/);
  assert.match(accentFor({}), /#6366f1/);
});

test("escapeHtml 覆盖引号与尖括号", () => {
  assert.equal(escapeHtml(`<a href="x">'&'</a>`), "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
});

test("账户页：模板仓库 / 社群链接与支付成功提示", () => {
  const html = renderAccountPage({
    locale: "zh",
    email: "buyer@example.com",
    courses: [
      {
        courseSlug: "ai-coding-workflow",
        title: "AI 编程实战",
        planLabel: "单课版",
        repo: "https://github.com/example/invitations",
        community: "https://discord.gg/example",
      },
    ],
    status: "paid",
    retry: 0,
    refreshHref: null,
  });

  assert.match(html, /支付成功，课程已开通/);
  assert.match(html, /私有模板仓库/);
  assert.match(html, /社群邀请/);
  assert.match(html, /github\.com\/example\/invitations/);
  assert.match(html, /discord\.gg\/example/);
  assert.match(html, /\/zh\/courses\/ai-coding-workflow/);
  assert.doesNotMatch(html, /http-equiv="refresh"/);
});

test("账户页：pending 自动刷新有上限，unpaid 不自动刷新", () => {
  const base = {
    locale: "zh",
    email: "buyer@example.com",
    courses: [],
    refreshHref: "/account?paid=1&retry=1&session_id=cs_x",
  };

  const pending = renderAccountPage({ ...base, status: "pending", retry: 0 });
  assert.match(pending, /支付已收到，正在开通/);
  assert.match(pending, /http-equiv="refresh" content="4"/);
  assert.match(pending, /\/account\?paid=1&amp;retry=1/);

  // 刷了 3 次还不行就停下来，别把人锁在刷新循环里
  const exhausted = renderAccountPage({ ...base, status: "pending", retry: 3 });
  assert.match(exhausted, /支付已收到，正在开通/);
  assert.doesNotMatch(exhausted, /http-equiv="refresh"/);

  const unpaid = renderAccountPage({ ...base, status: "unpaid", refreshHref: null });
  assert.match(unpaid, /支付处理中/);
  assert.doesNotMatch(unpaid, /http-equiv="refresh"/);
});

test("账户页：没有状态时不出提示条", () => {
  const html = renderAccountPage({ locale: "zh", email: "a@b.c", courses: [] });
  assert.doesNotMatch(html, /class="notice/);
});
