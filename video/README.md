# Tabled launch film

A 60 second product film for Tabled (1920x1080, 60 fps, H.264 + AAC), written entirely as code: one canvas, one
`draw(t)` function, and a soundtrack synthesized from sine waves and noise. No screen recordings, no stock footage,
no downloaded audio.

Every number and name on screen comes from this repo: `tests/fixtures/` (real recorded API responses),
`data/summaries/` (the committed AI summary, shown under the site's own label) and the site's own UI strings. The
data is rebuilt by `scripts/prep-data.py` into `data/film.json`, so each figure can be traced back to its file.

The film uses the dark theme: every colour is a `-dark` token from `DESIGN.md`, converted from oklch to sRGB by the
prep script.

## The idea

The House of Commons, drawn as the site's own seat chart (a port of `src/lib/hemicycle.ts`), never leaves the
screen. Each shot is made from the one before it. The chamber answers a postal code, turns into a recorded vote,
lets two MPs lift out, becomes one MP's initials avatar, collapses into the single point on a bill's timeline where
that bill was defeated, reappears as ten tally bars that bend back into the chamber's ten rows, and finally
condenses into Tabled's logo, which is the same chamber in monochrome.

The real story is recorded vote 177: the second reading of Bill C-218 (medical assistance in dying) on
October 7, 2026. It failed 141 to 187, and two Liberal MPs broke with their party.

## Storyboard (120 BPM: one beat is 0.5 s, one bar 2 s)

| Time | Shot | Made from |
| --- | --- | --- |
| 0.0 to 2.0 | The House fills seat by seat in party colours: Liberal 173, Conservative 137, Bloc 21, NDP 5, Green 1, 6 vacant. Soft impact, rising ticks. | A slow pull back over warm near-black. |
| 2.0 to 4.5 | Home page: the chamber slides right; "What Parliament is doing, in plain English." | The site header and legend arrive with it. |
| 4.5 to 9.75 | Find your MP: the home page's postal field grows into the Find page field, types `K0A 1L0` (one key per eighth note) and presses Find. Every seat dims except one: Carleton, Bruce Fanjoy, Liberal. A hairline ties the answer to the seat. | The postal field from the hero; the answer is a seat. |
| 10.25 to 19.0 | Vote 177: the chamber moves into the vote page, and a wave re-seats it into the 337-seat vote layout and recolours it by ballot. The title enters, the tally counts to 141 yea to 187 nay, and "Failed" lands on the downbeat at 15.0. | The same seats with a new meaning; Fanjoy's seat stays ringed (nay). |
| 19.0 to 27.0 | Broke with their party: everything dims except two Liberal seats, which lift out and draw hairlines to Kent MacDonald and Marilyn Gladu. Then the party table, with 141, 187 and 9 under the double rule at 24.5. | The seats point at their rows. |
| 27.0 to 32.25 | One MP: Marilyn Gladu's seat flies up and becomes her initials avatar. Her voting record shows two rows, and the C-218 row is highlighted "Against party". | A seat becomes an avatar. |
| 32.9 to 44.5 | The bill: the C-218 page builds, and the whole chamber collapses into the ✕ at Second reading on the stage timeline ("Defeated Oct 7", 34.6). The page flips to French and back (37.0 to 39.25), scrolls, and shows the plain-English summary with "AI-generated summary of the official text." | The vote becomes one node on the timeline. |
| 45.0 to 52.0 | Every vote: the session's ten latest recorded divisions with their real tally bars. The camera pulls back, and the bars stack, bend into the chamber's ten arcs and break into seats. | Bars become arcs; arcs become seats. |
| 52.0 to 60.0 | Ending: the full chamber returns in party colours, drains to monochrome and condenses into the 41-seat logo mark. "Tabled", a rule and "Canada" resolve with the line "Every bill, every vote, every MP. In plain English." and the data credit. The frame holds still from 57.0. | The logo is the chamber. |

The end card reads "Tabled | Canada" rather than a URL, so the same lockup can later carry another country.

## Data used

| On screen | Source |
| --- | --- |
| Seat counts by party | `tests/fixtures/ourcommons/members.xml` (337 members); 343 seats as on the home page |
| Vote 177 totals, every ballot, dissenters | `tests/fixtures/openparliament/vote-177.json`, `ballots-177.json`, `politicians-list.json` (totals asserted against the record) |
| Marilyn Gladu's record | `ballots-177.json`, `ballots-178.json`, `vote-178.json` |
| K0A 1L0 to Carleton, Bruce Fanjoy | `tests/fixtures/represent/postcode-K0A1L0.json` |
| C-218 title (EN/FR), sponsor, first reading date, status | `tests/fixtures/legisinfo/bill-C-218.json`, `tests/fixtures/openparliament/bill-C-218.json` |
| Plain-English summary, model, date | `data/summaries/45-1/C-218.json` |
| Ten recorded votes in the ledger, "178 recorded votes" | `tests/fixtures/openparliament/votes-list.json` |
| UI copy (English and French) | `src/i18n/messages.ts`, `src/lib/stages.ts`, `src/i18n/stages-fr.ts`, `src/views/bill.tsx` (copied in `src/strings.js`) |

No MP photos (initials avatars only), and no Parliament or Government of Canada marks.

## Layout

```
scripts/prep-data.py   reads the repo's real files and writes data/film.json
src/cues.js            the clock: every cue time on the 120 BPM grid
src/film.js            draw(ctx, F, t): background, pages, chamber, header
src/chamber.js         the seats: arrival, re-seating wave, dims, lifts, avatar, collapse, bend, logo
src/pages.js           the real pages rebuilt from DESIGN.md: header, home, Find, vote, MP, bill, ledger, end card
src/lib/               closed-form springs and easing, text and small caps, colour mixing, the hemicycle port
index.html             one canvas; renderFrame(f, subframes) averages subframes for motion blur
render/stills.mjs      stills, contact sheets and motion strips for review
render/render.mjs      the full render: resumable half-second chunks, parallel headless Chromium, ffmpeg
render/cues.mjs        exports the cue sheet to data/cues.json for the score
audio/score.py         the synthesized soundtrack, with a per-second loudness printout
```

Motion rules: every frame is a pure function of `t` (no timers, no state between frames); values that change target
several times sum one spring per change; springs use damping 0.8 (about 1.5% overshoot); content enters after its
container starts moving and leaves before the next move, with a short blur.

## Reproduce

Needs Node 22, Python 3 with numpy, ffmpeg, and Playwright's Chromium (preinstalled in the cloud dev container;
`require("playwright")` must resolve).

```bash
cd video
npm install                                  # the two fonts, from @fontsource
python3 scripts/prep-data.py                 # data/film.json from the repo's fixtures and summaries
node render/cues.mjs                         # data/cues.json for the score
python3 audio/score.py                       # out/audio.wav and a per-second loudness table
node render/stills.mjs out/review 0:60:2 --sheet sheet.png --cols 6 --scale 0.25   # contact sheet
node render/render.mjs --workers 4 --sub 4   # out/tabled-film-master.mp4, out/tabled-film.mp4, poster
```

The full render takes about 15 minutes on 4 cores (2D canvas in software, 4 subframes per frame). If it stops,
run the same command again: finished chunks in `out/chunks/` are kept. `out/tabled-film.mp4` is the post-ready copy
(CRF 19, faststart). `out/` is not committed; `poster.png` is.
