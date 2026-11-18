import fs from "fs";
import path from "path";

/**
 * 课程板块数据层
 * ------------------------------------------------------------
 * 数据源：content/courses/*.json（一门课程一个文件，便于运营维护）
 * 支付链接：content/courses/stripe-links.json（由 scripts/courses/stripe-payment-links.mjs 生成）
 *
 * 注意：本模块使用 fs，只能在 Server Component / generateStaticParams /
 * 构建期脚本中引用。客户端组件请通过 props 接收数据。
 */

export const LOCALES = ["zh", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export type CourseStatus = "live" | "preorder" | "coming-soon";
export type CourseKind = "course" | "bundle";
export type CourseLevel = "beginner" | "intermediate" | "advanced" | "mixed";

const COURSE_DIR = path.join(process.cwd(), "content/courses");
const LINKS_FILE = path.join(COURSE_DIR, "stripe-links.json");

export interface CoursePlan {
  /** 计划 id，与 Stripe Payment Link 一一对应，例如 single / pro */
  id: string;
  priceUSD: number;
  /** 展示用的参考人民币价格（实际以美元结算） */
  priceCNYRef?: number;
  compareAtUSD?: number;
  badge?: { zh: string; en: string };
  features: { zh: string[]; en: string[] };
}

export interface CourseModule {
  title: string;
  summary?: string;
  lessons: string[];
  /** 免费试听 / 可公开预览的章节 */
  free?: boolean;
}

export interface CourseLocaleContent {
  title: string;
  subtitle: string;
  tagline: string;
  audience: string[];
  outcomes: string[];
  deliverables: string[];
  modules: CourseModule[];
  faq: { q: string; a: string }[];
  seo: { title: string; description: string };
  instructor?: { name: string; role: string; bio: string };
  guarantee?: string;
}

export interface Course {
  slug: string;
  kind: CourseKind;
  track: string;
  level: CourseLevel;
  status: CourseStatus;
  /** lucide-react 图标名，见 components/courses/course-visuals.tsx */
  icon: string;
  /** tailwind 渐变色，购课卡片封面使用 */
  accent: string;
  durationHours: number;
  lessonCount: number;
  lastUpdated: string;
  /** 预计上线时间（预售课程） */
  releaseDate?: string;
  plans: CoursePlan[];
  locales: Record<Locale, CourseLocaleContent>;
}

interface StripeLinksFile {
  generatedAt?: string;
  mode?: "test" | "live";
  plans?: Record<string, string>;
}

function readJson<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return null;
  }
}

let cachedCourses: Course[] | null = null;

/** 读取并排序全部课程；bundle 永远排在最后 */
export function getCourses(): Course[] {
  if (cachedCourses) return cachedCourses;

  if (!fs.existsSync(COURSE_DIR)) {
    cachedCourses = [];
    return cachedCourses;
  }

  const files = fs
    .readdirSync(COURSE_DIR)
    .filter((file) => file.endsWith(".json") && file !== "stripe-links.json");

  const courses = files
    .map((file) => readJson<Course>(path.join(COURSE_DIR, file)))
    .filter((course): course is Course => Boolean(course?.slug));

  courses.sort((a, b) => {
    if (a.kind === "bundle") return 1;
    if (b.kind === "bundle") return -1;
    return a.slug.localeCompare(b.slug);
  });

  cachedCourses = courses;
  return courses;
}

export function getCourse(slug: string): Course | null {
  return getCourses().find((course) => course.slug === slug) ?? null;
}

/** 所有详情页 slug（含 bundle），用于 generateStaticParams 与 sitemap */
export function getCourseSlugs(): string[] {
  return getCourses().map((course) => course.slug);
}

export function getBundle(): Course | null {
  return getCourses().find((course) => course.kind === "bundle") ?? null;
}

/** 非 bundle 的课程 */
export function getTrackCourses(): Course[] {
  return getCourses().filter((course) => course.kind !== "bundle");
}

export function getCourseContent(course: Course, locale: Locale): CourseLocaleContent {
  return course.locales[locale] ?? course.locales.zh;
}

export function getPlan(course: Course, planId: string): CoursePlan | null {
  return course.plans.find((plan) => plan.id === planId) ?? null;
}

/* ------------------------------------------------------------------ */
/* Stripe 支付链接                                                     */
/* ------------------------------------------------------------------ */

function readStripeLinks(): StripeLinksFile {
  return readJson<StripeLinksFile>(LINKS_FILE) ?? {};
}

function envKeyFor(slug: string, planId: string): string {
  return `STRIPE_LINK_${slug.replace(/[^a-z0-9]/gi, "_").toUpperCase()}_${planId
    .replace(/[^a-z0-9]/gi, "_")
    .toUpperCase()}`;
}

export interface CheckoutTarget {
  url: string | null;
  /** 链接来源：便于后台排查是配置文件还是环境变量生效 */
  source: "stripe-links.json" | "env" | "none";
}

/**
 * 解析某个课程计划的 Stripe 结账地址。
 * 优先级：环境变量 > stripe-links.json > 未配置（页面会退回等待名单/预售状态）
 */
export function getCheckoutTarget(slug: string, planId: string): CheckoutTarget {
  const envValue = process.env[envKeyFor(slug, planId)];
  if (envValue) return { url: envValue, source: "env" };

  const link = readStripeLinks().plans?.[`${slug}:${planId}`];
  if (link) return { url: link, source: "stripe-links.json" };

  return { url: null, source: "none" };
}

/**
 * 给 Payment Link 追加跟踪参数。Stripe 支持 client_reference_id 与 utm_*，
 * 会出现在 Stripe Dashboard 的付款记录里，便于与 GA4 / 订单表对账。
 */
export function withCheckoutTracking(
  url: string,
  options: { slug: string; planId: string; locale: Locale },
): string {
  try {
    const target = new URL(url);
    target.searchParams.set("client_reference_id", `${options.slug}:${options.planId}`);
    target.searchParams.set("utm_source", "opencodeguide");
    target.searchParams.set("utm_medium", "course_page");
    target.searchParams.set("utm_campaign", options.slug);
    target.searchParams.set("utm_content", `${options.locale}_${options.planId}`);
    return target.toString();
  } catch {
    return url;
  }
}

export function getCheckoutUrl(
  course: Course,
  plan: CoursePlan,
  locale: Locale,
): CheckoutTarget {
  const target = getCheckoutTarget(course.slug, plan.id);
  if (!target.url) return target;
  return {
    source: target.source,
    url: withCheckoutTracking(target.url, {
      slug: course.slug,
      planId: plan.id,
      locale,
    }),
  };
}

/* ------------------------------------------------------------------ */
/* 展示辅助                                                            */
/* ------------------------------------------------------------------ */

/** 计划 id 的显示名称（单课 / Pro / 全站通） */
export const PLAN_LABELS: Record<string, { zh: string; en: string }> = {
  single: { zh: "单课版", en: "Single" },
  pro: { zh: "Pro 版", en: "Pro" },
  "all-access": { zh: "全站通", en: "All-Access" },
};
export function formatUSD(amount: number): string {
  return `$${amount.toLocaleString("en-US")}`;
}

export function formatCNYRef(amount?: number): string | null {
  if (!amount) return null;
  return `≈ ¥${amount.toLocaleString("zh-CN")}`;
}

export const TRACKS: Record<
  string,
  { zh: string; en: string; icon: string; description: { zh: string; en: string } }
> = {
  "ai-coding": {
    zh: "AI 编程",
    en: "AI Coding",
    icon: "Bot",
    description: {
      zh: "把 AI 编码工具变成可复用的工程能力，而不是随缘的自动补全。",
      en: "Turn AI coding tools into repeatable engineering leverage, not autocomplete roulette.",
    },
  },
  indie: {
    zh: "独立开发",
    en: "Indie SaaS",
    icon: "Rocket",
    description: {
      zh: "从选题、开发到上线收款，一个人跑通 SaaS 的全部关键环节。",
      en: "Pick, build, launch and charge for a SaaS as a team of one.",
    },
  },
  ecommerce: {
    zh: "跨境电商",
    en: "Cross-border Commerce",
    icon: "ShoppingBag",
    description: {
      zh: "独立站建站、支付风控、物流合规与增长，一套可执行的出海电商链路。",
      en: "Storefronts, payments, fulfilment, compliance and growth for global commerce.",
    },
  },
  "global-seo": {
    zh: "出海增长",
    en: "Global Growth",
    icon: "Globe2",
    description: {
      zh: "用多语言站点与搜索流量，为出海产品搭建可持续的获客飞轮。",
      en: "Build a durable acquisition flywheel with multilingual sites and search traffic.",
    },
  },
};

export const LEVELS: Record<CourseLevel, { zh: string; en: string }> = {
  beginner: { zh: "入门", en: "Beginner" },
  intermediate: { zh: "进阶", en: "Intermediate" },
  advanced: { zh: "高阶", en: "Advanced" },
  mixed: { zh: "全阶段", en: "All levels" },
};

export const STATUS_LABELS: Record<
  CourseStatus,
  { zh: string; en: string; tone: "live" | "warn" | "muted" }
> = {
  live: { zh: "已上线 · 随时开学", en: "Available now", tone: "live" },
  preorder: { zh: "预售中 · 早鸟价", en: "Pre-order", tone: "warn" },
  "coming-soon": { zh: "制作中", en: "In production", tone: "muted" },
};

export const SITE_URL = "https://opencodeguide.com";

export function coursePath(locale: Locale, slug?: string): string {
  const base = locale === "zh" ? "/zh/courses" : "/en/courses";
  return slug ? `${base}/${slug}` : base;
}
