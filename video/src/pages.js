// The real pages, rebuilt from the design system, laid out around the chamber.
import { C } from "./cues.js"
import { EN, FR, longDate, longDateFr, shortDate, shortDateFr } from "./strings.js"
import { clamp, etrack, expo, quart, seg, spring, track, win, lerp } from "./lib/motion.js"
import { css, mix } from "./lib/color.js"
import { SANS, SERIF, enterLines, font, smallCaps, text, width, wrap } from "./lib/text.js"
import { dissentLift, drawLogoMark, frame, ledgerRowY, seatScreen, LEDGER_BAR } from "./chamber.js"

const X0 = 150
const X1 = 1770

// ------------------------------------------------------------------ small parts
function rule(ctx, P, x0, x1, y, color, a = 1, w = 1.5) {
  if (a <= 0.003 || x1 <= x0) return
  ctx.fillStyle = css(color, a)
  ctx.fillRect(x0, y - w / 2, x1 - x0, w)
}
function doubleRule(ctx, P, x0, x1, y, a) {
  rule(ctx, P, x0, x1, y, P["rule-strong"], a, 1.5)
  rule(ctx, P, x0, x1, y + 5, P["rule-strong"], a, 1.5)
}
function swatch(ctx, P, party, x, y, s, a = 1, round = false) {
  ctx.fillStyle = css(P[`party-${party}`], a)
  if (round) {
    ctx.beginPath()
    ctx.arc(x + s / 2, y + s / 2, s / 2, 0, Math.PI * 2)
    ctx.fill()
  } else ctx.fillRect(x, y, s, s)
}
function box(ctx, x, y, w, h, fill, stroke, a = 1, lw = 1.5) {
  if (a <= 0.003) return
  if (fill) {
    ctx.fillStyle = css(fill, a)
    ctx.fillRect(x, y, w, h)
  }
  if (stroke) {
    ctx.strokeStyle = css(stroke, a)
    ctx.lineWidth = lw
    ctx.strokeRect(x + lw / 2, y + lw / 2, w - lw, h - lw)
  }
}
/** Enter (rise + unblur) and leave (lift + blur) as one designed object. */
function ent(t, tin, tout, d = 0.55) {
  const e = expo(seg(t, tin, tin + d))
  const o = tout == null ? 0 : quart(seg(t, tout, tout + 0.35))
  return { a: e * (1 - o), dy: (1 - e) * 24 - o * 16, blur: (1 - e) * 7 + o * 5 }
}
/** Two-language text: English and French crossfade with a short vertical swap. */
function bi(ctx, en, fr, f, x, y, o) {
  const a = o.alpha ?? 1
  if (f < 0.999) text(ctx, en, x, y - 12 * f, { ...o, alpha: a * (1 - f), blur: (o.blur ?? 0) + 5 * f })
  if (f > 0.001) text(ctx, fr, x, y + 12 * (1 - f), { ...o, alpha: a * f, blur: (o.blur ?? 0) + 5 * (1 - f) })
}
function pinIcon(ctx, x, y, s, color, a) {
  ctx.save()
  ctx.strokeStyle = css(color, a)
  ctx.lineWidth = s * 0.09
  ctx.beginPath()
  ctx.arc(x, y - s * 0.12, s * 0.32, Math.PI * 0.8, Math.PI * 2.2)
  ctx.lineTo(x, y + s * 0.42)
  ctx.closePath()
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(x, y - s * 0.12, s * 0.11, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}
function searchIcon(ctx, x, y, s, color, a) {
  ctx.strokeStyle = css(color, a)
  ctx.lineWidth = s * 0.1
  ctx.beginPath()
  ctx.arc(x - s * 0.08, y - s * 0.08, s * 0.3, 0, Math.PI * 2)
  ctx.moveTo(x + s * 0.14, y + s * 0.14)
  ctx.lineTo(x + s * 0.38, y + s * 0.38)
  ctx.stroke()
}
function moonIcon(ctx, P, x, y, s, a) {
  ctx.strokeStyle = css(P["ink-2"], a)
  ctx.lineWidth = s * 0.09
  ctx.beginPath()
  ctx.arc(x, y, s * 0.36, Math.PI * 0.3, Math.PI * 1.75)
  ctx.arc(x + s * 0.17, y - s * 0.12, s * 0.27, Math.PI * 1.55, Math.PI * 0.55, true)
  ctx.stroke()
}
function sparkles(ctx, P, x, y, s, a) {
  ctx.strokeStyle = css(P["ink-3"], a)
  ctx.lineWidth = s * 0.08
  const star = (cx, cy, r) => {
    ctx.beginPath()
    ctx.moveTo(cx, cy - r)
    ctx.quadraticCurveTo(cx, cy, cx + r, cy)
    ctx.quadraticCurveTo(cx, cy, cx, cy + r)
    ctx.quadraticCurveTo(cx, cy, cx - r, cy)
    ctx.quadraticCurveTo(cx, cy, cx, cy - r)
    ctx.stroke()
  }
  star(x, y, s * 0.42)
  star(x + s * 0.42, y - s * 0.38, s * 0.15)
}

// ------------------------------------------------------------------ header
const NAV_SIZE = 26
const ACTIVE = [[0, -1], [C.find, 4], [C.vote, 1], [C.mp, 2], [C.mpOut + 0.5, 0], [C.ledger, 1]]

export function drawHeader(ctx, S, D, P, t) {
  const a = expo(seg(t, C.hero, C.hero + 0.7)) * (1 - quart(seg(t, C.pull, C.pull + 0.5)))
  if (a <= 0.003) return
  const dy = (1 - expo(seg(t, C.hero, C.hero + 0.7))) * -16
  ctx.save()
  ctx.translate(0, dy)
  const f = win(t, C.french, C.english, 0.3, 0.3)
  ctx.fillStyle = css(P.paper, a)
  ctx.fillRect(0, -40, 1920, 140)
  rule(ctx, P, 0, 1920, 100, P.rule, a)
  drawLogoMark(ctx, S, P, X0 + 28, 66, 26, a)
  text(ctx, "Tabled", X0 + 66, 64, { size: 38, weight: 600, family: SERIF, color: P.ink, alpha: a, track: -0.01 })
  // Nav links, measured in both languages so the active rule can travel between them.
  const pos = (labels) => {
    let x = 400
    return labels.map((l) => {
      const w = width(ctx, l, { size: NAV_SIZE })
      const p = { x, w }
      x += w + 36
      return p
    })
  }
  const pe = pos(EN.nav), pf = pos(FR.nav)
  EN.nav.forEach((l, i) => {
    const activeNow = activeAt(t) === i
    const col = activeNow ? P.ink : P["ink-2"]
    bi(ctx, l, FR.nav[i], f, lerp(pe[i].x, pf[i].x, f), 62, { size: NAV_SIZE, color: col, alpha: a })
  })
  // The active rule: each edge on its own spring, so it stretches as it travels.
  const edge = (side, lang, dur) => {
    const p = lang === "fr" ? pf : pe
    const keys = ACTIVE.map(([tt, i]) => [tt, i < 0 ? p[4].x + (side ? p[4].w : 0) : p[i].x + (side ? p[i].w : 0), dur])
    return track(t, keys)
  }
  const left = lerp(edge(0, "en", 0.55), edge(0, "fr", 0.55), f)
  const right = lerp(edge(1, "en", 0.8), edge(1, "fr", 0.8), f)
  const ua = a * expo(seg(t, C.find, C.find + 0.5))
  if (ua > 0.003) {
    ctx.fillStyle = css(P["commons-green"], ua)
    ctx.fillRect(left, 97.5, right - left, 3)
  }
  // Right side: search, language, theme.
  const langW = lerp(width(ctx, EN.lang, { size: 25 }), width(ctx, FR.lang, { size: 25 }), f)
  const langX = 1712 - langW
  const sw = 210, sx = langX - 36 - sw
  box(ctx, sx, 26, sw, 50, P["paper-raised"], P.rule, a)
  searchIcon(ctx, sx + 26, 51, 22, P["ink-3"], a)
  bi(ctx, EN.search, FR.search, f, sx + 48, 60, { size: 23, color: P["ink-3"], alpha: a })
  box(ctx, sx + sw - 58, 38, 44, 26, null, P.rule, a)
  text(ctx, "⌘K", sx + sw - 36, 57, { size: 15, color: P["ink-3"], alpha: a, align: "center" })
  const pulse = win(t, C.french - 0.5, C.french + 0.05, 0.15, 0.3) + win(t, C.english - 0.5, C.english + 0.05, 0.15, 0.3)
  const langCol = mix(P["ink-2"], P["commons-green"], clamp(pulse))
  bi(ctx, EN.lang, FR.lang, f, langX, 61, { size: 25, color: langCol, alpha: a })
  if (pulse > 0.01) rule(ctx, P, langX, langX + langW, 70, P["commons-green"], a * pulse, 2)
  moonIcon(ctx, P, 1752, 51, 30, a)
  ctx.restore()
}
function activeAt(t) {
  let i = -1
  for (const [tt, k] of ACTIVE) if (t >= tt) i = k
  return i
}

// ------------------------------------------------------------------ 1. opening caption + home hero
export function drawHome(ctx, S, D, P, t) {
  const F = frame(t)
  // Caption and legend under the chamber, as on the home page.
  const ca = expo(seg(t, 1.1, 1.8)) * (1 - quart(seg(t, C.find, C.find + 0.4)))
  if (ca > 0.003) {
    const y = F.cy + 56
    text(ctx, EN.seatsCaption(D.house.seatsTotal), F.cx, y, { size: 24, color: P["ink-3"], alpha: ca, align: "center" })
    const items = [...D.house.parties.map((p) => ({ p: p.id, label: EN.parties[p.id], n: p.seats })), { p: null, label: EN.vacant, n: D.house.vacant }]
    const ws = items.map((it) => 22 + width(ctx, it.label + " ", { size: 22 }) + width(ctx, String(it.n), { size: 22 }))
    const total = ws.reduce((x, y) => x + y, 0) + 24 * (items.length - 1)
    let x = F.cx - total / 2
    items.forEach((it, i) => {
      const ia = ca * expo(seg(t, 1.25 + i * 0.06, 1.85 + i * 0.06))
      if (it.p) swatch(ctx, P, it.p, x, y + 30, 14, ia)
      else {
        ctx.strokeStyle = css(P["ink-3"], ia)
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(x + 7, y + 37, 6, 0, Math.PI * 2)
        ctx.stroke()
      }
      const w = text(ctx, it.label + " ", x + 22, y + 44, { size: 22, color: P["ink-2"], alpha: ia })
      text(ctx, String(it.n), x + 22 + w, y + 44, { size: 22, color: P.ink, alpha: ia })
      x += ws[i] + 24
    })
  }
  // Hero headline and lede.
  enterLines(ctx, EN.heroTitle, X0, 300, 106, t, C.hero + 0.4, C.find, { size: 104, weight: 600, family: SERIF, color: P.ink, track: -0.025 }, 0.08)
  font(ctx, 30)
  const lede = wrap(ctx, EN.heroLede, 790)
  enterLines(ctx, lede, X0, 300 + 2 * 106 + 92, 46, t, C.hero + 0.7, C.find, { size: 30, color: P["ink-2"] }, 0.05)
  // Search field (the postal field is drawn by the Find scene, which grows out of it).
  const e = ent(t, C.hero + 0.95, C.find)
  if (e.a > 0.003) {
    ctx.save()
    ctx.translate(0, e.dy)
    box(ctx, X0, 790, 380, 74, P["paper-raised"], P["rule-strong"], e.a * 0.9)
    searchIcon(ctx, X0 + 32, 827, 24, P["ink-3"], e.a)
    text(ctx, EN.searchPh, X0 + 58, 837, { size: 26, color: P["ink-3"], alpha: e.a })
    box(ctx, X0 + 380 - 64, 812, 46, 30, null, P.rule, e.a)
    text(ctx, "⌘K", X0 + 380 - 41, 833, { size: 16, color: P["ink-3"], alpha: e.a, align: "center" })
    ctx.restore()
  }
}

// ------------------------------------------------------------------ 2. Find your MP
export function drawFind(ctx, S, D, P, t) {
  const out = C.findOut
  const title = ent(t, C.find + 0.2, out)
  text(ctx, EN.findTitle, X0, 290 + title.dy, { size: 100, weight: 600, family: SERIF, color: P.ink, alpha: title.a, blur: title.blur, track: -0.02 })
  font(ctx, 30)
  enterLines(ctx, wrap(ctx, EN.findLede, 820), X0, 368, 46, t, C.find + 0.3, out, { size: 30, color: P["ink-2"] }, 0.05)
  const lab = ent(t, C.find + 0.45, out)
  text(ctx, EN.findLabel, X0, 538 + lab.dy, { size: 26, weight: 600, color: P.ink, alpha: lab.a, blur: lab.blur })
  // The postal field: born in the home hero, it grows into the Find page's field.
  const fa = expo(seg(t, C.hero + 0.8, C.hero + 1.4)) * (1 - quart(seg(t, out, out + 0.35)))
  if (fa > 0.003) {
    const m = spring(t - C.find, 0.8)
    const fx = lerp(X0 + 400, X0, m), fy = lerp(790, 560, m) - 16 * quart(seg(t, out, out + 0.35))
    const fw = lerp(250, 640, m), fh = lerp(74, 96, m)
    const bw = lerp(200, 150, m)
    const pressed = win(t, C.press, C.press + 0.15, 0.06, 0.3)
    box(ctx, fx, fy, fw, fh, P["paper-raised"], P["rule-strong"], fa * 0.9)
    pinIcon(ctx, fx + 36, fy + fh / 2, lerp(26, 32, m), P["ink-2"], fa)
    const n = Math.max(0, Math.min(7, Math.floor((t - C.typeStart) / 0.25) + 1))
    const typed = "K0A 1L0".slice(0, n)
    const ts = lerp(26, 44, m)
    if (!typed) text(ctx, EN.postalPh, fx + 66, fy + fh / 2 + ts * 0.36, { size: ts, color: P["ink-3"], alpha: fa })
    const tw = text(ctx, typed, fx + 66, fy + fh / 2 + ts * 0.36, { size: ts, color: P.ink, alpha: fa, track: 0.04 })
    const caretOn = t > C.find + 0.4 && t < C.press && Math.floor(t * 2) % 2 === 0
    if (caretOn) {
      ctx.fillStyle = css(P["commons-green"], fa)
      ctx.fillRect(fx + 70 + tw, fy + fh / 2 - ts * 0.5, 3, ts * 0.95)
    }
    // Ink submit; Commons Green on press, as the site's hover state.
    const bc = mix(P.ink, P["commons-green"], pressed)
    const sq = 1 - 0.03 * pressed
    const bx = fx + fw, by = fy
    ctx.save()
    ctx.translate(bx + bw / 2, by + fh / 2)
    ctx.scale(sq, sq)
    box(ctx, -bw / 2, -fh / 2, bw, fh, bc, null, fa)
    const bl = m < 0.5 ? EN.findHero : EN.findButton
    const la = m < 0.5 ? 1 - m * 2 : (m - 0.5) * 2
    text(ctx, bl, 0, lerp(26, 30, m) * 0.36, { size: lerp(25, 30, m), weight: 500, color: P.paper, alpha: fa * Math.min(1, la), align: "center" })
    ctx.restore()
  }
  // The answer.
  const r = ent(t, C.result, out)
  if (r.a > 0.003) {
    ctx.save()
    ctx.translate(0, r.dy)
    text(ctx, EN.yourMp(D.find.postal), X0, 740, { size: 40, weight: 600, family: SERIF, color: P.ink, alpha: r.a, blur: r.blur })
    const c = ent(t, C.result + 0.12, out)
    ctx.translate(0, c.dy)
    box(ctx, X0, 772, 790, 196, P["paper-raised"], P.rule, c.a)
    text(ctx, D.find.riding, X0 + 32, 816, { size: 24, color: P["ink-3"], alpha: c.a })
    ctx.fillStyle = css(P["paper-sunk"], c.a)
    ctx.beginPath()
    ctx.arc(X0 + 80, 892, 46, 0, Math.PI * 2)
    ctx.fill()
    text(ctx, "BF", X0 + 80, 903, { size: 30, weight: 600, family: SERIF, color: P["ink-2"], alpha: c.a, align: "center" })
    text(ctx, D.find.name, X0 + 152, 892, { size: 50, weight: 600, family: SERIF, color: P.ink, alpha: c.a })
    swatch(ctx, P, D.find.party, X0 + 154, 914, 14, c.a)
    text(ctx, EN.parties[D.find.party], X0 + 178, 928, { size: 24, color: P["ink-2"], alpha: c.a })
    text(ctx, "→", X0 + 740, 900, { size: 34, color: P["ink-3"], alpha: c.a, align: "center" })
    ctx.restore()
    const cr = ent(t, C.result + 0.4, out)
    text(ctx, EN.findCredit, X0, 1012 + cr.dy, { size: 22, color: P["ink-3"], alpha: cr.a })
    // A hairline from the answer to the seat it names.
    const draw = expo(seg(t, C.result + 0.4, C.result + 1.1)) * (1 - quart(seg(t, out - 0.3, out + 0.1)))
    if (draw > 0.003) {
      const s = seatScreen(S, S.fanjoy, t)
      const ax = X0 + 790, ay = 870 + r.dy
      ctx.strokeStyle = css(P["rule-strong"], 0.55 * draw)
      ctx.lineWidth = 1.5
      ctx.setLineDash([])
      ctx.beginPath()
      const k = expo(seg(t, C.result + 0.4, C.result + 1.1))
      const ex = lerp(ax, s.x, k), ey = lerp(ay, s.y + s.r * 2.2, k)
      ctx.moveTo(ax, ay)
      ctx.bezierCurveTo(lerp(ax, ex, 0.5), ay, ex, lerp(ay, ey, 0.5), ex, ey)
      ctx.stroke()
    }
  }
}

// ------------------------------------------------------------------ 3 + 4. Vote 177
const RX = 1100
const TX = 990
const COLS = [TX, TX + 222, 1480, 1622, X1]
export function drawVote(ctx, S, D, P, t) {
  const V = D.vote
  const out = C.mp - 0.45
  const cr = ent(t, C.title - 0.1, out)
  const w0 = text(ctx, EN.votesCrumb, X0, 172 + cr.dy, { size: 24, color: P["commons-green"], alpha: cr.a, blur: cr.blur })
  text(ctx, `  /  ${EN.vote} ${V.number}`, X0 + w0, 172 + cr.dy, { size: 24, color: P["ink-3"], alpha: cr.a, blur: cr.blur })
  font(ctx, 62, 600, SERIF, -0.02)
  const lines = wrap(ctx, V.description, 1560)
  enterLines(ctx, lines, X0, 252, 70, t, C.title, out, { size: 62, weight: 600, family: SERIF, color: P.ink, track: -0.02 }, 0.07)
  const my = 252 + 70 * (lines.length - 1) + 58
  const me = ent(t, C.title + 0.25, out)
  text(ctx, EN.voteMeta(V.number, longDate(V.date), V.bill), X0, my + me.dy, { size: 26, color: P["ink-3"], alpha: me.a, blur: me.blur })
  const rl = expo(seg(t, C.title + 0.3, C.title + 1.2)) * (1 - quart(seg(t, out, out + 0.35)))
  rule(ctx, P, X0, lerp(X0, X1, rl), my + 42, P["rule-strong"], rl)

  // Right column, part one: the result.
  const rOut = C.dissent - 0.5
  const ta = ent(t, C.tally - 0.1, rOut)
  if (ta.a > 0.003) {
    const g = expo(seg(t, C.tally, C.tally + 1.4))
    const yeas = Math.round(V.yeas * g), nays = Math.round(V.nays * g)
    let x = RX
    const y = 724 + ta.dy
    const o = { size: 36, alpha: ta.a, blur: ta.blur }
    x += text(ctx, String(yeas), x, y, { ...o, weight: 600, color: P.ink })
    x += text(ctx, " yea", x, y, { ...o, color: P["ink-2"] })
    x += text(ctx, "  to  ", x, y, { ...o, color: P["ink-3"] })
    x += text(ctx, String(nays), x, y, { ...o, weight: 600, color: P.ink })
    x += text(ctx, " nay", x, y, { ...o, color: P["ink-2"] })
    text(ctx, `  ·  ${V.paired} ${EN.pairedWord}`, x, y, { ...o, color: P["ink-3"] })
    const bw = X1 - RX, by = 748 + ta.dy
    ctx.fillStyle = css(P["paper-sunk"], ta.a)
    ctx.fillRect(RX, by, bw, 16)
    const yf = V.yeas / (V.yeas + V.nays)
    ctx.fillStyle = css(P["ballot-yea"], ta.a)
    ctx.fillRect(RX, by, bw * yf * g, 16)
    ctx.fillStyle = css(P["ballot-nay"], ta.a)
    ctx.fillRect(RX + bw * yf * g, by, bw * (1 - yf) * g, 16)
    ctx.fillStyle = css(P.paper, ta.a)
    ctx.fillRect(RX + bw / 2 - 1.5, by - 3, 3, 22)
  }
  const fl = ent(t, C.failed, rOut, 0.7)
  if (fl.a > 0.003) {
    const s = 1 + 0.06 * (1 - spring(t - C.failed, 0.7))
    ctx.save()
    ctx.translate(RX, 650 + fl.dy)
    ctx.scale(s, s)
    text(ctx, EN.failed, 0, 0, { size: 150, weight: 600, family: SERIF, color: P.ink, alpha: fl.a, blur: fl.blur, track: -0.025 })
    ctx.restore()
  }
  font(ctx, 26)
  enterLines(ctx, wrap(ctx, EN.splitNote, X1 - RX), RX, 832, 40, t, C.note, rOut, { size: 26, color: P["ink-3"] }, 0.05)

  // Legend under the chamber.
  const la = ent(t, C.tally + 0.3, out)
  if (la.a > 0.003) {
    const items = [["yea", V.yeas], ["nay", V.nays], ["paired", V.paired], ["absent", V.absent]]
    let x = 140
    const y = 1040 + la.dy
    items.forEach(([b, n], i) => {
      const cx = x + 8, cy = y - 8
      ctx.beginPath()
      ctx.arc(cx, cy, 8, 0, Math.PI * 2)
      if (b === "yea" || b === "nay") {
        ctx.fillStyle = css(P[`ballot-${b}`], la.a)
        ctx.fill()
      } else {
        ctx.strokeStyle = css(P[`ballot-${b}`], la.a)
        ctx.lineWidth = 2.5
        ctx.stroke()
      }
      x += 24
      x += text(ctx, EN.legend[i] + " ", x, y, { size: 24, color: P["ink-2"], alpha: la.a })
      x += text(ctx, String(n), x, y, { size: 24, color: P.ink, alpha: la.a }) + 34
    })
  }

  // Right column, part two: the MPs who broke with their party.
  const dl = ent(t, C.dissentList, C.table - 0.4)
  if (dl.a > 0.003) {
    text(ctx, EN.brokeWith, RX, 560 + dl.dy, { size: 30, weight: 600, color: P.ink, alpha: dl.a, blur: dl.blur })
    rule(ctx, P, RX, X1, 584 + dl.dy, P.rule, dl.a)
  }
  // Site order: Kent MacDonald, then Marilyn Gladu.
  const order = [...S.dissenters].sort((a, b) => (a.name < b.name ? -1 : 1))
  order.forEach((s, i) => {
    const e = ent(t, C.dissentList + 0.15 + i * 0.25, C.table - 0.4)
    if (e.a <= 0.003) return
    const y = 640 + i * 104 + e.dy
    swatch(ctx, P, s.party, RX, y - 24, 16, e.a)
    smallCaps(ctx, s.name, RX + 30, y, { size: 38, color: P["commons-green"], alpha: e.a, blur: e.blur })
    text(ctx, EN.votedAgainst(s.ballot, EN.parties[s.party], s.ballot === "yea" ? "nay" : "yea"), RX, y + 44, { size: 26, color: P["ink-2"], alpha: e.a, blur: e.blur })
    rule(ctx, P, RX, X1, y + 70, P.rule, e.a)
    // Hairline from the lifted seat to its row.
    const k = expo(seg(t, C.dissentList + 0.3 + i * 0.25, C.dissentList + 1.0 + i * 0.25)) * (1 - quart(seg(t, C.table - 0.6, C.table - 0.2)))
    if (k > 0.003) {
      const p = seatScreen(S, s, t)
      const Lf = dissentLift(s)
      const sx = p.x + Lf.dx, sy = p.y + Lf.dy
      const ex = RX - 18, ey = y - 16
      ctx.strokeStyle = css(P["rule-strong"], 0.5 * k)
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(sx + p.r * 2, sy)
      const kx = lerp(sx + p.r * 2, ex, k), ky = lerp(sy, ey, k)
      ctx.bezierCurveTo(lerp(sx, kx, 0.6), sy, lerp(sx, kx, 0.4), ky, kx, ky)
      ctx.stroke()
    }
  })

  // Right column, part three: by party, with the totals under the double rule.
  const tb = ent(t, C.table, out)
  if (tb.a > 0.003) {
    text(ctx, EN.byParty, TX, 560 + tb.dy, { size: 30, weight: 600, color: P.ink, alpha: tb.a, blur: tb.blur })
    const hy = 618 + tb.dy
    EN.cols.forEach((c, i) => text(ctx, c, COLS[i], hy, { size: 22, weight: 500, color: P["ink-3"], alpha: tb.a, align: i >= 2 ? "right" : "left" }))
    rule(ctx, P, TX, X1, hy + 14, P.rule, tb.a)
  }
  V.partyStats.forEach((st, i) => {
    const e = ent(t, C.table + 0.25 + i * 0.25, out)
    if (e.a <= 0.003) return
    const cols = COLS
    const y = 674 + i * 54 + e.dy
    const o = { size: 28, alpha: e.a, blur: e.blur }
    swatch(ctx, P, st.party, TX, y - 17, 15, e.a)
    text(ctx, EN.parties[st.party], TX + 26, y, { ...o, color: P.ink })
    const pw = text(ctx, st.majority === "yea" ? "Yea" : "Nay", cols[1], y, { ...o, color: P.ink })
    if (st.dissent) text(ctx, EN.brokeRanks(st.dissent), cols[1] + pw + 12, y, { ...o, size: 21, color: P["ink-3"] })
    text(ctx, String(st.yea), cols[2], y, { ...o, color: P.ink, align: "right" })
    text(ctx, String(st.nay), cols[3], y, { ...o, color: P.ink, align: "right" })
    text(ctx, String(st.paired + st.absent), cols[4], y, { ...o, color: P["ink-3"], align: "right" })
    if (i < V.partyStats.length - 1) rule(ctx, P, TX, X1, y + 18, P.rule, e.a)
  })
  const tt = ent(t, C.total, out, 0.6)
  if (tt.a > 0.003) {
    const dr = expo(seg(t, C.total - 0.15, C.total + 0.5))
    doubleRule(ctx, P, TX, lerp(TX, X1, dr), 958 + tt.dy * 0.3, tt.a)
    const y = 1030 + tt.dy
    const o = { alpha: tt.a, blur: tt.blur }
    text(ctx, EN.total, TX, y, { ...o, size: 24, weight: 600, color: P.ink })
    text(ctx, String(V.yeas), COLS[2], y, { ...o, size: 60, weight: 600, family: SERIF, color: P.ink, align: "right" })
    text(ctx, String(V.nays), COLS[3], y, { ...o, size: 60, weight: 600, family: SERIF, color: P.ink, align: "right" })
    text(ctx, String(V.paired + V.absent), X1, y, { ...o, size: 44, weight: 600, family: SERIF, color: P["ink-3"], align: "right" })
  }
}

// ------------------------------------------------------------------ 5. An MP's record
export function drawMp(ctx, S, D, P, t) {
  const M = D.mp
  const out = C.mpOut
  const cr = ent(t, C.mp + 0.3, out)
  const w0 = text(ctx, EN.mpsCrumb, X0, 172 + cr.dy, { size: 24, color: P["commons-green"], alpha: cr.a, blur: cr.blur })
  text(ctx, `  /  ${M.name}`, X0 + w0, 172 + cr.dy, { size: 24, color: P["ink-3"], alpha: cr.a, blur: cr.blur })
  const nm = ent(t, C.mp + 0.55, out, 0.7)
  text(ctx, M.name, 350, 330 + nm.dy, { size: 96, weight: 600, family: SERIF, color: P.ink, alpha: nm.a, blur: nm.blur, track: -0.02 })
  const tg = ent(t, C.mp + 0.75, out)
  swatch(ctx, P, M.party, 354, 371 + tg.dy, 15, tg.a)
  const w1 = text(ctx, EN.parties[M.party], 380, 388 + tg.dy, { size: 28, color: P["ink-2"], alpha: tg.a, blur: tg.blur })
  text(ctx, `   ·   ${EN.mpFor(M.riding)}`, 380 + w1, 388 + tg.dy, { size: 28, color: P["ink-2"], alpha: tg.a, blur: tg.blur })
  const rl = expo(seg(t, C.mp + 0.8, C.mp + 1.6)) * (1 - quart(seg(t, out, out + 0.35)))
  rule(ctx, P, X0, lerp(X0, X1, rl), 436, P["rule-strong"], rl)
  const vr = ent(t, C.mp + 1.1, out)
  text(ctx, EN.votingRecord, X0, 524 + vr.dy, { size: 44, weight: 600, family: SERIF, color: P.ink, alpha: vr.a, blur: vr.blur })
  rule(ctx, P, X0, 1110, 548 + vr.dy, P.rule, vr.a)
  M.record.forEach((r, i) => {
    const e = ent(t, C.mpRows + i * 0.25, out)
    if (e.a <= 0.003) return
    const y = 552 + i * 132 + e.dy
    if (r.dissent) {
      const h = expo(seg(t, C.mpDissentRow, C.mpDissentRow + 0.5))
      ctx.fillStyle = css(P["commons-wash"], e.a * h * 0.85)
      ctx.fillRect(X0 - 16, y + 1, 1110 - X0 + 32, 130)
    }
    const o = { alpha: e.a, blur: e.blur }
    text(ctx, shortDate(r.date), X0, y + 52, { ...o, size: 26, color: P["ink-3"] })
    font(ctx, 30)
    const ls = wrap(ctx, r.description, 640)
    ls.forEach((l, k) => text(ctx, l, 300, y + 52 + k * 42, { ...o, size: 30, color: P.ink }))
    text(ctx, r.ballot === "yea" ? "Yea" : "Nay", 1095, y + 52, { ...o, size: 30, color: P.ink, align: "right" })
    if (r.dissent) {
      const h = expo(seg(t, C.mpDissentRow, C.mpDissentRow + 0.5))
      text(ctx, EN.againstParty, 1095, y + 90, { ...o, alpha: e.a * h, size: 22, weight: 600, color: P.ink, align: "right" })
    }
    rule(ctx, P, X0, 1110, y + 132, P.rule, e.a)
  })
}

// ------------------------------------------------------------------ 6. The bill
export function billLayout() {
  return { nodeX: X0 + 162 * 1 + 9, nodeY: 830 }
}
export function drawBill(ctx, S, D, P, t) {
  const B = D.bill
  const out = C.billOut
  const f = win(t, C.french, C.english, 0.35, 0.35)
  const off = track(t, [[0, 0], [C.scroll, -520, 1.0]])
  ctx.save()
  ctx.translate(0, off)
  const cr = ent(t, C.billHead, out)
  bi(ctx, EN.billsCrumb, FR.billsCrumb, f, X0, 172 + cr.dy, { size: 24, color: P["commons-green"], alpha: cr.a, blur: cr.blur })
  const cw = lerp(width(ctx, EN.billsCrumb, { size: 24 }), width(ctx, FR.billsCrumb, { size: 24 }), f)
  text(ctx, `  /  ${B.number}`, X0 + cw, 172 + cr.dy, { size: 24, color: P["ink-3"], alpha: cr.a, blur: cr.blur })
  const nb = ent(t, C.billHead + 0.15, out, 0.7)
  text(ctx, B.number, X0, 268 + nb.dy, { size: 84, weight: 600, family: SERIF, color: P["ink-3"], alpha: nb.a, blur: nb.blur, track: -0.02 })
  font(ctx, 64, 600, SERIF, -0.02)
  const le = wrap(ctx, B.title, 1500), lf = wrap(ctx, B.titleFr, 1500)
  const tl = ent(t, C.billHead + 0.3, out, 0.7)
  for (let i = 0; i < Math.max(le.length, lf.length); i++)
    bi(ctx, le[i] ?? "", lf[i] ?? "", f, X0, 345 + i * 70 + tl.dy, { size: 64, weight: 600, family: SERIF, color: P.ink, alpha: tl.a, blur: tl.blur, track: -0.02 })
  const mt = ent(t, C.billHead + 0.45, out)
  bi(ctx, EN.billMeta("Private member's bill", longDate(B.introduced)), FR.billMeta(B.typeFr, longDateFr(B.introduced)), f, X0, 492 + mt.dy, { size: 26, color: P["ink-3"], alpha: mt.a, blur: mt.blur })
  const dl = ent(t, C.billHead + 0.6, out)
  if (dl.a > 0.003) {
    const o = { alpha: dl.a, blur: dl.blur }
    bi(ctx, EN.status, FR.status, f, X0, 556 + dl.dy, { ...o, size: 22, color: P["ink-3"] })
    bi(ctx, EN.defeatedAt, FR.defeatedAt, f, X0, 594 + dl.dy, { ...o, size: 28, weight: 500, color: P["danger-ink"] })
    bi(ctx, EN.sponsor, FR.sponsor, f, 1110, 556 + dl.dy, { ...o, size: 22, color: P["ink-3"] })
    const sw = smallCaps(ctx, B.sponsor, 1110, 594 + dl.dy, { ...o, size: 28, color: P["commons-green"] })
    swatch(ctx, P, B.sponsorParty, 1110 + sw + 16, 574 + dl.dy, 14, dl.a)
    bi(ctx, EN.parties[B.sponsorParty], FR.parties[B.sponsorParty], f, 1110 + sw + 38, 594 + dl.dy, { ...o, size: 26, color: P["ink-2"] })
  }
  const rl = expo(seg(t, C.billHead + 0.6, C.billHead + 1.4)) * (1 - quart(seg(t, out, out + 0.35)))
  rule(ctx, P, X0, lerp(X0, X1, rl), 640, P["rule-strong"], rl)
  const wi = ent(t, C.timeline - 0.3, out)
  bi(ctx, EN.whereItIs, FR.whereItIs, f, X0, 720 + wi.dy, { size: 44, weight: 600, family: SERIF, color: P.ink, alpha: wi.a, blur: wi.blur })
  rule(ctx, P, X0, X1, 744 + wi.dy, P.rule, wi.a)
  drawTimeline(ctx, S, D, P, t, f, out)
  drawSummary(ctx, S, D, P, t, out)
  ctx.restore()
}

function drawTimeline(ctx, S, D, P, t, f, out) {
  const B = D.bill
  const step = 162
  const ny = 830
  const ga = ent(t, C.timeline, out)
  // Chamber group labels.
  const groups = [["house", 0], ["senate", 5], ["crown", 9]]
  for (const [g, i] of groups) bi(ctx, EN.chambers[g], FR.chambers[g], f, X0 + step * i, 790 + ga.dy, { size: 23, weight: 600, color: P.ink, alpha: ga.a, blur: ga.blur })
  const oa = 1 - quart(seg(t, out, out + 0.35))
  B.stages.forEach((s, i) => {
    const x = X0 + step * i + 9
    const appear = expo(seg(t, C.timeline + 0.1 + i * 0.07, C.timeline + 0.6 + i * 0.07))
    // Connector to the next stage: solid ink only between completed stages; dashed otherwise.
    if (i < B.stages.length - 1) {
      const nxt = B.stages[i + 1]
      const solid = s.state === "completed" && (nxt.state === "completed" || nxt.state === "in_progress")
      const L = step * appear
      ctx.save()
      ctx.strokeStyle = css(solid ? P.ink : P.rule, appear * oa)
      ctx.lineWidth = 2.5
      ctx.setLineDash(solid ? [] : [7, 6])
      ctx.beginPath()
      ctx.moveTo(x + 12, ny)
      ctx.lineTo(x + 12 + Math.max(0, L - 24), ny)
      ctx.stroke()
      ctx.restore()
    }
    if (s.state === "defeated") {
      const k = spring(t - C.node, 0.5)
      const a = clamp(k) * oa
      const r = 11 * clamp(k, 0, 1.1)
      ctx.strokeStyle = css(P["danger-ink"], a)
      ctx.lineWidth = 4
      ctx.lineCap = "round"
      ctx.beginPath()
      ctx.moveTo(x - r, ny - r)
      ctx.lineTo(x + r, ny + r)
      ctx.moveTo(x + r, ny - r)
      ctx.lineTo(x - r, ny + r)
      ctx.stroke()
      ctx.lineCap = "butt"
    } else if (appear > 0.003) {
      ctx.beginPath()
      ctx.arc(x, ny, 9 * appear, 0, Math.PI * 2)
      if (s.state === "completed") {
        ctx.fillStyle = css(P.ink, appear * oa)
        ctx.fill()
      } else {
        ctx.fillStyle = css(P.paper, appear * oa)
        ctx.fill()
        ctx.strokeStyle = css(P["ink-3"], 0.45 * appear * oa)
        ctx.lineWidth = 3
        ctx.stroke()
      }
    }
    const la = ent(t, C.timeline + 0.25 + i * 0.07, out)
    const dim = s.state === "not_reached"
    font(ctx, 25, dim ? 400 : 500)
    const le = wrap(ctx, s.label, 135), lf = wrap(ctx, s.labelFr, 135)
    for (let k = 0; k < 2; k++)
      bi(ctx, le[k] ?? "", lf[k] ?? "", f, X0 + step * i, 878 + k * 32 + la.dy, { size: 25, weight: dim ? 400 : 500, color: dim ? P["ink-3"] : P.ink, alpha: la.a, blur: la.blur })
    if (s.date) {
      const isDef = s.state === "defeated"
      const en = isDef ? `${EN.defeated} ${shortDate(s.date)}` : shortDate(s.date)
      const fr = isDef ? `${FR.defeated} ${shortDateFr(s.date)}` : shortDateFr(s.date)
      bi(ctx, en, fr, f, X0 + step * i, 948 + la.dy, { size: 22, weight: isDef ? 500 : 400, color: isDef ? P["danger-ink"] : P["ink-3"], alpha: la.a, blur: la.blur })
    }
  })
}

function drawSummary(ctx, S, D, P, t, out) {
  const B = D.bill
  const base = 1062
  const h = ent(t, C.summary - 0.3, out)
  text(ctx, EN.whatItDoes, X0, base + h.dy, { size: 44, weight: 600, family: SERIF, color: P.ink, alpha: h.a, blur: h.blur })
  rule(ctx, P, X0, X1, base + 24 + h.dy, P.rule, h.a)
  font(ctx, 46, 500, SERIF)
  const tl = wrap(ctx, B.summary.tldr, 1500)
  enterLines(ctx, tl, X0, base + 108, 60, t, C.summary, out, { size: 46, weight: 500, family: SERIF, color: P.ink }, 0.12)
  const wy = base + 108 + 60 * (tl.length - 1) + 78
  const wh = ent(t, C.summary + 0.6, out)
  text(ctx, EN.whoItAffects, X0, wy + wh.dy, { size: 24, weight: 600, color: P.ink, alpha: wh.a, blur: wh.blur })
  let x = X0
  B.summary.whoItAffects.forEach((g, i) => {
    const e = ent(t, C.summary + 0.75 + i * 0.125, out)
    const w = width(ctx, g, { size: 24 }) + 28
    box(ctx, x, wy + 18 + e.dy, w, 44, null, P.rule, e.a)
    text(ctx, g, x + 14, wy + 48 + e.dy, { size: 24, color: P["ink-2"], alpha: e.a, blur: e.blur })
    x += w + 12
  })
  const ai = ent(t, C.ai, out)
  if (ai.a > 0.003) {
    const ay = wy + 128 + ai.dy
    rule(ctx, P, X0, X1, ay - 34, P.rule, ai.a)
    sparkles(ctx, P, X0 + 12, ay - 8, 26, ai.a)
    const w1 = text(ctx, EN.aiLabel + " ", X0 + 44, ay, { size: 24, weight: 500, color: P["ink-2"], alpha: ai.a, blur: ai.blur })
    font(ctx, 24)
    const rest = EN.aiRest(longDate(B.summary.generatedAt), B.summary.model)
    const words = rest.split(" ")
    let first = ""
    while (words.length && ctx.measureText(first + " " + words[0]).width < X1 - X0 - 44 - w1) first = (first ? first + " " : "") + words.shift()
    text(ctx, first, X0 + 44 + w1, ay, { size: 24, color: P["ink-3"], alpha: ai.a, blur: ai.blur })
    text(ctx, words.join(" "), X0 + 44, ay + 36, { size: 24, color: P["ink-3"], alpha: ai.a, blur: ai.blur })
  }
}

// ------------------------------------------------------------------ 7. Every vote
export function drawLedger(ctx, S, D, P, t) {
  const out = C.pull
  const h = ent(t, C.ledger, out)
  text(ctx, EN.votesTitle, X0, 250 + h.dy, { size: 84, weight: 600, family: SERIF, color: P.ink, alpha: h.a, blur: h.blur, track: -0.02 })
  text(ctx, EN.votesNoun(D.session.votes), X1, 250 + h.dy, { size: 26, color: P["ink-3"], alpha: h.a, blur: h.blur, align: "right" })
  rule(ctx, P, X0, X1, 286 + h.dy, P["rule-strong"], h.a)
  D.recentVotes.slice(0, 10).forEach((v, q) => {
    const e = ent(t, C.ledger + 0.25 + q * 0.125, out - 0.1 + q * 0.03)
    if (e.a <= 0.003) return
    const y = ledgerRowY(q) + e.dy
    const o = { alpha: e.a, blur: e.blur }
    text(ctx, shortDate(v.date), X0, y + 30, { ...o, size: 24, color: P["ink-3"] })
    text(ctx, `${EN.vote} ${v.number}`, X0, y + 58, { ...o, size: 20, color: P["ink-3"] })
    font(ctx, 27)
    let d = v.description
    while (ctx.measureText(d).width > 860 && d.length > 10) d = d.slice(0, -2).trimEnd() + "…"
    if (d !== v.description) d = d.replace(/…+$/, "").replace(/[\s,]+$/, "") + "…"
    text(ctx, d, 300, y + 40, { ...o, size: 27, color: P.ink })
    text(ctx, v.result === "Passed" ? EN.passed : EN.failed, LEDGER_BAR.x0, y + 30, { ...o, size: 22, weight: 600, color: P.ink })
    text(ctx, `${v.yeas} yea  to  ${v.nays} nay`, X1, y + 30, { ...o, size: 22, color: P["ink-2"], align: "right" })
    rule(ctx, P, X0, X1, y + 68, P.rule, e.a * 0.8)
  })
}

// ------------------------------------------------------------------ 8. The end
export function lockupLayout(ctx) {
  const ts = 184
  const mr = 104
  const wT = width(ctx, "Tabled", { size: ts, weight: 600, family: SERIF, track: -0.02 })
  const wC = width(ctx, "Canada", { size: 62, weight: 500 })
  const markW = 2 * mr * 1.04
  const gap = 50, rg = 42
  const total = markW + gap + wT + rg * 2 + 2 + wC
  const x0 = 960 - total / 2
  const base = 540
  return { ts, mr, mx: x0 + markW / 2, my: base, tx: x0 + markW + gap, base, rx: x0 + markW + gap + wT + rg, cx: x0 + markW + gap + wT + rg * 2 + 2 }
}
export function drawEndCard(ctx, S, D, P, t) {
  const L = S.layout.lockup
  const w = ent(t, C.wordmark, null, 0.9)
  if (w.a > 0.003) text(ctx, "Tabled", L.tx, L.base + w.dy * 1.4, { size: L.ts, weight: 600, family: SERIF, color: P.ink, alpha: w.a, blur: w.blur * 1.3, track: -0.02 })
  const rg = expo(seg(t, C.canada, C.canada + 0.7))
  if (rg > 0.003) {
    ctx.fillStyle = css(P["rule-strong"], 0.6 * rg)
    const top = L.base - 128, bot = L.base + 6
    const mid = (top + bot) / 2
    ctx.fillRect(L.rx, lerp(mid, top, rg), 2, lerp(0, bot - top, rg))
  }
  const c = ent(t, C.canada + 0.15, null, 0.8)
  text(ctx, "Canada", L.cx, L.base - 4 + c.dy, { size: 62, weight: 500, color: P["ink-2"], alpha: c.a, blur: c.blur })
  const l = ent(t, C.line, null, 0.8)
  text(ctx, EN.endLine, 960, 690 + l.dy, { size: 44, color: P["ink-2"], alpha: l.a, blur: l.blur, align: "center" })
  const cr = ent(t, C.line + 0.5, null, 0.8)
  font(ctx, 21)
  wrap(ctx, EN.endCredit, 1250).forEach((ln, i) => text(ctx, ln, 960, 990 + i * 32 + cr.dy, { size: 21, color: P["ink-3"], alpha: cr.a, blur: cr.blur, align: "center" }))
}
