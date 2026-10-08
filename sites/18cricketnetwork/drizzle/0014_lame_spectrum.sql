CREATE TABLE `platform_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`submission_key` text NOT NULL,
	`email` text,
	`data` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`internal_note` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `platform_feedback_submission_unique` ON `platform_feedback` (`owner`,`submission_key`);--> statement-breakpoint
CREATE INDEX `platform_feedback_owner_created` ON `platform_feedback` (`owner`,`created`);