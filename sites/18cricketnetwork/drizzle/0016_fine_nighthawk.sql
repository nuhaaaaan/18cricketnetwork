CREATE TABLE `team_calls` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `team_calls_team` ON `team_calls` (`team_id`);--> statement-breakpoint
CREATE TABLE `team_events` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`actor` text NOT NULL,
	`kind` text NOT NULL,
	`data` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `team_events_team_created` ON `team_events` (`team_id`,`created`);--> statement-breakpoint
CREATE TABLE `team_hubs` (
	`team_id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `team_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`sender` text NOT NULL,
	`recipient` text,
	`fixture_id` text,
	`kind` text NOT NULL,
	`body` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `team_messages_team_created` ON `team_messages` (`team_id`,`created`);--> statement-breakpoint
CREATE TABLE `team_notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`team_id` text NOT NULL,
	`data` text NOT NULL,
	`created` text NOT NULL,
	`read_at` text
);
--> statement-breakpoint
CREATE INDEX `team_notifications_owner_created` ON `team_notifications` (`owner`,`created`);--> statement-breakpoint
CREATE TABLE `team_signals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`call_id` text NOT NULL,
	`sender` text NOT NULL,
	`recipient` text NOT NULL,
	`data` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `team_signals_recipient` ON `team_signals` (`call_id`,`recipient`,`id`);