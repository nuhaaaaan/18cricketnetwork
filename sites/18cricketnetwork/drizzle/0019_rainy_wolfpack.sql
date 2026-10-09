CREATE TABLE `api_rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`bucket` integer NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `api_rate_limits_expiry` ON `api_rate_limits` (`expires`);