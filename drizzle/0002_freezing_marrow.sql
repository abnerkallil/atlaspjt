ALTER TABLE `atlas_notes` ADD `last_interacted_at` text;--> statement-breakpoint
CREATE INDEX `idx_atlas_notes_last_interacted_at` ON `atlas_notes` (`last_interacted_at`);