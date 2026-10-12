import { describe, expect, it } from "vitest"
import { fixtureText } from "../../tests/helpers/fixtures"
import { chunkParts, extractBillText, findXmlUrl, hashSource, xmlToText } from "./source"

describe("bill XML extraction", () => {
  const text = extractBillText(fixtureText("legisinfo/bill-text-C-4.xml"))

  it("pulls the drafters' summary", () => {
    expect(text.summary).toMatch(/^Part 1 amends the Income Tax Act/)
    expect(text.summary).toMatch(/Part 4 amends the Canada Elections Act/)
  })

  it("splits the body into its parts with readable headings", () => {
    const headings = text.parts.map((p) => p.heading)
    expect(headings).toContain("Short Title")
    expect(headings.some((h) => /^PART 1 Income Tax Act/.test(h))).toBe(true)
    expect(headings.filter((h) => h.startsWith("PART"))).toHaveLength(4)
    expect(text.fullText).toMatch(/This Act may be cited as the Making Life More Affordable for Canadians Act/)
    expect(text.fullText).not.toMatch(/<[A-Z]/)
  })

  it("decodes entities and drops historical notes", () => {
    expect(xmlToText("<Text>A &amp; B&#8217;s</Text><HistoricalNote>R.S., c. 1</HistoricalNote>")).toBe("A & B’s")
  })

  it("merges small parts into chunks near a target size", () => {
    const chunks = chunkParts(text.parts, 1_000_000)
    expect(chunks).toHaveLength(1)
    expect(chunkParts(text.parts, 10).length).toBe(text.parts.length)
  })
})

describe("findXmlUrl", () => {
  it("finds the XML rendition on a viewer page", () => {
    const html = '<a href="/Content/Bills/451/Government/C-4/C-4_1/C-4_1.PDF">PDF</a><a href="/Content/Bills/451/Government/C-4/C-4_1/C-4_E.xml">XML</a>'
    expect(findXmlUrl(html)).toBe("https://www.parl.ca/Content/Bills/451/Government/C-4/C-4_1/C-4_E.xml")
    expect(findXmlUrl("<p>none</p>")).toBeNull()
  })
})

describe("hashSource", () => {
  it("is stable and changes with the text", () => {
    expect(hashSource("abc")).toBe(hashSource("abc"))
    expect(hashSource("abc")).not.toBe(hashSource("abd"))
  })
})
