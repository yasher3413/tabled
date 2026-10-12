"use client"

import { useState } from "react"
import type { Party } from "@/lib/queries"
import { cn } from "@/lib/utils"
import { Hemicycle, type HemicycleSeat } from "./hemicycle"
import { partyColor, PartySwatch } from "./party-tag"

/** Seats by party. Hovering or focusing a legend entry isolates that party's seats. */
export function HouseComposition({ parties, vacant, seatsTotal }: { parties: Party[]; vacant: number; seatsTotal: number }) {
  const [focus, setFocus] = useState<string | null>(null)
  const seats: HemicycleSeat[] = []
  for (const p of parties) for (let i = 0; i < p.seatCount; i++) seats.push({ id: `${p.id}-${i}`, fill: partyColor(p.id), dim: focus !== null && focus !== p.id })
  for (let i = 0; i < vacant; i++) seats.push({ id: `vacant-${i}`, fill: "var(--ink-3)", variant: "hollow", dim: focus !== null && focus !== "vacant" })
  const label = `House of Commons seats: ${parties.map((p) => `${p.shortName} ${p.seatCount}`).join(", ")}${vacant ? `, ${vacant} vacant` : ""}.`
  const item = (key: string, swatch: React.ReactNode, name: string, n: number) => (
    <li key={key}>
      <button
        type="button"
        onPointerEnter={() => setFocus(key)}
        onPointerLeave={() => setFocus(null)}
        onFocus={() => setFocus(key)}
        onBlur={() => setFocus(null)}
        aria-label={`${name}: ${n} seats`}
        className={cn("inline-flex items-center gap-1.5 rounded-sm px-1 py-0.5 transition-opacity duration-150", focus && focus !== key && "opacity-45")}
      >
        {swatch}
        {name} <span className="text-ink tabular-nums">{n}</span>
      </button>
    </li>
  )
  return (
    <figure>
      <Hemicycle seats={seats} label={label} />
      <figcaption className="mt-4">
        <p className="text-center text-[0.8125rem] text-ink-3">{seatsTotal} seats in the House of Commons</p>
        <ul className="mt-2.5 flex flex-wrap justify-center gap-x-2.5 gap-y-1 text-[0.8125rem] text-ink-2">
          {parties.map((p) => item(p.id, <PartySwatch partyId={p.id} />, p.shortName, p.seatCount))}
          {vacant > 0 && item("vacant", <span aria-hidden className="size-2.5 rounded-full border-[1.5px] border-ink-3" />, "Vacant", vacant)}
        </ul>
      </figcaption>
    </figure>
  )
}
