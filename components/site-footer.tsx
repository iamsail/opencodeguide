import Link from "next/link";

interface SiteFooterProps {
  lang?: "en" | "zh" | "ko";
}

export function SiteFooter({ lang = "en" }: SiteFooterProps) {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 py-8 md:px-8">
      <div className="container mx-auto max-w-screen-xl px-4 flex flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex flex-col gap-2 text-sm text-gray-500">
          {lang === "en" ? (
            <p className="max-w-md">
              <strong>OpenCode Guide</strong> is an independent, community-driven resource and is not affiliated with or endorsed by the official OpenCode project.
            </p>
          ) : lang === "ko" ? (
            <p className="max-w-md">
              <strong>OpenCode 가이드</strong>는 독립적인 커뮤니티 리소스이며 OpenCode 공식 프로젝트와 관련이 없으며 권장되지 않습니다.
            </p>
          ) : (
            <p className="max-w-md">
              本站为非官方 OpenCode 使用指南，与 OpenCode 官方项目不存在隶属或授权关系。
            </p>
          )}
        </div>
        
        <div className="flex flex-col items-center md:items-end gap-2">
          <nav className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
            {lang === "en" ? (
              <>
                <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
                <Link href="/about" className="hover:underline">About Us</Link>
                <Link href="/contact" className="hover:underline">Contact</Link>
              </>
            ) : lang === "ko" ? (
              <>
                <Link href="/privacy" className="hover:underline">개인정보처리방침</Link>
                <Link href="/about" className="hover:underline">소개</Link>
                <Link href="/contact" className="hover:underline">문의하기</Link>
              </>
            ) : (
              <>
                <Link href="/privacy" className="hover:underline">隐私政策</Link>
                <Link href="/about" className="hover:underline">关于我们</Link>
                <Link href="/contact" className="hover:underline">联系我们</Link>
              </>
            )}
          </nav>
          <div className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} OpenCode Guide
          </div>
        </div>
      </div>
    </footer>
  );
}
