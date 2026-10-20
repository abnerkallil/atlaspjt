-- Mesma correção pontual de remap-contabilidade-existente.sql, mas para 2
-- rascunhos de regime tributário (pedido do Abner 2026-10-20): caíram em
-- content_label_id na curadoria por não baterem título exato, mas são o
-- mesmo assunto de nós que já existem em Contabilidade Tributária.
-- Roda uma vez: pnpm wrangler d1 execute <d1> --remote --file data/apolo/curadoria/remap-tributario-existente.sql --yes
UPDATE atlas_question_drafts SET content_id = 'CT-040', content_label_id = NULL WHERE text_hash = '798bbe5c' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CT-046', content_label_id = NULL WHERE text_hash = 'd5b97a60' AND status = 'pendente' AND content_id IS NULL;
