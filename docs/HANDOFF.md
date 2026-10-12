# Handoff: continuing the Tabled overnight build

Read this file first, then `docs/tabled-brief.md` (the owner's brief, the source of truth), `PROGRESS.md`,
`DECISIONS.md`, `MORNING.md`, `DESIGN.md`, `PRODUCT.md`, `docs/DATA_SOURCES.md`, `README.md`, and
`git log --oneline -40`. The brief's operating rules still apply: never stop to ask questions (log judgment calls in
`DECISIONS.md`), keep state on disk, verify instead of assuming, no fabricated data, commit often with clean messages.

## Where things stand (2026-10-12, about 08:00)

- MVP (brief phases 0 to 7) is complete and every quality gate passed. Stretch backlog items 1 to 8 are done;
  item 4 (topic tags) is built but dormant until summaries exist.
- **Last local commit `647a894` (screenshot refresh) is NOT pushed**: `git push origin HEAD` failed with HTTP 408
  (large PNG batch). Retry first: `git -c http.postBuffer=524288000 push origin HEAD`. If it keeps failing, try again
  later; never force-push.
- Remaining work, in order:
  1. **Stretch item 9: further Impeccable polish on the most-visited pages** (home `src/views/home.tsx`, bill
     `src/views/bill.tsx`, vote `src/views/vote.tsx` + `src/components/votes/vote-chamber.tsx`, MP `src/views/mp.tsx`;
     also glance at digest, compare and the French pages). A polish review subagent was started but died on the
     usage limit before reporting, so nothing from it exists. Re-run it: read
     `~/.claude/skills/impeccable/reference/polish.md` and `craft-floor.md`, review against `DESIGN.md` and the
     direction contract in `.impeccable/surfaces/src-app-layout-tsx.md`, using `docs/screenshots/`. Apply at most
     one fix batch plus one confirmation round (Impeccable's unattended budget).
  2. **Vote detail Lighthouse performance is 88** (`/votes/45-1/177`); home 96, bill 96, MP 95, French bill 96, all
     a11y/best practices/SEO 100. The brief's 90+ target names home, bill and MP only, but improve vote detail too:
     the cause is likely the 337-row ballot table plus the client `VoteChamber` component shipping all ballots.
     Options: render the ballot table rows server-side and keep only filters/hover on the client, or paginate.
  3. After polish: rebuild, run the full suite, recapture `pnpm screenshots` (60 images incl. `fr-*`), commit.
  4. **Update `MORNING.md`** (it predates the stretch work): add the stretch items (French under `/fr`, weekly digest
     `/this-week` + RSS, per-bill/MP RSS, compare `/compare`, previous session 44-1, "What MPs said" debate excerpts,
     embeddable vote cards `/embed/votes/...`, topic tags dormant), new data counts, cold ingest about 6 minutes for
     both sessions, build about 5 minutes, test counts, Lighthouse numbers, known issues listed below, the unpushed
     commit if still unpushed. Keep it short, no em dashes. Then final `PROGRESS.md` update and commit + push.

## What exists (for orientation)

- Data: `scripts/ingest/` (http cache in `data/cache/`, normalizers with tests, `metrics.ts`, `index.ts` multi-session
  orchestrator: current 45-1 + previous 44-1 detected automatically; official ourcommons reconciliation for the
  current session; ballot dedupe; debate excerpts). DB `data/tabled.db` (gitignored). Counts: 45-1 191 bills,
  178 votes, 60,927 ballots; 44-1 412 bills, 928 votes, 311,735 ballots; 472 members; excerpts for 301 bills.
- Summaries: `scripts/summarize/` (grounding, chunking, Zod + ban-list validator, topics, hash cache in
  `data/summaries/`). **Blocked**: `.env` holds a 16-char placeholder, not an `sk-ant-` key; the script skips
  cleanly. Do not try to work around this; it needs the owner.
- App (Next 16.4, Cache Components): two root layouts via route groups `src/app/(en)/` and `src/app/(fr)/fr/`, plus
  `src/app/(embed)/` (bare layout for iframe cards) and `src/app/global-not-found.tsx` (`experimental.globalNotFound`).
  Pages are thin wrappers around `src/views/*.tsx` that take a `locale`. Strings in `src/i18n/messages.ts`
  (en + fr), stage explainers `src/lib/stages.ts` + `src/i18n/stages-fr.ts`, party names `src/i18n/parties.ts`.
  Queries in `src/lib/queries.ts` (`listBills/listVotes/listMembers` take a session id or "all", default current).
  Route handlers: `src/app/search-index/[locale]`, `src/app/data/mp/[slug]` (compare data), `api/find` (Represent,
  cached per code), RSS under `this-week/rss.xml`, `bills/.../rss.xml`, `mps/.../rss.xml`, sitemap, robots, OG images.
- Tests: 106 unit (Vitest, real fixtures in `tests/fixtures/`), 95 e2e incl. axe on every route both themes.

## Commands and gotchas (learned the hard way)

- Gates before every commit: `pnpm typecheck && pnpm lint && pnpm test`. At the end of a batch also
  `pnpm build && pnpm test:e2e`. Run lint before committing (one commit slipped in with a lint error).
- `pkill -f "next start"` before `pnpm test:e2e` (Playwright starts its own server on port 3100 with
  `REPRESENT_FIXTURES=1`). For manual checks: `pnpm exec next start -p 3200` in the background, then
  `BASE_URL=http://localhost:3200 pnpm screenshots` (or `ROUTES=home,bill-detail` for a subset, `OUT_DIR=` scratchpad).
- After any schema change: `pnpm db:generate`, inspect the SQL (drizzle generated an invalid copy-rows INSERT for
  `member_stats`; it was hand-fixed in `drizzle/0002_*.sql`), then `pnpm ingest` (cached, about 15 seconds) and rebuild.
- Cache Components: no `new Date()` or other clock reads in render paths (use `getDataDate()/getDataYear()`), or
  pages stop prerendering. Detail pages await `params` at the top level; `dynamicParams` is unavailable. Unknown
  `/bills|votes|mps/...` URLs return the 404 page with HTTP 200 + noindex (documented limitation).
- Commit hook `.githooks/commit-msg` strips attribution trailers; the brief forbids `Co-Authored-By`/`Claude-Session`
  lines, so do not add them. Never change git user config, never force-push. Conventional Commits.
- Python's `xml` (pyexpat) is broken on this Mac; validate XML with `xmllint`. Ad-hoc tsx scripts must live inside
  the repo (e.g. `scripts/_tmp.mts`, delete after) to resolve packages.
- Lighthouse: `CHROME_PATH=~/Library/Caches/ms-playwright/chromium-1248/.../Google Chrome for Testing` then
  `npx -y lighthouse@12 URL --only-categories=performance,accessibility,best-practices,seo --output=json`.
- Design rules (see `DESIGN.md`): paper/ink OKLCH tokens, one accent (Commons green), party colour only in data
  marks, neutral ballots (ink yea, sepia nay), Brygada 1918 display + Libre Franklin UI, tabular figures,
  `.name-sc` small caps for member names, double-rule totals in table footers, no eyebrows/kickers above headings,
  no cards-as-structure, sentence case, no em dashes in copy (official riding names keep theirs).

## Known issues to mention in MORNING.md

- Summaries not generated (placeholder key). Topic tags dormant for the same reason.
- Library of Parliament summaries blocked by Cloudflare; linked when LEGISinfo says they exist.
- Unknown record URLs: 404 page with HTTP 200 (noindex). Unmatched `/fr/...` URLs show the English global 404.
- 44-1 votes are not reconciled against ourcommons (its feed covers the current session only).
- Two OG images log a harmless satori "dynamic font" warning for a whitespace glyph.
- Vote detail Lighthouse performance 88 (unless fixed).
