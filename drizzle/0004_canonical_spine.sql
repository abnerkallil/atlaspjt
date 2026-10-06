CREATE TABLE `atlas_content_prerequisites` (
	`content_id` text NOT NULL,
	`prerequisite_id` text NOT NULL,
	PRIMARY KEY(`content_id`, `prerequisite_id`),
	FOREIGN KEY (`content_id`) REFERENCES `atlas_contents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`prerequisite_id`) REFERENCES `atlas_contents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_atlas_content_prerequisites_prerequisite` ON `atlas_content_prerequisites` (`prerequisite_id`);--> statement-breakpoint
CREATE TABLE `atlas_content_states` (
	`content_id` text PRIMARY KEY NOT NULL,
	`state` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`content_id`) REFERENCES `atlas_contents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `atlas_contents` (
	`id` text PRIMARY KEY NOT NULL,
	`discipline_id` text NOT NULL,
	`position` integer NOT NULL,
	`unit` text,
	`title` text NOT NULL,
	`keywords` text,
	`estimated_minutes` integer,
	FOREIGN KEY (`discipline_id`) REFERENCES `atlas_disciplines`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_atlas_contents_discipline` ON `atlas_contents` (`discipline_id`,`position`);--> statement-breakpoint
CREATE TABLE `atlas_discipline_states` (
	`discipline_id` text PRIMARY KEY NOT NULL,
	`state` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`discipline_id`) REFERENCES `atlas_disciplines`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `atlas_disciplines` (
	`id` text PRIMARY KEY NOT NULL,
	`phase_id` text NOT NULL,
	`position` integer NOT NULL,
	`title` text NOT NULL,
	FOREIGN KEY (`phase_id`) REFERENCES `atlas_phases`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_atlas_disciplines_phase` ON `atlas_disciplines` (`phase_id`,`position`);--> statement-breakpoint
CREATE TABLE `atlas_evidences` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text NOT NULL,
	`subtopic_id` text,
	`kind` text NOT NULL,
	`source_ref` text,
	`summary` text NOT NULL,
	`recorded_at` text NOT NULL,
	FOREIGN KEY (`content_id`) REFERENCES `atlas_contents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subtopic_id`) REFERENCES `atlas_subtopics`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_atlas_evidences_content` ON `atlas_evidences` (`content_id`,`recorded_at`);--> statement-breakpoint
CREATE INDEX `idx_atlas_evidences_subtopic` ON `atlas_evidences` (`subtopic_id`);--> statement-breakpoint
CREATE TABLE `atlas_phases` (
	`id` text PRIMARY KEY NOT NULL,
	`roadmap_id` text NOT NULL,
	`position` integer NOT NULL,
	`title` text NOT NULL,
	`summary` text,
	FOREIGN KEY (`roadmap_id`) REFERENCES `atlas_roadmaps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_atlas_phases_roadmap` ON `atlas_phases` (`roadmap_id`,`position`);--> statement-breakpoint
CREATE TABLE `atlas_roadmaps` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`origin` text DEFAULT 'curado' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `atlas_state_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`from_state` text NOT NULL,
	`to_state` text NOT NULL,
	`event` text NOT NULL,
	`actor` text NOT NULL,
	`reason` text NOT NULL,
	`evidence_id` text,
	`occurred_at` text NOT NULL,
	FOREIGN KEY (`evidence_id`) REFERENCES `atlas_evidences`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_atlas_state_audit_entity` ON `atlas_state_audit` (`entity_type`,`entity_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `idx_atlas_state_audit_occurred` ON `atlas_state_audit` (`occurred_at`);--> statement-breakpoint
CREATE TABLE `atlas_subtopics` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text NOT NULL,
	`position` integer NOT NULL,
	`title` text NOT NULL,
	`key_evidence` text,
	FOREIGN KEY (`content_id`) REFERENCES `atlas_contents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_atlas_subtopics_content` ON `atlas_subtopics` (`content_id`,`position`);