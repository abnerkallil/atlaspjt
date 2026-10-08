CREATE TABLE `atlas_themes` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`parent_id` text,
	`knowledge_area` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_atlas_themes_parent` ON `atlas_themes` (`parent_id`);--> statement-breakpoint
CREATE INDEX `idx_atlas_themes_knowledge_area` ON `atlas_themes` (`knowledge_area`);--> statement-breakpoint
ALTER TABLE `atlas_contents` ADD `theme_id` text REFERENCES atlas_themes(id);--> statement-breakpoint
CREATE INDEX `idx_atlas_contents_theme` ON `atlas_contents` (`theme_id`);