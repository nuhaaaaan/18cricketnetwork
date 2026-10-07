CREATE TABLE `delivery_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`seller` text NOT NULL,
	`buyer` text NOT NULL,
	`rider` text,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `delivery_order_unique` ON `delivery_jobs` (`order_id`);--> statement-breakpoint
CREATE TABLE `payment_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`role` text NOT NULL,
	`provider` text NOT NULL,
	`account_id` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_account_owner_role` ON `payment_accounts` (`owner`,`role`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_id` text NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_order_unique` ON `payments` (`order_id`);--> statement-breakpoint
CREATE TABLE `payout_ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`owner` text NOT NULL,
	`role` text NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payout_order_role` ON `payout_ledger` (`order_id`,`role`);--> statement-breakpoint
CREATE TABLE `platform_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rider_profiles` (
	`owner` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
