# ATLAS PROJECT — ARCHITECTURE GATE

## Purpose

This file is the temporary communication interface between Claude Code and Raf when a real Architecture Gate is triggered.

It exists to preserve separation of authority:
- Atlas defines the original product requirement;
- Claude Code reports relevant repository facts;
- Raf makes the architectural decision.

This file must NOT be used for routine implementation questions.

If no Architecture Gate exists, this file should remain in the IDLE state.

---

# GATE STATUS

Status: RESOLVED — DEC-007 (ACCEPTED); autenticação na aplicação (Worker) + cookie assinado stateless

---

# QUEST

QUEST-010 — Infraestrutura restante do usuário único, item 1: autenticação (Correlation: ATLAS-RAF-GATE-20260929-AUTH)

---

# ARCHITECTURAL QUESTION

Qual mecanismo de autenticação e de sessão persistente o Atlas Notes (usuário único, Worker na conta Cloudflare própria) deve adotar para que só o próprio usuário acesse páginas e APIs?

---

# GATE TRIGGER

"authentication or security architecture" (Architecture Gate item 4). Define a fronteira de segurança do produto e afeta os demais itens do quest (acesso a anexos, ambientes).

---

# ORIGINAL REQUIREMENT

Ver `docs/quests/ACTIVE.md`: "Usuário consegue se autenticar (login) para acessar seus próprios dados; a sessão persiste entre visitas sem exigir novo login a cada acesso." Critério: login/logout funcional, sessão persistente validada manualmente, com credencial real. Non-goal: autenticação multiusuário (Atlas Business).

---

# RELEVANT REPOSITORY FACTS

1. Não existe nenhum mecanismo de autenticação: nenhum `middleware.ts`/`proxy.ts`, nenhuma verificação de sessão/cookie; nenhuma tabela de usuário em `db/schema.ts` (tabelas: `atlas_note_folders`, `atlas_notes`, `atlas_note_links` e correlatas, sem coluna de dono/`user_id`).
2. As rotas de API (`app/api/notes/route.ts`, `app/api/notes/folders/route.ts`) usam `runtime = 'edge'`, leem/escrevem D1 via binding `DB` (`lib/notes-store.ts`, `cloudflare:workers`) e não verificam identidade do chamador. A URL de produção `https://atlas-notes.atlaspjt.workers.dev` é pública; qualquer requisição a `GET/POST /api/notes` chega ao D1.
3. Páginas do app ficam no route group `app/(atlas)/` (Hoje, Estudar, Roadmap, Notas, Quizzes, Progresso) e `app/notes-spike/`; todas renderizadas via vinext 1.0.0 (DEC-006) e servidas por Worker (`wrangler`, build em `dist/server/wrangler.json`, ajustado por `scripts/prepare-own-deploy.mjs`).
4. Deploy é manual pelo usuário (Worker `atlas-notes`, D1 `atlas-notes-own`); não há secrets/vars configurados no repositório; `wrangler.local.jsonc` declara só o binding D1 local.
5. O plano gratuito da Cloudflare (Workers Free: 100k req/dia) está mapeado como folgado para usuário único. Este ambiente do Claude Code não tem acesso à conta Cloudflare, portanto login com credencial real e configuração de secrets/serviços só podem ser feitos/validados pelo usuário.
6. Dependências atuais não incluem biblioteca de auth/sessão. Não foi avaliada compatibilidade de nenhuma biblioteca com vinext 1.0.0 / runtime Workers.
7. Cloudflare Access (Zero Trust) é um serviço da conta Cloudflare do usuário, externo ao código do repositório; disponibilidade e limites do plano Free para esse serviço não foram verificados aqui.

---

# OPTIONS AND TRADE-OFFS

A. Autenticação na própria aplicação (código no Worker): login com credencial única (ex.: senha do usuário, hash guardado como secret do Worker), sessão em cookie assinado/`HttpOnly`, verificação em rotas de API e páginas. Trade-offs: controle total da UX de login/logout; sem dependência de serviço externo; exige código de segurança próprio (hash, cookie, expiração, proteção de força bruta/CSRF) mantido no repositório; sem tabela de sessões, revogação limitada (a menos que sessões sejam persistidas em D1 — o que muda o modelo de dados).

B. Autenticação na borda via Cloudflare Access (Zero Trust) na frente do Worker: o login é feito pelo provedor de identidade configurado na conta; o Worker apenas valida o JWT de Access. Trade-offs: pouco código de segurança no repositório; sessão gerenciada pela Cloudflare; login/logout não é UX própria do Atlas; depende de configuração fora do repositório e de disponibilidade/limites do plano Free; ambiente local/dev precisaria de bypass ou simulação.

C. Autenticação por biblioteca/provedor OAuth de terceiros no código (ex.: login social ou biblioteca de auth compatível com Workers). Trade-offs: sessão/identidade padronizadas; nova dependência estrutural, possivelmente com tabelas próprias no D1 (mudança de modelo de dados) e compatibilidade com vinext/Workers não verificada; provedor externo passa a fazer parte do caminho de acesso.

---

# DECISION REQUIRED

Qual opção (ou outra) adotar para autenticação e sessão persistente, incluindo se sessões/credenciais podem ser persistidas no D1 e onde ficam os segredos. Os Gates de storage de anexos, dev/produção e backup só serão abertos após esta decisão (um Gate por vez); a implementação de autenticação não foi iniciada.

---

# RAF DECISION

### Decision

Autenticação implementada na própria aplicação (código do Worker), não na borda Cloudflare e sem provedor OAuth de terceiro (Opção A). Sessão persistente via cookie assinado, HttpOnly, Secure, com expiração/renovação — sem tabela de sessão no D1 (stateless). Credencial e secret de assinatura do cookie ficam apenas como Worker secrets, fora do repositório e fora do D1.

### Rationale

1. Para um único usuário, autenticação em código é o menor mecanismo suficiente: elimina a superfície pública atual sem introduzir dependência externa (Cloudflare Access) cuja disponibilidade/limites no plano Free não foram verificados, nem provedor OAuth cuja compatibilidade com vinext/Workers também não foi verificada.
2. Cookie assinado stateless satisfaz "sessão persiste entre visitas" sem exigir nova tabela de usuário/sessão no D1 — menor mudança de modelo de dados possível, coerente com o non-goal explícito de multiusuário.
3. Manter credencial e secret fora do repositório e do D1 preserva o padrão já em uso no projeto (nenhum secret versionado hoje) e evita criar um novo local de segredo.

### Constraints for Claude Code

- Nenhuma tabela nova de `user`/`session` em `db/schema.ts` para satisfazer este Gate; sessão é um cookie assinado, não um registro persistido.
- Hash da credencial e o secret de assinatura do cookie devem ser Worker secrets (`wrangler secret`), nunca commitados, nunca gravados no D1.
- Cookie deve ser `HttpOnly`, `Secure`, com expiração explícita e mecanismo de renovação — nenhum token de sessão exposto a JavaScript no cliente.
- A verificação de sessão deve ser aplicada de forma uniforme a: (a) toda página em `app/(atlas)/` e `app/notes-spike/`, e (b) toda rota sob `/api/notes*` — nenhuma rota pode depender só de checagem no cliente. O ponto exato de interceptação (middleware/proxy, guard por rota, etc.) é decisão de implementação do Claude Code, condicionada à compatibilidade real com vinext 1.0.0/runtime edge do Worker.
- Não introduzir Cloudflare Access nem biblioteca/provedor OAuth como parte desta decisão.
- Separação de credencial entre ambiente local e produção é matéria do Gate 3 (dev/produção), não deste Gate — não antecipar essa decisão aqui além de o secret de produção nunca ser exposto localmente.
- Login/logout (rotas, algoritmo de hash, formato exato do cookie, nome de cookie, mensagens de erro) são detalhes de implementação, não arquiteturais.

### DEC Required

YES

---

# GATE 2 — STORAGE DE ANEXOS

Status: RESOLVED — DEC-008 (ACCEPTED); bytes em R2 + metadados em D1, acesso só via rota autenticada do Worker

Correlation: ATLAS-RAF-GATE-20260929-STORAGE

## Quest

QUEST-010 — Infraestrutura restante do usuário único, item 2: armazenamento durável de anexos.

## Architectural question

Onde e como armazenar os bytes dos anexos (PNG/JPG/JPEG/PDF/DOCX, até 10MB por arquivo — DEC-07) de forma durável, acessível somente ao próprio usuário autenticado (DEC-007), e como esses arquivos se relacionam ao modelo de dados das notas?

## Gate trigger

"persistent data model change" e "significant structural dependency" (Architecture Gate itens 1 e 3): introduz um novo local de persistência de dados do usuário e possivelmente um novo binding de infraestrutura.

## Original requirement

Ver `docs/quests/ACTIVE.md`: "Usuário consegue anexar imagem (PNG/JPG/JPEG) ou documento (PDF/DOCX) até 10MB (DEC-07); o arquivo fica armazenado de forma durável e só o próprio usuário consegue acessá-lo." Critério: upload funcional, arquivo continua acessível após reload/nova sessão.

## Relevant repository facts

1. Hoje não existe armazenamento de bytes: o bloco "Anexos" em `components/notes-workspace.tsx` é demonstrativo (estado local com `id`, `name`, `size`; "No file bytes are ever" enviados/gravados). Não há rota de upload nem tabela de anexos em `db/schema.ts` (tabelas: `atlas_note_folders`, `atlas_notes`, `atlas_note_links`, `atlas_sync_operations`).
2. Único binding de dados em produção: D1 `DB` (`atlas-notes-own`, Worker `atlas-notes`, DEC-005). `.openai/hosting.json` declara `"r2": null`; `vite.config.ts` só cria binding R2 local se `r2` estiver definido. Nenhum bucket R2 é referenciado em `dist/server/wrangler.json` gerado pelo build nem em `scripts/prepare-own-deploy.mjs`.
3. Autenticação (DEC-007) está implementada em `proxy.ts`: qualquer rota nova do Worker é protegida por padrão (falha fechada), exceto `/login`, `/api/auth/login`, `/api/auth/logout` e os assets estáticos `/favicon.svg` e `/og.png`. Arquivos servidos por uma rota do Worker herdam essa verificação; arquivos servidos por URL pública/assinada de um serviço externo não a herdam.
4. Limites de plataforma relevantes (conforme documentação Cloudflare conhecida; não verificados nesta conta, que este ambiente não acessa): D1 limita o tamanho de uma linha/valor (ordem de 2MB), abaixo do limite de 10MB do DEC-07; o tamanho de corpo de requisição aceito pelo Worker é maior que 10MB no plano Free. Disponibilidade, cota gratuita e requisitos de ativação de R2 na conta do usuário não foram verificados.
5. O backup (Gate 4) e o isolamento dev/produção (Gate 3) ainda não foram decididos; a escolha de storage afeta o que precisará ser coberto por eles.
6. Este ambiente do Claude Code não tem acesso à conta Cloudflare; criar bucket/bindings e validar upload real em produção só pode ser feito pelo usuário.

## Options and trade-offs

A. Bytes em bucket Cloudflare R2, metadados (nome, tipo, tamanho, chave do objeto, nota associada) em nova tabela no D1; upload e download intermediados por rotas do Worker sob a verificação de sessão. Trade-offs: sem limite de linha do D1 para arquivos de 10MB; exige criar bucket e novo binding `wrangler` (mudança de infraestrutura na conta do usuário) e nova tabela/migration no D1; disponibilidade e cota gratuita de R2 nesta conta a verificar; backup precisa cobrir dois locais (D1 + R2).

B. Bytes no próprio D1 (BLOB ou fragmentados em partes), sem novo serviço. Trade-offs: nenhuma nova infraestrutura nem binding; exige nova tabela/migration; o limite de tamanho por linha/valor do D1 é menor que os 10MB do DEC-07, o que obriga fragmentação em múltiplas linhas ou reduz o limite efetivo; aumenta o tamanho do banco (limites de armazenamento do D1 Free) e o custo de leitura/escrita por arquivo; backup permanece em um único local.

C. Outra alternativa proposta por Raf (por exemplo, serviço de storage externo à conta Cloudflare). Trade-offs a serem definidos por Raf; introduz dependência externa e um novo local de segredo/credencial, ainda não avaliados neste repositório.

## Decision required

Qual opção (ou outra) adotar para o storage de anexos, incluindo: onde os bytes residem; se é criada tabela de metadados no D1 (mudança de schema); e como o acesso ao arquivo é restrito ao usuário autenticado. Os Gates de dev/produção e backup só serão abertos após esta decisão (um Gate por vez); nenhuma implementação de storage foi iniciada.

## Raf decision

### Decision

Bytes dos anexos em bucket Cloudflare R2 (Opção A). Metadados (id, nota associada, nome original, mime type, tamanho em bytes, chave do objeto R2, timestamp) em nova tabela no D1 — sem bytes armazenados nela. O bucket R2 não tem acesso público nem URL assinada (presigned) exposta ao cliente; upload e download acontecem exclusivamente por rotas do Worker, sob a mesma verificação de sessão de DEC-007 (fail-closed via `proxy.ts`).

### Rationale

1. O limite de linha/valor do D1 (~2MB) é menor que os 10MB exigidos pelo DEC-07; guardar bytes no D1 (Opção B) exigiria fragmentar arquivos em múltiplas linhas só para contornar um limite de plataforma, além de inflar o mesmo banco usado pelas notas — não é a menor arquitetura correta.
2. R2 é o par natural do D1 já em uso, na mesma conta Cloudflare e no mesmo Worker (DEC-005): resolve durabilidade sem depender de serviço ou credencial externos à conta do usuário, tornando a Opção C desnecessária.
3. DEC-007 protege rotas do Worker, não URLs externas de um serviço de storage (fato #3 do Gate); portanto o requisito "só o próprio usuário consegue acessá-lo" só é satisfeito se os bytes forem servidos exclusivamente por rota do Worker, nunca por link direto/assinado do R2.

### Constraints for Claude Code

- Nova tabela em `db/schema.ts` para metadados do anexo (nome exato da tabela/colunas é detalhe de implementação), sem coluna de bytes; bytes ficam só no R2.
- Bucket R2 configurado sem acesso público e sem presigned URLs entregues ao cliente; todo upload/download passa por rota própria do Worker.
- As rotas de upload/download de anexos ficam sob a mesma verificação de sessão de DEC-007 (fail-closed via `proxy.ts`) — não entram na lista de exceções (`/login`, `/api/auth/*`, assets estáticos).
- O limite de 10MB por arquivo (DEC-07) é validado no Worker no caminho de upload; não depende do limite de linha do D1.
- Nome de rotas, nome do binding R2, streaming vs. buffer completo, formato de resposta, etc. são decisões de implementação do Claude Code.
- Backup (Gate 4) passa a precisar cobrir dois locais (D1 + R2) — não decidido aqui, apenas registrado como consequência para aquele Gate.
- Isolamento dev/produção (Gate 3) precisará decidir se há bucket R2 separado para dev — não decidido aqui.

### DEC Required

YES

---

# GATE 3 — ISOLAMENTO DEV/PRODUÇÃO

Status: RESOLVED — DEC-009 (ACCEPTED); dev isolado localmente (Miniflare), sem staging remoto; credenciais e scripts de deploy/seed separados por restrição explícita

Correlation: ATLAS-RAF-GATE-20260930-DEVPROD

## Quest

QUEST-010 — Infraestrutura restante do usuário único, item 3: desenvolver/testar mudanças sem afetar ou corromper os dados reais de produção.

## Architectural question

Como separar os ambientes de desenvolvimento/teste e de produção — dados (D1 e R2), credenciais/secrets e fluxo de deploy — de modo que dado de teste enviado em dev nunca apareça em produção e que uma credencial/segredo de produção nunca seja necessário localmente?

## Gate trigger

"expensive or difficult-to-reverse technical decision" e "architectural boundary change" (Architecture Gate itens 6 e 9): define a fronteira entre ambientes de dados e de credenciais; afeta bindings de infraestrutura na conta do usuário e o fluxo de deploy.

## Original requirement

Ver `docs/quests/ACTIVE.md`: "É possível desenvolver/testar mudanças sem afetar ou corromper os dados reais de produção." Critério: "Ambiente de desenvolvimento comprovadamente isolado de produção (dado de teste enviado em dev não aparece em produção)."

## Relevant repository facts

1. Desenvolvimento local (`vinext dev`, `wrangler dev`) usa bindings locais emulados (Miniflare) com estado em `.wrangler/state` (ignorado pelo git): D1 local `site-creator-d1` (id placeholder) definido em `vite.config.ts`/`wrangler.local.jsonc`; migrations locais via `pnpm run db:migrate:local`. Nenhum desses caminhos referencia o D1 de produção `atlas-notes-own`.
2. O build (`pnpm run build`) gera `dist/server/wrangler.json` sempre com o `database_id` de placeholder e o bucket `site-creator-r2`; `scripts/prepare-own-deploy.mjs` substitui o nome do Worker, o D1 (`--id`/`--db`) e o bucket R2 (`--bucket`) de produção antes de `wrangler deploy` (deploy manual, conforme DEC-005; sem deploy automático, conforme Non-Goals do QUEST-010).
3. Após DEC-008, o binding R2 `ATTACHMENTS` existe: localmente é emulado pelo Miniflare (bucket `site-creator-r2`); em produção aponta para o bucket criado na conta do usuário (nome passado ao `prepare-own-deploy.mjs`). Não existe hoje um segundo bucket/banco remoto dedicado a dev/staging.
4. Credenciais de autenticação (DEC-007): em produção são Worker secrets (`ATLAS_PASSWORD_HASH`, `ATLAS_SESSION_SECRET`); localmente são lidas de `.dev.vars` (ignorado pelo git). DEC-007 deixou a separação de credencial dev/produção para este Gate.
5. `scripts/export-data.mjs` e `scripts/seed-notes.mjs` (DEC-004/DEC-005) movem dados entre ambientes; `scripts/seed-data/atlas-export-production-20260928.json` é um export de produção versionado no repositório.
6. DEC-008 registra como consequência que este Gate deve contemplar se haverá bucket R2 separado para dev, além do D1.
7. Este ambiente do Claude Code não acessa a conta Cloudflare; criar bancos/buckets/Workers adicionais e validar isolamento em nuvem só pode ser feito pelo usuário.

## Options and trade-offs

A. Dev apenas local (Miniflare para D1 e R2, `.dev.vars` local), sem recursos remotos de dev; produção é o único ambiente remoto. Trade-offs: nenhum recurso novo na conta nem custo adicional; isolamento garantido pelo fato de dev não ter binding remoto; não permite testar em infraestrutura Cloudflare real antes de produção; o isolamento depende de o fluxo de deploy nunca apontar dev para IDs de produção.

B. Ambiente remoto de staging separado (Worker, D1 e bucket R2 próprios na conta do usuário), além do local e da produção. Trade-offs: permite validar em infraestrutura real sem tocar produção; exige criar e manter Worker/D1/R2 adicionais, secrets próprios e migrations em dois ambientes remotos; aumenta consumo das cotas gratuitas e a superfície de configuração.

C. Outra alternativa proposta por Raf. Trade-offs a serem definidos por Raf.

## Decision required

Qual opção (ou outra) adotar para o isolamento dev/produção, incluindo: se há bucket R2 separado para dev (além do D1); como credenciais/secrets de dev e de produção permanecem separados; e quais salvaguardas impedem que o fluxo de deploy ou de seed misture os ambientes. Nenhuma separação dev/produção foi implementada; o Gate 4 (backup) só será aberto após esta decisão.

## Raf decision

### Decision

Opção A: desenvolvimento/teste permanece exclusivamente local (Miniflare para D1 e R2, credenciais de dev em `.dev.vars`), sem ambiente remoto de staging. Produção continua sendo o único ambiente remoto (Worker `atlas-notes`, D1 `atlas-notes-own`, bucket R2 de DEC-008) — nenhum segundo D1 ou bucket R2 remoto é criado para dev. Credenciais de dev e de produção são sempre valores distintos: produção só existe como Worker secret na conta do usuário; nenhum secret de produção é copiado para `.dev.vars` ou para qualquer arquivo versionável. Scripts que podem tocar recursos remotos (`prepare-own-deploy.mjs`, `seed-notes.mjs`, `export-data.mjs`) devem exigir o identificador do ambiente de destino (D1 id / bucket) explicitamente a cada execução, nunca como default apontando para produção.

### Rationale

1. O requisito original só exige que dado de teste em dev não apareça em produção; o isolamento local via Miniflare (fato #1) já satisfaz isso sem nenhum recurso novo — um ambiente remoto de staging (Opção B) resolveria um problema que o requisito não pede, consumindo cota gratuita e superfície de configuração adicionais sem necessidade concreta.
2. O fluxo de build/deploy já separa dev de produção por construção (fato #2: build sempre gera IDs placeholder; só a substituição manual de `prepare-own-deploy.mjs` injeta produção) — formalizar que essa substituição nunca pode ser default/implícita fecha a lacuna de segurança real sem mudar o fluxo existente.
3. DEC-007 deixou explicitamente a separação de credencial dev/produção para este Gate; secrets de produção existirem só na conta Cloudflare (nunca em `.dev.vars`) é a menor extensão de DEC-007 que satisfaz "credencial de produção nunca necessária localmente".

### Constraints for Claude Code

- Não criar Worker, D1 ou bucket R2 remotos adicionais de staging/dev; dev permanece exclusivamente local via Miniflare.
- `.dev.vars` local contém apenas valores de dev (hash de senha e secret de sessão próprios de dev, diferentes dos de produção); nunca os secrets reais de produção.
- `prepare-own-deploy.mjs`, `seed-notes.mjs`, `export-data.mjs` e qualquer script futuro que grave em D1/R2 remoto devem exigir o identificador de ambiente (D1 id, nome do bucket) explicitamente a cada execução — nunca com default implícito apontando para produção, nunca lido de `.dev.vars`.
- Nenhum desses scripts deve ser disparado automaticamente pelos comandos padrão de dev (`vinext dev`, `wrangler dev`) ou de build; permanecem passos manuais e separados.
- `scripts/seed-data/atlas-export-production-20260928.json`, já versionado desde DEC-005, é artefato histórico da migração e não é afetado retroativamente por esta decisão.
- Nome exato de flags/variáveis de ambiente e forma de invocação dos scripts são detalhe de implementação do Claude Code.

### DEC Required

YES

---

# GATE TEC-02 — MODELO DE DADOS CANÔNICO

Status: RESOLVED — DEC-010 (ACCEPTED); D1 como fonte da verdade de catálogo/progresso; estado + auditoria separada; só a espinha migrada agora

Correlation: ATLAS-RAF-GATE-20261006-DATAMODEL

## Quest

Fora do QUEST-010 (que segue ativo em `docs/quests/ACTIVE.md`, com o Gate 4 ainda por abrir). Card TEC-02 — "Desenhar o modelo de dados" (Trello, P0, áreas Backend e Dados; dependências DEC-03 e DEC-05 do produto, ambas concluídas em 2026-09-29). Este Gate não substitui o QUEST-010 e não autoriza implementação; só registra a pergunta arquitetural que bloqueia o TEC-02 e os cards que dependem dele.

## Architectural question

Qual modelo de dados persistente o Atlas deve adotar para as entidades de estudo do MVP (além de Notas, que já persistem), incluindo onde fica a fonte da verdade de conteúdo e progresso, e como estado pedagógico, histórico e auditoria são representados?

## Gate trigger

"persistent data model change" (item 1), "data migration" (item 5) e "expensive or difficult-to-reverse technical decision" (item 9): define o schema durável de quase todo o produto e a fronteira com a planilha oficial de conteúdo.

## Original requirement

Card TEC-02 (Trello), texto literal: "Entidades: usuário, roadmap, fase, disciplina, conteúdo, subtópico, sessão, nota, anexo, questão, tentativa, revisão, avaliação, evidência, estado e auditoria."

Decisões de produto já tomadas que o modelo precisa suportar (cards do Trello, concluídos em 2026-09-29):

- DEC-05: hierarquia Roadmap → fase → disciplina → conteúdo → subtópico → evidência; no MVP só conteúdo curado manualmente (roadmap personalizado por IA é futuro); exame de proficiência com nota > 85 libera pular a seção.
- DEC-03: máquina de estados em dois níveis. Conteúdo/subtópico: não iniciado → em estudo → aguardando quiz → concluído (ou bloqueado) → aguardando revisão → concluído/revalidado (ou em revisão ativa). Disciplina: em andamento → exame de meio de curso liberado (50%) → atividade final liberada (100%) → recuperação → concluída. Transições automáticas e transições com confirmação obrigatória (exame, atividade final, recuperação: tentativa única/irreversível).
- DEC-09: revisões sempre em 24h/7d/30d, contadas da criação da nota, conclusão da aula ou do quiz.

Cards que dependem desta decisão e mostram o uso esperado: TEC-04 (persistir roadmaps, conteúdos, progresso, sessões, tarefas e preferências), TEC-06 (registrar autor, momento, estado anterior, estado novo, motivo e evidência relacionada), MVP-01, MVP-02, MVP-04 a MVP-09, e o item "Histórico" (versionamento de notas) do MVP-03.

## Relevant repository facts

1. `db/schema.ts` em `main` tem 4 tabelas, todas de Notas: `atlas_note_folders`, `atlas_notes` (título, `body`, `content_json` com envelope versionado do DEC-001, `is_private`, pasta, datas), `atlas_note_links` (vínculo nota ↔ conteúdo) e `atlas_sync_operations`. O PR #21 (ainda não mesclado) adiciona `atlas_note_attachments` (DEC-008).
2. `atlas_note_links.content_id` é texto livre sem chave estrangeira: não existe tabela de conteúdo. Os conteúdos vêm de `lib/content-catalog.ts`, um snapshot estático (2026-09-06) da planilha oficial do Atlas no Google Sheets (41 conteúdos de Contabilidade Geral e 117 de Contabilidade Tributária, campos `id`, `subject`, `unit`, `title`, `keywords`). O comentário do arquivo diz que o snapshot "é só entrada de classificação; progresso, penalidades e estados de estudo continuam sob controle da planilha", e a UI de Notas repete isso ("conclusão continuam sob controle da planilha").
3. `atlas_sync_operations` é uma fila idempotente de sincronização de metadados de nota para essa planilha; o corpo da nota nunca entra no payload. A escrita real na planilha nunca foi ligada (falta credencial Google), então as operações ficam em `queued`. Não é uma trilha de auditoria: não registra autor, estado anterior/novo nem motivo.
4. Roadmap, fases, disciplinas, conteúdos com pré-requisitos e penalidades, quiz, sessão de estudo, progresso/competências e a página Hoje existem só como dados demonstrativos em `lib/demo/*.ts` (roadmap, quizzes, study, progress, today), sem persistência. O tipo demonstrativo `PedagogicalState` em `lib/demo/roadmap.ts` (não iniciado, em estudo, praticado, dominado, em revisão, em risco, bloqueado) não coincide com os estados aprovados no DEC-03.
5. Não há entidade de usuário em nenhuma tabela, nem coluna `user_id`. DEC-007 fixou usuário único com sessão em cookie stateless, sem tabela de usuário/sessão; multiusuário (Atlas Business) é non-goal explícito.
6. Notas não têm histórico: cada gravação sobrescreve `body`/`content_json` em `atlas_notes`. O envelope do DEC-001 versiona o formato do documento, não as revisões da nota.
7. Persistência: Cloudflare D1 (SQLite) via binding `DB`, schema em Drizzle (`drizzle-orm` 0.44.6, `drizzle-kit` 0.31.4), 4 migrations em `drizzle/` (0000 a 0003; 0004 no PR #21), aplicadas localmente com `pnpm run db:migrate:local` e em produção manualmente pelo usuário (DEC-005, DEC-009). Limites do D1 Free registrados no card DEC-06: 5 GB, 5 milhões de leituras/dia e 100 mil gravações/dia, aplicados de forma rígida desde 2026-09-01.
8. DEC-009: dev é só local (Miniflare); produção é o único ambiente remoto. Qualquer migration nova só chega a produção pelo passo manual do usuário. DEC-008: anexos em R2 com metadados no D1.

## Options and trade-offs

Os eixos abaixo são as escolhas reais que o código e os cards de produto expõem; dentro de cada eixo as alternativas são apresentadas sem preferência.

**Eixo 1 — fonte da verdade de conteúdo e progresso.**
A. O D1 passa a ser a fonte da verdade do catálogo curado e de todo o progresso/estado; a planilha deixa de ser dona do progresso (pode virar só origem de importação ou destino de exportação). Trade-offs: um só lugar para estado e regras do DEC-03; exige migrar o catálogo e reescrever o papel da fila de sincronização e os textos da UI que hoje dizem que a planilha controla a conclusão.
B. A planilha continua dona do catálogo (e eventualmente do progresso), com o D1 guardando só o que o produto gera (sessões, tentativas, evidências, notas) e referências por id. Trade-offs: preserva o fluxo atual do usuário com a planilha; depende de integração Google ainda não provisionada e mantém duas fontes que precisam ficar consistentes.

**Eixo 2 — representação do estado pedagógico (DEC-03) e da auditoria (TEC-06).**
A. Estado atual gravado em colunas/tabelas de estado, com uma tabela de auditoria separada registrando cada transição (anterior, novo, motivo, evidência). Trade-offs: leitura simples; duas escritas por transição que precisam ficar coerentes.
B. Estado derivado de um registro de eventos/evidências (o log é a fonte; o estado é calculado ou materializado a partir dele). Trade-offs: auditoria e progresso determinístico (MVP-07) saem do mesmo registro; leitura mais custosa ou exige materialização, e o consumo de gravações/leituras do D1 Free precisa ser considerado.

**Eixo 3 — escopo e cadência do modelo.**
A. Desenhar e migrar agora o modelo completo das 16 entidades do card. Trade-offs: relações e chaves estáveis desde o início; schema grande antes de haver telas reais que o usem.
B. Fixar agora só a espinha (hierarquia do DEC-05, estado, evidência, auditoria) e acrescentar entidades por card do MVP. Trade-offs: migrations menores e ligadas a uso real; risco de retrabalho de chaves/relações nas entidades que entrarem depois.

**Eixo 4 — histórico de notas (MVP-03) e entidade usuário.**
Histórico: (a) tabela de revisões/snapshots de nota; (b) histórico coberto pelo mesmo mecanismo de auditoria do eixo 2; (c) fora deste Gate, decidido quando o MVP-03 for retomado. Usuário: (a) nenhuma entidade de usuário, coerente com DEC-007; (b) uma linha/tabela mínima de perfil e preferências (TEC-04 cita preferências), sem autenticação nem `user_id` multiusuário.

## Decision required

Qual modelo adotar, respondendo no mínimo: (1) onde fica a fonte da verdade do catálogo de conteúdo e do progresso (D1 ou planilha) e qual o papel de `atlas_sync_operations` daqui em diante; (2) como estado pedagógico e auditoria são representados; (3) se o modelo é fixado por completo agora ou por partes; (4) se histórico de notas e entidade usuário/preferências entram nesta decisão. Nomes de tabelas/colunas, índices e ordem das migrations são detalhe de implementação. Nenhuma implementação do TEC-02 foi iniciada.

## Raf decision

### Decision

Eixo 1: o D1 passa a ser a fonte da verdade do catálogo curado e de todo o progresso/estado do produto (Opção A). A planilha oficial permanece a superfície de curadoria/edição manual do catálogo (coerente com o non-goal de roadmap por IA), não a dona do progresso. `atlas_sync_operations`, se mantida, passa a servir só como caminho de importação do catálogo curado (planilha → D1); nunca o caminho inverso para estado/progresso.

Eixo 2: estado atual em colunas/tabela de estado + uma tabela de auditoria separada registrando cada transição (autor, momento, estado anterior, estado novo, motivo, evidência relacionada) — Opção A, no formato que TEC-06 já pede literalmente. Não adotar estado derivado de log de eventos (Opção B).

Eixo 3: fixar agora apenas a espinha — hierarquia do DEC-05 (roadmap → fase → disciplina → conteúdo → subtópico → evidência) com chaves estáveis, o modelo de estado do DEC-03 e a tabela de auditoria do TEC-06 (Opção B). As demais entidades do card (sessão, questão, tentativa, revisão, avaliação) são desenhadas e migradas junto do card MVP que as implementa, respeitando as chaves da espinha fixadas agora.

Eixo 4: histórico de notas (MVP-03) fica fora deste Gate — decidido quando o MVP-03 for retomado. Nenhuma entidade de usuário nova é criada (coerente com DEC-007); preferências (TEC-04), se precisarem de persistência, são decisão daquele card.

### Rationale

1. DEC-03 exige transições automáticas e com confirmação irreversível avaliadas por código; isso só é possível com D1 como fonte da verdade de estado/progresso — a planilha nunca teve integração de escrita conectada, e mantê-la como dona do progresso bloquearia indefinidamente MVP-07 e os demais MVP-0X.
2. TEC-06 já descreve literalmente o formato de auditoria pedido (autor, momento, estado anterior/novo, motivo, evidência) — isso é o modelo "estado atual + tabela de auditoria" (Eixo 2 Opção A); event-sourcing resolveria um requisito que nenhum card pede, com custo de leitura adicional no D1 Free.
3. Fixar agora só a espinha (hierarquia DEC-05 + estado DEC-03 + auditoria TEC-06) é a menor decisão que destrava TEC-02 e os cards mais diretamente dependentes, sem migrar entidades (sessão, questão, tentativa, avaliação) antes de existir uso real.

### Constraints for Claude Code

- D1 é a fonte da verdade de progresso/estado do produto; nenhuma lógica de transição de estado (DEC-03) pode depender de leitura síncrona da planilha Google (não conectada).
- `atlas_sync_operations` deixa de ser modelada como "planilha controla progresso"; se mantida, seu papel passa a ser import do catálogo curado (planilha → D1). Atualizar os textos de UI que hoje afirmam que a planilha controla a conclusão é detalhe de implementação, não decisão arquitetural adicional.
- Migrar agora, como espinha: tabelas para a hierarquia do DEC-05 (roadmap, fase, disciplina, conteúdo, subtópico, evidência) com chaves estáveis, estado atual conforme DEC-03, e uma tabela de auditoria conforme TEC-06 (autor, momento, estado anterior, estado novo, motivo, evidência relacionada).
- Não migrar ainda sessão, questão, tentativa, revisão, avaliação; cada uma é desenhada/migrada junto do card MVP que a implementa, respeitando as chaves da espinha já fixada (sem redesenho de FK já estabelecida).
- Nenhuma tabela de usuário/autenticação além do que DEC-007 já decidiu; preferências (TEC-04), se precisarem de persistência, são decisão daquele card.
- Histórico de notas (MVP-03) não é decidido aqui; não criar tabela de revisão/snapshot de nota como parte do TEC-02.
- Nome de tabelas/colunas, índices, ordem exata das migrations, e como a importação planilha→D1 é implementada são detalhe de implementação do Claude Code.

### DEC Required

YES

---

# GATE 4 — BACKUP E RESTAURAÇÃO

Status: RESOLVED — DEC-011 (ACCEPTED); dump SQL remoto do D1 + cópia dos objetos R2 no mesmo passo, destino fora da conta Cloudflare, disparo manual, restauração de teste só no Miniflare local

Correlation: ATLAS-RAF-GATE-20261007-BACKUP

## Quest

QUEST-010 — Infraestrutura restante do usuário único, item 4: backup. Último Gate do quest; os Gates 1 a 3 já foram resolvidos (DEC-007, DEC-008, DEC-009).

## Architectural question

Qual mecanismo de backup e restauração o Atlas deve adotar para os dados de produção (D1 `atlas-notes-own` e bucket R2 de anexos), definindo o que é copiado, por qual mecanismo, onde as cópias ficam, quem/o que dispara o backup e como a restauração é feita e testada sem violar o isolamento do DEC-009?

## Gate trigger

"expensive or difficult-to-reverse technical decision" (item 9), "authentication or security architecture" (item 4) e "major cross-system change" (item 6): define onde ficam cópias de todos os dados do usuário (inclusive notas privadas) fora do banco de produção, que credencial de produção o processo exige e como D1 e R2 são mantidos consistentes numa restauração.

## Original requirement

Ver `docs/quests/ACTIVE.md`: "Existe uma forma (mesmo manual/documentada) de gerar backup dos dados e restaurá-los em caso de perda." Critério: "Rotina de backup documentada e testada ao menos uma vez (executar backup, simular restauração)." Validação: "backup + restauração simulada"; "nenhum critério conta como implementado só porque o código existe".

Decisões já registradas que restringem a resposta: DEC-008 (consequência: "Backup (Gate 4) precisa cobrir D1 e R2"), DEC-009 (produção é o único ambiente remoto; nenhum D1/R2 remoto de staging; secrets de produção nunca em `.dev.vars`; scripts remotos exigem ambiente explícito; consequência: "o Gate 4 precisará cobrir apenas o único ambiente de produção (D1 + R2)"), DEC-007 (APIs só com sessão) e DEC-010 (D1 é a fonte da verdade de catálogo e progresso).

## Relevant repository facts

1. Produção é o único ambiente remoto (DEC-009): Worker `atlas-notes`, D1 `atlas-notes-own` e o bucket R2 do binding `ATTACHMENTS` (DEC-008). Os nomes ficam em `deploy.local.json` (ignorado pelo git) e são passados a `scripts/deploy.mjs --target production`.
2. Dados no D1 (`db/schema.ts`, migrations 0000 a 0006): (a) gerados pelo usuário — `atlas_note_folders`, `atlas_notes` (com `content_json` no envelope do DEC-001 e `is_private`), `atlas_note_links`, `atlas_note_attachments` (só metadados e `object_key`), `atlas_content_states`, `atlas_discipline_states`, `atlas_evidences`, `atlas_state_audit` (só inserção) e `atlas_sync_operations`; (b) catálogo curado — `atlas_roadmaps`, `atlas_phases`, `atlas_disciplines`, `atlas_contents`, `atlas_content_prerequisites`, `atlas_subtopics`, semeados pela migration `drizzle/0005_catalog_seed.sql` (idempotente, `ON CONFLICT DO UPDATE`), portanto reproduzíveis a partir do repositório.
3. Bytes de anexos ficam só no R2 (até 10MB por arquivo, DEC-07); o D1 guarda a referência `object_key`. `readAttachment` devolve `null` se a linha existir sem o objeto, e `deleteAttachment` apaga primeiro o objeto R2 e depois a linha (`lib/attachments-store.ts`). Uma restauração em que D1 e R2 venham de momentos diferentes deixa linhas sem objeto ou objetos órfãos.
4. `scripts/export-data.mjs` (DEC-004, ajustado ao DEC-009) é o único export existente: lê `GET /api/notes` e `GET /api/notes/folders` com sessão aberta por `ATLAS_EXPORT_PASSWORD`, exige `--target` explícito e grava JSON (`atlas-export` v1) em `outputs/` (ignorado pelo git). Não cobre anexos (bytes nem metadados), estado pedagógico, evidências nem auditoria.
5. `scripts/seed-notes.mjs` reinsere notas de um export com `INSERT OR IGNORE`, mas grava `content_json = NULL` e `folder_id = NULL`: hoje não existe caminho que restaure o conteúdo estruturado (DEC-001), as pastas ou os anexos.
6. Não há tarefa agendada: nenhuma Cron Trigger nem handler `scheduled` na configuração do Worker; deploy e migrations em produção são passos manuais do usuário (DEC-005, DEC-009; deploy automático é non-goal do QUEST-010).
7. Recursos da plataforma, segundo a documentação da Cloudflare (não verificáveis a partir deste ambiente): D1 Time Travel permite restaurar o banco para um ponto no tempo dentro de uma janela de retenção que depende do plano (7 dias no Free, 30 no Paid), sem cópia fora da conta; `wrangler d1 export` gera um dump SQL do banco remoto; R2 não tem versionamento de objetos nativo; o `wrangler` lê objetos R2 um a um, e cópia em massa exige a API compatível com S3 e uma credencial de acesso R2 da conta.
8. DEC-08 do produto (card concluído): exclusão de anexos e dos dados da conta em até 3 dias. Notas com `is_private = 1` são gravadas em texto no D1 (criptografia ponta a ponta é non-goal do QUEST-010), então qualquer cópia de backup as contém em claro, e cópias retidas por mais de 3 dias guardam dados que o usuário pode ter excluído.
9. Este ambiente do Claude Code não acessa a conta Cloudflare: executar backup em produção e validar a restauração só pode ser feito pelo usuário, na máquina dele.

## Options and trade-offs

Os eixos abaixo são as escolhas reais expostas pelo código e pelas decisões anteriores; dentro de cada eixo as alternativas são apresentadas sem preferência.

**Eixo 1 — mecanismo de cópia do D1.**
A. Só D1 Time Travel. Trade-offs: nenhum código nem armazenamento novo; restauração nativa; janela limitada pelo plano; nenhuma cópia fora da conta (não protege contra perda da conta ou exclusão do banco); não cobre R2.
B. Dump SQL periódico do banco inteiro (`wrangler d1 export --remote`) guardado fora da conta. Trade-offs: cópia completa e independente da conta, inclusive auditoria e estado; restauração direta com `wrangler d1 execute`; exige credencial do wrangler na máquina de quem roda; o dump inclui o catálogo reproduzível e está acoplado à versão do schema.
C. Export de aplicação via API autenticada (ampliar `export-data.mjs` para todas as entidades do usuário, com restauração equivalente). Trade-offs: formato versionado e independente do schema físico, usa só a senha do Atlas (DEC-007); exige manter export e restauração em sincronia com cada migration nova e escrever o caminho de restauração que hoje não existe (fato 5).

**Eixo 2 — cópia dos anexos (R2).**
A. Baixar os objetos para o mesmo destino do backup do D1, no mesmo passo. Trade-offs: backup único e coerente entre D1 e R2; volume cresce com os anexos (até 10MB cada); baixar em massa exige API S3 com credencial R2 ou uma rota do Worker que liste/sirva objetos (DEC-008 só permite servir bytes por rota autenticada).
B. Cópia para um segundo bucket na mesma conta. Trade-offs: sem tráfego para fora da conta; não protege contra perda da conta; é um recurso remoto novo, e o DEC-009 proibiu buckets de staging/dev (não tratou de buckets de backup).

**Eixo 3 — disparo e frequência.**
A. Manual, pelo usuário, com script e cadência documentados. Trade-offs: nenhuma infraestrutura nova; atende ao "mesmo manual/documentada" do requisito; depende de disciplina do usuário.
B. Automático, por Cron Trigger de um Worker que grava as cópias no R2 da própria conta. Trade-offs: não depende do usuário lembrar; cópias continuam dentro da conta; nova peça de infraestrutura e consumo de cota; o QUEST-010 só declara non-goal o deploy automático, não o backup automático.

**Eixo 4 — destino, retenção e restauração.**
Onde as cópias ficam (máquina do usuário, armazenamento externo ou dentro da conta), por quanto tempo são retidas frente à exclusão em 3 dias do DEC-08 e ao conteúdo de notas privadas em claro (fato 8), e se a restauração testada exigida pelo critério é feita no D1/R2 locais do Miniflare (sem tocar produção, coerente com DEC-009) ou num recurso remoto.

## Decision required

Qual mecanismo adotar, respondendo no mínimo: (1) como o D1 é copiado e se o catálogo reproduzível entra na cópia; (2) como os bytes do R2 são copiados e como a consistência D1 ↔ R2 é garantida numa restauração; (3) se o backup é manual ou automático; (4) onde as cópias ficam, qual credencial de produção o processo exige (DEC-009) e como a retenção se relaciona com a exclusão em 3 dias do DEC-08; (5) onde a restauração de teste é executada. Nome de scripts, flags, formato de arquivo e cadência exata são detalhe de implementação. Nenhuma implementação de backup foi iniciada.

## Raf decision

### Decision

Backup manual, disparado pelo usuário, cobrindo D1 e R2 no mesmo passo, para que as duas cópias representem o mesmo instante.

- **D1**: dump SQL completo e remoto (`wrangler d1 export --remote` ou equivalente nativo) — Eixo 1, Opção B. Não Opção A (D1 Time Travel isolado) nem Opção C (export de aplicação).
- **R2**: bytes dos anexos baixados para o mesmo destino do dump do D1, na mesma execução — Eixo 2, Opção A. Não Opção B (bucket espelho na mesma conta).
- **Disparo**: manual (Eixo 3, Opção A). Nenhum Cron Trigger/Worker agendado é criado para este Gate.
- **Destino**: fora da conta Cloudflare que hospeda produção (máquina do usuário ou qualquer local que ele controle independentemente dessa conta) — nunca um segundo recurso dentro da mesma conta.
- **Retenção**: limitada/rotativa, nunca indefinida.
- **Restauração de teste**: executada só no D1/R2 locais do Miniflare (dev), nunca em produção.

### Rationale

1. O requisito original aceita explicitamente "mesmo manual/documentada" (`ACTIVE.md`) e o QUEST-010 já tem como non-goal deploy automático; um backup automático (Cron Trigger) resolveria um problema que o requisito não pede, criando infraestrutura nova sem necessidade — manual é o mecanismo mínimo suficiente.
2. Um dump SQL remoto completo captura todas as tabelas do D1 (inclusive estado e auditoria do DEC-010, e o catálogo reproduzível) num comando nativo único, sem exigir construir e manter em sincronia com cada migration futura um caminho de export/restore de aplicação (Opção C) que hoje não existe. D1 Time Travel fica descartado como mecanismo único porque nunca sai da conta — não é "cópia fora do banco de produção" exigida pela própria pergunta do Gate, não protege contra perda da conta.
3. DEC-08 já compromete a exclusão de dados do usuário em até 3 dias; retenção de backup indefinida violaria esse compromisso silenciosamente para qualquer dado capturado numa cópia — retenção limitada/rotativa é a menor restrição necessária para preservar DEC-08 sem reabri-lo.

### Constraints for Claude Code

- Backup permanece processo manual, disparado pelo usuário (script/passos documentados); nenhum Cron Trigger ou Worker agendado é criado para este Gate.
- Cópia do D1 = dump SQL remoto completo (`wrangler d1 export --remote` ou export nativo equivalente); não é export de aplicação tabela-a-tabela, e D1 Time Travel não substitui essa cópia (pode continuar existindo como recuperação nativa complementar dentro da conta, mas não atende a este Gate isoladamente).
- Bytes do R2 copiados para o mesmo destino do dump do D1, na mesma execução de backup, para que D1 e R2 representem o mesmo instante; nenhum segundo bucket R2 é criado dentro da conta Cloudflare de produção como destino de backup.
- Destino do backup é sempre fora da conta Cloudflare que hospeda produção (máquina do usuário ou local externo equivalente) — nunca um recurso remoto adicional dentro dessa mesma conta.
- Qualquer credencial exigida pelo processo (acesso Cloudflare/D1, token de API R2) segue a regra já em vigor do DEC-009: explícita a cada execução, nunca default, nunca gravada em `.dev.vars` ou arquivo versionável.
- Retenção das cópias de backup deve ser limitada/rotativa (cópias antigas eventualmente removidas), nunca "guardar para sempre", para permanecer compatível com a exclusão em 3 dias do DEC-08. Quantidade exata de cópias retidas/janela de dias é detalhe de implementação.
- A restauração de teste exigida pelo critério de aceite é feita no D1/R2 locais do Miniflare (ambiente de dev do DEC-009), nunca em produção.
- Nome de scripts, flags exatas, formato do arquivo de dump e cadência exata da execução manual são detalhe de implementação do Claude Code.

### DEC Required

YES

---

# GATE MVP-03 — HISTÓRICO DE VERSÕES DAS NOTAS

Status: RESOLVED — DEC-012 (ACCEPTED); snapshot integral por gravação explícita, só conteúdo, retenção limitada (nunca ilimitada); comportamento observável (visualizar/comparar/restaurar) fica pendente de definição do Atlas

Correlation: ATLAS-RAF-GATE-20261007-NOTEHISTORY

## Quest

Fora do QUEST-010 (que segue ativo em `docs/quests/ACTIVE.md`). Item "Histórico" do card MVP-03 — "Implementar Atlas Notes" (Trello, P0, em andamento). DEC-010 deixou o histórico de notas explicitamente fora do Gate TEC-02, "decidido quando o MVP-03 for retomado". Este Gate não autoriza implementação; só registra a pergunta arquitetural que bloqueia esse item.

## Architectural question

Como o Atlas deve representar e persistir o histórico de versões das notas: o que constitui uma versão, onde e em que forma ela é guardada, quanto é retido e como isso convive com o documento canônico do DEC-001, os limites do D1 e o modelo de dados do DEC-010?

## Gate trigger

"persistent data model change" (item 1) e "expensive or difficult-to-reverse technical decision" (item 9): cria armazenamento durável novo para conteúdo de notas, com crescimento proporcional ao número de gravações, que depois de populado é caro de mudar de forma.

## Original requirement

Card MVP-03 (Trello), checklist: "Pastas ✓, Editor ✓, Salvamento ✓, Anexos, Vínculo com conteúdo ✓, Histórico". Auditoria de 18/09/2026 no card: "Faltam pastas e histórico de versões — nada disso existe no código." Atualização de 23/09/2026: "'Histórico' (versionamento de notas) também não foi tocado pela QUEST-007."

O card não especifica o comportamento observável do histórico (por exemplo: só listar e visualizar versões anteriores, comparar, ou restaurar uma versão). Esse comportamento é decisão de produto do Atlas; o Gate registra a lacuna sem preenchê-la.

## Relevant repository facts

1. `atlas_notes` guarda só o estado atual. `saveNote` (`lib/notes-store.ts`) faz `INSERT ... ON CONFLICT(id) DO UPDATE` sobrescrevendo `title`, `body`, `content_json`, `folder_id` e `is_private`, e recria os vínculos em `atlas_note_links`; nada da versão anterior é preservado.
2. Hoje a gravação é explícita: `save()` em `components/notes-workspace.tsx` só é chamado pelo botão de salvar (o card menciona "salvamento automático", mas não há gravação por temporizador no código atual). Cada gravação carrega um `operationId` e é idempotente via `atlas-notes:{operationId}` (DEC-001).
3. `atlas_sync_operations` recebe uma linha por gravação, mas o payload tem só metadados (título, contagem de caracteres, vínculos), nunca o corpo; DEC-010 restringe essa tabela ao papel de importação do catálogo. `atlas_state_audit` (DEC-010/TEC-06) é só inserção e registra transições de estado pedagógico, não conteúdo.
4. DEC-001: o conteúdo estruturado vive em `content_json` no envelope `atlas-notes` (leitores aceitam versões 1 e 2; escritores gravam 2; sem reescrita na leitura); `body` é a projeção derivada. Limites: 1 MiB estruturado e 1,25 MiB por requisição. Uma versão antiga pode estar no envelope v1, em v2 ou ser legada (`content_json` NULL).
5. Anexos (DEC-008) ficam em tabela própria com FK para a nota e bytes no R2; são enviados por rota separada, depois da gravação da nota, e podem ser excluídos individualmente (`deleteAttachment`). Hoje não existe rota de exclusão de nota.
6. Persistência em D1 Free: 5 GB de armazenamento e 100 mil gravações/dia (card DEC-06); o limite de linha/valor (~2MB, citado no DEC-008) comporta uma cópia integral de uma nota no limite do DEC-001.
7. Notas privadas (`is_private`) ficam em texto no D1; DEC-08 do produto define exclusão de dados em 3 dias. Versões anteriores de uma nota privada, ou de uma nota que deixou de ser privada, também ficariam guardadas.
8. Gate 4 (backup, `ATLAS-RAF-GATE-20261007-BACKUP`) está aberto em paralelo; o que for decidido aqui passa a fazer parte dos dados que o backup precisa cobrir.

## Options and trade-offs

Os eixos abaixo são as escolhas reais expostas pelo código; dentro de cada eixo as alternativas são apresentadas sem preferência.

**Eixo 1 — forma de guardar uma versão.**
A. Snapshot integral por versão (título, `body`, `content_json` com seu envelope) numa tabela de versões no D1. Trade-offs: leitura e restauração triviais, cada versão é autossuficiente e preserva o envelope original; armazenamento cresce com o tamanho integral da nota a cada versão.
B. Diferenças entre versões (patch sobre o documento). Trade-offs: menos armazenamento; reconstruir uma versão exige aplicar uma cadeia de patches, e o formato de patch fica acoplado ao envelope do DEC-001 e às suas evoluções.
C. Snapshot integral como objeto no R2, com só metadados da versão no D1 (mesmo padrão do DEC-008). Trade-offs: tira o volume do D1; cada leitura de versão passa a depender de D1 e R2 coerentes, e o backup do Gate 4 precisa cobrir esses objetos.

**Eixo 2 — quando uma versão é criada.**
A. A cada gravação. Trade-offs: histórico completo e simples de explicar; volume proporcional ao número de gravações (fato 2: hoje só pelo botão; mudaria se o salvamento automático citado no card voltar).
B. Agrupada (no máximo uma versão por intervalo ou por sessão de edição). Trade-offs: menos volume; versões intermediárias se perdem e a regra de agrupamento precisa ser definida.
C. Só por ação explícita do usuário ("salvar versão"). Trade-offs: volume mínimo; histórico só existe se o usuário lembrar de criá-lo; muda a interação, o que é decisão de produto.

**Eixo 3 — escopo e retenção.**
Escopo: (a) só conteúdo (título, `body`, `content_json`); (b) também metadados que a gravação altera (pasta, privacidade, vínculos); (c) também anexos (exigiria preservar objetos R2 excluídos). Retenção: (a) ilimitada; (b) limitada por quantidade ou idade, frente aos limites do fato 6 e à exclusão em 3 dias do DEC-08 (fato 7).

## Decision required

Qual representação adotar, respondendo no mínimo: (1) a forma de guardar uma versão (eixo 1); (2) quando uma versão é criada (eixo 2); (3) o que entra numa versão e por quanto tempo é retida (eixo 3); (4) se alguma dessas escolhas depende de o Atlas definir antes o comportamento observável do histórico (visualizar, comparar, restaurar). Nomes de tabelas/colunas, índices e ordem das migrations são detalhe de implementação. Nenhuma implementação do histórico foi iniciada.

## Raf decision

### Decision

- **Eixo 1 (forma):** snapshot integral por versão — título, `body` e `content_json` com o envelope exatamente como persistido — em nova tabela no D1 (Opção A). Não diff/patch (Opção B) e não objeto R2 com metadados no D1 (Opção C).
- **Eixo 2 (quando):** uma versão é criada a cada gravação explícita da nota, o mesmo evento que já dispara `saveNote`/idempotência hoje (Opção A). Nenhuma regra de agrupamento (Opção B) nem interação nova de "salvar versão" (Opção C) é adotada.
- **Eixo 3 (escopo):** a versão cobre só conteúdo — título, `body`, `content_json`. Pasta, privacidade e vínculos não entram na versão; anexos não são versionados.
- **Eixo 3 (retenção):** deve ser limitada (por quantidade e/ou idade), nunca ilimitada. O valor exato não é fixado aqui — depende de o Atlas definir o comportamento observável do histórico (quantas versões o usuário pode ver/restaurar) e está sujeito ao piso do DEC-08 (nunca reter versão de nota privada além do compromisso de exclusão em 3 dias).
- **Comportamento observável (visualizar, comparar, restaurar):** não decidido aqui — é decisão de produto do Atlas, como o próprio card já registra. Em particular, se e como "restaurar uma versão" funciona (nova versão vs. sobrescrita) não está resolvido e não deve ser implementado até essa definição existir.

### Rationale

1. Snapshot integral no D1 é a menor forma que preserva o envelope original do DEC-001 sem acoplar o histórico à evolução futura do formato (diff) e sem criar um segundo local de consistência D1↔R2 para um dado que já cabe inteiro numa linha do D1 dentro do limite estrutural de 1 MiB do próprio DEC-001.
2. Versionar a cada gravação explícita reaproveita o único evento de escrita que já existe hoje (botão salvar); qualquer outra cadência (agrupada ou "salvar versão" explícito) exigiria uma regra ou interação de produto que o card declara não especificada.
3. DEC-08 já compromete exclusão de dados em até 3 dias; retenção ilimitada de versões de notas privadas reabriria esse compromisso silenciosamente — por isso o piso "limitada, nunca ilimitada" é exigido já, independente de o Atlas ainda não ter definido quantas versões mostrar.

### Constraints for Claude Code

- Nova tabela no D1 guarda snapshots integrais de versão (título, `body`, `content_json` tal como persistido, sem reescrita/migração do envelope na captura); nenhum diff/patch, nenhum objeto R2.
- Uma versão é criada no mesmo evento que hoje dispara `saveNote` (gravação explícita via botão); nenhuma heurística de agrupamento por tempo/sessão é implementada nesta decisão. Se salvamento automático for reintroduzido no produto, a cadência de versionamento precisa ser revisitada — não decidida aqui.
- Escopo da versão é só título + `body` + `content_json`; pasta, `is_private` e `atlas_note_links` não entram na versão; anexos (DEC-008) não são versionados e nenhum objeto R2 excluído precisa ser preservado por causa disto.
- Retenção deve ser limitada (quantidade e/ou idade), nunca ilimitada, e nunca reter versão de nota privada além do que o compromisso de exclusão em 3 dias do DEC-08 permite. O número exato de versões/dias retidos não deve ser fixado sem antes checar com o Atlas o comportamento observável desejado do histórico — mas também não deve ficar "ilimitado" enquanto essa definição não existe.
- Nenhuma rota de restauração/reversão de versão deve ser implementada como parte desta decisão: se e como restaurar (nova versão vs. sobrescrita da atual) depende de o Atlas definir o comportamento observável do histórico (visualizar, comparar, restaurar), ainda pendente.
- Esta nova tabela passa a fazer parte do escopo de dados que o Gate 4 (backup) precisa cobrir, se/quando resolvido — registrado como consequência, não reabre aquele Gate.
- Nome de tabela/colunas, índices e ordem da migration são detalhe de implementação do Claude Code.

### DEC Required

YES

---

# GATE MVP-07 — GATILHO DO AJUSTE ADAPTATIVO DE PESOS

Status: RESOLVED — DEC-013 (ACCEPTED); gatilho manual por configuração explícita (sem regra automática agora); vigência via recompute on read; registro durável exigido só a partir da primeira mudança real

Correlation: ATLAS-RAF-GATE-20261008-001

## Quest

Fora do QUEST-010. Card MVP-07 — "Implementar cálculo determinístico de progresso" (Trello, P0). O DEC-02 fixa os pesos padrão e os limites do ajuste, e registra o gatilho como "decisão de implementação/algoritmo — fica com Raf/Claude Code quando MVP-07 for implementado". Este Gate registra essa pergunta; a escada do MVP seguiu com os pesos padrão.

## Architectural question

O que faz os pesos de uma disciplina saírem do padrão do DEC-02, com que frequência, e onde fica registrado o peso em vigor para que uma nota antiga continue explicável?

## Gate trigger

"expensive or difficult-to-reverse technical decision" (item 9): depois que pesos diferentes produzirem notas, mudar a regra muda notas já mostradas, e o MVP-09 (relatórios explicáveis) precisa explicar cada uma.

## Original requirement

DEC-02: pesos padrão Avaliações 30, Atividades 20, Cobertura 20, Revisão 15, Quiz 15; cada peso varia no máximo ±10 pp; a soma é sempre 100%. O gatilho do ajuste não foi definido.

## Relevant repository facts

1. `lib/progress.ts` (MVP-07) calcula a nota por disciplina com `FORMULA_VERSION = 'v1'` e `DEFAULT_WEIGHTS`; `validateWeights` já aplica os limites do DEC-02. Nada persiste pesos: a nota é recalculada a cada leitura a partir de estados, quizzes, auditoria e sessões.
2. Avaliações e Atividades ainda não existem no Atlas, então 50 dos 100 pontos ficam sempre em 0 na v1. Qualquer gatilho que dependa desses componentes não tem dado hoje.
3. Os sinais disponíveis hoje são: notas de quiz por conteúdo, revisões vencidas/aprovadas (MVP-06), estados de conteúdo (DEC-03) e minutos de sessão.
4. Não existe tabela de configuração por disciplina nem histórico de pesos.

## Options and trade-offs

**Eixo 1 — o que dispara o ajuste.**
A. Nada automático: pesos mudam só por configuração do curso. Trade-offs: simples e sempre explicável; não é "adaptativo".
B. Regra determinística sobre sinais do usuário (por exemplo, retenção baixa aumenta o peso de Revisão dentro do limite). Trade-offs: adapta sem IA; a regra precisa ser definida e notas mudam quando o sinal muda.
C. Regra sobre a disponibilidade de componentes (redistribuir os pontos de componentes que ainda não existem). Trade-offs: resolve os 50 pontos parados (fato 2); muda o sentido do peso padrão enquanto Avaliações/Atividades não existem.

**Eixo 2 — quando o ajuste vale.**
A. Recalculado a cada leitura. Trade-offs: sempre atual; nota de ontem pode mudar sem nova evidência.
B. Fixado por período (semana, fase). Trade-offs: notas estáveis; exige guardar o peso em vigor e a data.

**Eixo 3 — registro.** (a) Nenhum (derivável); (b) histórico de pesos por disciplina com versão da fórmula, para o MVP-09 explicar notas passadas.

## Decision required

(1) o gatilho (eixo 1); (2) a vigência (eixo 2); (3) se o peso em vigor precisa de registro (eixo 3). Até lá a v1 usa os pesos padrão; nomes de tabelas e versão da fórmula são detalhe de implementação.

## Raf decision

### Decision

- **Eixo 1 (gatilho):** nenhum ajuste automático agora. Os pesos continuam nos padrões do DEC-02 e só mudam por configuração explícita/manual (curso ou disciplina) — Opção A. Opções B e C não são adotadas nem descartadas definitivamente: ficam em aberto para quando existir um sinal de produto real e aprovado que as justifique (hoje não existe: Avaliações/Atividades ainda não existem, e reprovação de quiz foi explicitamente excluída como gatilho pelo Atlas em 2026-10-08).
- **Eixo 2 (vigência):** quando um peso for alterado manualmente, a mudança vale a partir da alteração e é aplicada no recálculo em cada leitura — mesma arquitetura já em uso em `lib/progress.ts` (Opção A). Não é criado um mecanismo de vigência fixada por período (Opção B) sem caso de uso real.
- **Eixo 3 (registro):** nenhuma tabela de histórico de pesos é criada agora — não há hoje nenhuma mudança de peso para registrar. A partir da primeira mudança manual que afastar os pesos do padrão do DEC-02, essa mudança deve ficar registrada de forma durável (conjunto de pesos + timestamp de vigência), para que o MVP-09 continue explicando notas calculadas sob pesos diferentes. Isso é uma pré-condição para a primeira mudança, não um artefato a construir nesta tarefa.

### Rationale

1. Os dois sinais mais prováveis para um gatilho automático hoje são imaturos ou já descartados: Avaliações/Atividades (50 dos 100 pontos) não existem, e o Atlas já decidiu que reprovação em quiz não altera a nota — não resta sinal de produto aprovado que justifique uma regra adaptativa real agora; escolher B ou C sem esse sinal seria arquitetura especulativa.
2. Fixar o gatilho como "só manual" formaliza o comportamento que já roda em produção-candidata (pesos padrão, sem mecanismo automático), em vez de inventar um mecanismo novo sem necessidade concreta.
3. Exigir registro só a partir da primeira mudança real evita uma tabela sem uso agora, mas preserva a explicabilidade do MVP-09 que o próprio Gate trigger (item 9) aponta como o risco caro de reverter depois que notas diferentes já existirem.

### Constraints for Claude Code

- Nenhum gatilho automático/algorítmico de ajuste de pesos é implementado por esta decisão; pesos permanecem em `DEFAULT_WEIGHTS` (DEC-02) até configuração manual explícita.
- Qualquer mudança de peso só pode ocorrer por configuração explícita por disciplina/curso, nunca por reação automática a quiz, revisão, sessão ou disponibilidade de componente.
- Reprovação em quiz não altera peso nem nota (regra de produto de 2026-10-08, já vigente); nenhuma lógica de ajuste de peso pode usar reprovação de quiz como gatilho.
- Mudança de peso, quando ocorrer, vale a partir do momento da alteração e é aplicada no recálculo em cada leitura (mesmo padrão atual de `lib/progress.ts`); não implementar vigência fixada por período sem necessidade concreta.
- Antes de permitir a primeira mudança de peso diferente do padrão do DEC-02, deve existir um registro durável mínimo (peso vigente + timestamp de vigência, versionado) para que `lib/reports.ts` (MVP-09) consiga explicar notas calculadas sob pesos diferentes. Nome de tabela/coluna é detalhe de implementação.
- Esta decisão não impede revisitar os Eixos 1/2 quando Avaliações/Atividades existirem ou quando o Atlas definir uma regra adaptativa concreta — isso é uma nova pergunta, a trazer como Gate específico quando houver sinal real, não decidida especulativamente aqui.

### DEC Required

YES

---

# CORE PRINCIPLE

Atlas supplies product requirement. Claude Code supplies evidence. Raf supplies architectural judgment. These responsibilities must remain separate.
