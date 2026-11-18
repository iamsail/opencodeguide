import localFont from "next/font/local";

/**
 * 站点正文字体：Inter（可变字重 100–900，latin 子集）。
 *
 * 为什么自托管而不是 `next/font/google`：
 * 构建期从 fonts.gstatic.com 下载字体，在弱网/VPN 环境下会 3 秒超时，
 * 直接把 `next build` 或 `next dev` 打挂（表现为
 * "Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'"）。
 * 把 woff2 提交进仓库后，构建完全离线、结果确定。
 *
 * 换字体时：替换 app/fonts/inter-latin-var.woff2 即可，无需改代码。
 * 注意拉丁字体不含中文字形，中文仍由系统字体（PingFang SC / 微软雅黑）兜底。
 */
export const inter = localFont({
  src: "./fonts/inter-latin-var.woff2",
  weight: "100 900",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "PingFang SC", "Microsoft YaHei", "sans-serif"],
});
