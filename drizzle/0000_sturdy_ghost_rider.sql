CREATE TABLE `ballots` (
	`vote_id` text NOT NULL,
	`member_id` text NOT NULL,
	`ballot` text NOT NULL,
	`party_id` text,
	`is_dissent` integer DEFAULT false NOT NULL,
	PRIMARY KEY(`vote_id`, `member_id`),
	FOREIGN KEY (`vote_id`) REFERENCES `votes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`party_id`) REFERENCES `parties`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ballots_member_idx` ON `ballots` (`member_id`);--> statement-breakpoint
CREATE TABLE `bill_stages` (
	`bill_id` text NOT NULL,
	`ordinal` integer NOT NULL,
	`chamber` text NOT NULL,
	`stage_key` text NOT NULL,
	`stage_name` text NOT NULL,
	`state` text NOT NULL,
	`date` text,
	PRIMARY KEY(`bill_id`, `ordinal`),
	FOREIGN KEY (`bill_id`) REFERENCES `bills`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bills` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`number` text NOT NULL,
	`number_prefix` text NOT NULL,
	`number_int` integer NOT NULL,
	`title_en` text NOT NULL,
	`title_fr` text,
	`short_title_en` text,
	`short_title_fr` text,
	`chamber` text NOT NULL,
	`type` text NOT NULL,
	`type_label` text NOT NULL,
	`sponsor_member_id` text,
	`sponsor_name` text,
	`sponsor_title` text,
	`sponsor_party_id` text,
	`introduced_date` text,
	`current_stage` text NOT NULL,
	`current_stage_chamber` text,
	`status_en` text NOT NULL,
	`status_fr` text,
	`is_law` integer DEFAULT false NOT NULL,
	`is_defeated` integer DEFAULT false NOT NULL,
	`is_pro_forma` integer DEFAULT false NOT NULL,
	`royal_assent_date` text,
	`statute_chapter` text,
	`legisinfo_id` integer NOT NULL,
	`legisinfo_url` text NOT NULL,
	`text_url` text,
	`text_publication_id` integer,
	`legislative_summary_url` text,
	`legisinfo_summary_text` text,
	`last_activity_date` text,
	`last_activity_label` text,
	`last_updated` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sponsor_member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sponsor_party_id`) REFERENCES `parties`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `bills_session_idx` ON `bills` (`session_id`);--> statement-breakpoint
CREATE INDEX `bills_activity_idx` ON `bills` (`last_activity_date`);--> statement-breakpoint
CREATE TABLE `member_stats` (
	`member_id` text PRIMARY KEY NOT NULL,
	`votes_held` integer NOT NULL,
	`votes_cast` integer NOT NULL,
	`votes_paired` integer NOT NULL,
	`party_line_eligible` integer NOT NULL,
	`party_line_votes` integer NOT NULL,
	`dissent_count` integer NOT NULL,
	`party_line_rate` real,
	`attendance_rate` real,
	`bills_sponsored` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`openparliament_url` text NOT NULL,
	`parl_mp_id` integer,
	`name` text NOT NULL,
	`given_name` text,
	`family_name` text,
	`party_id` text,
	`riding_id` text,
	`province` text,
	`photo_url` text,
	`active` integer DEFAULT false NOT NULL,
	`start_date` text,
	`end_date` text,
	`ourcommons_url` text,
	FOREIGN KEY (`party_id`) REFERENCES `parties`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`riding_id`) REFERENCES `ridings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `members_party_idx` ON `members` (`party_id`);--> statement-breakpoint
CREATE INDEX `members_parl_idx` ON `members` (`parl_mp_id`);--> statement-breakpoint
CREATE TABLE `memberships` (
	`url` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`party_id` text,
	`riding_id` text,
	`start_date` text,
	`end_date` text,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`party_id`) REFERENCES `parties`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`riding_id`) REFERENCES `ridings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `parties` (
	`id` text PRIMARY KEY NOT NULL,
	`name_en` text NOT NULL,
	`name_fr` text,
	`short_name` text NOT NULL,
	`color_token` text NOT NULL,
	`seat_count` integer DEFAULT 0 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ridings` (
	`id` text PRIMARY KEY NOT NULL,
	`name_en` text NOT NULL,
	`name_fr` text,
	`province` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`parliament` integer NOT NULL,
	`session` integer NOT NULL,
	`start_date` text,
	`end_date` text,
	`is_current` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `summaries` (
	`bill_id` text PRIMARY KEY NOT NULL,
	`source_hash` text NOT NULL,
	`model` text NOT NULL,
	`generated_at` text NOT NULL,
	`payload` text NOT NULL,
	`source_basis` text NOT NULL,
	`source_url` text,
	FOREIGN KEY (`bill_id`) REFERENCES `bills`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `vote_party_stats` (
	`vote_id` text NOT NULL,
	`party_id` text NOT NULL,
	`yeas` integer NOT NULL,
	`nays` integer NOT NULL,
	`paired` integer NOT NULL,
	`absent` integer NOT NULL,
	`majority` text NOT NULL,
	`is_split` integer NOT NULL,
	`dissent_count` integer NOT NULL,
	PRIMARY KEY(`vote_id`, `party_id`),
	FOREIGN KEY (`vote_id`) REFERENCES `votes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`party_id`) REFERENCES `parties`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`number` integer NOT NULL,
	`date` text NOT NULL,
	`description_en` text NOT NULL,
	`description_fr` text,
	`bill_id` text,
	`result` text NOT NULL,
	`yeas` integer NOT NULL,
	`nays` integer NOT NULL,
	`paired` integer NOT NULL,
	`has_party_split` integer DEFAULT false NOT NULL,
	`source_url` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`bill_id`) REFERENCES `bills`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `votes_bill_idx` ON `votes` (`bill_id`);--> statement-breakpoint
CREATE INDEX `votes_date_idx` ON `votes` (`date`);