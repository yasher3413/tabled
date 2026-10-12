import { DigestView, digestMetadata } from "@/views/digest"

export const metadata = digestMetadata("en")

export default function Page() {
  return <DigestView locale="en" />
}
