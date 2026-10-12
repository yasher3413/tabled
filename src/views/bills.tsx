import type { Metadata } from "next"
import { Suspense } from "react"
import { BillsExplorer, BillsExplorerWithParams } from "@/components/filters/bills-explorer"
import { Container, PageHeader } from "@/components/tabled/page-header"
import type { Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { alternates } from "@/lib/metadata"
import { getCurrentSession, getDataYear, listBills, listParties } from "@/lib/queries"

export function billsMetadata(locale: Locale): Metadata {
  const t = getMessages(locale).meta
  return { title: t.bills, description: t.billsDesc, alternates: alternates(locale, "/bills") }
}

export function BillsView({ locale }: { locale: Locale }) {
  const t = getMessages(locale).bills
  const session = getCurrentSession()
  const props = { bills: listBills(), parties: listParties(), referenceYear: getDataYear(), locale }
  return (
    <Container>
      <PageHeader title={t.title} lede={t.lede(session ? t.session(session.parliament, session.session) : t.currentSession)} />
      {/* The fallback is the unfiltered list, so the prerendered page contains real bills. */}
      <Suspense fallback={<BillsExplorer {...props} params={{}} />}>
        <BillsExplorerWithParams {...props} />
      </Suspense>
    </Container>
  )
}
