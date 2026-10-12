// Generates plain-English bill summaries and caches them in data/summaries/<session>/<bill>.json.
//   pnpm summarize                 all bills with a valid source, government bills and recent activity first
//   pnpm summarize -- --limit 10   at most 10 new summaries this run
//   pnpm summarize -- --bill C-39  one bill (regenerates if its source changed)
//   pnpm summarize -- --dry-run    show what would be generated, no API calls
import "dotenv/config"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import Database from "better-sqlite3"
import { z } from "zod"
import { fetchText } from "../ingest/http"
import { createLlm, pickModel, pickProvider, type Llm } from "./llm"
import { BASIS_DESCRIPTION, billContext, PART_NOTES_PROMPT, SYSTEM_PROMPT } from "./prompt"
import { chunkParts, extractBillText, findXmlUrl, hashSource, MIN_LEGISLATIVE_SUMMARY, type SourceBasis } from "./source"
import { validateSummary } from "./validator"

const DB_PATH = path.join(process.cwd(), "data", "tabled.db")
const OUT_ROOT = path.join(process.cwd(), "data", "summaries")
/** Above this many characters of source, summarize part by part and then synthesize. */
const SINGLE_CALL_CHARS = 240_000
const CHUNK_TARGET_CHARS = 160_000
/** Per-bill cap on part-by-part calls; beyond it the summary says which parts it covers. */
const MAX_CHUNKS = 8
const MAX_ATTEMPTS = 3 // first try plus two retries
const CONCURRENCY = 3

const args = process.argv.slice(2)
const flag = (name: string) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}
const dryRun = args.includes("--dry-run")
const onlyBill = flag("--bill")?.toUpperCase()
const limit = flag("--limit") ? Number(flag("--limit")) : Infinity

const ModelOutput = z.object({
  tldr: z.string(),
  what_it_does: z.array(z.string()),
  who_it_affects: z.array(z.string()),
  background: z.string().nullable(),
  topics: z.array(z.string()),
})
const PartNotes = z.object({ changes: z.array(z.string()) })

interface BillRow {
  id: string
  session_id: string
  number: string
  title_en: string
  short_title_en: string | null
  type: string
  type_label: string
  sponsor_name: string | null
  sponsor_title: string | null
  chamber: string
  is_pro_forma: number
  legisinfo_summary_text: string | null
  text_url: string | null
  text_publication_id: number | null
  legisinfo_url: string
  last_activity_date: string | null
}

interface Source {
  basis: SourceBasis
  text: string
  url: string
  parts?: { heading: string; text: string }[]
}

async function gatherSource(b: BillRow): Promise<Source | null> {
  if (b.legisinfo_summary_text && b.legisinfo_summary_text.length >= MIN_LEGISLATIVE_SUMMARY) {
    return { basis: "legislative_summary", text: b.legisinfo_summary_text, url: b.legisinfo_url }
  }
  if (b.text_url) {
    try {
      // Bill publications never change once published, so the cache never expires.
      const viewer = await fetchText(b.text_url, { maxAgeMs: Infinity })
      const xmlUrl = findXmlUrl(viewer)
      if (xmlUrl) {
        const bill = extractBillText(await fetchText(xmlUrl, { maxAgeMs: Infinity }))
        const text = [bill.summary ? `SUMMARY (written by the bill's drafters)\n${bill.summary}` : null, bill.fullText].filter(Boolean).join("\n\n")
        if (text.length > 200) return { basis: "full_text", text, url: b.text_url, parts: bill.parts }
      }
    } catch (err) {
      console.warn(`  ${b.number}: bill text unavailable (${String(err)})`)
    }
  }
  if (b.legisinfo_summary_text) {
    return { basis: "legisinfo", text: b.legisinfo_summary_text, url: b.legisinfo_url }
  }
  return null // title only: never summarize from a title
}

async function partNotes(llm: Llm, b: BillRow, parts: { heading: string; text: string }[]): Promise<{ notes: string; coverage: string | null }> {
  const chunks = chunkParts(parts, CHUNK_TARGET_CHARS)
  const used = chunks.slice(0, MAX_CHUNKS)
  const notes: string[] = []
  for (const chunk of used) {
    const out = await llm.callStructured(PartNotes, "part_notes", PART_NOTES_PROMPT, `${billContext(toCtx(b))}\n\nPart: ${chunk.heading}\n\n<source>\n${chunk.text}\n</source>`, 2000)
    if (out?.changes.length) notes.push(`${chunk.heading}:\n${out.changes.map((c) => `- ${c}`).join("\n")}`)
  }
  const coverage =
    chunks.length > used.length ? `This summary covers ${used.map((c) => c.heading).join("; ")} of a longer bill.` : null
  return { notes: notes.join("\n\n"), coverage }
}

function toCtx(b: BillRow) {
  return {
    number: b.number,
    titleEn: b.title_en,
    shortTitleEn: b.short_title_en,
    typeLabel: b.type_label,
    sponsorName: b.sponsor_name,
    sponsorTitle: b.sponsor_title,
    chamber: b.chamber,
  }
}

async function summarize(llm: Llm, b: BillRow, src: Source) {
  let sourceText = src.text
  let coverage: string | null = null
  let sourceLabel: string = BASIS_DESCRIPTION[src.basis]
  if (src.basis === "full_text" && src.text.length > SINGLE_CALL_CHARS && src.parts) {
    const n = await partNotes(llm, b, src.parts)
    const drafters = /^SUMMARY \(written by the bill's drafters\)\n([\s\S]*?)\n\n/.exec(src.text)?.[1]
    sourceText = [drafters ? `Drafters' summary:\n${drafters}` : null, `Notes on each part:\n${n.notes}`].filter(Boolean).join("\n\n")
    sourceLabel = "the drafters' summary and notes on each part of the bill's official text"
    coverage = n.coverage
  }
  let feedback = ""
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const user = `${billContext(toCtx(b))}\n\nThe source below is ${sourceLabel}. Summarize the bill using only this source.\n\n<source>\n${sourceText}\n</source>${feedback}`
    const out = await llm.callStructured(ModelOutput, "bill_summary", SYSTEM_PROMPT, user, 2000)
    if (!out) {
      feedback = "\n\nYour previous answer was not valid JSON for the required fields. Try again."
      continue
    }
    const candidate = { ...out, background: out.background || null, source_basis: src.basis, coverage_note: coverage }
    const result = validateSummary(candidate, { sourceChars: src.text.length })
    if (result.ok) return result.summary!
    console.warn(`  ${b.number}: attempt ${attempt} rejected: ${result.errors.join(" | ")}`)
    feedback = `\n\nYour previous answer was rejected for these reasons. Fix every one:\n- ${result.errors.join("\n- ")}\n\nPrevious answer:\n${JSON.stringify(out)}`
  }
  return null
}

class AuthError extends Error {}

async function main() {
  if (!existsSync(DB_PATH)) throw new Error("data/tabled.db is missing; run pnpm ingest first")
  const picked = pickProvider()
  if (!dryRun && "reason" in picked) {
    console.log(`[summarize] ${picked.reason}; skipping. The site shows "summary coming soon" instead.`)
    return
  }
  const provider = "provider" in picked ? picked.provider : "anthropic"
  const llm = createLlm(provider, pickModel(provider, process.env.SUMMARY_MODEL))
  if (!dryRun) console.log(`[summarize] using ${llm.provider} (${llm.model})`)
  const db = new Database(DB_PATH)
  const bills = (db.prepare("SELECT * FROM bills").all() as BillRow[])
    .filter((b) => !b.is_pro_forma && (!onlyBill || b.number === onlyBill))
    // Government bills first, then most recent activity.
    .sort((a, b) => Number(b.type === "government") - Number(a.type === "government") || (b.last_activity_date ?? "").localeCompare(a.last_activity_date ?? ""))

  const upsert = db.prepare(`INSERT INTO summaries (bill_id, source_hash, model, generated_at, payload, source_basis, source_url)
    VALUES (@billId, @sourceHash, @model, @generatedAt, @payload, @sourceBasis, @sourceUrl)
    ON CONFLICT(bill_id) DO UPDATE SET source_hash=excluded.source_hash, model=excluded.model, generated_at=excluded.generated_at,
      payload=excluded.payload, source_basis=excluded.source_basis, source_url=excluded.source_url`)

  const counts = { generated: 0, unchanged: 0, noSource: 0, failed: 0 }
  let started = 0
  const queue = [...bills]
  async function worker() {
    for (let b = queue.shift(); b; b = queue.shift()) {
      const src = await gatherSource(b)
      if (!src) {
        counts.noSource++
        continue
      }
      const sourceHash = hashSource(`${src.basis}\n${src.text}`)
      const file = path.join(OUT_ROOT, b.session_id, `${b.number}.json`)
      if (existsSync(file)) {
        const cached = JSON.parse(readFileSync(file, "utf8")) as { sourceHash: string }
        if (cached.sourceHash === sourceHash) {
          counts.unchanged++
          continue
        }
      }
      if (started >= limit) continue
      started++
      if (dryRun) {
        console.log(`  would summarize ${b.number} from ${src.basis} (${src.text.length.toLocaleString()} chars)`)
        continue
      }
      try {
        const summary = await summarize(llm, b, src)
        if (!summary) {
          counts.failed++
          console.warn(`  ${b.number}: gave up after ${MAX_ATTEMPTS} attempts`)
          continue
        }
        const record = {
          billId: b.id,
          sourceHash,
          model: llm.model,
          generatedAt: new Date().toISOString(),
          sourceBasis: src.basis,
          sourceUrl: src.url,
          summary,
        }
        mkdirSync(path.dirname(file), { recursive: true })
        writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`)
        upsert.run({ ...record, payload: JSON.stringify(summary) })
        counts.generated++
        console.log(`  ${b.number}: ${summary.tldr}`)
      } catch (err) {
        counts.failed++
        if (llm.isAuthError(err)) throw new AuthError()
        console.warn(`  ${b.number}: ${llm.describeError(err)}`)
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  db.close()
  const { usage } = llm
  console.log(`[summarize] ${JSON.stringify(counts)} using ${llm.model}; ${usage.calls} calls, ${usage.input.toLocaleString()} input and ${usage.output.toLocaleString()} output tokens`)
}

main().catch((err) => {
  if (err instanceof AuthError) {
    // A bad key should not fail the daily refresh; the site works without summaries.
    console.warn("[summarize] The API key was rejected; skipping summaries. Check ANTHROPIC_API_KEY or OPENAI_API_KEY.")
    return
  }
  console.error(err)
  process.exit(1)
})
