// Representative routes picked from the local database, shared by the screenshot script and the QA harness.
import path from "node:path"
import Database from "better-sqlite3"

export interface SampleRoute {
  name: string
  path: string
}

export function sampleRoutes(): SampleRoute[] {
  const db = new Database(path.join(process.cwd(), "data", "tabled.db"), { readonly: true })
  // Pick well-populated examples so screenshots show real, representative data.
  const bill = db
    .prepare("SELECT b.session_id s, b.number n FROM bills b JOIN votes v ON v.bill_id = b.id WHERE b.type = 'government' GROUP BY b.id ORDER BY b.last_activity_date DESC LIMIT 1")
    .get() as { s: string; n: string }
  const vote = db
    .prepare("SELECT session_id s, number n FROM votes WHERE has_party_split = 1 ORDER BY date DESC LIMIT 1")
    .get() as { s: string; n: number }
  const mp = db
    .prepare("SELECT m.id FROM members m JOIN member_stats s ON s.member_id = m.id WHERE m.active = 1 AND s.bills_sponsored > 0 ORDER BY s.dissent_count DESC, s.bills_sponsored DESC LIMIT 1")
    .get() as { id: string }
  // A second sitting MP from another party, for the compare page.
  const other = db
    .prepare("SELECT m.id FROM members m WHERE m.active = 1 AND m.party_id != (SELECT party_id FROM members WHERE id = ?) ORDER BY m.id LIMIT 1")
    .get(mp.id) as { id: string }
  db.close()
  return [
    { name: "home", path: "/" },
    { name: "bills", path: "/bills" },
    { name: "bill-detail", path: `/bills/${bill.s}/${bill.n}` },
    { name: "votes", path: "/votes" },
    { name: "vote-detail", path: `/votes/${vote.s}/${vote.n}` },
    { name: "mps", path: "/mps" },
    { name: "mp-detail", path: `/mps/${mp.id}` },
    { name: "find", path: "/find" },
    { name: "parties", path: "/parties" },
    { name: "about", path: "/about" },
    { name: "this-week", path: "/this-week" },
    { name: "compare", path: `/compare?a=${mp.id}&b=${other.id}` },
    { name: "embed-vote", path: `/embed/votes/${vote.s}/${vote.n}` },
    { name: "not-found", path: "/this-page-does-not-exist" },
    { name: "fr-home", path: "/fr" },
    { name: "fr-bill-detail", path: `/fr/bills/${bill.s}/${bill.n}` },
    { name: "fr-vote-detail", path: `/fr/votes/${vote.s}/${vote.n}` },
    { name: "fr-mp-detail", path: `/fr/mps/${mp.id}` },
  ]
}
