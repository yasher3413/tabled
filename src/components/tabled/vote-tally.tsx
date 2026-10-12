import type { Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
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
  locale = "en",
}: {
  yeas: number
  nays: number
  paired?: number
  result: "passed" | "failed" | "tied"
  size?: "sm" | "md" | "lg"
  showResult?: boolean
  className?: string
  locale?: Locale
}) {
  const total = yeas + nays
  const yeaPct = total ? (yeas / total) * 100 : 50
  const t = getMessages(locale).vote
  const resultLabel = t[result]
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-baseline justify-between gap-3">
        {showResult && (
          <p className={cn("flex items-baseline gap-2", size === "lg" ? "text-base" : "text-[0.8125rem]")}>
            <span className="font-semibold text-ink">{resultLabel}</span>
          </p>
        )}
        <p className={cn("tabular-nums text-ink-2", size === "lg" ? "text-base" : "text-[0.8125rem]")}>
          <span className="font-semibold text-ink">{yeas}</span> {t.yeaWord}
          <span className="mx-1.5 text-ink-3">{t.to}</span>
          <span className="font-semibold text-ink">{nays}</span>{t.nayWord ? ` ${t.nayWord}` : ""}
          {paired ? <span className="text-ink-3"> · {paired} {t.pairedWord}</span> : null}
        </p>
      </div>
      <div
        role="img"
        aria-label={t.tallyLabel(resultLabel, yeas, nays, paired)}
        className={cn("relative mt-1.5 flex overflow-hidden rounded-[1px] bg-paper-sunk", size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2")}
      >
        <span className="h-full bg-yea" style={{ width: `${yeaPct}%` }} />
        <span className="h-full flex-1 bg-nay" />
        <span aria-hidden className="absolute inset-y-[-2px] left-1/2 w-px bg-paper" />
      </div>
    </div>
  )
}
