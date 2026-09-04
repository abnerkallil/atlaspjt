# Quadro Kanban — Atlas Pessoal

**Atualizado em:** 4 de setembro de 2026  
**Objetivo atual:** concluir a experiência visual do Atlas Pessoal antes de implementar o núcleo funcional.

## Estrutura recomendada do quadro

Crie estas listas no Trello, nesta ordem:

1. **📥 Ideias e futuro**
2. **🧭 Precisa de decisão**
3. **📋 Pronto para fazer**
4. **⚙️ Em andamento**
5. **🔎 Revisão e validação**
6. **✅ Concluído**

## Etiquetas recomendadas

### Prioridade

- **P0 — essencial para o MVP**
- **P1 — importante após o núcleo**
- **P2 — evolução futura**

### Área

- Produto
- UX/UI
- Frontend
- Backend
- Dados
- Pedagogia
- IA
- Privacidade/Segurança
- Pesquisa
- Infraestrutura

## Regra de movimentação

- Um cartão só sai de **Precisa de decisão** quando seus critérios estiverem registrados.
- Um cartão só entra em **Pronto para fazer** quando não depender de outra decisão aberta.
- **Em andamento** deve ter no máximo dois cartões simultâneos nesta fase.
- Um cartão só chega a **Concluído** após validação visual ou funcional.
- Itens do Atlas Business e recursos posteriores não disputam prioridade com o MVP pessoal.

---

# 🧭 Precisa de decisão

## DEC-01 — Definir a área lateral da sessão de estudo

**Etiquetas:** P0, Produto, UX/UI  
**Objetivo:** decidir o que permanece visível ao lado do material principal.

**Decidir:**

- notas do usuário;
- sequência da sessão;
- referências/anexos;
- painel alternável entre essas opções;
- comportamento no celular.

**Critério de saída:** wireframe aprovado para desktop e celular.

## DEC-02 — Definir a pontuação inicial de 100 pontos

**Etiquetas:** P0, Pedagogia, Dados  
**Dependência:** modelo de evidências.

**Decidir:**

- peso da cobertura;
- peso das avaliações;
- peso de quizzes e revisões;
- peso das notas;
- peso de exercícios e projetos;
- contribuição de retenção e consistência;
- limites permitidos para ajuste adaptativo.

**Critério de saída:** fórmula inicial versionada, somando 100 pontos e acompanhada de exemplos.

## DEC-03 — Formalizar as transições pedagógicas

**Etiquetas:** P0, Produto, Pedagogia  
**Objetivo:** transformar os estados conceituais em regras executáveis.

**Decidir:**

- eventos que mudam cada estado;
- transições automáticas;
- transições que exigem confirmação;
- condições de bloqueio e desbloqueio;
- retorno da recuperação;
- regras da revalidação.

**Critério de saída:** diagrama e tabela de transições sem ambiguidades.

## DEC-04 — Definir como medir cobertura de uma nota

**Etiquetas:** P0, Pedagogia, IA, Pesquisa  
**Objetivo:** medir conhecimento coberto sem premiar quantidade de texto.

**Decidir:**

- evidências mínimas por subtópico;
- diferença entre citação, descrição e explicação própria;
- tratamento de notas breves e corretas;
- confirmação ou contestação pelo usuário;
- limites da análise automática.

**Critério de saída:** rubrica com exemplos aprovados, incompletos e rejeitados.

## DEC-05 — Definir a arquitetura do conteúdo e dos pré-requisitos

**Etiquetas:** P0, Produto, Dados, Pedagogia  
**Objetivo:** validar a hierarquia Roadmap → fase → disciplina → conteúdo → subtópico → evidência.

**Decidir:**

- quais níveis são obrigatórios;
- como representar dependências;
- como tratar fundamentos compartilhados entre roadmaps;
- como funciona a dispensa por proficiência;
- como marcar evidências-chave.

**Critério de saída:** modelo validado com Contabilidade Geral como exemplo.

## DEC-06 — Escolher infraestrutura do usuário único

**Etiquetas:** P0, Backend, Infraestrutura  
**Objetivo:** escolher a base técnica gratuita ou de baixo custo.

**Decidir:**

- banco de dados;
- autenticação;
- armazenamento de imagens e PDFs;
- ambiente de desenvolvimento e produção;
- backup;
- limites gratuitos e custo de crescimento.

**Critério de saída:** decisão arquitetural registrada com custos e plano de migração.

## DEC-07 — Definir anexos e limites de PDF

**Etiquetas:** P0, Produto, Backend, Privacidade/Segurança  
**Decidir:** formatos, tamanho máximo, visualização, extração de texto, direitos autorais, retenção e exclusão.

**Critério de saída:** política técnica e de produto para o MVP.

## DEC-08 — Definir o escopo de privacidade do MVP

**Etiquetas:** P0, Privacidade/Segurança, Produto  
**Objetivo:** preparar o sistema para o futuro PrivateLink sem prometer isolamento inexistente.

**Decidir:**

- quais dados podem ser analisados por IA;
- consentimento e transparência;
- retenção e exclusão;
- separação entre conteúdo e dados pessoais;
- requisitos arquiteturais para o PrivateLink futuro.

**Critério de saída:** matriz de dados e regras de acesso.

## DEC-09 — Definir a agenda interna

**Etiquetas:** P0, Produto, Pedagogia  
**Decidir:**

- criação de eventos de estudo e revisão;
- horário padrão das 7h;
- duração e prioridade;
- conclusão manual ou por evidência;
- reagendamento;
- tratamento de recuperação urgente.

**Critério de saída:** fluxo diário aprovado com exemplos 24h, 7 dias e 30 dias.

## DEC-10 — Definir a composição das avaliações

**Etiquetas:** P0, Pedagogia, Produto  
**Decidir:**

- quantidade por tipo de questão;
- tempo por questão e prova;
- exigência prática por tipo de competência;
- exame de meia conclusão;
- avaliação final de domínio;
- recuperação.

**Critério de saída:** matrizes de avaliação para um tema conceitual e um tema prático.

## DEC-11 — Definir a origem e a licença do banco de questões

**Etiquetas:** P1, Pedagogia, Pesquisa, Privacidade/Segurança  
**Decidir:** questões autorais, públicas, licenciadas ou híbridas; armazenamento; atribuição; possibilidade de transformação por IA.

**Critério de saída:** fonte legalmente utilizável e processo de curadoria.

## DEC-12 — Definir o nível mínimo de acessibilidade

**Etiquetas:** P1, UX/UI, Frontend  
**Decidir:** teclado, contraste, leitores de tela, redução de movimento, legendas e adaptação dos quizzes.

**Critério de saída:** checklist de aceitação aplicável a todas as páginas.

---

# 📋 Pronto para fazer — experiência visual

## UX-01 — Finalizar o fluxo da página Estudar

**Etiquetas:** P0, UX/UI, Frontend  
**Dependência:** DEC-01.

**Checklist:**

- material de leitura;
- vídeo ou PDF;
- atividade prática;
- notas durante a sessão;
- encerramento da sessão;
- criação das questões de fixação;
- versão para celular.

## UX-02 — Desenhar a página Roadmap

**Etiquetas:** P0, UX/UI, Frontend

**Checklist:**

- visão por fases;
- progresso bruto e ajustado;
- pré-requisitos;
- conteúdos bloqueados;
- estados pedagógicos;
- penalidades e recuperação;
- justificativa das alterações do Atlas;
- detalhe da disciplina e do conteúdo.

## UX-03 — Desenhar a página Notas

**Etiquetas:** P0, UX/UI, Frontend

**Checklist:**

- árvore de pastas;
- editor;
- salvamento automático demonstrativo;
- anexos;
- associação ao roadmap;
- mapa de cobertura;
- indicação visual de conteúdo privado;
- estados vazio, carregando e erro.

## UX-04 — Desenhar a página Quizzes

**Etiquetas:** P0, UX/UI, Frontend

**Checklist:**

- preparação e regras;
- múltipla escolha;
- questão discursiva;
- caso prático;
- timer;
- navegação entre questões;
- revisão antes do envio;
- resultado e correção;
- recuperação;
- reporte de questão.

## UX-05 — Desenhar a página Progresso

**Etiquetas:** P0, UX/UI, Frontend

**Checklist:**

- visão por competência;
- histórico e tendência;
- retenção;
- consistência;
- proficiência versus domínio;
- conteúdos em risco;
- recuperação;
- explicação das recomendações.

## UX-06 — Revisar a página Hoje

**Etiquetas:** P0, UX/UI, Frontend  
**Dependências:** UX-01 a UX-05.

**Checklist:**

- remover informações redundantes;
- substituir exemplos provisórios;
- validar a hierarquia diária;
- conectar visualmente às páginas definitivas;
- revisar versão móvel.

## UX-07 — Consolidar o sistema de componentes

**Etiquetas:** P0, UX/UI, Frontend

**Checklist:**

- cores e tokens;
- tipografia;
- botões;
- cartões;
- estados e alertas;
- barras e indicadores;
- modais e painéis;
- formulários;
- documentação de uso.

## UX-08 — Executar validação visual e responsiva

**Etiquetas:** P0, UX/UI, Frontend

**Checklist:** desktop, notebook, tablet, celular, zoom, contraste e navegação por teclado básica.

---

# 📋 Pronto para fazer — fundação técnica

## TEC-01 — Reorganizar o protótipo em páginas e componentes

**Etiquetas:** P0, Frontend  
**Dependência:** UX-07.

**Checklist:** separar rotas, cabeçalho, componentes comuns, dados demonstrativos e estados locais.

## TEC-02 — Desenhar o modelo de dados

**Etiquetas:** P0, Backend, Dados  
**Dependências:** DEC-03 e DEC-05.

**Checklist:** usuário, roadmap, fase, disciplina, conteúdo, subtópico, sessão, nota, anexo, questão, tentativa, revisão, avaliação, evidência, estado e evento de auditoria.

## TEC-03 — Implementar autenticação para usuário único

**Etiquetas:** P0, Backend, Privacidade/Segurança  
**Dependência:** DEC-06.

**Checklist:** login, sessão, recuperação de acesso, proteção das páginas e configuração segura.

## TEC-04 — Implementar persistência básica

**Etiquetas:** P0, Backend, Dados  
**Dependências:** TEC-02 e TEC-03.

**Checklist:** roadmaps, conteúdos, progresso, sessões, tarefas e preferências.

## TEC-05 — Implementar armazenamento de anexos

**Etiquetas:** P0, Backend, Privacidade/Segurança  
**Dependências:** DEC-06, DEC-07 e TEC-03.

**Checklist:** upload, visualização, limites, exclusão, metadados e autorização.

## TEC-06 — Criar trilha de auditoria

**Etiquetas:** P0, Backend, Dados, Privacidade/Segurança  
**Dependência:** TEC-02.

**Checklist:** registrar autor, momento, estado anterior, estado novo, motivo e evidência relacionada.

## TEC-07 — Configurar testes e integração contínua

**Etiquetas:** P1, Frontend, Backend, Infraestrutura

**Checklist:** verificação de código, testes essenciais, build automático e proteção da branch principal.

## TEC-08 — Publicar a versão visual atualizada

**Etiquetas:** P0, Infraestrutura  
**Dependência:** aprovação da rodada visual.

**Checklist:** build, verificação, publicação privada e atualização do documento de status.

---

# 📋 Pronto para fazer — núcleo funcional

## MVP-01 — Implementar conteúdos e pré-requisitos

**Etiquetas:** P0, Backend, Pedagogia  
**Dependências:** TEC-02, TEC-04 e DEC-05.

## MVP-02 — Implementar sessões de estudo

**Etiquetas:** P0, Frontend, Backend  
**Dependências:** UX-01 e TEC-04.

**Checklist:** iniciar, pausar, retomar, concluir, salvar ponto atual e registrar evidências.

## MVP-03 — Implementar Atlas Notes

**Etiquetas:** P0, Frontend, Backend  
**Dependências:** UX-03, TEC-04 e TEC-05.

**Checklist:** pastas, editor, salvamento, anexos, vínculo com conteúdo e histórico.

## MVP-04 — Implementar quizzes pré-cadastrados

**Etiquetas:** P0, Frontend, Backend, Pedagogia  
**Dependências:** UX-04, TEC-04 e DEC-10.

**Checklist:** execução, timer, envio, correção, tentativas, resultado e registro por conteúdo.

## MVP-05 — Implementar agenda interna

**Etiquetas:** P0, Frontend, Backend, Pedagogia  
**Dependências:** DEC-09 e TEC-04.

## MVP-06 — Implementar revisões 24h/7d/30d

**Etiquetas:** P0, Backend, Pedagogia  
**Dependências:** MVP-04 e MVP-05.

**Checklist:** agendamento, quiz principal, corretivo, recuperação urgente e resumo final.

## MVP-07 — Implementar cálculo determinístico de progresso

**Etiquetas:** P0, Backend, Dados, Pedagogia  
**Dependências:** DEC-02, DEC-03 e TEC-06.

## MVP-08 — Implementar recuperação e bloqueios

**Etiquetas:** P0, Backend, Pedagogia  
**Dependências:** MVP-01, MVP-04 e MVP-07.

## MVP-09 — Implementar relatórios explicáveis

**Etiquetas:** P0, Frontend, Backend, Dados  
**Dependências:** MVP-07 e UX-05.

**Checklist:** origem da nota, mudança de estado, risco, próxima ação e histórico.

## MVP-10 — Realizar teste longitudinal com o usuário inicial

**Etiquetas:** P0, Produto, Pesquisa  
**Dependência:** MVP-01 a MVP-09.

**Checklist:** protocolo, uso real, registro de dificuldades, métricas, entrevistas e correções.

---

# 📥 Ideias e futuro — inteligência

## IA-01 — Pesquisar métodos do AtlasStudy

**Etiquetas:** P1, Pesquisa, Pedagogia  
**Descrição:** revisar evidências sobre repetição espaçada, recuperação ativa, intercalação, feedback, prática deliberada e métodos de anotação.

## IA-02 — Associar notas aos conteúdos com assistência de IA

**Etiquetas:** P1, IA, Dados  
**Dependências:** MVP-03 e DEC-04.

## IA-03 — Gerar e validar questões

**Etiquetas:** P1, IA, Pedagogia  
**Dependências:** DEC-10, DEC-11 e MVP-04.

**Checklist:** geração, resolução independente, validação da alternativa correta, dificuldade, contexto suficiente e detecção de duplicatas.

## IA-04 — Criar recomendação personalizada

**Etiquetas:** P1, IA, Dados, Pedagogia  
**Dependência:** dados longitudinais suficientes.

## IA-05 — Implementar pesos adaptativos limitados

**Etiquetas:** P2, IA, Dados, Pedagogia  
**Dependências:** DEC-02 e validação longitudinal.

## IA-06 — Implementar análise de inconsistências

**Etiquetas:** P2, IA, Dados, Privacidade/Segurança  
**Descrição:** identificar divergências para revisão, sem condenação automática.

## IA-07 — Especificar e prototipar Hades

**Etiquetas:** P2, IA, Pedagogia  
**Dependência:** núcleo determinístico e dados reais.

## IA-08 — Especificar e prototipar Themis

**Etiquetas:** P2, IA, Pedagogia  
**Dependência:** IA-07 e trilha de auditoria.

## IA-09 — Orquestrar o debate Hades–Themis no Atlas

**Etiquetas:** P2, IA, Produto  
**Dependências:** IA-07 e IA-08.

**Checklist:** constituições versionadas, métricas diferentes, contestação, síntese, explicação e escalonamento humano.

---

# 📥 Ideias e futuro — integrações e expansão

## FUT-01 — Importar notas do Obsidian

**Etiquetas:** P2, Backend, Dados.

## FUT-02 — Criar links bidirecionais no Atlas Notes

**Etiquetas:** P2, Frontend, Backend.

## FUT-03 — Implementar PrivateLink real

**Etiquetas:** P2, Privacidade/Segurança, Backend  
**Observação:** exige isolamento técnico verificável, não apenas uma indicação visual.

## FUT-04 — Integrar Google Calendar

**Etiquetas:** P2, Backend, Infraestrutura.

## FUT-05 — Criar gamificação responsável

**Etiquetas:** P2, Produto, Pedagogia.

## FUT-06 — Desenvolver o Selo Atlas de Domínio

**Etiquetas:** P2, Produto, Pedagogia, Privacidade/Segurança  
**Dependência:** validação do sistema avaliativo e política de contestação.

## FUT-07 — Planejar a transição para Atlas Business

**Etiquetas:** P2, Produto  
**Dependência:** utilidade e validade demonstradas no Atlas Pessoal.

---

# ✅ Concluído

Crie estes cartões como histórico inicial do quadro:

## DONE-01 — Definir a visão do Atlas Pessoal

**Etiquetas:** Produto.

## DONE-02 — Separar Atlas Pessoal e Atlas Business

**Etiquetas:** Produto.

## DONE-03 — Definir princípios de competência e progressão

**Etiquetas:** Pedagogia, Produto.

## DONE-04 — Definir proficiência, domínio, recuperação e revalidação

**Etiquetas:** Pedagogia.

## DONE-05 — Definir conceitualmente a rotina 24h/7d/30d

**Etiquetas:** Pedagogia.

## DONE-06 — Conceber Atlas Notes e PrivateLink

**Etiquetas:** Produto, Privacidade/Segurança.

## DONE-07 — Conceber Atlas, Hades e Themis

**Etiquetas:** Produto, IA.

## DONE-08 — Definir a identidade visual

**Etiquetas:** UX/UI.

## DONE-09 — Criar a navegação principal

**Etiquetas:** Frontend, UX/UI.

## DONE-10 — Criar o protótipo da página Hoje

**Etiquetas:** Frontend, UX/UI.

## DONE-11 — Criar a primeira versão da página Estudar

**Etiquetas:** Frontend, UX/UI.

## DONE-12 — Criar retomada direta e lista completa do conteúdo

**Etiquetas:** Frontend, UX/UI.

## DONE-13 — Criar documentação fundacional e de status

**Etiquetas:** Produto.

## DONE-14 — Criar repositório Git local e checkpoint do projeto

**Etiquetas:** Infraestrutura.

## DONE-15 — Adicionar o GitHub como segundo repositório remoto

**Etiquetas:** Infraestrutura.  
**Observação:** o envio do código ainda precisa ser confirmado no próprio repositório GitHub.

---

# Ordem prática para começar

Coloque no topo do quadro:

1. **DEC-01 — área lateral da sessão de estudo**;
2. **UX-01 — finalizar Estudar**;
3. **UX-02 — desenhar Roadmap**;
4. **UX-03 — desenhar Notas**;
5. **UX-04 — desenhar Quizzes**;
6. **UX-05 — desenhar Progresso**;
7. **UX-06 — revisar Hoje**;
8. **UX-07 — consolidar componentes**;
9. **DEC-03 e DEC-05 — estados e modelo de conteúdo**;
10. **DEC-06 — infraestrutura**;
11. **TEC-02 — modelo de dados**;
12. iniciar o núcleo funcional.

Essa ordem mantém a experiência visível avançando, mas impede que decisões fundamentais do banco e do motor pedagógico sejam adiadas até tarde demais.
