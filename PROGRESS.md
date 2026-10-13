# Progress

## Current phase
MVP done; stretch backlog done; summaries generated and deployed at https://tabled-ca.vercel.app. Owner actions: see MORNING.md.

## Done
- Phase 0: brief read, logs, commit hook (verified), env check, live recon of all four sources with recorded fixtures, docs/DATA_SOURCES.md, scaffold (Next 16.4 Cache Components, Tailwind 4, shadcn radix-nova, Vitest, Playwright).
- Phase 1: Drizzle schema; ingestion of members, bills + stages, votes + ballots; party stats, party-line rate, dissent, votes cast; official-record reconciliation against ourcommons.ca.
- Phase 2: Impeccable context (PRODUCT.md, direction contract "the division list", seed 7c5ccbbc), tokens (OKLCH, paper/ink, Commons green accent), Brygada 1918 + Libre Franklin, shell, command palette, core components.
- Phase 3: bills index (search, filters, URL state, paging), bill detail (readings ledger with stage explainers, votes, sources), home (this week, House composition).
- Phase 4: votes index + vote detail (interactive hemicycle, dissenters, sortable ballot table), MPs directory + detail, Find your MP (cached Represent route, multi-riding), parties, about/methodology.
- Phase 5: summarizer (grounding priority, chunking, Zod + ban-list validator, retries, hash cache, DB upsert). Run with OpenAI gpt-5.4-mini on 2026-10-13: 598 summaries across 44-1 and 45-1.
- Phase 6: Impeccable critique (27/40) and full fix batch; audit checks (no hard-coded colours, no 360px overflow); OG images, sitemap, robots, 404/error pages; screenshots of every route.
- Phase 7: README, CI and daily refresh workflows, MIT licence, CONTRIBUTING.

## Quality gates (latest run)
- typecheck, lint: clean. Unit: 106 tests passing. E2E + axe: 95 passing (every route incl. French, light and dark, zero serious/critical violations). Build passes.
- Lighthouse (local prod build, perf/a11y/best practices/SEO): home 96/100/100/100, bill 96/100/100/100, MP 95/100/100/100, vote 95/100/100/100, French bill 96/100/100/100.
- Screenshots: 72 images (18 routes, 1440px and 390px, light and dark) in docs/screenshots/.

## Stretch backlog
- [x] 9. Impeccable polish (one fix batch plus confirmation) on home, bill, vote and MP, with a look at digest, compare, embed and French: green only for links and the current stage, phone ballot table keeps the vote column, full dissenter names on phones, no repeated territory name, wrapping section headings, memoised ballot rows.
- [x] 6. Previous session (44-1: 412 bills, 928 votes, 311,735 ballots): /bills/44-1, /votes/44-1, session filter on /mps, per-session MP ledgers and record. MP stats stored per session.
- [x] 7. Hansard excerpts on bill pages ("What MPs said"): one opening excerpt per party, anchored on the bill, linked to the full speech. 301 bills.
- [x] 8. Embeddable vote card at /embed/votes/... with copyable iframe code on vote pages.
- [x] 5. Compare two MPs at /compare (both languages): agreement rate, counts, every vote where they split; linked from MP pages.
- [x] 4. Topic tags: fixed bilingual taxonomy (22 topics), summarizer emits 1 to 3 validated topic ids, topic filter on /bills and topic links on bill pages. Live since summaries were generated.
- [x] 2. Weekly digest at /this-week (and /this-week/YYYY-Www, both languages) with an RSS feed.
- [x] 3. Per-bill and per-MP RSS feeds (/bills/.../rss.xml, /mps/.../rss.xml), advertised in page metadata.
- [x] 1. French: /fr for every page, hand-translated UI and stage explainers, official French data, hreflang, bilingual sitemap, French e2e + axe.

## Next
- Nothing left in the backlog. Owner actions: GitHub secrets for the daily refresh, Vercel GitHub app access and deploy hook. See MORNING.md.

## Blocked
- (Resolved 2026-10-13) Summaries were blocked on a placeholder Anthropic key; the summarizer now also supports OpenAI and was run with the owner's OpenAI key.
- Impeccable and Magic: both available. Impeccable interview and decision steps answered from the brief (no questions allowed).

## Data counts (full ingest 2026-10-12)
- Session 45-1 (detected dynamically). 191 bills, 178 recorded votes, 60,927 ballots, 349 members (337 sitting, 12 former), 343 ridings, 6 parties.
- Previous session 44-1 also ingested: 412 bills, 928 votes, 311,735 ballots; 472 members across both sessions. Cold ingest of both sessions about 6 minutes; cached re-run about 15 seconds. Build about 5 minutes.
- Cold full ingest: 195 s, 725 requests, 0 retries. Warm re-run: about 4 s.
- Sanity checks: seat counts match ourcommons members XML exactly (Liberal 173, Conservative 137, Bloc 21, NDP 5, Green 1). Vote 178 totals 296/26/10 match both sources.
- 6 votes disagreed between openparliament and the House of Commons. openparliament vote 148 duplicates vote 140 (C-33 3rd reading). Five more are off by 1 or 2. The official record is used for those votes (details in `meta.crosscheck`).

## Notes for the owner
