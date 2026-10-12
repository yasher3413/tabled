// Finds and prepares the grounding text for a bill summary.
import { createHash } from "node:crypto"

export type SourceBasis = "legislative_summary" | "full_text" | "legisinfo"

export interface BillPart {
  heading: string
  text: string
}

export interface BillText {
  summary: string | null
  parts: BillPart[]
  fullText: string
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " }

function decode(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)
}

/** XML fragment to readable text: block elements become line breaks, labels are kept. */
export function xmlToText(xml: string): string {
  return decode(
    xml
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<(HistoricalNote|FootnoteRef|BillHistory|RunningHead|BillRefNumber)\b[\s\S]*?<\/\1>/g, "")
      .replace(/<\/(Heading|Text|Provision|Section|Subsection|Paragraph|Subparagraph|Definition|MarginalNote|TitleText|Item)>/g, "$&\n")
      .replace(/<Label>([^<]*)<\/Label>/g, "$1 ")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/** Pull the drafters' summary and the body split into top-level parts. */
export function extractBillText(xml: string): BillText {
  const summaryMatch = /<Summary>([\s\S]*?)<\/Summary>/.exec(xml)
  const summary = summaryMatch ? xmlToText(summaryMatch[1]).replace(/^SUMMARY\s*/i, "").trim() || null : null
  const bodyMatch = /<Body>([\s\S]*?)<\/Body>/.exec(xml)
  const body = bodyMatch ? bodyMatch[1] : xml
  const starts: number[] = []
  const re = /<Heading level="1"/g
  for (let m = re.exec(body); m; m = re.exec(body)) starts.push(m.index)
  const parts: BillPart[] = []
  if (starts.length === 0) {
    parts.push({ heading: "Full text", text: xmlToText(body) })
  } else {
    if (starts[0] > 0) parts.push({ heading: "Preamble", text: xmlToText(body.slice(0, starts[0])) })
    starts.forEach((start, i) => {
      const chunk = body.slice(start, starts[i + 1] ?? body.length)
      const headingXml = /<Heading level="1">([\s\S]*?)<\/Heading>/.exec(chunk)?.[1] ?? ""
      const heading = xmlToText(headingXml.replace(/<MarginalNote>[\s\S]*?<\/MarginalNote>/g, "")).replace(/\n+/g, " ").trim()
      parts.push({ heading: heading || `Part ${i + 1}`, text: xmlToText(chunk) })
    })
  }
  const nonEmpty = parts.filter((p) => p.text.length > 0)
  return { summary, parts: nonEmpty, fullText: nonEmpty.map((p) => p.text).join("\n\n") }
}

/** The bill viewer page links an XML rendition; return its absolute URL. */
export function findXmlUrl(viewerHtml: string): string | null {
  const m = /href="([^"]+_E\.xml)"/i.exec(viewerHtml) ?? /href="([^"]+\.xml)"/i.exec(viewerHtml)
  if (!m) return null
  return m[1].startsWith("http") ? m[1] : `https://www.parl.ca${m[1].startsWith("/") ? "" : "/"}${m[1]}`
}

/** Merge consecutive small parts so each chunk is near the target size. */
export function chunkParts(parts: BillPart[], targetChars: number): BillPart[] {
  const out: BillPart[] = []
  for (const p of parts) {
    const last = out[out.length - 1]
    if (last && last.text.length + p.text.length < targetChars) {
      out[out.length - 1] = { heading: `${last.heading}; ${p.heading}`, text: `${last.text}\n\n${p.text}` }
    } else out.push(p)
  }
  return out
}

export function hashSource(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 32)
}

/** Minimum characters for a LEGISinfo summary to count as a real grounding source rather than a stub. */
export const MIN_LEGISLATIVE_SUMMARY = 350
