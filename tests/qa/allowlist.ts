// Accepted findings. Every entry needs a written reason; the list should only grow with one.
//   route: a route name from routes.ts, "*" for all, or a prefix ending in "*" ("fr-*").
//   selector: exact string or a RegExp; omit to match any.
//   actual: optional RegExp on the finding's "actual" text.
export interface AllowEntry {
  kind: string
  route: string
  selector?: string | RegExp
  actual?: RegExp
  reason: string
}

export const ALLOWLIST: AllowEntry[] = [
  {
    kind: "page-error",
    route: "*",
    actual: /_rsc=.*access control checks/,
    reason: "WebKit reports a cancelled Next.js RSC prefetch as an access-control error when the harness reloads the page mid-prefetch; same-origin, no user impact.",
  },
]
