import { index, integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(), // "45-1"
  parliament: integer("parliament").notNull(),
  session: integer("session").notNull(),
  startDate: text("start_date"),
  endDate: text("end_date"),
  isCurrent: integer("is_current", { mode: "boolean" }).notNull().default(false),
})

export const parties = sqliteTable("parties", {
  id: text("id").primaryKey(), // "liberal"
  nameEn: text("name_en").notNull(),
  nameFr: text("name_fr"),
  shortName: text("short_name").notNull(),
  colorToken: text("color_token").notNull(),
  seatCount: integer("seat_count").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
})

export const ridings = sqliteTable("ridings", {
  id: text("id").primaryKey(), // openparliament riding id
  nameEn: text("name_en").notNull(),
  nameFr: text("name_fr"),
  province: text("province").notNull(),
})

export const members = sqliteTable(
  "members",
  {
    id: text("id").primaryKey(), // openparliament slug, "ziad-aboultaif"
    openparliamentUrl: text("openparliament_url").notNull(),
    parlMpId: integer("parl_mp_id"),
    name: text("name").notNull(),
    givenName: text("given_name"),
    familyName: text("family_name"),
    partyId: text("party_id").references(() => parties.id),
    ridingId: text("riding_id").references(() => ridings.id),
    province: text("province"),
    photoUrl: text("photo_url"),
    active: integer("active", { mode: "boolean" }).notNull().default(false),
    startDate: text("start_date"),
    endDate: text("end_date"),
    ourcommonsUrl: text("ourcommons_url"),
  },
  (t) => [index("members_party_idx").on(t.partyId), index("members_parl_idx").on(t.parlMpId)],
)

export const memberships = sqliteTable("memberships", {
  url: text("url").primaryKey(), // "/politicians/memberships/4208/"
  memberId: text("member_id")
    .notNull()
    .references(() => members.id),
  partyId: text("party_id").references(() => parties.id),
  ridingId: text("riding_id").references(() => ridings.id),
  startDate: text("start_date"),
  endDate: text("end_date"),
})

export const bills = sqliteTable(
  "bills",
  {
    id: text("id").primaryKey(), // "45-1/C-39"
    sessionId: text("session_id")
      .notNull()
      .references(() => sessions.id),
    number: text("number").notNull(), // "C-39"
    numberPrefix: text("number_prefix").notNull(), // "C" | "S"
    numberInt: integer("number_int").notNull(),
    titleEn: text("title_en").notNull(),
    titleFr: text("title_fr"),
    shortTitleEn: text("short_title_en"),
    shortTitleFr: text("short_title_fr"),
    chamber: text("chamber", { enum: ["house", "senate"] }).notNull(),
    type: text("type", {
      enum: ["government", "private_member", "senate_public", "senate_private"],
    }).notNull(),
    typeLabel: text("type_label").notNull(),
    sponsorMemberId: text("sponsor_member_id").references(() => members.id),
    sponsorName: text("sponsor_name"),
    sponsorTitle: text("sponsor_title"),
    sponsorTitleFr: text("sponsor_title_fr"),
    sponsorPartyId: text("sponsor_party_id").references(() => parties.id),
    introducedDate: text("introduced_date"),
    currentStage: text("current_stage").notNull(),
    currentStageChamber: text("current_stage_chamber"),
    statusEn: text("status_en").notNull(),
    statusFr: text("status_fr"),
    isLaw: integer("is_law", { mode: "boolean" }).notNull().default(false),
    isDefeated: integer("is_defeated", { mode: "boolean" }).notNull().default(false),
    isProForma: integer("is_pro_forma", { mode: "boolean" }).notNull().default(false),
    royalAssentDate: text("royal_assent_date"),
    statuteChapter: text("statute_chapter"),
    legisinfoId: integer("legisinfo_id").notNull(),
    legisinfoUrl: text("legisinfo_url").notNull(),
    textUrl: text("text_url"),
    textPublicationId: integer("text_publication_id"),
    legislativeSummaryUrl: text("legislative_summary_url"),
    legisinfoSummaryText: text("legisinfo_summary_text"),
    legisinfoSummaryTextFr: text("legisinfo_summary_text_fr"),
    lastActivityDate: text("last_activity_date"),
    lastActivityLabel: text("last_activity_label"),
    lastUpdated: text("last_updated").notNull(),
  },
  (t) => [
    index("bills_session_idx").on(t.sessionId),
    index("bills_activity_idx").on(t.lastActivityDate),
  ],
)

export const billStages = sqliteTable(
  "bill_stages",
  {
    billId: text("bill_id")
      .notNull()
      .references(() => bills.id),
    ordinal: integer("ordinal").notNull(),
    chamber: text("chamber", { enum: ["house", "senate", "crown"] }).notNull(),
    stageKey: text("stage_key").notNull(), // "house:second-reading"
    stageName: text("stage_name").notNull(),
    state: text("state", { enum: ["completed", "in_progress", "not_reached", "defeated", "skipped"] }).notNull(),
    date: text("date"),
  },
  (t) => [primaryKey({ columns: [t.billId, t.ordinal] })],
)

export const votes = sqliteTable(
  "votes",
  {
    id: text("id").primaryKey(), // "45-1/178"
    sessionId: text("session_id")
      .notNull()
      .references(() => sessions.id),
    number: integer("number").notNull(),
    date: text("date").notNull(),
    descriptionEn: text("description_en").notNull(),
    descriptionFr: text("description_fr"),
    billId: text("bill_id").references(() => bills.id),
    result: text("result", { enum: ["passed", "failed", "tied"] }).notNull(),
    yeas: integer("yeas").notNull(),
    nays: integer("nays").notNull(),
    paired: integer("paired").notNull(),
    hasPartySplit: integer("has_party_split", { mode: "boolean" }).notNull().default(false),
    sourceUrl: text("source_url").notNull(),
  },
  (t) => [index("votes_bill_idx").on(t.billId), index("votes_date_idx").on(t.date)],
)

export const ballots = sqliteTable(
  "ballots",
  {
    voteId: text("vote_id")
      .notNull()
      .references(() => votes.id),
    memberId: text("member_id")
      .notNull()
      .references(() => members.id),
    ballot: text("ballot", { enum: ["yea", "nay", "paired", "absent"] }).notNull(),
    partyId: text("party_id").references(() => parties.id),
    isDissent: integer("is_dissent", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [
    primaryKey({ columns: [t.voteId, t.memberId] }),
    index("ballots_member_idx").on(t.memberId),
  ],
)

export const votePartyStats = sqliteTable(
  "vote_party_stats",
  {
    voteId: text("vote_id")
      .notNull()
      .references(() => votes.id),
    partyId: text("party_id")
      .notNull()
      .references(() => parties.id),
    yeas: integer("yeas").notNull(),
    nays: integer("nays").notNull(),
    paired: integer("paired").notNull(),
    absent: integer("absent").notNull(),
    majority: text("majority", { enum: ["yea", "nay", "tie", "none"] }).notNull(),
    isSplit: integer("is_split", { mode: "boolean" }).notNull(),
    dissentCount: integer("dissent_count").notNull(),
  },
  (t) => [primaryKey({ columns: [t.voteId, t.partyId] })],
)

export const memberStats = sqliteTable("member_stats", {
  memberId: text("member_id")
    .primaryKey()
    .references(() => members.id),
  votesHeld: integer("votes_held").notNull(),
  votesCast: integer("votes_cast").notNull(),
  votesPaired: integer("votes_paired").notNull(),
  partyLineEligible: integer("party_line_eligible").notNull(),
  partyLineVotes: integer("party_line_votes").notNull(),
  dissentCount: integer("dissent_count").notNull(),
  partyLineRate: real("party_line_rate"),
  attendanceRate: real("attendance_rate"),
  billsSponsored: integer("bills_sponsored").notNull(),
})

export const summaries = sqliteTable("summaries", {
  billId: text("bill_id")
    .primaryKey()
    .references(() => bills.id),
  sourceHash: text("source_hash").notNull(),
  model: text("model").notNull(),
  generatedAt: text("generated_at").notNull(),
  payload: text("payload").notNull(), // JSON string, validated with Zod on read
  sourceBasis: text("source_basis", {
    enum: ["legislative_summary", "full_text", "legisinfo"],
  }).notNull(),
  sourceUrl: text("source_url"),
})

export const meta = sqliteTable("meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
})
