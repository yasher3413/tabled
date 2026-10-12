import { cn } from "@/lib/utils"

/** Yeas against nays as a split bar with the totals set like a division list. */
export function VoteTally({
  yeas,
  nays,
  paired,
  result,
  size = "md",
  showResult = true,
  className,
}: {
  yeas: number
  nays: number
  paired?: number
  result: "passed" | "failed" | "tied"
  size?: "sm" | "md" | "lg"
  showResult?: boolean
  className?: string
}) {
  const total = yeas + nays
  const yeaPct = total ? (yeas / total) * 100 : 50
  const resultLabel = result === "passed" ? "Passed" : result === "failed" ? "Failed" : "Tied"
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-baseline justify-between gap-3">
        {showResult && (
          <p className={cn("flex items-baseline gap-2", size === "lg" ? "text-base" : "text-[0.8125rem]")}>
            <span className={cn("font-semibold", result === "passed" ? "text-accent-ink" : "text-ink")}>{resultLabel}</span>
          </p>
        )}
        <p className={cn("tabular-nums text-ink-2", size === "lg" ? "text-base" : "text-[0.8125rem]")}>
          <span className="font-semibold text-ink">{yeas}</span> yea
          <span className="mx-1.5 text-ink-3">to</span>
          <span className="font-semibold text-ink">{nays}</span> nay
          {paired ? <span className="text-ink-3"> · {paired} paired</span> : null}
        </p>
      </div>
      <div
        role="img"
        aria-label={`${resultLabel}: ${yeas} yeas, ${nays} nays${paired ? `, ${paired} paired` : ""}.`}
        className={cn("relative mt-1.5 flex overflow-hidden rounded-[1px] bg-paper-sunk", size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2")}
      >
        <span className="h-full bg-yea" style={{ width: `${yeaPct}%` }} />
        <span className="h-full flex-1 bg-nay" />
        <span aria-hidden className="absolute inset-y-[-2px] left-1/2 w-px bg-paper" />
      </div>
    </div>
  )
}
