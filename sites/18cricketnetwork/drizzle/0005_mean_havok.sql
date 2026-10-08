CREATE TABLE `business_leads` (
	`id` text PRIMARY KEY NOT NULL,
	`record_id` text NOT NULL,
	`owner` text NOT NULL,
	`visitor` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`consent_version` text NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `business_lead_listing_visitor` ON `business_leads` (`record_id`,`visitor`);--> statement-breakpoint
CREATE INDEX `business_leads_owner_created` ON `business_leads` (`owner`,`created`);--> statement-breakpoint
CREATE TABLE `listing_visits` (
	`record_id` text NOT NULL,
	`owner` text NOT NULL,
	`visitor` text NOT NULL,
	`day` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `listing_visit_daily` ON `listing_visits` (`record_id`,`visitor`,`day`);--> statement-breakpoint
CREATE INDEX `listing_visits_owner_day` ON `listing_visits` (`owner`,`day`);--> statement-breakpoint
CREATE TABLE `memberships` (
	`owner` text NOT NULL,
	`role` text NOT NULL,
	`country` text NOT NULL,
	`status` text DEFAULT 'basic' NOT NULL,
	`expires` text,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `membership_owner_role` ON `memberships` (`owner`,`role`);