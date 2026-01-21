import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for OpenCode Guide. We respect your privacy and only use standard analytics.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-3xl py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-50">Privacy Policy</h1>
      
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <p className="lead">
          Last updated: January 21, 2026
        </p>

        <p>
          This Privacy Policy describes how OpenCode Guide ("we", "us", or "our") collects, uses, and shares information when you use our website (opencodeguide.com).
        </p>

        <h2>1. Information We Collect</h2>
        <p>
            We do not collect any personal data such as your name, email address, or phone number unless you voluntarily provide it to us (e.g., by contacting us via email).
        </p>

        <h3>Usage Data & Analytics</h3>
        <p>
          We use <strong>Google Analytics</strong> and <strong>Vercel Analytics</strong> to understand how visitors interact with our website. These services may collect:
        </p>
        <ul>
          <li>Your IP address (anonymized where possible)</li>
          <li>Browser type and version</li>
          <li>Pages you visit and time spent on them</li>
          <li>Referring websites</li>
        </ul>
        <p>
            This data is used solely to improve the content and performance of the OpenCode Guide. We do not use this data for advertising profiling or sell it to third parties.
        </p>

        <h2>2. Cookies</h2>
        <p>
          Our website may use cookies to function correctly (e.g., remembering your theme preference) and for the analytics services mentioned above. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
        </p>

        <h2>3. Third-Party Links</h2>
        <p>
          Our Service contains links to other websites (e.g., GitHub, Anthropic, Ollama) that are not operated by us. If you click on a third-party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit.
        </p>

        <h2>4. Changes to This Privacy Policy</h2>
        <p>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date using the current date.
        </p>

        <h2>5. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us at: <br />
          Email: hackerai465@gmail.com
        </p>
      </div>
    </div>
  );
}
