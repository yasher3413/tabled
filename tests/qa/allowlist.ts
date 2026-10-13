// Accepted findings. Every entry needs a written reason; the list should only grow with one.
//   route: a route name from routes.ts, "*" for all, a prefix ending in "*" ("fr-*"), or a RegExp.
//   selector: exact string or a RegExp; omit to match any.
//   actual: optional RegExp on the finding's "actual" text.
export interface AllowEntry {
  kind: string
  route: string | RegExp
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
  {
    kind: "blank-tap-navigates",
    route: /^(fr-)?compare$/,
    selector: /^p:(\d{1,2} \S+ \d{4}|[A-Z][a-z]+ \d{1,2}, \d{4})$/,
    actual: /^went to \/(fr\/)?votes\//,
    reason: "WebKit touch adjustment snaps a tap on the small date line to the vote link directly above it (DOM hit test shows plain text); this is iOS platform behaviour for nearby links.",
  },
]
