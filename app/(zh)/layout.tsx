import type { Metadata } from "next";
import "../globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GoogleAnalytics } from "@/components/google-analytics";
import { GoogleAdsense } from "@/components/google-adsense";
import Script from "next/script";

import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: {
    default: "OpenCode 使用指南 (非官方)",
    template: "%s | OpenCode 中文指南",
  },
  description: "OpenCode 非官方中文社区指南。提供安装教程、本地模型部署、Claude Code 对比等深度内容。",
  metadataBase: new URL('https://opencodeguide.com'),
  alternates: {
    canonical: '/zh',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" suppressHydrationWarning>
      {/* Fallback sans-serif for Chinese */}
      <body
        className={`min-h-screen bg-white text-gray-900 antialiased font-sans dark:bg-gray-950 dark:text-gray-50`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Script id="clear-stale-cache-zh" strategy="beforeInteractive">
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
          <SiteHeader lang="zh" />
          <div className="flex min-h-screen flex-col">
            <main className="flex-1">{children}</main>
          </div>
          <SiteFooter lang="zh" />
          {process.env.NEXT_PUBLIC_GA_ID && (
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
          )}
          <GoogleAdsense pId="1345496474366685" />
        </ThemeProvider>
      </body>
    </html>
  );
}
