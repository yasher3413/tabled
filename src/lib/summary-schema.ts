import { z } from "zod"

export const SOURCE_BASIS = ["legislative_summary", "full_text", "legisinfo"] as const

/** Shape of a plain-English bill summary. Content rules (ban list, word counts) live in the summarizer's validator. */
export const SummarySchema = z.object({
  tldr: z.string().min(1),
  what_it_does: z.array(z.string().min(1)).min(3).max(6),
  who_it_affects: z.array(z.string().min(1)).min(1).max(8),
  background: z.string().optional().nullable(),
  source_basis: z.enum(SOURCE_BASIS),
  coverage_note: z.string().optional().nullable(),
})

export type Summary = z.infer<typeof SummarySchema>

export function parseSummary(json: string | null | undefined): Summary | null {
  if (!json) return null
  try {
    const result = SummarySchema.safeParse(JSON.parse(json))
    return result.success ? result.data : null
  } catch {
    return null
  }
}

export const SOURCE_BASIS_LABEL: Record<(typeof SOURCE_BASIS)[number], string> = {
  legislative_summary: "LEGISinfo legislative summary",
  full_text: "full text of the bill",
  legisinfo: "LEGISinfo bill record",
}
