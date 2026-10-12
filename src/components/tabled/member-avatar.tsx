import { initials } from "@/lib/format"
import { cn } from "@/lib/utils"

/** Initials avatar. No photos (licensing unclear); party is shown by the tag beside it. */
export function MemberAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-paper-sunk font-display font-semibold text-ink-2",
        size === "sm" && "size-8 text-[0.75rem]",
        size === "md" && "size-10 text-sm",
        size === "lg" && "size-20 text-2xl",
      )}
    >
      {initials(name)}
    </span>
  )
}
