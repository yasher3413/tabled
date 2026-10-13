---
name: Tabled
description: Parliament of Canada in plain English, set as a division list.
colors:
  paper: "oklch(0.976 0.011 84)"
  paper-sunk: "oklch(0.951 0.014 82)"
  paper-raised: "oklch(0.992 0.006 84)"
  ink: "oklch(0.215 0.014 62)"
  ink-2: "oklch(0.4 0.014 62)"
  ink-3: "oklch(0.49 0.014 62)"
  rule: "oklch(0.86 0.014 78)"
  rule-strong: "oklch(0.3 0.014 62)"
  commons-green: "oklch(0.43 0.085 166)"
  commons-wash: "oklch(0.935 0.028 166)"
  danger-ink: "oklch(0.47 0.13 32)"
  ballot-yea: "oklch(0.3 0.014 62)"
  ballot-nay: "oklch(0.67 0.05 62)"
  ballot-paired: "oklch(0.72 0.012 70)"
  ballot-absent: "oklch(0.86 0.014 78)"
  party-liberal: "oklch(0.56 0.18 25)"
  party-conservative: "oklch(0.47 0.12 255)"
  party-bloc: "oklch(0.68 0.1 228)"
  party-ndp: "oklch(0.7 0.15 58)"
  party-green: "oklch(0.6 0.14 140)"
  party-independent: "oklch(0.62 0.01 75)"
  party-other: "oklch(0.58 0.06 305)"
  paper-dark: "oklch(0.19 0.009 62)"
  paper-sunk-dark: "oklch(0.162 0.008 62)"
  paper-raised-dark: "oklch(0.228 0.01 62)"
  ink-dark: "oklch(0.935 0.01 84)"
  ink-2-dark: "oklch(0.8 0.01 84)"
  ink-3-dark: "oklch(0.71 0.012 84)"
  rule-dark: "oklch(0.34 0.012 62)"
  rule-strong-dark: "oklch(0.86 0.01 84)"
  commons-green-dark: "oklch(0.78 0.095 166)"
  commons-wash-dark: "oklch(0.27 0.04 166)"
  danger-ink-dark: "oklch(0.75 0.12 32)"
  ballot-yea-dark: "oklch(0.9 0.01 84)"
  ballot-nay-dark: "oklch(0.6 0.045 66)"
  ballot-paired-dark: "oklch(0.55 0.012 62)"
  ballot-absent-dark: "oklch(0.38 0.012 62)"
  party-liberal-dark: "oklch(0.66 0.17 25)"
  party-conservative-dark: "oklch(0.64 0.12 255)"
  party-bloc-dark: "oklch(0.76 0.09 228)"
  party-ndp-dark: "oklch(0.76 0.14 58)"
  party-green-dark: "oklch(0.7 0.13 140)"
  party-independent-dark: "oklch(0.68 0.01 75)"
  party-other-dark: "oklch(0.7 0.06 305)"
typography:
  display:
    fontFamily: "Brygada 1918, ui-serif, Georgia, serif"
    fontSize: "clamp(2.75rem, 6vw, 4rem)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Brygada 1918, ui-serif, Georgia, serif"
    fontSize: "clamp(2.5rem, 5vw, 3.25rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  section:
    fontFamily: "Brygada 1918, ui-serif, Georgia, serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  lede-serif:
    fontFamily: "Brygada 1918, ui-serif, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 500
    lineHeight: 1.375
  figure:
    fontFamily: "Brygada 1918, ui-serif, Georgia, serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1
    fontFeature: "\"tnum\", \"lnum\""
  title:
    fontFamily: "Libre Franklin, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 500
    lineHeight: 1.375
  body:
    fontFamily: "Libre Franklin, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
    fontFeature: "\"tnum\", \"lnum\", \"kern\""
  body-compact:
    fontFamily: "Libre Franklin, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  meta:
    fontFamily: "Libre Franklin, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.4
  zone-label:
    fontFamily: "Libre Franklin, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.4
  column-head:
    fontFamily: "Libre Franklin, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.33
  member-name:
    fontFamily: "Libre Franklin, ui-sans-serif, system-ui, sans-serif"
    fontSize: "inherit"
    fontWeight: 400
    letterSpacing: "0.02em"
    fontFeature: "\"smcp\""
rounded:
  mark: "1px"
  sm: "0.1125rem"
  md: "0.15rem"
  lg: "0.1875rem"
  full: "9999px"
spacing:
  hairline: "1px"
  row-tight: "0.5rem"
  row: "0.875rem"
  row-loose: "1.25rem"
  gutter-mobile: "1rem"
  gutter: "1.5rem"
  section: "3.5rem"
  section-loose: "4rem"
  container: "76rem"
  measure: "66ch"
components:
  party-swatch:
    backgroundColor: "{colors.party-liberal}"
    rounded: "{rounded.mark}"
    size: "0.625rem"
  tally-bar-yea:
    backgroundColor: "{colors.ballot-yea}"
    rounded: "{rounded.mark}"
    height: "0.5rem"
  tally-bar-nay:
    backgroundColor: "{colors.ballot-nay}"
    rounded: "{rounded.mark}"
    height: "0.5rem"
  filter-field:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    typography: "{typography.body-compact}"
    rounded: "{rounded.sm}"
    height: "2.5rem"
    padding: "0 2rem 0 0.75rem"
  search-button:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink-3}"
    rounded: "{rounded.sm}"
    height: "2.25rem"
    padding: "0 0.5rem 0 0.75rem"
  submit-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    padding: "0 1rem"
    height: "3rem"
  submit-ink-hover:
    backgroundColor: "{colors.commons-green}"
    textColor: "{colors.paper}"
  segment-toggle-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "2px"
    padding: "0.25rem 0.625rem"
  nav-link:
    textColor: "{colors.ink-2}"
    typography: "{typography.body-compact}"
    height: "2.25rem"
    padding: "0 0.625rem"
  nav-link-active:
    textColor: "{colors.ink}"
  member-avatar:
    backgroundColor: "{colors.paper-sunk}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.full}"
    size: "2.5rem"
  audience-chip:
    textColor: "{colors.ink-2}"
    typography: "{typography.meta}"
    rounded: "{rounded.sm}"
    padding: "0.25rem 0.5rem"
  palette-row-selected:
    backgroundColor: "{colors.commons-wash}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0.625rem 0.75rem"
---

# Design System: Tabled

## Overview

**Creative North Star: "The Division List"**

Tabled sets Parliament's own record, the printed division list from the Journals of the House, as a readable page. Every object is a record with a count: names in ruled columns, figures in tabular numerals, and totals set large at the foot of the column under a double rule. The page is warm paper with deep ink in light mode and a warm near-black ground with paper-coloured ink in dark mode. Depth comes from rules, never from cards or shadows.

Density is true density. Tables and lists run on a strict hairline system with no whitespace inflation; the generosity is spent on the reading column (66ch) and on the large serif figures that answer the reader's question first. One accent, House of Commons green, carries links, focus, the current-stage flag and the active nav rule. Colour otherwise lives only in data marks: party swatches, hemicycle seats and the neutral ink and sepia ballot marks.

The system refuses the SaaS dashboard: no cards, no KPI tiles, no gradient charts, no tinted panels per party.

**Key Characteristics:**
- Warm paper and ink, light and dark, both tuned around hue 62 to 84.
- Hairline rules for every division; a strong rule closes page headers; a double rule sits above every total.
- Brygada 1918 for titles, figures and totals; Libre Franklin for everything read or operated; tabular lining figures everywhere.
- Member names set in small caps, as a division list sets them.
- State drawn by form (fill, ring, dash, strike, flag), so every chart reads without colour.

## Colors

A near-achromatic warm paper palette with one deep inky green accent and a data-only band of party colours.

### Primary
- **Commons Green** (commons-green; commons-green-dark in dark mode): links (`.link` underline at 35% then full on hover), the 2px focus outline, caret, the active nav underline, the folded flag on the current stage, "Now here" text and the hover fill of the ink submit button. Nothing else is green.
- **Commons Wash** (commons-wash): text selection and the selected row in the command palette. Never a panel background.

### Neutral
- **Paper** (paper / paper-dark): the page ground and header.
- **Sunk Paper** (paper-sunk): avatar discs, the empty track behind tally bars, hovered table rows.
- **Raised Paper** (paper-raised): form fields, the search button, popovers and the command palette.
- **Ink** (ink): headings, figures, primary text, completed stage marks, the active segment of a toggle.
- **Ink 2** (ink-2): ledes, summaries, secondary text.
- **Ink 3** (ink-3): metadata, column heads, dates, placeholder text. Tuned to hold AA on paper.
- **Rule** (rule): every hairline: row dividers, section-heading underlines, field borders.
- **Strong Rule** (rule-strong): the closing rule under page headers and the home hero, the footer top rule, the double rule above totals, and the head rule of the full ballot table.
- **Danger Ink** (danger-ink): defeated stages and failure messages only.

### Tertiary: ballot marks
- **Yea** (ballot-yea), **Nay** (ballot-nay), **Paired** (ballot-paired), **Did not vote** (ballot-absent): a deep ink, a warm sepia, a pale grey with hatching, and a hollow ring. They are told apart by lightness and shape. In dark mode yea flips to light paper ink.

### Data only: party colours
- **Liberal, Conservative, Bloc, NDP, Green, Independent, Other** (party-*): used only as 10px square swatches beside a party name, as round legend dots, and as hemicycle seats. Each has a dark-mode lift.

### Named Rules
**The Data Mark Rule.** Party colour appears only in marks no larger than a swatch or a seat. Text, backgrounds, borders and page themes never take a party hue.

**The Neutral Ballot Rule.** Yea and nay are ink and sepia, never green and red. Neither side of a division gets a positive colour.

**The One Accent Rule.** Commons Green is the only chromatic UI colour; if it is not a link, focus, selection or the current-stage flag, it is not green.

## Typography

**Display Font:** Brygada 1918 (with ui-serif, Georgia)
**Body Font:** Libre Franklin (with ui-sans-serif, system-ui)

**Character:** A sturdy early-twentieth-century book serif for titles and counts against a plain American gothic for reading and operating. The serif carries authority and the numbers; the sans carries the work.

### Hierarchy
- **Display** (600, 2.75rem to 4rem, 1.02, -0.025em): the home definition line and the bill number plus short title.
- **Headline** (600, 2.5rem to 3.25rem, 1.05, -0.02em): page headers, MP names, vote descriptions (2rem to 2.75rem). The vote result word ("Passed", "Failed") sets at 3.5rem.
- **Section** (600, 1.375rem, -0.01em): each zone's literal label ("What it does", "Who voted which way"), always over a hairline.
- **Lede serif** (500, 1.375rem to 1.5rem): the plain-English one-line summary, within the 66ch measure.
- **Figure** (600, 1.625rem to 1.75rem, leading 1): ledger figures and table-foot totals. Bill numbers in lists set at 1.0625rem to 1.25rem in the same face.
- **Title** (500, 1.0625rem): row titles in bill lists.
- **Body** (400, 1rem / 0.9375rem, relaxed): summaries, prose, table cells.
- **Meta** (400, 0.8125rem): dates, vote numbers, sponsor lines, stage labels.
- **Zone label** (600, 0.8125rem, ink): sub-zone labels such as "Bills that moved" or "Official summary from Parliament". Sentence case, never uppercase, never tracked.
- **Column head** (500, 0.75rem, ink-3): table heads and filter labels.

### Named Rules
**The Tabular Rule.** Body sets tabular lining figures globally; every count lines up in its column.

**The Small Caps Name Rule.** Every member name in running UI (lists, ballot tables, sponsors, dissent lists) uses small caps with capitals at full height (0.02em tracking). Page-title names stay in the display face.

**The Sentence Case Rule.** All labels, headings and buttons are sentence case. No uppercase kickers or eyebrows. The only uppercase is postal-code input, which formats the data.

## Layout

A single centred container (max 76rem, 1rem gutters, 1.5rem from 640px). The header is a 3.75rem bar ruled at the foot. Pages open with a header block (2.5rem to 3.5rem top) closed by a strong rule, then stack zones 3.5rem to 4rem apart, each introduced by a section heading on a hairline.

Lists are ruled rows, not cards: bill rows on a 5.5rem / fluid / auto grid, vote rows on 6.5rem / fluid / 17rem, home ledger rows on 4.5rem / fluid / auto, each with 0.875rem to 1.25rem vertical padding and a hairline below. Tables use 0.5rem cell padding. Two-column zones (summary and side facts, hemicycle and breakdown, this week's bills and votes) collapse to one column below 1024px. Prose holds a 66ch measure. The footer sits 6rem below content under a strong rule.

The site works from 360px: grids collapse to stacked rows, the stage timeline turns vertical, the low-priority "Did not vote" column hides below 640px, and the nav moves into a sheet.

## Elevation & Depth

Flat. Depth is made by rules and tonal paper steps (sunk, ground, raised), never by shadow. Only floating layers that cover content carry a soft warm shadow.

### Shadow Vocabulary
- **Popover** (`box-shadow: 0 12px 32px -12px oklch(0.2 0.02 60 / 0.3)`): stage explainer popovers.
- **Palette** (`box-shadow: 0 24px 60px -20px oklch(0.2 0.02 60 / 0.35)`): the command palette, over a 25% ink scrim with a 1px blur.

### Named Rules
**The Ruled Page Rule.** If a group needs separating, draw a hairline. Cards, tiles and shadows on in-flow content are not part of this world.

**The Double Rule Rule.** A total is set under a 3px double strong rule, as on a printed division list. Nothing but a total gets a double rule.

## Shapes

Nearly square. The base radius is 3px; fields, buttons and chips use about 2px; swatches and tally bars 1px. Circles are reserved for meaning: avatar discs, hemicycle seats, stage nodes and legend dots. Rules are 1px hairlines, 2px for stage connectors and the active nav underline, 3px double for totals. Dashed lines mean "not yet": unreached stages and empty states.

## Components

### Party tag and swatch
A 10px square of party colour (1px radius) beside the party short name in 0.8125rem ink-2. The swatch is the only party colour outside charts; legends use the same mark as a dot.

### Stage progress glyph
A compact readings ledger: one 6px by 12px tick per stage, grouped by chamber with a faint divider. Solid ink tick completed, outlined tick not reached, hairline dash skipped, danger tick struck through defeated, and the folded flag in Commons Green on the current stage. A label follows in meta; royal assent turns it ink and medium.

### Folded flag
A 16 by 18 SVG: a round-capped staff and a swallowtail pennant with a 55% fold. One per bill, only on the current stage.

### Readings ledger (stage timeline)
Every stage in both chambers in order, flexed by stage count, horizontal from 1024px and vertical below. Filled node and solid 2px ink connector completed; ringed hollow node and dashed rule-colour connector not reached; cross in danger ink defeated; the flag current with "Now here since" in Commons Green. Each stage carries an info popover explaining it.

### Vote tally
Result word and "296 yea to 26 nay · 10 paired" in figures, above a split bar (6px, 8px or 12px tall, 1px radius) of yea ink and nay sepia on sunk paper, with a paper hairline marking the halfway point. The result word is never coloured.

### Party breakdown table
Ruled table in 0.875rem: Party (swatch plus name), Position (with "n broke ranks" in ink-3), Yea, Nay, Did not vote, right-aligned tabular figures. The foot row sets totals in the serif at 1.75rem under the double rule, with "Total" in a small sans label. Parties are ordered by seats.

### Hemicycle
SVG semicircle of the House's real seats, coloured by ballot (ink, sepia, hatched, hollow) or by party via a two-option segment toggle. Hovering a seat or a ballot-table row highlights the pair: the seat grows 1.35x with an ink stroke, non-matching seats dim to 18% when filtered, over 160ms. The logo is the same hemicycle in monochrome.

### Ledger row
A record line: label (and optional note) left, figure right in the serif at 1.625rem, on a hairline.

### Bill row and vote row
Ruled articles, whole row clickable through a stretched link, title underlining on hover. A stretched link needs a block or table-cell ancestor with `relative`, never a `<tr>`: older iOS WebKit ignores it on rows and the overlay covers the page. Whole-row table links put the overlay in each cell (the MPs table). Bill row: serif number, title, plain-English line, stage glyph, bill type, small-caps sponsor with party tag, and a labelled date. Vote row: date and vote number, description and linked bill, tally.

### Member avatar
Initials in the serif (600, ink-2) on a sunk-paper disc at 32px, 40px or 80px. No photos; party sits in the tag beside it.

### Inputs / Fields
- **Style:** 40px tall, raised paper, 1px rule border, about 2px radius, 0.9375rem text, Lucide icons at 16px with 1.75 stroke in ink-3. Labels sit above in column-head type.
- **Hover / Set:** border darkens to ink-3 over 150ms; a filter changed from its default keeps the ink-3 border.
- **Focus:** the global 2px Commons Green outline at 2px offset.
- **Postal form:** 48px field with a strong-rule border and an attached ink submit that turns Commons Green on hover.

### Buttons
Few and quiet. The ink submit (ink on paper, green on hover) is the one solid button. The search button reads as a field. Segment toggles are a ruled frame with the active option in solid ink. Text actions ("Clear filters", "See all") are links.

### Navigation
Header with monochrome hemicycle mark and serif wordmark, sans links in ink-2 at 0.9375rem; the active link turns ink with a 2px Commons Green rule on the header's foot rule. Search and theme toggle sit right. Below 768px, links move into a sheet.

### Command palette
Opened from the header or Cmd/Ctrl K. A raised 40rem panel at 12vh with a 56px search line, grouped results (group heads in column-head type), and the selected row in Commons Wash with its icon turned green. Fades in over 180ms.

### Empty states
Centred between dashed top and bottom rules: a serif title, one line of plain explanation (max 44ch), and one link action. Missing values read "unavailable" in italic ink-3.

### Motion
State transitions take 150ms; overlays and popovers fade in 3px over 180ms on the quart ease-out; hemicycle highlights take 160ms. Under reduced motion, every animation and transition collapses to 1ms.

## Do's and Don'ts

### Do:
- **Do** separate with hairlines (rule) and close page headers with the strong rule.
- **Do** set every total in the serif under the 3px double strong rule.
- **Do** order parties by seat count in every table, legend and hemicycle.
- **Do** set member names in small caps (`name-sc`) wherever they appear in lists, tables and sponsor lines.
- **Do** draw state by form (fill, ring, dash, strike, flag) so charts read in greyscale, and pair every chart with a text alternative.
- **Do** label every zone with its literal plain-English name in sentence case.
- **Do** keep prose to the 66ch measure and figures tabular.

### Don't:
- **Don't** use party colour outside swatches, legend dots and hemicycle seats.
- **Don't** colour yea and nay as positive and negative; use the ink and sepia ballot marks.
- **Don't** use cards, KPI tiles, gradient charts or shadows on in-flow content.
- **Don't** add uppercase kickers or eyebrows above headings.
- **Don't** use em dashes in Tabled's own copy. Official riding names keep their official punctuation as data.
- **Don't** flag anything but the current stage of a bill.
- **Don't** use Commons Green for anything other than links, focus, selection and the current-stage flag.
