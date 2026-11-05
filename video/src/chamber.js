// The one object that never leaves the film: the House of Commons as seats.
// Every seat's look at time t is computed from scratch (position, size, colour, ring) so any frame renders alone.
import { C } from "./cues.js"
import { hemicycleLayout } from "./lib/hemicycle.js"
import { bezier, clamp, expo, hash, inOut, lerp, quart, seg, spring, track, win } from "./lib/motion.js"
import { css, mix } from "./lib/color.js"
import { SERIF, text } from "./lib/text.js"

const suck = bezier(0.55, 0, 0.25, 1)

export function setupChamber(D, layout) {
  const L1 = hemicycleLayout(D.house.seatsTotal)
  const L2 = hemicycleLayout(D.vote.ballots.length)
  const LOGO = hemicycleLayout(41, 4, 0.34)
  const start = {}
  let acc = 0
  for (const p of D.house.parties) {
    start[p.id] = acc
    acc += p.seats
  }
  const seats = L1.seats.map((h, i) => ({ i, h, v: null, party: null, ballot: null, slug: null, vacant: i >= acc }))
  for (const p of D.house.parties) for (let k = 0; k < p.seats; k++) seats[start[p.id] + k].party = p.id
  const used = {}
  D.vote.ballots.forEach((b, j) => {
    const k = used[b.party] ?? 0
    used[b.party] = k + 1
    const s = seats[start[b.party] + k]
    s.v = L2.seats[j]
    s.ballot = b.ballot
    s.slug = b.slug
    s.name = b.name
    s.dissent = b.dissent
  })
  // (row, k) -> seat, for the ledger bars that bend into rows.
  const byRowK = new Map(seats.map((s) => [`${s.h.row}:${s.h.k}`, s]))
  seats.forEach((s, i) => (s.logo = LOGO.seats[Math.floor((i * LOGO.seats.length) / seats.length)]))
  const find = D.find.slug
  return {
    L1, L2, LOGO, seats, byRowK,
    fanjoy: seats.find((s) => s.slug === find),
    gladu: seats.find((s) => s.slug === D.mp.slug),
    dissenters: seats.filter((s) => s.dissent),
    layout,
  }
}

/** Where the chamber sits: centre of its base and outer radius in film pixels. */
export function frame(t) {
  const cx = track(t, [[0, 960], [C.hero, 1395, 0.9], [C.vote, 590, 0.9], [C.table - 0.25, 530, 0.9], [C.mp, 1500, 0.9], [46, 960, 0.01]])
  const cy = track(t, [[0, 800], [C.hero, 660, 0.9], [C.vote, 965, 0.9], [C.table - 0.25, 965, 0.9], [C.mp, 975, 0.9], [46, 800, 0.01]])
  const R = track(t, [[0, 590], [C.hero, 385, 0.9], [C.vote, 455, 0.9], [C.table - 0.25, 395, 0.9], [C.mp, 330, 0.9], [46, 560, 0.01]])
  return { cx, cy, R }
}

const unitR = (L) => L.radius
export const waveAt = (s) => C.wave + 1.25 * (s.h.angle / Math.PI)
/** Scale dip while a seat swaps place in the wave. */
const dip = (s, t) => 1 - 0.55 * Math.sin(Math.PI * seg(t, waveAt(s) - 0.15, waveAt(s) + 0.3))

export function seatScreen(S, s, t, F = frame(t)) {
  // The seats re-seat into the 337-seat vote layout inside the ballot wave: each one dips, swaps and pops back.
  const w = waveAt(s)
  const b = inOut(seg(t, w - 0.05, w + 0.12))
  let ux = s.h.x, uy = s.h.y, ur = unitR(S.L1)
  if (s.v) {
    ux = lerp(ux, s.v.x, b)
    uy = lerp(uy, s.v.y, b)
    ur = lerp(ur, unitR(S.L2), clamp(b))
  }
  // From the vote onwards the layout is 337; it returns to 343 only through the ledger bend.
  return { x: F.cx + ux * F.R, y: F.cy - uy * F.R, r: ur * F.R }
}

function drawSeat(ctx, P, x, y, r, o) {
  // o: { color, fill (0..1), ring (0..1), hatch (0..1), alpha, focus (0..1) }
  if (r < 0.2 || o.alpha <= 0.003) return
  const a = o.alpha
  if (o.fill > 0.001) {
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = css(o.color, a * o.fill)
    ctx.fill()
  }
  if (o.hatch > 0.001) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = css(P.paper, a * o.hatch)
    ctx.fill()
    ctx.clip()
    ctx.strokeStyle = css(P["ballot-paired"], a * o.hatch)
    ctx.lineWidth = r * 0.3
    for (let d = -2; d <= 2; d++) {
      ctx.beginPath()
      ctx.moveTo(x - r * 1.2 + d * r * 0.7, y + r * 1.2)
      ctx.lineTo(x + r * 1.2 + d * r * 0.7, y - r * 1.2)
      ctx.stroke()
    }
    ctx.restore()
    ctx.beginPath()
    ctx.arc(x, y, r * 0.86, 0, Math.PI * 2)
    ctx.strokeStyle = css(P["ballot-paired"], a * o.hatch)
    ctx.lineWidth = r * 0.28
    ctx.stroke()
  }
  if (o.ring > 0.001) {
    ctx.beginPath()
    ctx.arc(x, y, r * 0.86, 0, Math.PI * 2)
    ctx.strokeStyle = css(o.ringColor ?? o.color, a * o.ring)
    ctx.lineWidth = r * 0.28
    ctx.stroke()
  }
  if (o.focus > 0.001) {
    ctx.beginPath()
    ctx.arc(x, y, r + r * 0.32, 0, Math.PI * 2)
    ctx.strokeStyle = css(P.ink, a * o.focus)
    ctx.lineWidth = Math.max(1.5, r * 0.3)
    ctx.stroke()
  }
}

/** How far a dissenting seat lifts out of the chamber; outer rows lift further so lifted seats never touch. */
export const dissentLift = (s) => {
  const row = s.v ? s.v.row : s.h.row
  return { dx: 34 - (row - 8) * 40, dy: -52 }
}

const BALLOT_COLOR = { yea: "ballot-yea", nay: "ballot-nay", paired: "ballot-paired", absent: "ballot-absent" }

/** The seat chart from the first frame to the moment it collapses into the bill's timeline. */
export function drawChamber(ctx, S, D, P, t) {
  if (t > C.node + 0.9 && t < C.bookend) return
  if (t >= C.bookend) return drawEnd(ctx, S, P, t)
  const F = frame(t)
  const dimOthers = Math.max(win(t, C.result, C.vote + 0.25, 0.45, 0.6), win(t, C.dissent, C.table, 0.5, 0.6), win(t, C.mp, C.mpOut + 0.5, 0.6, 0.6))
  const fanjoyOn = win(t, C.result, C.tally + 1.5, 0.4, 0.6)
  const dissentOn = win(t, C.dissent, C.table, 0.4, 0.6)
  const avatar = spring(t - C.mp, 0.9) - spring(t - C.mpOut, 0.8)
  const nodeX = S.layout.nodeX, nodeY = S.layout.nodeY
  const late = []
  for (const s of S.seats) {
    // Arrival: a wave from left to right across the chamber.
    const d = C.fill + 1.05 * (s.h.angle / Math.PI) + 0.05 * hash(s.i)
    const appear = clamp(spring(t - d, 0.55))
    if (appear <= 0.001) continue
    let { x, y, r } = seatScreen(S, s, t, F)
    r *= appear * (s.ballot || s.vacant ? dip(s, t) : 1)
    let alpha = Math.min(1, expo(seg(t, d, d + 0.3)))
    if (s.vacant) alpha *= 1 - quart(seg(t, waveAt(s) - 0.15, waveAt(s) + 0.05))
    // Party colour, then ballot colour in a wave.
    const bmix = s.ballot ? expo(seg(t, waveAt(s) - 0.05, waveAt(s) + 0.3)) : 0
    const pc = s.vacant ? P["ink-3"] : P[`party-${s.party}`]
    const bc = s.ballot ? P[BALLOT_COLOR[s.ballot]] : pc
    let color = mix(pc, bc, bmix)
    let fill = s.vacant ? 0 : 1, ring = s.vacant ? 1 : 0, hatch = 0
    if (s.ballot === "absent") { fill = 1 - bmix; ring = bmix }
    if (s.ballot === "paired") { fill = 1 - bmix; hatch = bmix }
    let focus = 0
    let isFocus = false
    if (s === S.fanjoy) {
      isFocus = fanjoyOn > 0
      r *= 1 + 0.7 * fanjoyOn
      focus = fanjoyOn
    }
    if (s.dissent) {
      isFocus = isFocus || dissentOn > 0
      r *= 1 + 0.3 * dissentOn
      const L = dissentLift(s)
      x += L.dx * dissentOn
      y += L.dy * dissentOn
      focus = Math.max(focus, dissentOn)
    }
    const meDim = isFocus || (s === S.gladu && avatar > 0.001) ? 0 : dimOthers
    alpha *= 1 - 0.82 * meDim
    if (s === S.gladu && avatar > 0.001) {
      const A = S.layout.avatar
      x = lerp(x, A.x, avatar)
      y = lerp(y, A.y, avatar)
      r = lerp(r, A.r, clamp(avatar))
      color = mix(color, P["paper-sunk"], clamp(avatar * 1.4))
      late.push({ x, y, r, avatar })
      continue
    }
    // Collapse into the defeated stage node of the bill's timeline.
    const dist = Math.hypot(x - nodeX, y - nodeY) / 1400
    const c0 = C.collapse + 0.55 * dist + 0.05 * hash(s.i + 9)
    const c = suck(seg(t, c0, c0 + 0.6))
    if (c > 0) {
      x = lerp(x, nodeX, c)
      y = lerp(y, nodeY, c)
      r = lerp(r, 2.2, c)
      color = mix(color, P["danger-ink"], seg(c, 0.5, 1))
      alpha *= 1 - seg(c, 0.88, 1)
      fill = Math.max(fill, c)
    }
    drawSeat(ctx, P, x, y, r, { color, fill, ring, hatch, alpha, focus: focus * (1 - c) })
  }
  // Gladu's seat becomes her initials avatar; drawn last so it sits above the chamber.
  for (const g of late) {
    drawSeat(ctx, P, g.x, g.y, g.r, { color: mix(P["ballot-yea"], P["paper-sunk"], clamp(g.avatar * 1.4)), fill: 1, ring: 0, hatch: 0, alpha: 1, focus: 0 })
    const ia = seg(g.avatar, 0.6, 1)
    if (ia > 0) text(ctx, "MG", g.x, g.y + g.r * 0.2, { size: g.r * 0.62, weight: 600, family: SERIF, color: P["ink-2"], alpha: ia, align: "center" })
  }
}

// ------------------------------------------------------------------ ledger bars that bend into the chamber
const E = { cx: 960, cy: 800, R: 560 }

export function ledgerRowY(q) {
  return 330 + q * 70
}
export const LEDGER_BAR = { x0: 1250, x1: 1770, dy: 46, h: 12 }

/**
 * Ten tally bars from the votes ledger. They pull back, stack, bend into the ten rows of the chamber and break
 * into its seats. q = 0 is the top row of the ledger (the newest vote) and becomes the outermost row.
 */
export function drawBend(ctx, S, D, P, t) {
  if (t < C.ledger || t > C.bookend + 0.05) return
  const votes = D.recentVotes.slice(0, 10)
  const rows = S.L1.rows
  const pull = (q) => spring(t - (C.pull + 0.04 * q), 0.9)
  const bendK = (q) => inOut(seg(t, C.bend + 0.05 * q, C.bend + 1.5 + 0.05 * q))
  const seatR = S.L1.radius * E.R
  votes.forEach((v, q) => {
    const r = rows - 1 - q
    const rho = S.L1.radii[r] * E.R
    const n = S.L1.counts[r]
    const enter = expo(seg(t, C.ledger + 0.25 + q * 0.125, C.ledger + 0.25 + q * 0.125 + 0.8))
    if (enter <= 0) return
    const p = clamp(pull(q), 0, 1.02)
    const k = bendK(q)
    const yeaF = v.yeas / (v.yeas + v.nays)
    // Straight ledger bar -> stacked bar of arc length -> arc.
    const Lx0 = LEDGER_BAR.x0, Lw = (LEDGER_BAR.x1 - LEDGER_BAR.x0) * enter
    const Ly = ledgerRowY(q) + LEDGER_BAR.dy
    const len = lerp(Lw, Math.PI * rho, p)
    const midX = lerp(Lx0 + Lw / 2, E.cx, p)
    const midY = lerp(Ly, E.cy - rho, p)
    const thick = lerp(LEDGER_BAR.h, seatR * 1.5, clamp(p))
    const kap = k / rho
    const pt = (u) => {
      // u in -0.5..0.5 along the bar's length
      const s = u * len
      if (kap < 1e-5) return [midX + s, midY]
      const ph = s * kap
      return [midX + Math.sin(ph) / kap, midY + (1 - Math.cos(ph)) / kap]
    }
    const dots = expo(seg(t, C.seats + 0.03 * q, C.seats + 0.03 * q + 0.5))
    const barA = 1 - dots
    if (barA > 0.003) {
      ctx.lineCap = "butt"
      ctx.lineWidth = thick
      const seg2 = (u0, u1, col) => {
        ctx.beginPath()
        const N = 48
        for (let i = 0; i <= N; i++) {
          const [x, y] = pt(u0 + ((u1 - u0) * i) / N)
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = css(col, barA)
        ctx.stroke()
      }
      // Sunk track, then yea ink and nay sepia, as the site's tally bar.
      seg2(-0.5, -0.5 + yeaF, P["ballot-yea"])
      seg2(-0.5 + yeaF, 0.5, P["ballot-nay"])
      // Halfway hairline, as on the site; it fades as the bar bends.
      const [hx, hy] = pt(0)
      if (k < 0.3 && p < 0.3) {
        ctx.fillStyle = css(P.paper, (1 - p / 0.3) * barA)
        ctx.fillRect(hx - 1.5, hy - thick / 2 - 3, 3, thick + 6)
      }
    }
    if (dots > 0.001) {
      for (let j = 0; j < n; j++) {
        const u = n === 1 ? 0 : j / (n - 1) - 0.5
        const [x, y] = pt(u)
        const s = S.byRowK.get(`${r}:${j}`)
        const ds = clamp(spring(t - (C.seats + 0.03 * q + 0.25 * Math.abs(u)), 0.5))
        const fromCol = u + 0.5 < yeaF ? P["ballot-yea"] : P["ballot-nay"]
        const to = s.vacant ? P["ink-3"] : P[`party-${s.party}`]
        const cm = expo(seg(t, C.seats + 0.3, C.bookend - 0.1))
        const col = mix(fromCol, to, cm)
        drawSeat(ctx, P, x, y, seatR * ds, { color: col, fill: s.vacant ? 1 - cm : 1, ring: s.vacant ? cm : 0, hatch: 0, alpha: 1, focus: 0 })
      }
    }
  })
}

// ------------------------------------------------------------------ ending: chamber -> logo mark
function drawEnd(ctx, S, P, t) {
  const Lk = S.layout.lockup
  const drain = expo(seg(t, C.drain, C.drain + 0.9))
  const logoR = S.LOGO.radius * 1.18
  for (const s of S.seats) {
    const x0 = E.cx + s.h.x * E.R, y0 = E.cy - s.h.y * E.R, r0 = S.L1.radius * E.R
    const d = C.condense + 0.35 * (s.h.angle / Math.PI) + 0.08 * (1 - s.h.rad)
    const e = clamp(spring(t - d, 1.1), 0, 1.015)
    const x1 = Lk.mx + s.logo.x * Lk.mr, y1 = Lk.my - s.logo.y * Lk.mr, r1 = logoR * Lk.mr
    const x = lerp(x0, x1, e), y = lerp(y0, y1, e), r = lerp(r0, r1, clamp(e))
    const base = s.vacant ? P["ink-3"] : P[`party-${s.party}`]
    const col = mix(base, P.ink, drain)
    const fill = s.vacant ? drain : 1
    drawSeat(ctx, P, x, y, r, { color: col, fill, ring: s.vacant ? 1 - drain : 0, hatch: 0, alpha: 1, focus: 0 })
  }
}

/** The header logo: the same chamber in monochrome, 41 seats (src/components/site/logo.tsx). */
export function drawLogoMark(ctx, S, P, x, baseY, scale, alpha = 1, color) {
  const r = S.LOGO.radius * 1.18 * scale
  ctx.fillStyle = css(color ?? P.ink, alpha)
  for (const s of S.LOGO.seats) {
    ctx.beginPath()
    ctx.arc(x + s.x * scale, baseY - s.y * scale, r, 0, Math.PI * 2)
    ctx.fill()
  }
}
