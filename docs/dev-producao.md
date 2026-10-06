# Desenvolvimento e produção (DEC-009)

Só existe um ambiente remoto: produção (Worker, D1 e, com DEC-008, o bucket R2 na
conta Cloudflare do usuário). Desenvolvimento e testes rodam só na máquina, com D1
e R2 emulados pelo Miniflare. Não há staging remoto.

## Regras

- `.dev.vars` guarda apenas valores de dev (senha de teste, secret de sessão de
  teste). Secrets de produção existem só como Worker secrets (`docs/auth.md`).
- `pnpm run dev`, `pnpm run build` e `pnpm run start` nunca executam scripts de
  dados ou deploy.
- Todo script que pode tocar um recurso remoto exige `--target` em toda execução.
  Não há valor padrão: sem `--target` o script para antes de ler ou gravar.

## Scripts

| Script | Local | Produção |
| --- | --- | --- |
| `prepare-own-deploy.mjs` | não se aplica | `--target production --name <worker> --db <d1> --id <d1-id>` (todos obrigatórios) |
| `seed-notes.mjs` | `--target local --db <d1> --config wrangler.local.jsonc` | `--target production --db <d1> --config <wrangler.json>` |
| `export-data.mjs` | `--target local` (padrão `http://localhost:3000`) | `--target production --url <site>` |

O export abre uma sessão com a senha em `ATLAS_EXPORT_PASSWORD`, definida no
terminal só para aquela execução (DEC-007 protege toda a API):

```bash
ATLAS_EXPORT_PASSWORD='...' pnpm run export:data -- --target production --url https://seu-site
```

`tests/dev-prod-isolation.test.ts` garante essas regras no CI.
