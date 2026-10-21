import { sites } from '@openai/sites-vite-plugin';
import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig } from 'vite';
import hostingConfig from './.openai/hosting.json';

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  'edcb415e-ccbf-43c7-a0ab-a614f3222f5c';

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === 'seatbelt';

const localBindingConfig = {
  // Entry próprio (worker-entry.ts) em vez do handler padrão do vinext:
  // vinext não exporta um handler `queue`, então este arquivo embrulha o
  // fetch do vinext e acrescenta o consumer da fila do Apache (acima).
  main: './worker-entry.ts',
  compatibility_flags: ['nodejs_compat'],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: 'site-creator-d1',
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: 'site-creator-r2',
        },
      ]
    : [],
  // Limite de tentativas de login: 10 por minuto por IP (lib/auth-env.ts).
  // APACHE_RATE_LIMITER (Gate APA-14 item 7): 20/min por usuário nas rotas
  // de enriquecimento (app/api/apache/enriquecimento/*) -- namespace_id
  // diferente do login, cada ratelimit binding precisa do seu próprio.
  ratelimits: [
    {
      name: 'LOGIN_RATE_LIMITER',
      namespace_id: '1001',
      simple: { limit: 10, period: 60 as const },
    },
    {
      name: 'APACHE_RATE_LIMITER',
      namespace_id: '1002',
      simple: { limit: 20, period: 60 as const },
    },
  ],
  // APA-17: modelo escolhido para o enriquecimento (bake-off, ver
  // docs/apache-bakeoff-resultado.md) -- lido como variável de ambiente
  // (lib/apache/enrichment.ts lê `env.APACHE_ENRICHMENT_MODEL`, nunca
  // hardcoded), para trocar de modelo sem precisar de deploy de código.
  vars: {
    APACHE_ENRICHMENT_MODEL: '@cf/google/gemma-4-26b-a4b-it',
  },
  // APA-07 (DEC-019): geração da aula roda no consumer desta fila
  // (worker-entry.ts), nunca na rota GET — o produtor só manda uma
  // mensagem leve {queueId, contentId}. Plano Free: 10.000 operações/dia
  // (leitura+escrita+exclusão somadas), ~6-12 operações por aula (send +
  // leitura do lote + ack/retry, contando que a varredura pode reenviar).
  // max_batch_size: 1 — cada mensagem já leva segundos (chamada de IA);
  // um lote maior deixaria a hora de início do lote velha para as últimas
  // mensagens, fazendo a varredura achar que elas travaram e reenviá-las
  // (gerando a aula 2x) — ver `now` por mensagem em handleLessonQueueBatch.
  // max_retries: 3, coerente com o limite de tentativas já aplicado em
  // lib/apache/queue.ts; sem dead_letter_queue — um item que esgota os
  // retries da própria Cloudflare ainda é recuperado pela varredura
  // (sweepQueue) depois da meia-noite UTC.
  queues: {
    producers: [{ queue: 'atlas-apache-aulas', binding: 'APACHE_LESSON_QUEUE' }],
    consumers: [
      {
        queue: 'atlas-apache-aulas',
        max_batch_size: 1,
        max_retries: 3,
      },
    ],
  },
};

export default defineConfig(async ({ command }) => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= 'false';
  process.env.WRANGLER_LOG_PATH ??= '.wrangler/logs';
  process.env.MINIFLARE_REGISTRY_PATH ??= '.wrangler/registry';

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import('@cloudflare/vite-plugin');

  // Workers AI (APA-06, lib/apache/lesson-writer.ts): só entra no build/deploy.
  // Em `pnpm dev` sem opt-in explícito, o binding derruba o remote proxy
  // session do Wrangler pra quem não rodou `wrangler login`, e pra quem
  // rodou, gastaria neurons reais a cada preview local. APACHE_AI_DEV=1
  // liga o binding em dev só quando alguém quer testar o Apache de propósito.
  const includeAiBinding = command === 'build' || process.env.APACHE_AI_DEV === '1';
  const config = {
    ...localBindingConfig,
    ...(includeAiBinding ? { ai: { binding: 'AI' } } : {}),
  };

  return {
    css: { postcss: { plugins: [tailwindcss()] } },
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
        config,
      }),
    ],
  };
});
