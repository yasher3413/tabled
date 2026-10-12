import type { Metadata } from "next"
import { allVoteParams } from "@/lib/queries"
import { VoteEmbed } from "@/views/vote-embed"

export const metadata: Metadata = { title: "Tabled", robots: { index: false } }

export function generateStaticParams() {
  return allVoteParams()
}

export default async function Page({ params }: { params: Promise<{ session: string; number: string }> }) {
  const { session, number } = await params
  return (
    <div className="p-2">
      <VoteEmbed locale="fr" session={session} number={number} />
    </div>
  )
}
