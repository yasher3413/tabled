# Good morning

Tabled is built, pushed to `main` and live at **https://tabled-ca.vercel.app**. Every page in the brief works with live data from Parliament, every quality
gate passes, and all nine stretch items are done. Plain-English summaries now exist for every bill in both sessions
(598, written by OpenAI's gpt-5.4-mini), and topic tags and the topic filter are live with them.

## What works

- **Core pages**: home (this week in Parliament, House composition), bills index (search, filters in the URL, paging),
  bill detail (status in plain words, official summary, stage timeline with explainers, every recorded vote with a
  party table), votes index, vote detail (interactive seat chart, who broke with their party, sortable ballot table),
  MPs directory, MP detail (party-line rate, votes cast, voting record), Find your MP (postal code, multi-riding),
  parties, about and methodology, custom 404 and error pages.
- **Global**: Cmd/Ctrl+K search across bills, MPs and votes; light and dark themes; Open Graph images; sitemap, robots.
- **Design**: run through Impeccable (critique, fix batch, audit, finish review, DESIGN.md, then a final polish pass).
  The direction is "the division list": Parliament's printed record, with totals under a double rule, small-caps
  names, and neutral ballot colours so neither side of a vote reads as the "good" one.

## Stretch work (all after the MVP)

1. **French** under `/fr` for every page: hand-translated UI and stage explainers, Parliament's official French data,
   hreflang and a bilingual sitemap.
2. **Weekly digest** at `/this-week` (plus `/this-week/YYYY-Www` for past weeks) with an RSS feed.
3. **RSS per bill and per MP** (`/bills/.../rss.xml`, `/mps/.../rss.xml`).
4. **Topic tags**: a fixed 22-topic taxonomy, 1 to 3 per bill from the summarizer (validated), and a `/bills` topic
   filter.
5. **Compare two MPs** at `/compare`: agreement rate and every vote where they split.
6. **Previous session (44-1)**: `/bills/44-1`, `/votes/44-1`, a session filter on `/mps`, per-session MP records.
7. **"What MPs said"** on bill pages: one opening excerpt per party from Hansard, unedited, linked to the full speech.
8. **Embeddable vote cards** at `/embed/votes/...`, with copy-ready iframe code on every vote page.
9. **Final polish** on home, bill, vote and MP pages: green kept for links and the current stage only, the phone
   ballot table keeps the vote column on screen, full dissenter names on phones, and a faster ballot table.

## Current numbers

- **Data**: session 45-1 detected automatically: 191 bills, 178 recorded votes, 60,927 ballots. Session 44-1: 412
  bills, 928 votes, 311,735 ballots. 472 members across both. Hansard excerpts for 301 bills. Seat counts match the
  House of Commons exactly; 6 current-session votes disagreed with openparliament.ca and use the official record.
- **Timing**: cold ingest of both sessions about 6 minutes (about 15 seconds with the cache); build about 5 minutes.
- **Tests**: 106 unit tests on real recorded responses; 95 end-to-end tests including axe on every route in both
  themes (zero serious or critical violations). Typecheck and lint clean.
- **Lighthouse** (local production build, performance/accessibility/best practices/SEO): home 96/100/100/100, bill
  96/100/100/100, MP 95/100/100/100, vote 95/100/100/100, French bill 96/100/100/100.

Screenshots of every route (including French, the digest, compare and the embed card), 1440px and 390px, light and
dark: [`docs/screenshots/`](docs/screenshots/).

## Known issues

- **Summaries are English only**: they are written from English sources, so the French site shows Parliament's
  official French summary instead. One bill has no usable source and has no summary.
- **Library of Parliament summaries** sit behind a Cloudflare challenge. Tabled links to them when LEGISinfo says one
  exists and uses LEGISinfo's summary and the bill text instead.
- **Unknown bill, vote or MP URLs** show the 404 page with `noindex` but return HTTP 200 (a Next 16 Cache Components
  limitation). Unmatched `/fr/...` URLs show the English 404. Real records are all prerendered.
- **44-1 votes are not reconciled** against ourcommons.ca, whose feed covers the current session only.
- Two Open Graph images log a harmless satori "dynamic font" warning for a whitespace glyph.
- **MP photos** are not shown (licensing unclear); initials avatars instead.

## Run it locally

```bash
pnpm install
pnpm ingest      # about 6 minutes the first time; seconds after that (data/cache)
pnpm dev         # http://localhost:3000
```

Full checks: `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm test:e2e`.

## What needs your input

1. **GitHub secret for the daily refresh**: add your OpenAI key as the repo secret `OPENAI_API_KEY` (and the
   variable `SUMMARY_PROVIDER=openai`) so new and changed bills get summaries automatically. Vercel does not need the
   key: summaries are committed and loaded at build time.
2. **Automatic deploys**: the Vercel project `tabled` is linked to the GitHub repo, but a push did not start a build,
   so the Vercel GitHub app probably lacks access to this repo. Grant it under GitHub, Settings, Applications, Vercel.
   Then create a Deploy Hook in Vercel (Settings, Git, Deploy Hooks) and save it as the GitHub secret
   `VERCEL_DEPLOY_HOOK` so the daily refresh redeploys. Until then, deploy with `vercel deploy --prod --archive=tgz`.
3. **A custom domain** (optional): the site uses the free `tabled-ca.vercel.app`, because `tabled.vercel.app` belongs
   to someone else. If you buy a domain, add it in Vercel and set `NEXT_PUBLIC_SITE_URL` to it.

## Suggested next steps

1. Read a dozen summaries against their bills yourself; they are the heart of the product. Use "Report an error" links
   or edit `data/summaries/` and commit.
2. Give the Vercel GitHub app access and add the deploy hook so the daily refresh goes live on its own.
3. Have a French reader check a few bill and vote pages for phrasing that reads as translated.
4. Report openparliament.ca's duplicate vote (45-1/148 repeats 140) and review the 17 bills where the Senate skipped
   committee.
5. Get a nonpartisan reader or two to review the methodology page and the summary prompt before launch.

## Where to look

- `PROGRESS.md`: phase log, data counts, blocked items.
- `DECISIONS.md`: every judgment call, one line each.
- `docs/DATA_SOURCES.md`: endpoints, fields and quirks found during recon.
- `DESIGN.md`: the design system, written from the built site.
