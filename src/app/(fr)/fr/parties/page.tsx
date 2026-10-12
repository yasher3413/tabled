import { PartiesView, partiesMetadata } from "@/views/parties"

export const metadata = partiesMetadata("fr")

export default function Page() {
  return <PartiesView locale="fr" />
}
