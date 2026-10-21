# APA-17 — Resultado do bake-off de modelo (enriquecimento)

Pendente: este arquivo é regravado automaticamente por `scripts/apache-bakeoff.ts`
quando o script roda contra a conta Cloudflare real. Ainda não rodou.

## Como rodar

Precisa de uma API Token da Cloudflare com permissão **Workers AI - Read** (ou
Edit) e do **Account ID** da conta onde o Atlas está implantado:

1. Account ID: `npx wrangler whoami` imprime o(s) Account ID(s) disponíveis
   para a conta logada (ou veja a barra lateral direita de qualquer página do
   dashboard da Cloudflare, em "Account ID").
2. API Token: no dashboard da Cloudflare, **My Profile > API Tokens > Create
   Token**, usar o template **"Workers AI"** (ou um token customizado com a
   permissão **Account > Workers AI > Read**), e copiar o valor assim que for
   gerado (não aparece de novo depois).

Depois, no PowerShell, em `C:\Users\abner\OneDrive\Desktop\Projetos\Atlas\atlaspjt-atual`:

```powershell
$env:CLOUDFLARE_ACCOUNT_ID = "SEU_ACCOUNT_ID_AQUI"; $env:CLOUDFLARE_API_TOKEN = "SEU_TOKEN_AQUI"; pnpm run apache:bakeoff
```

O script faz 6 chamadas (3 modelos × 2 casos de teste), custando bem menos de
50 neurons no total (orçamento diário é 10.000), e regrava este arquivo com a
tabela de resultados, a saída bruta de cada chamada e uma seção de
recomendação a preencher depois da análise.

Depois de rodar, commitar o `docs/apache-bakeoff-resultado.md` atualizado (ou
colar o conteúdo de volta nesta thread) para a análise e a decisão final de
`APACHE_ENRICHMENT_MODEL`.
