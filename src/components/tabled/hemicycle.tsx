import { hemicycleLayout } from "@/lib/hemicycle"
import { cn } from "@/lib/utils"

export interface HemicycleSeat {
  id: string
  fill: string
  /** "hollow" draws an outline only (absent / vacant). */
  variant?: "solid" | "hollow" | "hatched"
  title?: string
  dim?: boolean
  active?: boolean
}

/**
 * Semicircle seat chart. Seats arrive already ordered (left to right) by the caller. Pure SVG, server
 * renderable; interactive callers pass handlers through `seatProps`.
 */
export function Hemicycle({
  seats,
  label,
  className,
  children,
  seatProps,
}: {
  seats: HemicycleSeat[]
  label: string
  className?: string
  children?: React.ReactNode
  seatProps?: (seat: HemicycleSeat, index: number) => React.SVGProps<SVGCircleElement>
}) {
  const { seats: pos, radius } = hemicycleLayout(seats.length)
  const pad = radius * 1.6
  return (
    <svg
      viewBox={`${-1 - pad} ${-1 - pad} ${2 + pad * 2} ${1 + pad * 2}`}
      role="img"
      aria-label={label}
      className={cn("block h-auto w-full overflow-visible", className)}
    >
      <defs>
        <pattern id="hemi-hatch" width="0.012" height="0.012" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="0.012" height="0.012" fill="var(--paper)" />
          <line x1="0" y1="0" x2="0" y2="0.012" stroke="var(--ballot-paired)" strokeWidth="0.008" />
        </pattern>
      </defs>
      <g transform="scale(1,-1)">
        {seats.map((seat, i) => {
          const p = pos[i]
          const hollow = seat.variant === "hollow"
          return (
            <circle
              key={seat.id}
              cx={p.x}
              cy={p.y}
              r={seat.active ? radius * 1.35 : radius}
              fill={hollow ? "transparent" : seat.variant === "hatched" ? "url(#hemi-hatch)" : seat.fill}
              stroke={hollow ? seat.fill : seat.variant === "hatched" ? "var(--ballot-paired)" : seat.active ? "var(--ink)" : "none"}
              strokeWidth={hollow || seat.variant === "hatched" ? radius * 0.28 : seat.active ? radius * 0.35 : 0}
              opacity={seat.dim ? 0.18 : 1}
              style={{ transition: "opacity 160ms var(--ease-out-quart), r 160ms var(--ease-out-quart)" }}
              {...seatProps?.(seat, i)}
            >
              {seat.title && <title>{seat.title}</title>}
            </circle>
          )
        })}
      </g>
      {children}
    </svg>
  )
}
