"use client"

import Link from "next/link"
import { useEffect } from "react"
import { localePath, type Locale } from "@/i18n/config"
import { REPO_URL } from "@/lib/site"

export function ErrorView({ error, reset, locale }: { error: Error & { digest?: string }; reset: () => void; locale: Locale }) {
  const fr = locale === "fr"
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <div className="mx-auto w-full max-w-[76rem] px-4 sm:px-6">
      <div className="max-w-2xl pt-16 pb-12 sm:pt-24">
        <h1 className="font-display text-[2.5rem] leading-[1.05] font-semibold tracking-[-0.02em] sm:text-[3.25rem]">{fr ? "Un problème est survenu de notre côté." : "Something went wrong on our side."}</h1>
        <p className="measure mt-4 text-lg leading-relaxed text-ink-2">
          {fr
            ? "Cette page n’a pas pu se charger. Vous n’y êtes pour rien. Réessayez, et si le problème persiste, prévenez-nous."
            : "This page failed to load. It is not something you did. Try again, and if it keeps happening, let us know."}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-5">
          <button
            type="button"
            onClick={reset}
            className="h-11 rounded-sm bg-ink px-5 text-[0.9375rem] font-medium text-paper transition-colors duration-150 hover:bg-accent-ink"
          >
            {fr ? "Réessayer" : "Try again"}
          </button>
          <Link className="link text-[0.9375rem]" href={localePath(locale, "/")}>
            {fr ? "Aller à l’accueil" : "Go to the home page"}
          </Link>
          <a className="link text-[0.9375rem]" href={`${REPO_URL}/issues/new?title=${encodeURIComponent(`Page error${error.digest ? ` ${error.digest}` : ""}`)}`}>
            {fr ? "Signaler le problème" : "Report the problem"}
          </a>
        </div>
        {error.digest && (
          <p className="mt-6 text-[0.8125rem] text-ink-3">
            {fr ? `Référence de l’erreur : ${error.digest}` : `Error reference: ${error.digest}`}
          </p>
        )}
      </div>
    </div>
  )
}
