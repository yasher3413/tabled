import { formatDate } from "@/lib/format"
import { ogImage, OG_SIZE, truncate } from "@/lib/og"
import { allVoteParams, getVote } from "@/lib/queries"

export const size = OG_SIZE
export const contentType = "image/png"
export const alt = "Recorded vote result card"

export function generateStaticParams() {
  return allVoteParams()
}

export default async function Image({ params }: { params: Promise<{ session: string; number: string }> }) {
  const { session, number } = await params
  const data = getVote(session, Number(number))
  if (!data) return ogImage({ kicker: "Vote", title: "Vote not found" })
  const v = data.vote
  return ogImage({
    kicker: `Recorded vote ${v.number} · ${formatDate(v.date)}`,
    title: truncate(v.descriptionEn, 120),
    accent: v.result === "passed" ? "Passed" : v.result === "failed" ? "Failed" : "Tied",
    footer: `${v.yeas} yea to ${v.nays} nay${v.paired ? ` · ${v.paired} paired` : ""}`,
  })
}
