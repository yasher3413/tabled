import { FindView, findMetadata } from "@/views/find"

export const metadata = findMetadata("en")

export default function Page() {
  return <FindView locale="en" />
}
