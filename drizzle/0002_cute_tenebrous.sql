PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_member_stats` (
	`member_id` text NOT NULL,
	`session_id` text NOT NULL,
	`votes_held` integer NOT NULL,
	`votes_cast` integer NOT NULL,
	`votes_paired` integer NOT NULL,
	`party_line_eligible` integer NOT NULL,
	`party_line_votes` integer NOT NULL,
	`dissent_count` integer NOT NULL,
	`party_line_rate` real,
	`attendance_rate` real,
	`bills_sponsored` integer NOT NULL,
	PRIMARY KEY(`member_id`, `session_id`),
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
-- Stats are rebuilt by every ingest, so the old rows (which had no session) are not copied.
DROP TABLE `member_stats`;--> statement-breakpoint
ALTER TABLE `__new_member_stats` RENAME TO `member_stats`;--> statement-breakpoint
PRAGMA foreign_keys=ON;