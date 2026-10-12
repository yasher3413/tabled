import { AboutView, aboutMetadata } from "@/views/about"

export const metadata = aboutMetadata("fr")

export default function Page() {
  return <AboutView locale="fr" />
}
