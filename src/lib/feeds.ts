// RSS feeds: the weekly digest, one per bill, one per MP. Built from the same queries as the pages.
import { INTL_LOCALE, localePath, type Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { formatDate } from "./format"
import { getBill, getMember } from "./queries"
import { buildRss } from "./rss"
import { SITE_NAME, SITE_URL } from "./site"
import { describeStageEvent } from "./stages"
import { weekRange } from "./weeks"
import { activeWeeks, weekDigest } from "./digest"

const abs = (locale: Locale, path: string) => `${SITE_URL}${localePath(locale, path)}`

export function digestFeed(locale: Locale): string {
  const t = getMessages(locale).digest
  const fr = locale === "fr"
  const items = activeWeeks()
    .slice(0, 12)
    .map((week) => {
      const d = weekDigest(week)
      const lines = [
        ...d.events.map((e) => `${e.number} ${fr ? (e.shortTitleFr ?? e.titleFr ?? e.title) : (e.shortTitle ?? e.title)}: ${describeStageEvent(e.stageKey, e.state, locale)}`),
        ...d.votes.map((v) => `${getMessages(locale).home.voteN(v.number)}: ${fr ? (v.descriptionFr ?? v.descriptionEn) : v.descriptionEn} (${getMessages(locale).vote[v.result]} ${v.yeas}-${v.nays})`),
      ]
      return {
        title: `${t.weekOf(formatDate(weekRange(week).start, locale))}: ${t.counts(d.events.length, d.votes.length)}`,
        link: abs(locale, `/this-week/${week}`),
        guid: `tabled:${locale}:week:${week}`,
        date: d.end,
        description: lines.join("\n"),
      }
    })
  return buildRss({
    title: t.rssTitle,
    link: abs(locale, "/this-week"),
    selfLink: abs(locale, "/this-week/rss.xml"),
    description: t.rssDescription,
    language: INTL_LOCALE[locale],
    items,
  })
}

export function billFeed(locale: Locale, session: string, number: string): string | null {
  const data = getBill(session, number)
  if (!data) return null
  const { bill, stages, votes } = data
  const m = getMessages(locale)
  const fr = locale === "fr"
  const name = `${bill.number} ${fr ? (bill.shortTitleFr ?? bill.titleFr ?? bill.titleEn) : (bill.shortTitleEn ?? bill.titleEn)}`
  const link = abs(locale, `/bills/${bill.sessionId}/${bill.number}`)
  const items = [
    ...stages
      .filter((s) => s.date && (s.state === "completed" || s.state === "defeated"))
      .map((s) => ({
        title: `${bill.number}: ${describeStageEvent(s.stageKey, s.state, locale)}`,
        link,
        guid: `tabled:${locale}:${bill.id}:${s.stageKey}:${s.state}`,
        date: s.date!,
        description: `${name}. ${describeStageEvent(s.stageKey, s.state, locale)}, ${formatDate(s.date, locale)}.`,
      })),
    ...votes.map((v) => ({
      title: `${bill.number}: ${m.home.voteN(v.number)}, ${m.vote[v.result]} ${v.yeas}-${v.nays}`,
      link: abs(locale, `/votes/${v.sessionId}/${v.number}`),
      guid: `tabled:${locale}:vote:${v.id}`,
      date: v.date,
      description: `${fr ? (v.descriptionFr ?? v.descriptionEn) : v.descriptionEn}. ${m.vote[v.result]}: ${v.yeas} ${m.vote.yeas.toLowerCase()}, ${v.nays} ${m.vote.nays.toLowerCase()}.`,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date))
  return buildRss({
    title: `${SITE_NAME}: ${name}`,
    link,
    selfLink: `${link}/rss.xml`,
    description: fr ? `Étapes et votes du projet de loi ${bill.number}.` : `Stages and recorded votes for bill ${bill.number}.`,
    language: INTL_LOCALE[locale],
    items,
  })
}

export function mpFeed(locale: Locale, slug: string): string | null {
  const data = getMember(slug)
  if (!data) return null
  const m = getMessages(locale)
  const fr = locale === "fr"
  const { member, ballots, sponsored } = data
  const link = abs(locale, `/mps/${member.id}`)
  const ballotLabel = { yea: m.vote.yea, nay: m.vote.nay, paired: m.vote.paired, absent: m.vote.didNotVote }
  const items = [
    ...ballots.slice(0, 50).map((b) => ({
      title: `${member.name}: ${ballotLabel[b.ballot]}${b.isDissent ? (fr ? " (contre son parti)" : " (against party)") : ""}, ${m.home.voteN(b.number)}`,
      link: abs(locale, `/votes/${b.sessionId}/${b.number}`),
      guid: `tabled:${locale}:${member.id}:vote:${b.voteId}`,
      date: b.date,
      description: `${fr ? (b.descriptionFr ?? b.description) : b.description}. ${m.vote[b.result]}.`,
    })),
    ...sponsored
      .filter((b) => b.introducedDate)
      .map((b) => ({
        title: `${member.name}: ${fr ? "a déposé" : "introduced"} ${b.number}`,
        link: abs(locale, `/bills/${b.sessionId}/${b.number}`),
        guid: `tabled:${locale}:${member.id}:bill:${b.id}`,
        date: b.introducedDate!,
        description: `${b.number} ${fr ? (b.shortTitleFr ?? b.titleFr ?? b.title) : (b.shortTitle ?? b.title)}.`,
      })),
  ].sort((a, b) => b.date.localeCompare(a.date))
  return buildRss({
    title: `${SITE_NAME}: ${member.name}`,
    link,
    selfLink: `${link}/rss.xml`,
    description: fr ? `Votes et projets de loi de ${member.name}.` : `Votes and bills from ${member.name}.`,
    language: INTL_LOCALE[locale],
    items,
  })
}
