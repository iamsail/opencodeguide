import { type Metadata } from "next";
import { CourseCatalog } from "@/components/courses/course-catalog";

export const metadata: Metadata = {
  title: "Courses for Global Developers",
  description:
    "Practical courses for developers going global: AI coding workflows, indie SaaS launch, cross-border commerce and multilingual SEO. Lifetime access, Stripe checkout.",
  alternates: {
    canonical: "/en/courses",
    languages: {
      en: "/en/courses",
      "zh-CN": "/zh/courses",
    },
  },
  openGraph: {
    title: "Courses for Global Developers | OpenCode Guide",
    description:
      "AI coding, indie SaaS, cross-border commerce and multilingual SEO — practical courses with template repos and real project walkthroughs.",
    url: "/en/courses",
    type: "website",
  },
};

export default function CoursesPage() {
  return <CourseCatalog locale="en" />;
}
