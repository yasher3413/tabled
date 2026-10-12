import { readFile } from "node:fs/promises"
import path from "node:path"
import { ImageResponse } from "next/og"
import { hemicycleLayout } from "./hemicycle"

export const OG_SIZE = { width: 1200, height: 630 }

const PAPER = "#f8f5ef"
const INK = "#24201b"
const INK_3 = "#6b6359"
const ACCENT = "#1f5e4c"
const RULE = "#d9d2c5"

async function fonts() {
  const dir = path.join(process.cwd(), "assets", "fonts")
  const [display, sans, sansBold] = await Promise.all([
    readFile(path.join(dir, "Brygada1918-SemiBold.ttf")),
    readFile(path.join(dir, "LibreFranklin-Regular.ttf")),
    readFile(path.join(dir, "LibreFranklin-SemiBold.ttf")),
  ])
  return [
    { name: "Brygada", data: display, weight: 600 as const, style: "normal" as const },
    { name: "Franklin", data: sans, weight: 400 as const, style: "normal" as const },
    { name: "Franklin", data: sansBold, weight: 600 as const, style: "normal" as const },
  ]
}

function Mark() {
  const { seats, radius } = hemicycleLayout(41, 4, 0.34)
  return (
    <svg width="44" height="24" viewBox="-1.08 -1.08 2.16 1.16">
      <g transform="scale(1,-1)">
        {seats.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={radius * 1.18} fill={INK} />
        ))}
      </g>
    </svg>
  )
}

export interface OgCard {
  kicker: string
  title: string
  subtitle?: string | null
  footer?: string | null
  accent?: string | null
}

/** Shared editorial card: masthead, record label, large serif title, quiet footer line. */
export async function ogImage(card: OgCard) {
  const titleSize = card.title.length > 90 ? 52 : card.title.length > 60 ? 62 : 74
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: PAPER, padding: "56px 72px", fontFamily: "Franklin", color: INK }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 22, borderBottom: `2px solid ${INK}` }}>
          <Mark />
          <div style={{ fontFamily: "Brygada", fontSize: 34, fontWeight: 600 }}>Tabled</div>
          <div style={{ marginLeft: "auto", fontSize: 22, color: INK_3 }}>Parliament of Canada, in plain English</div>
        </div>
        <div style={{ display: "flex", marginTop: 40, fontSize: 26, color: INK_3 }}>{card.kicker}</div>
        <div style={{ display: "flex", marginTop: 14, fontFamily: "Brygada", fontWeight: 600, fontSize: titleSize, lineHeight: 1.06, letterSpacing: -1.5 }}>
          {card.title}
        </div>
        {card.subtitle && <div style={{ display: "flex", marginTop: 22, fontSize: 28, lineHeight: 1.35, color: INK_3, maxWidth: 1000 }}>{card.subtitle}</div>}
        <div style={{ display: "flex", marginTop: "auto", paddingTop: 20, borderTop: `1px solid ${RULE}`, fontSize: 24, color: INK_3, alignItems: "center" }}>
          {card.accent && <div style={{ display: "flex", color: ACCENT, fontWeight: 600, marginRight: 18 }}>{card.accent}</div>}
          <div style={{ display: "flex" }}>{card.footer ?? ""}</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts() },
  )
}

export function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s
}
