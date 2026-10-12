# Good morning

Tabled is built and pushed to `main`. Every page in the brief works with live data from Parliament, and every
quality gate passes. One thing needs you: the Anthropic key in `.env` is a placeholder, so no plain-English summaries
were generated. Bill pages show Parliament's official summary instead.

## What works

- **Pages**: home (this week in Parliament, House composition), bills index (search, filters in the URL, paging), bill
  detail (status in plain words, official summary, stage-by-stage timeline with explainers, every recorded vote with a
  party table), votes index, vote detail (interactive seat chart, who broke with their party, sortable ballot table),
  MPs directory, MP detail (party-line rate, votes cast, voting record), Find your MP (postal code, multi-riding),
  parties, about and methodology, custom 404 and error pages.
- **Global**: Cmd/Ctrl+K search across bills, MPs and votes; light and dark themes; Open Graph images for bills, votes
  and MPs; sitemap and robots.
- **Data**: session 45-1 detected automatically. 191 bills, 178 recorded votes, 60,927 ballots, 349 MPs. Seat counts
  match the House of Commons exactly. Every vote is cross-checked against the official House feed; 6 disagreed with
  openparliament.ca (vote 148 there is a duplicate of vote 140) and the official record is used for those.
- **Quality**: TypeScript strict, ESLint clean, 80 unit tests on real recorded responses, 48 end-to-end tests including
  axe on every route in both themes (zero serious or critical violations). Lighthouse on a local production build:
  home 91/100/100/100, bill 96/100/100/100, MP 93/100/100/100.
- **Design**: run through Impeccable (context, direction, critique at 27/40 and a full fix batch, audit checks, an
  independent finish review with two fix rounds) and checked against 21st.dev Magic. The direction is "the division
  list": Parliament's own printed record, with totals under a double rule, small-caps names, and neutral ballot colours
  so neither side of a vote reads as the "good" one.

Screenshots of every route, 1440px and 390px, light and dark: [`docs/screenshots/`](docs/screenshots/).

## What does not work yet, and why

- **Plain-English summaries**: `.env` holds a 16-character placeholder, not an `sk-ant-` key. The API rejected it. The
  summarizer is built and tested and skips cleanly without a key.
- **Library of Parliament summaries** sit behind a Cloudflare challenge, so they can't be fetched by scripts. Tabled
  links to them (when LEGISinfo says one exists) and uses LEGISinfo's summary and the bill text instead.
- **Unknown bill/vote/MP URLs** show the 404 page with `noindex` but return HTTP 200, a Next 16 Cache Components
  limitation. Real records are all prerendered, so only mistyped URLs are affected. Top-level unknown URLs return 404.
- **MP photos** are not shown (licensing unclear); initials avatars instead.

## Run it locally

```bash
pnpm install
pnpm ingest      # about 3 minutes the first time (data/cache makes later runs take seconds)
pnpm dev         # http://localhost:3000
```

Full checks: `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm test:e2e`.

## What needs your input

1. **Anthropic key**: put a real key in `.env` as `ANTHROPIC_API_KEY=sk-ant-...`, run `pnpm summarize` (Haiku 4.5;
   roughly $2 to $4 for all 190 bills), then `git add data/summaries && git commit`. Add the same key as a GitHub
   secret so the daily job keeps summaries current.
2. **Deploy**: import the repo in Vercel (no settings needed; the build ingests data), set `NEXT_PUBLIC_SITE_URL`,
   create a Deploy Hook and save it as the GitHub secret `VERCEL_DEPLOY_HOOK`. Details in the README.
3. **Domain** and the final site name in `src/lib/site.ts` (`SITE_URL` falls back to `tabled.vercel.app`).
4. Decide whether the home page seat chart (party colours) is acceptable under the "party colours only in data" rule.
   I treated it as data.

## Suggested next steps

1. Add the API key and generate summaries; they are the heart of the product and the biggest missing piece.
2. Deploy to Vercel and enable the daily refresh workflow.
3. Read a few bill pages in French once the French site lands (see below) and fix any phrasing that reads as
   translated.
4. Review the 17 bills where the Senate skipped committee and the 6 reconciled votes; report the duplicate vote to
   openparliament.ca.
5. Get a nonpartisan reader or two to review the methodology page and the summary prompt before launch.

## Where to look

- `PROGRESS.md`: phase log, data counts, blocked items.
- `DECISIONS.md`: every judgment call, one line each.
- `docs/DATA_SOURCES.md`: endpoints, fields and quirks found during recon.
- `DESIGN.md`: the design system (written from the built site).

## Stretch backlog

Started after the MVP. Status is updated in `PROGRESS.md` as items land.
