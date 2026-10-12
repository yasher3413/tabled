import type { Party, VotePartyStat } from "@/lib/queries"
import { PartySwatch } from "./party-tag"

const MAJORITY_LABEL = { yea: "Yea", nay: "Nay", tie: "Split evenly", none: "Did not vote" } as const

/** Party-by-party breakdown in a ruled table: position, yeas, nays, and dissent called out. */
export function PartyBreakdown({ stats, parties, caption }: { stats: VotePartyStat[]; parties: Party[]; caption?: string }) {
  const rows = parties
    .map((p) => ({ party: p, stat: stats.find((s) => s.partyId === p.id) }))
    .filter((r): r is { party: Party; stat: VotePartyStat } => !!r.stat)
  if (!rows.length) return <p className="text-sm text-ink-3">Party breakdown unavailable for this vote.</p>
  return (
    <table className="w-full text-[0.875rem]">
      {caption && <caption className="sr-only">{caption}</caption>}
      <thead>
        <tr className="border-b border-rule text-left text-xs text-ink-3">
          <th scope="col" className="py-2 pr-3 font-medium">Party</th>
          <th scope="col" className="py-2 pr-3 font-medium">Position</th>
          <th scope="col" className="py-2 pr-3 text-right font-medium">Yea</th>
          <th scope="col" className="py-2 pr-3 text-right font-medium">Nay</th>
          <th scope="col" className="hidden py-2 text-right font-medium sm:table-cell">Did not vote</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ party, stat }) => {
          const voting = stat.yeas + stat.nays
          return (
            <tr key={party.id} className="border-b border-rule last:border-b-0">
              <th scope="row" className="py-2 pr-3 text-left font-normal">
                <span className="inline-flex items-center gap-2">
                  <PartySwatch partyId={party.id} />
                  {party.shortName}
                </span>
              </th>
              <td className="py-2 pr-3">
                <span className="text-ink">{MAJORITY_LABEL[stat.majority]}</span>
                {stat.dissentCount > 0 && voting >= 2 && (
                  <span className="ml-2 text-[0.8125rem] text-ink-3">
                    {stat.dissentCount} broke ranks
                  </span>
                )}
              </td>
              <td className="py-2 pr-3 text-right tabular-nums">{stat.yeas}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{stat.nays}</td>
              <td className="hidden py-2 text-right text-ink-3 tabular-nums sm:table-cell">{stat.paired + stat.absent}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
