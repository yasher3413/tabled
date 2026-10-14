// Problem reports from the /report form. Everything here is pure so it can be unit-tested; the route handler
// in src/app/api/report/route.ts does the I/O. Reports become PUBLIC GitHub issues, so nothing private (IP
// addresses, tokens) ever goes into one.
import { z } from "zod"
import { oneLine, REPORT_KINDS, sanitize, truncate } from "./report-link"
import { SITE_URL } from "./site"

export { fallbackIssueUrl, MAX_SCREENSHOT, REPORT_KINDS, sanitize, type ReportKind } from "./report-link"

export const MIN_FILL_MS = 3000

const siteHost = new URL(SITE_URL).host

/** A site path ("/bills/45-1/C-2?x=1"), or an absolute URL on this site reduced to its path and query. */
const pageField = z
  .string()
  .trim()
  .max(500)
  .transform((value, ctx) => {
    if (value === "") return "/"
    if (value.startsWith("/") && !value.startsWith("//")) return value
    try {
      const u = new URL(value)
      if (u.host === siteHost && (u.protocol === "https:" || u.protocol === "http:")) return `${u.pathname}${u.search}`
    } catch {}
    ctx.addIssue({ code: "custom", message: "page" })
    return z.NEVER
  })

export const reportSchema = z.object({
  description: z.string().trim().min(10).max(4000),
  page: pageField,
  kind: z.enum(REPORT_KINDS).default("bug"),
  email: z.union([z.literal(""), z.email().max(254)]).optional(),
  locale: z.enum(["en", "fr"]).default("en"),
  website: z.string().max(200).optional(),
  elapsed: z.coerce.number().int().nonnegative(),
  viewport: z
    .string()
    .regex(/^\d{2,5}x\d{2,5}$/)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  subject: z.string().trim().max(120).optional(),
})

export type ReportInput = z.output<typeof reportSchema>

export interface BuiltIssue {
  title: string
  body: string
  labels: string[]
}

export function buildIssue(input: ReportInput, extra: { userAgent?: string | null; screenshotUrl?: string | null } = {}): BuiltIssue {
  const description = sanitize(input.description)
  const subject = input.subject ? oneLine(input.subject) : ""
  const title = truncate(`Report: ${subject || truncate(oneLine(input.description), 60)}`, 80)
  const pageUrl = new URL(input.page, SITE_URL).toString()
  const lines = [
    `**Page:** ${pageUrl}`,
    `**Kind:** ${input.kind === "data" ? "data error" : "bug"}`,
    `**Language:** ${input.locale}`,
    ...(input.viewport ? [`**Viewport:** ${input.viewport}`] : []),
    ...(extra.userAgent ? [`**Browser:** \`${truncate(oneLine(extra.userAgent).replace(/`/g, ""), 200)}\``] : []),
    "",
    description
      .split("\n")
      .map((l) => `> ${l}`)
      .join("\n"),
    ...(extra.screenshotUrl ? ["", `![Screenshot](${extra.screenshotUrl})`] : []),
    ...(input.email ? ["", `**Contact:** ${input.email}`] : []),
    "",
    "---",
    "Filed from the Tabled report form.",
  ]
  return { title, body: lines.join("\n"), labels: ["user-report", input.kind === "data" ? "data-error" : "bug"] }
}

export type ImageType = "png" | "jpeg" | "webp" | "gif"

/** Identify an image by its first bytes. Anything else (SVG, HTML, PDF) is refused. */
export function sniffImage(b: Uint8Array): ImageType | null {
  const at = (i: number, ...bytes: number[]) => bytes.every((x, j) => b[i + j] === x)
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "png"
  if (at(0, 0xff, 0xd8, 0xff)) return "jpeg"
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return "webp"
  if (at(0, 0x47, 0x49, 0x46, 0x38) && (b[4] === 0x37 || b[4] === 0x39) && b[5] === 0x61) return "gif"
  return null
}

/** Best-effort fixed-window limiter. On serverless each instance has its own memory, so this is a speed bump. */
export function createRateLimiter({ limit, windowMs, now = Date.now }: { limit: number; windowMs: number; now?: () => number }) {
  const hits = new Map<string, number[]>()
  return function allow(key: string): boolean {
    const t = now()
    const recent = (hits.get(key) ?? []).filter((x) => t - x < windowMs)
    if (recent.length >= limit) {
      hits.set(key, recent)
      return false
    }
    recent.push(t)
    hits.set(key, recent)
    if (hits.size > 5000) hits.clear() // never grow without bound
    return true
  }
}
