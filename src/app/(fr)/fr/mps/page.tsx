import { MpsView, mpsMetadata } from "@/views/mps"

export const metadata = mpsMetadata("fr")

export default function Page() {
  return <MpsView locale="fr" />
}
