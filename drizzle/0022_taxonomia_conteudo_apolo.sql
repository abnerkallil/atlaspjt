-- Taxonomia "matéria › conteúdo" fora do roadmap atual (APO-02/DEC-014, Eixo
-- 2, pedido do Abner 2026-10-12): o roadmap curado só cobre Contabilidade
-- Geral/Tributária, mas os rascunhos cobrem 18 temas. Enquanto não há roadmap
-- real para os outros, a curadoria rotula aqui (aberta, sem enum, como
-- atlas_themes) em vez de content_id apontar para algo que não existe.
CREATE TABLE `atlas_content_taxonomy` (
	`id` text PRIMARY KEY NOT NULL,
	`theme_id` text NOT NULL,
	`title` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`theme_id`) REFERENCES `atlas_themes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_atlas_content_taxonomy_theme` ON `atlas_content_taxonomy` (`theme_id`);
--> statement-breakpoint
ALTER TABLE `atlas_question_drafts` ADD `content_label_id` text REFERENCES atlas_content_taxonomy(id) ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX `idx_atlas_question_drafts_content_label` ON `atlas_question_drafts` (`content_label_id`);
