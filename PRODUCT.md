# Product

<!-- impeccable:product-schema 1 -->

> Captured from the owner's written brief (`docs/tabled-brief.md`) during an unattended run. The owner forbade
> interactive questions, so no interview took place. Facts marked *(inferred)* are reasonable readings of the
> brief, not confirmed answers.

## Platform

web

## Users

- Ordinary Canadians who want to understand what Parliament is doing without reading legislation: what a bill
  does, where it is in the process, how their MP voted. Sessions are short; the brief's bar is "understand it in
  under a minute".
- Journalists who want a trustworthy page to link to and, later, embed.
- Students who should "actually enjoy using" it.
- *(inferred)* Most arrive from search or a shared link to one bill, vote or MP page, often on a phone.

## Product Purpose

Tabled tracks every federal bill, every recorded House vote and every MP in the current Parliament, and
explains each in plain English. Success is a reader leaving a bill page knowing what it does, who it affects,
how far it has got and who voted which way, with every fact traceable to an official source.

## Positioning

Official sources (LEGISinfo, ourcommons.ca) are complete but written for insiders. openparliament.ca is
thorough but dense. Tabled's mechanism is the combination: official data, reconciled across sources, presented
with grounded, neutral, AI-generated plain-English summaries that always link back to the source text.

## Operating Context

- Data is refreshed daily from openparliament.ca, LEGISinfo, House of Commons open data and Represent.
- Readers move between three objects: bills, votes, MPs. Search (including a command palette) and "Find your
  MP" by postal code are the main entry points beyond direct links.
- Pages are static or regenerated from a SQLite snapshot.

## Capabilities and Constraints

- Scope: the current Parliament and session (45-1 at time of writing), detected from data.
- Summaries: grade 8 reading level, describe and never evaluate, attribute claims, no loaded adjectives, no em
  dashes. Labelled "AI-generated summary of the official text" with a source link and a report-an-error link.
  The site must work fully without summaries.
- No fabricated data. Missing data shows an honest empty or "unavailable" state.
- No MP photos (licensing unclear); initials avatars instead.
- English first; French is a planned stretch.

## Brand Commitments

- Name: Tabled.
- Nonpartisan is a product requirement. Party colours appear only in data visualisations and small party tags,
  never as page themes. Parties are always ordered by seat count.
- Voice: plain, direct, friendly but not cute. Sentence case. No em dashes anywhere.
- Credit openparliament.ca visibly in the footer and About page.

## Evidence on Hand

- Real ingested data in `data/tabled.db` (191 bills, 178 votes, 60,927 ballots, 349 members on 2026-10-12).
- Recorded source responses in `tests/fixtures/`.
- No testimonials, press, usage numbers or endorsements exist. Do not invent any.

## Product Principles

1. Every number traces to a source. Show where it came from and when.
2. Describe, never judge. Neutral framing beats engaging framing.
3. One minute to understanding. Lead with the plain-English answer, put depth behind it.
4. Honest gaps. Say "unavailable" rather than guess.
5. Linkable and shareable. Every view has a stable URL.

## Accessibility & Inclusion

WCAG 2.2 AA in light and dark themes, full keyboard navigation, text alternatives for every chart, respects
`prefers-reduced-motion`, usable from 360px wide.
