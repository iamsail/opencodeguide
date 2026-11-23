import type { Locale } from "@/lib/courses";

/**
 * 课程板块的界面文案（与课程内容分离，便于统一校对与后续接入 i18n 系统）。
 */
export const COURSE_COPY = {
  zh: {
    navLabel: "课程",
    breadcrumbHome: "首页",
    breadcrumbCourses: "课程",
    catalog: {
      eyebrow: "OPENGUIDE COURSES",
      title: "课程",
      lead: "面向出海开发者的实战课程：把 AI 编程、独立开发、跨境电商与全球增长，拆成可以照着做的步骤。",
      subLead:
        "每门课都配有模板仓库、检查清单与真实项目演练。一次购买，永久观看，内容持续更新。",
      stats: [
        { value: "4", label: "门实战课程" },
        { value: "123", label: "节图文课" },
        { value: "18", label: "小时阅读量" },
        { value: "永久", label: "观看与更新" },
      ],
      tracksTitle: "四条学习路线",
      tracksLead: "按你的阶段选课，也可以直接拿下全站通。",
      coursesTitle: "全部课程",
      pathTitle: "推荐学习路径",
      pathLead: "从「更快的开发效率」到「可持续的获客」，按顺序推进收益最大。",
      pathSteps: [
        {
          step: "01",
          title: "先把开发效率拉满",
          detail: "用 AI 编程工作流把日常开发提速，腾出做产品的时间。",
          href: "/zh/courses/ai-coding-workflow",
        },
        {
          step: "02",
          title: "做出能收款的产品",
          detail: "用最小架构把想法上线，接上 Stripe 订阅与真实付费用户。",
          href: "/zh/courses/indie-saas-launch",
        },
        {
          step: "03",
          title: "让搜索带来客户",
          detail: "多语言站点与技术 SEO，把一次性流量变成复利。",
          href: "/zh/courses/global-site-seo",
        },
        {
          step: "04",
          title: "做重交付的生意",
          detail: "跨境电商独立站：支付、物流、合规与广告的一体化打法。",
          href: "/zh/courses/cross-border-store",
        },
      ],
    },
    card: {
      lessons: "节课",
      hours: "小时",
      updated: "更新于",
      viewCourse: "查看课程",
      from: "起",
      preorder: "预售",
      bundleIncludes: "包含 4 门课程",
    },
    detail: {
      back: "全部课程",
      outcomesTitle: "学完你能做到",
      audienceTitle: "适合谁",
      curriculumTitle: "课程大纲",
      curriculumLead: "共 {lessonCount} 节课，按模块循序推进；购买后可永久回看。",
      deliverablesTitle: "交付物",
      instructorTitle: "讲师",
      faqTitle: "常见问题",
      pricingTitle: "选择版本",
      pricingLead: "两个版本内容相同，Pro 版额外提供模板仓库、答疑与 1:1 诊断。",
      loginNote: "购买前需用 Google 账号登录，课程权限绑定该账号邮箱。",
      guaranteeFallback: "7 天无理由退款。",
      paymentTitle: "支付方式",
      paymentMethods:
        "Visa · Mastercard · Amex · Apple Pay · Google Pay · 支付宝 / 微信支付（以 Stripe 结账页实际可用为准）",
      paymentNote: "以美元结算，由 Stripe 安全处理支付；本站不接触你的卡号。",
      secureNote: "支付由 Stripe 托管，支持 3D Secure 验证。",
      bundleTitle: "想一次学完？",
      bundleLead: "全站通包含以上全部课程，比单课分别购买更省。",
      bundleCta: "查看全站通",
      waitlistTitle: "开售提醒",
      waitlistTitleLive: "购买通道即将开放",
      waitlistLead: "这门课正在制作中，留下邮箱，上线时第一时间通知你，并享受早鸟价。",
      waitlistLeadLive: "支付通道正在接入，留下邮箱，开放购买时第一时间通知你。",
      releaseDate: "预计上线",
      planIncludes: "包含内容",
      buyNow: "立即购买",
      preorderNow: "早鸟预售",
      notifyMe: "开售提醒",
      contactUs: "联系我们",
      lessonsCount: "{count} 节课",
      hoursCount: "{hours} 小时",
      levelLabel: "难度",
      updatedLabel: "最近更新",
      lastUpdated: "最近更新",
      statusLive: "已上线",
      statusPreorder: "预售中",
      statusSoon: "制作中",
      moreCourses: "继续看看其他课程",
      sampleNote: "所有课程均含中文与英文资料混排，代码与命令保持原样。",
    },
    thankYou: {
      title: "付款成功，欢迎加入！",
      lead: "你的订单已由 Stripe 处理。下面三步可以让你在 10 分钟内开始学习。",
      steps: [
        {
          title: "查收开通邮件",
          detail:
            "Stripe 会发送付款收据，我们随后发送观看链接与资料包。若 10 分钟内没收到，请检查垃圾邮件。",
        },
        {
          title: "加入课程社群",
          detail: "邮件中会附带社群邀请链接（Discord / 微信群），用于答疑与作业点评。",
        },
        {
          title: "从第一模块开始",
          detail: "建议先看课程导学与模块 1，再按模块顺序推进；遇到问题直接到社群提问。",
        },
      ],
      purchaseTitle: "你的订单",
      purchaseCourse: "课程",
      purchasePlan: "版本",
      missingOrder: "如果你从 Stripe 直接打开本页，订单信息会显示在付款邮件中。",
      helpTitle: "需要帮助？",
      helpLead: "付款、发票、退款或观看权限问题，都可以直接联系我们，通常 1 个工作日内回复。",
      contactCta: "联系我们",
      browseCta: "继续浏览课程",
      refundNote: "所有课程支持 7 天无理由退款，详见退款政策。",
      notFound: "没有找到对应的课程信息。",
    },
    faq: [
      {
        q: "课程是视频还是图文？",
        a: "全部为图文文章，可永久回看；每节 8–12 分钟读完，Pro 版本另含模板仓库、社群与 1:1 诊断。",
      },
      {
        q: "购买后可以退款吗？",
        a: "支持 7 天无理由退款。预售课程从正式上线日开始计算 7 天。",
      },
      {
        q: "支付方式有哪些？",
        a: "由 Stripe 处理支付，支持主流信用卡、Apple Pay / Google Pay；部分账户支持支付宝与微信支付，具体以结账页为准。",
      },
      {
        q: "课程内容会更新吗？",
        a: "会。工具与 API 变更会同步到课件与模板仓库，已购用户免费获取更新。",
      },
      {
        q: "可以开票或团队采购吗？",
        a: "可以。请在联系页面提交订单邮箱与公司信息，我们会提供收据或团队方案。",
      },
    ],
    cta: {
      title: "不确定从哪门开始？",
      lead: "先看免费文档，再决定要不要系统学习。我们的文档站本身就是课程素材来源。",
      docs: "阅读文档",
      contact: "咨询课程",
    },
  },
  en: {
    navLabel: "Courses",
    breadcrumbHome: "Home",
    breadcrumbCourses: "Courses",
    catalog: {
      eyebrow: "OPENGUIDE COURSES",
      title: "Courses",
      lead: "Practical courses for developers going global: AI coding, indie SaaS, cross-border commerce and search growth, broken into steps you can follow.",
      subLead:
        "Every course ships with template repos, checklists and real project walkthroughs. Buy once, watch forever, updates included.",
      stats: [
        { value: "4", label: "practical courses" },
        { value: "123", label: "article lessons" },
        { value: "18", label: "hours of reading" },
        { value: "Lifetime", label: "access and updates" },
      ],
      tracksTitle: "Four learning tracks",
      tracksLead: "Pick by stage, or take the bundle.",
      coursesTitle: "All courses",
      pathTitle: "Suggested path",
      pathLead: "Start with leverage, end with durable acquisition.",
      pathSteps: [
        {
          step: "01",
          title: "Maximise development leverage",
          detail: "Use AI coding workflows to ship faster and free up time for product work.",
          href: "/en/courses/ai-coding-workflow",
        },
        {
          step: "02",
          title: "Ship something that charges",
          detail: "Launch with a minimal architecture and real Stripe subscriptions.",
          href: "/en/courses/indie-saas-launch",
        },
        {
          step: "03",
          title: "Let search bring customers",
          detail: "Multilingual sites and technical SEO that compound.",
          href: "/en/courses/global-site-seo",
        },
        {
          step: "04",
          title: "Operate a heavier business",
          detail: "Cross-border commerce: payments, logistics, compliance and ads.",
          href: "/en/courses/cross-border-store",
        },
      ],
    },
    card: {
      lessons: "lessons",
      hours: "hours",
      updated: "Updated",
      viewCourse: "View course",
      from: "from",
      preorder: "Pre-order",
      bundleIncludes: "Includes all four courses",
    },
    detail: {
      back: "All courses",
      outcomesTitle: "What you will be able to do",
      audienceTitle: "Who it is for",
      curriculumTitle: "Curriculum",
      curriculumLead: "{lessonCount} lessons across focused modules. Lifetime access after purchase.",
      deliverablesTitle: "What you get",
      instructorTitle: "Instructor",
      faqTitle: "FAQ",
      pricingTitle: "Choose your plan",
      pricingLead: "Same content in both plans; Pro adds the private repo, support and 1:1 review.",
      loginNote: "Sign in with Google before checkout — access is tied to that account's email.",
      guaranteeFallback: "7-day no-questions refund.",
      paymentTitle: "Payment",
      paymentMethods:
        "Visa · Mastercard · Amex · Apple Pay · Google Pay · Alipay / WeChat Pay where available in Stripe Checkout",
      paymentNote: "Charged in USD and processed by Stripe. We never see your card details.",
      secureNote: "Hosted by Stripe with 3D Secure support.",
      bundleTitle: "Want everything?",
      bundleLead: "All-Access includes every course above for less than buying them separately.",
      bundleCta: "See All-Access",
      waitlistTitle: "Launch list",
      waitlistTitleLive: "Checkout opening soon",
      waitlistLead:
        "This course is in production. Leave your email to get notified at launch and lock in early-bird pricing.",
      waitlistLeadLive: "Checkout is being connected. Leave your email and we will let you know the moment it opens.",
      releaseDate: "Expected",
      planIncludes: "Includes",
      buyNow: "Buy now",
      preorderNow: "Pre-order",
      notifyMe: "Notify me",
      contactUs: "Contact us",
      lessonsCount: "{count} lessons",
      hoursCount: "{hours} hours",
      levelLabel: "Level",
      updatedLabel: "Updated",
      lastUpdated: "Last updated",
      statusLive: "Available now",
      statusPreorder: "Pre-order",
      statusSoon: "In production",
      moreCourses: "Browse other courses",
      sampleNote: "Courses mix Chinese and English material; code and commands stay as-is.",
    },
    thankYou: {
      title: "Payment received — welcome aboard!",
      lead: "Stripe has processed your order. Three steps to start learning within 10 minutes.",
      steps: [
        {
          title: "Check your inbox",
          detail:
            "Stripe sends the receipt; we follow up with your access link and resource pack. If it is missing after 10 minutes, check spam.",
        },
        {
          title: "Join the community",
          detail: "The email includes an invite to our Discord / WeChat group for questions and reviews.",
        },
        {
          title: "Start with module 1",
          detail:
            "Watch the orientation and module 1, then work through the modules in order. Ask in the community any time.",
        },
      ],
      purchaseTitle: "Your order",
      purchaseCourse: "Course",
      purchasePlan: "Plan",
      missingOrder:
        "If you opened this page directly from Stripe, your order details are in the receipt email.",
      helpTitle: "Need help?",
      helpLead:
        "Payment, invoice, refund or access issues — contact us and we usually reply within one business day.",
      contactCta: "Contact us",
      browseCta: "Browse courses",
      refundNote: "Every course has a 7-day no-questions refund, see the refund policy.",
      notFound: "We could not match that course.",
    },
    faq: [
      {
        q: "Video or article format?",
        a: "Article-based with lifetime access. Each lesson is an 8–12 minute read; Pro plans add the template repo, community and 1:1 reviews.",
      },
      {
        q: "Can I get a refund?",
        a: "Yes, within 7 days, no questions asked. For pre-orders the 7 days start at launch.",
      },
      {
        q: "Which payment methods?",
        a: "Payments run through Stripe: major cards, Apple Pay and Google Pay, plus Alipay / WeChat Pay where your Stripe account supports them.",
      },
      {
        q: "Will content stay current?",
        a: "Yes. Tool and API changes are synced into courseware and template repos; buyers get updates free.",
      },
      {
        q: "Invoices or team licences?",
        a: "Contact us with your order email and company details for receipts or team pricing.",
      },
    ],
    cta: {
      title: "Not sure where to start?",
      lead: "Read the free documentation first, then decide whether to go deeper. The docs site is where the course material comes from.",
      docs: "Read the docs",
      contact: "Ask about courses",
    },
  },
};

export type CourseCopy = (typeof COURSE_COPY)[Locale];

export function getCourseCopy(locale: Locale): CourseCopy {
  return COURSE_COPY[locale];
}

export function fillTemplate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in values ? String(values[key]) : `{${key}}`,
  );
}
