# Autenticação — configuração e recuperação de acesso

Contrato técnico da autenticação de usuário único (DEC-007). O Atlas guarda só
dois Worker secrets; não existe tabela de usuário nem de sessão.

| Secret | O que é | Efeito de trocar |
|---|---|---|
| `ATLAS_PASSWORD_HASH` | Hash PBKDF2 da senha | A senha antiga deixa de entrar |
| `ATLAS_SESSION_SECRET` | Chave que assina o cookie `atlas_session` | Todas as sessões abertas, em qualquer dispositivo, são encerradas |

Sem os dois secrets o Worker recusa todo acesso (falha fechada) e a tela de
login mostra "Autenticação não configurada neste ambiente."

## Limite de tentativas

O login aceita no máximo 10 tentativas por minuto por IP (binding
`LOGIN_RATE_LIMITER`, Workers Rate Limiting, declarado em `vite.config.ts` e
copiado para `dist/server/wrangler.json` pelo build). Passado o limite, a tela
mostra "Muitas tentativas" até o minuto acabar. Sem o binding o login funciona
sem limite.

## Comandos

```bash
pnpm run auth:secrets          # pede a nova senha (mín. 12 caracteres) e imprime os dois valores
pnpm run auth:revoke-sessions  # imprime só um novo ATLAS_SESSION_SECRET
```

Nada é gravado em disco. Para gravar no Worker de produção (`atlas-notes`),
depois de `pnpm run build` e `node scripts/prepare-own-deploy.mjs --target production --name <worker> --db <d1> --id <d1-id> --bucket <r2>` (DEC-009, ver `docs/dev-producao.md`):

```bash
npx wrangler secret put ATLAS_PASSWORD_HASH  --config dist/server/wrangler.json
npx wrangler secret put ATLAS_SESSION_SECRET --config dist/server/wrangler.json
```

O `wrangler` pede o valor em prompt, sem eco. O secret vale na hora, sem novo deploy.

## Recuperação de acesso

O caminho de recuperação é a própria conta Cloudflare: quem consegue entrar
nela (e recuperá-la pelo processo da Cloudflare) consegue redefinir o acesso
ao Atlas. Não existe recuperação por e-mail dentro do Atlas.

### Esqueci a senha

1. `pnpm run auth:secrets` e digitar a nova senha.
2. Gravar `ATLAS_PASSWORD_HASH` e `ATLAS_SESSION_SECRET` com `wrangler secret put`.
3. Entrar em `/login` com a nova senha. As sessões antigas foram encerradas
   junto com a troca do secret de sessão.

### Perdi um dispositivo ou suspeito de acesso indevido

- Senha ainda é segura: `pnpm run auth:revoke-sessions` e gravar só
  `ATLAS_SESSION_SECRET`. Todos os dispositivos voltam para o login.
- Senha pode ter vazado: seguir "Esqueci a senha" (troca os dois).

### Desenvolvimento local

Os mesmos nomes vão em `.dev.vars` (ignorado pelo git). Use valores próprios
de desenvolvimento; o secret de produção nunca é copiado para a máquina local.
