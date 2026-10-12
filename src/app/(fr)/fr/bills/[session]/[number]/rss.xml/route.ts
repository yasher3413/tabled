import { billFeed } from "@/lib/feeds"
import { allBillParams } from "@/lib/queries"
import { rssResponse } from "@/lib/rss"

export function generateStaticParams() {
  return allBillParams()
}

export async function GET(_req: Request, { params }: { params: Promise<{ session: string; number: string }> }) {
  const { session, number } = await params
  const xml = billFeed("fr", session, number)
  return xml ? rssResponse(xml) : new Response("Not found", { status: 404 })
}
