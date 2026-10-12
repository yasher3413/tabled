import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Container, SectionHeading } from "@/components/tabled/page-header"
import { PartyBreakdown } from "@/components/tabled/party-breakdown"
import { VoteTally } from "@/components/tabled/vote-tally"
import { VoteChamber } from "@/components/votes/vote-chamber"
import { localePath, type Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { formatDate } from "@/lib/format"
import { alternates } from "@/lib/metadata"
import { getVote, listParties } from "@/lib/queries"
import { SITE_URL } from "@/lib/site"
import { EmbedSnippet } from "@/components/votes/embed-snippet"

export type VoteParams = { session: string; number: string }

export function voteMetadata(locale: Locale, session: string, number: string): Metadata {
  const data = /^\d+$/.test(number) ? getVote(session, Number(number)) : null
  const fr = locale === "fr"
  if (!data) return { title: fr ? "Vote introuvable" : "Vote not found" }
  const m = getMessages(locale)
  const v = data.vote
  const desc = fr ? (v.descriptionFr ?? v.descriptionEn) : v.descriptionEn
  return {
    title: fr ? `${m.home.voteN(v.number)} : ${desc}` : `${m.home.voteN(v.number)}: ${desc}`,
    description: fr
      ? `${m.vote[v.result]} par ${v.yeas} voix contre ${v.nays} le ${formatDate(v.date, locale)}. Le vote de chaque député et de chaque parti.`
      : `${m.vote[v.result]} ${v.yeas} to ${v.nays} on ${formatDate(v.date, locale)}. See how every MP and party voted.`,
    alternates: alternates(locale, `/votes/${v.sessionId}/${v.number}`),
    ...(fr ? { openGraph: { images: [`/votes/${v.sessionId}/${v.number}/opengraph-image`] } } : {}),
  }
}

export function VoteView({ locale, session, number }: { locale: Locale } & VoteParams) {
  const data = /^\d+$/.test(number) ? getVote(session, Number(number)) : null
  if (!data) notFound()
  const m = getMessages(locale)
  const t = m.voteDetail
  const fr = locale === "fr"
  const L = (p: string) => localePath(locale, p)
  const { vote: v, partyStats, ballots } = data
  const parties = listParties()
  const official = v.sourceUrl.includes("ourcommons")
  const billShort = fr ? (v.billShortTitleFr ?? v.billShortTitle) : v.billShortTitle
  return (
    <article>
      <Container>
        <header className="border-b border-rule-strong pt-10 pb-8 sm:pt-14">
          <nav aria-label={fr ? "Fil d’Ariane" : "Breadcrumb"} className="text-sm text-ink-3">
            <Link className="link" href={L("/votes")}>
              {t.breadcrumb}
            </Link>
            <span aria-hidden className="mx-2">/</span>
            <span>{m.home.voteN(v.number)}</span>
          </nav>
          <h1 className="mt-6 max-w-[30ch] font-display text-[2rem] leading-[1.1] font-semibold tracking-[-0.015em] sm:text-[2.75rem]">
            {fr ? (v.descriptionFr ?? v.descriptionEn) : v.descriptionEn}
          </h1>
          <p className="mt-4 text-[1rem] text-ink-2">
            {fr ? `Vote par appel nominal no ${v.number} à la Chambre des communes, le ` : `Recorded vote ${v.number} in the House of Commons, `}
            <time dateTime={v.date}>{formatDate(v.date, locale)}</time>
            {v.billNumber && (
              <>
                {fr ? ", sur le " : ", on "}
                <Link className="link" href={L(`/bills/${v.billSession}/${v.billNumber}`)}>
                  {fr ? "projet de loi" : "Bill"} {v.billNumber}
                  {billShort ? `, ${billShort}` : ""}
                </Link>
              </>
            )}
          </p>
          <div className="mt-8 grid max-w-3xl items-end gap-x-10 gap-y-4 sm:grid-cols-[auto_1fr]">
            <p className="font-display text-[3.5rem] leading-none font-semibold tracking-[-0.02em] text-ink">{m.vote[v.result]}</p>
            <VoteTally yeas={v.yeas} nays={v.nays} paired={v.paired} result={v.result} size="lg" showResult={false} className="pb-1.5" locale={locale} />
          </div>
          {v.hasPartySplit && <p className="measure mt-5 text-[0.9375rem] text-ink-2">{t.splitNote}</p>}
        </header>

        <section aria-labelledby="chamber" className="mt-12">
          <SectionHeading id="chamber">{t.whoVoted}</SectionHeading>
          <div className="mt-6">
            <VoteChamber
              ballots={ballots}
              parties={parties}
              locale={locale}
              aside={
                <div className="mt-10">
                  <h3 className="text-[0.8125rem] font-semibold text-ink">{t.byParty}</h3>
                  <PartyBreakdown
                    stats={partyStats}
                    parties={parties}
                    caption={m.bill.partyBreakdownFor(v.number)}
                    totals={{ yeas: v.yeas, nays: v.nays, notVoting: ballots.filter((b) => b.ballot === "absent" || b.ballot === "paired").length }}
                    locale={locale}
                  />
                </div>
              }
            />
          </div>
        </section>

        <p className="mt-12 text-[0.8125rem] text-ink-3">
          {t.source}{" "}
          <a className="link" href={v.sourceUrl}>
            {official ? t.houseOfCommons : "openparliament.ca"}
          </a>
          {official && t.official}. {t.partyAtTime}
        </p>
        <EmbedSnippet
          src={`${SITE_URL}${localePath(locale, `/embed/votes/${v.sessionId}/${v.number}`)}`}
          title={`${m.home.voteN(v.number)}: ${fr ? (v.descriptionFr ?? v.descriptionEn) : v.descriptionEn}`}
          locale={locale}
        />
      </Container>
    </article>
  )
}
