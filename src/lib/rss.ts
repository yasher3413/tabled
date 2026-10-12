// Minimal RSS 2.0 builder. Every value is escaped; dates are calendar dates rendered at noon UTC.

export interface RssItem {
  title: string
  link: string
  guid: string
  date: string
  description: string
}

export interface RssChannel {
  title: string
  link: string
  selfLink: string
  description: string
  language: string
  items: RssItem[]
}

export function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")
}

export function rfc822(date: string): string {
  return new Date(`${date.slice(0, 10)}T12:00:00Z`).toUTCString()
}

export function buildRss(c: RssChannel): string {
  const newest = c.items.map((i) => i.date).sort().at(-1)
  const items = c.items
    .map(
      (i) => `    <item>
      <title>${escapeXml(i.title)}</title>
      <link>${escapeXml(i.link)}</link>
      <guid isPermaLink="false">${escapeXml(i.guid)}</guid>
      <pubDate>${rfc822(i.date)}</pubDate>
      <description>${escapeXml(i.description)}</description>
    </item>`,
    )
    .join("\n")
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(c.title)}</title>
    <link>${escapeXml(c.link)}</link>
    <atom:link href="${escapeXml(c.selfLink)}" rel="self" type="application/rss+xml"/>
    <description>${escapeXml(c.description)}</description>
    <language>${c.language}</language>${newest ? `\n    <lastBuildDate>${rfc822(newest)}</lastBuildDate>` : ""}
${items}
  </channel>
</rss>
`
}

export function rssResponse(xml: string): Response {
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } })
}
