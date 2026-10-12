import { cn } from "@/lib/utils"
import type { Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { currentStageLabel } from "@/lib/stages"
import { FlagMark } from "./flag-mark"
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
  locale = "en",
}: {
  stages: BillListItem["stages"]
  currentStage: string
  className?: string
  showLabel?: boolean
  locale?: Locale
}) {
  const groups: Array<{ chamber: string; items: typeof stages }> = []
  for (const s of stages) {
    const last = groups[groups.length - 1]
    if (last && last.chamber === s.chamber) last.items.push(s)
    else groups.push({ chamber: s.chamber, items: [s] })
  }
  const done = stages.filter((s) => s.state === "completed").length
  const label = currentStageLabel(currentStage, locale)
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span
        role="img"
        aria-label={getMessages(locale).stage.progress(label, done, stages.length)}
        className="flex items-end gap-2"
      >
        {groups.map((g, gi) => (
          <span key={gi} className={cn("flex items-end gap-[2px]", gi > 0 && "border-l border-ink-3/40 pl-2")}>
            {g.items.map((s) => (
              <span
                key={s.key}
                className={cn(
                  "relative block w-1.5",
                  s.state === "completed" && "h-3 bg-ink",
                  s.state === "not_reached" && "h-3 border border-ink-3/55 bg-transparent",
                  s.state === "skipped" && "h-px self-center bg-ink-3/60",
                  s.state === "in_progress" && "h-3 w-auto",
                  s.state === "defeated" &&
                    "h-3 bg-danger-ink after:absolute after:top-1/2 after:-left-[3px] after:h-px after:w-[11px] after:-rotate-45 after:bg-danger-ink",
                )}
              >
                {s.state === "in_progress" && <FlagMark className="-mt-1 h-4 w-3.5 text-accent-ink" />}
              </span>
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
