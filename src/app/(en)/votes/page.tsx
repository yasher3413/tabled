import { VotesView, votesMetadata } from "@/views/votes"

export const metadata = votesMetadata("en")

export default function Page() {
  return <VotesView locale="en" />
}
