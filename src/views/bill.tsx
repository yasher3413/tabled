import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowUpRight } from "lucide-react"
import { PartyTag } from "@/components/tabled/party-tag"
import { Container, SectionHeading } from "@/components/tabled/page-header"
import { PartyBreakdown } from "@/components/tabled/party-breakdown"
import { StageTimeline } from "@/components/tabled/stage-timeline"
import { SummaryBlock } from "@/components/tabled/summary-block"
import { VoteTally } from "@/components/tabled/vote-tally"
import { EmptyState } from "@/components/tabled/states"
import { localePath, type Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { partyShort } from "@/i18n/parties"
import { formatDate, formatShortDate } from "@/lib/format"
import { alternates } from "@/lib/metadata"
import { getBill, getDataYear, listParties } from "@/lib/queries"
import { SITE_URL } from "@/lib/site"
import { billTypeExplainer, currentStageLabel, describeStage, stageInfo } from "@/lib/stages"

export type BillParams = { session: string; number: string }

/** parl.ca links are bilingual by path segment. */
function frenchUrl(url: string | null) {
  return url ? url.replace("/legisinfo/en/", "/legisinfo/fr/").replace("/DocumentViewer/en/", "/DocumentViewer/fr/").replace(/(LegislativeSummaries\/\d+[CS]\d+)E$/, "$1F").replace("/en_CA/", "/fr_CA/") : null
}

export function billMetadata(locale: Locale, session: string, number: string): Metadata {
  const t = getMessages(locale)
  const data = getBill(session, number)
  if (!data) return { title: locale === "fr" ? "Projet de loi introuvable" : "Bill not found" }
  const { bill, summary } = data
  const fr = locale === "fr"
  const title = fr ? (bill.shortTitleFr ?? bill.titleFr ?? bill.titleEn) : (bill.shortTitleEn ?? bill.titleEn)
  const long = fr ? (bill.titleFr ?? bill.titleEn) : bill.titleEn
  return {
    title: `${bill.number} : ${title}`.replace(" : ", fr ? " : " : ": "),
    description: (!fr && summary?.parsed.tldr) || `${long}. ${currentStageLabel(bill.currentStage, locale)}. ${t.bills.typeLabels[bill.type]}.`,
    alternates: { ...alternates(locale, `/bills/${bill.sessionId}/${bill.number}`), types: { "application/rss+xml": localePath(locale, `/bills/${bill.sessionId}/${bill.number}/rss.xml`) } },
    // French pages reuse the English card; it carries the bill number and title.
    ...(fr ? { openGraph: { images: [`/bills/${bill.sessionId}/${bill.number}/opengraph-image`] } } : {}),
  }
}

export function BillView({ locale, session, number }: { locale: Locale } & BillParams) {
  const data = getBill(session, number)
  if (!data) notFound()
  const m = getMessages(locale)
  const t = m.bill
  const fr = locale === "fr"
  const L = (p: string) => localePath(locale, p)
  const { bill, stages, votes, summary, sponsor, excerpts } = data
  const parties = listParties()
  const year = getDataYear()
  const sponsorParty = parties.find((p) => p.id === (bill.sponsorPartyId ?? sponsor?.partyId))
  const pageUrl = `${SITE_URL}${L(`/bills/${bill.sessionId}/${bill.number}`)}`
  const current = stages.find((s) => s.state === "in_progress")
  // A stage's date is when it began; fall back to the previous stage's completion.
  const currentSince = current ? (current.date ?? stages.filter((s) => s.ordinal < current.ordinal && s.date).at(-1)?.date ?? null) : null
  const defeatedStage = stages.find((s) => s.state === "defeated")
  const defeatedAt = defeatedStage
    ? fr
      ? `${stageInfo(defeatedStage.stageKey, "fr").label.toLowerCase()} ${defeatedStage.chamber === "senate" ? "au Sénat" : "à la Chambre des communes"}`
      : `${stageInfo(defeatedStage.stageKey).label.toLowerCase()} in the ${defeatedStage.chamber === "senate" ? "Senate" : "House of Commons"}`
    : null
  const textUrl = fr ? frenchUrl(bill.textUrl) : bill.textUrl
  const links = [
    textUrl && { label: t.fullText, href: textUrl },
    { label: t.legisinfo, href: fr ? frenchUrl(bill.legisinfoUrl)! : bill.legisinfoUrl },
    bill.legislativeSummaryUrl && { label: t.lopSummary, href: fr ? frenchUrl(bill.legislativeSummaryUrl)! : bill.legislativeSummaryUrl },
  ].filter((l): l is { label: string; href: string } => !!l)
  const shortTitle = fr ? (bill.shortTitleFr ?? null) : bill.shortTitleEn
  const longTitle = fr ? (bill.titleFr ?? bill.titleEn) : bill.titleEn
  const status = fr ? (bill.statusFr ?? bill.statusEn) : bill.statusEn

  return (
    <article>
      <Container>
        <header className="border-b border-rule-strong pt-10 pb-8 sm:pt-14">
          <nav aria-label={fr ? "Fil d’Ariane" : "Breadcrumb"} className="text-sm text-ink-3">
            <Link className="link" href={L("/bills")}>
              {t.breadcrumb}
            </Link>
            <span aria-hidden className="mx-2">/</span>
            <span>{bill.number}</span>
          </nav>
          <h1 className="mt-6 max-w-[22ch] font-display text-[2.375rem] leading-[1.05] font-semibold tracking-[-0.02em] sm:text-[3.5rem]">
            <span className="block text-ink-3 tabular-nums">{bill.number}</span>
            {shortTitle ?? longTitle}
          </h1>
          {shortTitle && <p className="measure mt-4 text-lg leading-relaxed text-ink-2">{longTitle}</p>}
          <p className="mt-3 text-[0.9375rem] text-ink-3">
            {m.bills.typeLabels[bill.type]}, {t.introducedIn(bill.chamber === "house" ? t.houseOfCommons : t.theSenate, bill.introducedDate ? formatDate(bill.introducedDate, locale) : null).replace(/^./, (c) => c.toLowerCase())}
          </p>
          <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4 text-[0.9375rem]">
            <div>
              <dt className="text-[0.8125rem] text-ink-3">{t.status}</dt>
              <dd title={status} className={bill.isLaw ? "font-medium text-ink" : bill.isDefeated ? "font-medium text-danger-ink" : "text-ink"}>
                {bill.isLaw
                  ? t.becameLawOn(formatDate(bill.royalAssentDate, locale))
                  : bill.isDefeated
                    ? t.defeatedAt(defeatedAt)
                    : `${describeStage(bill.currentStage, "status", locale)}${currentSince ? t.since(formatDate(currentSince, locale)) : ""}`}
                {bill.statuteChapter && <span className="text-ink-3"> · {fr ? bill.statuteChapter.replace("S.C.", "L.C.").replace("c.", "ch.") : bill.statuteChapter}</span>}
              </dd>
            </div>
            <div>
              <dt className="text-[0.8125rem] text-ink-3">{t.sponsor}</dt>
              <dd>
                {sponsor ? (
                  <Link href={L(`/mps/${sponsor.id}`)} className="link name-sc">
                    {bill.sponsorName ?? sponsor.name}
                  </Link>
                ) : (
                  (bill.sponsorName ?? <span className="text-ink-3">{t.notRecorded}</span>)
                )}
                {sponsorParty && <PartyTag partyId={sponsorParty.id} label={partyShort(sponsorParty, locale)} className="ml-2.5" />}
                {!sponsor && bill.chamber === "senate" && bill.sponsorName && <span className="ml-2 text-[0.8125rem] text-ink-3">{t.senatorTag}</span>}
              </dd>
              {(fr ? bill.sponsorTitleFr : bill.sponsorTitle) && <dd className="mt-0.5 max-w-[46ch] text-[0.8125rem] text-ink-3">{fr ? bill.sponsorTitleFr : bill.sponsorTitle}</dd>}
            </div>
          </dl>
        </header>

        <section aria-labelledby="summary" className="mt-12">
          <SectionHeading id="summary">{t.whatItDoes}</SectionHeading>
          <div className="mt-6">
            <SummaryBlock
              billNumber={bill.number}
              pageUrl={pageUrl}
              // Summaries are generated from English sources only; French pages show Parliament's French summary.
              summary={!fr && summary ? { parsed: summary.parsed, model: summary.model, generatedAt: summary.generatedAt, sourceUrl: summary.sourceUrl } : null}
              officialSummary={fr ? bill.legisinfoSummaryTextFr : bill.legisinfoSummaryText}
              sourceLinks={links}
              locale={locale}
            />
          </div>
        </section>

        <section aria-labelledby="progress" className="mt-16">
          <SectionHeading id="progress" aside={bill.lastActivityDate ? t.lastActivity(formatShortDate(bill.lastActivityDate, year, locale)) : undefined}>
            {t.whereItIs}
          </SectionHeading>
          <div className="mt-6">
            <StageTimeline stages={stages} referenceYear={year} locale={locale} />
          </div>
          <p className="measure mt-8 text-[0.875rem] leading-relaxed text-ink-3">
            {billTypeExplainer(bill.type, locale)}{" "}
            <Link className="link" href={L("/about#how-a-bill-becomes-law")}>
              {t.howABillBecomesLaw}
            </Link>
          </p>
        </section>

        <section aria-labelledby="votes" className="mt-16">
          <SectionHeading id="votes" aside={votes.length ? t.recordedVotes(votes.length) : undefined}>
            {t.howVoted}
          </SectionHeading>
          {votes.length === 0 ? (
            <EmptyState title={t.noVotes} className="mt-6" action={{ href: L("/votes"), label: t.seeAllVotes }}>
              {t.noVotesHint}
            </EmptyState>
          ) : (
            <ol className="mt-2">
              {votes.map((v) => (
                <li key={v.id} className="grid gap-x-10 gap-y-4 border-b border-rule py-6 lg:grid-cols-[1fr_1.1fr]">
                  <div className="min-w-0">
                    <h3 className="text-[1.0625rem] leading-snug font-medium">
                      <Link className="hover:underline" href={L(`/votes/${v.sessionId}/${v.number}`)}>
                        {fr ? (v.descriptionFr ?? v.descriptionEn) : v.descriptionEn}
                      </Link>
                    </h3>
                    <p className="mt-1 text-[0.8125rem] text-ink-3">
                      {m.home.voteN(v.number)}, <time dateTime={v.date}>{formatDate(v.date, locale)}</time>
                    </p>
                    <VoteTally className="mt-4 max-w-md" yeas={v.yeas} nays={v.nays} paired={v.paired} result={v.result} locale={locale} />
                  </div>
                  <PartyBreakdown
                    stats={v.partyStats}
                    parties={parties}
                    caption={t.partyBreakdownFor(v.number)}
                    totals={{ yeas: v.yeas, nays: v.nays, notVoting: v.partyStats.reduce((a, s) => a + s.paired + s.absent, 0) }}
                    locale={locale}
                  />
                </li>
              ))}
            </ol>
          )}
        </section>

        {excerpts.length > 0 && (
          <section aria-labelledby="debate" className="mt-16">
            <SectionHeading id="debate">{fr ? "Ce que les députés ont dit" : "What MPs said"}</SectionHeading>
            <p className="measure mt-3 text-[0.875rem] leading-relaxed text-ink-3">
              {fr
                ? "La première intervention de chaque parti sur ce projet de loi à la Chambre, tirée du hansard. Les extraits reprennent les premières phrases de l’orateur, sans modification."
                : "Each party’s first speech on this bill in the House, from Hansard. Excerpts are the speaker’s opening sentences, unedited."}
            </p>
            <ul className="mt-4 grid gap-x-12 md:grid-cols-2">
              {excerpts.map((e) => (
                <li key={e.ordinal} className="border-t border-rule py-5">
                  <p className="flex flex-wrap items-center gap-x-2 text-[0.875rem]">
                    <PartyTag partyId={e.partyId} label={partyShort(parties.find((p) => p.id === e.partyId), locale)} />
                    <Link className="link name-sc" href={L(`/mps/${e.memberId}`)}>
                      {e.name}
                    </Link>
                    <span className="text-ink-3">· {formatDate(e.date, locale)}</span>
                  </p>
                  <blockquote className="mt-2 font-display text-[1.125rem] leading-snug text-ink">
                    {fr ? `« ${e.textFr ?? e.textEn} »` : `“${e.textEn}”`}
                  </blockquote>
                  <a className="link mt-2 inline-block text-[0.8125rem]" href={e.url}>
                    {fr ? "Lire l’intervention complète (openparliament.ca)" : "Read the full speech on openparliament.ca"}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="sources" className="mt-16">
          <SectionHeading id="sources">{t.readSource}</SectionHeading>
          <ul className="mt-2 divide-y divide-rule">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="group flex items-center justify-between gap-4 py-3.5 text-[1rem] text-ink hover:text-accent-ink">
                  {l.label}
                  <ArrowUpRight aria-hidden className="size-4 text-ink-3 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent-ink" strokeWidth={1.75} />
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[0.8125rem] text-ink-3">{t.credit(status, formatDate(bill.lastUpdated, locale))}</p>
          <p className="mt-2 text-[0.8125rem]">
            <a className="link" href={L(`/bills/${bill.sessionId}/${bill.number}/rss.xml`)}>
              {fr ? `Suivre ${bill.number} par RSS` : `Follow ${bill.number} by RSS`}
            </a>
          </p>
        </section>
      </Container>
    </article>
  )
}
