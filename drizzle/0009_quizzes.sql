CREATE TABLE `atlas_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text NOT NULL,
	`position` integer NOT NULL,
	`kind` text NOT NULL,
	`prompt` text NOT NULL,
	`context` text,
	`options_json` text,
	`correct_option` integer,
	`model_answer` text,
	`expected_value` real,
	`tolerance` real,
	`verification_json` text,
	`explanation` text NOT NULL,
	`source` text DEFAULT 'curado' NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`content_id`) REFERENCES `atlas_contents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_atlas_questions_content` ON `atlas_questions` (`content_id`,`position`);--> statement-breakpoint
CREATE TABLE `atlas_quiz_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text NOT NULL,
	`purpose` text DEFAULT 'quiz' NOT NULL,
	`status` text NOT NULL,
	`started_at` text NOT NULL,
	`deadline_at` text,
	`submitted_at` text,
	`questions_json` text NOT NULL,
	`answers_json` text,
	`result_json` text,
	`score` real,
	`passed` integer,
	`evidence_id` text,
	FOREIGN KEY (`content_id`) REFERENCES `atlas_contents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`evidence_id`) REFERENCES `atlas_evidences`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_atlas_quiz_attempts_content` ON `atlas_quiz_attempts` (`content_id`,`started_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_atlas_quiz_attempts_open` ON `atlas_quiz_attempts` (`content_id`,`purpose`) WHERE status <> 'enviado';