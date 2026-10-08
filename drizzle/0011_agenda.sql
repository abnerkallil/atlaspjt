CREATE TABLE `atlas_agenda_items` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`content_id` text NOT NULL,
	`source_ref` text DEFAULT '' NOT NULL,
	`due_date` text NOT NULL,
	`start_time` text,
	`duration_minutes` integer NOT NULL,
	`priority` text DEFAULT 'normal' NOT NULL,
	`status` text DEFAULT 'pendente' NOT NULL,
	`reason` text NOT NULL,
	`change_reason` text,
	`original_date` text,
	`reschedule_count` integer DEFAULT 0 NOT NULL,
	`completion` text,
	`completed_at` text,
	`evidence_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`content_id`) REFERENCES `atlas_contents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`evidence_id`) REFERENCES `atlas_evidences`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_atlas_agenda_items_due` ON `atlas_agenda_items` (`due_date`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_atlas_agenda_items_pending` ON `atlas_agenda_items` (`kind`,`content_id`,`source_ref`) WHERE status = 'pendente';