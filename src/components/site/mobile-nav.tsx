"use client"

import { Menu, X } from "lucide-react"
import { Dialog } from "radix-ui"
import { useState } from "react"
import type { Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { LanguageSwitch } from "./language-switch"
import { NavLinks } from "./nav-links"

export function MobileNav({ locale, notFound = false }: { locale: Locale; notFound?: boolean }) {
  const [open, setOpen] = useState(false)
  const t = getMessages(locale).site
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label={t.openMenu}
        className="inline-flex size-9 items-center justify-center rounded-sm text-ink-2 hover:bg-paper-sunk hover:text-ink md:hidden"
      >
        <Menu className="size-5" strokeWidth={1.75} />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/25 data-[state=open]:animate-fade-in dark:bg-black/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 top-0 z-50 border-b border-rule bg-paper px-4 pt-3 pb-6 data-[state=open]:animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <Dialog.Title className="font-display text-xl font-semibold">{t.menu}</Dialog.Title>
            <Dialog.Close aria-label={t.closeMenu} className="inline-flex size-9 items-center justify-center rounded-sm text-ink-2 hover:bg-paper-sunk">
              <X className="size-5" strokeWidth={1.75} />
            </Dialog.Close>
          </div>
          <nav aria-label={t.menu} className="mt-4">
            <NavLinks
              locale={locale}
              className="flex flex-col divide-y divide-rule border-y border-rule [&_a]:h-12 [&_a]:w-full [&_a]:px-1 [&_a]:text-lg [&_a]:after:hidden"
              onNavigate={() => setOpen(false)}
            />
          </nav>
          <div className="mt-4">
            <LanguageSwitch locale={locale} home={notFound} className="link text-[1rem]" />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
