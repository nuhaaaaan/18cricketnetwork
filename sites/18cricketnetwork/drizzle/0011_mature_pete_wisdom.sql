CREATE TABLE `camera_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`active_slot` text,
	`owner` text NOT NULL,
	`match_id` text NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `camera_active_slot_unique` ON `camera_sessions` (`active_slot`);--> statement-breakpoint
CREATE TABLE `hardware_catalog` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `hardware_devices` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`serial_hash` text NOT NULL,
	`token_hash` text,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hardware_serial_unique` ON `hardware_devices` (`serial_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `hardware_token_unique` ON `hardware_devices` (`token_hash`);--> statement-breakpoint
CREATE TABLE `hardware_enquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`product_id` text NOT NULL,
	`data` text NOT NULL,
	`created` text NOT NULL
);
