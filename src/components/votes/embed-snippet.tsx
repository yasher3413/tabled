"use client"

import { Check, Copy } from "lucide-react"
import { useState } from "react"

/** "Embed this vote": the iframe code, with a copy button. */
export function EmbedSnippet({ src, title, locale }: { src: string; title: string; locale: "en" | "fr" }) {
  const [copied, setCopied] = useState(false)
  const code = `<iframe src="${src}" title="${title.replace(/"/g, "&quot;")}" width="100%" height="420" style="border:0;max-width:40rem" loading="lazy"></iframe>`
  const fr = locale === "fr"
  return (
    <details className="group mt-12">
      <summary className="link cursor-pointer text-[0.9375rem] marker:text-ink-3">{fr ? "Intégrer ce vote sur votre site" : "Embed this vote on your site"}</summary>
      <div className="mt-3 max-w-2xl">
        <label htmlFor="embed-code" className="text-[0.8125rem] text-ink-3">
          {fr ? "Copiez ce code dans votre page :" : "Copy this code into your page:"}
        </label>
        <div className="mt-1.5 flex items-start gap-2">
          <textarea
            id="embed-code"
            readOnly
            rows={3}
            value={code}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full resize-none rounded-sm border border-rule bg-paper-sunk p-2.5 font-mono text-[0.75rem] text-ink-2"
          />
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(code).then(() => setCopied(true), () => setCopied(false))
            }}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-sm border border-rule-strong px-3 text-[0.8125rem] text-ink hover:bg-ink hover:text-paper"
          >
            {copied ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" strokeWidth={1.75} />}
            {copied ? (fr ? "Copié" : "Copied") : fr ? "Copier" : "Copy"}
          </button>
        </div>
      </div>
    </details>
  )
}
