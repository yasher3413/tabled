import Link from "next/link"
import { cn } from "@/lib/utils"

/** An honest empty state with one helpful next action. */
export function EmptyState({
  title,
  children,
  action,
  className,
}: {
  title: string
  children?: React.ReactNode
  action?: { href: string; label: string } | React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("border-y border-dashed border-rule py-10 text-center", className)}>
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-[44ch] text-[0.9375rem] text-ink-2">{children}</div>}
      {action && (
        <div className="mt-4">
          {typeof action === "object" && action !== null && "href" in action ? (
            <Link className="link text-[0.9375rem]" href={action.href}>
              {action.label}
            </Link>
          ) : (
            action
          )}
        </div>
      )}
    </div>
  )
}

export function Unavailable({ children }: { children: React.ReactNode }) {
  return <span className="text-ink-3 italic">{children}</span>
}
