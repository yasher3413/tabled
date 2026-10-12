import { alternates } from "@/lib/metadata"
import { HomeView } from "@/views/home"

export const metadata = { alternates: alternates("en", "/") }

export default function Page() {
  return <HomeView locale="en" />
}
