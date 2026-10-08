CREATE TABLE `assistant_locks` (
	`owner` text PRIMARY KEY NOT NULL,
	`nonce` text NOT NULL,
	`expires` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `assistant_usage` (
	`scope` text NOT NULL,
	`period` text NOT NULL,
	`tokens` integer DEFAULT 0 NOT NULL,
	`requests` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `assistant_usage_scope_period` ON `assistant_usage` (`scope`,`period`);--> statement-breakpoint
CREATE TABLE `external_score_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`updated` text NOT NULL,
	`next_attempt` text NOT NULL,
	`lease` text
);
--> statement-breakpoint
CREATE TABLE `score_follows` (
	`owner` text NOT NULL,
	`match_id` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `score_follow_unique` ON `score_follows` (`owner`,`match_id`);