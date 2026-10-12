import type { Metadata } from "next"
import { Brygada_1918, Libre_Franklin } from "next/font/google"
import { ThemeScript } from "@/components/site/theme-script"
import "../globals.css"

const display = Brygada_1918({ variable: "--font-brygada", subsets: ["latin", "latin-ext"], display: "swap" })
const sans = Libre_Franklin({ variable: "--font-franklin", subsets: ["latin", "latin-ext"], display: "swap" })

export const metadata: Metadata = { robots: { index: false } }

/** Bare document for iframe embeds: no header, footer or navigation. */
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-CA" suppressHydrationWarning className={`${display.variable} ${sans.variable}`}>
      <head>
        <ThemeScript />
      </head>
      <body className="bg-paper antialiased">{children}</body>
    </html>
  )
}
