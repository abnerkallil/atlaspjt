CREATE TABLE `atlas_question_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`theme` text,
	`source_type` text NOT NULL,
	`exam_board` text,
	`exam_org` text,
	`exam_year` integer,
	`page_count` integer,
	`file_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`sha256` text NOT NULL,
	`object_key` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_atlas_question_sources_theme` ON `atlas_question_sources` (`theme`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_atlas_question_sources_sha256` ON `atlas_question_sources` (`sha256`);