import type { Metadata } from "next"
import { Suspense } from "react"
import { BillsExplorer, BillsExplorerWithParams } from "@/components/filters/bills-explorer"
import { Container, PageHeader } from "@/components/tabled/page-header"
import { getCurrentSession, getDataYear, listBills, listParties } from "@/lib/queries"

export const metadata: Metadata = {
  title: "Bills",
  description: "Every bill in the current Parliament of Canada: where it is, who sponsored it and what it does, in plain English.",
  alternates: { canonical: "/bills" },
}

export default function BillsPage() {
  const bills = listBills()
  const parties = listParties()
  const session = getCurrentSession()
  const year = getDataYear()
  const props = { bills, parties, referenceYear: year }
  return (
    <Container>
      <PageHeader
        title="Bills"
        lede={`Every bill introduced in the ${session ? `${ordinal(session.parliament)} Parliament, ${ordinal(session.session)} session` : "current session"}. Filter by stage, type or sponsor, or search by number or keyword.`}
      />
      {/* The fallback is the full, unfiltered list, so the prerendered page contains every bill. */}
      <Suspense fallback={<BillsExplorer {...props} params={{}} />}>
        <BillsExplorerWithParams {...props} />
      </Suspense>
    </Container>
  )
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`
}
