-- Gerado por `pnpm run db:catalog` a partir de lib/content-catalog.ts (TEC-04).
--> statement-breakpoint
-- Não edite à mão: o teste tests/catalog-roadmap.test.ts compara com o gerador.
--> statement-breakpoint
INSERT INTO atlas_roadmaps (id, title, description, origin, created_at, updated_at) VALUES ('atlas-contabil', 'Contabilidade', 'Roadmap curado a partir do catálogo oficial da planilha Atlas.', 'curado', '2026-09-06T00:00:00.000Z', '2026-09-06T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, description = excluded.description, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO atlas_phases (id, roadmap_id, position, title, summary) VALUES ('fase-contabilidade-geral', 'atlas-contabil', 1, 'Contabilidade Geral', 'Fundamentos, mecânica contábil, operações e demonstrações.') ON CONFLICT(id) DO UPDATE SET position = excluded.position, title = excluded.title, summary = excluded.summary;
--> statement-breakpoint
INSERT INTO atlas_phases (id, roadmap_id, position, title, summary) VALUES ('fase-contabilidade-tributaria', 'atlas-contabil', 2, 'Contabilidade Tributária', 'Regimes de tributação, tributos, obrigações e reforma tributária.') ON CONFLICT(id) DO UPDATE SET position = excluded.position, title = excluded.title, summary = excluded.summary;
--> statement-breakpoint
INSERT INTO atlas_disciplines (id, phase_id, position, title) VALUES ('contabilidade-geral', 'fase-contabilidade-geral', 1, 'Contabilidade Geral') ON CONFLICT(id) DO UPDATE SET position = excluded.position, title = excluded.title;
--> statement-breakpoint
INSERT INTO atlas_disciplines (id, phase_id, position, title) VALUES ('contabilidade-tributaria', 'fase-contabilidade-tributaria', 1, 'Contabilidade Tributária') ON CONFLICT(id) DO UPDATE SET position = excluded.position, title = excluded.title;
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
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-007', 'contabilidade-geral', 7, 'Contas', 'Conceito, função e estrutura das contas', 'Título, objeto, débito, crédito, saldo e função') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-008', 'contabilidade-geral', 8, 'Contas', 'Contas patrimoniais', 'Ativo, passivo e patrimônio líquido; natureza dos saldos') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-009', 'contabilidade-geral', 9, 'Contas', 'Contas de resultado', 'Receitas, custos e despesas; encerramento dos saldos') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-010', 'contabilidade-geral', 10, 'Contas', 'Teoria Personalista', 'Agentes consignatários, correspondentes e proprietários') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-011', 'contabilidade-geral', 11, 'Contas', 'Teoria Materialista', 'Contas integrais e diferenciais') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-012', 'contabilidade-geral', 12, 'Contas', 'Teoria Patrimonialista', 'Contas patrimoniais e contas de resultado') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-013', 'contabilidade-geral', 13, 'Contas', 'Plano e manual de contas', 'Estrutura, codificação, níveis e adaptação ao negócio') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-014', 'contabilidade-geral', 14, 'Mecânica contábil', 'Natureza devedora e credora', 'Aumentos, diminuições e saldos por grupo') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-015', 'contabilidade-geral', 15, 'Mecânica contábil', 'Método das partidas dobradas', 'Origem, aplicação e igualdade entre débitos e créditos') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-016', 'contabilidade-geral', 16, 'Mecânica contábil', 'Lançamentos contábeis', 'Elementos, fórmulas, histórico e análise do fato') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-017', 'contabilidade-geral', 17, 'Mecânica contábil', 'Livros Diário e Razão', 'Escrituração cronológica, sistemática e razonetes') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-018', 'contabilidade-geral', 18, 'Mecânica contábil', 'Escrituração contábil', 'Formalidades, documentação, método e encadeamento') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-019', 'contabilidade-geral', 19, 'Mecânica contábil', 'Balancete de verificação', 'Saldos, movimentação, conferência e limitações') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-020', 'contabilidade-geral', 20, 'Mecânica contábil', 'Erros e correções de escrituração', 'Estorno, transferência, complementação e ressalva') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-021', 'contabilidade-geral', 21, 'Reconhecimento', 'Regime de caixa e de competência', 'Fato gerador, recebimento, pagamento e período contábil') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-022', 'contabilidade-geral', 22, 'Reconhecimento', 'Receitas, custos e despesas', 'Reconhecimento, classificação e impacto no resultado') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-023', 'contabilidade-geral', 23, 'Reconhecimento', 'Apuração do Resultado do Exercício', 'Encerramento das contas de resultado e transferência ao PL') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-024', 'contabilidade-geral', 24, 'Reconhecimento', 'Ajustes por competência', 'Antecipações, apropriações, receitas a apropriar e estimativas') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-025', 'contabilidade-geral', 25, 'Operações usuais', 'Caixa, bancos e conciliação', 'Disponibilidades, transferências, tarifas e divergências') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-026', 'contabilidade-geral', 26, 'Operações usuais', 'Clientes e contas a receber', 'Vendas a prazo, recebimentos, descontos e perdas') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-027', 'contabilidade-geral', 27, 'Operações usuais', 'Compras, vendas e estoques', 'Entradas, saídas, devoluções e abatimentos') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-028', 'contabilidade-geral', 28, 'Operações usuais', 'Custo das Mercadorias Vendidas', 'Inventário periódico e permanente; EI + C - EF') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-029', 'contabilidade-geral', 29, 'Operações usuais', 'Tributos nas compras e vendas', 'Tributos recuperáveis, incidentes sobre vendas e apresentação') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-030', 'contabilidade-geral', 30, 'Operações usuais', 'Folha de pagamento', 'Salários, encargos, retenções, provisões e pagamento') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-031', 'contabilidade-geral', 31, 'Operações usuais', 'Imobilizado, intangível e depreciação', 'Reconhecimento, custo, vida útil, amortização e baixa') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-032', 'contabilidade-geral', 32, 'Operações usuais', 'Empréstimos, financiamentos e juros', 'Principal, encargos, prazos e apropriação') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-033', 'contabilidade-geral', 33, 'Operações usuais', 'Provisões e contingências — introdução', 'Obrigação presente, estimativa, reconhecimento e divulgação') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-034', 'contabilidade-geral', 34, 'Operações usuais', 'Operações com Patrimônio Líquido', 'Capital, integralização, reservas, dividendos e resultados') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-035', 'contabilidade-geral', 35, 'Fechamento', 'Rotina de fechamento contábil', 'Conciliações, ajustes, reclassificações e encerramento') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-036', 'contabilidade-geral', 36, 'Demonstrações', 'Balanço Patrimonial', 'Estrutura, circulante, não circulante e apresentação') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-037', 'contabilidade-geral', 37, 'Demonstrações', 'Demonstração do Resultado do Exercício', 'Estrutura, receitas, custos, despesas e resultado líquido') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-038', 'contabilidade-geral', 38, 'Demonstrações', 'DLPA, DMPL e DFC — fundamentos', 'Movimentação do PL e introdução aos fluxos de caixa') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-039', 'contabilidade-geral', 39, 'Demonstrações', 'Notas explicativas e políticas contábeis', 'Contexto, políticas, estimativas e informações complementares') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CG-040', 'contabilidade-geral', 40, 'Integração prática', 'Ciclo contábil completo', 'Documentos, lançamentos, Razão, balancete, ajustes, fechamento e demonstrações') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-001', 'contabilidade-tributaria', 1, 'Fundamentos', 'Atividade financeira do Estado', 'Finalidades do Estado; receitas, despesas, orçamento e arrecadação') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-002', 'contabilidade-tributaria', 2, 'Fundamentos', 'Sistema Tributário Nacional', 'Constituição, CTN, legislação complementar, ordinária e normas infralegais') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-003', 'contabilidade-tributaria', 3, 'Fundamentos', 'Competência tributária e repartição', 'União, Estados, Distrito Federal e Municípios; competência, capacidade ativa e repartição de receitas') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-004', 'contabilidade-tributaria', 4, 'Fundamentos', 'Espécies tributárias', 'Impostos, taxas, contribuição de melhoria, empréstimos compulsórios e contribuições especiais') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-005', 'contabilidade-tributaria', 5, 'Fundamentos', 'Princípios e limitações ao poder de tributar', 'Legalidade, anterioridade, noventena, isonomia, capacidade contributiva, não confisco e imunidades') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-006', 'contabilidade-tributaria', 6, 'Fundamentos', 'Obrigação tributária', 'Obrigação principal e acessória; conversão por descumprimento; prestações positivas e negativas') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-007', 'contabilidade-tributaria', 7, 'Fundamentos', 'Hipótese de incidência e fato gerador', 'Aspectos material, temporal, espacial, pessoal e quantitativo; incidência, não incidência e isenção') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-008', 'contabilidade-tributaria', 8, 'Fundamentos', 'Sujeitos da relação tributária', 'Sujeito ativo, contribuinte, responsável, substituto e terceiros') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-009', 'contabilidade-tributaria', 9, 'Fundamentos', 'Crédito tributário e lançamento', 'Constituição do crédito; lançamento de ofício, por declaração e por homologação') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-010', 'contabilidade-tributaria', 10, 'Fundamentos', 'Suspensão, extinção e exclusão do crédito', 'Moratória, depósito, recursos, parcelamento, pagamento, compensação, decadência, prescrição, isenção e anistia') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-011', 'contabilidade-tributaria', 11, 'Fundamentos', 'Responsabilidade, solidariedade e sucessão', 'Responsabilidade de terceiros, infrações, sucessores e grupos econômicos') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-012', 'contabilidade-tributaria', 12, 'Fundamentos', 'Interpretação, vigência e aplicação da legislação', 'Integração, analogia, equidade, atos normativos, consulta e efeitos no tempo') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-013', 'contabilidade-tributaria', 13, 'Contabilização', 'Tributos a recuperar e a recolher', 'Natureza das contas; ativo fiscal; passivo tributário; compensações e saldos') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-014', 'contabilidade-tributaria', 14, 'Contabilização', 'Reconhecimento por competência', 'Fato gerador, competência contábil, apuração e pagamento em períodos distintos') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-015', 'contabilidade-tributaria', 15, 'Contabilização', 'Tributos sobre compras, vendas e resultado', 'Recuperáveis, não recuperáveis, deduções da receita, custo e tributos sobre lucro') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-016', 'contabilidade-tributaria', 16, 'Contabilização', 'Conciliação contábil-fiscal', 'Razão, apurações, guias, declarações, saldos e diferenças temporais/permanentes') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-017', 'contabilidade-tributaria', 17, 'Contabilização', 'Provisões, contingências e riscos fiscais', 'Obrigação presente, probabilidade, mensuração, depósitos e divulgação') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-018', 'contabilidade-tributaria', 18, 'Contabilização', 'Tributos sobre o lucro — CPC 32', 'Tributo corrente e diferido; diferenças temporárias; ativos e passivos fiscais diferidos') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-019', 'contabilidade-tributaria', 19, 'Contabilização', 'Fechamento tributário integrado', 'Calendário, responsáveis, conferências, provisões, pagamentos e evidências') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-020', 'contabilidade-tributaria', 20, 'Cadastros e documentos', 'CNPJ, CNAE e estabelecimentos', 'Matriz, filiais, natureza jurídica, atividades principal/secundárias e impactos tributários') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-021', 'contabilidade-tributaria', 21, 'Cadastros e documentos', 'Inscrições e domicílios fiscais', 'Inscrição estadual, municipal, regimes estaduais e municipais, DTE e e-CAC') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-022', 'contabilidade-tributaria', 22, 'Cadastros e documentos', 'Certificado digital, procurações e acessos', 'ICP-Brasil, perfis, procuração eletrônica, segregação de funções e segurança') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-023', 'contabilidade-tributaria', 23, 'Cadastros e documentos', 'Ecossistema de documentos fiscais eletrônicos', 'NF-e, NFC-e, CT-e, MDF-e, NFS-e e eventos') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-024', 'contabilidade-tributaria', 24, 'Cadastros e documentos', 'NF-e e NFC-e', 'Emissão, autorização, XML, DANFE, destinatário, contingência e guarda') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-025', 'contabilidade-tributaria', 25, 'Cadastros e documentos', 'CT-e e MDF-e', 'Prestação de transporte, tomador, documentos vinculados e encerramento') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-026', 'contabilidade-tributaria', 26, 'Cadastros e documentos', 'NFS-e e padrões municipais/nacional', 'Emissão, competência, código de serviço, retenção, cancelamento e município') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-027', 'contabilidade-tributaria', 27, 'Cadastros e documentos', 'CFOP e natureza da operação', 'Entradas, saídas, operações internas, interestaduais, exterior, devoluções e remessas') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-028', 'contabilidade-tributaria', 28, 'Cadastros e documentos', 'NCM, CST, CSOSN, CEST e benefícios', 'Classificação fiscal, origem, situação tributária, substituição e códigos de benefício') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-029', 'contabilidade-tributaria', 29, 'Cadastros e documentos', 'Eventos, correções e guarda documental', 'Cancelamento, inutilização, carta de correção, manifestação, ciência, prazos e trilha de auditoria') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-030', 'contabilidade-tributaria', 30, 'Simples Nacional', 'Estrutura, opção e vedações', 'LC 123; conceito de ME/EPP; opção, sublimites, vedações, exclusão e efeitos') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-031', 'contabilidade-tributaria', 31, 'Simples Nacional', 'MEI e SIMEI', 'Ocupações, limites, DAS-MEI, empregado, desenquadramento e DASN-SIMEI') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-032', 'contabilidade-tributaria', 32, 'Simples Nacional', 'Receita bruta, competência/caixa e RBT12', 'Receitas incluídas, segregação, devoluções, cancelamentos, mercado interno/externo e acumulados') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-033', 'contabilidade-tributaria', 33, 'Simples Nacional', 'Anexos, faixas e alíquota efetiva', 'Anexos I a V; alíquota nominal, parcela a deduzir e partilha') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-034', 'contabilidade-tributaria', 34, 'Simples Nacional', 'Fator R', 'Folha e encargos; receita; janela de 12 meses; início de atividade; efeitos entre anexos III e V') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-035', 'contabilidade-tributaria', 35, 'Simples Nacional', 'Segregação de receitas no PGDAS-D', 'Comércio, indústria, serviços; monofásico, ST, antecipação, exportação, retenção e receitas sujeitas a regras próprias') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-036', 'contabilidade-tributaria', 36, 'Simples Nacional', 'PGDAS-D, DAS e retificações', 'Declaração mensal, apuração, transmissão, geração do DAS, retificação e efeitos') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-037', 'contabilidade-tributaria', 37, 'Simples Nacional', 'DEFIS e obrigações complementares', 'Informações econômicas e fiscais, estoques, ganhos, sócios, prazos e retificação') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-038', 'contabilidade-tributaria', 38, 'Simples Nacional', 'Restituição, compensação, parcelamento e regularização', 'Pagamentos indevidos, débitos, cobrança, exclusão e certidões') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-039', 'contabilidade-tributaria', 39, 'Simples Nacional', 'Caso completo do Simples Nacional', 'Cadastro, documentos, segregação, Fator R, PGDAS-D, DAS, contabilização e DEFIS') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-040', 'contabilidade-tributaria', 40, 'Lucro Presumido', 'Elegibilidade, opção e período de apuração', 'Limites, atividades impedidas, opção pelo pagamento e apuração trimestral') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-041', 'contabilidade-tributaria', 41, 'Lucro Presumido', 'Receita bruta e percentuais de presunção', 'Percentuais por atividade, múltiplas atividades, devoluções e descontos') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-042', 'contabilidade-tributaria', 42, 'Lucro Presumido', 'Outras receitas e acréscimos à base', 'Ganhos de capital, receitas financeiras e demais valores tributáveis') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-043', 'contabilidade-tributaria', 43, 'Lucro Presumido', 'IRPJ e adicional', 'Base, alíquota, adicional, deduções, retenções e pagamento') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-044', 'contabilidade-tributaria', 44, 'Lucro Presumido', 'CSLL', 'Base presumida por atividade, alíquota, retenções e pagamento') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-045', 'contabilidade-tributaria', 45, 'Lucro Presumido', 'PIS/Cofins cumulativos e fechamento', 'Regime cumulativo, receitas, exceções, escriturações e conciliação trimestral') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-046', 'contabilidade-tributaria', 46, 'Lucro Real', 'Obrigatoriedade, opção e modalidades', 'Hipóteses legais; trimestral; anual com estimativas; vantagens e riscos') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-047', 'contabilidade-tributaria', 47, 'Lucro Real', 'Lucro líquido e ponte fiscal', 'Resultado contábil antes do IRPJ/CSLL; adições, exclusões e compensações') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-048', 'contabilidade-tributaria', 48, 'Lucro Real', 'Despesas dedutíveis e indedutíveis', 'Necessidade, usualidade, documentação, limites e vedações') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-049', 'contabilidade-tributaria', 49, 'Lucro Real', 'e-Lalur e e-Lacs', 'Parte A, Parte B, controles, bases de IRPJ e CSLL e rastreabilidade') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-050', 'contabilidade-tributaria', 50, 'Lucro Real', 'Prejuízo fiscal e base negativa', 'Compensação, limites, segregações e controles históricos') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-051', 'contabilidade-tributaria', 51, 'Lucro Real', 'Estimativas mensais e balanços de suspensão/redução', 'Base estimada, receita bruta, balancetes, comparação e recolhimentos') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-052', 'contabilidade-tributaria', 52, 'Lucro Real', 'Incentivos, subvenções e tratamentos especiais', 'Benefícios, requisitos, controles, mudanças legislativas e documentação') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-053', 'contabilidade-tributaria', 53, 'Lucro Real', 'Juros, partes relacionadas e ajustes avançados', 'Juros, capitalização, partes relacionadas, preços de transferência e limites aplicáveis') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-054', 'contabilidade-tributaria', 54, 'Lucro Real', 'Tributo corrente e diferido aplicado', 'Diferenças temporárias, taxa efetiva, realização e divulgação') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-055', 'contabilidade-tributaria', 55, 'Lucro Real', 'ECF e fechamento anual', 'Recuperação da ECD, blocos, e-Lalur/e-Lacs, validações e entrega') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-056', 'contabilidade-tributaria', 56, 'PIS e Cofins', 'Incidência, contribuintes e base de cálculo', 'Receita, faturamento, exclusões, ajustes, regimes e tratamentos diferenciados') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-057', 'contabilidade-tributaria', 57, 'PIS e Cofins', 'Regime cumulativo', 'Alíquotas, base, receitas e exceções') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-058', 'contabilidade-tributaria', 58, 'PIS e Cofins', 'Regime não cumulativo', 'Débitos, créditos permitidos, conceito de insumo, rateios e estornos') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-059', 'contabilidade-tributaria', 59, 'PIS e Cofins', 'Monofásico, substituição, alíquota zero, isenção e suspensão', 'Cadeias especiais, classificação de produto e segregação de receitas') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-060', 'contabilidade-tributaria', 60, 'PIS e Cofins', 'Importação e exportação', 'PIS/Cofins-Importação, créditos, receitas de exportação e documentação') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-061', 'contabilidade-tributaria', 61, 'PIS e Cofins', 'EFD-Contribuições', 'Blocos, documentos, apuração, créditos, receitas especiais, validações e retificações') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-062', 'contabilidade-tributaria', 62, 'PIS e Cofins', 'Caso completo e conciliação', 'Documentos, classificação, apuração, contabilização, EFD e pagamento') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-063', 'contabilidade-tributaria', 63, 'ICMS', 'Fundamentos e legislação estadual', 'Competência, incidência, contribuinte, estabelecimento, regulamento estadual e convênios') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-064', 'contabilidade-tributaria', 64, 'ICMS', 'Fato gerador, local, base e contribuinte', 'Circulação, prestações, importação, base, descontos, frete e responsabilidades') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-065', 'contabilidade-tributaria', 65, 'ICMS', 'Alíquotas internas e interestaduais', 'Origem/destino, resoluções, importados e consumidor final') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-066', 'contabilidade-tributaria', 66, 'ICMS', 'Não cumulatividade e créditos', 'Crédito físico/financeiro conforme regra, documentação, vedação, estorno e manutenção') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-067', 'contabilidade-tributaria', 67, 'ICMS', 'DIFAL e FCP', 'Consumidor final contribuinte/não contribuinte, partilha, base e fundos estaduais') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-068', 'contabilidade-tributaria', 68, 'ICMS', 'Substituição tributária e antecipação', 'Substituto/substituído, CEST, MVA, pauta, base, ressarcimento e complemento') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-069', 'contabilidade-tributaria', 69, 'ICMS', 'Benefícios e regimes especiais', 'Isenção, redução de base, crédito presumido, diferimento, suspensão e obrigações') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-070', 'contabilidade-tributaria', 70, 'ICMS', 'CIAP, ativo imobilizado e uso/consumo', 'Crédito parcelado, controles, transferências e estornos') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-071', 'contabilidade-tributaria', 71, 'ICMS', 'Importação, exportação e operações especiais', 'Desembaraço, exportações, remessas, transferências, industrialização e triangulares') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-072', 'contabilidade-tributaria', 72, 'ICMS', 'EFD ICMS/IPI e fechamento estadual', 'Blocos, registros, apuração, inventário, CIAP, validações, GIA/declaratórias locais e pagamento') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-073', 'contabilidade-tributaria', 73, 'IPI', 'Incidência e conceito de industrialização', 'Contribuintes, estabelecimentos equiparados, modalidades e exclusões') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-074', 'contabilidade-tributaria', 74, 'IPI', 'TIPI, NCM e enquadramento', 'Classificação, alíquotas, essencialidade e reflexos documentais') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-075', 'contabilidade-tributaria', 75, 'IPI', 'Base de cálculo e apuração', 'Valor tributável, alíquotas, débitos, créditos e períodos') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-076', 'contabilidade-tributaria', 76, 'IPI', 'Suspensão, isenção, imunidade e regimes', 'Exportação, insumos, benefícios e condições documentais') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-077', 'contabilidade-tributaria', 77, 'IPI', 'Escrituração e EFD ICMS/IPI', 'Documentos, registros, apuração, controles e validações') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-078', 'contabilidade-tributaria', 78, 'ISS', 'LC 116 e lista de serviços', 'Competência municipal, enquadramento do serviço, itens e conflitos com ICMS') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-079', 'contabilidade-tributaria', 79, 'ISS', 'Local da incidência e exportação de serviços', 'Regra geral, exceções, estabelecimento prestador, resultado no exterior e conflitos') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-080', 'contabilidade-tributaria', 80, 'ISS', 'Base, alíquotas e deduções', 'Preço do serviço, alíquotas, deduções, sociedades e regimes locais') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-081', 'contabilidade-tributaria', 81, 'ISS', 'Retenção e responsabilidade', 'Tomador, prestador, cadastro, retenção, Simples e obrigações de terceiros') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-082', 'contabilidade-tributaria', 82, 'ISS', 'NFS-e e fechamento municipal', 'Emissão, serviços tomados/prestados, declarações, guias, cancelamento e conciliação') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-083', 'contabilidade-tributaria', 83, 'Folha e retenções', 'Contribuições previdenciárias da folha', 'Segurados, patronal, RAT/GILRAT, terceiros, pró-labore, autônomos e bases') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-084', 'contabilidade-tributaria', 84, 'Folha e retenções', 'eSocial e fechamento da folha', 'Eventos periódicos/não periódicos, bases, totalizadores, fechamento e retificação') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-085', 'contabilidade-tributaria', 85, 'Folha e retenções', 'CPRB e regimes previdenciários sobre receita', 'Atividades, receita, exclusões, opção e convivência com folha') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-086', 'contabilidade-tributaria', 86, 'Folha e retenções', 'Retenção previdenciária em serviços', 'Cessão de mão de obra, empreitada, bases, alíquotas, deduções e compensação') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-087', 'contabilidade-tributaria', 87, 'Folha e retenções', 'IRRF sobre pagamentos', 'Trabalho e sem vínculo, serviços, aluguéis, aplicações e códigos de receita') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-088', 'contabilidade-tributaria', 88, 'Folha e retenções', 'Retenções de PIS, Cofins e CSLL', 'Serviços sujeitos, dispensa, base, vencimentos e responsabilidade') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-089', 'contabilidade-tributaria', 89, 'Folha e retenções', 'Retenção de ISS', 'Regras municipais, local, responsabilidade, cadastro e documentos') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-090', 'contabilidade-tributaria', 90, 'Folha e retenções', 'EFD-Reinf, DCTFWeb e MIT', 'Eventos, fechamentos, integração com eSocial, confissão, créditos, DARF e retificações') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-091', 'contabilidade-tributaria', 91, 'Obrigações e SPED', 'ECD', 'Obrigatoriedade, livros digitais, plano referencial, validação, assinatura e substituição') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-092', 'contabilidade-tributaria', 92, 'Obrigações e SPED', 'ECF', 'Obrigatoriedade, blocos, recuperação da ECD, apuração de IRPJ/CSLL e e-Lalur/e-Lacs') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-093', 'contabilidade-tributaria', 93, 'Obrigações e SPED', 'EFD-Contribuições', 'Obrigatoriedade, documentos, apuração, créditos e validações') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-094', 'contabilidade-tributaria', 94, 'Obrigações e SPED', 'EFD ICMS/IPI', 'Obrigatoriedade, blocos, inventário, apurações, CIAP e registros estaduais') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-095', 'contabilidade-tributaria', 95, 'Obrigações e SPED', 'eSocial, EFD-Reinf e DCTFWeb', 'Integrações, totalizadores, MIT, débitos, créditos, pagamentos e retificações') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-096', 'contabilidade-tributaria', 96, 'Obrigações e SPED', 'PER/DCOMP Web', 'Restituição, ressarcimento, reembolso, compensação, créditos e acompanhamento') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-097', 'contabilidade-tributaria', 97, 'Obrigações e SPED', 'Obrigações estaduais e municipais', 'GIA e equivalentes, declarações de serviços, cadastros, guias e particularidades locais') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-098', 'contabilidade-tributaria', 98, 'Obrigações e SPED', 'Cruzamentos e malhas fiscais', 'NF-e, SPED, declarações, pagamentos, contabilidade, bancos e cadastros') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-099', 'contabilidade-tributaria', 99, 'Reforma tributária', 'Fundamentos da Reforma do Consumo', 'EC 132/2023, LC 214/2025, modelo IVA dual e cronograma normativo') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-100', 'contabilidade-tributaria', 100, 'Reforma tributária', 'CBS', 'Incidência federal, contribuintes, base, créditos, regimes e obrigações') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-101', 'contabilidade-tributaria', 101, 'Reforma tributária', 'IBS', 'Competência compartilhada, destino, Comitê Gestor, base, créditos e distribuição') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-102', 'contabilidade-tributaria', 102, 'Reforma tributária', 'Imposto Seletivo', 'Incidência, produtos/serviços alcançados, base, finalidade extrafiscal e vigência') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-103', 'contabilidade-tributaria', 103, 'Reforma tributária', 'Não cumulatividade, créditos e destino', 'Crédito financeiro, estornos, ressarcimento, destino e neutralidade') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-104', 'contabilidade-tributaria', 104, 'Reforma tributária', 'Regimes diferenciados, específicos e favorecidos', 'Reduções, alíquota zero, regimes setoriais, Zona Franca e tratamentos previstos') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-105', 'contabilidade-tributaria', 105, 'Reforma tributária', 'Simples Nacional na transição', 'DAS, opção pelo regime regular de IBS/CBS, créditos e decisão econômica') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-106', 'contabilidade-tributaria', 106, 'Reforma tributária', 'Documentos, split payment e cashback', 'Novos campos, recolhimento, devoluções, integração financeira e controles') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-107', 'contabilidade-tributaria', 107, 'Reforma tributária', 'Transição 2026–2033 e convivência de sistemas', 'Testes, fases, redução/extinção de tributos, alíquotas de referência e impactos nos contratos') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-108', 'contabilidade-tributaria', 108, 'Governança e domínio', 'Calendário e fechamento fiscal integrado', 'Obrigações por regime/jurisdição, responsáveis, dependências, evidências e contingência') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-109', 'contabilidade-tributaria', 109, 'Governança e domínio', 'Cadastro e motor tributário', 'Produtos, serviços, clientes, fornecedores, NCM, CFOP, CST, regras e versionamento') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-110', 'contabilidade-tributaria', 110, 'Governança e domínio', 'Revisão e auditoria tributária', 'Testes substantivos, amostragem, reconciliações, documentação e materialidade') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-111', 'contabilidade-tributaria', 111, 'Governança e domínio', 'Passivo, certidões e processo tributário', 'Conta-corrente fiscal, intimações, autos, defesa administrativa, garantias e certidões') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-112', 'contabilidade-tributaria', 112, 'Governança e domínio', 'Planejamento tributário lícito', 'Elisão, evasão, simulação, substância, propósito negocial, cenários e documentação') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-113', 'contabilidade-tributaria', 113, 'Governança e domínio', 'Módulos setoriais e regimes especiais', 'Comércio exterior, indústria, serviços, construção, imobiliário/RET, agronegócio, terceiro setor e setor financeiro') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-114', 'contabilidade-tributaria', 114, 'Governança e domínio', 'Tributação internacional', 'Residência, fonte, tratados, preços de transferência, controladas no exterior e serviços transfronteiriços') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-115', 'contabilidade-tributaria', 115, 'Governança e domínio', 'Tax technology e dados fiscais', 'ERP, parametrização, XML, APIs, validações, automação, SQL/BI, segurança e trilha de auditoria') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-116', 'contabilidade-tributaria', 116, 'Governança e domínio', 'Capstone multirregime', 'Empresa simulada em Simples, Presumido e Real; documentos, apurações, obrigações, contabilização e decisão') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
--> statement-breakpoint
INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES ('CT-117', 'contabilidade-tributaria', 117, 'Governança e domínio', 'Avaliação de domínio em Contabilidade Tributária', 'Prova teórica, casos, escrituração, apurações, SPED, reforma, defesa oral e auditoria de consistência') ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;
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
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-002', 'CT-001');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-003', 'CT-002');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-004', 'CT-003');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-005', 'CT-004');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-006', 'CT-005');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-007', 'CT-006');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-008', 'CT-007');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-009', 'CT-008');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-010', 'CT-009');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-011', 'CT-010');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-012', 'CT-011');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-014', 'CT-013');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-015', 'CT-014');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-016', 'CT-015');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-017', 'CT-016');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-018', 'CT-017');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-019', 'CT-018');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-021', 'CT-020');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-022', 'CT-021');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-023', 'CT-022');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-024', 'CT-023');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-025', 'CT-024');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-026', 'CT-025');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-027', 'CT-026');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-028', 'CT-027');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-029', 'CT-028');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-031', 'CT-030');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-032', 'CT-031');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-033', 'CT-032');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-034', 'CT-033');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-035', 'CT-034');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-036', 'CT-035');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-037', 'CT-036');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-038', 'CT-037');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-039', 'CT-038');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-041', 'CT-040');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-042', 'CT-041');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-043', 'CT-042');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-044', 'CT-043');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-045', 'CT-044');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-047', 'CT-046');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-048', 'CT-047');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-049', 'CT-048');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-050', 'CT-049');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-051', 'CT-050');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-052', 'CT-051');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-053', 'CT-052');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-054', 'CT-053');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-055', 'CT-054');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-057', 'CT-056');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-058', 'CT-057');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-059', 'CT-058');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-060', 'CT-059');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-061', 'CT-060');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-062', 'CT-061');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-064', 'CT-063');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-065', 'CT-064');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-066', 'CT-065');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-067', 'CT-066');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-068', 'CT-067');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-069', 'CT-068');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-070', 'CT-069');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-071', 'CT-070');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-072', 'CT-071');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-074', 'CT-073');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-075', 'CT-074');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-076', 'CT-075');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-077', 'CT-076');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-079', 'CT-078');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-080', 'CT-079');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-081', 'CT-080');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-082', 'CT-081');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-084', 'CT-083');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-085', 'CT-084');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-086', 'CT-085');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-087', 'CT-086');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-088', 'CT-087');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-089', 'CT-088');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-090', 'CT-089');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-092', 'CT-091');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-093', 'CT-092');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-094', 'CT-093');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-095', 'CT-094');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-096', 'CT-095');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-097', 'CT-096');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-098', 'CT-097');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-100', 'CT-099');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-101', 'CT-100');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-102', 'CT-101');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-103', 'CT-102');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-104', 'CT-103');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-105', 'CT-104');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-106', 'CT-105');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-107', 'CT-106');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-109', 'CT-108');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-110', 'CT-109');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-111', 'CT-110');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-112', 'CT-111');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-113', 'CT-112');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-114', 'CT-113');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-115', 'CT-114');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-116', 'CT-115');
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('CT-117', 'CT-116');
