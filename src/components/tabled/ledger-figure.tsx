import { cn } from "@/lib/utils"

/** One line of a record: label (and note) on the left, the figure set in the serif on the right, on a hairline. */
export function LedgerRow({ label, value, note, className }: { label: string; value: React.ReactNode; note?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-6 border-b border-rule py-3", className)}>
      <dt className="min-w-0">
        <span className="text-[0.9375rem] text-ink">{label}</span>
        {note && <span className="block text-[0.8125rem] leading-snug text-ink-3">{note}</span>}
      </dt>
      <dd className="shrink-0 font-display text-[1.625rem] leading-none font-semibold tracking-[-0.01em] text-ink tabular-nums">{value}</dd>
    </div>
  )
}
