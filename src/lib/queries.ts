// Read-only data access for pages. All reads are synchronous SQLite queries, so pages prerender.
import { and, asc, desc, eq, gte, inArray, isNotNull, lte } from "drizzle-orm"
import { getDb } from "@/db/client"
import * as t from "@/db/schema"
import { parseSummary, type Summary } from "./summary-schema"

export type Party = typeof t.parties.$inferSelect
export type Bill = typeof t.bills.$inferSelect
export type BillStage = typeof t.billStages.$inferSelect
export type Vote = typeof t.votes.$inferSelect
export type BallotValue = (typeof t.ballots.$inferSelect)["ballot"]
export type VotePartyStat = typeof t.votePartyStats.$inferSelect

export function getMeta(): Record<string, string> {
  return Object.fromEntries(
    getDb()
      .select()
      .from(t.meta)
      .all()
      .map((r) => [r.key, r.value]),
  )
}

export function getCurrentSession() {
  return getDb().select().from(t.sessions).where(eq(t.sessions.isCurrent, true)).get() ?? null
}

/** Ingest timestamp as a date; used as "today" so the site describes its own snapshot honestly. */
export function getDataDate(): string {
  return (getMeta().last_ingest ?? getCurrentSession()?.startDate ?? "1970-01-01").slice(0, 10)
}

export function getDataYear(): number {
  return Number(getDataDate().slice(0, 4))
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function listParties(): Party[] {
  return getDb().select().from(t.parties).orderBy(asc(t.parties.sortOrder)).all()
}

export function partyMap(): Map<string, Party> {
  return new Map(listParties().map((p) => [p.id, p]))
}

// ---------- Bills ----------

export interface BillListItem {
  id: string
  sessionId: string
  number: string
  numberPrefix: string
  numberInt: number
  title: string
  titleFr: string | null
  shortTitle: string | null
  shortTitleFr: string | null
  statusFr: string | null
  chamber: "house" | "senate"
  type: Bill["type"]
  typeLabel: string
  currentStage: string
  statusEn: string
  isLaw: boolean
  isDefeated: boolean
  isProForma: boolean
  introducedDate: string | null
  lastActivityDate: string | null
  lastActivityLabel: string | null
  sponsorName: string | null
  sponsorMemberId: string | null
  sponsorPartyId: string | null
  tldr: string | null
  topics: string[]
  /** Ordered stage chamber and state, for compact progress indicators. */
  stages: Array<{ chamber: BillStage["chamber"]; state: BillStage["state"]; key: string }>
}

export function listBills(): BillListItem[] {
  const db = getDb()
  const rows = db
    .select({
      bill: t.bills,
      payload: t.summaries.payload,
    })
    .from(t.bills)
    .leftJoin(t.summaries, eq(t.summaries.billId, t.bills.id))
    .all()
  const stagesByBill = new Map<string, BillListItem["stages"]>()
  for (const s of db
    .select({ billId: t.billStages.billId, chamber: t.billStages.chamber, state: t.billStages.state, key: t.billStages.stageKey })
    .from(t.billStages)
    .orderBy(asc(t.billStages.billId), asc(t.billStages.ordinal))
    .all()) {
    const list = stagesByBill.get(s.billId) ?? []
    list.push({ chamber: s.chamber, state: s.state, key: s.key })
    stagesByBill.set(s.billId, list)
  }
  return rows.map(({ bill: b, payload }) => ({
    id: b.id,
    sessionId: b.sessionId,
    number: b.number,
    numberPrefix: b.numberPrefix,
    numberInt: b.numberInt,
    title: b.titleEn,
    titleFr: b.titleFr,
    shortTitle: b.shortTitleEn,
    shortTitleFr: b.shortTitleFr,
    statusFr: b.statusFr,
    chamber: b.chamber,
    type: b.type,
    typeLabel: b.typeLabel,
    currentStage: b.currentStage,
    statusEn: b.statusEn,
    isLaw: b.isLaw,
    isDefeated: b.isDefeated,
    isProForma: b.isProForma,
    introducedDate: b.introducedDate,
    lastActivityDate: b.lastActivityDate,
    lastActivityLabel: b.lastActivityLabel,
    sponsorName: b.sponsorName,
    sponsorMemberId: b.sponsorMemberId,
    sponsorPartyId: b.sponsorPartyId,
    tldr: parseSummary(payload)?.tldr ?? null,
    topics: parseSummary(payload)?.topics ?? [],
    stages: stagesByBill.get(b.id) ?? [],
  }))
}

export interface BillDetail {
  bill: Bill
  stages: BillStage[]
  votes: Array<Vote & { partyStats: VotePartyStat[] }>
  summary: (typeof t.summaries.$inferSelect & { parsed: Summary }) | null
  sponsor: { id: string; name: string; partyId: string | null; ridingName: string | null } | null
}

export function getBill(sessionId: string, number: string): BillDetail | null {
  const db = getDb()
  const id = `${sessionId}/${number.toUpperCase()}`
  const bill = db.select().from(t.bills).where(eq(t.bills.id, id)).get()
  if (!bill) return null
  const stages = db.select().from(t.billStages).where(eq(t.billStages.billId, id)).orderBy(asc(t.billStages.ordinal)).all()
  const votes = db.select().from(t.votes).where(eq(t.votes.billId, id)).orderBy(desc(t.votes.date), desc(t.votes.number)).all()
  const stats = votes.length
    ? db.select().from(t.votePartyStats).where(inArray(t.votePartyStats.voteId, votes.map((v) => v.id))).all()
    : []
  const summaryRow = db.select().from(t.summaries).where(eq(t.summaries.billId, id)).get()
  const parsed = parseSummary(summaryRow?.payload)
  const sponsor = bill.sponsorMemberId
    ? (db
        .select({ id: t.members.id, name: t.members.name, partyId: t.members.partyId, ridingName: t.ridings.nameEn })
        .from(t.members)
        .leftJoin(t.ridings, eq(t.ridings.id, t.members.ridingId))
        .where(eq(t.members.id, bill.sponsorMemberId))
        .get() ?? null)
    : null
  return {
    bill,
    stages,
    votes: votes.map((v) => ({ ...v, partyStats: stats.filter((s) => s.voteId === v.id) })),
    summary: summaryRow && parsed ? { ...summaryRow, parsed } : null,
    sponsor,
  }
}

export function allBillParams() {
  return getDb()
    .select({ sessionId: t.bills.sessionId, number: t.bills.number })
    .from(t.bills)
    .all()
    .map((b) => ({ session: b.sessionId, number: b.number }))
}

/** Bills with a stage completed or entered on/after `since`. */
export function billsMovedSince(since: string) {
  const db = getDb()
  const moves = db
    .select({ billId: t.billStages.billId, stageKey: t.billStages.stageKey, stageName: t.billStages.stageName, state: t.billStages.state, date: t.billStages.date, chamber: t.billStages.chamber })
    .from(t.billStages)
    .where(and(isNotNull(t.billStages.date), gte(t.billStages.date, since)))
    .orderBy(desc(t.billStages.date), desc(t.billStages.ordinal))
    .all()
  const bills = new Map(listBills().map((b) => [b.id, b]))
  const seen = new Set<string>()
  const out: Array<{ bill: BillListItem; stageKey: string; state: string; date: string }> = []
  for (const m of moves) {
    if (seen.has(m.billId)) continue
    seen.add(m.billId)
    const bill = bills.get(m.billId)
    if (bill) out.push({ bill, stageKey: m.stageKey, state: m.state, date: m.date! })
  }
  return out
}

// ---------- Votes ----------

export interface VoteListItem extends Vote {
  billNumber: string | null
  billShortTitle: string | null
  billShortTitleFr: string | null
  billSession: string | null
}

export function listVotes(): VoteListItem[] {
  return getDb()
    .select({ vote: t.votes, billNumber: t.bills.number, billShortTitle: t.bills.shortTitleEn, billShortTitleFr: t.bills.shortTitleFr, billSession: t.bills.sessionId })
    .from(t.votes)
    .leftJoin(t.bills, eq(t.bills.id, t.votes.billId))
    .orderBy(desc(t.votes.date), desc(t.votes.number))
    .all()
    .map((r) => ({ ...r.vote, billNumber: r.billNumber, billShortTitle: r.billShortTitle, billShortTitleFr: r.billShortTitleFr, billSession: r.billSession }))
}

export interface BallotRow {
  memberId: string
  name: string
  familyName: string | null
  partyId: string | null
  ridingName: string | null
  province: string | null
  ballot: BallotValue
  isDissent: boolean
}

export function getVote(sessionId: string, number: number) {
  const db = getDb()
  const id = `${sessionId}/${number}`
  const vote = listVotes().find((v) => v.id === id)
  if (!vote) return null
  const partyStats = db.select().from(t.votePartyStats).where(eq(t.votePartyStats.voteId, id)).all()
  const ballots: BallotRow[] = db
    .select({
      memberId: t.ballots.memberId,
      name: t.members.name,
      familyName: t.members.familyName,
      partyId: t.ballots.partyId,
      ridingName: t.ridings.nameEn,
      province: t.ridings.province,
      ballot: t.ballots.ballot,
      isDissent: t.ballots.isDissent,
    })
    .from(t.ballots)
    .innerJoin(t.members, eq(t.members.id, t.ballots.memberId))
    .leftJoin(t.ridings, eq(t.ridings.id, t.members.ridingId))
    .where(eq(t.ballots.voteId, id))
    .all()
  return { vote, partyStats, ballots }
}

export function allVoteParams() {
  return getDb()
    .select({ sessionId: t.votes.sessionId, number: t.votes.number })
    .from(t.votes)
    .all()
    .map((v) => ({ session: v.sessionId, number: String(v.number) }))
}

// ---------- Members ----------

export interface MemberListItem {
  id: string
  name: string
  givenName: string | null
  familyName: string | null
  partyId: string | null
  ridingName: string | null
  province: string | null
  active: boolean
  endDate: string | null
  partyLineRate: number | null
  attendanceRate: number | null
  votesCast: number
  votesHeld: number
  dissentCount: number
  billsSponsored: number
}

export function listMembers(): MemberListItem[] {
  return getDb()
    .select({
      id: t.members.id,
      name: t.members.name,
      givenName: t.members.givenName,
      familyName: t.members.familyName,
      partyId: t.members.partyId,
      ridingName: t.ridings.nameEn,
      province: t.members.province,
      active: t.members.active,
      endDate: t.members.endDate,
      partyLineRate: t.memberStats.partyLineRate,
      attendanceRate: t.memberStats.attendanceRate,
      votesCast: t.memberStats.votesCast,
      votesHeld: t.memberStats.votesHeld,
      dissentCount: t.memberStats.dissentCount,
      billsSponsored: t.memberStats.billsSponsored,
    })
    .from(t.members)
    .leftJoin(t.ridings, eq(t.ridings.id, t.members.ridingId))
    .leftJoin(t.memberStats, eq(t.memberStats.memberId, t.members.id))
    .orderBy(asc(t.members.familyName), asc(t.members.name))
    .all()
    .map((m) => ({
      ...m,
      votesCast: m.votesCast ?? 0,
      votesHeld: m.votesHeld ?? 0,
      dissentCount: m.dissentCount ?? 0,
      billsSponsored: m.billsSponsored ?? 0,
    }))
}

export function getMember(slug: string) {
  const db = getDb()
  const member = listMembers().find((m) => m.id === slug)
  if (!member) return null
  const detail = db.select().from(t.members).where(eq(t.members.id, slug)).get()!
  const stats = db.select().from(t.memberStats).where(eq(t.memberStats.memberId, slug)).get() ?? null
  const sponsored = listBills()
    .filter((b) => b.sponsorMemberId === slug)
    .sort((a, b) => (b.lastActivityDate ?? "").localeCompare(a.lastActivityDate ?? ""))
  const ballots = db
    .select({
      voteId: t.votes.id,
      number: t.votes.number,
      sessionId: t.votes.sessionId,
      date: t.votes.date,
      description: t.votes.descriptionEn,
      descriptionFr: t.votes.descriptionFr,
      result: t.votes.result,
      ballot: t.ballots.ballot,
      isDissent: t.ballots.isDissent,
      partyId: t.ballots.partyId,
      billNumber: t.bills.number,
    })
    .from(t.ballots)
    .innerJoin(t.votes, eq(t.votes.id, t.ballots.voteId))
    .leftJoin(t.bills, eq(t.bills.id, t.votes.billId))
    .where(eq(t.ballots.memberId, slug))
    .orderBy(desc(t.votes.date), desc(t.votes.number))
    .all()
  return { member, detail, stats, sponsored, ballots }
}

export function allMemberParams() {
  return getDb()
    .select({ id: t.members.id })
    .from(t.members)
    .all()
    .map((m) => ({ slug: m.id }))
}

export function memberByRidingName(normalizedName: string) {
  return listMembers().filter((m) => m.active && m.ridingName && normalizeRiding(m.ridingName) === normalizedName)
}

/** Lowercase, strip accents and punctuation; em dashes and hyphens become spaces. */
export function normalizeRiding(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[—–-]/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

// ---------- Parties ----------

export function partySummaries() {
  const members = listMembers()
  const bills = listBills()
  const stats = getDb().select().from(t.votePartyStats).all()
  return listParties().map((p) => {
    const mine = members.filter((m) => m.partyId === p.id && m.active)
    const rates = mine.map((m) => m.partyLineRate).filter((r): r is number => r !== null)
    return {
      party: p,
      seats: p.seatCount,
      cohesion: rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : null,
      cohesionSample: rates.length,
      billsSponsored: bills.filter((b) => b.sponsorPartyId === p.id).length,
      billsBecameLaw: bills.filter((b) => b.sponsorPartyId === p.id && b.isLaw).length,
      dissents: mine.reduce((a, m) => a + m.dissentCount, 0),
      splitVotes: stats.filter((s) => s.partyId === p.id && s.isSplit).length,
      votesWithPosition: stats.filter((s) => s.partyId === p.id && (s.majority === "yea" || s.majority === "nay")).length,
    }
  })
}

// ---------- Home ----------

export function houseComposition() {
  const db = getDb()
  const seatsTotal = db.select({ id: t.ridings.id }).from(t.ridings).all().length
  const parties = listParties().filter((p) => p.seatCount > 0)
  const filled = parties.reduce((a, p) => a + p.seatCount, 0)
  return { parties, filled, seatsTotal, vacant: Math.max(0, seatsTotal - filled) }
}

export function recentlyIntroduced(limit: number) {
  return listBills()
    .filter((b) => !b.isProForma)
    .sort((a, b) => (b.introducedDate ?? "").localeCompare(a.introducedDate ?? "") || b.numberInt - a.numberInt)
    .slice(0, limit)
}

/** member id -> House of Commons PersonId */
export function memberParlIds(): Map<string, number> {
  return new Map(
    getDb()
      .select({ id: t.members.id, parl: t.members.parlMpId })
      .from(t.members)
      .all()
      .filter((m) => m.parl !== null)
      .map((m) => [m.id, m.parl!]),
  )
}

// ---------- Weekly digest ----------

export interface DigestEvent {
  date: string
  billId: string
  sessionId: string
  number: string
  shortTitle: string | null
  shortTitleFr: string | null
  title: string
  titleFr: string | null
  stageKey: string
  state: "completed" | "defeated"
}

/** Every stage a bill completed (or failed) within [from, to], newest first. */
export function stageEventsBetween(from: string, to: string): DigestEvent[] {
  return getDb()
    .select({
      date: t.billStages.date,
      billId: t.bills.id,
      sessionId: t.bills.sessionId,
      number: t.bills.number,
      shortTitle: t.bills.shortTitleEn,
      shortTitleFr: t.bills.shortTitleFr,
      title: t.bills.titleEn,
      titleFr: t.bills.titleFr,
      stageKey: t.billStages.stageKey,
      state: t.billStages.state,
    })
    .from(t.billStages)
    .innerJoin(t.bills, eq(t.bills.id, t.billStages.billId))
    .where(and(isNotNull(t.billStages.date), gte(t.billStages.date, from), lte(t.billStages.date, to), inArray(t.billStages.state, ["completed", "defeated"])))
    .orderBy(desc(t.billStages.date), asc(t.bills.numberPrefix), asc(t.bills.numberInt), desc(t.billStages.ordinal))
    .all()
    .map((e) => ({ ...e, date: e.date!, state: e.state as DigestEvent["state"] }))
}

export function votesBetween(from: string, to: string): VoteListItem[] {
  return listVotes().filter((v) => v.date >= from && v.date <= to)
}

/** Every date on which a bill moved or the House held a recorded vote. */
export function activityDates(): string[] {
  const db = getDb()
  const stageDates = db
    .select({ d: t.billStages.date })
    .from(t.billStages)
    .where(and(isNotNull(t.billStages.date), inArray(t.billStages.state, ["completed", "defeated"])))
    .all()
    .map((r) => r.d!)
  const voteDates = db.select({ d: t.votes.date }).from(t.votes).all().map((r) => r.d)
  return [...new Set([...stageDates, ...voteDates])].sort()
}
