// Motion primitives. Everything is a pure function of time: no state survives between frames.

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
export const lerp = (a, b, k) => a + (b - a) * k
/** Progress of t through [a, b], clamped to 0..1. */
export const seg = (t, a, b) => clamp((t - a) / (b - a))

/** cubic-bezier(x1, y1, x2, y2) as an easing function (Newton then bisection). */
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by
  const sx = (u) => ((ax * u + bx) * u + cx) * u
  const sy = (u) => ((ay * u + by) * u + cy) * u
  const dx = (u) => (3 * ax * u + 2 * bx) * u + cx
  return (x) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let u = x
    for (let i = 0; i < 6; i++) {
      const e = sx(u) - x
      const d = dx(u)
      if (Math.abs(e) < 1e-6) return sy(u)
      if (Math.abs(d) < 1e-6) break
      u -= e / d
    }
    let lo = 0, hi = 1
    u = x
    for (let i = 0; i < 30; i++) {
      const v = sx(u)
      if (Math.abs(v - x) < 1e-6) break
      if (v < x) lo = u
      else hi = u
      u = (lo + hi) / 2
    }
    return sy(u)
  }
}

/** The house curve: cubic-bezier(0.16, 1, 0.3, 1). */
export const expo = bezier(0.16, 1, 0.3, 1)
/** Quart ease-out, the site's own overlay curve. */
export const quart = (x) => 1 - Math.pow(1 - clamp(x), 4)
export const inOut = bezier(0.65, 0, 0.35, 1)
export const easeIn = bezier(0.5, 0, 0.75, 0)

/**
 * Closed-form damped spring step response, 0 -> 1. `dur` is roughly the settle time in seconds.
 * Damping 0.8 keeps overshoot near 1.5%, under the 2% budget.
 */
export function spring(tau, dur = 0.6, zeta = 0.8) {
  if (tau <= 0) return 0
  const w = 4.2 / (zeta * dur)
  const wd = w * Math.sqrt(1 - zeta * zeta)
  return 1 - Math.exp(-zeta * w * tau) * (Math.cos(wd * tau) + ((zeta * w) / wd) * Math.sin(wd * tau))
}

/**
 * A value that changes target several times: one spring per change, summed.
 * keys: [[t0, v0], [t1, v1, dur?], ...]. Before t1 the value is v0.
 */
export function track(t, keys, dur = 0.7) {
  let v = keys[0][1]
  for (let i = 1; i < keys.length; i++) {
    const [ti, vi, d] = keys[i]
    v += (vi - keys[i - 1][1]) * spring(t - ti, d ?? dur)
  }
  return v
}

/** Same as track, but eased (no overshoot), for things that must not overshoot such as opacity. */
export function etrack(t, keys, dur = 0.5, ease = expo) {
  let v = keys[0][1]
  for (let i = 1; i < keys.length; i++) {
    const [ti, vi, d] = keys[i]
    v += (vi - keys[i - 1][1]) * ease(seg(t, ti, ti + (d ?? dur)))
  }
  return v
}

/** Fade window: 0 before a, in over `fin`, 1 until b, out over `fout`. */
export function win(t, a, b, fin = 0.35, fout = 0.3) {
  return expo(seg(t, a, a + fin)) * (1 - quart(seg(t, b, b + fout)))
}

/** Deterministic hash noise in 0..1. */
export function hash(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}
