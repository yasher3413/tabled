CREATE TABLE `bill_excerpts` (
	`bill_id` text NOT NULL,
	`ordinal` integer NOT NULL,
	`date` text NOT NULL,
	`member_id` text NOT NULL,
	`party_id` text NOT NULL,
	`text_en` text NOT NULL,
	`text_fr` text,
	`url` text NOT NULL,
	PRIMARY KEY(`bill_id`, `ordinal`),
	FOREIGN KEY (`bill_id`) REFERENCES `bills`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`party_id`) REFERENCES `parties`(`id`) ON UPDATE no action ON DELETE no action
);
