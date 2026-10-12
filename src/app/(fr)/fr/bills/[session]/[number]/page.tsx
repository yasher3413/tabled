import { allBillParams } from "@/lib/queries"
import { BillView, billMetadata, type BillParams } from "@/views/bill"

export function generateStaticParams(): BillParams[] {
  return allBillParams()
}

export async function generateMetadata({ params }: { params: Promise<BillParams> }) {
  const { session, number } = await params
  return billMetadata("fr", session, number)
}

// Params are awaited outside any Suspense boundary on purpose: every bill is prerendered, and an unknown
// number must fail before the shell streams.
export default async function Page({ params }: { params: Promise<BillParams> }) {
  const { session, number } = await params
  return <BillView locale="fr" session={session} number={number} />
}
