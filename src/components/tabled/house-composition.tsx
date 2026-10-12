import type { Party } from "@/lib/queries"
import { Hemicycle, type HemicycleSeat } from "./hemicycle"
import { partyColor, PartySwatch } from "./party-tag"

export function HouseComposition({ parties, vacant, seatsTotal }: { parties: Party[]; vacant: number; seatsTotal: number }) {
  const seats: HemicycleSeat[] = []
  for (const p of parties) for (let i = 0; i < p.seatCount; i++) seats.push({ id: `${p.id}-${i}`, fill: partyColor(p.id) })
  for (let i = 0; i < vacant; i++) seats.push({ id: `vacant-${i}`, fill: "var(--ballot-absent)", variant: "hollow" })
  const label = `House of Commons seats: ${parties.map((p) => `${p.shortName} ${p.seatCount}`).join(", ")}${vacant ? `, ${vacant} vacant` : ""}.`
  return (
    <figure>
      <Hemicycle seats={seats} label={label} />
      <figcaption className="mt-4">
        <p className="text-center text-[0.8125rem] text-ink-3">
          {seatsTotal} seats in the House of Commons{vacant ? `, ${vacant} vacant` : ""}
        </p>
        <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[0.8125rem] text-ink-2">
          {parties.map((p) => (
            <li key={p.id} className="inline-flex items-center gap-1.5">
              <PartySwatch partyId={p.id} />
              {p.shortName} <span className="text-ink tabular-nums">{p.seatCount}</span>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  )
}
