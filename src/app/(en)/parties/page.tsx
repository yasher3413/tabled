import { PartiesView, partiesMetadata } from "@/views/parties"

export const metadata = partiesMetadata("en")

export default function Page() {
  return <PartiesView locale="en" />
}
