/**
 * 权益（entitlements）：把「订单」翻译成「谁现在可以读哪门课」。
 *
 * 设计要点：
 *   1. 权益从订单派生，不单独记账——订单是唯一事实来源，权益是它的投影；
 *   2. 全站通（all-access）一次购买展开成「四门课 + bundle 自身」，
 *      bundle 那条记录用于新课程上线时批量补授；
 *   3. 撤销只写 revoked_at，不删行（审计 + 重复购买可以复活同一行）；
 *   4. 幂等：同一事件重投、同一订单重复处理，结果都一样。
 *
 * 这里不碰 HTTP、不碰 D1 实现细节，只依赖 store 的三个方法
 * （grantEntitlement / revokeEntitlementsByOrder / hasEntitlement），
 * 因此可以在 node --test 里用内存替身跑完整逻辑。
 */

import { allAccessCourses, isAllAccessPurchase } from "./config.js";

/** bundle 自身的课程 slug（content/courses/all-access.json） */
export const ALL_ACCESS_SLUG = "all-access";

/**
 * 邮箱规范化：小写 + 去空格。
 * 必须和 Stripe 侧大小写无关地匹配——同一人两次付款可能一次是 Buyer@x.com、
 * 一次是 buyer@x.com，不统一就会变成两条权益、两套阅读记录。
 */
export function normalizeEmail(value) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

/**
 * 一次购买应该写入哪些 course_slug。
 * @returns {string[]} 单课 → [courseSlug]；全站通 → 四门课 + 'all-access'
 */
export function resolveEntitlementTargets({ courseSlug, planId, env = {} } = {}) {
  if (!courseSlug) return [];
  if (!isAllAccessPurchase(courseSlug, planId)) return [courseSlug];
  return [...new Set([...allAccessCourses(env), ALL_ACCESS_SLUG])];
}

/**
 * 给订单写入权益（幂等）。
 * 只依赖邮箱 + 课程：与「交付物链接是否配置」无关——文章版正文的交付入口
 * 是成员站，不该因为没配 COURSE_DELIVERY 就让买家失去已付费的阅读权。
 */
export async function grantEntitlements({
  store,
  order,
  env = {},
  logger = console,
  now = () => new Date(),
}) {
  const email = normalizeEmail(order?.email);
  if (!email) {
    logger.warn(`[entitlements] 订单 ${order?.id ?? "?"} 没有可用邮箱，跳过授权`);
    return { granted: [], skipped: "missing_email" };
  }

  const courseSlug = order?.course_slug ?? order?.courseSlug ?? "";
  const planId = order?.plan_id ?? order?.planId ?? "";
  const targets = resolveEntitlementTargets({ courseSlug, planId, env });
  if (targets.length === 0) {
    logger.warn(`[entitlements] 订单 ${order?.id ?? "?"} 识别不出课程，跳过授权`);
    return { granted: [], skipped: "unresolved_course" };
  }

  const grantedAt = new Date(now()).toISOString();
  const granted = [];

  for (const target of targets) {
    await store.grantEntitlement({
      id: crypto.randomUUID(),
      email,
      courseSlug: target,
      planId,
      orderId: order.id,
      grantedAt,
    });
    granted.push(target);
  }

  return { granted };
}

/** 回收某订单名下的全部权益（全额退款 / 可选的拒付） */
export async function revokeEntitlements({ store, order, now = () => new Date() }) {
  const revokedAt = new Date(now()).toISOString();
  const revoked = await store.revokeEntitlementsByOrder(order.id, revokedAt);
  return { revoked, revokedAt };
}

/** 门禁查询：该邮箱现在能否读这门课（P2.2 的 gate 用同一函数） */
export async function hasCourseAccess({ store, email, courseSlug }) {
  const normalized = normalizeEmail(email);
  if (!normalized || !courseSlug) return false;
  return store.hasEntitlement(normalized, courseSlug);
}
