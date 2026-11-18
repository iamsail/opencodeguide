import { type Metadata } from "next";
import { CourseThankYou } from "@/components/courses/course-thank-you";

export const metadata: Metadata = {
  title: "付款成功",
  description: "课程购买已确认，这里是开始学习的指引。",
  robots: { index: false, follow: false },
  alternates: {
    canonical: "/zh/courses/thank-you",
    languages: {
      "zh-CN": "/zh/courses/thank-you",
      en: "/en/courses/thank-you",
    },
  },
};

export default function ThankYouPage() {
  return <CourseThankYou locale="zh" />;
}
