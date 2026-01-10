interface SiteFooterProps {
  lang?: "en" | "zh";
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
          ) : (
            <p className="max-w-md">
              本站为非官方 OpenCode 使用指南，与 OpenCode 官方项目不存在隶属或授权关系。
            </p>
          )}
        </div>
        <div className="text-sm text-gray-400">
          &copy; {new Date().getFullYear()} OpenCode Guide
        </div>
      </div>
    </footer>
  );
}
