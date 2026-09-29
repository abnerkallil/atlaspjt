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

Status: OPEN — aguardando decisão do Raf

---

# QUEST

BUG P0 — navegação por clique do menu principal não funciona em produção (Correlation: ATLAS-RAF-GATE-20260929-VINEXT-NAV)

---

# ARCHITECTURAL QUESTION

A causa raiz é a versão de dependência `vinext@1.0.0-beta.5` (bundling do cliente). Como o site deve passar a obter um build de produção com navegação por clique funcional?

---

# GATE TRIGGER

O quest proíbe mudar a versão do Next.js/vinext sem escalar; a evidência abaixo indica que apenas a versão do vinext (e do `@vitejs/plugin-rsc`, seu peer) diferencia build quebrado de build funcional.

---

# ORIGINAL REQUIREMENT

Clique em Hoje/Estudar/Roadmap/Notas/Quizzes/Progresso no menu principal deve navegar (client-side), em desktop e mobile, sem erros novos no console. Escopo: contido; sem refatorar `atlas-shell.tsx`; sem telemetria.

---

# RELEVANT REPOSITORY FACTS

1. Reproduzido localmente com `pnpm run build` + `pnpm start` (Playwright/Chromium): 6 cliques no menu desktop, URL não muda; console: `[vinext] RSC prefetch setup error: TypeError: te is not a function` (idêntico a produção) e `PAGEERR e is not a function` (`navigateClientSide` indefinido). Em `pnpm run dev` (sem bundle) a navegação funciona.
2. Com `build.minify:false` o erro vira `getPrefetchInterceptionContext is not a function` / `navigateClientSide is not a function` — não é problema de minificação nem código do app (`atlas-shell.tsx` usa `next/link` sem `onClick` nos links do `main-nav`).
3. Mecanismo: em `vinext@1.0.0-beta.5`, `link.js` faz `import("./navigation.js")` e `import("../server/app-rsc-cache-busting.js")`. No build, esses módulos ficam dentro do chunk de entrada `index-*.js` (o chunk de shims `vinext-*.js` que o config do vinext deveria criar não é gerado), e o chunk de entrada exporta só um subconjunto (`usePathname`, `getNavigationRuntime`, …), sem `getPrefetchInterceptionContext`, `navigateClientSide`, `createRscRequestUrl` etc. `preserveEntrySignatures: 'allow-extension'` não alterou o resultado.
4. Diagnóstico em cópia descartável (fora do repositório): com `vinext@1.0.0` + `@vitejs/plugin-rsc@0.5.34` (peer exigido pelo vinext 1.0.0), o build gera o chunk `vinext-*.js` e os 6 itens do menu desktop navegam corretamente, sem os erros acima (restam apenas 404/500 de recursos que também ocorrem em `pnpm run dev`).
5. Versões atuais: `vinext 1.0.0-beta.5`, `@vitejs/plugin-rsc 0.5.26`, `vite 8.0.13`, `@vitejs/plugin-react 6.0.2`. `vinext` está fixado (sem `^`) no `package.json`; publicação depende de `@openai/sites-vite-plugin@0.2.0`.
6. Nenhuma alteração foi feita neste repositório além deste documento.

---

# OPTIONS AND TRADE-OFFS

A. Atualizar `vinext` para `1.0.0` e `@vitejs/plugin-rsc` para `0.5.34` (mudança de dependências estruturais; lockfile muda; não verificado: compatibilidade com `@openai/sites-vite-plugin@0.2.0`/deploy Cloudflare além do build e `wrangler dev` locais; regressões fora do menu não exercitadas).

B. Manter `vinext@1.0.0-beta.5` e contornar por configuração local em `vite.config.ts` (sobrescrever o code splitting do cliente para forçar navigation/cache-busting em chunk compartilhado). Não testado; acopla o projeto a detalhes internos do vinext/Rolldown e pode quebrar em upgrades.

C. Manter `vinext@1.0.0-beta.5` e evitar `next/link` no menu (navegação por `<a>` com carregamento completo ou `router.push`). Não testado quanto a `router.push`; muda o comportamento de navegação (recarga de página) e não corrige o runtime para outros usos de `Link`.

---

# DECISION REQUIRED

Qual opção (ou outra) adotar. O quest será retomado com as restrições que o Raf definir.

---

# CORE PRINCIPLE

Atlas supplies product requirement. Claude Code supplies evidence. Raf supplies architectural judgment. These responsibilities must remain separate.
