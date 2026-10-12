import type { MetadataRoute } from "next"
import { getDataDate, listBills, listMembers, listVotes } from "@/lib/queries"
import { SITE_URL } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const updated = getDataDate()
  const page = (path: string, lastModified: string = updated, priority = 0.5): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    priority,
  })
  return [
    page("/", updated, 1),
    page("/bills", updated, 0.9),
    page("/votes", updated, 0.8),
    page("/mps", updated, 0.8),
    page("/parties", updated, 0.6),
    page("/find", updated, 0.6),
    page("/about", updated, 0.4),
    ...listBills().map((b) => page(`/bills/${b.sessionId}/${b.number}`, b.lastActivityDate ?? updated, 0.7)),
    ...listVotes().map((v) => page(`/votes/${v.sessionId}/${v.number}`, v.date, 0.5)),
    ...listMembers().map((m) => page(`/mps/${m.id}`, updated, m.active ? 0.6 : 0.3)),
  ]
}
