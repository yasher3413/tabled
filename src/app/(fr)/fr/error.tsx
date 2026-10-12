"use client"

import { ErrorView } from "@/views/error-view"

export default function ErrorPage(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorView {...props} locale="fr" />
}
