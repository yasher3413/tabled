// UI copy, verbatim from the site (src/i18n/messages.ts, src/views/*.tsx, src/lib/stages.ts, src/i18n/stages-fr.ts).
// Film-only copy is marked FILM and kept to the end card.
export const EN = {
  nav: ["Bills", "Votes", "MPs", "Parties", "Find your MP", "About"],
  search: "Search",
  lang: "Français",
  heroTitle: ["What Parliament", "is doing, in", "plain English."],
  heroLede:
    "Tabled tracks every federal bill, every recorded House vote and every MP in the current Parliament: where each bill stands, who voted which way, and the official source one click away.",
  searchPh: "Search bills and MPs",
  postalPh: "Postal code",
  findHero: "Find your MP",
  seatsCaption: (n) => `${n} seats in the House of Commons`,
  vacant: "Vacant",
  findTitle: "Find your MP",
  findLede: "Enter your postal code to see your federal riding, who represents you in the House of Commons and how they have voted.",
  findLabel: "Your postal code",
  findButton: "Find",
  yourMp: (pc) => `Your MP for ${pc}`,
  findCredit: "Riding lookup by Represent (Open North), using the 2023 federal electoral map.",
  votesCrumb: "Votes",
  voteMeta: (n, date, bill) => `Recorded vote ${n} in the House of Commons, ${date}, on Bill ${bill}`,
  failed: "Failed",
  passed: "Passed",
  yeaWord: "yea",
  nayWord: "nay",
  to: "to",
  pairedWord: "paired",
  splitNote: "Members of at least one party voted on both sides. That can mean a free vote, where parties let MPs vote as they choose.",
  legend: ["Yea", "Nay", "Paired", "Did not vote"],
  brokeWith: "Broke with their party",
  votedAgainst: (ballot, party, majority) => `Voted ${ballot}, ${party} majority voted ${majority}`,
  byParty: "By party",
  cols: ["Party", "Position", "Yea", "Nay", "Did not vote"],
  brokeRanks: (n) => `${n} broke ranks`,
  total: "Total",
  mpsCrumb: "MPs",
  mpFor: (riding) => `MP for ${riding}`,
  votingRecord: "Voting record",
  againstParty: "Against party",
  billsCrumb: "Bills",
  billMeta: (type, date) => `${type}, introduced in the House of Commons on ${date}`,
  status: "Status",
  sponsor: "Sponsor",
  defeatedAt: "Defeated at second reading in the House of Commons",
  whereItIs: "Where it is",
  chambers: { house: "House of Commons", senate: "Senate", crown: "Royal assent" },
  defeated: "Defeated",
  whatItDoes: "What it does",
  whoItAffects: "Who it affects",
  aiLabel: "AI-generated summary of the official text.",
  aiRest: (date, model) => `Written from the full text of the bill on ${date} by the model ${model}. It can contain mistakes; the official text is the authority.`,
  votesTitle: "Votes",
  votesNoun: (n) => `${n} recorded votes`,
  vote: "Vote",
  parties: { liberal: "Liberal", conservative: "Conservative", bloc: "Bloc", ndp: "NDP", green: "Green" },
  // FILM: end card
  endLine: "Every bill, every vote, every MP. In plain English.",
  endCredit:
    "Data from openparliament.ca, LEGISinfo, House of Commons open data and Represent (Open North). Independent and nonpartisan. Not affiliated with Parliament or any party.",
}

export const FR = {
  nav: ["Projets de loi", "Votes", "Députés", "Partis", "Trouver votre député", "À propos"],
  search: "Rechercher",
  lang: "English",
  billsCrumb: "Projets de loi",
  billMeta: (type, date) => `${type}, déposé à la Chambre des communes le ${date}`,
  status: "État",
  sponsor: "Parrain",
  defeatedAt: "Rejeté à l’étape de la deuxième lecture à la Chambre des communes",
  whereItIs: "Où il en est",
  chambers: { house: "Chambre des communes", senate: "Sénat", crown: "Sanction royale" },
  defeated: "Rejeté",
  parties: { liberal: "Libéral", conservative: "Conservateur", bloc: "Bloc", ndp: "NPD", green: "Vert" },
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]
const MOIS_COURT = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."]
const parse = (d) => d.split("-").map(Number)
export const longDate = (d) => {
  const [y, m, dd] = parse(d)
  return `${MONTHS[m - 1]} ${dd}, ${y}`
}
export const longDateFr = (d) => {
  const [y, m, dd] = parse(d)
  return `${dd === 1 ? "1er" : dd} ${MOIS[m - 1]} ${y}`
}
/** formatShortDate with referenceYear 2026, as the site renders this session. */
export const shortDate = (d) => {
  const [y, m, dd] = parse(d)
  return y === 2026 ? `${MONTHS[m - 1].slice(0, 3)} ${dd}` : `${MONTHS[m - 1].slice(0, 3)} ${dd}, ${y}`
}
export const shortDateFr = (d) => {
  const [y, m, dd] = parse(d)
  return y === 2026 ? `${dd} ${MOIS_COURT[m - 1]}` : `${dd} ${MOIS_COURT[m - 1]} ${y}`
}
