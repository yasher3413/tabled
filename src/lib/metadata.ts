import type { Metadata, Viewport } from "next"
import { localePath, type Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { SITE_NAME, SITE_URL } from "./site"

export function rootMetadata(locale: Locale): Metadata {
  const t = getMessages(locale).meta
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t.homeTitle, template: `%s · ${SITE_NAME}` },
    description: t.description,
    openGraph: { siteName: SITE_NAME, type: "website", locale: locale === "fr" ? "fr_CA" : "en_CA" },
    twitter: { card: "summary_large_image" },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f5ef" },
    { media: "(prefers-color-scheme: dark)", color: "#191613" },
  ],
}

/** Canonical URL for this language plus hreflang alternates for both. */
export function alternates(locale: Locale, path: string): Metadata["alternates"] {
  return {
    canonical: localePath(locale, path),
    languages: { "en-CA": localePath("en", path), "fr-CA": localePath("fr", path), "x-default": localePath("en", path) },
  }
}
