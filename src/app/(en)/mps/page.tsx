import { MpsView, mpsMetadata } from "@/views/mps"

export const metadata = mpsMetadata("en")

export default function Page() {
  return <MpsView locale="en" />
}
