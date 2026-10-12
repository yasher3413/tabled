"use client"

import Link from "next/link"
import { useEffect } from "react"
import { REPO_URL } from "@/lib/site"

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <div className="mx-auto w-full max-w-[76rem] px-4 sm:px-6">
      <div className="max-w-2xl pt-16 pb-12 sm:pt-24">
        <h1 className="font-display text-[2.5rem] leading-[1.05] font-semibold tracking-[-0.02em] sm:text-[3.25rem]">Something went wrong on our side.</h1>
        <p className="measure mt-4 text-lg leading-relaxed text-ink-2">
          This page failed to load. It is not something you did. Try again, and if it keeps happening, let us know.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-5">
          <button
            type="button"
            onClick={reset}
            className="h-11 rounded-sm bg-ink px-5 text-[0.9375rem] font-medium text-paper transition-colors duration-150 hover:bg-accent-ink"
          >
            Try again
          </button>
          <Link className="link text-[0.9375rem]" href="/">
            Go to the home page
          </Link>
          <a className="link text-[0.9375rem]" href={`${REPO_URL}/issues/new?title=${encodeURIComponent(`Page error${error.digest ? ` ${error.digest}` : ""}`)}`}>
            Report the problem
          </a>
        </div>
        {error.digest && <p className="mt-6 text-[0.8125rem] text-ink-3">Error reference: {error.digest}</p>}
      </div>
    </div>
  )
}
