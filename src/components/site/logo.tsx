import { hemicycleLayout } from "@/lib/hemicycle"

const { seats, radius } = hemicycleLayout(41, 4, 0.34)

/** Tabled's mark: a small monochrome chamber of seats. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="-1.08 -1.08 2.16 1.16" className={className} aria-hidden="true" focusable="false">
      <g transform="scale(1,-1)">
        {seats.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={radius * 1.18} fill="currentColor" />
        ))}
      </g>
    </svg>
  )
}
