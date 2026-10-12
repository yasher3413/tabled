import { cn } from "@/lib/utils"

/** A labelled figure set like a printed total: label above, number large, note below. */
export function LedgerFigure({
  label,
  value,
  note,
  className,
}: {
  label: string
  value: React.ReactNode
  note?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-[0.8125rem] text-ink-3">{label}</dt>
      <dd className="mt-1 font-display text-[2rem] leading-none font-semibold tracking-[-0.015em] text-ink tabular-nums">
        {value}
      </dd>
      {note && <dd className="mt-1.5 text-[0.8125rem] leading-snug text-ink-3">{note}</dd>}
    </div>
  )
}
