import type { Metadata } from "next";
import Link from "next/link";
import { Github, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact the OpenCode Guide team for support, feedback, or inquiries.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return (
    <div className="container mx-auto max-w-3xl py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-50">Contact Us</h1>
      
      <div className="prose prose-gray dark:prose-invert max-w-none mb-12">
        <p>
          We appreciate your interest in OpenCode Guide. Whether you have a question about the documentation, found a bug, or just want to say hello, here is how you can reach us.
        </p>
      </div>

      <div className="flex justify-center">
        {/* Email Card */}
        <div className="w-full max-w-md p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-3 mb-3">
                <Mail className="h-6 w-6" />
                <h3 className="text-xl font-semibold m-0">Email</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
                For general inquiries, suggestions, or feedback.
            </p>
            <a 
                href="mailto:hackerai465@gmail.com" 
                className="text-primary hover:underline font-medium"
            >
                hackerai465@gmail.com &rarr;
            </a>
        </div>
      </div>
    </div>
  );
}
