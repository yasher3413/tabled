import { Brygada_1918, Libre_Franklin } from "next/font/google"
import { CommandPalette } from "@/components/site/command-palette"
import { SiteFooter } from "@/components/site/footer"
import { SiteHeader } from "@/components/site/header"
import { ThemeScript } from "@/components/site/theme-script"
import { TooltipProvider } from "@/components/ui/tooltip"
import { INTL_LOCALE, type Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"

const display = Brygada_1918({ variable: "--font-brygada", subsets: ["latin", "latin-ext"], display: "swap" })
const sans = Libre_Franklin({ variable: "--font-franklin", subsets: ["latin", "latin-ext"], display: "swap" })

/** The document for one language: both root layouts render this. */
export function RootShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const t = getMessages(locale)
  return (
    <html lang={INTL_LOCALE[locale]} suppressHydrationWarning className={`${display.variable} ${sans.variable}`}>
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#main"
          className="sr-only z-50 rounded-sm bg-ink px-3 py-2 text-paper focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          {t.site.skip}
        </a>
        <TooltipProvider delayDuration={150}>
          <SiteHeader locale={locale} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter locale={locale} />
          <CommandPalette locale={locale} />
        </TooltipProvider>
      </body>
    </html>
  )
}
