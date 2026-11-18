import type { ComponentType, SVGProps } from "react";
import {
  Bot,
  Rocket,
  ShoppingBag,
  Globe2,
  Layers,
  type LucideProps,
} from "lucide-react";

const ICONS: Record<string, ComponentType<LucideProps>> = {
  Bot,
  Rocket,
  ShoppingBag,
  Globe2,
  Layers,
};

export function CourseIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Layers;
  return <Icon className={className} aria-hidden="true" />;
}

/**
 * 渐变类名需要以完整字面量出现在源码中，Tailwind 才能扫描到。
 * 课程 JSON 里的 accent 字段因此直接存完整类名，并在 tailwind.config.ts
 * 的 content 中包含了 content 目录下的 JSON 文件。
 */
export function accentClass(accent: string): string {
  const allowed = [
    "from-indigo-500 via-violet-500 to-fuchsia-500",
    "from-emerald-500 via-teal-500 to-cyan-500",
    "from-amber-500 via-orange-500 to-rose-500",
    "from-sky-500 via-blue-500 to-indigo-500",
    "from-slate-900 via-slate-800 to-indigo-900",
  ];
  return allowed.includes(accent) ? accent : allowed[0];
}

export function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "live" | "warn" | "muted";
}) {
  const styles = {
    live: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
    warn: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
    muted:
      "border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300",
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide ${styles}`}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}

export function IconBadge({
  icon,
  accent,
  className = "",
}: {
  icon: string;
  accent: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm ${accentClass(
        accent,
      )} ${className}`}
    >
      <CourseIcon name={icon} className="h-5 w-5" />
    </div>
  );
}
