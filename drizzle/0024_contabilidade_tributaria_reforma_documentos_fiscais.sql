-- Novos nós de Contabilidade Tributária (unidade "Reforma tributária —
-- Documentos fiscais") a partir da apostila "Documentos Fiscais na Reforma
-- Tributária" (pedido do Abner, 2026-10-20): CT-118 a CT-124. Reaplica
-- também CT-108 a CT-117 porque a posição deles mudou (entraram 7 nós antes
-- na mesma disciplina) — o restante dos campos não muda. Gerado a partir do
-- diff de `pnpm run db:catalog` sobre lib/content-catalog.ts; a cópia
-- completa e sempre atual do catálogo fica em drizzle/0005_catalog_seed.sql
-- (migração 0005 já estava marcada como aplicada em produção antes deste
-- PR, então o wrangler não vai reexecutá-la — por isso os nós novos também
-- entram aqui, em migração nova).
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-118', 'contabilidade-tributaria', 108, 'Reforma tributária — Documentos fiscais', 'CST, cClassTrib e tributação no documento fiscal', 'Os 18 CST de IBS/CBS, oito indicadores, tabela cClassTrib, alíquotas, base de cálculo, reduções, regimes recorrentes, ZFM, cCredPres e o Imposto Seletivo no documento') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-119', 'contabilidade-tributaria', 109, 'Reforma tributária — Documentos fiscais', 'NF-e e NFC-e na Reforma Tributária', 'Estrutura do XML, gIBSCBS, totais do IBS/CBS/IS, vedações da NFC-e, referenciamento e rejeições por classificação ou cálculo') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-120', 'contabilidade-tributaria', 110, 'Reforma tributária — Documentos fiscais', 'NFS-e e DPS na Reforma Tributária', 'DPS, Emissor Nacional, ADN, cIndOp, Simples Nacional na NFS-e, operações com imóveis, vAjusteBC e DANFSe') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-121', 'contabilidade-tributaria', 111, 'Reforma tributária — Documentos fiscais', 'Correções, ajustes e eventos fiscais na Reforma', 'Nota de Débito e Crédito, Carta de Correção, Ajustes SINIEF, gAjusteCompet, CST 811, cClassTrib de ajuste e eventos fiscais') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-122', 'contabilidade-tributaria', 112, 'Reforma tributária — Documentos fiscais', 'Créditos e apuração assistida', 'Débito, extinção e crédito, conta-corrente por operação, demonstrativo, crédito presumido e eventos de crédito') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-123', 'contabilidade-tributaria', 113, 'Reforma tributária — Documentos fiscais', 'Cadastros, ERP, EFD e controles na Reforma Tributária', 'Parametrização do ERP, homologação x produção, EFD ICMS/IPI, cruzamentos eletrônicos, riscos e checklist de implantação') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-124', 'contabilidade-tributaria', 114, 'Reforma tributária — Documentos fiscais', 'Caso integrado: implantação da Reforma nos documentos fiscais', 'Estudo de caso ponta a ponta, calendário de adequação por perfil de cliente e síntese de controle') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-108', 'contabilidade-tributaria', 115, 'Governança e domínio', 'Calendário e fechamento fiscal integrado', 'Obrigações por regime/jurisdição, responsáveis, dependências, evidências e contingência') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-109', 'contabilidade-tributaria', 116, 'Governança e domínio', 'Cadastro e motor tributário', 'Produtos, serviços, clientes, fornecedores, NCM, CFOP, CST, regras e versionamento') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-110', 'contabilidade-tributaria', 117, 'Governança e domínio', 'Revisão e auditoria tributária', 'Testes substantivos, amostragem, reconciliações, documentação e materialidade') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-111', 'contabilidade-tributaria', 118, 'Governança e domínio', 'Passivo, certidões e processo tributário', 'Conta-corrente fiscal, intimações, autos, defesa administrativa, garantias e certidões') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-112', 'contabilidade-tributaria', 119, 'Governança e domínio', 'Planejamento tributário lícito', 'Elisão, evasão, simulação, substância, propósito negocial, cenários e documentação') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-113', 'contabilidade-tributaria', 120, 'Governança e domínio', 'Módulos setoriais e regimes especiais', 'Comércio exterior, indústria, serviços, construção, imobiliário/RET, agronegócio, terceiro setor e setor financeiro') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-114', 'contabilidade-tributaria', 121, 'Governança e domínio', 'Tributação internacional', 'Residência, fonte, tratados, preços de transferência, controladas no exterior e serviços transfronteiriços') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-115', 'contabilidade-tributaria', 122, 'Governança e domínio', 'Tax technology e dados fiscais', 'ERP, parametrização, XML, APIs, validações, automação, SQL/BI, segurança e trilha de auditoria') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-116', 'contabilidade-tributaria', 123, 'Governança e domínio', 'Capstone multirregime', 'Empresa simulada em Simples, Presumido e Real; documentos, apurações, obrigações, contabilização e decisão') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-117', 'contabilidade-tributaria', 124, 'Governança e domínio', 'Avaliação de domínio em Contabilidade Tributária', 'Prova teórica, casos, escrituração, apurações, SPED, reforma, defesa oral e auditoria de consistência') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-119', 'CT-118');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-120', 'CT-119');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-121', 'CT-120');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-122', 'CT-121');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-123', 'CT-122');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-124', 'CT-123');
