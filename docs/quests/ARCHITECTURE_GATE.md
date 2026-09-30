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

Status: OPEN — aguardando decisão do Raf (Gate 2 de 4 do QUEST-010: storage de anexos)

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

*(pendente — a ser preenchido a partir da decisão do Raf trazida pelo usuário)*

---

# CORE PRINCIPLE

Atlas supplies product requirement. Claude Code supplies evidence. Raf supplies architectural judgment. These responsibilities must remain separate.
