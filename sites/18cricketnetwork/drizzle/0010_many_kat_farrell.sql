CREATE TABLE `report_annotations` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`owner` text NOT NULL,
	`kind` text NOT NULL,
	`visibility` text NOT NULL,
	`source_version` integer NOT NULL,
	`data` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `report_annotations_match` ON `report_annotations` (`match_id`);