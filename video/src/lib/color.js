// Colours are hex strings from data/film.json (DESIGN.md tokens) or [r, g, b] arrays (0..255).
const cache = new Map()
export function rgb(c) {
  if (Array.isArray(c)) return c
  let v = cache.get(c)
  if (!v) {
    const n = parseInt(c.slice(1), 16)
    v = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    cache.set(c, v)
  }
  return v
}
const lin = (c) => Math.pow(c / 255, 2.2)
const enc = (c) => Math.pow(Math.max(0, c), 1 / 2.2) * 255
/** Mix in linear light. Returns an [r, g, b] array. */
export function mix(a, b, k) {
  const A = rgb(a), B = rgb(b)
  if (k <= 0) return A
  if (k >= 1) return B
  return [0, 1, 2].map((i) => enc(lin(A[i]) + (lin(B[i]) - lin(A[i])) * k))
}
export function css(c, a = 1) {
  const [r, g, b] = rgb(c)
  return a >= 1 ? `rgb(${r | 0},${g | 0},${b | 0})` : `rgba(${r | 0},${g | 0},${b | 0},${Math.max(0, a).toFixed(4)})`
}
