-- Banco inicial de questões (MVP-04), gerado de data/questoes/banco-inicial.csv por scripts/import-questions.mjs.
-- ON CONFLICT DO NOTHING: não sobrescreve questões já importadas ou editadas.
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-001-Q01', 'CG-001', 1, 'multipla', 'Qual é o objeto de estudo da Contabilidade?', NULL, '["O patrimônio das entidades","O lucro distribuído aos sócios","Apenas o caixa da empresa","Os tributos devidos ao governo"]', 0, NULL, NULL, NULL, NULL, 'A Contabilidade estuda o patrimônio (bens, direitos e obrigações) e suas variações.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-001-Q02', 'CG-001', 2, 'multipla', 'Qual é a finalidade principal da Contabilidade?', NULL, '["Fornecer informações úteis para a tomada de decisão sobre o patrimônio","Calcular apenas os impostos a pagar","Substituir a auditoria interna","Registrar somente as entradas de dinheiro"]', 0, NULL, NULL, NULL, NULL, 'A Contabilidade existe para gerar informação útil a quem decide sobre a entidade (controle e planejamento).', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-001-Q03', 'CG-001', 3, 'multipla', 'Qual é o campo de aplicação da Contabilidade?', NULL, '["As entidades econômico-administrativas, com ou sem fins lucrativos","Somente as sociedades anônimas","Somente as empresas industriais","Apenas os órgãos públicos"]', 0, NULL, NULL, NULL, NULL, 'Ela se aplica a qualquer entidade que tenha patrimônio a gerir: empresas, associações, órgãos públicos e pessoas físicas.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-001-Q04', 'CG-001', 4, 'multipla', 'Qual destes é um usuário externo da informação contábil?', NULL, '["Banco que analisa um pedido de empréstimo","Gerente de produção da própria empresa","Diretor financeiro","Contador interno"]', 0, NULL, NULL, NULL, NULL, 'Usuários externos não participam da gestão: credores, investidores, governo, fornecedores. Gerentes e diretores são internos.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-001-Q05', 'CG-001', 5, 'multipla', 'Qual técnica contábil consiste em registrar os fatos que alteram o patrimônio?', NULL, '["Escrituração","Auditoria","Análise de balanços","Consolidação"]', 0, NULL, NULL, NULL, NULL, 'Escrituração é o registro dos fatos nos livros. Demonstrações, auditoria e análise são as outras técnicas.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-001-Q06', 'CG-001', 6, 'multipla', 'Uma informação contábil é relevante quando…', NULL, '["é capaz de fazer diferença nas decisões dos usuários","tem muitas páginas","é apresentada só ao final do ano","é aprovada pelo fisco"]', 0, NULL, NULL, NULL, NULL, 'Relevância é a capacidade de influenciar decisões (valor preditivo ou confirmatório).', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-001-Q07', 'CG-001', 7, 'multipla', 'Qual característica qualitativa exige que a informação represente fielmente o fenômeno, de forma completa, neutra e livre de erro?', NULL, '["Representação fidedigna","Tempestividade","Comparabilidade","Compreensibilidade"]', 0, NULL, NULL, NULL, NULL, 'As características fundamentais são relevância e representação fidedigna', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-001-Q08', 'CG-001', 8, 'multipla', 'A Contabilidade é classificada, quanto à sua natureza, como uma ciência…', NULL, '["social","exata","natural","jurídica"]', 0, NULL, NULL, NULL, NULL, 'É uma ciência social aplicada: estuda o patrimônio, que resulta da ação humana.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-001-Q09', 'CG-001', 9, 'dissertativa', 'Explique com suas palavras para que serve a Contabilidade e cite dois usuários da informação contábil.', NULL, NULL, NULL, 'A Contabilidade registra e controla o patrimônio e suas variações para fornecer informação útil à tomada de decisão. Usuários: internos (sócios, administradores) e externos (bancos, investidores, governo, fornecedores).', NULL, NULL, NULL, 'Uma boa resposta liga a Contabilidade ao patrimônio e à decisão, e cita pelo menos um usuário interno ou externo.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-001-Q10', 'CG-001', 10, 'dissertativa', 'Diferencie usuários internos e externos da informação contábil, com um exemplo de cada.', NULL, NULL, NULL, 'Internos participam da gestão e usam a informação para administrar (diretores, gerentes). Externos estão fora da gestão e a usam para decidir sua relação com a entidade (bancos, investidores, governo).', NULL, NULL, NULL, 'O ponto central é a posição em relação à gestão: dentro (interno) ou fora (externo).', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-002-Q01', 'CG-002', 1, 'multipla', 'O patrimônio de uma entidade é formado por:', NULL, '["Bens, direitos e obrigações","Somente bens","Bens e receitas","Direitos e despesas"]', 0, NULL, NULL, NULL, NULL, 'Patrimônio é o conjunto de bens, direitos e obrigações de uma entidade, avaliados em moeda.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-002-Q02', 'CG-002', 2, 'multipla', 'Qual dos itens é um direito da empresa?', NULL, '["Duplicatas a receber","Fornecedores","Salários a pagar","Empréstimos obtidos"]', 0, NULL, NULL, NULL, NULL, 'Direitos são valores a receber de terceiros. Fornecedores, salários a pagar e empréstimos são obrigações.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-002-Q03', 'CG-002', 3, 'multipla', 'Qual dos itens é uma obrigação (passivo exigível)?', NULL, '["Impostos a recolher","Estoque de mercadorias","Veículos","Caixa"]', 0, NULL, NULL, NULL, NULL, 'Impostos a recolher é dívida com o governo. Estoque, veículos e caixa são bens.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-002-Q04', 'CG-002', 4, 'multipla', 'Como se classificam os bens de uma entidade quanto à forma?', NULL, '["Tangíveis (corpóreos) e intangíveis (incorpóreos)","Correntes e não correntes apenas","Próprios e de terceiros","Fixos e variáveis"]', 0, NULL, NULL, NULL, NULL, 'Bens tangíveis têm existência física (máquinas)', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-002-Q05', 'CG-002', 5, 'multipla', 'Uma marca registrada adquirida pela empresa é um bem:', NULL, '["intangível","tangível","de consumo","numerário"]', 0, NULL, NULL, NULL, NULL, 'Marcas, patentes e softwares não têm corpo físico: são bens intangíveis.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-002-Q06', 'CG-002', 6, 'multipla', 'Na representação gráfica do patrimônio (balanço), o lado esquerdo apresenta:', NULL, '["O Ativo (bens e direitos)","O Passivo (obrigações)","O Patrimônio Líquido","As receitas"]', 0, NULL, NULL, NULL, NULL, 'Convencionalmente, Ativo à esquerda', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-002-Q07', 'CG-002', 7, 'multipla', 'O conjunto das obrigações da empresa com terceiros é chamado de:', NULL, '["Passivo exigível","Ativo circulante","Capital social","Receita"]', 0, NULL, NULL, NULL, NULL, 'Passivo exigível são as dívidas com terceiros', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-002-Q08', 'CG-002', 8, 'multipla', 'Dinheiro em conta corrente bancária é classificado como:', NULL, '["Bem numerário (disponibilidade)","Direito a receber","Obrigação","Patrimônio Líquido"]', 0, NULL, NULL, NULL, NULL, 'Saldo em banco movimento é disponibilidade, um bem numerário do Ativo.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-002-Q09', 'CG-002', 9, 'dissertativa', 'Dê um exemplo de bem, um de direito e um de obrigação de uma loja, explicando por que cada um se encaixa no grupo.', NULL, NULL, NULL, 'Bem: mercadorias em estoque (coisa que a loja possui). Direito: duplicatas a receber de clientes (valor a receber). Obrigação: fornecedores a pagar (dívida com terceiros).', NULL, NULL, NULL, 'A resposta precisa separar o que a loja tem (bem), o que tem a receber (direito) e o que deve (obrigação).', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-002-Q10', 'CG-002', 10, 'dissertativa', 'Por que bens e direitos aparecem do mesmo lado do balanço e as obrigações do outro?', NULL, NULL, NULL, 'Bens e direitos são aplicações de recursos (Ativo). Obrigações e PL são origens de recursos (Passivo + PL). O balanço mostra de onde vieram os recursos e onde foram aplicados.', NULL, NULL, NULL, 'O conceito-chave é origem (Passivo e PL) versus aplicação (Ativo) de recursos.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-003-Q01', 'CG-003', 1, 'multipla', 'A equação fundamental do patrimônio é:', NULL, '["Ativo = Passivo + Patrimônio Líquido","Ativo + Passivo = Patrimônio Líquido","Passivo = Ativo + Patrimônio Líquido","Receita − Despesa = Ativo"]', 0, NULL, NULL, NULL, NULL, 'A igualdade A = P + PL mostra que todas as aplicações (Ativo) têm uma origem (terceiros ou sócios).', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-003-Q02', 'CG-003', 2, 'multipla', 'Uma empresa tem Ativo de R$ 500.000 e Passivo exigível de R$ 320.000. O Patrimônio Líquido é:', NULL, '["R$ 180.000","R$ 820.000","R$ 320.000","R$ 500.000"]', 0, NULL, NULL, NULL, NULL, 'PL = Ativo − Passivo = 500.000 − 320.000 = 180.000.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-003-Q03', 'CG-003', 3, 'multipla', 'Qual destes itens compõe o Patrimônio Líquido?', NULL, '["Capital social","Fornecedores","Duplicatas a receber","Empréstimos bancários"]', 0, NULL, NULL, NULL, NULL, 'O PL reúne capital, reservas, ajustes e lucros ou prejuízos acumulados.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-003-Q04', 'CG-003', 4, 'multipla', 'O Patrimônio Líquido também é chamado de:', NULL, '["Situação líquida","Passivo circulante","Ativo permanente","Capital de terceiros"]', 0, NULL, NULL, NULL, NULL, 'Situação líquida ou capital próprio: a diferença entre Ativo e Passivo exigível.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-003-Q05', 'CG-003', 5, 'multipla', 'Os sócios integralizam R$ 50.000 em dinheiro. O que acontece com o patrimônio?', NULL, '["Ativo e PL aumentam em R$ 50.000","Ativo aumenta e Passivo aumenta","Só o Ativo aumenta","Ativo diminui e PL aumenta"]', 0, NULL, NULL, NULL, NULL, 'Entra caixa (Ativo +50.000) e aumenta o capital social (PL +50.000)', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-003-Q06', 'CG-003', 6, 'multipla', 'Capital de terceiros corresponde a:', NULL, '["Passivo exigível","Patrimônio Líquido","Ativo total","Reservas de lucros"]', 0, NULL, NULL, NULL, NULL, 'Recursos de terceiros são as obrigações (Passivo exigível)', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-003-Q07', 'CG-003', 7, 'multipla', 'Se o Ativo é R$ 300.000 e o PL é R$ 120.000, o Passivo exigível é:', NULL, '["R$ 180.000","R$ 420.000","R$ 120.000","R$ 300.000"]', 0, NULL, NULL, NULL, NULL, 'P = A − PL = 300.000 − 120.000 = 180.000.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-003-Q08', 'CG-003', 8, 'multipla', 'Lucros obtidos e ainda não distribuídos aumentam:', NULL, '["o Patrimônio Líquido","o Passivo exigível","apenas o Ativo circulante","as despesas"]', 0, NULL, NULL, NULL, NULL, 'O lucro do período é incorporado ao PL (reservas ou lucros acumulados) até ser distribuído.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-003-Q09', 'CG-003', 9, 'dissertativa', 'Explique por que a equação Ativo = Passivo + Patrimônio Líquido está sempre em equilíbrio.', NULL, NULL, NULL, 'Todo recurso aplicado no Ativo veio de alguma origem: de terceiros (Passivo) ou dos sócios e dos resultados (PL). Cada fato altera os dois lados (ou se compensa dentro de um lado), mantendo a igualdade.', NULL, NULL, NULL, 'A resposta deve relacionar aplicações (Ativo) com origens (Passivo e PL).', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-003-Q10', 'CG-003', 10, 'dissertativa', 'Uma empresa tem caixa de 40.000, estoque de 60.000, fornecedores de 30.000 e capital de 70.000. Monte a equação patrimonial e confira o equilíbrio.', NULL, NULL, NULL, 'Ativo = 40.000 + 60.000 = 100.000. Passivo = 30.000. PL = 70.000. 100.000 = 30.000 + 70.000: equação equilibrada.', NULL, NULL, NULL, 'Some os bens e direitos de um lado e as obrigações mais o PL do outro.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-004-Q01', 'CG-004', 1, 'multipla', 'Quando o Ativo é maior que o Passivo exigível, a situação líquida é:', NULL, '["positiva (superavitária)","nula","negativa","passivo a descoberto sem PL"]', 0, NULL, NULL, NULL, NULL, 'A > P resulta em PL positivo: a entidade tem riqueza própria.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-004-Q02', 'CG-004', 2, 'multipla', 'Ativo de R$ 200.000 e Passivo exigível de R$ 200.000 indicam situação líquida:', NULL, '["nula","positiva","negativa","inexistente por falta de Ativo"]', 0, NULL, NULL, NULL, NULL, 'A = P resulta em PL igual a zero.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-004-Q03', 'CG-004', 3, 'multipla', 'A situação de passivo a descoberto ocorre quando:', NULL, '["o Passivo exigível é maior que o Ativo","o Ativo é maior que o Passivo","não existe Passivo","o PL é igual ao Ativo"]', 0, NULL, NULL, NULL, NULL, 'Passivo a descoberto = PL negativo: os bens e direitos não cobrem as dívidas.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-004-Q04', 'CG-004', 4, 'multipla', 'A empresa X tem Ativo de 80.000 e Passivo exigível de 110.000. O PL é:', NULL, '["− 30.000 (passivo a descoberto)","30.000 positivo","190.000","zero"]', 0, NULL, NULL, NULL, NULL, 'PL = 80.000 − 110.000 = − 30.000.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-004-Q05', 'CG-004', 5, 'multipla', 'Na situação "Ativo = Patrimônio Líquido", a entidade:', NULL, '["não tem dívidas com terceiros","tem passivo a descoberto","tem PL nulo","não tem bens"]', 0, NULL, NULL, NULL, NULL, 'Se A = PL, o Passivo exigível é zero: todos os recursos são próprios.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-004-Q06', 'CG-004', 6, 'multipla', 'Situação líquida negativa significa que:', NULL, '["o patrimônio próprio foi consumido por prejuízos ou dívidas","a empresa tem muito caixa","o capital social aumentou","não há obrigações"]', 0, NULL, NULL, NULL, NULL, 'PL negativo mostra que as obrigações superam os bens e direitos, normalmente após prejuízos acumulados.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-004-Q07', 'CG-004', 7, 'multipla', 'Qual situação é típica do início das atividades, quando os sócios só integralizaram capital em dinheiro?', NULL, '["Ativo = PL (sem Passivo)","Passivo a descoberto","PL nulo","Ativo menor que Passivo"]', 0, NULL, NULL, NULL, NULL, 'Só há caixa (Ativo) e capital (PL)', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-004-Q08', 'CG-004', 8, 'multipla', 'Ativo 150.000; Passivo exigível 90.000. Qual a situação?', NULL, '["Positiva, PL de 60.000","Negativa, PL de − 60.000","Nula","Passivo a descoberto de 90.000"]', 0, NULL, NULL, NULL, NULL, 'PL = 150.000 − 90.000 = 60.000, situação positiva.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-004-Q09', 'CG-004', 9, 'dissertativa', 'Explique o que é passivo a descoberto e o risco que essa situação representa para os credores.', NULL, NULL, NULL, 'É quando as obrigações superam o Ativo (PL negativo). Mesmo vendendo todos os bens e recebendo todos os direitos, a entidade não pagaria todas as dívidas', NULL, NULL, NULL, 'os credores correm risco de não receber.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-004-Q10', 'CG-004', 10, 'dissertativa', 'Descreva as possíveis situações patrimoniais comparando Ativo e Passivo exigível.', NULL, NULL, NULL, 'A > P: situação positiva (PL positivo). A = P: situação nula (PL zero). A < P: situação negativa (passivo a descoberto). Caso particular: P = 0, A = PL.', NULL, NULL, NULL, 'Uma boa resposta lista as três comparações e o sinal do PL em cada uma.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-005-Q01', 'CG-005', 1, 'multipla', 'Atos administrativos são acontecimentos que:', NULL, '["não alteram o patrimônio","sempre aumentam o Ativo","sempre geram receita","alteram apenas o PL"]', 0, NULL, NULL, NULL, NULL, 'Atos (assinar contrato, admitir empregado) não mudam o patrimônio e, em regra, não são contabilizados.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-005-Q02', 'CG-005', 2, 'multipla', 'Compra de mercadorias à vista é um fato:', NULL, '["permutativo","modificativo aumentativo","modificativo diminutivo","misto"]', 0, NULL, NULL, NULL, NULL, 'Troca-se caixa por estoque: há permuta entre contas do Ativo, sem alterar o PL.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-005-Q03', 'CG-005', 3, 'multipla', 'Pagamento de salários do mês (despesa) é um fato:', NULL, '["modificativo diminutivo","permutativo","modificativo aumentativo","misto aumentativo"]', 0, NULL, NULL, NULL, NULL, 'Sai caixa e reconhece-se despesa: o PL diminui.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-005-Q04', 'CG-005', 4, 'multipla', 'Recebimento de juros sobre aplicação financeira é um fato:', NULL, '["modificativo aumentativo","permutativo","modificativo diminutivo","misto diminutivo"]', 0, NULL, NULL, NULL, NULL, 'Entra caixa sem contrapartida em outra conta patrimonial, com receita: o PL aumenta.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-005-Q05', 'CG-005', 5, 'multipla', 'Venda de mercadoria com lucro (custo 800, venda 1.000, à vista) é um fato:', NULL, '["misto aumentativo","permutativo","misto diminutivo","modificativo diminutivo"]', 0, NULL, NULL, NULL, NULL, 'Há permuta (sai estoque) e modificação (lucro de 200): fato misto aumentativo.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-005-Q06', 'CG-005', 6, 'multipla', 'Pagamento de duplicata com juros (dívida 1.000, juros 50) é um fato:', NULL, '["misto diminutivo","permutativo","misto aumentativo","modificativo aumentativo"]', 0, NULL, NULL, NULL, NULL, 'Quita-se a dívida (permuta) e reconhece-se despesa de juros (PL diminui): misto diminutivo.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-005-Q07', 'CG-005', 7, 'multipla', 'A assinatura de um contrato de aluguel que só começará no próximo mês é:', NULL, '["ato administrativo","fato permutativo","fato modificativo","fato misto"]', 0, NULL, NULL, NULL, NULL, 'Ainda não há alteração patrimonial: é um ato, que pode ser apenas controlado em contas de compensação.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-005-Q08', 'CG-005', 8, 'multipla', 'Pagamento de fornecedor sem juros nem desconto é um fato:', NULL, '["permutativo","modificativo diminutivo","misto","modificativo aumentativo"]', 0, NULL, NULL, NULL, NULL, 'Diminui caixa (Ativo) e diminui a obrigação (Passivo) no mesmo valor', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-005-Q09', 'CG-005', 9, 'dissertativa', 'Diferencie fato permutativo, modificativo e misto, com um exemplo de cada.', NULL, NULL, NULL, 'Permutativo: troca entre contas sem alterar o PL (compra à vista). Modificativo: altera o PL (pagamento de despesa ou recebimento de receita). Misto: permuta e modificação ao mesmo tempo (venda com lucro, pagamento com juros).', NULL, NULL, NULL, 'O critério é o efeito no Patrimônio Líquido.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-005-Q10', 'CG-005', 10, 'dissertativa', 'Por que um ato administrativo, em regra, não é registrado na escrituração contábil?', NULL, NULL, NULL, 'Porque não altera o patrimônio: não muda bens, direitos, obrigações nem PL. Os relevantes (fianças, contratos) podem ser controlados em contas de compensação.', NULL, NULL, NULL, 'O ponto central é a ausência de variação patrimonial.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-006-Q01', 'CG-006', 1, 'multipla', 'Variações patrimoniais qualitativas são aquelas que:', NULL, '["alteram a composição do patrimônio sem mudar o PL","sempre aumentam o PL","sempre diminuem o PL","não alteram nenhuma conta"]', 0, NULL, NULL, NULL, NULL, 'Mudam os elementos (qualidade), mas não o valor do PL: correspondem aos fatos permutativos.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-006-Q02', 'CG-006', 2, 'multipla', 'Variações quantitativas são aquelas que:', NULL, '["alteram o valor do Patrimônio Líquido","só trocam bens por bens","não envolvem dinheiro","afetam apenas o Passivo"]', 0, NULL, NULL, NULL, NULL, 'Mudam a quantidade (valor) do PL: correspondem a fatos modificativos e mistos.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-006-Q03', 'CG-006', 3, 'multipla', 'Receitas, no aspecto patrimonial, são variações:', NULL, '["quantitativas positivas (aumentam o PL)","qualitativas","quantitativas negativas","que não afetam o PL"]', 0, NULL, NULL, NULL, NULL, 'Receita aumenta o PL', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-006-Q04', 'CG-006', 4, 'multipla', 'Despesas, no aspecto patrimonial, são variações:', NULL, '["quantitativas negativas (diminuem o PL)","qualitativas","quantitativas positivas","de ativo para ativo"]', 0, NULL, NULL, NULL, NULL, 'Despesa é consumo de recursos para gerar receita, reduzindo o PL.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-006-Q05', 'CG-006', 5, 'multipla', 'O resultado do exercício é:', NULL, '["a diferença entre receitas e despesas do período","o saldo de caixa no fim do ano","o total do Ativo","o capital social"]', 0, NULL, NULL, NULL, NULL, 'Resultado = Receitas − Despesas', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-006-Q06', 'CG-006', 6, 'multipla', 'Receitas de 90.000 e despesas de 110.000 no ano geram:', NULL, '["prejuízo de 20.000, que reduz o PL","lucro de 20.000","resultado nulo","aumento do Ativo de 200.000"]', 0, NULL, NULL, NULL, NULL, '90.000 − 110.000 = − 20.000: prejuízo, que diminui o PL.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-006-Q07', 'CG-006', 7, 'multipla', 'A compra de um veículo a prazo provoca uma variação:', NULL, '["qualitativa (Ativo e Passivo aumentam, PL não muda)","quantitativa positiva","quantitativa negativa","nula sem registro"]', 0, NULL, NULL, NULL, NULL, 'Entra veículo (Ativo) e surge a dívida (Passivo)', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-006-Q08', 'CG-006', 8, 'multipla', 'Qual fato gera variação quantitativa positiva?', NULL, '["Prestação de serviço recebida à vista","Compra de mercadoria a prazo","Pagamento de fornecedor","Depósito de caixa no banco"]', 0, NULL, NULL, NULL, NULL, 'Serviço prestado gera receita, que aumenta o PL.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-006-Q09', 'CG-006', 9, 'dissertativa', 'Explique a diferença entre variação patrimonial qualitativa e quantitativa e relacione cada uma com os tipos de fatos administrativos.', NULL, NULL, NULL, 'Qualitativa muda a composição sem alterar o PL (fatos permutativos). Quantitativa muda o valor do PL, para mais ou para menos (fatos modificativos e mistos).', NULL, NULL, NULL, 'O critério é se o Patrimônio Líquido muda de valor.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
VALUES ('CG-006-Q10', 'CG-006', 10, 'dissertativa', 'Como receitas e despesas se ligam ao Patrimônio Líquido ao final do exercício?', NULL, NULL, NULL, 'Receitas aumentam e despesas diminuem o PL. No encerramento, são confrontadas na apuração do resultado', NULL, NULL, NULL, 'o lucro ou prejuízo é transferido para o PL.', 'curado', 1, '2026-10-08T00:00:00.000Z')
ON CONFLICT(id) DO NOTHING;
