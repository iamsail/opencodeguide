import { type Metadata } from "next";
import { CourseThankYou } from "@/components/courses/course-thank-you";

export const metadata: Metadata = {
  title: "Payment received",
  description: "Your course purchase is confirmed. Here is how to get started.",
  robots: { index: false, follow: false },
  alternates: {
    canonical: "/en/courses/thank-you",
    languages: {
      en: "/en/courses/thank-you",
      "zh-CN": "/zh/courses/thank-you",
    },
  },
};

export default function ThankYouPage() {
  return <CourseThankYou locale="en" />;
}
