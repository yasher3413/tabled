// Full or recent ingest of the current Parliament into data/tabled.db.
//   pnpm ingest          refresh everything (detail pages cached up to 12h)
//   pnpm ingest:recent   refresh lists and anything active in the last 30 days, reuse cache otherwise
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync } from "node:fs"
import path from "node:path"
import { openWritableDb, DB_PATH } from "../../src/db/client"
import * as t from "../../src/db/schema"
import { fetchJson, fetchText, HttpError, mapAll, stats as httpStats } from "./http"
import { computeMemberStats, computePartyStats, isDissent, splitVotes, type BallotInput } from "./metrics"
import { normalizeBill } from "./normalize/bills"
import { normalizePolitician, partyRow, type NormalizedMember } from "./normalize/members"
import { normalizeBallot, normalizeVote, voteResult } from "./normalize/votes"
import { parseOCParticipants, parseOCVotes, totalsDiffer, type OCVoteSummary } from "./normalize/ourcommons"
import type { LIBill, OPBallot, OPPage, OPPolitician, OPPoliticianListItem, OPVoteListItem } from "./types"

const OP = "https://api.openparliament.ca"
const LI = "https://www.parl.ca/legisinfo/en"
const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

const recent = process.argv.includes("--recent")
const started = Date.now()
const now = new Date().toISOString()
const today = now.slice(0, 10)
const recentCutoff = new Date(Date.now() - 30 * DAY).toISOString().slice(0, 10)

function log(msg: string) {
  console.log(`[ingest ${((Date.now() - started) / 1000).toFixed(1)}s] ${msg}`)
}

async function fetchAllPages<T>(firstUrl: string, maxAgeMs: number): Promise<T[]> {
  const out: T[] = []
  let url: string | null = firstUrl
  while (url) {
    const page: OPPage<T> = await fetchJson<OPPage<T>>(url, { maxAgeMs })
    out.push(...page.objects)
    url = page.pagination.next_url ? `${OP}${page.pagination.next_url}` : null
  }
  return out
}

async function legisinfoList(sessionId: string): Promise<LIBill[]> {
  try {
    return await fetchJson<LIBill[]>(`${LI}/bills/json?parlsession=${sessionId}`, { maxAgeMs: HOUR })
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) return []
    throw err
  }
}

/** Current session: newest session with recorded votes, unless LEGISinfo shows a later ongoing session. */
async function detectSession(): Promise<{ id: string; bills: LIBill[] }> {
  const latestVote = await fetchJson<OPPage<OPVoteListItem>>(`${OP}/votes/?limit=1`, { maxAgeMs: HOUR })
  const base = latestVote.objects[0]?.session
  if (!base) throw new Error("Could not detect session from openparliament votes")
  const [p, s] = base.split("-").map(Number)
  for (const candidate of [`${p + 1}-1`, `${p}-${s + 1}`]) {
    const bills = await legisinfoList(candidate)
    if (bills.some((b) => b.IsSessionOngoing)) return { id: candidate, bills }
  }
  return { id: base, bills: await legisinfoList(base) }
}

interface Reconciled {
  votes: ReturnType<typeof normalizeVote>[]
  ballots: Array<ReturnType<typeof normalizeBallot> & { partyOverride?: string | null }>
  notes: string[]
}

/**
 * The House of Commons feed is the official record. Where openparliament's totals or date differ,
 * replace that vote's details and ballots with the official ones.
 */
async function reconcileWithOfficial(
  sessionId: string,
  votes: ReturnType<typeof normalizeVote>[],
  ballots: ReturnType<typeof normalizeBallot>[],
  memberIdByParlId: Map<number, string>,
): Promise<Reconciled> {
  const notes: string[] = []
  let official: OCVoteSummary[]
  try {
    official = parseOCVotes(await fetchText("https://www.ourcommons.ca/members/en/votes/xml", { maxAgeMs: HOUR }))
  } catch (err) {
    return { votes, ballots, notes: [`official cross-check unavailable: ${String(err)}`] }
  }
  const byId = new Map(official.filter((v) => v.id.startsWith(`${sessionId}/`)).map((v) => [v.id, v]))
  const [parl, sess] = sessionId.split("-")
  const outVotes = [...votes]
  let outBallots: Reconciled["ballots"] = [...ballots]
  for (const [i, v] of votes.entries()) {
    const oc = byId.get(v.id)
    if (!oc || !totalsDiffer(v, oc)) continue
    try {
      const base = `https://www.ourcommons.ca/members/en/votes/${parl}/${sess}/${v.number}`
      const participants = parseOCParticipants(await fetchText(`${base}/xml`, { maxAgeMs: DAY }))
      const subjectChanged = oc.subject !== v.descriptionEn
      let descriptionFr = v.descriptionFr
      if (subjectChanged) {
        const fr = parseOCVotes(await fetchText("https://www.ourcommons.ca/members/fr/votes/xml", { maxAgeMs: HOUR }))
        descriptionFr = fr.find((x) => x.id === v.id)?.subject ?? null
      }
      outVotes[i] = {
        ...v,
        date: oc.date,
        descriptionEn: oc.subject,
        descriptionFr,
        billId: subjectChanged ? (oc.billNumber ? `${sessionId}/${oc.billNumber}` : null) : v.billId,
        result: voteResult(oc.result),
        yeas: oc.yeas,
        nays: oc.nays,
        paired: oc.paired,
        sourceUrl: base,
      }
      const sitting = ballots.filter((b) => b.voteId === v.id)
      const voted = new Map<string, OCParticipantRow>()
      for (const p of participants) {
        const memberId = memberIdByParlId.get(p.personId)
        if (memberId) voted.set(memberId, { ...p, memberId })
        else notes.push(`${v.id}: official ballot for unknown PersonId ${p.personId}`)
      }
      const replaced: Reconciled["ballots"] = []
      for (const [memberId, p] of voted) {
        const prior = sitting.find((b) => b.memberId === memberId)
        replaced.push({ voteId: v.id, memberId, membershipUrl: prior?.membershipUrl ?? "", ballot: p.ballot, partyOverride: p.partyId })
      }
      for (const b of sitting) if (!voted.has(b.memberId)) replaced.push({ ...b, ballot: "absent" })
      outBallots = outBallots.filter((b) => b.voteId !== v.id).concat(replaced)
      notes.push(
        `${v.id}: used official record (openparliament ${v.yeas}/${v.nays}/${v.paired} on ${v.date}${subjectChanged ? ` "${v.descriptionEn.slice(0, 50)}"` : ""}; official ${oc.yeas}/${oc.nays}/${oc.paired} on ${oc.date}${subjectChanged ? ` "${oc.subject.slice(0, 50)}"` : ""})`,
      )
    } catch (err) {
      notes.push(`${v.id}: totals differ but official ballots unavailable (${String(err)})`)
    }
  }
  return { votes: outVotes, ballots: outBallots, notes }
}

type OCParticipantRow = ReturnType<typeof parseOCParticipants>[number] & { memberId: string }

function loadSummaries(sessionId: string) {
  const dir = path.join(process.cwd(), "data", "summaries", sessionId)
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(path.join(dir, f), "utf8")) as {
      billId: string
      sourceHash: string
      model: string
      generatedAt: string
      sourceBasis: "legislative_summary" | "full_text" | "legisinfo"
      sourceUrl: string | null
      summary: unknown
    })
}

async function main() {
  log(`mode: ${recent ? "recent (30 days)" : "full"}`)

  // 1. Session and bills
  const session = await detectSession()
  const sessionId = session.id
  log(`current session ${sessionId}, ${session.bills.length} bills in LEGISinfo list`)

  const billDetails = await mapAll(session.bills, async (b) => {
    const activity = (b.LatestBillEventDateTime ?? "").slice(0, 10)
    const maxAgeMs = recent ? (activity >= recentCutoff ? 0 : Infinity) : 12 * HOUR
    const detail = await fetchJson<LIBill[]>(`${LI}/bill/${sessionId}/${b.NumberCode}/json`, { maxAgeMs })
    return detail[0]
  })
  const normalizedBills = billDetails.map((b) => normalizeBill(b, now))
  log(`fetched ${billDetails.length} bill details`)

  // 2. Votes and ballots
  const voteItems = await fetchAllPages<OPVoteListItem>(`${OP}/votes/?session=${sessionId}&limit=500`, HOUR)
  const opVotes = voteItems.map(normalizeVote)
  const ballotsByVote = await mapAll(voteItems, async (v) => {
    // Recorded divisions do not change; only very recent ones are re-fetched.
    const maxAgeMs = v.date >= new Date(Date.now() - 2 * DAY).toISOString().slice(0, 10) ? HOUR : Infinity
    const url = `${OP}/votes/ballots/?vote=${encodeURIComponent(v.url)}&limit=500`
    return fetchAllPages<OPBallot>(url, maxAgeMs)
  })
  const opBallots = ballotsByVote.flat().map(normalizeBallot)
  log(`fetched ${opVotes.length} votes and ${opBallots.length} ballots`)

  const sessionStart = [
    ...normalizedBills.map((b) => b.bill.introducedDate),
    ...opVotes.map((v) => v.date),
  ]
    .filter((d): d is string => !!d)
    .sort()[0] ?? today

  // 3. Members: everyone currently sitting plus anyone who cast a ballot this session.
  const current = await fetchAllPages<OPPoliticianListItem>(`${OP}/politicians/?limit=500`, HOUR)
  const memberUrls = new Set(current.map((p) => p.url))
  for (const b of opBallots) memberUrls.add(`/politicians/${b.memberId}/`)
  const politicians = await mapAll([...memberUrls], (url) =>
    fetchJson<OPPolitician>(`${OP}${url}`, { maxAgeMs: recent ? 7 * DAY : DAY }),
  )
  const members: NormalizedMember[] = politicians.map((p) => normalizePolitician(p, sessionStart, today))
  log(`fetched ${members.length} members (${current.length} sitting)`)

  const memberIdByParlId = new Map(
    members.filter((m) => m.member.parlMpId).map((m) => [m.member.parlMpId!, m.member.id]),
  )
  const reconciled = await reconcileWithOfficial(sessionId, opVotes, opBallots, memberIdByParlId)
  const votes = reconciled.votes
  const rawBallots = reconciled.ballots
  const crossCheck = reconciled.notes
  if (crossCheck.length) log(`reconciled with official record:\n  ${crossCheck.join("\n  ")}`)

  // 4. Write a fresh database, then swap it in.
  mkdirSync(path.dirname(DB_PATH), { recursive: true })
  const tmp = `${DB_PATH}.tmp`
  for (const f of [tmp, `${tmp}-wal`, `${tmp}-shm`]) rmSync(f, { force: true })
  const { db, sqlite } = openWritableDb(tmp)

  const parties = new Map<string, ReturnType<typeof partyRow>>()
  const ridings = new Map<string, NormalizedMember["ridings"][number]>()
  for (const m of members) {
    for (const p of m.parties) parties.set(p.id, p)
    for (const r of m.ridings) ridings.set(r.id, r)
  }
  const memberById = new Map(members.map((m) => [m.member.id, m]))
  const memberByParlId = new Map(
    members.filter((m) => m.member.parlMpId).map((m) => [m.member.parlMpId!, m.member]),
  )
  const membershipParty = new Map(members.flatMap((m) => m.memberships.map((ms) => [ms.url, ms.partyId] as const)))

  const ballots: BallotInput[] = rawBallots.map((b) => ({
    voteId: b.voteId,
    memberId: b.memberId,
    ballot: b.ballot,
    partyId:
      b.partyOverride ?? membershipParty.get(b.membershipUrl) ?? memberById.get(b.memberId)?.member.partyId ?? null,
  }))
  const partyStats = computePartyStats(ballots)
  const splits = splitVotes(partyStats)
  const memberStats = computeMemberStats(ballots, partyStats)

  const seatCounts = new Map<string, number>()
  for (const m of members) {
    if (m.member.active && m.member.partyId) {
      seatCounts.set(m.member.partyId, (seatCounts.get(m.member.partyId) ?? 0) + 1)
    }
  }
  // Consistent party order everywhere: by seat count, independents last.
  const partyOrder = [...parties.values()].sort((a, b) => {
    if (a.id === "independent") return 1
    if (b.id === "independent") return -1
    return (seatCounts.get(b.id) ?? 0) - (seatCounts.get(a.id) ?? 0) || a.shortName.localeCompare(b.shortName)
  })

  const billIds = new Set(normalizedBills.map((b) => b.bill.id))
  const sponsoredCount = new Map<string, number>()

  sqlite.transaction(() => {
    db.insert(t.sessions)
      .values({
        id: sessionId,
        parliament: Number(sessionId.split("-")[0]),
        session: Number(sessionId.split("-")[1]),
        startDate: sessionStart,
        endDate: null,
        isCurrent: true,
      })
      .run()
    partyOrder.forEach((p, i) =>
      db.insert(t.parties).values({ ...p, seatCount: seatCounts.get(p.id) ?? 0, sortOrder: i }).run(),
    )
    for (const r of ridings.values()) db.insert(t.ridings).values(r).run()
    for (const m of members) db.insert(t.members).values(m.member).run()
    for (const m of members) for (const ms of m.memberships) db.insert(t.memberships).values(ms).onConflictDoNothing().run()

    for (const { bill, stages, sponsorParlId } of normalizedBills) {
      const sponsor = sponsorParlId ? memberByParlId.get(sponsorParlId) : undefined
      if (sponsor) sponsoredCount.set(sponsor.id, (sponsoredCount.get(sponsor.id) ?? 0) + 1)
      // Party at introduction, from the sponsor's membership covering that date.
      const sponsorMember = sponsor ? memberById.get(sponsor.id) : undefined
      const atIntro = sponsorMember?.memberships.find(
        (ms) =>
          (ms.startDate ?? "") <= (bill.introducedDate ?? today) &&
          (ms.endDate ?? "9999") >= (bill.introducedDate ?? today),
      )
      db.insert(t.bills)
        .values({
          ...bill,
          sponsorMemberId: sponsor?.id ?? null,
          sponsorPartyId: atIntro?.partyId ?? sponsor?.partyId ?? null,
        })
        .run()
      for (const s of stages) db.insert(t.billStages).values({ billId: bill.id, ...s }).run()
    }

    for (const v of votes) {
      db.insert(t.votes)
        .values({ ...v, billId: v.billId && billIds.has(v.billId) ? v.billId : null, hasPartySplit: splits.has(v.id) })
        .run()
    }
    for (const b of ballots) {
      db.insert(t.ballots).values({ ...b, isDissent: isDissent(b, partyStats) }).run()
    }
    for (const s of partyStats.values()) db.insert(t.votePartyStats).values(s).run()
    for (const m of members) {
      const s = memberStats.get(m.member.id)
      db.insert(t.memberStats)
        .values({
          memberId: m.member.id,
          votesHeld: s?.votesHeld ?? 0,
          votesCast: s?.votesCast ?? 0,
          votesPaired: s?.votesPaired ?? 0,
          partyLineEligible: s?.partyLineEligible ?? 0,
          partyLineVotes: s?.partyLineVotes ?? 0,
          dissentCount: s?.dissentCount ?? 0,
          partyLineRate: s?.partyLineRate ?? null,
          attendanceRate: s?.attendanceRate ?? null,
          billsSponsored: sponsoredCount.get(m.member.id) ?? 0,
        })
        .run()
    }
    for (const s of loadSummaries(sessionId)) {
      if (!billIds.has(s.billId)) continue
      db.insert(t.summaries)
        .values({
          billId: s.billId,
          sourceHash: s.sourceHash,
          model: s.model,
          generatedAt: s.generatedAt,
          payload: JSON.stringify(s.summary),
          sourceBasis: s.sourceBasis,
          sourceUrl: s.sourceUrl,
        })
        .run()
    }
    const metaRows = {
      last_ingest: now,
      ingest_mode: recent ? "recent" : "full",
      current_session: sessionId,
      crosscheck: JSON.stringify(crossCheck),
    }
    for (const [key, value] of Object.entries(metaRows)) db.insert(t.meta).values({ key, value }).run()
  })()

  // Sponsor counts depend on bill insertion order above; patch them now that all bills are in.
  for (const [memberId, n] of sponsoredCount) {
    sqlite.prepare("UPDATE member_stats SET bills_sponsored = ? WHERE member_id = ?").run(n, memberId)
  }

  sqlite.pragma("wal_checkpoint(TRUNCATE)")
  sqlite.pragma("journal_mode = DELETE")
  sqlite.close()
  for (const f of [`${DB_PATH}-wal`, `${DB_PATH}-shm`]) rmSync(f, { force: true })
  renameSync(tmp, DB_PATH)

  const counts = {
    bills: normalizedBills.length,
    votes: votes.length,
    ballots: ballots.length,
    members: members.length,
    sitting: current.length,
    parties: parties.size,
    ridings: ridings.size,
    summaries: loadSummaries(sessionId).length,
  }
  log(`done: ${JSON.stringify(counts)}`)
  log(`http: ${httpStats.network} network, ${httpStats.cached} cached, ${httpStats.retries} retries`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
