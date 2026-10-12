# Decisions

One line each: decision, reason.

- Treat `docs/tabled-brief.md` as the brief: the requested `docs/BRIEF.md` does not exist and this is the only brief in the repo.
- No `Claude-Session:` or co-author trailers on commits, overriding the harness default: the brief forbids them explicitly.
- Fetch ballots per vote from openparliament: the session-wide ballot filter returns HTTP 500.
- Ground summaries in LEGISinfo executive summary plus bill XML `<Summary>` and text: Library of Parliament pages are behind a Cloudflare challenge.
- No MP photos, initials avatars only: licensing of openparliament/ourcommons portraits is unclear.
- Use Represent's 2023 Representation Order boundary set: the default federal set is the 2013 map.
- Default `SUMMARY_MODEL` is `claude-haiku-4-5` instead of `claude-haiku-5-5`: no model with that ID exists.
- Current bill stage is derived from stage order (first stage after the last completed one), not from LEGISinfo's `No activity` flag: that flag is inconsistent across chambers.
- Link to the Library of Parliament legislative summary using its standard URL pattern only when LEGISinfo sets `IsFullLegislativeSummaryAvailable`: the page cannot be fetched by scripts (Cloudflare) so it is not verified per bill.
- Pure-function edge cases (ties, independents) use small inline inputs in unit tests: those cases do not occur in the recorded votes, and inline inputs are never shown in the UI.
- When openparliament and the House of Commons feed disagree on a vote's totals or date, use the official House record for that vote's details and ballots: openparliament vote 45-1/148 is a duplicate of 140.
- Session start date is the earliest bill first reading or vote date in the data: no source exposes the session's opening date directly.
- Impeccable's interview and decision steps answered from the brief instead of asking: the owner's brief forbids stopping for questions. PRODUCT.md marks inferred facts.
- 21st.dev Magic consulted for the command palette, timeline and hemicycle: the catalog offered generic SaaS styling (and no hemicycle), so only interaction patterns were adopted (grouped results, arrow-key nav, moving highlight), built on shadcn cmdk in Tabled's own grammar.
- Unknown bill/vote/MP URLs render the 404 page with noindex but HTTP 200: Cache Components streams the shell before notFound() and dynamicParams is unavailable. Every real record is prerendered, so only mistyped URLs are affected.
- Summaries may have 1 or 2 'what it does' bullets when the source is under 1,500 characters (otherwise 3 to 6, per the brief): one-line bills such as a single repeal cannot yield three distinct changes without padding or invention.
- Impeccable critique (27/40) acted on in one fix batch: official summary shown openly, one stage vocabulary, paginated bills index, division-list totals, neutral ballot colours (ink yea, sepia nay) so neither side reads as "positive".
- Added a `skipped` stage state: 17 Senate bills went from second to third reading without a committee stage, which the canonical stage list had shown as "not reached".
- The home hemicycle uses party colours: it is a data visualisation of seat counts (allowed by the brief), not a page theme.
- Impeccable run finished: critique, audit checks, finish review (fix, then verdict: 7 of 8 resolved plus the last one fixed), DESIGN.md written by the documenter from the shipped code.
- French lives under /fr with its own root layout (route groups (en) and (fr)); English URLs are unchanged. Switching language is a full page load, which multiple root layouts require.
- French pages use Parliament's official French data (titles, statuses, vote descriptions, LEGISinfo summaries, sponsor titles). AI summaries are not shown in French because they are generated from English sources.
- Unmatched /fr/... URLs fall through to the English global 404: global-not-found has no locale. Known French records all have localized pages.
- French OG images reuse the English cards: they carry the bill number and title, and duplicating 700 image routes was not worth the build time.
- /this-week shows the latest week with activity when the current week has none yet, so it never opens empty; the heading names the week shown.
