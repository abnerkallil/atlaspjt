CREATE TABLE `atlas_note_versions` (
	`note_id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`content_json` text,
	`saved_at` text NOT NULL,
	`replaced_at` text NOT NULL,
	FOREIGN KEY (`note_id`) REFERENCES `atlas_notes`(`id`) ON UPDATE no action ON DELETE cascade
);
