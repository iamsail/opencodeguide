import type { Metadata } from "next";
import "../globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GoogleAnalytics } from "@/components/google-analytics";
import { GoogleAdsense } from "@/components/google-adsense";
import { Analytics } from "@vercel/analytics/react";

import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: {
    default: "OpenCode 가이드 (비공식) | OpenCode Guide",
    template: "%s | OpenCode 한국어 가이드",
  },
  description: "OpenCode 비공식 한국어 커뮤니티 가이드. 설치 방법, 로컬 모델 배포, Claude Code 비교 등 심층적인 내용을 제공합니다.",
  metadataBase: new URL('https://opencodeguide.com'),
  alternates: {
    canonical: '/ko',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
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
          <SiteHeader lang="ko" />
          <div className="flex min-h-screen flex-col">
            <main className="flex-1">{children}</main>
          </div>
          <SiteFooter lang="ko" />
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
