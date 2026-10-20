-- Novos nos de roadmap para cobrir rascunhos de Apolo fora do roadmap (curadoria 2026-10-12):
--> statement-breakpoint
-- 3 disciplinas novas (Contabilidade de Custos, Analise das Demonstracoes Financeiras,
--> statement-breakpoint
-- Contabilidade Avancada) + CG-041 (Principios contabeis fundamentais).
--> statement-breakpoint
-- A migracao 0005 ja esta aplicada em producao e nao e reexecutada pelo wrangler,
--> statement-breakpoint
-- entao o catalogo completo (lib/content-catalog.ts) tambem foi regenerado nela
--> statement-breakpoint
-- (pnpm run db:catalog) so para ambientes novos; esta migracao e o que de fato
--> statement-breakpoint
-- entra em producao. Idempotente (ON CONFLICT DO UPDATE).
--> statement-breakpoint
INSERT INTO atlas_phases (id, roadmap_id, position, title, summary) VALUES ('fase-contabilidade-custos', 'atlas-contabil', 3, 'Contabilidade de Custos', 'Classificação de custos, avaliação de estoque, markup e ponto de equilíbrio.') ON CONFLICT(id) DO UPDATE SET position = excluded.position, title = excluded.title, summary = excluded.summary;
--> statement-breakpoint
INSERT INTO atlas_phases (id, roadmap_id, position, title, summary) VALUES ('fase-analise-demonstracoes', 'atlas-contabil', 4, 'Análise das Demonstrações Financeiras', 'Liquidez, capital de giro, rentabilidade e indicadores combinados de análise.') ON CONFLICT(id) DO UPDATE SET position = excluded.position, title = excluded.title, summary = excluded.summary;
--> statement-breakpoint
INSERT INTO atlas_phases (id, roadmap_id, position, title, summary) VALUES ('fase-contabilidade-avancada', 'atlas-contabil', 5, 'Contabilidade Avançada', 'Intangíveis, consolidação, provisões, mensuração avançada e demonstrações complementares.') ON CONFLICT(id) DO UPDATE SET position = excluded.position, title = excluded.title, summary = excluded.summary;
--> statement-breakpoint
INSERT INTO atlas_disciplines (id, phase_id, position, title) VALUES ('contabilidade-custos', 'fase-contabilidade-custos', 1, 'Contabilidade de Custos') ON CONFLICT(id) DO UPDATE SET position = excluded.position, title = excluded.title;
--> statement-breakpoint
INSERT INTO atlas_disciplines (id, phase_id, position, title) VALUES ('analise-demonstracoes', 'fase-analise-demonstracoes', 1, 'Análise das Demonstrações Financeiras') ON CONFLICT(id) DO UPDATE SET position = excluded.position, title = excluded.title;
--> statement-breakpoint
INSERT INTO atlas_disciplines (id, phase_id, position, title) VALUES ('contabilidade-avancada', 'fase-contabilidade-avancada', 1, 'Contabilidade Avançada') ON CONFLICT(id) DO UPDATE SET position = excluded.position, title = excluded.title;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-001', 'contabilidade-geral', 1, 'Fundamentos', 'Conceitos iniciais da contabilidade', 'Objeto, finalidade, campo de aplicação, usuários e informação contábil') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-002', 'contabilidade-geral', 2, 'Fundamentos', 'Patrimônio', 'Bens, direitos, obrigações e representação patrimonial') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-003', 'contabilidade-geral', 3, 'Fundamentos', 'Patrimônio Líquido e equação patrimonial', 'Capital, reservas, resultados e Ativo = Passivo + PL') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-004', 'contabilidade-geral', 4, 'Fundamentos', 'Situações patrimoniais', 'Situação líquida positiva, nula, negativa e passivo a descoberto') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-005', 'contabilidade-geral', 5, 'Fundamentos', 'Atos e fatos administrativos', 'Atos; fatos permutativos, modificativos e mistos') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-006', 'contabilidade-geral', 6, 'Fundamentos', 'Variações patrimoniais', 'Variações qualitativas e quantitativas; resultado e patrimônio') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-041', 'contabilidade-geral', 7, 'Fundamentos', 'Princípios contábeis fundamentais', 'Prudência, continuidade, entidade, oportunidade, custo histórico e demais princípios de contabilidade') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-007', 'contabilidade-geral', 8, 'Contas', 'Conceito, função e estrutura das contas', 'Título, objeto, débito, crédito, saldo e função') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-008', 'contabilidade-geral', 9, 'Contas', 'Contas patrimoniais', 'Ativo, passivo e patrimônio líquido; natureza dos saldos') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-009', 'contabilidade-geral', 10, 'Contas', 'Contas de resultado', 'Receitas, custos e despesas; encerramento dos saldos') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-010', 'contabilidade-geral', 11, 'Contas', 'Teoria Personalista', 'Agentes consignatários, correspondentes e proprietários') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-011', 'contabilidade-geral', 12, 'Contas', 'Teoria Materialista', 'Contas integrais e diferenciais') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-012', 'contabilidade-geral', 13, 'Contas', 'Teoria Patrimonialista', 'Contas patrimoniais e contas de resultado') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-013', 'contabilidade-geral', 14, 'Contas', 'Plano e manual de contas', 'Estrutura, codificação, níveis e adaptação ao negócio') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-014', 'contabilidade-geral', 15, 'Mecânica contábil', 'Natureza devedora e credora', 'Aumentos, diminuições e saldos por grupo') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-015', 'contabilidade-geral', 16, 'Mecânica contábil', 'Método das partidas dobradas', 'Origem, aplicação e igualdade entre débitos e créditos') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-016', 'contabilidade-geral', 17, 'Mecânica contábil', 'Lançamentos contábeis', 'Elementos, fórmulas, histórico e análise do fato') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-017', 'contabilidade-geral', 18, 'Mecânica contábil', 'Livros Diário e Razão', 'Escrituração cronológica, sistemática e razonetes') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-018', 'contabilidade-geral', 19, 'Mecânica contábil', 'Escrituração contábil', 'Formalidades, documentação, método e encadeamento') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-019', 'contabilidade-geral', 20, 'Mecânica contábil', 'Balancete de verificação', 'Saldos, movimentação, conferência e limitações') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-020', 'contabilidade-geral', 21, 'Mecânica contábil', 'Erros e correções de escrituração', 'Estorno, transferência, complementação e ressalva') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-021', 'contabilidade-geral', 22, 'Reconhecimento', 'Regime de caixa e de competência', 'Fato gerador, recebimento, pagamento e período contábil') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-022', 'contabilidade-geral', 23, 'Reconhecimento', 'Receitas, custos e despesas', 'Reconhecimento, classificação e impacto no resultado') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-023', 'contabilidade-geral', 24, 'Reconhecimento', 'Apuração do Resultado do Exercício', 'Encerramento das contas de resultado e transferência ao PL') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-024', 'contabilidade-geral', 25, 'Reconhecimento', 'Ajustes por competência', 'Antecipações, apropriações, receitas a apropriar e estimativas') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-025', 'contabilidade-geral', 26, 'Operações usuais', 'Caixa, bancos e conciliação', 'Disponibilidades, transferências, tarifas e divergências') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-026', 'contabilidade-geral', 27, 'Operações usuais', 'Clientes e contas a receber', 'Vendas a prazo, recebimentos, descontos e perdas') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-027', 'contabilidade-geral', 28, 'Operações usuais', 'Compras, vendas e estoques', 'Entradas, saídas, devoluções e abatimentos') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-028', 'contabilidade-geral', 29, 'Operações usuais', 'Custo das Mercadorias Vendidas', 'Inventário periódico e permanente; EI + C - EF') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-029', 'contabilidade-geral', 30, 'Operações usuais', 'Tributos nas compras e vendas', 'Tributos recuperáveis, incidentes sobre vendas e apresentação') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-030', 'contabilidade-geral', 31, 'Operações usuais', 'Folha de pagamento', 'Salários, encargos, retenções, provisões e pagamento') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-031', 'contabilidade-geral', 32, 'Operações usuais', 'Imobilizado, intangível e depreciação', 'Reconhecimento, custo, vida útil, amortização e baixa') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-032', 'contabilidade-geral', 33, 'Operações usuais', 'Empréstimos, financiamentos e juros', 'Principal, encargos, prazos e apropriação') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-033', 'contabilidade-geral', 34, 'Operações usuais', 'Provisões e contingências — introdução', 'Obrigação presente, estimativa, reconhecimento e divulgação') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-034', 'contabilidade-geral', 35, 'Operações usuais', 'Operações com Patrimônio Líquido', 'Capital, integralização, reservas, dividendos e resultados') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-035', 'contabilidade-geral', 36, 'Fechamento', 'Rotina de fechamento contábil', 'Conciliações, ajustes, reclassificações e encerramento') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-036', 'contabilidade-geral', 37, 'Demonstrações', 'Balanço Patrimonial', 'Estrutura, circulante, não circulante e apresentação') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-037', 'contabilidade-geral', 38, 'Demonstrações', 'Demonstração do Resultado do Exercício', 'Estrutura, receitas, custos, despesas e resultado líquido') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-038', 'contabilidade-geral', 39, 'Demonstrações', 'DLPA, DMPL e DFC — fundamentos', 'Movimentação do PL e introdução aos fluxos de caixa') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-039', 'contabilidade-geral', 40, 'Demonstrações', 'Notas explicativas e políticas contábeis', 'Contexto, políticas, estimativas e informações complementares') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-040', 'contabilidade-geral', 41, 'Integração prática', 'Ciclo contábil completo', 'Documentos, lançamentos, Razão, balancete, ajustes, fechamento e demonstrações') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CC-001', 'contabilidade-custos', 1, 'Fundamentos de custos', 'Classificação de custos e CPV industrial', 'Custos fixos e variáveis, diretos e indiretos, custo dos produtos vendidos em empresa industrial') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CC-002', 'contabilidade-custos', 2, 'Fundamentos de custos', 'Métodos de avaliação de estoque', 'PEPS, UEPS e custo médio ponderado na avaliação de estoques') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CC-003', 'contabilidade-custos', 3, 'Formação de preço e decisão', 'Markup e formação de preço de venda', 'Cálculo de markup, margem de lucro desejada e composição do preço de venda') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CC-004', 'contabilidade-custos', 4, 'Formação de preço e decisão', 'Ponto de equilíbrio e margem de contribuição', 'Margem de contribuição, custos fixos e ponto de equilíbrio contábil, econômico e financeiro') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('AD-001', 'analise-demonstracoes', 1, 'Liquidez e capital de giro', 'Índices de liquidez e Capital Circulante Líquido', 'Liquidez corrente, seca, geral e imediata; CCL (Capital Circulante Líquido)') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('AD-002', 'analise-demonstracoes', 2, 'Liquidez e capital de giro', 'Giro de estoque e indicadores de giro', 'Giro de estoque, prazo médio de estocagem e indicadores de rotatividade') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('AD-003', 'analise-demonstracoes', 3, 'Rentabilidade e indicadores combinados', 'Margem de lucro bruto e lucro bruto', 'Lucro bruto, margem bruta e sua leitura na análise de balanços') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('AD-004', 'analise-demonstracoes', 4, 'Rentabilidade e indicadores combinados', 'Margem líquida e indicadores de rentabilidade', 'Margem líquida, ROE e ROA na análise de rentabilidade') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('AD-005', 'analise-demonstracoes', 5, 'Rentabilidade e indicadores combinados', 'EBITDA e indicadores combinados de análise', 'EBITDA, margem EBITDA e leitura combinada de liquidez, rentabilidade e giro') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('AD-006', 'analise-demonstracoes', 6, 'Rentabilidade e indicadores combinados', 'TIR, VPL e análise de investimentos', 'Taxa interna de retorno, valor presente líquido e viabilidade de investimentos') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CA-001', 'contabilidade-avancada', 1, 'Ativos intangíveis e investimentos', 'Ativos intangíveis, goodwill e equivalência patrimonial', 'Intangíveis, ágio/goodwill e método de equivalência patrimonial (MEP)') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CA-002', 'contabilidade-avancada', 2, 'Ativos intangíveis e investimentos', 'Consolidação de demonstrações financeiras', 'Consolidação de balanços entre controladora e controladas (CPC 36)') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CA-003', 'contabilidade-avancada', 3, 'Reconhecimento e mensuração avançada', 'Provisões, contingências e impairment', 'Provisões e passivos contingentes (CPC 25) e teste de redução ao valor recuperável (CPC 01)') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CA-004', 'contabilidade-avancada', 4, 'Reconhecimento e mensuração avançada', 'Mensuração a valor justo e ajuste a valor presente', 'Valor justo, ajuste a valor presente (AVP) e seus efeitos nas demonstrações') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CA-005', 'contabilidade-avancada', 5, 'Reconhecimento e mensuração avançada', 'Receita diferida, subvenções e duplicatas descontadas', 'Receita diferida, subvenções governamentais e desconto de duplicatas') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CA-006', 'contabilidade-avancada', 6, 'Reconhecimento e mensuração avançada', 'Ajustes de exercícios anteriores e reserva legal', 'Ajustes patrimoniais, correção de exercícios anteriores e constituição de reserva legal') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CA-007', 'contabilidade-avancada', 7, 'Demonstrações complementares', 'Demonstrações complementares: DOAR e DVA', 'Demonstração das Origens e Aplicações de Recursos (DOAR) e Demonstração do Valor Adicionado (DVA)') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CG-002', 'CG-001');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CG-003', 'CG-002');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CG-004', 'CG-003');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CG-005', 'CG-004');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CG-006', 'CG-005');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CG-041', 'CG-006');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CG-008', 'CG-007');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CG-009', 'CG-008');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CG-010', 'CG-009');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CG-011', 'CG-010');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CG-012', 'CG-011');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CG-013', 'CG-012');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CG-015', 'CG-014');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CG-016', 'CG-015');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CG-017', 'CG-016');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CG-018', 'CG-017');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CG-019', 'CG-018');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CG-020', 'CG-019');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CG-022', 'CG-021');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CG-023', 'CG-022');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CG-024', 'CG-023');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CG-026', 'CG-025');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CG-027', 'CG-026');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CG-028', 'CG-027');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CG-029', 'CG-028');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CG-030', 'CG-029');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CG-031', 'CG-030');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CG-032', 'CG-031');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CG-033', 'CG-032');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CG-034', 'CG-033');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CG-037', 'CG-036');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CG-038', 'CG-037');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CG-039', 'CG-038');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CC-002', 'CC-001');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CC-004', 'CC-003');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('AD-002', 'AD-001');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('AD-004', 'AD-003');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('AD-005', 'AD-004');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('AD-006', 'AD-005');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CA-002', 'CA-001');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CA-004', 'CA-003');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CA-005', 'CA-004');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CA-006', 'CA-005');

