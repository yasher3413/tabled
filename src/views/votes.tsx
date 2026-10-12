import type { Metadata } from "next"
import { Suspense } from "react"
import { VotesExplorer, VotesExplorerWithParams } from "@/components/filters/votes-explorer"
import { Container, PageHeader } from "@/components/tabled/page-header"
import type { Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { alternates } from "@/lib/metadata"
import { notFound } from "next/navigation"
import { SessionSwitch } from "@/components/tabled/session-switch"
import { getDataYear, listSessions, listVotes } from "@/lib/queries"
import { sessionLabel } from "@/lib/sessions"

export function votesMetadata(locale: Locale, sessionId?: string): Metadata {
  const t = getMessages(locale).meta
  const s = sessionId ? listSessions().find((x) => x.id === sessionId) : undefined
  const path = !s || s.isCurrent ? "/votes" : `/votes/${s.id}`
  return { title: s && !s.isCurrent ? `${t.votes} · ${sessionLabel(s, locale)}` : t.votes, description: t.votesDesc, alternates: alternates(locale, path) }
}

export function VotesView({ locale, sessionId }: { locale: Locale; sessionId?: string }) {
  const t = getMessages(locale).votes
  const sessions = listSessions()
  const session = sessionId ? sessions.find((s) => s.id === sessionId) : sessions.find((s) => s.isCurrent)
  if (!session) notFound()
  const props = { votes: listVotes(session.id), referenceYear: getDataYear(), locale }
  return (
    <Container>
      <PageHeader title={t.title} lede={session.isCurrent ? t.lede : `${sessionLabel(session, locale)}. ${t.lede}`}>
        <SessionSwitch sessions={sessions} active={session.id} basePath="/votes" locale={locale} />
      </PageHeader>
      <Suspense fallback={<VotesExplorer {...props} params={{}} />}>
        <VotesExplorerWithParams {...props} />
      </Suspense>
    </Container>
  )
}
