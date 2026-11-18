import { type Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCourse,
  getCourseContent,
  getCourseSlugs,
} from "@/lib/courses";
import { CourseDetail } from "@/components/courses/course-detail";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return getCourseSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = getCourse(slug);
  if (!course) return { title: "Course not found" };

  const content = getCourseContent(course, "en");
  return {
    title: content.seo.title,
    description: content.seo.description,
    alternates: {
      canonical: `/en/courses/${slug}`,
      languages: {
        en: `/en/courses/${slug}`,
        "zh-CN": `/zh/courses/${slug}`,
      },
    },
    openGraph: {
      title: content.seo.title,
      description: content.seo.description,
      url: `/en/courses/${slug}`,
      type: "website",
    },
  };
}

export default async function CoursePage({ params }: PageProps) {
  const { slug } = await params;
  const course = getCourse(slug);
  if (!course) notFound();

  return <CourseDetail course={course} locale="en" />;
}
