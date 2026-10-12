import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, ChevronRight, Rss } from "lucide-react"
import { Container, PageHeader, SectionHeading } from "@/components/tabled/page-header"
import { VoteRow } from "@/components/tabled/vote-row"
import { localePath, type Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { formatDate } from "@/lib/format"
import { alternates } from "@/lib/metadata"
import { activeWeeks, weekDigest } from "@/lib/digest"
import { getDataDate, getDataYear, type DigestEvent } from "@/lib/queries"
import { describeStageEvent } from "@/lib/stages"
import { isWeekKey, weekKey, weekRange } from "@/lib/weeks"
import { INTL_LOCALE } from "@/i18n/config"

export { activeWeeks } from "@/lib/digest"

export function digestMetadata(locale: Locale, week?: string): Metadata {
  const t = getMessages(locale).digest
  const { start } = weekRange(week ?? weekKey(getDataDate()))
  return {
    title: week ? t.weekOf(formatDate(start, locale)) : t.title,
    description: t.lede,
    alternates: { ...alternates(locale, week ? `/this-week/${week}` : "/this-week"), types: { "application/rss+xml": localePath(locale, "/this-week/rss.xml") } },
  }
}

function dayLabel(date: string, locale: Locale) {
  const label = new Intl.DateTimeFormat(INTL_LOCALE[locale], { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function DigestView({ locale, week }: { locale: Locale; week?: string }) {
  if (week && !isWeekKey(week)) notFound()
  const weeks = activeWeeks()
  if (week && !weeks.includes(week)) notFound()
  const current = weekKey(getDataDate())
  // Early in a week nothing may have happened yet; show the latest week that has something.
  const key = week ?? (weeks.includes(current) || !weeks[0] ? current : weeks[0])
  const isCurrent = key === current
  const t = getMessages(locale).digest
  const fr = locale === "fr"
  const L = (p: string) => localePath(locale, p)
  const d = weekDigest(key)
  const year = getDataYear()
  const older = weeks.filter((w) => w < key)
  const newer = weeks.filter((w) => w > key).reverse()
  const byDay = new Map<string, DigestEvent[]>()
  for (const e of d.events) byDay.set(e.date, [...(byDay.get(e.date) ?? []), e])
  const quiet = d.events.length === 0 && d.votes.length === 0

  return (
    <Container>
      <PageHeader
        title={isCurrent ? t.title : t.weekOf(formatDate(d.start, locale))}
        lede={
          <>
            {t.range(formatDate(d.start, locale), formatDate(d.end, locale))}. {quiet ? t.quiet : t.counts(d.events.length, d.votes.length)}
          </>
        }
      >
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-[0.9375rem]">
          {older[0] && (
            <Link className="link inline-flex items-center gap-1" href={L(`/this-week/${older[0]}`)}>
              <ChevronLeft aria-hidden className="size-4" strokeWidth={1.75} />
              {t.previous}
            </Link>
          )}
          {newer[0] && (
            <Link className="link inline-flex items-center gap-1" href={L(`/this-week/${newer[0]}`)}>
              {t.next}
              <ChevronRight aria-hidden className="size-4" strokeWidth={1.75} />
            </Link>
          )}
          <a className="link ml-auto inline-flex items-center gap-1.5" href={L("/this-week/rss.xml")}>
            <Rss aria-hidden className="size-4" strokeWidth={1.75} />
            {t.rss}
          </a>
        </div>
      </PageHeader>

      <div className="mt-12 grid gap-x-14 gap-y-14 lg:grid-cols-[1fr_1fr]">
        <section aria-labelledby="digest-bills">
          <SectionHeading id="digest-bills" aside={d.events.length || undefined}>
            {t.bills}
          </SectionHeading>
          {d.events.length === 0 ? (
            <p className="mt-4 text-[0.9375rem] text-ink-2">{t.noBills}</p>
          ) : (
            [...byDay].map(([day, events]) => (
              <div key={day} className="mt-6">
                <h3 className="text-[0.8125rem] font-semibold text-ink">
                  <time dateTime={day}>{dayLabel(day, locale)}</time>
                </h3>
                <ul className="mt-2 border-t border-rule">
                  {events.map((e) => (
                    <li key={`${e.billId}-${e.stageKey}`} className="group relative grid grid-cols-[4.5rem_1fr] gap-x-4 border-b border-rule py-3">
                      <span className="font-display text-[1.0625rem] font-semibold tabular-nums">{e.number}</span>
                      <span className="min-w-0">
                        <Link href={L(`/bills/${e.sessionId}/${e.number}`)} className="line-clamp-2 block text-[0.9375rem] leading-snug text-ink after:absolute after:inset-0 group-hover:underline">
                          {fr ? (e.shortTitleFr ?? e.titleFr ?? e.shortTitle ?? e.title) : (e.shortTitle ?? e.title)}
                        </Link>
                        <span className={e.stageKey === "crown:royal-assent" ? "text-[0.8125rem] font-medium text-ink" : e.state === "defeated" ? "text-[0.8125rem] text-danger-ink" : "text-[0.8125rem] text-ink-3"}>
                          {describeStageEvent(e.stageKey, e.state, locale)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>

        <section aria-labelledby="digest-votes">
          <SectionHeading id="digest-votes" aside={d.votes.length || undefined}>
            {t.votes}
          </SectionHeading>
          {d.votes.length === 0 ? (
            <p className="mt-4 text-[0.9375rem] text-ink-2">{t.noVotes}</p>
          ) : (
            <div className="[&_article]:md:grid-cols-1 [&_article>div:first-child]:md:block">
              {d.votes.map((v) => (
                <VoteRow key={v.id} vote={v} referenceYear={year} locale={locale} />
              ))}
            </div>
          )}
        </section>
      </div>

      {older.length > 0 && (
        <section aria-labelledby="digest-archive" className="mt-16">
          <SectionHeading id="digest-archive">{t.archive}</SectionHeading>
          <ul className="mt-2 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
            {older.slice(0, 12).map((w) => (
              <li key={w} className="border-b border-rule py-2.5">
                <Link className="link text-[0.9375rem]" href={L(`/this-week/${w}`)}>
                  {t.weekOf(formatDate(weekRange(w).start, locale))}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Container>
  )
}
