import assert from "node:assert/strict";
import test from "node:test";

import {
  ALL_ACCESS_SLUG,
  grantEntitlements,
  hasCourseAccess,
  normalizeEmail,
  resolveEntitlementTargets,
  revokeEntitlements,
} from "../src/entitlements.js";
import { createStore } from "../src/store.js";
import { createFakeD1 } from "./fakes.js";

const TRACKS = ["ai-coding-workflow", "indie-saas-launch", "cross-border-store", "global-site-seo"];

function setup(envOverrides = {}) {
  const db = createFakeD1();
  const store = createStore(db);
  const env = { ALL_ACCESS_COURSES: TRACKS.join(","), ...envOverrides };
  const logger = { warn() {}, error() {}, info() {} };
  const now = () => new Date("2026-11-19T10:00:00Z");
  return { db, store, env, logger, now };
}

test("normalizeEmail：去空格统一小写，非法值返回 null", () => {
  assert.equal(normalizeEmail("  Buyer@Example.COM "), "buyer@example.com");
  assert.equal(normalizeEmail("not-an-email"), null);
  assert.equal(normalizeEmail(null), null);
  assert.equal(normalizeEmail(42), null);
});

test("单课购买只授权那一门课", () => {
  assert.deepEqual(
    resolveEntitlementTargets({ courseSlug: "ai-coding-workflow", planId: "single" }),
    ["ai-coding-workflow"],
  );
});

test("全站通展开为四门课 + bundle 自身", () => {
  const targets = resolveEntitlementTargets({
    courseSlug: "all-access",
    planId: "all-access",
    env: { ALL_ACCESS_COURSES: TRACKS.join(",") },
  });
  assert.deepEqual(targets, [...TRACKS, ALL_ACCESS_SLUG]);
});

test("plan_id=all-access 也按全站通处理", () => {
  const targets = resolveEntitlementTargets({
    courseSlug: "ai-coding-workflow",
    planId: "all-access",
    env: { ALL_ACCESS_COURSES: TRACKS.join(",") },
  });
  assert.equal(targets.length, TRACKS.length + 1);
  assert.ok(targets.includes("ai-coding-workflow"));
  assert.ok(targets.includes(ALL_ACCESS_SLUG));
});

test("ALL_ACCESS_COURSES 可覆盖默认课程列表", () => {
  const targets = resolveEntitlementTargets({
    courseSlug: "all-access",
    planId: "all-access",
    env: { ALL_ACCESS_COURSES: "course-a, course-b" },
  });
  assert.deepEqual(targets, ["course-a", "course-b", ALL_ACCESS_SLUG]);
});

test("识别不出课程时不产生任何授权", () => {
  assert.deepEqual(resolveEntitlementTargets({ courseSlug: "", planId: "single" }), []);
  assert.deepEqual(resolveEntitlementTargets({}), []);
});

test("付款写权益：规范化邮箱、记 order_id、未撤销", async () => {
  const { db, store, env, logger, now } = setup();

  const result = await grantEntitlements({
    store,
    env,
    logger,
    now,
    order: {
      id: "order-1",
      email: " Buyer@Example.COM ",
      course_slug: "ai-coding-workflow",
      plan_id: "single",
    },
  });

  assert.deepEqual(result.granted, ["ai-coding-workflow"]);
  assert.equal(db._entitlements.size, 1);
  const row = [...db._entitlements.values()][0];
  assert.equal(row.email, "buyer@example.com");
  assert.equal(row.order_id, "order-1");
  assert.equal(row.granted_at, "2026-11-19T10:00:00.000Z");
  assert.equal(row.revoked_at, null);
});

test("全站通付款一次性写 5 条权益", async () => {
  const { db, store, env, logger, now } = setup();

  const result = await grantEntitlements({
    store,
    env,
    logger,
    now,
    order: { id: "order-bundle", email: "buyer@example.com", course_slug: "all-access", plan_id: "all-access" },
  });

  assert.equal(result.granted.length, 5);
  assert.equal(db._entitlements.size, 5);
});

test("重复授权幂等：同一订单跑两次仍是同一条", async () => {
  const { db, store, env, logger, now } = setup();
  const order = { id: "order-1", email: "buyer@example.com", course_slug: "ai-coding-workflow", plan_id: "single" };

  await grantEntitlements({ store, env, logger, now, order });
  await grantEntitlements({ store, env, logger, now, order });

  assert.equal(db._entitlements.size, 1);
});

test("退款后重新购买会复活同一条权益并指向新订单", async () => {
  const { db, store, env, logger, now } = setup();
  const first = { id: "order-1", email: "buyer@example.com", course_slug: "ai-coding-workflow", plan_id: "single" };
  const second = { id: "order-2", email: "buyer@example.com", course_slug: "ai-coding-workflow", plan_id: "single" };

  await grantEntitlements({ store, env, logger, now, order: first });
  await revokeEntitlements({ store, order: first, now });
  assert.ok([...db._entitlements.values()][0].revoked_at);

  await grantEntitlements({ store, env, logger, now, order: second });

  const row = [...db._entitlements.values()][0];
  assert.equal(db._entitlements.size, 1, "不应堆出第二条记录");
  assert.equal(row.revoked_at, null);
  assert.equal(row.order_id, "order-2");
});

test("回收按订单隔离：只撤该订单名下的权益", async () => {
  const { db, store, env, logger, now } = setup();
  const orderA = { id: "order-a", email: "a@example.com", course_slug: "ai-coding-workflow", plan_id: "single" };
  const orderB = { id: "order-b", email: "b@example.com", course_slug: "ai-coding-workflow", plan_id: "single" };

  await grantEntitlements({ store, env, logger, now, order: orderA });
  await grantEntitlements({ store, env, logger, now, order: orderB });

  const revoked = await revokeEntitlements({ store, order: orderA, now });

  assert.equal(revoked.revoked, 1);
  const rows = [...db._entitlements.values()];
  assert.ok(rows.find((row) => row.email === "a@example.com").revoked_at);
  assert.equal(rows.find((row) => row.email === "b@example.com").revoked_at, null);
});

test("重复回收不会重复计数（幂等）", async () => {
  const { store, env, logger, now } = setup();
  const order = { id: "order-1", email: "buyer@example.com", course_slug: "ai-coding-workflow", plan_id: "single" };

  await grantEntitlements({ store, env, logger, now, order });
  const first = await revokeEntitlements({ store, order, now });
  const second = await revokeEntitlements({ store, order, now });

  assert.equal(first.revoked, 1);
  assert.equal(second.revoked, 0);
});

test("hasCourseAccess 反映当前授权状态", async () => {
  const { store, env, logger, now } = setup();
  const order = { id: "order-1", email: "buyer@example.com", course_slug: "ai-coding-workflow", plan_id: "single" };

  assert.equal(await hasCourseAccess({ store, email: "buyer@example.com", courseSlug: "ai-coding-workflow" }), false);

  await grantEntitlements({ store, env, logger, now, order });
  assert.equal(await hasCourseAccess({ store, email: "BUYER@example.com", courseSlug: "ai-coding-workflow" }), true);
  assert.equal(await hasCourseAccess({ store, email: "buyer@example.com", courseSlug: "indie-saas-launch" }), false);

  await revokeEntitlements({ store, order, now });
  assert.equal(await hasCourseAccess({ store, email: "buyer@example.com", courseSlug: "ai-coding-workflow" }), false);
});

test("没有邮箱：跳过授权并留下告警，不抛错", async () => {
  const { db, store, env, now } = setup();
  const warnings = [];
  const logger = { warn: (message) => warnings.push(message), error() {}, info() {} };

  const result = await grantEntitlements({
    store,
    env,
    logger,
    now,
    order: { id: "order-x", email: null, course_slug: "ai-coding-workflow", plan_id: "single" },
  });

  assert.equal(result.granted.length, 0);
  assert.equal(result.skipped, "missing_email");
  assert.equal(db._entitlements.size, 0);
  assert.equal(warnings.length, 1);
});
