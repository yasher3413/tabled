import { alternates } from "@/lib/metadata"
import { HomeView } from "@/views/home"

export const metadata = { alternates: alternates("fr", "/"), openGraph: { images: ["/opengraph-image"] } }

export default function Page() {
  return <HomeView locale="fr" />
}
