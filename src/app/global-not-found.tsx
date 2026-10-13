// The 404 for URLs outside both language trees (there is no single root layout to inherit).
import type { Metadata } from "next"
import { RootShell } from "@/views/root-shell"
import { NotFoundView } from "@/views/not-found"
import "./globals.css"

export const metadata: Metadata = { title: "Page not found · Tabled", robots: { index: false } }

export default function GlobalNotFound() {
  return (
    <RootShell locale="en" notFound>
      <NotFoundView locale="en" />
    </RootShell>
  )
}
