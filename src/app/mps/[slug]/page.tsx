import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowUpRight } from "lucide-react"
import { BillRow } from "@/components/tabled/bill-row"
import { LedgerRow } from "@/components/tabled/ledger-figure"
import { MemberAvatar } from "@/components/tabled/member-avatar"
import { Container, SectionHeading } from "@/components/tabled/page-header"
import { PartyTag } from "@/components/tabled/party-tag"
import { EmptyState } from "@/components/tabled/states"
import { VotingRecord } from "@/components/members/voting-record"
import { formatDate, formatPercent, provinceName } from "@/lib/format"
import { allMemberParams, getDataYear, getMember, partyMap } from "@/lib/queries"

type Params = { slug: string }

export function generateStaticParams(): Params[] {
  return allMemberParams()
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const data = getMember(slug)
  if (!data) return { title: "MP not found" }
  const m = data.member
  const party = m.partyId ? partyMap().get(m.partyId)?.shortName : null
  return {
    title: m.name,
    description: `${m.name}${party ? `, ${party}` : ""}${m.ridingName ? `, ${m.ridingName}` : ""}. Voting record, party-line rate and bills sponsored.`,
    alternates: { canonical: `/mps/${m.id}` },
  }
}

export default async function MpPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const data = getMember(slug)
  if (!data) notFound()
  const { member: m, detail, stats, sponsored, ballots } = data
  const parties = partyMap()
  const party = m.partyId ? parties.get(m.partyId) : undefined
  const year = getDataYear()

  return (
    <article>
      <Container>
        <header className="border-b border-rule-strong pt-10 pb-8 sm:pt-14">
          <nav aria-label="Breadcrumb" className="text-sm text-ink-3">
            <Link className="link" href="/mps">
              MPs
            </Link>
            <span aria-hidden className="mx-2">/</span>
            <span>{m.name}</span>
          </nav>
          <div className="mt-6 flex items-center gap-5 sm:gap-6">
            <MemberAvatar name={m.name} size="lg" />
            <div className="min-w-0">
              <h1 className="font-display text-[2.25rem] leading-[1.05] font-semibold tracking-[-0.02em] sm:text-[3.25rem]">{m.name}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[1rem] text-ink-2">
                <PartyTag partyId={m.partyId} label={party?.nameEn ?? "No party"} className="text-[1rem]" />
                {m.ridingName && (
                  <span>
                    MP for {m.ridingName}, {provinceName(m.province)}
                  </span>
                )}
              </p>
              {!m.active && (
                <p className="mt-2 text-[0.9375rem] text-ink-3">
                  Left the House {detail.endDate ? `on ${formatDate(detail.endDate)}` : "this session"}.
                </p>
              )}
            </div>
          </div>
          <dl className="mt-10 grid gap-x-12 border-t border-rule-strong md:grid-cols-2">
            <LedgerRow
              label="Voted with party"
              value={formatPercent(stats?.partyLineRate)}
              note={stats?.partyLineEligible ? `On ${stats.partyLineEligible} votes with a clear party position` : "No party position to measure against"}
            />
            <LedgerRow
              label="Votes cast"
              value={stats?.votesHeld ? `${stats.votesCast} of ${stats.votesHeld}` : "n/a"}
              note={stats?.votesHeld ? `Recorded votes held while sitting${stats.votesPaired ? `; ${stats.votesPaired} paired` : ""}` : undefined}
            />
            <LedgerRow label="Broke ranks" value={stats?.dissentCount ?? 0} note="Votes against their party’s position" />
            <LedgerRow label="Bills sponsored" value={stats?.billsSponsored ?? sponsored.length} note={`${sponsored.filter((b) => b.isLaw).length} became law`} />
          </dl>
          <p className="mt-6 text-[0.8125rem] text-ink-3">
            Missing a recorded vote has many legitimate causes, from committee work to illness to travel.{" "}
            <Link className="link" href="/about#methodology">
              How these are calculated
            </Link>
          </p>
        </header>

        <section aria-labelledby="sponsored" className="mt-14">
          <SectionHeading id="sponsored" aside={sponsored.length ? `${sponsored.length}` : undefined}>
            Bills sponsored
          </SectionHeading>
          {sponsored.length ? (
            <div>
              {sponsored.map((b) => (
                <BillRow key={b.id} bill={b} party={party} referenceYear={year} />
              ))}
            </div>
          ) : (
            <EmptyState title="No bills sponsored this session" className="mt-6" action={{ href: "/bills", label: "Browse all bills" }}>
              Most MPs sponsor few bills. Ministers introduce government bills on behalf of cabinet.
            </EmptyState>
          )}
        </section>

        <section aria-labelledby="record" className="mt-14">
          <SectionHeading id="record">How they voted</SectionHeading>
          {ballots.length ? (
            <VotingRecord rows={ballots} referenceYear={year} />
          ) : (
            <EmptyState title="No recorded votes yet" className="mt-6">
              This MP has not been sitting for any recorded vote this session.
            </EmptyState>
          )}
        </section>

        <section aria-labelledby="elsewhere" className="mt-14">
          <SectionHeading id="elsewhere">Elsewhere</SectionHeading>
          <ul className="mt-2 divide-y divide-rule">
            {detail.ourcommonsUrl && <ExternalLink href={detail.ourcommonsUrl} label="Official House of Commons profile" />}
            <ExternalLink href={`https://openparliament.ca${detail.openparliamentUrl}`} label="Speeches and activity on openparliament.ca" />
          </ul>
        </section>
      </Container>
    </article>
  )
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <a href={href} className="group flex items-center justify-between gap-4 py-3.5 text-[1rem] text-ink hover:text-accent-ink">
        {label}
        <ArrowUpRight aria-hidden className="size-4 text-ink-3 group-hover:text-accent-ink" strokeWidth={1.75} />
      </a>
    </li>
  )
}
