// draw(t): the whole film as one pure function of time.
import { C, DURATION } from "./cues.js"
import { setupChamber, drawChamber, drawBend } from "./chamber.js"
import { drawHeader, drawHome, drawFind, drawVote, drawMp, drawBill, drawLedger, drawEndCard, billLayout, lockupLayout } from "./pages.js"
import { spring, track } from "./lib/motion.js"
import { css } from "./lib/color.js"

export const W = 1920
export const H = 1080

export function setup(ctx, D) {
  const layout = { avatar: { x: 230, y: 300, r: 80 }, ...billLayout(), lockup: lockupLayout(ctx) }
  return { D, P: D.colors, S: setupChamber(D, layout) }
}

function background(ctx, P) {
  ctx.fillStyle = P.paper
  ctx.fillRect(0, 0, W, H)
}

let vignette = null
function drawVignette(ctx) {
  if (!vignette) {
    vignette = ctx.createRadialGradient(W / 2, H * 0.48, H * 0.35, W / 2, H * 0.5, H * 1.05)
    vignette.addColorStop(0, "rgba(6,4,2,0)")
    vignette.addColorStop(1, "rgba(6,4,2,0.38)")
  }
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, W, H)
}

export function draw(ctx, F, t) {
  const { D, P, S } = F
  t = Math.max(0, Math.min(DURATION - 1e-6, t))
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.filter = "none"
  ctx.globalAlpha = 1
  background(ctx, P)
  // A slow pull back on the opening; still everywhere else.
  const cam = track(t, [[0, 1.075], [0.01, 1.0, 2.8]])
  ctx.setTransform(cam, 0, 0, cam, (W / 2) * (1 - cam), (H / 2) * (1 - cam))
  if (t < C.find + 0.6) drawHome(ctx, S, D, P, t)
  if (t > C.hero && t < C.vote + 0.2) drawFind(ctx, S, D, P, t)
  if (t > C.title - 0.2 && t < C.mp + 0.3) drawVote(ctx, S, D, P, t)
  if (t > C.mp && t < C.mpOut + 0.5) drawMp(ctx, S, D, P, t)
  if (t > C.billHead - 0.1 && t < C.billOut + 0.6) drawBill(ctx, S, D, P, t)
  if (t > C.ledger - 0.1 && t < C.pull + 0.8) drawLedger(ctx, S, D, P, t)
  drawBend(ctx, S, D, P, t)
  drawChamber(ctx, S, D, P, t)
  if (t > C.wordmark - 0.1) drawEndCard(ctx, S, D, P, t)
  drawHeader(ctx, S, D, P, t)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  drawVignette(ctx)
}
