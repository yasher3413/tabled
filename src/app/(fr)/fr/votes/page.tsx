import { VotesView, votesMetadata } from "@/views/votes"

export const metadata = votesMetadata("fr")

export default function Page() {
  return <VotesView locale="fr" />
}
