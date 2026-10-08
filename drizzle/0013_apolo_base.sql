CREATE TABLE `atlas_item_models` (
	`id` text PRIMARY KEY NOT NULL,
	`theme` text NOT NULL,
	`title` text NOT NULL,
	`kind` text NOT NULL,
	`generator_key` text NOT NULL,
	`params_json` text NOT NULL,
	`bloom_level` text,
	`difficulty_nominal` text,
	`lifecycle_state` text DEFAULT 'rascunho' NOT NULL,
	`curated_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_atlas_item_models_theme` ON `atlas_item_models` (`theme`,`lifecycle_state`);--> statement-breakpoint
ALTER TABLE `atlas_questions` ADD `theme` text;--> statement-breakpoint
ALTER TABLE `atlas_questions` ADD `bloom_level` text;--> statement-breakpoint
ALTER TABLE `atlas_questions` ADD `difficulty_nominal` text;--> statement-breakpoint
ALTER TABLE `atlas_questions` ADD `lifecycle_state` text DEFAULT 'ativa' NOT NULL;--> statement-breakpoint
ALTER TABLE `atlas_questions` ADD `item_model_id` text;--> statement-breakpoint
CREATE INDEX `idx_atlas_questions_theme` ON `atlas_questions` (`theme`);--> statement-breakpoint
CREATE INDEX `idx_atlas_questions_item_model` ON `atlas_questions` (`item_model_id`);