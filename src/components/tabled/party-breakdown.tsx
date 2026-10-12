import type { Party, VotePartyStat } from "@/lib/queries"
import type { Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { partyShort } from "@/i18n/parties"
import { PartySwatch } from "./party-tag"

/** Party-by-party breakdown in a ruled table: position, yeas, nays, and dissent called out. */
export function PartyBreakdown({
  stats,
  parties,
  caption,
  totals,
  locale = "en",
}: {
  stats: VotePartyStat[]
  parties: Party[]
  caption?: string
  /** Official totals, set at the foot of the table under a double rule, as on a printed division list. */
  totals?: { yeas: number; nays: number; notVoting: number }
  locale?: Locale
}) {
  const t = getMessages(locale).vote
  const rows = parties
    .map((p) => ({ party: p, stat: stats.find((s) => s.partyId === p.id) }))
    .filter((r): r is { party: Party; stat: VotePartyStat } => !!r.stat)
  if (!rows.length) return <p className="text-sm text-ink-3">{t.breakdownUnavailable}</p>
  return (
    <table className="w-full text-[0.875rem]">
      {caption && <caption className="sr-only">{caption}</caption>}
      <thead>
        <tr className="border-b border-rule text-left text-xs text-ink-3">
          <th scope="col" className="py-2 pr-3 font-medium">{t.party}</th>
          <th scope="col" className="py-2 pr-3 font-medium">{t.position}</th>
          <th scope="col" className="py-2 pr-3 text-right font-medium">{t.yea}</th>
          <th scope="col" className="py-2 pr-3 text-right font-medium">{t.nay}</th>
          <th scope="col" className="hidden py-2 text-right font-medium sm:table-cell">{t.didNotVote}</th>
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
                  {partyShort(party, locale)}
                </span>
              </th>
              <td className="py-2 pr-3">
                <span className="text-ink">{t.majority[stat.majority]}</span>
                {stat.dissentCount > 0 && voting >= 2 && (
                  <span className="ml-2 text-[0.8125rem] text-ink-3">
                    {t.brokeRanks(stat.dissentCount)}
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
      {totals && (
        <tfoot>
          <tr className="font-display text-[1.75rem] leading-none font-semibold tabular-nums">
            <th scope="row" className="rule-total pt-2 pr-3 text-left font-sans text-[0.8125rem] font-semibold text-ink">
              Total
            </th>
            <td className="rule-total pt-2 pr-3" />
            <td className="rule-total pt-2 pr-3 text-right">{totals.yeas}</td>
            <td className="rule-total pt-2 pr-3 text-right">{totals.nays}</td>
            <td className="rule-total hidden pt-2 text-right text-[1.25rem] text-ink-3 sm:table-cell">{totals.notVoting}</td>
          </tr>
        </tfoot>
      )}
    </table>
  )
}
