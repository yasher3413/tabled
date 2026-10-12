---
version: 1
slug: "src-app-layout-tsx"
primary_target: "src/app/layout.tsx"
related_targets: ["src/app"]
---

# Tabled site shell and core surfaces

Scope: every route (home, bills, bill detail, votes, vote detail, MPs, MP detail, find, parties, about).
Mode: Read for detail pages (the reader's question: what does this do, where is it, who voted how);
Operate for the indexes (find one bill, vote or MP fast).
Build path: code-led (no image generation in this session). Interview and decision page skipped: the
owner's brief forbids questions during the unattended run; assigned direction taken as-is.

## Direction contract

THESIS: Parliament's own record, the division list, made readable. Every object is a record with a count:
names in ruled columns, totals set large at the column foot under a double rule. Refuses the SaaS dashboard
of cards, KPI tiles and gradient charts.

OWN-WORLD: Warm paper (light) and deep ink (dark) grounds; one accent, House of Commons green, deep and
inky, for links, focus and the current-stage flag. Hairline rules everywhere, double rule above totals.
Brygada 1918 for display, Libre Franklin for UI and body, tabular figures always. Small caps member names.
Party colour only as small square ballot marks and hemicycle seats.

STORY: A reader lands from a link, reads the plain-English answer in the first lines, sees how far the bill
has got and the yeas against nays, then follows a name or a stage for depth.

FIRST VIEWPORT: Home: a masthead line, a one-sentence definition set large in the serif, search plus
postal code side by side, then "This week" as a dated ledger: left column stage changes, right column
divisions with yea/nay tallies. Bill page: number and short title huge, tldr directly under, the readings
ledger (stage timeline) full width below.

FORM: The division list (Journals of the House tally sheet), position 3 of 7 on the grounded list. Seed key
7c5ccbbc.

RAISES:
- From the jackfield schedule: stage state drawn by line pattern, not hue. Solid rule completed, ring
  current, dashed not reached, struck through defeated.
- From the cutting bench: one folded flag marks the current stage; nothing else is flagged.
- From the high-density web: data tables at true density on a strict hairline system, no whitespace
  inflation.
- From the iridescent cloud edge: colour confined to small marks; text fields stay achromatic.
- From the quote grammar: every zone carries its literal plain-English label ("What it does", "Who voted").
- From the generative identity: the logo is a monochrome hemicycle of the House's real seat count.

Signature interaction: the hemicycle. Hover or focus a seat, or a row in the ballot table, and the
pair highlight each other; filter chips dim non-matching seats. Motion 150-200ms, none under reduced motion.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
