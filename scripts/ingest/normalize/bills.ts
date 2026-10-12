import type { LIBill, LIStage } from "../types"

export type BillType = "government" | "private_member" | "senate_public" | "senate_private"
export type StageState = "completed" | "in_progress" | "not_reached" | "defeated" | "skipped"
export type Chamber = "house" | "senate"

export interface NormalizedStage {
  ordinal: number
  chamber: Chamber | "crown"
  stageKey: string
  stageName: string
  state: StageState
  date: string | null
}

const STAGE_SLUGS: Record<string, string> = {
  "first reading": "first-reading",
  "second reading": "second-reading",
  "consideration in committee": "committee",
  "report stage": "report",
  "third reading": "third-reading",
  "royal assent": "royal-assent",
}

const CANONICAL: Record<Chamber, { slug: string; name: string }[]> = {
  house: [
    { slug: "first-reading", name: "First reading" },
    { slug: "second-reading", name: "Second reading" },
    { slug: "committee", name: "Consideration in committee" },
    { slug: "report", name: "Report stage" },
    { slug: "third-reading", name: "Third reading" },
  ],
  senate: [
    { slug: "first-reading", name: "First reading" },
    { slug: "second-reading", name: "Second reading" },
    { slug: "committee", name: "Consideration in committee" },
    { slug: "third-reading", name: "Third reading" },
  ],
}

export function stageSlug(name: string): string {
  const key = name.trim().toLowerCase()
  return STAGE_SLUGS[key] ?? key.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

export function billType(typeName: string): BillType {
  const t = typeName.toLowerCase()
  if (t.includes("government")) return "government"
  if (t.includes("private member")) return "private_member"
  if (t.includes("senate private")) return "senate_private"
  if (t.includes("senate public")) return "senate_public"
  throw new Error(`Unknown bill type: ${typeName}`)
}

export const BILL_TYPE_LABELS: Record<BillType, string> = {
  government: "Government bill",
  private_member: "Private member's bill",
  senate_public: "Senate public bill",
  senate_private: "Senate private bill",
}

/** LEGISinfo timestamps are Ottawa local time with no zone; we keep the calendar date. */
export function toDate(value: string | null | undefined): string | null {
  if (!value) return null
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(value)
  return m ? m[1] : null
}

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;/g, "’")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim()
}

const PLACEHOLDER = /^A legislative summary is currently being prepared[^.]*\.\s*(Meanwhile, the following executive summary is available\.)?/i

/** Executive summary text from LEGISinfo, without the "being prepared" boilerplate. */
export function cleanLegisinfoSummary(html: string | null): string | null {
  if (!html) return null
  const text = stripHtml(html).replace(PLACEHOLDER, "").trim()
  return text.length >= 80 ? text : null
}

function mapState(raw: string | null): StageState | "pending" {
  switch ((raw ?? "").toLowerCase()) {
    case "completed":
      return "completed"
    case "not completed":
      return "defeated"
    default:
      return "pending"
  }
}

function chamberStages(chamber: Chamber, raw: LIStage[]) {
  const bySlug = new Map(raw.map((s) => [stageSlug(s.BillStageNameEn), s]))
  const slugs = CANONICAL[chamber].map((c) => c.slug)
  // Keep any extra stages LEGISinfo reports (e.g. Senate report stage) in their reported order.
  for (const s of raw) {
    const slug = stageSlug(s.BillStageNameEn)
    if (!slugs.includes(slug)) {
      const idx = raw.indexOf(s)
      const prev = idx > 0 ? stageSlug(raw[idx - 1].BillStageNameEn) : null
      const at = prev ? slugs.indexOf(prev) + 1 : slugs.length
      slugs.splice(at > 0 ? at : slugs.length, 0, slug)
    }
  }
  return slugs.map((slug) => {
    const src = bySlug.get(slug)
    const canonical = CANONICAL[chamber].find((c) => c.slug === slug)
    return {
      chamber,
      stageKey: `${chamber}:${slug}`,
      stageName: src?.BillStageNameEn ?? canonical?.name ?? slug,
      raw: mapState(src?.StateNameEn ?? null),
      date: toDate(src?.StateAsOfDate),
    }
  })
}

/** Ordered stages across both chambers plus royal assent, with exactly one current stage when the bill is live. */
export function normalizeStages(bill: LIBill): NormalizedStage[] {
  const origin: Chamber = bill.IsSenateBill ? "senate" : "house"
  const other: Chamber = origin === "house" ? "senate" : "house"
  const bs = bill.BillStages
  const pick = (c: Chamber) => (c === "house" ? (bs?.HouseBillStages ?? []) : (bs?.SenateBillStages ?? []))
  const raSrc = bs?.RoyalAssent?.[0]
  const rows = [
    ...chamberStages(origin, pick(origin)),
    ...chamberStages(other, pick(other)),
    {
      chamber: "crown" as const,
      stageKey: "crown:royal-assent",
      stageName: "Royal assent",
      raw: bill.ReceivedRoyalAssent ? ("completed" as const) : ("pending" as const),
      date:
        toDate(bill.ReceivedRoyalAssentDateTime) ?? toDate(raSrc?.Sittings?.[0]?.Date) ?? null,
    },
  ]
  const isDefeated = rows.some((r) => r.raw === "defeated")
  let lastCompleted = -1
  rows.forEach((r, i) => {
    if (r.raw === "completed") lastCompleted = i
  })
  const live = !bill.ReceivedRoyalAssent && !isDefeated && !bill.IsProForma
  return rows.map((r, i) => {
    let state: StageState
    if (r.raw === "completed") state = "completed"
    else if (r.raw === "defeated") state = "defeated"
    else if (i < lastCompleted) state = "skipped" // a later stage completed, so this one was bypassed
    else if (live && i === lastCompleted + 1) state = "in_progress"
    else state = "not_reached"
    return {
      ordinal: i,
      chamber: r.chamber,
      stageKey: r.stageKey,
      stageName: r.stageName,
      state,
      date: state === "not_reached" || state === "skipped" ? null : r.date,
    }
  })
}

export function currentStage(stages: NormalizedStage[], bill: LIBill) {
  if (bill.ReceivedRoyalAssent) return { key: "crown:royal-assent", chamber: "crown" }
  const defeated = stages.find((s) => s.state === "defeated")
  if (defeated) return { key: "defeated", chamber: defeated.chamber }
  const current = stages.find((s) => s.state === "in_progress")
  if (current) return { key: current.stageKey, chamber: current.chamber }
  const done = stages.filter((s) => s.state === "completed")
  const last = done[done.length - 1]
  return last ? { key: last.stageKey, chamber: last.chamber } : { key: "introduced", chamber: null }
}

export function legislativeSummaryUrl(bill: LIBill): string | null {
  if (!bill.IsFullLegislativeSummaryAvailable) return null
  const prefix = bill.NumberCode.split("-")[0]
  return `https://lop.parl.ca/sites/PublicWebsite/default/en_CA/ResearchPublications/LegislativeSummaries/${bill.ParliamentNumber}${bill.SessionNumber}${prefix}${bill.Number}E`
}

export function latestPublication(bill: LIBill) {
  const pubs = bill.Publications ?? []
  return pubs.length ? pubs[pubs.length - 1] : null
}

export function normalizeBill(bill: LIBill, now: string) {
  const sessionId = `${bill.ParliamentNumber}-${bill.SessionNumber}`
  const stages = normalizeStages(bill)
  const current = currentStage(stages, bill)
  const type = billType(bill.BillDocumentTypeNameEn)
  const stageDates = stages.map((s) => s.date).filter((d): d is string => !!d)
  const activityDates = [
    toDate(bill.LatestBillEventDateTime),
    toDate(bill.LatestCompletedBillStageDateTime),
    ...stageDates,
  ].filter((d): d is string => !!d)
  const lastActivityDate = activityDates.sort().at(-1) ?? null
  const pub = latestPublication(bill)
  const [prefix, num] = bill.NumberCode.split("-")
  return {
    bill: {
      id: `${sessionId}/${bill.NumberCode}`,
      sessionId,
      number: bill.NumberCode,
      numberPrefix: prefix,
      numberInt: Number(num),
      titleEn: bill.LongTitleEn,
      titleFr: bill.LongTitleFr || null,
      shortTitleEn: bill.ShortTitleEn || null,
      shortTitleFr: bill.ShortTitleFr || null,
      chamber: (bill.IsSenateBill ? "senate" : "house") as Chamber,
      type,
      typeLabel: BILL_TYPE_LABELS[type],
      sponsorName: bill.SponsorPersonName || null,
      sponsorTitle: bill.SponsorAffiliationTitleEn || null,
      introducedDate:
        toDate(bill.IsSenateBill ? bill.PassedSenateFirstReadingDateTime : bill.PassedHouseFirstReadingDateTime) ??
        stages.find((s) => s.date)?.date ??
        null,
      currentStage: current.key,
      currentStageChamber: current.chamber,
      statusEn: bill.StatusNameEn,
      statusFr: bill.StatusNameFr || null,
      isLaw: bill.ReceivedRoyalAssent,
      isDefeated: current.key === "defeated",
      isProForma: bill.IsProForma,
      royalAssentDate: toDate(bill.ReceivedRoyalAssentDateTime),
      statuteChapter:
        bill.StatuteYear && bill.StatuteChapter ? `S.C. ${bill.StatuteYear}, c. ${bill.StatuteChapter}` : null,
      legisinfoId: bill.Id,
      legisinfoUrl: `https://www.parl.ca/legisinfo/en/bill/${sessionId}/${bill.NumberCode}`,
      textUrl: pub ? `https://www.parl.ca/DocumentViewer/en/${pub.PublicationId}` : null,
      textPublicationId: pub?.PublicationId ?? null,
      legislativeSummaryUrl: legislativeSummaryUrl(bill),
      legisinfoSummaryText: cleanLegisinfoSummary(bill.ShortLegislativeSummaryEn),
      lastActivityDate,
      lastActivityLabel: bill.LatestBillEventTypeNameEn || null,
      lastUpdated: now,
    },
    stages,
    sponsorParlId: bill.SponsorPersonId,
  }
}
