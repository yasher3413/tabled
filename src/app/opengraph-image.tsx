import { ogImage, OG_SIZE } from "@/lib/og"
import { houseComposition } from "@/lib/queries"

export const size = OG_SIZE
export const contentType = "image/png"
export const alt = "Tabled: every federal bill, vote and MP, in plain English"

export default async function Image() {
  const h = houseComposition()
  return ogImage({
    kicker: "House of Commons tracker",
    title: "What Parliament is doing, in plain English.",
    subtitle: "Every federal bill, every recorded House vote and every MP.",
    footer: `${h.seatsTotal} seats · ${h.parties.map((p) => `${p.shortName} ${p.seatCount}`).join(" · ")}`,
  })
}
