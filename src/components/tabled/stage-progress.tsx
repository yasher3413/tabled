import { cn } from "@/lib/utils"
import { currentStageLabel } from "@/lib/stages"
import type { BillListItem } from "@/lib/queries"

/**
 * Compact readings ledger: one tick per stage, grouped by chamber. State is drawn by form, not hue:
 * solid tick completed, accent flag current, hairline not reached, struck tick defeated.
 */
export function StageProgress({
  stages,
  currentStage,
  className,
  showLabel = true,
}: {
  stages: BillListItem["stages"]
  currentStage: string
  className?: string
  showLabel?: boolean
}) {
  const groups: Array<{ chamber: string; items: typeof stages }> = []
  for (const s of stages) {
    const last = groups[groups.length - 1]
    if (last && last.chamber === s.chamber) last.items.push(s)
    else groups.push({ chamber: s.chamber, items: [s] })
  }
  const done = stages.filter((s) => s.state === "completed").length
  const label = currentStageLabel(currentStage)
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span
        role="img"
        aria-label={`${label}. ${done} of ${stages.length} stages complete.`}
        className="flex items-end gap-[5px]"
      >
        {groups.map((g, gi) => (
          <span key={gi} className="flex items-end gap-[2px]">
            {g.items.map((s) => (
              <span
                key={s.key}
                className={cn(
                  "relative block w-[5px]",
                  s.state === "completed" && "h-3 bg-ink",
                  s.state === "not_reached" && "h-3 border border-rule bg-transparent",
                  s.state === "in_progress" && "h-[1.125rem] bg-accent-ink",
                  s.state === "defeated" &&
                    "h-3 bg-danger-ink after:absolute after:top-1/2 after:-left-[3px] after:h-px after:w-[11px] after:-rotate-45 after:bg-danger-ink",
                )}
              />
            ))}
          </span>
        ))}
      </span>
      {showLabel && (
        <span className={cn("text-[0.8125rem] text-ink-2", currentStage === "crown:royal-assent" && "font-medium text-ink")}>
          {label}
        </span>
      )}
    </div>
  )
}
