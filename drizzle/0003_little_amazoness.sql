CREATE TABLE `atlas_note_folders` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `atlas_notes` ADD `folder_id` text REFERENCES atlas_note_folders(id);--> statement-breakpoint
ALTER TABLE `atlas_notes` ADD `is_private` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_atlas_notes_folder_id` ON `atlas_notes` (`folder_id`);