import { listSessions } from "@/lib/queries"
import { BillsView, billsMetadata } from "@/views/bills"

export function generateStaticParams() {
  return listSessions().map((s) => ({ session: s.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ session: string }> }) {
  const { session } = await params
  return billsMetadata("fr", session)
}

export default async function Page({ params }: { params: Promise<{ session: string }> }) {
  const { session } = await params
  return <BillsView locale="fr" sessionId={session} />
}
