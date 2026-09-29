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

Status: OPEN — aguardando decisão do Raf (Gate 1 de 4 do QUEST-010: autenticação)

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

*(pendente — a ser preenchido a partir da decisão do Raf trazida pelo usuário)*

---

# CORE PRINCIPLE

Atlas supplies product requirement. Claude Code supplies evidence. Raf supplies architectural judgment. These responsibilities must remain separate.
