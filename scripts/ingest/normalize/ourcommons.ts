import { XMLParser } from "fast-xml-parser"
import type { BallotValue } from "./votes"
import { partyIdFromShortName } from "./members"

export interface OCVoteSummary {
  id: string
  number: number
  date: string
  subject: string
  result: string
  yeas: number
  nays: number
  paired: number
  billNumber: string | null
}

export interface OCParticipant {
  personId: number
  ballot: BallotValue
  partyId: string | null
}

const parser = new XMLParser({ parseTagValue: true })

function asArray<T>(v: T | T[] | undefined): T[] {
  return v === undefined ? [] : Array.isArray(v) ? v : [v]
}

export function parseOCVotes(xml: string): OCVoteSummary[] {
  type Raw = Record<string, string | number>
  const doc = parser.parse(xml) as { ArrayOfVote?: { Vote?: Raw | Raw[] } }
  return asArray(doc.ArrayOfVote?.Vote).map((v) => ({
    id: `${v.ParliamentNumber}-${v.SessionNumber}/${v.DecisionDivisionNumber}`,
    number: Number(v.DecisionDivisionNumber),
    date: String(v.DecisionEventDateTime).slice(0, 10),
    subject: String(v.DecisionDivisionSubject),
    result: String(v.DecisionResultName),
    yeas: Number(v.DecisionDivisionNumberOfYeas),
    nays: Number(v.DecisionDivisionNumberOfNays),
    paired: Number(v.DecisionDivisionNumberOfPaired),
    billNumber: v.BillNumberCode ? String(v.BillNumberCode) : null,
  }))
}

/** Ballots from the official vote XML. Members who did not vote are not listed. */
export function parseOCParticipants(xml: string): OCParticipant[] {
  type Raw = Record<string, string | number | boolean>
  const doc = parser.parse(xml) as { ArrayOfVoteParticipant?: { VoteParticipant?: Raw | Raw[] } }
  return asArray(doc.ArrayOfVoteParticipant?.VoteParticipant).map((p) => ({
    personId: Number(p.PersonId),
    ballot: p.IsVotePaired === true ? "paired" : p.IsVoteYea === true ? "yea" : "nay",
    partyId: p.CaucusShortName ? partyIdFromShortName(String(p.CaucusShortName)) : null,
  }))
}

export function totalsDiffer(
  a: { yeas: number; nays: number; paired: number; date: string },
  b: { yeas: number; nays: number; paired: number; date: string },
) {
  return a.yeas !== b.yeas || a.nays !== b.nays || a.paired !== b.paired || a.date !== b.date
}
