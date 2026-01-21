import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us",
  description: "About OpenCode Guide - An independent, community-driven documentation project.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-3xl py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-50">About Us</h1>
      
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <p className="text-xl text-gray-600 dark:text-gray-400">
          OpenCode Guide is an independent, community-driven resource dedicated to helping developers master OpenCode, the offline-first coding agent framework.
        </p>

        <h2>Our Mission</h2>
        <p>
          While OpenCode is a powerful tool, navigating the ecosystem of local models, MCP servers, and different editor integrations can be challenging. Our mission is to provide:
        </p>
        <ul>
          <li><strong>Clear, impartial documentation</strong> for beginners and power users.</li>
          <li><strong>Real-world examples</strong> of how to use OpenCode in production workflows.</li>
          <li><strong>Curated resources</strong> for the Model Context Protocol (MCP).</li>
        </ul>

        <h2>Unofficial Status</h2>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 my-6">
          <p className="m-0 text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Disclaimer:</strong> This website is an unofficial community project. We are not affiliated with, endorsed by, or sponsored by the official OpenCode team or its creators. All trademarks belong to their respective owners.
          </p>
        </div>

        <h2>Open Source</h2>
        <p>
          This guide is an independent community project. The documentation is maintained by contributors who are passionate about local AI development.
        </p>
        <p>
           If you find an error or want to improve a guide, please feel free to <Link href="/contact">contact us</Link>.
        </p>
      </div>
    </div>
  );
}
