import { BillsView, billsMetadata } from "@/views/bills"

export const metadata = billsMetadata("fr")

export default function Page() {
  return <BillsView locale="fr" />
}
