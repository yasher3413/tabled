import { compactBallot } from "@/lib/compare"
import { allMemberParams, memberBallotMap } from "@/lib/queries"

export function generateStaticParams() {
  return allMemberParams()
}

/** Compact ballots for one MP: { "45-1/178": "y", ... }. Used by the compare page. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const map = memberBallotMap(slug)
  if (!map) return Response.json({ error: "Unknown MP" }, { status: 404 })
  return Response.json(Object.fromEntries(Object.entries(map).map(([k, v]) => [k, compactBallot(v)])))
}
