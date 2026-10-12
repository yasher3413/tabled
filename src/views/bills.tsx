import type { Metadata } from "next"
import { Suspense } from "react"
import { BillsExplorer, BillsExplorerWithParams } from "@/components/filters/bills-explorer"
import { Container, PageHeader } from "@/components/tabled/page-header"
import type { Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { alternates } from "@/lib/metadata"
import { notFound } from "next/navigation"
import { SessionSwitch } from "@/components/tabled/session-switch"
import { getDataYear, listBills, listParties, listSessions } from "@/lib/queries"
import { sessionLabel } from "@/lib/sessions"

export function billsMetadata(locale: Locale, sessionId?: string): Metadata {
  const t = getMessages(locale).meta
  const s = sessionId ? listSessions().find((x) => x.id === sessionId) : undefined
  const path = !s || s.isCurrent ? "/bills" : `/bills/${s.id}`
  return { title: s && !s.isCurrent ? `${t.bills} · ${sessionLabel(s, locale)}` : t.bills, description: t.billsDesc, alternates: alternates(locale, path) }
}

export function BillsView({ locale, sessionId }: { locale: Locale; sessionId?: string }) {
  const t = getMessages(locale).bills
  const sessions = listSessions()
  const session = sessionId ? sessions.find((s) => s.id === sessionId) : sessions.find((s) => s.isCurrent)
  if (!session) notFound()
  const props = { bills: listBills(session.id), parties: listParties(), referenceYear: getDataYear(), locale }
  return (
    <Container>
      <PageHeader title={t.title} lede={t.lede(sessionLabel(session, locale))}>
        <SessionSwitch sessions={sessions} active={session.id} basePath="/bills" locale={locale} />
      </PageHeader>
      {/* The fallback is the unfiltered list, so the prerendered page contains real bills. */}
      <Suspense fallback={<BillsExplorer {...props} params={{}} />}>
        <BillsExplorerWithParams {...props} />
      </Suspense>
    </Container>
  )
}
