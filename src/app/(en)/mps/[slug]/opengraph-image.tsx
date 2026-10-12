import { formatPercent, provinceName } from "@/lib/format"
import { ogImage, OG_SIZE } from "@/lib/og"
import { allMemberParams, getMember, partyMap } from "@/lib/queries"

export const size = OG_SIZE
export const contentType = "image/png"
export const alt = "MP profile card"

export function generateStaticParams() {
  return allMemberParams()
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = getMember(slug)
  if (!data) return ogImage({ kicker: "MP", title: "MP not found" })
  const m = data.member
  const party = m.partyId ? partyMap().get(m.partyId)?.nameEn : null
  return ogImage({
    kicker: [m.active ? "Member of Parliament" : "Former MP", party].filter(Boolean).join(" · "),
    title: m.name,
    subtitle: m.ridingName ? `${m.ridingName}, ${provinceName(m.province)}` : null,
    footer: `Voted with party ${formatPercent(m.partyLineRate)} · ${m.votesCast} of ${m.votesHeld} votes cast · ${m.billsSponsored} bills sponsored`,
  })
}
