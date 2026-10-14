import type { Metadata } from "next"
import Link from "next/link"
import { Container, PageHeader, SectionHeading } from "@/components/tabled/page-header"
import { localePath, type Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { formatDate } from "@/lib/format"
import { alternates } from "@/lib/metadata"
import { getMeta } from "@/lib/queries"
import { REPO_URL } from "@/lib/site"
import { chamberLabel, privateVsGovernment, stageInfo } from "@/lib/stages"

export function aboutMetadata(locale: Locale): Metadata {
  const t = getMessages(locale).meta
  return { title: t.about, description: t.aboutDesc, alternates: alternates(locale, "/about") }
}

const STAGES = [
  "house:first-reading",
  "house:second-reading",
  "house:committee",
  "house:report",
  "house:third-reading",
  "senate:first-reading",
  "senate:second-reading",
  "senate:committee",
  "senate:third-reading",
  "crown:royal-assent",
]

function reconciledCount(raw: string | undefined) {
  try {
    return (JSON.parse(raw ?? "[]") as string[]).filter((n) => n.includes("used official record")).length
  } catch {
    return 0
  }
}

export function AboutView({ locale }: { locale: Locale }) {
  const meta = getMeta()
  const fr = locale === "fr"
  const reconciled = reconciledCount(meta.crosscheck)
  const snapshot = meta.last_ingest ? formatDate(meta.last_ingest, locale) : null
  const session = meta.current_session ?? "?"
  const toc: Array<[string, string]> = fr
    ? [
        ["sources", "Sources des données"],
        ["methodology", "Calcul des chiffres"],
        ["summaries", "Résumés en langage clair"],
        ["how-a-bill-becomes-law", "Comment un projet de loi devient loi"],
        ["nonpartisan", "Engagement non partisan"],
        ["errors", "Signaler une erreur"],
      ]
    : [
        ["sources", "Data sources"],
        ["methodology", "How numbers are calculated"],
        ["summaries", "Plain-English summaries"],
        ["how-a-bill-becomes-law", "How a bill becomes law"],
        ["nonpartisan", "Nonpartisan commitment"],
        ["errors", "Report an error"],
      ]
  const heading = Object.fromEntries(toc)
  return (
    <Container>
      <PageHeader
        title={fr ? "À propos de Tabled" : "About Tabled"}
        lede={
          fr
            ? "Tabled est un guide indépendant et non partisan du Parlement du Canada. Il montre ce que fait chaque projet de loi, où il en est et comment chaque député a voté, à partir de données officielles et publiques uniquement."
            : "Tabled is an independent, nonpartisan guide to the Parliament of Canada. It shows what every bill does, where it is, and how every MP voted, using only official and public data."
        }
      />

      <div className="mt-12 grid gap-x-16 gap-y-12 lg:grid-cols-[13rem_1fr]">
        <nav aria-label={fr ? "Sur cette page" : "On this page"} className="hidden lg:block">
          <ul className="sticky top-6 space-y-2 text-[0.9375rem] text-ink-2">
            {toc.map(([id, label]) => (
              <li key={id}>
                <a className="hover:text-accent-ink" href={`#${id}`}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="measure min-w-0 space-y-14 text-[1.0625rem] leading-relaxed text-ink-2 [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-ink [&_p]:mt-3">
          <section aria-labelledby="sources">
            <SectionHeading id="sources">{heading.sources}</SectionHeading>
            {fr ? (
              <ul className="mt-4 list-disc space-y-3 pl-5 marker:text-ink-3">
                <li>
                  <a className="link" href="https://openparliament.ca">openparliament.ca</a> pour les députés, les votes par appel nominal et le vote de chaque député. Tabled
                  n’existerait pas sans ce projet de Michael Mulley; merci de le citer aussi.
                </li>
                <li>
                  <a className="link" href="https://www.parl.ca/legisinfo/fr">LEGISinfo</a>, l’outil officiel de suivi des projets de loi du Parlement, pour l’état, les étapes,
                  les dates, les parrains et les liens vers le texte des projets de loi.
                </li>
                <li>
                  Les <a className="link" href="https://www.noscommunes.ca/fr/donnees-ouvertes">données ouvertes de la Chambre des communes</a> pour vérifier chaque vote.
                  En cas de désaccord, Tabled utilise le registre officiel de la Chambre{reconciled ? ` (${reconciled} votes lors de la dernière mise à jour)` : ""}.
                </li>
                <li>
                  <a className="link" href="https://represent.opennorth.ca">Represent d’Open North</a> pour associer les codes postaux aux circonscriptions.
                </li>
              </ul>
            ) : (
              <ul className="mt-4 list-disc space-y-3 pl-5 marker:text-ink-3">
                <li>
                  <a className="link" href="https://openparliament.ca">openparliament.ca</a> for MPs, recorded votes and how each MP voted. Tabled would not exist without this
                  project by Michael Mulley; please credit it too.
                </li>
                <li>
                  <a className="link" href="https://www.parl.ca/legisinfo/en">LEGISinfo</a>, Parliament’s official bill tracker, for bill status, stages, dates, sponsors and
                  links to the bill text.
                </li>
                <li>
                  <a className="link" href="https://www.ourcommons.ca/en/open-data">House of Commons open data</a> to cross-check every vote. When the two disagree, Tabled uses
                  the official House record{reconciled ? ` (this affected ${reconciled} votes in the latest update)` : ""}.
                </li>
                <li>
                  <a className="link" href="https://represent.opennorth.ca">Represent by Open North</a> to match postal codes to ridings.
                </li>
              </ul>
            )}
            <p>
              {fr
                ? `Les données sont mises à jour chaque jour. L’instantané actuel date du ${snapshot ?? "(date inconnue)"}. Tabled couvre la session en cours du Parlement (${session}). Les votes du Sénat ne sont pas inclus.`
                : `Data is refreshed daily. The current snapshot was taken ${snapshot ?? "on an unknown date"}. Tabled covers the current session of Parliament (${session}). Senate votes are not included.`}
            </p>
          </section>

          <section aria-labelledby="methodology">
            <SectionHeading id="methodology">{heading.methodology}</SectionHeading>
            {fr ? (
              <>
                <h3>Position du parti</h3>
                <p>
                  Pour chaque vote par appel nominal, la position d’un parti est le côté choisi par la majorité de ses députés qui ont voté. Les députés pairés ou absents ne
                  sont pas comptés. Si les députés d’un parti se divisent exactement à égalité, le parti n’a pas de position sur ce vote. Il faut au moins deux députés qui
                  votent pour qu’un parti ait une position; un parti d’un seul député n’en a donc jamais.
                </p>
                <h3>A voté avec son parti (fidélité au parti)</h3>
                <p>
                  La part des votes pour ou contre d’un député qui correspondent à la position de son parti. Seuls les votes où son parti avait une position comptent. Les
                  indépendants n’ont pas de taux. Le parti retenu est celui du député le jour du vote.
                </p>
                <h3>Vote dissident</h3>
                <p>Un vote pour ou contre allant à l’encontre de la position du parti du député sur ce vote.</p>
                <h3>Votes divisés</h3>
                <p>
                  Les votes où les députés d’un parti ont voté des deux côtés. Il s’agit parfois d’un vote libre, où le parti laisse ses députés voter comme ils l’entendent;
                  parfois de députés qui rompent avec leur parti. Tabled signale ces votes sans deviner de quel cas il s’agit.
                </p>
                <h3>Votes exprimés</h3>
                <p>
                  Les votes pour et contre exprimés, sur l’ensemble des votes par appel nominal tenus pendant que le député siégeait. Les députés pairés (deux députés de
                  camps opposés qui conviennent de ne pas voter) sont comptés comme n’ayant pas voté. Manquer un vote a bien des causes légitimes : travaux en comité,
                  déplacements liés au mandat, maladie, congé familial ou obligations dans la circonscription. Ce n’est pas une mesure de l’ardeur au travail d’un député.
                </p>
                <h3>Cohésion</h3>
                <p>Le taux moyen de fidélité au parti des députés actuels d’un parti.</p>
              </>
            ) : (
              <>
                <h3>Party position</h3>
                <p>
                  On each recorded vote, a party’s position is whichever side most of its voting MPs took. MPs who were paired or did not vote are left out. If a party’s MPs
                  split exactly evenly, it has no position on that vote. A party needs at least two MPs voting to have a position, so a party with one MP never has one.
                </p>
                <h3>Voted with party (party-line rate)</h3>
                <p>
                  The share of an MP’s yea or nay votes that matched their party’s position. Only votes where their party had a position count. Independents have no rate.
                  The party is the one the MP belonged to on the day of the vote.
                </p>
                <h3>Broke ranks</h3>
                <p>A yea or nay vote that went against the MP’s party position on that vote.</p>
                <h3>Split votes</h3>
                <p>
                  Votes where a party’s MPs voted on both sides. Sometimes this is a free vote, where a party lets its MPs vote as they choose; sometimes it is individual MPs
                  breaking ranks. Tabled flags these votes but does not guess which is which.
                </p>
                <h3>Votes cast</h3>
                <p>
                  Yea and nay votes cast, out of all recorded votes held while the MP was sitting. Paired MPs (two MPs on opposite sides who agree to both stay out) are counted
                  as not casting a vote. Missing a recorded vote has many legitimate causes: committee work, travel for the job, illness, family leave or constituency duties.
                  It is not a measure of how hard an MP works.
                </p>
                <h3>Cohesion</h3>
                <p>The average party-line rate of a party’s current MPs.</p>
              </>
            )}
          </section>

          <section aria-labelledby="summaries">
            <SectionHeading id="summaries">{heading.summaries}</SectionHeading>
            {fr ? (
              <>
                <p>
                  Les résumés des projets de loi sont rédigés par un modèle d’IA (Claude d’Anthropic ou GPT d’OpenAI) à partir de sources officielles, et chacun est indiqué comme généré
                  par IA, avec le nom du modèle utilisé. Le modèle reçoit, par ordre de préférence, le résumé publié dans LEGISinfo, le texte intégral du projet de loi ou la description de LEGISinfo. Si
                  seul le titre est disponible, aucun résumé n’est rédigé.
                </p>
                <p>
                  Chaque résumé est vérifié automatiquement avant publication : structure fixe, longueur limitée, aucun mot chargé comme « controversé » ou « historique », et
                  une description de ce que fait le projet de loi plutôt qu’un jugement. Les résumés sont rédigés à partir de sources anglaises; ils ne sont donc pas
                  affichés sur le site français, qui présente le résumé officiel en français publié par le Parlement.
                </p>
                <p>Le texte officiel fait toujours autorité, et il est en lien sur chaque page de projet de loi.</p>
              </>
            ) : (
              <>
                <p>
                  Bill summaries are written by an AI model (Anthropic’s Claude or OpenAI’s GPT) from official sources, and every one is labelled as AI-generated and names the model used. The model is given, in order
                  of preference, the bill summary published on LEGISinfo, the full text of the bill, or LEGISinfo’s description. If only a bill’s title is available, no
                  summary is written.
                </p>
                <p>
                  Each summary is checked automatically before it is published: it must follow a fixed structure, stay short, avoid loaded words like “controversial” or
                  “historic”, and describe what the bill does rather than judge it. Claims are attributed (“the government says”). Summaries are only rewritten when the
                  official text changes.
                </p>
                <p>The official text is always the authority, and is linked from every bill page.</p>
              </>
            )}
          </section>

          <section aria-labelledby="how-a-bill-becomes-law">
            <SectionHeading id="how-a-bill-becomes-law">{heading["how-a-bill-becomes-law"]}</SectionHeading>
            <p>
              {fr
                ? "Un projet de loi doit franchir les mêmes étapes à la Chambre des communes et au Sénat, dans le même libellé, puis recevoir la sanction royale. La plupart commencent à la Chambre; certains commencent au Sénat et suivent le même parcours en sens inverse."
                : "A bill must pass the same stages in both the House of Commons and the Senate, in the same words, then receive royal assent. Most bills start in the House; some start in the Senate and follow the same path in reverse."}
            </p>
            <ol className="mt-5 space-y-4 border-l border-rule pl-5">
              {STAGES.map((key) => {
                const s = stageInfo(key, locale)
                return (
                  <li key={key}>
                    <p className="!mt-0 font-semibold text-ink">
                      {s.label} <span className="font-normal text-ink-3">· {chamberLabel(s.chamber, locale)}</span>
                    </p>
                    <p className="!mt-1">{s.explainer}</p>
                  </li>
                )
              })}
            </ol>
            <h3>{fr ? "Projets de loi du gouvernement et projets de loi émanant des députés" : "Government bills and private members’ bills"}</h3>
            <p>{privateVsGovernment(locale)}</p>
          </section>

          <section aria-labelledby="nonpartisan">
            <SectionHeading id="nonpartisan">{heading.nonpartisan}</SectionHeading>
            <p>
              {fr
                ? "Tabled n’a aucun lien avec le Parlement, un parti ou un groupe de pression. Il n’appuie ni ne s’oppose à aucun projet de loi ni à aucun député. Les couleurs des partis n’apparaissent que dans les graphiques et les petites étiquettes, et les partis sont toujours présentés selon le nombre de sièges. Si une formulation vous semble prendre parti, signalez-la."
                : "Tabled is not affiliated with Parliament, any party or any advocacy group. It does not endorse or oppose any bill or MP. Party colours appear only in charts and small labels, and parties are always listed in order of seats held. If you see wording that seems to take a side, please report it."}
            </p>
          </section>

          <section aria-labelledby="errors">
            <SectionHeading id="errors">{heading.errors}</SectionHeading>
            <p>
              {fr ? "Vous avez trouvé une erreur? " : "Found something wrong? "}
              <Link className="link" href={localePath(locale, "/report")}>
                {fr ? "Signalez un problème" : "Report a problem"}
              </Link>
              {fr
                ? " en indiquant la page et l’information exacte; votre signalement devient un ticket public sur GitHub. Vous pouvez aussi "
                : " with the page and what the correct information is; your report becomes a public GitHub issue. You can also "}
              <a className="link" href={`${REPO_URL}/issues/new`}>
                {fr ? "ouvrir un ticket directement sur GitHub" : "open an issue on GitHub directly"}
              </a>
              {fr
                ? ". Tabled est un logiciel libre sous licence MIT; le code se trouve à "
                : ". Tabled is open source under the MIT licence; the code is at "}
              <a className="link" href={REPO_URL}>
                {REPO_URL.replace("https://", "")}
              </a>
              .
            </p>
            <p>
              <Link className="link" href={localePath(locale, "/")}>
                {fr ? "Retour à l’accueil" : "Back to the home page"}
              </Link>
            </p>
          </section>
        </div>
      </div>
    </Container>
  )
}
