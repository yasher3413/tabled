"use client"

import { ArrowRight, LoaderCircle, MapPin } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { PartyTag } from "@/components/tabled/party-tag"
import { MemberAvatar } from "@/components/tabled/member-avatar"
import { formatPostal, postalError } from "@/lib/postal"

interface Result {
  postal: string
  city: string | null
  province: string | null
  ridings: Array<{ riding: string; mp: { id: string; name: string; party: string | null; partyId: string | null } | null }>
}

type State = { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string } | { kind: "done"; result: Result }

export function FindMpWithParams() {
  const sp = useSearchParams()
  return <FindMp initial={sp.get("postal") ?? ""} />
}

export function FindMp({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial ? formatPostal(initial) : "")
  const [state, setState] = useState<State>({ kind: "idle" })
  const [touched, setTouched] = useState(false)
  const ran = useRef(false)

  const lookup = useCallback(async (input: string) => {
    const err = postalError(input)
    if (err) {
      setState({ kind: "error", message: err })
      return
    }
    setState({ kind: "loading" })
    window.history.replaceState(null, "", `?postal=${encodeURIComponent(formatPostal(input).replace(" ", ""))}`)
    try {
      const res = await fetch(`/api/find?postal=${encodeURIComponent(input)}`)
      const body = await res.json()
      if (!res.ok) setState({ kind: "error", message: body.error ?? "Something went wrong. Try again." })
      else setState({ kind: "done", result: body })
    } catch {
      setState({ kind: "error", message: "We couldn't reach the server. Check your connection and try again." })
    }
  }, [])

  useEffect(() => {
    if (initial && !ran.current) {
      ran.current = true
      void lookup(initial)
    }
  }, [initial, lookup])

  const inlineError = touched && value ? postalError(value) : null

  return (
    <div>
      <form
        className="max-w-xl"
        onSubmit={(e) => {
          e.preventDefault()
          setTouched(true)
          void lookup(value)
        }}
        noValidate
      >
        <label htmlFor="postal" className="text-[0.9375rem] font-medium text-ink">
          Your postal code
        </label>
        <div className="mt-2 flex h-14 items-stretch overflow-hidden rounded-sm border border-rule-strong/70 bg-paper-raised transition-colors duration-150 focus-within:border-ink">
          <span className="flex items-center pl-4 text-ink-2">
            <MapPin aria-hidden className="size-5" strokeWidth={1.75} />
          </span>
          <input
            id="postal"
            name="postal"
            value={value}
            onChange={(e) => setValue(e.target.value.toUpperCase())}
            onBlur={() => setTouched(true)}
            autoComplete="postal-code"
            maxLength={7}
            placeholder="K1A 0A6"
            aria-invalid={!!inlineError || state.kind === "error"}
            aria-describedby="postal-help"
            className="w-full min-w-0 bg-transparent px-3 text-lg tracking-wide text-ink uppercase outline-none placeholder:text-ink-3"
          />
          <button
            type="submit"
            disabled={state.kind === "loading"}
            className="inline-flex shrink-0 items-center gap-2 bg-ink px-5 text-[1rem] font-medium text-paper transition-colors duration-150 hover:bg-accent-ink disabled:opacity-70"
          >
            {state.kind === "loading" ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : null}
            Find
          </button>
        </div>
        <p id="postal-help" className={inlineError ? "mt-2 text-[0.875rem] text-danger-ink" : "mt-2 text-[0.875rem] text-ink-3"}>
          {inlineError ?? "We look up your riding with Open North’s Represent service. We don’t store your postal code."}
        </p>
      </form>

      <div aria-live="polite" className="mt-10">
        {state.kind === "loading" && <p className="text-[0.9375rem] text-ink-3">Looking up your riding…</p>}
        {state.kind === "error" && !inlineError && (
          <div role="alert" className="max-w-xl border-l-2 border-danger-ink pl-4 text-[0.9375rem] text-ink">
            {state.message}
          </div>
        )}
        {state.kind === "done" && <Results result={state.result} />}
      </div>
    </div>
  )
}

function Results({ result }: { result: Result }) {
  if (!result.ridings.length) {
    return (
      <p className="max-w-xl text-[0.9375rem] text-ink-2">
        We found {result.postal}, but no federal riding is linked to it yet. Try a nearby postal code, or{" "}
        <Link className="link" href="/mps">
          browse all MPs
        </Link>
        .
      </p>
    )
  }
  const multiple = result.ridings.length > 1
  return (
    <section>
      <h2 className="font-display text-[1.375rem] font-semibold">
        {multiple ? `${result.postal} is split between ${result.ridings.length} ridings` : `Your MP for ${result.postal}`}
      </h2>
      {multiple && (
        <p className="measure mt-1 text-[0.9375rem] text-ink-2">
          Postal codes don’t follow riding boundaries exactly. Your MP depends on your street address; Elections Canada can confirm it.
        </p>
      )}
      <ul className="mt-5 grid gap-4 sm:grid-cols-2">
        {result.ridings.map((r) => (
          <li key={r.riding} className="group relative rounded-sm border border-rule bg-paper-raised p-5 transition-colors duration-150 hover:border-ink-3">
            <p className="text-[0.8125rem] text-ink-3">{r.riding}</p>
            {r.mp ? (
              <div className="mt-3 flex items-center gap-4">
                <MemberAvatar name={r.mp.name} partyId={r.mp.partyId} />
                <div className="min-w-0 flex-1">
                  <Link href={`/mps/${r.mp.id}`} className="font-display text-xl font-semibold after:absolute after:inset-0 group-hover:underline">
                    {r.mp.name}
                  </Link>
                  <PartyTag partyId={r.mp.partyId} label={r.mp.party} className="mt-0.5 flex" />
                </div>
                <ArrowRight aria-hidden className="size-5 text-ink-3 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-accent-ink" strokeWidth={1.75} />
              </div>
            ) : (
              <p className="mt-3 text-[0.9375rem] text-ink-2">This seat is currently vacant, or we don’t have its MP on record.</p>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[0.8125rem] text-ink-3">
        Riding lookup by{" "}
        <a className="link" href="https://represent.opennorth.ca">
          Represent (Open North)
        </a>
        , using the 2023 federal electoral map.
      </p>
    </section>
  )
}
