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
import { formatDate, formatShortDate } from "@/lib/format"
import { allBillParams, getBill, getDataYear, listParties } from "@/lib/queries"
import { SITE_URL } from "@/lib/site"
import { BILL_TYPE_EXPLAINERS, currentStageLabel } from "@/lib/stages"

type Params = { session: string; number: string }

export function generateStaticParams(): Params[] {
  return allBillParams()
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { session, number } = await params
  const data = getBill(session, number)
  if (!data) return { title: "Bill not found" }
  const { bill, summary } = data
  const title = `${bill.number}: ${bill.shortTitleEn ?? bill.titleEn}`
  return {
    title,
    description: summary?.parsed.tldr ?? `${bill.titleEn}. ${currentStageLabel(bill.currentStage)}. ${bill.typeLabel}.`,
    alternates: { canonical: `/bills/${bill.sessionId}/${bill.number}` },
  }
}

// Params are awaited outside any Suspense boundary on purpose: every bill is prerendered, and an unknown
// number must fail before the shell streams so it returns a real 404 status.
export default async function BillPage({ params }: { params: Promise<Params> }) {
  const { session, number } = await params
  const data = getBill(session, number)
  if (!data) notFound()
  const { bill, stages, votes, summary, sponsor } = data
  const parties = listParties()
  const year = getDataYear()
  const sponsorParty = parties.find((p) => p.id === (bill.sponsorPartyId ?? sponsor?.partyId))
  const pageUrl = `${SITE_URL}/bills/${bill.sessionId}/${bill.number}`
  const links = [
    bill.textUrl && { label: "Full text of the bill", href: bill.textUrl },
    { label: "LEGISinfo record", href: bill.legisinfoUrl },
    bill.legislativeSummaryUrl && { label: "Library of Parliament legislative summary", href: bill.legislativeSummaryUrl },
  ].filter((l): l is { label: string; href: string } => !!l)

  return (
    <article>
      <Container>
        <header className="border-b border-rule-strong pt-10 pb-8 sm:pt-14">
          <nav aria-label="Breadcrumb" className="text-sm text-ink-3">
            <Link className="link" href="/bills">
              Bills
            </Link>
            <span aria-hidden className="mx-2">/</span>
            <span>{bill.number}</span>
          </nav>
          <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <p className="font-display text-[1.75rem] leading-none font-semibold text-ink-3 tabular-nums">{bill.number}</p>
            <p className="text-sm text-ink-3">
              {bill.typeLabel} · Introduced in the {bill.chamber === "house" ? "House of Commons" : "Senate"}
              {bill.introducedDate ? ` on ${formatDate(bill.introducedDate)}` : ""}
            </p>
          </div>
          <h1 className="mt-3 max-w-[22ch] font-display text-[2.375rem] leading-[1.05] font-semibold tracking-[-0.02em] sm:text-[3.5rem]">
            {bill.shortTitleEn ?? bill.titleEn}
          </h1>
          {bill.shortTitleEn && <p className="measure mt-4 text-lg leading-relaxed text-ink-2">{bill.titleEn}</p>}
          <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4 text-[0.9375rem]">
            <div>
              <dt className="text-[0.8125rem] text-ink-3">Status</dt>
              <dd className={bill.isLaw ? "font-medium text-accent-ink" : bill.isDefeated ? "font-medium text-danger-ink" : "text-ink"}>
                {bill.isLaw ? `Became law ${formatDate(bill.royalAssentDate)}` : bill.statusEn}
                {bill.statuteChapter && <span className="text-ink-3"> · {bill.statuteChapter}</span>}
              </dd>
            </div>
            <div>
              <dt className="text-[0.8125rem] text-ink-3">Sponsor</dt>
              <dd>
                {sponsor ? (
                  <Link href={`/mps/${sponsor.id}`} className="link">
                    {bill.sponsorName ?? sponsor.name}
                  </Link>
                ) : (
                  (bill.sponsorName ?? <span className="text-ink-3">Not recorded</span>)
                )}
                {sponsorParty && <PartyTag partyId={sponsorParty.id} label={sponsorParty.shortName} className="ml-2.5" />}
                {!sponsor && bill.chamber === "senate" && bill.sponsorName && <span className="ml-2 text-[0.8125rem] text-ink-3">Senator</span>}
              </dd>
              {bill.sponsorTitle && <dd className="mt-0.5 max-w-[46ch] text-[0.8125rem] text-ink-3">{bill.sponsorTitle}</dd>}
            </div>
          </dl>
        </header>

        <section aria-labelledby="summary" className="mt-12">
          <SectionHeading id="summary">What it does</SectionHeading>
          <div className="mt-6">
            <SummaryBlock
              billNumber={bill.number}
              pageUrl={pageUrl}
              summary={summary ? { parsed: summary.parsed, model: summary.model, generatedAt: summary.generatedAt, sourceUrl: summary.sourceUrl } : null}
              officialSummary={bill.legisinfoSummaryText}
              sourceLinks={links}
            />
          </div>
        </section>

        <section aria-labelledby="progress" className="mt-16">
          <SectionHeading id="progress" aside={bill.lastActivityDate ? `Last activity ${formatShortDate(bill.lastActivityDate, year)}` : undefined}>
            Where it is
          </SectionHeading>
          <div className="mt-6">
            <StageTimeline stages={stages} referenceYear={year} />
          </div>
          <p className="measure mt-8 text-[0.875rem] leading-relaxed text-ink-3">
            {BILL_TYPE_EXPLAINERS[bill.type]}{" "}
            <Link className="link" href="/about#how-a-bill-becomes-law">
              How a bill becomes law
            </Link>
          </p>
        </section>

        <section aria-labelledby="votes" className="mt-16">
          <SectionHeading id="votes" aside={votes.length ? `${votes.length} recorded ${votes.length === 1 ? "vote" : "votes"}` : undefined}>
            How the House voted
          </SectionHeading>
          {votes.length === 0 ? (
            <EmptyState title="No recorded votes yet" className="mt-6" action={{ href: "/votes", label: "See all recent votes" }}>
              Many stages pass without a recorded vote (by unanimous consent or a voice vote). Senate votes are not
              included.
            </EmptyState>
          ) : (
            <ol className="mt-2">
              {votes.map((v) => (
                <li key={v.id} className="grid gap-x-10 gap-y-4 border-b border-rule py-6 lg:grid-cols-[1fr_1.1fr]">
                  <div className="min-w-0">
                    <p className="text-[0.8125rem] text-ink-3">
                      <time dateTime={v.date}>{formatDate(v.date)}</time> · Vote {v.number}
                    </p>
                    <h3 className="mt-1 text-[1.0625rem] leading-snug font-medium">
                      <Link className="hover:underline" href={`/votes/${v.sessionId}/${v.number}`}>
                        {v.descriptionEn}
                      </Link>
                    </h3>
                    <VoteTally className="mt-4 max-w-md" yeas={v.yeas} nays={v.nays} paired={v.paired} result={v.result} />
                  </div>
                  <PartyBreakdown stats={v.partyStats} parties={parties} caption={`Party breakdown for vote ${v.number}`} />
                </li>
              ))}
            </ol>
          )}
        </section>

        <section aria-labelledby="sources" className="mt-16">
          <SectionHeading id="sources">Read the source</SectionHeading>
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
          <p className="mt-6 text-[0.8125rem] text-ink-3">
            Bill data from LEGISinfo, votes from openparliament.ca and the House of Commons. Last updated {formatDate(bill.lastUpdated)}.
          </p>
        </section>
      </Container>
    </article>
  )
}

export function BillSkeleton() {
  return (
    <Container>
      <div className="animate-pulse border-b border-rule-strong pt-14 pb-8" aria-hidden>
        <div className="h-4 w-24 rounded-sm bg-paper-sunk" />
        <div className="mt-6 h-7 w-20 rounded-sm bg-paper-sunk" />
        <div className="mt-4 h-14 w-3/4 rounded-sm bg-paper-sunk" />
        <div className="mt-4 h-5 w-1/2 rounded-sm bg-paper-sunk" />
      </div>
      <p className="sr-only">Loading bill</p>
    </Container>
  )
}
