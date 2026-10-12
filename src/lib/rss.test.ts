import { describe, expect, it } from "vitest"
import { buildRss, escapeXml, rfc822 } from "./rss"

describe("rss", () => {
  it("escapes XML special characters", () => {
    expect(escapeXml(`<a href="x">R&D's</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;R&amp;D&apos;s&lt;/a&gt;")
  })
  it("renders dates as RFC 822", () => {
    expect(rfc822("2026-10-08")).toBe("Thu, 08 Oct 2026 12:00:00 GMT")
  })
  it("builds a valid channel with items and a self link", () => {
    const xml = buildRss({
      title: "Bill C-39",
      link: "https://example.org/bills/45-1/C-39",
      selfLink: "https://example.org/bills/45-1/C-39/rss.xml",
      description: "Updates",
      language: "en-CA",
      items: [{ title: "Passed second reading (House)", link: "https://example.org/x", guid: "45-1/C-39:house:second-reading", date: "2026-10-08", description: "C-39 & more" }],
    })
    expect(xml).toContain("<rss version=\"2.0\"")
    expect(xml).toContain('<atom:link href="https://example.org/bills/45-1/C-39/rss.xml" rel="self"')
    expect(xml).toContain("<description>C-39 &amp; more</description>")
    expect(xml).toContain("<lastBuildDate>Thu, 08 Oct 2026 12:00:00 GMT</lastBuildDate>")
  })
})
