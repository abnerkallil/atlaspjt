CREATE TABLE `atlas_note_attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`note_id` text NOT NULL,
	`file_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`object_key` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`note_id`) REFERENCES `atlas_notes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_atlas_note_attachments_note_id` ON `atlas_note_attachments` (`note_id`);