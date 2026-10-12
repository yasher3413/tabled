# Progress

## Current phase
Phase 1: Data layer

## Done
- 0.1 Read brief (docs/tabled-brief.md; the prompt referenced docs/BRIEF.md, which does not exist)
- 0.2 .gitignore, .githooks/commit-msg (verified: strips co-author, Claude-Session, Generated-with lines), .env.example
- 0.3 Environment: Node 25.9.0, pnpm 9.15.9, push to origin/main works. Impeccable skill available. 21st.dev Magic MCP available. ANTHROPIC_API_KEY present in .env.
- 0.4 Recon done, fixtures in tests/fixtures, docs/DATA_SOURCES.md written
- 0.5 Scaffold: Next 16.4 (Cache Components on), Tailwind 4, shadcn (radix-nova), Vitest, Playwright, Prettier. Build passes.

- 1.1 Drizzle schema + migrations
- 1.2-1.4 Ingestion: members, bills + stages, votes + ballots, party stats, party-line, dissent, attendance. Unit tests on real fixtures.
- 1.5 Full live ingest (see counts). Reconciles openparliament against the official House of Commons feed.

## Next
- Phase 2: design system (Impeccable setup, tokens, shell, components)

## Blocked
(none yet)

## Data counts (full ingest 2026-10-12)
- Session 45-1 (detected dynamically). 191 bills, 178 recorded votes, 60,927 ballots, 349 members (337 sitting, 12 former), 343 ridings, 6 parties.
- Cold full ingest: 195 s, 725 requests, 0 retries. Warm re-run: about 4 s.
- Sanity checks: seat counts match ourcommons members XML exactly (Liberal 173, Conservative 137, Bloc 21, NDP 5, Green 1). Vote 178 totals 296/26/10 match both sources.
- 6 votes disagreed between openparliament and the House of Commons. openparliament vote 148 duplicates vote 140 (C-33 3rd reading). Five more are off by 1 or 2. The official record is used for those votes (details in `meta.crosscheck`).

## Notes for the owner
