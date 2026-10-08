CREATE TABLE `drs_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`source_version` integer NOT NULL,
	`data` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `drs_reviews_match` ON `drs_reviews` (`match_id`);--> statement-breakpoint
CREATE TABLE `drs_setups` (
	`match_id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated` text NOT NULL
);
