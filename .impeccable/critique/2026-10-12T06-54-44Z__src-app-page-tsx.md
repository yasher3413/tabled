---
target: home, bills index, bill detail
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Users/yash/tabled/src/app/page.tsx"
target_fingerprint: "sha256:f36c3f8986bfefdcc0b3a860bbbb6e3bbc46fa173ab2e858e465a720e23296e7"
target_path: /Users/yash/tabled/src/app/page.tsx
timestamp: 2026-10-12T06-54-44Z
slug: src-app-page-tsx
---
Method: single subagent for Assessment A; Assessment B (detector) run inline. ⚠️ Partially degraded: browser overlay injection skipped (unattended run).

## Design health: 27/40
| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Hero claimed every bill "is explained" while no summaries exist |
| 2 | Match system / real world | 2 | Raw LEGISinfo status leads the bill page; "paired" unexplained |
| 3 | User control and freedom | 3 | No way back up a 191-row list |
| 4 | Consistency and standards | 2 | One stage fact in three vocabularies |
| 5 | Error prevention | 3 | Postal placeholder truncated |
| 6 | Recognition rather than recall | 2 | Stage glyph undecodable; unlabelled row dates |
| 7 | Flexibility and efficiency | 3 | No pagination; filters fill the phone viewport |
| 8 | Aesthetic and minimalist design | 3 | Duplicate items between home sections |
| 9 | Error recovery | 3 | Empty states recover well |
| 10 | Help and documentation | 3 | Strong stage explainers; vote terms unexplained on home |

## Design specificity
Content authored for the product (seat chart, readings ledger, literal zone labels); form leaned generic editorial. The division-list signature (double-rule totals, small caps) was unbuilt.

## Detector
`impeccable detect` over src/app and src/components: 0 findings.

## Priority issues
- [P1] Bill page led with "summary coming soon" and hid the official summary.
- [P1] Stage status shown in three vocabularies, one raw jargon.
- [P1] Bills index rendered all 191 rows; filters filled the first phone screen; heading outline h1 to h3.
- [P2] Division-list signature unbuilt; home hemicycle static.
- [P2] Stage glyph contrast below 3:1; Senate stages bypassed rendered as "not reached"; yea/passed coloured green (not neutral).

## Resolution (same run)
All five fixed: official summary shown openly with a one-line note; `describeStage`/`describeStageEvent` vocabulary everywhere and plain status with "since" date; 25-row pages with "Show more", phone filter toggle, sr-only Results heading; `DivisionTotals` (small-caps labels, double rule, large figures) on vote and bill pages and an interactive seat legend; glyph contrast raised, new `skipped` stage state (17 bills), neutral ink/sepia ballot colours, Passed/Failed same weight.
