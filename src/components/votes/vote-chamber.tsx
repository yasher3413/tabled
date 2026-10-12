"use client"

import { ArrowDownUp } from "lucide-react"
import Link from "next/link"
import { memo, useDeferredValue, useMemo, useState } from "react"
import { FilterSelect, SearchField } from "@/components/filters/controls"
import { Hemicycle, type HemicycleSeat } from "@/components/tabled/hemicycle"
import { partyColor, PartySwatch } from "@/components/tabled/party-tag"
import type { BallotRow, BallotValue, Party } from "@/lib/queries"
import { localePath, type Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { partyShort } from "@/i18n/parties"
import { cn } from "@/lib/utils"

const BALLOT_ORDER: Record<BallotValue, number> = { yea: 0, nay: 1, paired: 2, absent: 3 }
const BALLOT_FILL: Record<BallotValue, string> = {
  yea: "var(--ballot-yea)",
  nay: "var(--ballot-nay)",
  paired: "var(--ballot-paired)",
  absent: "var(--ballot-absent)",
}

type SortKey = "name" | "party" | "riding" | "ballot"

export function VoteChamber({ ballots, parties, aside, locale = "en" }: { ballots: BallotRow[]; parties: Party[]; aside?: React.ReactNode; locale?: Locale }) {
  const m = getMessages(locale)
  const t = m.voteDetail
  const BALLOT_LABEL: Record<BallotValue, string> = { yea: m.vote.yea, nay: m.vote.nay, paired: m.vote.paired, absent: m.vote.didNotVote }
  const [colorBy, setColorBy] = useState<"ballot" | "party">("ballot")
  const [hovered, setHovered] = useState<string | null>(null)
  const [q, setQ] = useState("")
  const [party, setParty] = useState("")
  const [ballot, setBallot] = useState("")
  const [dissentOnly, setDissentOnly] = useState(false)
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "name", dir: 1 })
  const query = useDeferredValue(q)

  const partyOrder = useMemo(() => new Map(parties.map((p, i) => [p.id, i])), [parties])
  const partyName = useMemo(() => new Map(parties.map((p) => [p.id, partyShort(p, locale)])), [parties, locale])

  const seatsOrdered = useMemo(
    () =>
      [...ballots].sort(
        (a, b) =>
          (partyOrder.get(a.partyId ?? "") ?? 99) - (partyOrder.get(b.partyId ?? "") ?? 99) ||
          BALLOT_ORDER[a.ballot] - BALLOT_ORDER[b.ballot] ||
          (a.familyName ?? a.name).localeCompare(b.familyName ?? b.name),
      ),
    [ballots, partyOrder],
  )

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  const matches = (b: BallotRow) => {
    if (party && b.partyId !== party) return false
    if (ballot && b.ballot !== ballot) return false
    if (dissentOnly && !b.isDissent) return false
    if (terms.length) {
      const hay = `${b.name} ${b.ridingName ?? ""} ${b.province ?? ""}`.toLowerCase()
      if (!terms.every((t) => hay.includes(t))) return false
    }
    return true
  }
  const filtering = !!(party || ballot || dissentOnly || terms.length)

  const seats: HemicycleSeat[] = seatsOrdered.map((b) => ({
    id: b.memberId,
    fill: colorBy === "ballot" ? BALLOT_FILL[b.ballot] : partyColor(b.partyId),
    variant: colorBy === "ballot" ? (b.ballot === "absent" ? "hollow" : b.ballot === "paired" ? "hatched" : "solid") : b.ballot === "absent" || b.ballot === "paired" ? "hollow" : "solid",
    title: t.seatTitle(b.name, partyName.get(b.partyId ?? "") ?? t.independent, BALLOT_LABEL[b.ballot], b.isDissent),
    dim: (filtering && !matches(b)) || (hovered !== null && hovered !== b.memberId),
    active: hovered === b.memberId,
  }))

  const rows = useMemo(() => {
    const visible = ballots.filter(matches)
    const k = sort.key
    const val = (x: BallotRow) =>
      k === "name" ? (x.familyName ?? x.name) : k === "party" ? String(partyOrder.get(x.partyId ?? "") ?? 99).padStart(2, "0") : k === "riding" ? (x.ridingName ?? "") : String(BALLOT_ORDER[x.ballot])
    return visible.sort((a, b) => val(a).localeCompare(val(b)) * sort.dir || (a.familyName ?? a.name).localeCompare(b.familyName ?? b.name))
    // `matches` reads exactly these filter values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ballots, party, ballot, dissentOnly, query, sort, partyOrder])

  const counts = { yea: 0, nay: 0, paired: 0, absent: 0 } as Record<BallotValue, number>
  for (const b of ballots) counts[b.ballot]++
  const dissenters = ballots.filter((b) => b.isDissent)

  const sortButton = (key: SortKey, label: string, className?: string) => (
    <th scope="col" className={cn("py-2 pr-3 font-medium", className)} aria-sort={sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => setSort((s) => ({ key, dir: s.key === key ? ((s.dir * -1) as 1 | -1) : 1 }))}
        className={cn("inline-flex items-center gap-1 hover:text-ink", sort.key === key && "text-ink")}
      >
        {label}
        <ArrowDownUp aria-hidden className="size-3" strokeWidth={1.75} />
      </button>
    </th>
  )

  return (
    <div>
      <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[1.35fr_1fr]">
        <figure className="min-w-0">
          <Hemicycle
            seats={seats}
            label={t.chartLabel(ballots.length, colorBy, counts.yea, counts.nay, counts.paired, counts.absent)}
            seatProps={(seat) => ({
              onPointerEnter: () => setHovered(seat.id),
              onPointerLeave: () => setHovered(null),
            })}
          />
          <figcaption className="mt-5 flex flex-wrap items-center justify-between gap-4">
            {colorBy === "ballot" ? (
              <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[0.8125rem] text-ink-2">
                <LegendItem swatch={<span className="size-2.5 rounded-full bg-yea" />} label={m.vote.yea} n={counts.yea} />
                <LegendItem swatch={<span className="size-2.5 rounded-full bg-nay" />} label={m.vote.nay} n={counts.nay} />
                <LegendItem swatch={<span className="size-2.5 rounded-full border-2 border-paired bg-[repeating-linear-gradient(45deg,var(--ballot-paired)_0_1px,transparent_1px_3px)]" />} label={m.vote.paired} n={counts.paired} />
                <LegendItem swatch={<span className="size-2.5 rounded-full border-2 border-absent" />} label={m.vote.didNotVote} n={counts.absent} />
              </ul>
            ) : (
              <ul className="flex flex-wrap gap-x-4 gap-y-2 text-[0.8125rem] text-ink-2">
                {parties.filter((p) => ballots.some((b) => b.partyId === p.id)).map((p) => (
                  <LegendItem key={p.id} swatch={<PartySwatch partyId={p.id} className="rounded-full" />} label={partyShort(p, locale)} n={ballots.filter((b) => b.partyId === p.id).length} />
                ))}
                <li className="text-ink-3">{t.hollow}</li>
              </ul>
            )}
            <div role="group" aria-label={t.colourBy} className="inline-flex rounded-sm border border-rule p-0.5 text-[0.8125rem]">
              {(["ballot", "party"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={colorBy === mode}
                  onClick={() => setColorBy(mode)}
                  className={cn("rounded-[2px] px-2.5 py-1 transition-colors duration-150", colorBy === mode ? "bg-ink text-paper" : "text-ink-2 hover:text-ink")}
                >
                  {mode === "ballot" ? t.byBallot : t.byPartyButton}
                </button>
              ))}
            </div>
          </figcaption>
        </figure>

        <div className="min-w-0">
          <h3 className="text-[0.8125rem] font-semibold text-ink">{t.brokeWith}</h3>
          {dissenters.length ? (
            <ul className="mt-2 border-t border-rule">
              {dissenters.map((d) => (
                <li key={d.memberId} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 border-b border-rule py-2 text-[0.9375rem]" onPointerEnter={() => setHovered(d.memberId)} onPointerLeave={() => setHovered(null)}>
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <PartySwatch partyId={d.partyId} />
                    <Link className="link name-sc" href={localePath(locale, `/mps/${d.memberId}`)}>
                      {d.name}
                    </Link>
                  </span>
                  <span className="text-[0.8125rem] text-ink-2">
                    {t.votedAgainst(BALLOT_LABEL[d.ballot].toLowerCase(), partyName.get(d.partyId ?? "") ?? "", (d.ballot === "yea" ? m.vote.nay : m.vote.yea).toLowerCase())}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 border-t border-rule pt-3 text-[0.9375rem] text-ink-2">{t.nobody}</p>
          )}
          {aside}
        </div>
      </div>

      <section aria-labelledby="ballots" className="mt-14">
        <div className="flex items-baseline justify-between gap-4 border-b border-rule pb-2">
          <h2 id="ballots" className="font-display text-[1.375rem] leading-tight font-semibold">
            {t.everyVote}
          </h2>
          <p className="text-sm text-ink-3" aria-live="polite">
            {t.mpsCount(rows.length, ballots.length)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 py-4 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
          <SearchField className="col-span-2 md:col-span-1" label={t.findMp} value={q} onChange={setQ} placeholder={t.findPlaceholder} locale={locale} />
          <FilterSelect label={m.vote.party} value={party} onChange={setParty} options={[{ value: "", label: t.allParties }, ...parties.filter((p) => ballots.some((b) => b.partyId === p.id)).map((p) => ({ value: p.id, label: partyShort(p, locale) }))]} />
          <FilterSelect label={t.voteFilter} value={ballot} onChange={setBallot} options={[{ value: "", label: t.anyVote }, ...(["yea", "nay", "paired", "absent"] as const).map((b) => ({ value: b, label: BALLOT_LABEL[b] }))]} />
          <label className="col-span-2 flex h-10 cursor-pointer items-center gap-2 text-[0.9375rem] text-ink-2 md:col-span-1">
            <input type="checkbox" checked={dissentOnly} onChange={(e) => setDissentOnly(e.target.checked)} className="size-4 accent-[var(--accent-ink)]" />
            {t.brokeOnly}
          </label>
        </div>
        {/* Skip layout of the long table until it nears the viewport; rows are about 2.3rem tall. */}
        <div className="overflow-x-auto [content-visibility:auto]" style={{ containIntrinsicSize: `auto ${(rows.length + 1) * 2.3}rem` }}>
          <table className="w-full text-[0.9375rem] sm:min-w-[34rem]">
            <caption className="sr-only">{t.caption}</caption>
            <thead>
              <tr className="border-b border-rule-strong text-left text-xs text-ink-3">
                {sortButton("name", t.mp)}
                {sortButton("party", m.vote.party, "hidden sm:table-cell")}
                {sortButton("riding", t.riding, "hidden sm:table-cell")}
                {sortButton("ballot", t.voteFilter)}
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <BallotTableRow
                  key={b.memberId}
                  b={b}
                  active={hovered === b.memberId}
                  href={localePath(locale, `/mps/${b.memberId}`)}
                  partyLabel={partyName.get(b.partyId ?? "") ?? t.independent}
                  ballotLabel={BALLOT_LABEL[b.ballot]}
                  brokeTag={t.brokeTag}
                  onHover={setHovered}
                />
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="py-8 text-center text-[0.9375rem] text-ink-2">{t.noMatch}</p>}
        </div>
      </section>
    </div>
  )
}

const BallotTableRow = memo(function BallotTableRow({
  b,
  active,
  href,
  partyLabel,
  ballotLabel,
  brokeTag,
  onHover,
}: {
  b: BallotRow
  active: boolean
  href: string
  partyLabel: string
  ballotLabel: string
  brokeTag: string
  onHover: (id: string | null) => void
}) {
  return (
    <tr
      onPointerEnter={() => onHover(b.memberId)}
      onPointerLeave={() => onHover(null)}
      className={cn("border-b border-rule transition-colors duration-100", active && "bg-paper-sunk")}
    >
      <th scope="row" className="py-2 pr-3 text-left font-normal">
        <Link className="name-sc hover:underline" href={href}>
          {b.name}
        </Link>
        {/* Phones fold the party under the name so the vote column stays on screen. */}
        <span className="mt-0.5 flex items-center gap-1.5 text-[0.8125rem] text-ink-3 sm:hidden">
          <PartySwatch partyId={b.partyId} />
          {partyLabel}
        </span>
      </th>
      <td className="hidden py-2 pr-3 whitespace-nowrap sm:table-cell">
        <span className="inline-flex items-center gap-1.5 text-ink-2">
          <PartySwatch partyId={b.partyId} />
          {partyLabel}
        </span>
      </td>
      <td className="hidden py-2 pr-3 text-ink-2 sm:table-cell">
        {b.ridingName}
        {b.province ? <span className="text-ink-3">, {b.province}</span> : null}
      </td>
      <td className="py-2 pr-3 whitespace-nowrap">
        <span className={cn("inline-flex items-center gap-2", b.ballot === "yea" || b.ballot === "nay" ? "text-ink" : "text-ink-3")}>
          <BallotMark ballot={b.ballot} />
          {ballotLabel}
        </span>
        {b.isDissent && <span className="ml-2 rounded-sm border border-rule px-1.5 py-px text-[0.75rem] font-medium text-ink-2">{brokeTag}</span>}
      </td>
    </tr>
  )
})

function LegendItem({ swatch, label, n }: { swatch: React.ReactNode; label: string; n: number }) {
  return (
    <li className="inline-flex items-center gap-1.5">
      <span aria-hidden className="inline-flex">{swatch}</span>
      {label} <span className="text-ink tabular-nums">{n}</span>
    </li>
  )
}

function BallotMark({ ballot }: { ballot: BallotValue }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2.5 rounded-full",
        ballot === "yea" && "bg-yea",
        ballot === "nay" && "bg-nay",
        ballot === "paired" && "border-2 border-paired",
        ballot === "absent" && "border-2 border-absent",
      )}
    />
  )
}
