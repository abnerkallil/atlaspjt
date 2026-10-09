CREATE TABLE `atlas_exam_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`discipline_id` text NOT NULL,
	`instrument` text DEFAULT 'exame_meio' NOT NULL,
	`status` text NOT NULL,
	`started_at` text NOT NULL,
	`deadline_at` text,
	`submitted_at` text,
	`scope_json` text NOT NULL,
	`questions_json` text NOT NULL,
	`answers_json` text,
	`result_json` text,
	`score` real,
	`passed` integer,
	`plan_version` integer NOT NULL,
	`corrector_version` integer,
	FOREIGN KEY (`discipline_id`) REFERENCES `atlas_disciplines`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_atlas_exam_attempts_discipline_instrument` ON `atlas_exam_attempts` (`discipline_id`,`instrument`);
