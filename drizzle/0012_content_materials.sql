CREATE TABLE `atlas_content_materials` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`url` text,
	`file_name` text,
	`mime_type` text,
	`size_bytes` integer,
	`object_key` text,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`content_id`) REFERENCES `atlas_contents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_atlas_content_materials_content` ON `atlas_content_materials` (`content_id`,`position`);