import { CompareView, compareMetadata } from "@/views/compare"

export const metadata = compareMetadata("fr")

export default function Page() {
  return <CompareView locale="fr" />
}
