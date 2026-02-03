import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GoogleAnalytics } from "@/components/google-analytics";
import { GoogleAdsense } from "@/components/google-adsense";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";

import { ThemeProvider } from "@/components/theme-provider";

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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} min-h-screen bg-white text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-50`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Script id="clear-stale-cache" strategy="beforeInteractive">
            {`
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for(let registration of registrations) {
                    registration.unregister();
                  }
                });
              }
            `}
          </Script>
          <SiteHeader lang="en" />
          <div className="flex min-h-screen flex-col">
            <main className="flex-1">{children}</main>
          </div>
          <SiteFooter lang="en" />
          {process.env.NEXT_PUBLIC_GA_ID && (
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
          )}
          <GoogleAdsense pId="1345496474366685" />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
