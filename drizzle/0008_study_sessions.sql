CREATE TABLE `atlas_study_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text NOT NULL,
	`status` text NOT NULL,
	`started_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`last_resumed_at` text,
	`active_seconds` integer DEFAULT 0 NOT NULL,
	`checkpoint_json` text,
	`finished_at` text,
	`evidence_id` text,
	FOREIGN KEY (`content_id`) REFERENCES `atlas_contents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`evidence_id`) REFERENCES `atlas_evidences`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_atlas_study_sessions_content` ON `atlas_study_sessions` (`content_id`,`started_at`);--> statement-breakpoint
CREATE INDEX `idx_atlas_study_sessions_updated` ON `atlas_study_sessions` (`status`,`updated_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_atlas_study_sessions_open_content` ON `atlas_study_sessions` (`content_id`) WHERE status <> 'concluida';