# Progress

## Current phase
MVP built (Phases 0 to 7). Impeccable finish review in progress, then DESIGN.md, MORNING.md, then the stretch backlog.

## Done
- Phase 0: brief read, logs, commit hook (verified), env check, live recon of all four sources with recorded fixtures, docs/DATA_SOURCES.md, scaffold (Next 16.4 Cache Components, Tailwind 4, shadcn radix-nova, Vitest, Playwright).
- Phase 1: Drizzle schema; ingestion of members, bills + stages, votes + ballots; party stats, party-line rate, dissent, votes cast; official-record reconciliation against ourcommons.ca.
- Phase 2: Impeccable context (PRODUCT.md, direction contract "the division list", seed 7c5ccbbc), tokens (OKLCH, paper/ink, Commons green accent), Brygada 1918 + Libre Franklin, shell, command palette, core components.
- Phase 3: bills index (search, filters, URL state, paging), bill detail (readings ledger with stage explainers, votes, sources), home (this week, House composition).
- Phase 4: votes index + vote detail (interactive hemicycle, dissenters, sortable ballot table), MPs directory + detail, Find your MP (cached Represent route, multi-riding), parties, about/methodology.
- Phase 5: summarizer (grounding priority, chunking, Zod + ban-list validator, retries, hash cache, DB upsert). Not run: see Blocked.
- Phase 6: Impeccable critique (27/40) and full fix batch; audit checks (no hard-coded colours, no 360px overflow); OG images, sitemap, robots, 404/error pages; screenshots of every route.
- Phase 7: README, CI and daily refresh workflows, MIT licence, CONTRIBUTING.

## Quality gates (latest run)
- typecheck, lint: clean. Unit: 80 tests passing. E2E + axe: 48 passing (every route, light and dark, zero serious/critical violations).
- Lighthouse (local prod build): home 91/100/100/100, bill 96/100/100/100, MP 93/100/100/100 (perf/a11y/best practices/SEO).

## Next
- Finish review verdict and fixes; DESIGN.md via documenter.
- MORNING.md.
- Stretch backlog in order: French, weekly digest + RSS, per-bill/MP RSS, topic tags (needs summaries), compare MPs, previous session, Hansard excerpts, embeddable vote card, polish.

## Blocked
- **Plain-English summaries not generated.** `.env` contains a 16-character placeholder for `ANTHROPIC_API_KEY`, not a real key (the API returns `invalid x-api-key`), and no `ant` CLI login exists. The summarizer is built and tested; it skips cleanly and the site shows "Plain-English summary coming soon" plus the official LEGISinfo summary where one exists. Owner action: put a real `sk-ant-...` key in `.env` and run `pnpm summarize` (about $2-4 with Haiku 4.5 for all 190 bills), then commit `data/summaries/`.
- Impeccable and Magic: both available. Impeccable interview and decision steps answered from the brief (no questions allowed).

## Data counts (full ingest 2026-10-12)
- Session 45-1 (detected dynamically). 191 bills, 178 recorded votes, 60,927 ballots, 349 members (337 sitting, 12 former), 343 ridings, 6 parties.
- Cold full ingest: 195 s, 725 requests, 0 retries. Warm re-run: about 4 s.
- Sanity checks: seat counts match ourcommons members XML exactly (Liberal 173, Conservative 137, Bloc 21, NDP 5, Green 1). Vote 178 totals 296/26/10 match both sources.
- 6 votes disagreed between openparliament and the House of Commons. openparliament vote 148 duplicates vote 140 (C-33 3rd reading). Five more are off by 1 or 2. The official record is used for those votes (details in `meta.crosscheck`).

## Notes for the owner
