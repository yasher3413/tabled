import { BillRow } from "@/components/tabled/bill-row"
import { Container, PageHeader, SectionHeading } from "@/components/tabled/page-header"
import { listBills, partyMap } from "@/lib/queries"

export default function Home() {
  const parties = partyMap()
  const bills = listBills()
    .sort((a, b) => (b.lastActivityDate ?? "").localeCompare(a.lastActivityDate ?? ""))
    .slice(0, 8)
  return (
    <Container>
      <PageHeader title="Parliament, in plain English" lede="Every federal bill, every recorded House vote and every MP, explained so you can understand it in under a minute." />
      <section className="mt-10">
        <SectionHeading>Recent activity</SectionHeading>
        {bills.map((b) => (
          <BillRow key={b.id} bill={b} party={b.sponsorPartyId ? parties.get(b.sponsorPartyId) : undefined} referenceYear={2026} />
        ))}
      </section>
    </Container>
  )
}
