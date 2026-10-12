import Link from "next/link"
import { PostalForm } from "@/components/home/postal-form"
import { SearchLauncher } from "@/components/home/search-launcher"
import { BillRow } from "@/components/tabled/bill-row"
import { HouseComposition } from "@/components/tabled/house-composition"
import { Container, SectionHeading } from "@/components/tabled/page-header"
import { EmptyState } from "@/components/tabled/states"
import { VoteTally } from "@/components/tabled/vote-tally"
import { formatShortDate } from "@/lib/format"
import {
  addDays,
  billsMovedSince,
  getDataDate,
  getDataYear,
  houseComposition,
  listVotes,
  partyMap,
  recentlyIntroduced,
} from "@/lib/queries"
import { describeStageEvent } from "@/lib/stages"
import { localePath, type Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"

export function HomeView({ locale }: { locale: Locale }) {
  const t = getMessages(locale).home
  const fr = locale === "fr"
  const L = (p: string) => localePath(locale, p)
  const today = getDataDate()
  const year = getDataYear()
  const since = addDays(today, -7)
  let moved = billsMovedSince(since)
  let votes = listVotes().filter((v) => v.date >= since)
  const quietWeek = moved.length === 0 && votes.length === 0
  if (quietWeek) {
    moved = billsMovedSince(addDays(today, -60)).slice(0, 6)
    votes = listVotes().slice(0, 5)
  }
  const house = houseComposition()
  const parties = partyMap()
  const introduced = recentlyIntroduced(5)

  return (
    <>
      <Container>
        <section className="grid items-center gap-x-16 gap-y-12 border-b border-rule-strong pt-12 pb-14 sm:pt-16 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <h1 className="font-display text-[2.75rem] leading-[1.02] font-semibold tracking-[-0.025em] sm:text-[4rem]">
              {t.title}
            </h1>
            <p className="mt-5 max-w-[38rem] text-lg leading-relaxed text-ink-2">
              {t.lede}
            </p>
            <div className="mt-8 grid max-w-[40rem] gap-3 sm:grid-cols-2">
              <SearchLauncher locale={locale} />
              <PostalForm locale={locale} />
            </div>
          </div>
          <div className="mx-auto w-full max-w-[28rem]">
            <HouseComposition parties={house.parties} vacant={house.vacant} seatsTotal={house.seatsTotal} locale={locale} />
          </div>
        </section>

        <section aria-labelledby="this-week" className="mt-14">
          <SectionHeading id="this-week" aside={quietWeek ? t.mostRecent : `${formatShortDate(since, year, locale)} ${fr ? "au" : "to"} ${formatShortDate(today, year, locale)}`}>
            {t.thisWeek}
          </SectionHeading>
          {quietWeek && (
            <p className="mt-4 text-[0.9375rem] text-ink-2">
              {t.quiet}
            </p>
          )}
          <div className="mt-2 grid gap-x-14 lg:grid-cols-2">
            <div>
              <h3 className="pt-5 pb-2 text-[0.8125rem] font-semibold text-ink">{t.billsMoved}</h3>
              {moved.length ? (
                <ul className="border-t border-rule">
                  {moved.slice(0, 8).map((m) => (
                    <li key={m.bill.id} className="group relative grid grid-cols-[4.5rem_1fr_auto] gap-x-4 border-b border-rule py-3.5">
                      <span className="font-display text-[1.0625rem] font-semibold tabular-nums">{m.bill.number}</span>
                      <span className="min-w-0">
                        <Link href={L(`/bills/${m.bill.sessionId}/${m.bill.number}`)} className="line-clamp-2 block text-[0.9375rem] leading-snug text-ink after:absolute after:inset-0 group-hover:underline">
                          {fr ? (m.bill.shortTitleFr ?? m.bill.titleFr ?? m.bill.shortTitle ?? m.bill.title) : (m.bill.shortTitle ?? m.bill.title)}
                        </Link>
                        <span className={m.stageKey === "crown:royal-assent" ? "text-[0.8125rem] font-medium text-accent-ink" : m.state === "defeated" ? "text-[0.8125rem] text-danger-ink" : "text-[0.8125rem] text-ink-3"}>
                          {describeStageEvent(m.stageKey, m.state, locale)}
                        </span>
                      </span>
                      <span className="text-[0.8125rem] whitespace-nowrap text-ink-3">{formatShortDate(m.date, year, locale)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title={t.noBillsMoved} className="border-t-0" />
              )}
              <Link href={L("/bills")} className="link mt-4 inline-block text-[0.9375rem]">
                {t.allBills}
              </Link>
            </div>
            <div>
              <h3 className="pt-5 pb-2 text-[0.8125rem] font-semibold text-ink">{t.recordedVotes}</h3>
              {votes.length ? (
                <ul className="border-t border-rule">
                  {votes.slice(0, 6).map((v) => (
                    <li key={v.id} className="group relative border-b border-rule py-3.5">
                      <div className="flex items-baseline justify-between gap-4">
                        <Link href={L(`/votes/${v.sessionId}/${v.number}`)} className="line-clamp-2 block text-[0.9375rem] leading-snug text-ink after:absolute after:inset-0 group-hover:underline">
                          {fr ? (v.descriptionFr ?? v.descriptionEn) : v.descriptionEn}
                        </Link>
                        <span className="shrink-0 text-[0.8125rem] text-ink-3">{formatShortDate(v.date, year, locale)}</span>
                      </div>
                      <p className="mt-0.5 text-[0.8125rem] text-ink-3">
                        {t.voteN(v.number)}
                        {v.billNumber ? `, ${v.billNumber}` : ""}
                      </p>
                      <VoteTally className="mt-2.5" size="sm" yeas={v.yeas} nays={v.nays} paired={v.paired} result={v.result} locale={locale} />
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title={t.noVotes} className="border-t-0" />
              )}
              <Link href={L("/votes")} className="link mt-4 inline-block text-[0.9375rem]">
                {t.allVotes}
              </Link>
            </div>
          </div>
        </section>

        <section aria-labelledby="introduced" className="mt-16">
          <SectionHeading id="introduced" aside={<Link className="link" href={L("/bills?sort=introduced")}>{t.seeAll}</Link>}>
            {t.recentlyIntroduced}
          </SectionHeading>
          <div>
            {introduced.map((b) => (
              <BillRow key={b.id} bill={b} party={b.sponsorPartyId ? parties.get(b.sponsorPartyId) : undefined} referenceYear={year} dateField="introduced" locale={locale} />
            ))}
          </div>
        </section>
      </Container>
    </>
  )
}
