import { SITE_URL, getCourseContent, type Course, type Locale } from "@/lib/courses";

/**
 * Course 结构化数据（schema.org）。静态导出时随 HTML 一起产出，
 * 有助于 Google 展示课程富媒体结果。
 */
export function CourseJsonLd({
  course,
  locale,
  url,
}: {
  course: Course;
  locale: Locale;
  url: string;
}) {
  const content = getCourseContent(course, locale);
  const absoluteUrl = `${SITE_URL}${url}`;
  const availability =
    course.status === "preorder"
      ? "https://schema.org/PreOrder"
      : course.status === "coming-soon"
        ? "https://schema.org/PreOrder"
        : "https://schema.org/InStock";

  const data = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: content.title,
    description: content.seo.description,
    url: absoluteUrl,
    inLanguage: locale === "zh" ? "zh-CN" : "en",
    provider: {
      "@type": "Organization",
      name: "OpenCode Guide",
      sameAs: SITE_URL,
    },
    offers: course.plans.map((plan) => ({
      "@type": "Offer",
      name: plan.id,
      price: plan.priceUSD,
      priceCurrency: "USD",
      category: "Paid",
      availability,
      url: absoluteUrl,
    })),
    hasCourseInstance: [
      {
        "@type": "CourseInstance",
        courseMode: "online",
        courseWorkload: `PT${course.durationHours}H`,
        name: content.title,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // JSON.stringify 后再转义 <，避免被 MDX/HTML 解析器截断
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
