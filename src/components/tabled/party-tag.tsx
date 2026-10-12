import { cn } from "@/lib/utils"

export function partyColor(id: string | null | undefined) {
  return id ? `var(--party-${id}, var(--party-other))` : "var(--party-independent)"
}

/** Small square swatch, the only place party colour appears outside charts. */
export function PartySwatch({ partyId, className }: { partyId: string | null | undefined; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2.5 shrink-0 rounded-[1px]", className)}
      style={{ backgroundColor: partyColor(partyId) }}
    />
  )
}

export function PartyTag({
  partyId,
  label,
  className,
}: {
  partyId: string | null | undefined
  label: string | null | undefined
  className?: string
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[0.8125rem] whitespace-nowrap text-ink-2", className)}>
      <PartySwatch partyId={partyId} />
      {label ?? "No party"}
    </span>
  )
}
