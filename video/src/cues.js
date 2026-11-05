// The film's clock. 120 BPM: one beat is 0.5 s, one bar is 2 s. Every cue sits on the grid.
export const BPM = 120
export const BEAT = 60 / BPM
export const DURATION = 60
export const FPS = 60

export const C = {
  // 1. The House fills, then the home page
  fill: -0.2,
  hero: 2.0,
  // 2. Find your MP
  find: 4.5,
  typeStart: 5.25, // one key per eighth note
  press: 7.0,
  result: 7.5,
  findOut: 9.75,
  // 3. Vote 177
  vote: 10.25,
  wave: 11.5,
  title: 11.0,
  tally: 13.0,
  failed: 15.0,
  note: 15.5,
  // 4. Broke ranks, then the party table
  dissent: 19.0,
  dissentList: 19.5,
  table: 22.0,
  total: 24.5,
  // 5. An MP's record
  mp: 27.0,
  mpRows: 28.5,
  mpDissentRow: 29.5,
  mpOut: 32.25,
  // 6. The bill
  collapse: 33.6,
  node: 34.6,
  billHead: 32.9,
  timeline: 33.4,
  french: 37.0,
  english: 39.25,
  scroll: 39.75,
  summary: 40.5,
  ai: 42.0,
  billOut: 44.5,
  // 7. Every vote
  ledger: 45.0,
  pull: 48.5,
  bend: 49.5,
  seats: 51.0,
  // 8. The end
  bookend: 52.0,
  drain: 53.0,
  condense: 53.25,
  wordmark: 54.5,
  canada: 55.0,
  line: 55.5,
  still: 57.0,
}
