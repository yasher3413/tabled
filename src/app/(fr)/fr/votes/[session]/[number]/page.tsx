import { allVoteParams } from "@/lib/queries"
import { VoteView, voteMetadata, type VoteParams } from "@/views/vote"

export function generateStaticParams(): VoteParams[] {
  return allVoteParams()
}

export async function generateMetadata({ params }: { params: Promise<VoteParams> }) {
  const { session, number } = await params
  return voteMetadata("fr", session, number)
}

export default async function Page({ params }: { params: Promise<VoteParams> }) {
  const { session, number } = await params
  return <VoteView locale="fr" session={session} number={number} />
}
