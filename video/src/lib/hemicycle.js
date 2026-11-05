// A direct port of src/lib/hemicycle.ts so every chamber in the film is the site's own geometry.
export function hemicycleLayout(total, rows, innerRatio = 0.38) {
  if (total <= 0) return { seats: [], radius: 0, rows: 0, radii: [], counts: [] }
  const r = rows ?? Math.max(1, Math.min(12, Math.round(Math.sqrt(total / 3.4))))
  const radii = Array.from({ length: r }, (_, i) => innerRatio + ((1 - innerRatio) * (i + 0.5)) / r)
  const sum = radii.reduce((a, b) => a + b, 0)
  const counts = radii.map((rad) => Math.floor((total * rad) / sum))
  let remaining = total - counts.reduce((a, b) => a + b, 0)
  for (let i = r - 1; remaining > 0; i = (i - 1 + r) % r, remaining--) counts[i]++
  const seats = []
  radii.forEach((rad, row) => {
    const n = counts[row]
    for (let k = 0; k < n; k++) {
      const angle = n === 1 ? Math.PI / 2 : (Math.PI * k) / (n - 1)
      seats.push({ x: -Math.cos(angle) * rad, y: Math.sin(angle) * rad, angle, row, k, n, rad })
    }
  })
  seats.sort((a, b) => a.angle - b.angle || b.row - a.row)
  const along = Math.min(...radii.map((rad, i) => (counts[i] > 1 ? (Math.PI * rad) / (counts[i] - 1) : 1)))
  const across = (1 - innerRatio) / r
  return { seats, radius: Math.min(along, across) * 0.42, rows: r, radii, counts }
}
