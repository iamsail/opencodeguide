import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GoogleAnalytics } from "@/components/google-analytics";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "OpenCode Guide - The Unofficial Manual",
    template: "%s | OpenCode Guide",
  },
  description: "Community-driven documentation for OpenCode. Tutorials, comparisons, and best practices for developers.",
  metadataBase: new URL('https://opencodeguide.com'),
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} min-h-screen bg-white text-gray-900 antialiased`}>
        <SiteHeader />
        <div className="flex min-h-screen flex-col">
          <main className="flex-1">{children}</main>
        </div>
        <SiteFooter />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}
