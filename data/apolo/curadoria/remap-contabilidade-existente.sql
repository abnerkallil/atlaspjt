-- Correção pontual (pedido do Abner 2026-10-13/20): 36 rascunhos de
-- Contabilidade caíram em content_label_id (atlas_content_taxonomy) na
-- curadoria de 2026-10-12 por não baterem o título exato de um nó do
-- roadmap, mas são o mesmo assunto de um CG-0XX já existente (ex.: "Ativo
-- (conceito)" = CG-008 "Contas patrimoniais"). Isto só troca o
-- content_label_id por esse content_id correto — não cria nó novo, não
-- aprova nada (DEC-014 continua exigindo revisão humana em /rascunhos).
-- Roda uma vez: pnpm wrangler d1 execute <d1> --remote --file data/apolo/curadoria/remap-contabilidade-existente.sql --yes
UPDATE atlas_question_drafts SET content_id = 'CG-037', content_label_id = NULL WHERE text_hash = '4a241b3e' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-036', content_label_id = NULL WHERE text_hash = '77a5e4c2' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-037', content_label_id = NULL WHERE text_hash = '737b16b8' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-031', content_label_id = NULL WHERE text_hash = '5c111402' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-021', content_label_id = NULL WHERE text_hash = '4731403e' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-036', content_label_id = NULL WHERE text_hash = '1d3a7cc8' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-031', content_label_id = NULL WHERE text_hash = 'e8c1c840' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-036', content_label_id = NULL WHERE text_hash = '9644852a' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-023', content_label_id = NULL WHERE text_hash = '922f688b' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-013', content_label_id = NULL WHERE text_hash = 'c54c5ae5' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-036', content_label_id = NULL WHERE text_hash = 'f8d5c28c' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-031', content_label_id = NULL WHERE text_hash = '6e7fdf4e' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-024', content_label_id = NULL WHERE text_hash = '195b4601' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-038', content_label_id = NULL WHERE text_hash = 'c57da53e' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-039', content_label_id = NULL WHERE text_hash = '9cf7e44d' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-038', content_label_id = NULL WHERE text_hash = 'bf1f0014' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-031', content_label_id = NULL WHERE text_hash = '711efacd' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-031', content_label_id = NULL WHERE text_hash = '9223572c' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-031', content_label_id = NULL WHERE text_hash = '72116d18' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-036', content_label_id = NULL WHERE text_hash = '867cd29b' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-036', content_label_id = NULL WHERE text_hash = '60f10376' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-031', content_label_id = NULL WHERE text_hash = '2d99dc33' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-021', content_label_id = NULL WHERE text_hash = '4e04e7bb' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-031', content_label_id = NULL WHERE text_hash = '9cfe8d4d' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-037', content_label_id = NULL WHERE text_hash = '85689676' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-036', content_label_id = NULL WHERE text_hash = '06608f5f' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-003', content_label_id = NULL WHERE text_hash = '22118fcf' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-008', content_label_id = NULL WHERE text_hash = '69436aee' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-003', content_label_id = NULL WHERE text_hash = 'f562782b' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-036', content_label_id = NULL WHERE text_hash = '810cb96d' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-036', content_label_id = NULL WHERE text_hash = 'd9eec166' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-008', content_label_id = NULL WHERE text_hash = '4755d572' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-015', content_label_id = NULL WHERE text_hash = 'aba48078' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-037', content_label_id = NULL WHERE text_hash = '5fd48ee1' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-022', content_label_id = NULL WHERE text_hash = '56f21e46' AND status = 'pendente' AND content_id IS NULL;
UPDATE atlas_question_drafts SET content_id = 'CG-022', content_label_id = NULL WHERE text_hash = '36c8a036' AND status = 'pendente' AND content_id IS NULL;
