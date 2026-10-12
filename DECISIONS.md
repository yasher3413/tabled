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
