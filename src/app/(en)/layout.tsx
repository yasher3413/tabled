import { rootMetadata } from "@/lib/metadata"
import { RootShell } from "@/views/root-shell"
import "../globals.css"

export const metadata = rootMetadata("en")
export { viewport } from "@/lib/metadata"

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return <RootShell locale="en">{children}</RootShell>
}
