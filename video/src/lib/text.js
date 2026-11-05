// Text drawing in the site's two faces. Sizes are in film pixels (1920x1080).
import { css } from "./color.js"
import { clamp, expo, seg, quart } from "./motion.js"

export const SERIF = '"Brygada 1918"'
export const SANS = '"Libre Franklin"'

export function font(ctx, size, weight = 400, family = SANS, track = 0) {
  ctx.font = `${weight} ${size}px ${family}`
  ctx.letterSpacing = `${(track * size).toFixed(2)}px`
}

export function wrap(ctx, text, maxW) {
  const words = text.split(" ")
  const lines = []
  let line = ""
  for (const w of words) {
    const test = line ? line + " " + w : w
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line)
      line = w
    } else line = test
  }
  if (line) lines.push(line)
  return lines
}

/**
 * Draw one string. o: { size, weight, family, color, alpha, align, track, blur, baseline }.
 * Returns the advance width.
 */
export function text(ctx, str, x, y, o = {}) {
  const a = o.alpha ?? 1
  if (a <= 0.003) return 0
  font(ctx, o.size ?? 32, o.weight ?? 400, o.family ?? SANS, o.track ?? 0)
  ctx.textAlign = o.align ?? "left"
  ctx.textBaseline = o.baseline ?? "alphabetic"
  ctx.fillStyle = css(o.color ?? "#ffffff", a)
  const blur = o.blur ?? 0
  if (blur > 0.4) ctx.filter = `blur(${blur.toFixed(2)}px)`
  ctx.fillText(str, x, y)
  if (blur > 0.4) ctx.filter = "none"
  return ctx.measureText(str).width
}

export function width(ctx, str, o = {}) {
  font(ctx, o.size ?? 32, o.weight ?? 400, o.family ?? SANS, o.track ?? 0)
  return ctx.measureText(str).width
}

/** Small caps as the site sets member names: capitals at full height, the rest as reduced capitals, 0.02em tracking. */
export function smallCaps(ctx, str, x, y, o = {}) {
  const size = o.size ?? 32
  let cx = x
  const runs = []
  let cur = null
  for (const ch of str) {
    const lower = ch !== ch.toUpperCase()
    if (!cur || cur.lower !== lower) runs.push((cur = { lower, s: "" }))
    cur.s += lower ? ch.toUpperCase() : ch
  }
  let total = 0
  for (const r of runs) total += width(ctx, r.s, { ...o, size: r.lower ? size * 0.8 : size, track: 0.02 + (r.lower ? 0.03 : 0) })
  if (o.align === "right") cx -= total
  if (o.align === "center") cx -= total / 2
  for (const r of runs) cx += text(ctx, r.s, cx, y, { ...o, align: "left", size: r.lower ? size * 0.8 : size, track: 0.02 + (r.lower ? 0.03 : 0) })
  return total
}

/**
 * Lines that enter as designed objects: rise from below with a short blur, and leave upward before the next
 * morph. t is film time; tin/tout are enter/leave times; stagger offsets each line.
 */
export function enterLines(ctx, lines, x, y, lh, t, tin, tout, o = {}, stagger = 0.06) {
  lines.forEach((ln, i) => {
    const a = clamp(seg(t, tin + i * stagger, tin + i * stagger + 0.55))
    const e = expo(a)
    const out = tout == null ? 0 : quart(seg(t, tout + i * stagger * 0.5, tout + i * stagger * 0.5 + 0.35))
    const alpha = e * (1 - out) * (o.alpha ?? 1)
    if (alpha <= 0.003) return
    const dy = (1 - e) * (o.rise ?? 26) - out * (o.rise ?? 26) * 0.7
    const blur = (1 - e) * 8 + out * 6
    text(ctx, ln, x, y + i * lh + dy, { ...o, alpha, blur })
  })
}
