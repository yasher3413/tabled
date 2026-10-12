# Tabled: Overnight Build Brief

You are building **Tabled**, a beautiful, plain-English tracker for the Parliament of Canada: every federal bill, every recorded House vote, every MP, explained so a normal person can understand it in under a minute.

The owner of this repo is asleep. This is an unattended overnight run. Nobody will answer questions until morning. Read this entire brief before writing any code, then execute it end to end.

---

## 1. Operating rules for this run

1. **Never stop to ask a question.** When something is ambiguous, pick the most reasonable option, write it down in `DECISIONS.md` (one line: decision, reason), and keep going.
2. **Never end your turn early.** Finishing the MVP is not the end. When the MVP's Definition of Done is met, move to the Stretch Backlog (section 13) and keep working through it in order. Only stop when the backlog is exhausted or you are truly blocked on everything that remains.
3. **Keep state on disk, not in your head.** Your context will be compacted during a long run. Maintain `PROGRESS.md` at the repo root: current phase, what is done, what is next, known issues. Update it before every commit. After any compaction or restart, read `PROGRESS.md`, `DECISIONS.md` and `git log --oneline -30` before doing anything else.
4. **Verify, don't assume.** Every external endpoint in this brief must be fetched and inspected before you build against it. If an endpoint's shape differs from what this brief says, the live response wins. Log the difference in `DECISIONS.md`.
5. **If blocked, route around it.** If a tool, API or dependency fails, log it under "Blocked" in `PROGRESS.md`, build a graceful fallback, and move to the next task. One broken thing must never stall the whole night.
6. **No fabricated data, ever.** Every number, name, vote and status shown in the UI must come from a real source response. Test fixtures must be recorded from real responses, not invented. If data is missing, the UI shows an honest empty or "unavailable" state.

---

## 2. Git rules (strict)

The owner created this repo and it is already cloned with `origin` set.

- **Commit often.** Commit after every completed task in the phase plan (section 11), and never let more than about 30 minutes of work go uncommitted. Small, focused commits.
- **Push after every commit:** `git push origin HEAD`. If a push fails for auth or network reasons, keep committing locally, note it in `PROGRESS.md`, and retry the push at the next commit.
- **Branch:** work on `main`. If `main` is protected and pushes are rejected, create `build/overnight`, push that, and note it in `PROGRESS.md`.
- **Commit message format:** Conventional Commits, imperative mood. Examples: `feat(bills): add bill detail page with stage timeline`, `fix(ingest): handle bills with no sponsor`, `chore: record LEGISinfo fixtures`.
- **No attribution trailers of any kind.** Commit messages must NOT contain `Co-Authored-By`, `Co-authored-by`, `Generated with Claude Code`, `Claude-Session:`, any Claude or Anthropic email address, or any similar watermark. The message is the subject line plus an optional plain body, nothing else.
- **Enforce that with a hook (do this in Phase 0, first commit):**
  - Create `.githooks/commit-msg` that deletes any line matching (case-insensitive) `^co-authored-by:`, `^claude-session:`, `generated with \[?claude`, or containing `noreply@anthropic.com`, then strips trailing blank lines. Make it executable.
  - Run `git config core.hooksPath .githooks` (repo-local config only).
  - After every commit, run `git log -1 --format=%B` and confirm no trailer slipped through. If one did and the commit is not pushed yet, fix it with `git commit --amend` before pushing.
- **Never** change `git config user.name` or `user.email`. Commits must be authored by the owner's existing git identity.
- **Never** force push, rewrite pushed history, or delete branches.
- **Never** commit secrets. `.env*` (except `.env.example`) goes in `.gitignore` before the first commit that could contain one.

---

## 3. Design tooling: Impeccable and 21st.dev Magic

The owner wants this to look genuinely beautiful, not like a generic AI-made dashboard. Two tools are installed for that. Use both.

### Impeccable (design skill by pbakaus)
- At the start of Phase 2, locate the installed Impeccable skill and read its `SKILL.md` (and any reference files it points to) to learn its current commands. Command names have changed between versions, so do not guess them; use what the installed version documents.
- Run its one-time setup/context step to establish the project's design context (it may write a file like `.impeccable.md` or `DESIGN.md`). Feed it the design direction from section 9.
- After each UI phase (3, 4, 5) and again in Phase 6, run its critique/audit and polish passes on every page touched. Fix what it flags. Log notable design decisions in `DECISIONS.md`.

### 21st.dev Magic MCP
- Use Magic's component inspiration and builder tools for the high-visibility components: the home hero, global search / command palette, bill cards, stage timeline, vote result display, MP cards, data tables and filters, empty states.
- Treat Magic output as a starting point. Adapt every component to Tabled's design tokens, typography and spacing so the whole product feels like one system. Never paste in a component whose style clashes with the rest.
- Use Magic's refiner on components that look off after integration.

### If a tool is unavailable
If Impeccable or Magic is not available in this session, log it under "Blocked" in `PROGRESS.md`, apply the same design principles manually (section 9), and continue. Do not stop.

---

## 4. Tech stack (decided, do not relitigate)

- **Package manager:** pnpm (fall back to npm if pnpm is not installed; log it).
- **Framework:** Next.js, latest stable, App Router, TypeScript in `strict` mode.
- **Styling:** Tailwind CSS (latest stable), shadcn/ui on Radix primitives, lucide-react icons. Motion (framer-motion) only for small, purposeful transitions.
- **Data store:** SQLite via `better-sqlite3` with Drizzle ORM. DB file at `data/tabled.db`, which is gitignored.
- **Ingestion:** TypeScript scripts in `scripts/ingest/`, run with `tsx`. Exposed as `pnpm ingest` (full) and `pnpm ingest:recent` (last 30 days).
- **Charts:** hand-built SVG for the hemicycle/seat chart and party breakdown bars; a small library (Recharts or visx) only if something genuinely needs it.
- **Testing:** Vitest for unit tests, Playwright for end-to-end, `@axe-core/playwright` for accessibility checks.
- **Linting/format:** ESLint + Prettier.
- **Rendering:** pages are statically generated or ISR from the SQLite DB. `pnpm build` must run ingestion automatically if `data/tabled.db` does not exist.

Scripts that must exist and work: `dev`, `build`, `start`, `ingest`, `ingest:recent`, `summarize`, `typecheck`, `lint`, `test`, `test:e2e`, `screenshots`.

---

## 5. Data sources (verify each live in Phase 0)

All are public and key-less. Send a descriptive User-Agent on every request, for example `Tabled/0.1 (civic project; contact via GitHub repo)`, because openparliament.ca asks automated clients to identify themselves. Use a request cache on disk (`data/cache/`, gitignored), a concurrency limit of 2 to 4, and exponential backoff on 429/5xx. Be a polite client.

1. **openparliament.ca API** (`https://api.openparliament.ca/`). JSON. Mirrors the site's URL structure: `/bills/`, `/votes/`, `/politicians/`, `/debates/`. Resources link to each other by URL; use those URLs as stable keys. Supports filters and pagination. Request JSON explicitly (Accept header or `?format=json`). Primary source for MPs, votes and per-MP ballots. Add a visible attribution link to openparliament.ca in the footer and About page.
2. **LEGISinfo** (`https://www.parl.ca/legisinfo/`). Official bill tracker. Offers JSON and XML exports for the bill list, per-session views and individual bills. Primary source for bill status, stages and dates, sponsor, and links to bill text and Library of Parliament legislative summaries. Find the exact export URLs by inspecting the live site.
3. **House of Commons open data** (`https://www.ourcommons.ca/`). XML feeds for members, votes and individual ballots. Use as a cross-check and fallback for votes and members.
4. **Represent API by Open North** (`https://represent.opennorth.ca/`). Postal code to federal electoral district and representative. Used for "Find your MP". Call it from a server route with caching; never expose a client-side loop that could hammer it.

**Scope:** the current Parliament and session. Detect the current session dynamically from the data (do not hardcode). The previous session is a stretch item.

**Phase 0 recon deliverable:** for each source, fetch real sample responses (a bills list page, one government bill, one private member's bill, one Senate bill, a votes list, one vote with ballots, an MP list, one MP, one postal code lookup) and save them to `tests/fixtures/`. Write `docs/DATA_SOURCES.md` documenting the exact URLs, fields used, pagination, quirks and rate behaviour you observed.

---

## 6. Data model (adjust to match real data; log changes)

- `sessions`: id (e.g. `45-1`), parliament number, session number, start/end dates, is_current.
- `parties`: id, name (en/fr), short name, color token.
- `ridings`: id, name (en/fr), province.
- `members`: id, openparliament URL, name, party, riding, province, photo URL (only if licensing allows; else null), active flag, start/end of membership.
- `bills`: id (`session/number`, e.g. `45-1/C-5`), number, title (en/fr), short title, chamber of origin, type (government / private member / Senate public / Senate private), sponsor member, introduced date, current stage, status text, is_law, royal assent date, LEGISinfo URL, full text URL, legislative summary URL, last_updated.
- `bill_stages`: bill id, chamber, stage name, date, ordinal. Used for the timeline.
- `votes`: id (`session/number`), date, description (en/fr), related bill id (nullable), result (passed/failed/tied), yeas, nays, paired, source URL.
- `ballots`: vote id, member id, ballot (yea / nay / paired / didn't vote), member's party at time of vote.
- `vote_party_stats` (derived): vote id, party id, yeas, nays, party majority position, dissent count.
- `summaries`: bill id, source hash, model, generated_at, JSON payload, source basis.

Derived metrics (compute in ingestion, unit-test thoroughly):
- **Party-line rate per MP:** share of recorded votes where the MP voted with their party's majority. Exclude paired votes and absences. Flag votes where a party split (no unanimous position) so they can be identified as possible free votes.
- **Dissent flags:** per ballot, whether it broke with the MP's party majority.
- **Attendance:** recorded ballots cast divided by recorded votes held while the MP was sitting. Label it clearly as "votes cast" and explain in methodology that missing a recorded vote has many legitimate causes.

---

## 7. Plain-English summaries (AI layer)

Summaries are the heart of the product. They must be accurate, neutral and grounded.

- **Key:** read `ANTHROPIC_API_KEY` and `SUMMARY_MODEL` (default `claude-haiku-5-5`) from `.env`. If the key is absent, skip generation, show a tasteful "Plain-English summary coming soon" state, log it in `PROGRESS.md`, and continue. The whole site must work without summaries.
- **Grounding priority:** (1) Library of Parliament legislative summary if linked, (2) full bill text, (3) LEGISinfo descriptive fields. If only the title is available, do NOT generate a summary.
- **Long bills:** chunk large bills (budget implementation and omnibus acts) by part/division, summarize each, then synthesize. Cap per-bill token spend; if capped, say what the summary covers.
- **Output:** strict JSON validated with Zod:
  - `tldr`: one sentence, at most 30 words.
  - `what_it_does`: 3 to 6 bullets, each one concrete change.
  - `who_it_affects`: short list of groups.
  - `background`: optional, at most 2 sentences, only facts from the source.
  - `source_basis`: `legislative_summary` | `full_text` | `legisinfo`.
- **Writing rules:** grade 8 reading level, plain words, define any unavoidable jargon. Describe what the bill does; never evaluate it. Attribute claims ("The government says..."). No speculation about motives or outcomes. No loaded adjectives (ban list in the validator: controversial, landmark, sweeping, radical, historic, common-sense, dangerous, extreme, and similar). No em dashes.
- **Validation:** reject and retry (max 2) any output that fails the schema, exceeds limits, or hits the ban list.
- **Caching:** store each summary as `data/summaries/<session>/<bill>.json` keyed by a hash of the source text. These files ARE committed (they cost money to regenerate). Only regenerate when the source hash changes.
- **Disclosure:** every summary is labelled "AI-generated summary of the official text", with a link to the source document and a "Report an error" link (GitHub issue URL).
- **Static explainers** (written by you, not generated at runtime): what each legislative stage means (first reading, second reading, committee, report stage, third reading, Senate stages, royal assent), and how private members' bills differ from government bills.

---

## 8. Pages and features (MVP)

Every page: responsive from 360px up, light and dark mode, fast, accessible, with real loading, empty and error states.

1. **Home `/`**
   - Clear one-line explanation of what Tabled is.
   - "This week in Parliament": bills that moved stages in the last 7 days, recent recorded votes with results.
   - Recently introduced bills.
   - Prominent search and a "Find your MP" postal code box.
2. **Bills `/bills`**
   - Search by number, title or keyword.
   - Filters: status/stage, chamber of origin, bill type, sponsor's party, became law yes/no. Sort by last activity (default), introduced date, number.
   - Filters reflected in the URL so views are shareable.
   - Bill cards: number, short title, plain-English tldr (if available), current stage as a compact progress indicator, sponsor, last activity date.
3. **Bill detail `/bills/[session]/[number]`**
   - Title, number, type, sponsor (linked).
   - Plain-English summary block (section 7).
   - Stage timeline across both chambers with dates; current stage highlighted; each stage has a tooltip/explainer.
   - All recorded votes on this bill, each with result and party breakdown.
   - Links: full text, LEGISinfo, legislative summary.
   - "Last updated" timestamp and data source credit.
4. **Votes `/votes`** and **vote detail `/votes/[session]/[number]`**
   - List with date, description, linked bill, result, yeas/nays.
   - Detail: result, hemicycle seat chart coloured by ballot, party-by-party breakdown, full sortable/filterable MP ballot table, dissenters highlighted.
5. **MPs `/mps`** and **MP detail `/mps/[slug]`**
   - Directory with search, filter by party and province.
   - Detail: name, party, riding, province, photo or initials avatar, party-line rate, votes cast, bills sponsored, recent votes with dissents highlighted.
6. **Find your MP `/find`**
   - Postal code input with validation (Canadian format), result links to the MP page. Handle postal codes that span multiple ridings by listing the options.
7. **Parties `/parties`**
   - Per party: seat count, cohesion (average party-line rate), bills sponsored.
8. **About & methodology `/about`**
   - Data sources with links and credit, update cadence, how every metric is computed, AI disclosure, nonpartisan commitment, how to report errors, open-source link.
9. **Global**
   - Command palette search (Cmd/Ctrl+K) across bills, MPs and votes.
   - Header nav, footer with sources and attribution.
   - SEO: per-page metadata, Open Graph images (generated with Next's OG image support) for bills, votes and MPs, `sitemap.xml`, `robots.txt`.
   - Custom 404 and error pages that match the design.

**Neutrality is a product requirement.** No editorial framing anywhere. Party colours appear only in data visualisations and small party tags, never as page themes. Order parties consistently (by seat count) everywhere.

---

## 9. Design direction

Think: a serious, well-designed newspaper crossed with a premium data product. Trustworthy, calm, editorial, quietly confident. It should feel like something a journalist would link to and a student would actually enjoy using. It must NOT look like a generic SaaS dashboard or a template.

- **Typography-led.** A characterful serif for display headings paired with a clean, highly legible sans for UI and body. Strong typographic hierarchy, generous line height, comfortable measure (about 60 to 75 characters for prose). Tabular numerals for all figures.
- **Colour.** Restrained neutral base (warm paper tones in light mode, deep ink in dark mode), one confident accent colour. Define colours as tokens (OKLCH where supported). Party colours used only for data. All text meets WCAG AA contrast in both themes.
- **Layout.** Clear grid, generous whitespace, content first. Cards used sparingly and only where they aid scanning.
- **Data visualisation.** The hemicycle, stage timeline and party breakdowns are the visual signatures of the product. Make them precise, legible and genuinely beautiful. Every chart has a text alternative.
- **Motion.** Subtle and fast (150 to 250ms), used for state changes and orientation only. Respect `prefers-reduced-motion`.
- **Copy.** Plain, direct, friendly but not cute. Sentence case. No em dashes anywhere in UI copy, summaries or docs.
- **Details that matter:** focus states, hover states, skeleton loaders that match final layout, empty states with a helpful next action, consistent icon sizing, no layout shift.

---

## 10. Quality bar

- `pnpm typecheck` and `pnpm test` (unit) pass before every commit.
- `pnpm lint`, `pnpm build` and `pnpm test:e2e` pass at the end of every phase. Do not move to the next phase with a red build.
- **Unit tests (Vitest, using recorded fixtures):** every parser/normaliser, stage ordering, party-line and dissent calculations, attendance, summary validator (schema, length, ban list), postal code validation.
- **E2E (Playwright):** each route renders with real data; search returns results; filters update the URL; bill detail shows timeline; vote detail shows hemicycle and ballot table; find-your-MP works with a fixture-backed mock of Represent.
- **Accessibility:** axe checks on every route in both themes with zero serious or critical violations. Full keyboard navigation. Semantic landmarks and headings.
- **Performance:** Lighthouse-quality targets of 90+ on performance, accessibility, best practices and SEO for home, bill detail and MP detail. Optimise images and fonts (self-host fonts via `next/font`).
- **Screenshots:** `pnpm screenshots` uses Playwright to capture every main route at 1440px and 390px in light and dark mode into `docs/screenshots/`. Run it at the end of Phase 6 and again at the end of the night, and commit the images.

---

## 11. Phase plan (commit at every checkpoint marked [C])

### Phase 0: Setup and recon
1. Read this brief fully. Create `PROGRESS.md` and `DECISIONS.md`. [C]
2. Set up `.gitignore`, `.githooks/commit-msg`, `core.hooksPath`, `.env.example`. Verify the hook by making a test commit message containing a co-author line and confirming it is stripped. [C]
3. Check the environment: Node version, pnpm, git remote and push access, whether Impeccable and Magic are available. Log results.
4. Fetch and inspect every data source, record fixtures, write `docs/DATA_SOURCES.md`. [C]
5. Scaffold Next.js + TypeScript + Tailwind + shadcn/ui + ESLint/Prettier + Vitest + Playwright. Confirm `pnpm build` passes on the empty app. [C]

### Phase 1: Data layer
1. Drizzle schema and migrations. [C]
2. Ingestion: sessions, parties, ridings, members. Tests. [C]
3. Ingestion: bills and bill stages. Tests. [C]
4. Ingestion: votes and ballots, derived party stats, party-line rate, dissent, attendance. Tests. [C]
5. Run a full `pnpm ingest` against live data. Record counts and timings in `PROGRESS.md`. Sanity-check numbers against the live sites (e.g. seat counts per party, a known vote's yea/nay totals). [C]

### Phase 2: Design system
1. Run Impeccable's setup/context step with the section 9 direction. [C]
2. Design tokens, fonts, light/dark themes, base layout, header, footer, command palette shell. Use Magic for inspiration on the shell and search. [C]
3. Core components: party tag, stage progress indicator, bill card, MP card, stat block, data table, empty/error/skeleton states. [C]
4. Impeccable critique and polish pass on the system. [C]

### Phase 3: Bills
1. Bills index with search, filters, URL state. [C]
2. Bill detail with stage timeline and explainers. [C]
3. Home page. [C]
4. Impeccable critique/polish on these pages, plus axe checks. [C]

### Phase 4: Votes, MPs, parties, Find your MP
1. Votes index and vote detail with hemicycle and ballot table. [C]
2. MPs directory and MP detail. [C]
3. Find your MP via Represent server route. [C]
4. Parties page. [C]
5. Impeccable critique/polish, axe checks. [C]

### Phase 5: Summaries
1. Summarizer with grounding, chunking, Zod validation, ban list, caching. Tests. [C]
2. If the API key exists: generate summaries for all bills in the current session that have a valid source, prioritising government bills and bills that moved recently. Commit the cache in batches. [C per batch]
3. Wire summaries and disclosure into bill cards and detail pages. [C]

### Phase 6: Polish and hardening
1. Impeccable audit and polish across every page. [C]
2. Performance, SEO, OG images, sitemap, 404/error pages. [C]
3. Full test suite, axe, screenshots. [C]

### Phase 7: Docs and ops
1. `README.md`: what Tabled is, screenshots, local setup, scripts, data sources and credit, architecture overview, deploy guide for Vercel. [C]
2. `.github/workflows/ci.yml`: typecheck, lint, unit, build on push and PR. [C]
3. `.github/workflows/refresh.yml`: daily scheduled `pnpm ingest:recent` + `pnpm summarize` (using repo secrets), commit updated summary cache, trigger a deploy hook if `VERCEL_DEPLOY_HOOK` secret exists. [C]
4. `LICENSE` (MIT) and `CONTRIBUTING.md`. [C]

---

## 12. Working files to maintain

- `PROGRESS.md`: phase, done, next, blocked, data counts, anything the owner should know.
- `DECISIONS.md`: every judgment call, one line each.
- `docs/DATA_SOURCES.md`: endpoint reference from recon.
- `MORNING.md` (write at the very end): a short report for the owner. What was built, what works, what does not, what was blocked and why, exact commands to run it locally, what needs the owner's input (accounts, keys, deploy), and the top 5 suggested next steps. Link to the screenshots.

---

## 13. Definition of Done (MVP) and Stretch Backlog

**MVP is done when:** every page in section 8 works with live ingested data; all quality gates in section 10 pass; screenshots are committed; docs from Phase 7 exist; every commit is pushed with clean messages.

**Then continue with the Stretch Backlog, in this order:**
1. French language support (i18n routing, French titles and descriptions from the source data, translated UI strings; summaries in French only if generated from French source text).
2. "This week in Parliament" page: an auto-generated weekly digest of stage changes and votes, with an RSS feed.
3. Per-bill and per-MP RSS feeds so people can follow what they care about.
4. Topic tags for bills (generated from summaries, validated against a fixed taxonomy) and topic filter on `/bills`.
5. Compare two MPs: how often they voted the same way.
6. Previous session data with a session switcher.
7. Relevant Hansard debate excerpts on bill pages via openparliament.ca debates, clearly attributed.
8. Embeddable vote result card (iframe-friendly route) for journalists and bloggers.
9. Further Impeccable polish passes on the most-visited pages.

---

## 14. If things go wrong

- **An endpoint is down or rate-limits you:** use the disk cache and fixtures, back off, move on, retry later in the night.
- **A data shape is weird:** normalise defensively, add a test with the weird case as a fixture, log it.
- **The build breaks and you cannot fix it in a reasonable time:** revert your last change with a new commit (never rewrite history), log it, try a different approach.
- **A design tool misbehaves:** fall back to manual application of section 9.
- **You are unsure whether something is good enough:** it is not. Run the Impeccable critique on it and improve it.

Begin with Phase 0, step 1.
