export interface Seat {
  x: number
  y: number
  /** Angle from the left end (0) to the right end (PI). */
  angle: number
  row: number
}

/**
 * Seat positions for a semicircular chamber diagram. Seats are spread across `rows` concentric arcs in
 * proportion to arc length, then ordered by angle so consecutive seats fill wedges left to right (the
 * convention used for parliament charts). Coordinates fit a box of width 2 and height 1, origin at the
 * centre of the base; y grows upward.
 */
export function hemicycleLayout(total: number, rows?: number, innerRatio = 0.38): { seats: Seat[]; radius: number; rows: number } {
  if (total <= 0) return { seats: [], radius: 0, rows: 0 }
  const r = rows ?? Math.max(1, Math.min(12, Math.round(Math.sqrt(total / 3.4))))
  const radii = Array.from({ length: r }, (_, i) => innerRatio + ((1 - innerRatio) * (i + 0.5)) / r)
  const sum = radii.reduce((a, b) => a + b, 0)
  const counts = radii.map((rad) => Math.floor((total * rad) / sum))
  // Hand out the remainder to the outermost rows first.
  let remaining = total - counts.reduce((a, b) => a + b, 0)
  for (let i = r - 1; remaining > 0; i = (i - 1 + r) % r, remaining--) counts[i]++
  const seats: Seat[] = []
  radii.forEach((rad, row) => {
    const n = counts[row]
    for (let k = 0; k < n; k++) {
      const angle = n === 1 ? Math.PI / 2 : (Math.PI * k) / (n - 1)
      seats.push({ x: -Math.cos(angle) * rad, y: Math.sin(angle) * rad, angle, row })
    }
  })
  seats.sort((a, b) => a.angle - b.angle || b.row - a.row)
  // Seat diameter: limited by spacing along the densest arc and between rows.
  const along = Math.min(...radii.map((rad, i) => (counts[i] > 1 ? (Math.PI * rad) / (counts[i] - 1) : 1)))
  const across = (1 - innerRatio) / r
  return { seats, radius: Math.min(along, across) * 0.42, rows: r }
}
