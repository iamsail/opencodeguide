/**
 * 课时页的结构化数据。
 *
 * 用 TechArticle 而不是 Course：一个课时是一篇文章，课程本身在详情页
 * 已经有 Course JSON-LD，这里通过 isPartOf 指回去，避免同一页面出现两个 Course。
 */
export function LessonJsonLd({
  title,
  description,
  url,
  locale,
  courseTitle,
  courseUrl,
  durationMinutes,
}: {
  title: string;
  description: string;
  url: string;
  locale: "zh" | "en";
  courseTitle: string;
  courseUrl: string;
  durationMinutes: number;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: title,
    description,
    url,
    inLanguage: locale === "zh" ? "zh-CN" : "en",
    timeRequired: `PT${Math.max(1, durationMinutes)}M`,
    isPartOf: {
      "@type": "Course",
      name: courseTitle,
      url: courseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "OpenCode Guide",
      url: "https://opencodeguide.com",
    },
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
