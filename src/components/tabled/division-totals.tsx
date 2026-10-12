import { cn } from "@/lib/utils"

/**
 * Totals set like the foot of a printed division list: each column labelled, a double rule, the figure
 * large beneath it. A thin bar underneath shows the split at a glance.
 */
export function DivisionTotals({
  yeas,
  nays,
  paired,
  absent,
  size = "md",
  className,
}: {
  yeas: number
  nays: number
  paired?: number
  absent?: number
  size?: "md" | "lg"
  className?: string
}) {
  const cols = [
    { label: "Yeas", n: yeas, strong: true },
    { label: "Nays", n: nays, strong: true },
    ...(paired ? [{ label: "Paired", n: paired, strong: false }] : []),
    ...(absent !== undefined ? [{ label: "Did not vote", n: absent, strong: false }] : []),
  ]
  const total = yeas + nays
  return (
    <div className={cn("min-w-0", className)}>
      <dl className="flex gap-x-6 sm:gap-x-8" aria-label={`${yeas} yeas, ${nays} nays${paired ? `, ${paired} paired` : ""}${absent !== undefined ? `, ${absent} did not vote` : ""}`}>
        {cols.map((c) => (
          <div key={c.label} className="min-w-0">
            <dt className={cn("smallcaps text-[0.875rem]", c.strong ? "text-ink-2" : "text-ink-3")}>{c.label}</dt>
            <dd
              className={cn(
                "rule-total mt-1 pt-1 font-display leading-none font-semibold tracking-[-0.01em] tabular-nums",
                c.strong ? "text-ink" : "text-ink-3",
                size === "lg" ? (c.strong ? "text-[2.75rem]" : "text-[1.75rem]") : c.strong ? "text-[2rem]" : "text-[1.375rem]",
              )}
            >
              {c.n}
            </dd>
          </div>
        ))}
      </dl>
      <div aria-hidden className={cn("relative mt-3 flex overflow-hidden rounded-[1px] bg-paper-sunk", size === "lg" ? "h-2" : "h-1.5")}>
        <span className="h-full bg-yea" style={{ width: `${total ? (yeas / total) * 100 : 50}%` }} />
        <span className="h-full flex-1 bg-nay" />
        <span className="absolute inset-y-[-2px] left-1/2 w-px bg-paper" />
      </div>
    </div>
  )
}
