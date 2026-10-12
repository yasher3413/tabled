import { notFound } from "next/navigation"
import { LogoMark } from "@/components/site/logo"
import { PartySwatch } from "@/components/tabled/party-tag"
import { VoteTally } from "@/components/tabled/vote-tally"
import { localePath, type Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { partyShort } from "@/i18n/parties"
import { formatDate } from "@/lib/format"
import { getVote, listParties } from "@/lib/queries"
import { SITE_URL } from "@/lib/site"

/** A compact, self-contained vote result for other sites to embed. */
export function VoteEmbed({ locale, session, number }: { locale: Locale; session: string; number: string }) {
  const data = /^\d+$/.test(number) ? getVote(session, Number(number)) : null
  if (!data) notFound()
  const m = getMessages(locale)
  const fr = locale === "fr"
  const { vote: v, partyStats } = data
  const parties = listParties().filter((p) => partyStats.some((s) => s.partyId === p.id))
  const href = `${SITE_URL}${localePath(locale, `/votes/${v.sessionId}/${v.number}`)}`
  return (
    <article lang={fr ? "fr-CA" : "en-CA"} className="mx-auto max-w-[40rem] border border-rule bg-paper-raised p-5 text-ink">
      <p className="text-[0.8125rem] text-ink-3">
        {m.home.voteN(v.number)} · {fr ? "Chambre des communes" : "House of Commons"} · {formatDate(v.date, locale)}
      </p>
      <h1 className="mt-1.5 line-clamp-3 font-display text-[1.25rem] leading-snug font-semibold">
        <a href={href} target="_blank" rel="noopener" className="hover:underline">
          {fr ? (v.descriptionFr ?? v.descriptionEn) : v.descriptionEn}
        </a>
      </h1>
      <div className="mt-4 flex items-end gap-5">
        <p className="font-display text-[2rem] leading-none font-semibold">{m.vote[v.result]}</p>
        <VoteTally className="flex-1 pb-1" yeas={v.yeas} nays={v.nays} paired={v.paired} result={v.result} showResult={false} locale={locale} />
      </div>
      <table className="mt-4 w-full text-[0.8125rem]">
        <caption className="sr-only">{m.bill.partyBreakdownFor(v.number)}</caption>
        <thead>
          <tr className="border-b border-rule text-left text-ink-3">
            <th scope="col" className="py-1.5 font-medium">{m.vote.party}</th>
            <th scope="col" className="py-1.5 text-right font-medium">{m.vote.yea}</th>
            <th scope="col" className="py-1.5 text-right font-medium">{m.vote.nay}</th>
          </tr>
        </thead>
        <tbody>
          {parties.map((p) => {
            const s = partyStats.find((x) => x.partyId === p.id)!
            return (
              <tr key={p.id} className="border-b border-rule last:border-0">
                <th scope="row" className="py-1.5 text-left font-normal">
                  <span className="inline-flex items-center gap-1.5">
                    <PartySwatch partyId={p.id} />
                    {partyShort(p, locale)}
                  </span>
                </th>
                <td className="py-1.5 text-right tabular-nums">{s.yeas}</td>
                <td className="py-1.5 text-right tabular-nums">{s.nays}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="mt-4 flex items-center justify-between gap-3 border-t border-rule pt-3 text-[0.8125rem]">
        <a href={href} target="_blank" rel="noopener" className="link">
          {fr ? "Voir le vote de chaque député" : "See how every MP voted"}
        </a>
        <span className="inline-flex items-center gap-1.5 text-ink-3">
          <LogoMark className="h-3 w-auto" />
          Tabled
        </span>
      </p>
    </article>
  )
}
