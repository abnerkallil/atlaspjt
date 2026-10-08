ALTER TABLE `atlas_questions` ADD `subtopic_id` text REFERENCES atlas_subtopics(id);--> statement-breakpoint
ALTER TABLE `atlas_questions` ADD `knowledge_type` text;--> statement-breakpoint
ALTER TABLE `atlas_questions` ADD `origin` text;--> statement-breakpoint
ALTER TABLE `atlas_questions` ADD `exam_board` text;--> statement-breakpoint
ALTER TABLE `atlas_questions` ADD `exam_org` text;--> statement-breakpoint
ALTER TABLE `atlas_questions` ADD `exam_year` integer;--> statement-breakpoint
ALTER TABLE `atlas_questions` ADD `source_object_key` text;--> statement-breakpoint
ALTER TABLE `atlas_questions` ADD `text_hash` text;--> statement-breakpoint
ALTER TABLE `atlas_questions` ADD `option_explanations_json` text;--> statement-breakpoint
CREATE INDEX `idx_atlas_questions_subtopic` ON `atlas_questions` (`subtopic_id`);--> statement-breakpoint
CREATE INDEX `idx_atlas_questions_text_hash` ON `atlas_questions` (`text_hash`);