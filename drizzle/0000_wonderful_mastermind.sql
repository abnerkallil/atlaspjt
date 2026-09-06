CREATE TABLE `atlas_note_links` (
	`note_id` text NOT NULL,
	`content_id` text NOT NULL,
	`content_title` text NOT NULL,
	`subject` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`note_id`, `content_id`),
	FOREIGN KEY (`note_id`) REFERENCES `atlas_notes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_atlas_note_links_content_id` ON `atlas_note_links` (`content_id`);--> statement-breakpoint
CREATE TABLE `atlas_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_atlas_notes_updated_at` ON `atlas_notes` (`updated_at`);--> statement-breakpoint
CREATE TABLE `atlas_sync_operations` (
	`id` text PRIMARY KEY NOT NULL,
	`idempotency_key` text NOT NULL,
	`note_id` text NOT NULL,
	`operation_type` text NOT NULL,
	`payload_json` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_atlas_sync_operations_idempotency` ON `atlas_sync_operations` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `idx_atlas_sync_operations_status_updated` ON `atlas_sync_operations` (`status`,`updated_at`);--> statement-breakpoint
CREATE INDEX `idx_atlas_sync_operations_note_id` ON `atlas_sync_operations` (`note_id`);