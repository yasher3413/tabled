import { rootMetadata } from "@/lib/metadata"
import { RootShell } from "@/views/root-shell"
import "../../globals.css"

export const metadata = rootMetadata("fr")
export { viewport } from "@/lib/metadata"

export default function FrenchLayout({ children }: { children: React.ReactNode }) {
  return <RootShell locale="fr">{children}</RootShell>
}
