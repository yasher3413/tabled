import { BillsView, billsMetadata } from "@/views/bills"

export const metadata = billsMetadata("en")

export default function Page() {
  return <BillsView locale="en" />
}
