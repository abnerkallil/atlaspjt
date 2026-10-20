CREATE TABLE `atlas_apache_lessons` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text NOT NULL,
	`status` text DEFAULT 'pendente' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`model` text,
	`object_key` text,
	`generated_at` text,
	`reported_count` integer DEFAULT 0 NOT NULL,
	`error_message` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`content_id`) REFERENCES `atlas_contents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_atlas_apache_lessons_content` ON `atlas_apache_lessons` (`content_id`);
--> statement-breakpoint
CREATE TABLE `atlas_apache_enrichments` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'processando' NOT NULL,
	`object_key` text,
	`source_file_hash` text,
	`pages_used` integer DEFAULT 0 NOT NULL,
	`partial_result` text,
	`error_message` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`content_id`) REFERENCES `atlas_contents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_atlas_apache_enrichments_content_user` ON `atlas_apache_enrichments` (`content_id`,`user_id`);
--> statement-breakpoint
CREATE INDEX `idx_atlas_apache_enrichments_hash` ON `atlas_apache_enrichments` (`source_file_hash`);
--> statement-breakpoint
CREATE TABLE `atlas_apache_quota` (
	`user_id` text PRIMARY KEY NOT NULL,
	`window_start` text NOT NULL,
	`pages_used` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `atlas_apache_queue` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text NOT NULL,
	`kind` text DEFAULT 'aula' NOT NULL,
	`user_id` text,
	`status` text DEFAULT 'pendente' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`temp_object_key` text,
	`created_at` text NOT NULL,
	`processed_at` text,
	FOREIGN KEY (`content_id`) REFERENCES `atlas_contents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_atlas_apache_queue_status` ON `atlas_apache_queue` (`status`,`created_at`);
--> statement-breakpoint
CREATE INDEX `idx_atlas_apache_queue_content_kind_status` ON `atlas_apache_queue` (`content_id`,`kind`,`status`);
--> statement-breakpoint
CREATE TABLE `atlas_apache_neuron_meter` (
	`day` text PRIMARY KEY NOT NULL,
	`neurons_used` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
