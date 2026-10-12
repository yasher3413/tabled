import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Container, SectionHeading } from "@/components/tabled/page-header"
import { PartyBreakdown } from "@/components/tabled/party-breakdown"
import { DivisionTotals } from "@/components/tabled/division-totals"
import { VoteChamber } from "@/components/votes/vote-chamber"
import { formatDate } from "@/lib/format"
import { allVoteParams, getVote, listParties } from "@/lib/queries"

type Params = { session: string; number: string }

export function generateStaticParams(): Params[] {
  return allVoteParams()
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { session, number } = await params
  const data = getVote(session, Number(number))
  if (!data) return { title: "Vote not found" }
  const v = data.vote
  return {
    title: `Vote ${v.number}: ${v.descriptionEn}`,
    description: `${v.result === "passed" ? "Passed" : v.result === "failed" ? "Failed" : "Tied"} ${v.yeas} to ${v.nays} on ${formatDate(v.date)}. See how every MP and party voted.`,
    alternates: { canonical: `/votes/${v.sessionId}/${v.number}` },
  }
}

export default async function VotePage({ params }: { params: Promise<Params> }) {
  const { session, number } = await params
  const data = /^\d+$/.test(number) ? getVote(session, Number(number)) : null
  if (!data) notFound()
  const { vote: v, partyStats, ballots } = data
  const parties = listParties()
  const resultWord = v.result === "passed" ? "Passed" : v.result === "failed" ? "Failed" : "Tied"
  return (
    <article>
      <Container>
        <header className="border-b border-rule-strong pt-10 pb-8 sm:pt-14">
          <nav aria-label="Breadcrumb" className="text-sm text-ink-3">
            <Link className="link" href="/votes">
              Votes
            </Link>
            <span aria-hidden className="mx-2">/</span>
            <span>Vote {v.number}</span>
          </nav>
          <p className="mt-6 text-sm text-ink-3">
            Recorded vote {v.number} · House of Commons · <time dateTime={v.date}>{formatDate(v.date)}</time>
          </p>
          <h1 className="mt-3 max-w-[30ch] font-display text-[2rem] leading-[1.1] font-semibold tracking-[-0.015em] sm:text-[2.75rem]">
            {v.descriptionEn}
          </h1>
          {v.billNumber && (
            <p className="mt-4 text-[1rem] text-ink-2">
              On{" "}
              <Link className="link" href={`/bills/${v.billSession}/${v.billNumber}`}>
                Bill {v.billNumber}
                {v.billShortTitle ? `, ${v.billShortTitle}` : ""}
              </Link>
            </p>
          )}
          <div className="mt-8 grid max-w-4xl items-end gap-x-12 gap-y-6 sm:grid-cols-[auto_1fr]">
            <p className="font-display text-[3.5rem] leading-none font-semibold tracking-[-0.02em] text-ink">{resultWord}</p>
            <DivisionTotals yeas={v.yeas} nays={v.nays} paired={v.paired} absent={ballots.filter((b) => b.ballot === "absent").length} size="lg" />
          </div>
          {v.hasPartySplit && (
            <p className="measure mt-5 text-[0.9375rem] text-ink-2">
              Members of at least one party voted on both sides. That can mean a free vote, where parties let MPs vote as they choose.
            </p>
          )}
        </header>

        <section aria-labelledby="chamber" className="mt-12">
          <SectionHeading id="chamber">Who voted which way</SectionHeading>
          <div className="mt-6">
            <VoteChamber
              ballots={ballots}
              parties={parties}
              aside={
                <div className="mt-10">
                  <h3 className="text-[0.8125rem] font-semibold text-ink">By party</h3>
                  <PartyBreakdown stats={partyStats} parties={parties} caption={`How each party voted on vote ${v.number}`} />
                </div>
              }
            />
          </div>
        </section>

        <p className="mt-12 text-[0.8125rem] text-ink-3">
          Source:{" "}
          <a className="link" href={v.sourceUrl}>
            {v.sourceUrl.includes("ourcommons") ? "House of Commons" : "openparliament.ca"}
          </a>
          {v.sourceUrl.includes("ourcommons") && " (official record; openparliament.ca listed different totals for this vote)"}. Party is the MP’s party at the time of the vote.
        </p>
      </Container>
    </article>
  )
}
