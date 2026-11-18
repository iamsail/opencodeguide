import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "Refund policy for OpenCode Guide courses: 7-day no-questions refunds, pre-order terms, how to request and processing times.",
  alternates: {
    canonical: "/refund-policy",
    languages: {
      en: "/refund-policy",
      "zh-CN": "/zh/refund-policy",
    },
  },
};

export default function RefundPolicyPage() {
  return (
    <div className="container mx-auto max-w-3xl py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-50">Refund Policy</h1>

      <div className="prose prose-gray dark:prose-invert max-w-none">
        <p className="lead">Last updated: November 18, 2026</p>

        <p>
          We want you to buy with confidence. Every course comes with a 7-day, no-questions refund
          window. This page explains the details, including how pre-orders work.
        </p>

        <h2>1. Standard courses</h2>
        <p>
          You can request a full refund within <strong>7 days of purchase</strong>, for any reason.
          Simply email us from the address used at checkout with your order details. No form, no
          interview.
        </p>

        <h2>2. Pre-order courses</h2>
        <p>
          For courses sold before release, the 7-day window starts on the <strong>official launch
          day</strong>, not the pre-order date. If the launch is delayed by more than 30 days beyond
          the date shown on the course page, you can cancel for a full refund at any time.
        </p>

        <h2>3. Bundle (All-Access)</h2>
        <p>
          All-Access follows the same 7-day window. If you refund a bundle, access to every included
          course is revoked. If you already purchased a single course and upgraded, the refund covers
          the amount actually paid for the upgrade.
        </p>

        <h2>4. One-to-one sessions</h2>
        <p>
          Pro plans that include a 1:1 review can be refunded in full as long as the session has not
          been used. Once a session has taken place, the session value is non-refundable and only the
          remaining course value is refunded.
        </p>

        <h2>5. How to request a refund</h2>
        <ol>
          <li>
            Email us via the <Link href="/contact">contact page</Link> from the address used at
            checkout.
          </li>
          <li>Include your order email and, if you have it, the Stripe receipt number.</li>
          <li>We confirm within 1 business day and issue the refund in Stripe.</li>
          <li>
            Funds typically return within 5-10 business days depending on your bank or card issuer.
            Currency conversion differences and card fees charged by your bank are outside our
            control.
          </li>
        </ol>

        <h2>6. After the refund window</h2>
        <p>
          We do not offer refunds after 7 days, but we do want you to get value. If something is
          broken or a course does not cover what it promises, contact us and we will fix the content
          or find another solution.
        </p>

        <h2>7. Chargebacks</h2>
        <p>
          Please contact us before filing a chargeback — we can almost always resolve the issue
          faster. Fraudulent chargebacks may result in loss of access to purchased courses.
        </p>

        <h2>8. Contact</h2>
        <p>
          Questions about this policy? <Link href="/contact">Contact us</Link> and we usually reply
          within one business day.
        </p>
      </div>
    </div>
  );
}
