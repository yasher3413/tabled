# Contributing to Tabled

Thanks for helping make Parliament easier to follow. Corrections to data or wording are the most valuable
contribution of all.

## Reporting an error

Open an issue with the page URL, what is wrong, and where the correct information can be found (a LEGISinfo,
ourcommons.ca or openparliament.ca link is ideal). Every bill page has a "Report an error" link that fills this in.

## Ground rules

- **No fabricated data.** Every number, name, vote and status shown must come from a real source response. If data
  is missing, show an honest empty or "unavailable" state.
- **Neutral by design.** Describe; never evaluate. No loaded adjectives. Party colours appear only in charts and
  small tags. Parties are ordered by seat count everywhere.
- **Plain language.** Sentence case, short sentences, no em dashes.
- **Accessible.** WCAG AA in light and dark themes, full keyboard support, a text alternative for every chart.

## Local setup

```bash
pnpm install
pnpm ingest        # builds data/tabled.db from live sources (about 3 minutes cold, seconds when cached)
pnpm dev
```

Optional: put `ANTHROPIC_API_KEY=sk-ant-...` or `OPENAI_API_KEY=sk-...` in `.env` and run `pnpm summarize` to generate plain-English summaries.

## Before you open a pull request

```bash
pnpm typecheck && pnpm lint && pnpm test
pnpm build && pnpm test:e2e
```

- Parsers and metrics are unit tested against real responses recorded in `tests/fixtures/`. When you fix a data
  quirk, add the real response that shows it as a fixture.
- Use Conventional Commits (`feat(bills): ...`, `fix(ingest): ...`).
- Keep pull requests focused. Screenshots help for UI changes (`pnpm screenshots`).
