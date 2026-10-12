import { mpFeed } from "@/lib/feeds"
import { allMemberParams } from "@/lib/queries"
import { rssResponse } from "@/lib/rss"

export function generateStaticParams() {
  return allMemberParams()
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const xml = mpFeed("fr", slug)
  return xml ? rssResponse(xml) : new Response("Not found", { status: 404 })
}
