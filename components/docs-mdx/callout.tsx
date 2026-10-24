import * as React from "react"
import { Info, Lightbulb, TriangleAlert } from "lucide-react"

type CalloutType = "note" | "warning" | "tip"

const styles: Record<
  CalloutType,
  { container: string; icon: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  note: {
    container:
      "my-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/40",
    icon: "text-blue-600 dark:text-blue-400",
    Icon: Info,
  },
  warning: {
    container:
      "my-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40",
    icon: "text-amber-600 dark:text-amber-400",
    Icon: TriangleAlert,
  },
  tip: {
    container:
      "my-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40",
    icon: "text-emerald-600 dark:text-emerald-400",
    Icon: Lightbulb,
  },
}

export function Callout({
  type = "note",
  children,
}: {
  type?: CalloutType
  children: React.ReactNode
}) {
  const { container, icon, Icon } = styles[type] ?? styles.note

  return (
    <div className={container}>
      <div className="flex gap-3">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${icon}`} />
        <div className="leading-7 [&:not(:first-child)]:mt-4 text-gray-700 dark:text-gray-300 [&_p]:mt-0 [&_p+_*]:mt-4">
          {children}
        </div>
      </div>
    </div>
  )
}
