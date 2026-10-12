import type { Metadata, Viewport } from "next"
import { Brygada_1918, Libre_Franklin } from "next/font/google"
import { CommandPalette } from "@/components/site/command-palette"
import { SiteFooter } from "@/components/site/footer"
import { SiteHeader } from "@/components/site/header"
import { ThemeScript } from "@/components/site/theme-script"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site"
import "./globals.css"

const display = Brygada_1918({ variable: "--font-brygada", subsets: ["latin", "latin-ext"], display: "swap" })
const sans = Libre_Franklin({ variable: "--font-franklin", subsets: ["latin", "latin-ext"], display: "swap" })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME}: Parliament of Canada in plain English`, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  openGraph: { siteName: SITE_NAME, type: "website", locale: "en_CA" },
  twitter: { card: "summary_large_image" },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f5ef" },
    { media: "(prefers-color-scheme: dark)", color: "#191613" },
  ],
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-CA" suppressHydrationWarning className={`${display.variable} ${sans.variable}`}>
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#main"
          className="sr-only z-50 rounded-sm bg-ink px-3 py-2 text-paper focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <TooltipProvider delayDuration={150}>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
          <CommandPalette />
        </TooltipProvider>
      </body>
    </html>
  )
}
