CREATE TABLE `carpool_blocks` (
	`owner` text NOT NULL,
	`target` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `carpool_block_pair` ON `carpool_blocks` (`owner`,`target`);--> statement-breakpoint
CREATE TABLE `carpool_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`ride_id` text NOT NULL,
	`request_id` text NOT NULL,
	`sender` text NOT NULL,
	`body` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `carpool_messages_request` ON `carpool_messages` (`request_id`,`created`);--> statement-breakpoint
CREATE TABLE `carpool_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`ride_id` text NOT NULL,
	`data` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `carpool_reports_created` ON `carpool_reports` (`created`);--> statement-breakpoint
CREATE TABLE `carpool_rides` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `carpool_rides_owner` ON `carpool_rides` (`owner`);