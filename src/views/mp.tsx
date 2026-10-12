import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowUpRight } from "lucide-react"
import { VotingRecord } from "@/components/members/voting-record"
import { BillRow } from "@/components/tabled/bill-row"
import { LedgerRow } from "@/components/tabled/ledger-figure"
import { MemberAvatar } from "@/components/tabled/member-avatar"
import { Container, SectionHeading } from "@/components/tabled/page-header"
import { PartyTag } from "@/components/tabled/party-tag"
import { EmptyState } from "@/components/tabled/states"
import { localePath, type Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { partyName, partyShort } from "@/i18n/parties"
import { formatDate, formatPercent, provinceName } from "@/lib/format"
import { alternates } from "@/lib/metadata"
import { getDataYear, getMember, partyMap } from "@/lib/queries"
import { sessionLabel } from "@/lib/sessions"

export type MpParams = { slug: string }

export function mpMetadata(locale: Locale, slug: string): Metadata {
  const data = getMember(slug)
  const fr = locale === "fr"
  if (!data) return { title: fr ? "Député introuvable" : "MP not found" }
  const m = data.member
  const party = m.partyId ? partyShort(partyMap().get(m.partyId), locale) : null
  return {
    title: m.name,
    description: fr
      ? `${m.name}${party ? `, ${party}` : ""}${m.ridingName ? `, ${m.ridingName}` : ""}. Votes, fidélité au parti et projets de loi parrainés.`
      : `${m.name}${party ? `, ${party}` : ""}${m.ridingName ? `, ${m.ridingName}` : ""}. Voting record, party-line rate and bills sponsored.`,
    alternates: { ...alternates(locale, `/mps/${m.id}`), types: { "application/rss+xml": localePath(locale, `/mps/${m.id}/rss.xml`) } },
    ...(fr ? { openGraph: { images: [`/mps/${m.id}/opengraph-image`] } } : {}),
  }
}

export function MpView({ locale, slug }: { locale: Locale } & MpParams) {
  const data = getMember(slug)
  if (!data) notFound()
  const msgs = getMessages(locale)
  const t = msgs.mp
  const fr = locale === "fr"
  const L = (p: string) => localePath(locale, p)
  const { member: m, detail, statsBySession, sessions, sponsored, ballots } = data
  const sessionById = new Map(sessions.map((s) => [s.id, s]))
  const showSessionLabels = statsBySession.length > 1 || (statsBySession[0] && !sessionById.get(statsBySession[0].sessionId)?.isCurrent)
  const parties = partyMap()
  const party = m.partyId ? parties.get(m.partyId) : undefined
  const year = getDataYear()
  const province = provinceName(m.province, locale)
  const ourcommons = detail.ourcommonsUrl && fr ? detail.ourcommonsUrl.replace("ourcommons.ca/members/en/", "noscommunes.ca/members/fr/") : detail.ourcommonsUrl

  return (
    <article>
      <Container>
        <header className="border-b border-rule-strong pt-10 pb-8 sm:pt-14">
          <nav aria-label={fr ? "Fil d’Ariane" : "Breadcrumb"} className="text-sm text-ink-3">
            <Link className="link" href={L("/mps")}>
              {t.breadcrumb}
            </Link>
            <span aria-hidden className="mx-2">/</span>
            <span>{m.name}</span>
          </nav>
          <div className="mt-6 flex items-center gap-5 sm:gap-6">
            <MemberAvatar name={m.name} size="lg" />
            <div className="min-w-0">
              <h1 className="font-display text-[2.25rem] leading-[1.05] font-semibold tracking-[-0.02em] sm:text-[3.25rem]">{m.name}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[1rem] text-ink-2">
                <PartyTag partyId={m.partyId} label={partyName(party, locale)} className="text-[1rem]" />
                {m.ridingName && <span>{t.mpFor(m.ridingName, province === m.ridingName ? undefined : province)}</span>}
              </p>
              {!m.active && <p className="mt-2 text-[0.9375rem] text-ink-3">{t.left(detail.endDate ? formatDate(detail.endDate, locale) : null)}</p>}
            </div>
          </div>
          {statsBySession.length === 0 && <p className="mt-10 text-[0.9375rem] text-ink-2">{t.noRecordHint}</p>}
          {statsBySession.map((stats) => (
          <section key={stats.sessionId} aria-label={sessionLabel(sessionById.get(stats.sessionId)!, locale)} className="mt-10">
          {showSessionLabels && <h2 className="mb-2 text-[0.8125rem] font-semibold text-ink">{sessionLabel(sessionById.get(stats.sessionId)!, locale)}</h2>}
          <dl className="grid gap-x-12 border-t border-rule-strong md:grid-cols-2">
            <LedgerRow
              label={t.votedWithParty}
              value={formatPercent(stats.partyLineRate, 1, locale)}
              note={stats.partyLineEligible ? t.onVotes(stats.partyLineEligible).replace(/^./, (c) => c.toUpperCase()) : t.noPosition}
            />
            <LedgerRow
              label={t.votesCast}
              value={stats.votesHeld ? msgs.mps.of(stats.votesCast, stats.votesHeld) : formatPercent(null, 1, locale)}
              note={stats.votesHeld ? t.votesCastNote(stats.votesPaired) : undefined}
            />
            <LedgerRow label={t.brokeRanks} value={stats.dissentCount ?? 0} note={t.brokeNote} />
            <LedgerRow label={t.billsSponsored} value={stats.billsSponsored} note={t.becameLaw(sponsored.filter((b) => b.isLaw && b.sessionId === stats.sessionId).length)} />
          </dl>
          </section>
          ))}
          <p className="mt-6 text-[0.8125rem] text-ink-3">
            {t.missedNote}{" "}
            <Link className="link" href={L("/about#methodology")}>
              {t.howCalculated}
            </Link>
            <span aria-hidden className="mx-2">·</span>
            <Link className="link" href={L(`/compare?a=${m.id}`)}>
              {fr ? "Comparer avec un autre député" : "Compare with another MP"}
            </Link>
          </p>
        </header>

        <section aria-labelledby="sponsored" className="mt-14">
          <SectionHeading id="sponsored" aside={sponsored.length ? `${sponsored.length}` : undefined}>
            {t.billsSponsored}
          </SectionHeading>
          {sponsored.length ? (
            <div>
              {sponsored.map((b) => (
                <BillRow key={b.id} bill={b} party={party} referenceYear={year} locale={locale} sessionTag={sessionById.get(b.sessionId)?.isCurrent ? undefined : b.sessionId} />
              ))}
            </div>
          ) : (
            <EmptyState title={t.noBills} className="mt-6" action={{ href: L("/bills"), label: t.browseBills }}>
              {t.noBillsHint}
            </EmptyState>
          )}
        </section>

        <section aria-labelledby="record" className="mt-14">
          <SectionHeading id="record">{t.howVoted}</SectionHeading>
          {ballots.length ? (
            <VotingRecord rows={ballots} referenceYear={year} locale={locale} sessions={sessions.filter((s) => ballots.some((b) => b.sessionId === s.id)).map((s) => ({ id: s.id, label: sessionLabel(s, locale) }))} />
          ) : (
            <EmptyState title={t.noRecord} className="mt-6">
              {t.noRecordHint}
            </EmptyState>
          )}
        </section>

        <section aria-labelledby="elsewhere" className="mt-14">
          <SectionHeading id="elsewhere">{t.elsewhere}</SectionHeading>
          <ul className="mt-2 divide-y divide-rule">
            {ourcommons && <ExternalLink href={ourcommons} label={t.official} />}
            <ExternalLink href={`https://openparliament.ca${detail.openparliamentUrl}`} label={t.openparliament} />
            <ExternalLink href={L(`/mps/${m.id}/rss.xml`)} label={fr ? `Suivre ${m.name} par RSS` : `Follow ${m.name} by RSS`} />
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
