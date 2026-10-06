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

# CORE PRINCIPLE

Atlas supplies product requirement. Claude Code supplies evidence. Raf supplies architectural judgment. These responsibilities must remain separate.
