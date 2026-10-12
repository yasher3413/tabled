import type { MetadataRoute } from "next"
import { localePath } from "@/i18n/config"
import { getDataDate, listBills, listMembers, listVotes } from "@/lib/queries"
import { SITE_URL } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const updated = getDataDate()
  // Every page exists in English and French; each entry lists its counterpart as an alternate.
  const page = (path: string, lastModified: string = updated, priority = 0.5): MetadataRoute.Sitemap => {
    const languages = { "en-CA": `${SITE_URL}${localePath("en", path)}`, "fr-CA": `${SITE_URL}${localePath("fr", path)}` }
    return [
      { url: languages["en-CA"], lastModified, priority, alternates: { languages } },
      { url: languages["fr-CA"], lastModified, priority: Math.max(0.1, priority - 0.1), alternates: { languages } },
    ]
  }
  return [
    ...page("/", updated, 1),
    ...page("/bills", updated, 0.9),
    ...page("/votes", updated, 0.8),
    ...page("/mps", updated, 0.8),
    ...page("/parties", updated, 0.6),
    ...page("/find", updated, 0.6),
    ...page("/about", updated, 0.4),
    ...listBills().flatMap((b) => page(`/bills/${b.sessionId}/${b.number}`, b.lastActivityDate ?? updated, 0.7)),
    ...listVotes().flatMap((v) => page(`/votes/${v.sessionId}/${v.number}`, v.date, 0.5)),
    ...listMembers().flatMap((m) => page(`/mps/${m.id}`, updated, m.active ? 0.6 : 0.3)),
  ]
}
