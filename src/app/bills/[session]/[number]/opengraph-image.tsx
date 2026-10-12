import { ogImage, OG_SIZE, truncate } from "@/lib/og"
import { allBillParams, getBill } from "@/lib/queries"
import { currentStageLabel } from "@/lib/stages"

export const size = OG_SIZE
export const contentType = "image/png"
export const alt = "Bill summary card"

export function generateStaticParams() {
  return allBillParams()
}

export default async function Image({ params }: { params: Promise<{ session: string; number: string }> }) {
  const { session, number } = await params
  const data = getBill(session, number)
  if (!data) return ogImage({ kicker: "Bill", title: "Bill not found" })
  const { bill, summary } = data
  return ogImage({
    kicker: `Bill ${bill.number} · ${bill.typeLabel}`,
    title: truncate(bill.shortTitleEn ?? bill.titleEn, 110),
    subtitle: summary ? truncate(summary.parsed.tldr, 160) : bill.shortTitleEn ? truncate(bill.titleEn, 140) : null,
    accent: currentStageLabel(bill.currentStage),
    footer: bill.sponsorName ? `Sponsor: ${bill.sponsorName}` : null,
  })
}
