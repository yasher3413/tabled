import Link from "next/link"
import { Container } from "@/components/tabled/page-header"
import { SearchButton } from "@/components/site/command-palette"

export default function NotFound() {
  return (
    <Container>
      <div className="max-w-2xl border-b border-rule-strong pt-16 pb-12 sm:pt-24">
        <p className="font-display text-[1.25rem] font-semibold text-ink-3">Not on the order paper</p>
        <h1 className="mt-3 font-display text-[2.75rem] leading-[1.05] font-semibold tracking-[-0.02em] sm:text-[3.5rem]">We can’t find that page.</h1>
        <p className="measure mt-4 text-lg leading-relaxed text-ink-2">
          The link may be mistyped, or the bill, vote or MP may not be part of the current session. Try searching instead.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <SearchButton className="inline-flex h-11 items-center gap-2 rounded-sm bg-ink px-5 text-[0.9375rem] font-medium text-paper transition-colors duration-150 hover:bg-accent-ink" />
          <Link className="link text-[0.9375rem]" href="/">
            Go to the home page
          </Link>
        </div>
      </div>
      <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-[0.9375rem]">
        <li>
          <Link className="link" href="/bills">All bills</Link>
        </li>
        <li>
          <Link className="link" href="/votes">Recent votes</Link>
        </li>
        <li>
          <Link className="link" href="/mps">Every MP</Link>
        </li>
        <li>
          <Link className="link" href="/find">Find your MP</Link>
        </li>
      </ul>
    </Container>
  )
}
