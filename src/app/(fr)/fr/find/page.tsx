import { FindView, findMetadata } from "@/views/find"

export const metadata = findMetadata("fr")

export default function Page() {
  return <FindView locale="fr" />
}
