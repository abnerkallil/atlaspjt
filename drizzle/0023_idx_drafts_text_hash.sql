-- Corrige o estouro de leitura do D1 (free tier, 5M rows read/dia) que
-- derrubou Hoje/Agenda, Continue de onde parou e O Atlas observou na noite
-- de 2026-10-12→13: scripts/apolo-aplicar-curadoria.mjs faz um UPDATE por
-- classificação filtrando por text_hash, e atlas_question_drafts não tinha
-- índice nessa coluna (diferente de atlas_questions, que já tem
-- idx_atlas_questions_text_hash) — cada UPDATE varria a tabela inteira.
CREATE INDEX `idx_atlas_question_drafts_text_hash` ON `atlas_question_drafts` (`text_hash`);
