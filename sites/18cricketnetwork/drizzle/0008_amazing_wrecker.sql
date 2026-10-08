CREATE TABLE `competition_admins` (
	`competition_id` text NOT NULL,
	`owner` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `competition_admin_unique` ON `competition_admins` (`competition_id`,`owner`);--> statement-breakpoint
CREATE TABLE `content_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`owner` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reason` text,
	`created` text NOT NULL,
	`reviewed_by` text,
	`reviewed_at` text
);
--> statement-breakpoint
CREATE TABLE `match_changes` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`owner` text NOT NULL,
	`data` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created` text NOT NULL,
	`reviewed_by` text,
	`reviewed_at` text
);
