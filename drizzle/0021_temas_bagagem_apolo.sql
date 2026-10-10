-- Bagagem inicial de temas do Apolo (DEC-014, APO-02): os 18 temas já usados
-- pelos 1.800 rascunhos das provas autorais (PR #67), para a tela /rascunhos
-- mostrar uma lista pronta em vez do Abner ter que digitar o tema toda vez.
-- Id = slug (mesma função themeSlug de lib/apolo/sources.ts), igual ao texto
-- livre já gravado em atlas_question_drafts.theme por esses rascunhos — então
-- o combo já vem com o tema certo selecionado para eles. Cadastrar tema novo
-- continua liberado a qualquer momento pela tela (POST /api/apolo/temas,
-- DEC-014: tema é etiqueta aberta, nunca enum fechado) — isto é só o ponto de
-- partida, não uma lista travada.
--> statement-breakpoint
INSERT INTO atlas_themes (id, title, parent_id, knowledge_area, created_at, updated_at) VALUES ('contabilidade', 'Contabilidade', NULL, 'sociais_aplicadas', '2026-10-10T00:00:00.000Z', '2026-10-10T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, knowledge_area = excluded.knowledge_area, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO atlas_themes (id, title, parent_id, knowledge_area, created_at, updated_at) VALUES ('contabilidade-geral', 'Contabilidade Geral', NULL, 'sociais_aplicadas', '2026-10-10T00:00:00.000Z', '2026-10-10T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, knowledge_area = excluded.knowledge_area, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO atlas_themes (id, title, parent_id, knowledge_area, created_at, updated_at) VALUES ('direito-tributario', 'Direito Tributário', NULL, 'juridico', '2026-10-10T00:00:00.000Z', '2026-10-10T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, knowledge_area = excluded.knowledge_area, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO atlas_themes (id, title, parent_id, knowledge_area, created_at, updated_at) VALUES ('tributacao', 'Tributação', NULL, 'juridico', '2026-10-10T00:00:00.000Z', '2026-10-10T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, knowledge_area = excluded.knowledge_area, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO atlas_themes (id, title, parent_id, knowledge_area, created_at, updated_at) VALUES ('direito-empresarial', 'Direito Empresarial', NULL, 'juridico', '2026-10-10T00:00:00.000Z', '2026-10-10T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, knowledge_area = excluded.knowledge_area, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO atlas_themes (id, title, parent_id, knowledge_area, created_at, updated_at) VALUES ('direito-eleitoral', 'Direito Eleitoral', NULL, 'juridico', '2026-10-10T00:00:00.000Z', '2026-10-10T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, knowledge_area = excluded.knowledge_area, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO atlas_themes (id, title, parent_id, knowledge_area, created_at, updated_at) VALUES ('direito-administrativo', 'Direito Administrativo', NULL, 'juridico', '2026-10-10T00:00:00.000Z', '2026-10-10T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, knowledge_area = excluded.knowledge_area, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO atlas_themes (id, title, parent_id, knowledge_area, created_at, updated_at) VALUES ('direito-constitucional', 'Direito Constitucional', NULL, 'juridico', '2026-10-10T00:00:00.000Z', '2026-10-10T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, knowledge_area = excluded.knowledge_area, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO atlas_themes (id, title, parent_id, knowledge_area, created_at, updated_at) VALUES ('matematica', 'Matemática', NULL, 'exatas', '2026-10-10T00:00:00.000Z', '2026-10-10T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, knowledge_area = excluded.knowledge_area, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO atlas_themes (id, title, parent_id, knowledge_area, created_at, updated_at) VALUES ('matematica-financeira', 'Matemática Financeira', NULL, 'exatas', '2026-10-10T00:00:00.000Z', '2026-10-10T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, knowledge_area = excluded.knowledge_area, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO atlas_themes (id, title, parent_id, knowledge_area, created_at, updated_at) VALUES ('estatistica', 'Estatística', NULL, 'exatas', '2026-10-10T00:00:00.000Z', '2026-10-10T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, knowledge_area = excluded.knowledge_area, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO atlas_themes (id, title, parent_id, knowledge_area, created_at, updated_at) VALUES ('raciocinio-logico', 'Raciocínio Lógico', NULL, 'exatas', '2026-10-10T00:00:00.000Z', '2026-10-10T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, knowledge_area = excluded.knowledge_area, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO atlas_themes (id, title, parent_id, knowledge_area, created_at, updated_at) VALUES ('dados', 'Dados', NULL, 'exatas', '2026-10-10T00:00:00.000Z', '2026-10-10T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, knowledge_area = excluded.knowledge_area, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO atlas_themes (id, title, parent_id, knowledge_area, created_at, updated_at) VALUES ('portugues', 'Português', NULL, 'linguagens', '2026-10-10T00:00:00.000Z', '2026-10-10T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, knowledge_area = excluded.knowledge_area, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO atlas_themes (id, title, parent_id, knowledge_area, created_at, updated_at) VALUES ('ingles', 'Inglês', NULL, 'linguagens', '2026-10-10T00:00:00.000Z', '2026-10-10T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, knowledge_area = excluded.knowledge_area, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO atlas_themes (id, title, parent_id, knowledge_area, created_at, updated_at) VALUES ('espanhol', 'Espanhol', NULL, 'linguagens', '2026-10-10T00:00:00.000Z', '2026-10-10T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, knowledge_area = excluded.knowledge_area, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO atlas_themes (id, title, parent_id, knowledge_area, created_at, updated_at) VALUES ('departamento-pessoal', 'Departamento Pessoal', NULL, 'sociais_aplicadas', '2026-10-10T00:00:00.000Z', '2026-10-10T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, knowledge_area = excluded.knowledge_area, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO atlas_themes (id, title, parent_id, knowledge_area, created_at, updated_at) VALUES ('departamento-fiscal', 'Departamento Fiscal', NULL, 'sociais_aplicadas', '2026-10-10T00:00:00.000Z', '2026-10-10T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, knowledge_area = excluded.knowledge_area, updated_at = excluded.updated_at;
