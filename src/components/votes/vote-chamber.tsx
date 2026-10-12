"use client"

import { ArrowDownUp } from "lucide-react"
import Link from "next/link"
import { useDeferredValue, useMemo, useState } from "react"
import { FilterSelect, SearchField } from "@/components/filters/controls"
import { Hemicycle, type HemicycleSeat } from "@/components/tabled/hemicycle"
import { partyColor, PartySwatch } from "@/components/tabled/party-tag"
import type { BallotRow, BallotValue, Party } from "@/lib/queries"
import { cn } from "@/lib/utils"

const BALLOT_LABEL: Record<BallotValue, string> = { yea: "Yea", nay: "Nay", paired: "Paired", absent: "Did not vote" }
const BALLOT_ORDER: Record<BallotValue, number> = { yea: 0, nay: 1, paired: 2, absent: 3 }
const BALLOT_FILL: Record<BallotValue, string> = {
  yea: "var(--ballot-yea)",
  nay: "var(--ballot-nay)",
  paired: "var(--ballot-paired)",
  absent: "var(--ballot-absent)",
}

type SortKey = "name" | "party" | "riding" | "ballot"

export function VoteChamber({ ballots, parties, aside }: { ballots: BallotRow[]; parties: Party[]; aside?: React.ReactNode }) {
  const [colorBy, setColorBy] = useState<"ballot" | "party">("ballot")
  const [hovered, setHovered] = useState<string | null>(null)
  const [q, setQ] = useState("")
  const [party, setParty] = useState("")
  const [ballot, setBallot] = useState("")
  const [dissentOnly, setDissentOnly] = useState(false)
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "name", dir: 1 })
  const query = useDeferredValue(q)

  const partyOrder = useMemo(() => new Map(parties.map((p, i) => [p.id, i])), [parties])
  const partyName = useMemo(() => new Map(parties.map((p) => [p.id, p.shortName])), [parties])

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
    title: `${b.name}, ${partyName.get(b.partyId ?? "") ?? "Independent"}: ${BALLOT_LABEL[b.ballot]}${b.isDissent ? " (broke with party)" : ""}`,
    dim: (filtering && !matches(b)) || (hovered !== null && hovered !== b.memberId),
    active: hovered === b.memberId,
  }))

  const rows = ballots.filter(matches).sort((a, b) => {
    const k = sort.key
    const val = (x: BallotRow) =>
      k === "name" ? (x.familyName ?? x.name) : k === "party" ? String(partyOrder.get(x.partyId ?? "") ?? 99).padStart(2, "0") : k === "riding" ? (x.ridingName ?? "") : String(BALLOT_ORDER[x.ballot])
    return val(a).localeCompare(val(b)) * sort.dir || (a.familyName ?? a.name).localeCompare(b.familyName ?? b.name)
  })

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
            label={`Seat chart of ${ballots.length} sitting MPs, arranged by party and coloured by ${colorBy}: ${counts.yea} yea, ${counts.nay} nay, ${counts.paired} paired, ${counts.absent} did not vote. The full list is in the table below.`}
            seatProps={(seat) => ({
              onPointerEnter: () => setHovered(seat.id),
              onPointerLeave: () => setHovered(null),
            })}
          />
          <figcaption className="mt-5 flex flex-wrap items-center justify-between gap-4">
            {colorBy === "ballot" ? (
              <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[0.8125rem] text-ink-2">
                <LegendItem swatch={<span className="size-2.5 rounded-full bg-yea" />} label="Yea" n={counts.yea} />
                <LegendItem swatch={<span className="size-2.5 rounded-full bg-nay" />} label="Nay" n={counts.nay} />
                <LegendItem swatch={<span className="size-2.5 rounded-full border-2 border-paired bg-[repeating-linear-gradient(45deg,var(--ballot-paired)_0_1px,transparent_1px_3px)]" />} label="Paired" n={counts.paired} />
                <LegendItem swatch={<span className="size-2.5 rounded-full border-2 border-absent" />} label="Did not vote" n={counts.absent} />
              </ul>
            ) : (
              <ul className="flex flex-wrap gap-x-4 gap-y-2 text-[0.8125rem] text-ink-2">
                {parties.filter((p) => ballots.some((b) => b.partyId === p.id)).map((p) => (
                  <LegendItem key={p.id} swatch={<PartySwatch partyId={p.id} className="rounded-full" />} label={p.shortName} n={ballots.filter((b) => b.partyId === p.id).length} />
                ))}
                <li className="text-ink-3">Hollow: did not vote or paired</li>
              </ul>
            )}
            <div role="group" aria-label="Colour seats by" className="inline-flex rounded-sm border border-rule p-0.5 text-[0.8125rem]">
              {(["ballot", "party"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={colorBy === m}
                  onClick={() => setColorBy(m)}
                  className={cn("rounded-[2px] px-2.5 py-1 transition-colors duration-150", colorBy === m ? "bg-ink text-paper" : "text-ink-2 hover:text-ink")}
                >
                  By {m}
                </button>
              ))}
            </div>
          </figcaption>
        </figure>

        <div className="min-w-0">
          <h3 className="text-[0.8125rem] font-semibold text-ink">Broke with their party</h3>
          {dissenters.length ? (
            <ul className="mt-2 border-t border-rule">
              {dissenters.map((d) => (
                <li key={d.memberId} className="flex items-baseline justify-between gap-3 border-b border-rule py-2 text-[0.9375rem]" onPointerEnter={() => setHovered(d.memberId)} onPointerLeave={() => setHovered(null)}>
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <PartySwatch partyId={d.partyId} />
                    <Link className="link truncate" href={`/mps/${d.memberId}`}>
                      {d.name}
                    </Link>
                  </span>
                  <span className="shrink-0 text-[0.8125rem] text-ink-2">
                    Voted {BALLOT_LABEL[d.ballot].toLowerCase()}, {partyName.get(d.partyId ?? "")} majority voted {d.ballot === "yea" ? "nay" : "yea"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 border-t border-rule pt-3 text-[0.9375rem] text-ink-2">No one. Every MP who voted sided with their party’s majority.</p>
          )}
          {aside}
        </div>
      </div>

      <section aria-labelledby="ballots" className="mt-14">
        <div className="flex items-baseline justify-between gap-4 border-b border-rule pb-2">
          <h2 id="ballots" className="font-display text-[1.375rem] leading-tight font-semibold">
            Every MP’s vote
          </h2>
          <p className="text-sm text-ink-3" aria-live="polite">
            {rows.length === ballots.length ? `${ballots.length} MPs` : `${rows.length} of ${ballots.length} MPs`}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 py-4 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
          <SearchField className="col-span-2 md:col-span-1" label="Find an MP" value={q} onChange={setQ} placeholder="Name, riding or province" />
          <FilterSelect label="Party" value={party} onChange={setParty} options={[{ value: "", label: "All parties" }, ...parties.filter((p) => ballots.some((b) => b.partyId === p.id)).map((p) => ({ value: p.id, label: p.shortName }))]} />
          <FilterSelect label="Vote" value={ballot} onChange={setBallot} options={[{ value: "", label: "Any vote" }, ...(["yea", "nay", "paired", "absent"] as const).map((b) => ({ value: b, label: BALLOT_LABEL[b] }))]} />
          <label className="col-span-2 flex h-10 cursor-pointer items-center gap-2 text-[0.9375rem] text-ink-2 md:col-span-1">
            <input type="checkbox" checked={dissentOnly} onChange={(e) => setDissentOnly(e.target.checked)} className="size-4 accent-[var(--accent-ink)]" />
            Broke ranks only
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-[0.9375rem]">
            <caption className="sr-only">Every MP’s vote. Column headers sort the table.</caption>
            <thead>
              <tr className="border-b border-rule-strong text-left text-xs text-ink-3">
                {sortButton("name", "MP")}
                {sortButton("party", "Party")}
                {sortButton("riding", "Riding", "hidden sm:table-cell")}
                {sortButton("ballot", "Vote")}
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr
                  key={b.memberId}
                  onPointerEnter={() => setHovered(b.memberId)}
                  onPointerLeave={() => setHovered(null)}
                  className={cn("border-b border-rule transition-colors duration-100", hovered === b.memberId && "bg-paper-sunk")}
                >
                  <th scope="row" className="py-2 pr-3 text-left font-normal">
                    <Link className="hover:underline" href={`/mps/${b.memberId}`}>
                      {b.name}
                    </Link>
                  </th>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-ink-2">
                      <PartySwatch partyId={b.partyId} />
                      {partyName.get(b.partyId ?? "") ?? "Independent"}
                    </span>
                  </td>
                  <td className="hidden py-2 pr-3 text-ink-2 sm:table-cell">
                    {b.ridingName}
                    {b.province ? <span className="text-ink-3">, {b.province}</span> : null}
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    <span className={cn("inline-flex items-center gap-2", b.ballot === "yea" ? "text-ink" : b.ballot === "nay" ? "text-ink" : "text-ink-3")}>
                      <BallotMark ballot={b.ballot} />
                      {BALLOT_LABEL[b.ballot]}
                    </span>
                    {b.isDissent && <span className="ml-2 rounded-sm bg-accent-wash px-1.5 py-0.5 text-[0.75rem] font-medium text-accent-ink">Broke ranks</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="py-8 text-center text-[0.9375rem] text-ink-2">No MPs match these filters.</p>}
        </div>
      </section>
    </div>
  )
}

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
