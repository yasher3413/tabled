import { initials } from "@/lib/format"
import { cn } from "@/lib/utils"
import { partyColor } from "./party-tag"

/** Initials avatar with a party-coloured base rule. No photos (licensing unclear). */
export function MemberAvatar({ name, partyId, size = "md" }: { name: string; partyId: string | null; size?: "sm" | "md" | "lg" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-paper-sunk font-display font-semibold text-ink-2",
        size === "sm" && "size-8 text-[0.75rem]",
        size === "md" && "size-10 text-sm",
        size === "lg" && "size-20 text-2xl",
      )}
      style={{ boxShadow: `inset 0 -3px 0 ${partyColor(partyId)}` }}
    >
      {initials(name)}
    </span>
  )
}
