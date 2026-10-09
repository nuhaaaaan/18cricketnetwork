CREATE TABLE `cricket_contests` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`owner` text NOT NULL,
	`lock_at` text NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `cricket_contests_match` ON `cricket_contests` (`match_id`);--> statement-breakpoint
CREATE TABLE `cricket_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`contest_id` text NOT NULL,
	`owner` text NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cricket_entry_member` ON `cricket_entries` (`contest_id`,`owner`);