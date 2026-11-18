import { type Metadata } from "next";
import { CourseCatalog } from "@/components/courses/course-catalog";

export const metadata: Metadata = {
  title: "出海实战课程：AI 编程、独立开发、跨境电商与全球增长",
  description:
    "面向程序员的出海实战课程：AI 编程工作流、独立开发者 SaaS 上线、跨境电商独立站与多语言 SEO。模板仓库、检查清单、真实项目演练，Stripe 安全收款。",
  alternates: {
    canonical: "/zh/courses",
    languages: {
      "zh-CN": "/zh/courses",
      en: "/en/courses",
    },
  },
  openGraph: {
    title: "出海实战课程 | OpenCode 中文指南",
    description:
      "AI 编程、独立开发、跨境电商与出海 SEO 四门实战课，覆盖从写代码到收款的完整路径。",
    url: "/zh/courses",
    type: "website",
    locale: "zh_CN",
  },
};

export default function CoursesPage() {
  return <CourseCatalog locale="zh" />;
}
