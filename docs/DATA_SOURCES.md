# Data sources

Recorded during Phase 0 recon on 2026-10-12. Every source is public and needs no key. All requests send
`User-Agent: Tabled/0.1 (civic project; contact via GitHub repo github.com/yasher3413/tabled)`.
Real sample responses live in `tests/fixtures/`.

## 1. openparliament.ca API

Base: `https://api.openparliament.ca`. Send `Accept: application/json`. Resources link to each other by
relative URL (`/bills/45-1/C-39/`); we use those as stable keys.

| Use | URL | Notes |
| --- | --- | --- |
| Bills in a session | `/bills/?session=45-1&limit=500` | List items only carry `session, legisinfo_id, introduced, name{en,fr}, number, url`. |
| One bill | `/bills/45-1/C-39/` | Adds `short_title`, `home_chamber` (`House`/`Senate`), `law`, `sponsor_politician_url`, `sponsor_politician_membership_url`, `text_url`, `vote_urls`, `private_member_bill`, `status_code`, `status{en}`. |
| Votes in a session | `/votes/?session=45-1&limit=500` | Newest first. `number, date, description{en,fr}, result` (`Passed`/`Failed`), `yea_total, nay_total, paired_total, bill_url` (nullable). |
| One vote | `/votes/45-1/178/` | Adds `party_votes[]` (`vote`, `disagreement`, `party.short_name.en`) and `context_statement`. |
| Ballots for a vote | `/votes/ballots/?vote=%2Fvotes%2F45-1%2F178%2F&limit=500` | One row per sitting MP: `ballot` is `Yes`, `No`, `Paired` or `Didn't vote`. Includes `politician_membership_url`. |
| Current MPs | `/politicians/?limit=500` | 337 rows on recon day. `current_party.short_name.en`, `current_riding{name.en, province}`, `image`. |
| One MP | `/politicians/ziad-aboultaif/` | `memberships[]` with `url`, `start_date`, `end_date`, `party`, `riding{id,name,province}`. `other_info.parl_mp_id` is the House of Commons PersonId. |

Pagination: `pagination{offset, limit, next_url}`. `limit=500` was accepted for every list.

Quirks:
- `/votes/ballots/?vote__session=45-1` returns an HTML 500 page. Ballots must be fetched per vote.
- `/sessions/` is 404. The current session is detected from LEGISinfo (`IsSessionOngoing`) and the newest vote.
- `/bills/` without a session filter is not ordered by date (C-1 from several Parliaments comes first).
- Senate bills have `sponsor_politician_url: null` (senators are not in the politician list).
- Party at time of vote comes from `politician_membership_url`, resolved through the MP's `memberships`.
- Photos at `/media/polpics/...` are served, but licensing is unclear, so we do not use them.

## 2. LEGISinfo (parl.ca)

| Use | URL | Notes |
| --- | --- | --- |
| All bills in a session | `https://www.parl.ca/legisinfo/en/bills/json?parlsession=45-1` | About 1 MB, 191 bills. Same keys as the single-bill export, but `BillStages` lists are empty and `Publications`, `HouseVoteDetails`, `ShortLegislativeSummaryEn` are `null`. Has `Passed*ReadingDateTime`, `ReceivedRoyalAssentDateTime`, status, type and sponsor fields. |
| One bill | `https://www.parl.ca/legisinfo/en/bill/45-1/C-39/json` | A one-element array. Adds `BillStages.{HouseBillStages, SenateBillStages, RoyalAssent}` (each stage: `BillStageNameEn`, `StateNameEn` of `Completed`/`In progress`/`Not reached`, `StateAsOfDate`, `Sittings`, `SignificantEvents`), `Publications[]` (`PublicationId`, `PublicationTypeNameEn`), `HouseVoteDetails[]`, `ShortLegislativeSummaryEn` (HTML), `WebReferences[]`. |
| Human page | `https://www.parl.ca/legisinfo/en/bill/45-1/C-39` | Linked as "LEGISinfo". |

Bill types (`BillDocumentTypeNameEn`): `House Government Bill`, `Private Member’s Bill`, `Senate Government Bill`,
`Senate Public Bill`, `Senate Private Bill`.

Bill text: `https://www.parl.ca/DocumentViewer/en/{PublicationId}` redirects to
`https://www.parl.ca/documentviewer/en/45-1/bill/C-4/first-reading`. The page links an XML version at
`/Content/Bills/451/{Government|Private}/C-4/C-4_1/C-4_E.xml`. The XML contains the drafters' official
`<Summary>` and the full text with `<Heading level="1">` for parts. We find the XML link by reading the viewer page.

Quirks:
- `ShortLegislativeSummaryEn` is often a placeholder ("A legislative summary is currently being prepared...")
  followed by an executive summary. Strip HTML and the placeholder sentence before use.
- Library of Parliament full summaries (`lop.parl.ca`) sit behind a Cloudflare challenge (HTTP 403 to scripts).
  We cannot fetch them, so the LEGISinfo executive summary and bill XML are our grounding.
- Pro forma bills (C-1, S-1) have `IsProForma: true`; we keep them but they never get summaries.
- Dates are local Ottawa time without a zone (`2026-10-08T15:15:00`).

## 3. House of Commons open data (ourcommons.ca)

| Use | URL |
| --- | --- |
| Votes in current session | `https://www.ourcommons.ca/members/en/votes/xml` |
| One vote with ballots | `https://www.ourcommons.ca/members/en/votes/45/1/178/xml` |
| Current members | `https://www.ourcommons.ca/members/en/search/xml` |

Vote XML gives `VoteValueName` (`Yea`/`Nay`/`Paired`) and `CaucusShortName` per member, but omits members who
did not vote. Totals for vote 178 matched openparliament exactly (296 / 26 / 10). Members XML had 337 rows
(Liberal 173, Conservative 137, Bloc 21, NDP 5, Green 1). Used as a cross-check and fallback.

## 4. Represent (Open North)

`https://represent.opennorth.ca/postcodes/{CODE}/` (no space, uppercase).

- `boundaries_centroid[]` contains one district per boundary set. The set named
  `federal-electoral-districts` is the old 2013 map. Use `/boundary-sets/federal-electoral-districts-2023-representation-order/`.
- `representatives_centroid[]` filtered to `representative_set_name == "House of Commons"` gives the current MP.
  Its `url` ends in `(PersonId)`, which matches openparliament's `other_info.parl_mp_id`.
- `boundaries_concordance` / `representatives_concordance` list extra districts when a postal code spans ridings.
  For federal districts they were empty for every code we tried, so we merge both lists and dedupe.
- Riding names use em dashes (`Kanata—Carleton`); normalise before matching.

## Rate behaviour

No 429s during recon (around 60 requests over 10 minutes). Ingestion uses a disk cache in `data/cache/`,
concurrency 3 and exponential backoff on 429 and 5xx.
