"use client"

import { Command } from "cmdk"
import { Dialog } from "radix-ui"
import { FileText, Search, User, Vote } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import type { SearchEntry } from "@/app/search-index.json/route"

const GROUPS: Array<{ k: SearchEntry["k"]; heading: string; icon: typeof FileText }> = [
  { k: "b", heading: "Bills", icon: FileText },
  { k: "m", heading: "MPs", icon: User },
  { k: "v", heading: "Votes", icon: Vote },
]
const PER_GROUP = 7

let indexPromise: Promise<SearchEntry[]> | null = null
function loadIndex() {
  indexPromise ??= fetch("/search-index.json").then((r) => {
    if (!r.ok) throw new Error(`Search index returned ${r.status}`)
    return r.json() as Promise<SearchEntry[]>
  })
  indexPromise.catch(() => (indexPromise = null))
  return indexPromise
}

function score(entry: SearchEntry, terms: string[]): number {
  const label = entry.label.toLowerCase()
  const hay = `${label} ${entry.sub.toLowerCase()} ${entry.kw.toLowerCase()}`
  let s = 0
  for (const term of terms) {
    if (!hay.includes(term)) return 0
    s += label.startsWith(term) ? 4 : label.includes(` ${term}`) ? 3 : label.includes(term) ? 2 : 1
  }
  return s
}

export function openSearch() {
  window.dispatchEvent(new Event("tabled:open-search"))
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [index, setIndex] = useState<SearchEntry[] | null>(null)
  const [failed, setFailed] = useState(false)
  const router = useRouter()

  const show = useCallback(() => {
    setOpen(true)
    loadIndex().then(setIndex, () => setFailed(true))
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        show()
      }
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("tabled:open-search", show)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("tabled:open-search", show)
    }
  }, [show])

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  const results = GROUPS.map((g) => {
    const pool = (index ?? []).filter((e) => e.k === g.k)
    const items = terms.length
      ? pool
          .map((e) => ({ e, s: score(e, terms) }))
          .filter((x) => x.s > 0)
          .sort((a, b) => b.s - a.s)
          .slice(0, PER_GROUP)
          .map((x) => x.e)
      : pool.slice(0, g.k === "m" ? 0 : 4)
    return { ...g, items }
  })
  const empty = index && results.every((g) => g.items.length === 0)

  function go(href: string) {
    setOpen(false)
    setQuery("")
    router.push(href)
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/25 backdrop-blur-[1px] data-[state=open]:animate-fade-in dark:bg-black/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-[12vh] left-1/2 z-50 w-[calc(100vw-2rem)] max-w-[40rem] -translate-x-1/2 overflow-hidden rounded-md border border-rule bg-paper-raised shadow-[0_24px_60px_-20px_oklch(0.2_0.02_60/0.35)] data-[state=open]:animate-fade-in"
        >
          <Dialog.Title className="sr-only">Search Tabled</Dialog.Title>
          <Command shouldFilter={false} loop label="Search bills, MPs and votes">
            <div className="flex items-center gap-3 border-b border-rule px-4">
              <Search className="size-4 shrink-0 text-ink-3" strokeWidth={1.75} aria-hidden />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search bills, MPs, ridings or votes"
                className="h-14 w-full bg-transparent text-base text-ink outline-none placeholder:text-ink-3"
              />
              <kbd className="hidden shrink-0 rounded-sm border border-rule px-1.5 py-0.5 text-xs text-ink-3 sm:block">Esc</kbd>
            </div>
            <Command.List className="max-h-[min(60vh,28rem)] overflow-y-auto overscroll-contain p-2">
              {!index && !failed && <p className="px-3 py-6 text-sm text-ink-3">Loading the index…</p>}
              {failed && <p className="px-3 py-6 text-sm text-danger-ink">Search is unavailable right now. Try the Bills or MPs pages.</p>}
              {empty && (
                <p className="px-3 py-6 text-sm text-ink-2">
                  Nothing matches “{query}”. Try a bill number like C-5, an MP’s last name or a riding.
                </p>
              )}
              {results.map(
                (g) =>
                  g.items.length > 0 && (
                    <Command.Group
                      key={g.k}
                      heading={terms.length ? g.heading : `Recent ${g.heading.toLowerCase()}`}
                      className="mb-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-ink-3"
                    >
                      {g.items.map((e) => (
                        <Command.Item
                          key={e.href}
                          value={e.href}
                          onSelect={() => go(e.href)}
                          className="group flex cursor-pointer items-start gap-3 rounded-sm px-3 py-2.5 transition-colors duration-100 data-[selected=true]:bg-accent-wash"
                        >
                          <g.icon className="mt-0.5 size-4 shrink-0 text-ink-3 group-data-[selected=true]:text-accent-ink" strokeWidth={1.75} aria-hidden />
                          <span className="min-w-0">
                            <span className="block truncate text-[0.9375rem] text-ink">{e.label}</span>
                            <span className="block truncate text-[0.8125rem] text-ink-3">{e.sub}</span>
                          </span>
                        </Command.Item>
                      ))}
                    </Command.Group>
                  ),
              )}
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function SearchButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={openSearch}
      className={
        className ??
        "inline-flex h-9 items-center gap-2 rounded-sm border border-rule bg-paper-raised pr-2 pl-3 text-sm text-ink-3 transition-colors duration-150 hover:border-ink-3 hover:text-ink-2"
      }
    >
      <Search className="size-4" strokeWidth={1.75} aria-hidden />
      <span>Search</span>
      <kbd className="ml-3 hidden rounded-sm border border-rule px-1.5 text-xs sm:inline">⌘K</kbd>
    </button>
  )
}
