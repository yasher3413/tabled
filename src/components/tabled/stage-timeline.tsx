import { formatDate, formatShortDate } from "@/lib/format"
import type { BillStage } from "@/lib/queries"
import { CHAMBER_LABEL, stageInfo } from "@/lib/stages"
import { cn } from "@/lib/utils"
import { StageExplainer } from "./stage-explainer"

const STATE_TEXT: Record<BillStage["state"], string> = {
  completed: "Completed",
  in_progress: "Current stage",
  not_reached: "Not reached",
  defeated: "Defeated here",
}

/**
 * The readings ledger: every stage in both chambers, in order. State is drawn by form so it reads
 * without colour: filled node and solid rule completed, ringed node with a flag current, hollow node
 * and dashed rule not reached, crossed node defeated.
 */
export function StageTimeline({ stages, referenceYear }: { stages: BillStage[]; referenceYear: number }) {
  const groups: Array<{ chamber: BillStage["chamber"]; items: BillStage[] }> = []
  for (const s of stages) {
    const last = groups[groups.length - 1]
    if (last && last.chamber === s.chamber) last.items.push(s)
    else groups.push({ chamber: s.chamber, items: [s] })
  }
  const flat = stages
  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-0">
      {groups.map((g) => (
        <section
          key={g.chamber}
          aria-label={CHAMBER_LABEL[g.chamber]}
          className="min-w-0 lg:pr-4"
          style={{ flex: `${g.items.length} 1 0%` }}
        >
          <h3 className="text-[0.8125rem] font-semibold text-ink">{CHAMBER_LABEL[g.chamber]}</h3>
          <ol className="mt-3 flex flex-col lg:flex-row">
            {g.items.map((s) => {
              const info = stageInfo(s.stageKey)
              const idx = flat.indexOf(s)
              const next = flat[idx + 1]
              const solidAfter = s.state === "completed" && next && (next.state === "completed" || next.state === "in_progress")
              const isLastInGroup = s === g.items[g.items.length - 1]
              return (
                <li key={s.ordinal} className="relative flex min-w-0 gap-3 pb-6 last:pb-0 lg:flex-1 lg:flex-col lg:gap-2 lg:pr-2 lg:pb-0">
                  {/* connector to the next stage */}
                  {next && (
                    <span
                      aria-hidden
                      className={cn(
                        "absolute top-4 left-[7px] h-full w-0 border-l-2 lg:top-[7px] lg:left-4 lg:h-0 lg:w-full lg:border-t-2 lg:border-l-0",
                        solidAfter ? "border-ink" : "border-dashed border-rule",
                        isLastInGroup && "lg:w-[calc(100%+1rem)]",
                      )}
                    />
                  )}
                  <StageNode state={s.state} />
                  <div className="min-w-0 pb-0.5">
                    <p className="-mt-0.5 leading-tight">
                      <span className={cn("text-[0.9375rem]", s.state === "not_reached" ? "text-ink-3" : "font-medium text-ink")}>
                        {info.label}
                      </span>
                      <span className="ml-0.5 inline-block align-middle">
                        <StageExplainer label={info.label} chamber={CHAMBER_LABEL[info.chamber]} explainer={info.explainer} />
                      </span>
                    </p>
                    <p className={cn("text-[0.8125rem]", s.state === "in_progress" ? "font-medium text-accent-ink" : s.state === "defeated" ? "font-medium text-danger-ink" : "text-ink-3")}>
                      <span className="sr-only">{STATE_TEXT[s.state]}. </span>
                      {s.state === "in_progress" ? (
                        <>Now here{s.date ? <span className="font-normal text-ink-3"> since {formatShortDate(s.date, referenceYear)}</span> : null}</>
                      ) : s.state === "defeated" ? (
                        <>Defeated{s.date ? ` ${formatShortDate(s.date, referenceYear)}` : ""}</>
                      ) : s.date ? (
                        <time dateTime={s.date} title={formatDate(s.date)}>
                          {formatShortDate(s.date, referenceYear)}
                        </time>
                      ) : s.state === "completed" ? (
                        "Date not recorded"
                      ) : null}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
      ))}
    </div>
  )
}

function StageNode({ state }: { state: BillStage["state"] }) {
  return (
    <span aria-hidden className="relative z-10 mt-0.5 flex size-4 shrink-0 items-center justify-center bg-paper lg:mt-0">
      {state === "completed" && <span className="size-3 rounded-full bg-ink" />}
      {state === "not_reached" && <span className="size-3 rounded-full border-2 border-rule bg-paper" />}
      {state === "in_progress" && (
        <span className="size-4 rounded-full border-2 border-accent-ink bg-paper p-[2px]">
          <span className="block size-full rounded-full bg-accent-ink" />
        </span>
      )}
      {state === "defeated" && (
        <svg viewBox="0 0 16 16" className="size-4 text-danger-ink">
          <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )}
    </span>
  )
}
