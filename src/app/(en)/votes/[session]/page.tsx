import { listSessions } from "@/lib/queries"
import { VotesView, votesMetadata } from "@/views/votes"

export function generateStaticParams() {
  return listSessions().map((s) => ({ session: s.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ session: string }> }) {
  const { session } = await params
  return votesMetadata("en", session)
}

export default async function Page({ params }: { params: Promise<{ session: string }> }) {
  const { session } = await params
  return <VotesView locale="en" sessionId={session} />
}
