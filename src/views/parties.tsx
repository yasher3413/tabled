import type { Metadata } from "next"
import Link from "next/link"
import { HouseComposition } from "@/components/tabled/house-composition"
import { Container, PageHeader, SectionHeading } from "@/components/tabled/page-header"
import { PartySwatch } from "@/components/tabled/party-tag"
import { formatPercent } from "@/lib/format"
import { houseComposition, listMembers, partySummaries } from "@/lib/queries"
import { localePath, type Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { partyName } from "@/i18n/parties"
import { alternates } from "@/lib/metadata"

export function partiesMetadata(locale: Locale): Metadata {
  const t = getMessages(locale).meta
  return { title: t.parties, description: t.partiesDesc, alternates: alternates(locale, "/parties") }
}

export function PartiesView({ locale }: { locale: Locale }) {
  const t = getMessages(locale).parties
  const L = (p: string) => localePath(locale, p)
  const rows = partySummaries().filter((r) => r.seats > 0)
  const house = houseComposition()
  const independents = listMembers().filter((m) => m.active && m.partyId === "independent")
  return (
    <Container>
      <PageHeader title={t.title} lede={t.lede} />

      <div className="mt-12 grid gap-x-16 gap-y-10 lg:grid-cols-[1fr_1.5fr]">
        <div className="mx-auto w-full max-w-[26rem] lg:mx-0">
          <HouseComposition parties={house.parties} vacant={house.vacant} seatsTotal={house.seatsTotal} locale={locale} />
        </div>
        <div className="min-w-0">
          <SectionHeading>{t.byParty}</SectionHeading>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-[0.9375rem]">
              <caption className="sr-only">{t.caption}</caption>
              <thead>
                <tr className="border-b border-rule-strong text-left text-xs text-ink-3">
                  <th scope="col" className="py-2 pr-3 font-medium">{t.party}</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">{t.seats}</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">{t.cohesion}</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">{t.splitVotes}</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">{t.billsSponsored}</th>
                  <th scope="col" className="py-2 text-right font-medium">{t.becameLaw}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.party.id} className="border-b border-rule">
                    <th scope="row" className="py-3 pr-3 text-left font-normal">
                      <span className="inline-flex items-center gap-2">
                        <PartySwatch partyId={r.party.id} />
                        <Link className="hover:underline" href={L(`/mps?party=${r.party.id}`)}>
                          {partyName(r.party, locale)}
                        </Link>
                      </span>
                    </th>
                    <td className="py-3 pr-3 text-right font-display text-lg font-semibold tabular-nums">{r.seats}</td>
                    <td className="py-3 pr-3 text-right tabular-nums">{r.cohesionSample >= 2 ? formatPercent(r.cohesion, 1, locale) : <span className="text-ink-3">{formatPercent(null, 1, locale)}</span>}</td>
                    <td className="py-3 pr-3 text-right text-ink-2 tabular-nums">{r.seats >= 2 ? getMessages(locale).mps.of(r.splitVotes, r.votesWithPosition) : <span className="text-ink-3">{formatPercent(null, 1, locale)}</span>}</td>
                    <td className="py-3 pr-3 text-right tabular-nums">
                      <Link className="hover:underline" href={L(`/bills?party=${r.party.id}`)}>
                        {r.billsSponsored}
                      </Link>
                    </td>
                    <td className="py-3 text-right text-ink-2 tabular-nums">{r.billsBecameLaw}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {independents.length > 0 && (
            <p className="mt-4 text-[0.875rem] text-ink-2">
              {t.independents(independents.length)}
            </p>
          )}
          <dl className="mt-10 grid gap-6 text-[0.875rem] leading-relaxed text-ink-2 sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-ink">{t.cohesion}</dt>
              <dd className="mt-1">{t.cohesionDef}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">{t.splitVotes}</dt>
              <dd className="mt-1">{t.splitDef}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">{t.billsSponsored}</dt>
              <dd className="mt-1">{t.billsDef}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">{t.order}</dt>
              <dd className="mt-1">
                {t.orderDef}{" "}
                <Link className="link" href={L("/about#methodology")}>
                  {t.methodology}
                </Link>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </Container>
  )
}
