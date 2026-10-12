import { DigestView, digestMetadata } from "@/views/digest"

export const metadata = digestMetadata("fr")

export default function Page() {
  return <DigestView locale="fr" />
}
