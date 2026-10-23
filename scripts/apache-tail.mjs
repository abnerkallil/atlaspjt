// APA-16 (operacional): observa os logs em tempo real do Worker de produção
// (`wrangler tail`) para conferir se alguma requisição excedeu o teto de
// 10ms de CPU do Workers Free (risco do upload de material do APA-12/APA-11)
// — ver docs/APACHE.md, seção "O que o Abner precisa fazer". Lê o nome real
// do Worker (e o accountId, se houver) de `deploy.local.json`, do mesmo jeito
// que `deploy.mjs`/`backup.mjs` já fazem: nada aqui é um placeholder que o
// Abner precisa preencher na mão.
//
// Comando interativo (roda até Ctrl+C) — não lança em erro ao ser
// interrompido: isso é o jeito normal de parar de observar, não uma falha.
//
// Uso: pnpm run apache:tail
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const LOCAL_CONFIG = 'deploy.local.json';
const WRANGLER = resolve('node_modules/wrangler/bin/wrangler.js');

function readProductionWorker() {
  if (!existsSync(LOCAL_CONFIG)) {
    throw new Error(
      `Arquivo ${LOCAL_CONFIG} não encontrado. Copie deploy.example.json para ${LOCAL_CONFIG} ` +
        'e preencha os nomes reais (ele é ignorado pelo git) -- o mesmo arquivo que o Publicar Atlas usa.',
    );
  }
  const section = JSON.parse(readFileSync(LOCAL_CONFIG, 'utf8')).production;
  if (!section) throw new Error(`${LOCAL_CONFIG} não tem a seção "production".`);
  if (!section.worker || String(section.worker).startsWith('<')) {
    throw new Error(`Preencha "production.worker" em ${LOCAL_CONFIG} com o nome real do Worker.`);
  }
  return section;
}

try {
  const { worker, accountId } = readProductionWorker();
  const env = accountId ? { ...process.env, CLOUDFLARE_ACCOUNT_ID: accountId } : process.env;

  console.log(`Observando "${worker}" (Ctrl+C para parar)...`);
  console.log('Procure por "Exceeded CPU Limit" nas linhas enquanto testa o upload de material.');
  console.log('O tempo exato de CPU (em ms) fica no painel Cloudflare: Workers & Pages > o Worker > aba Metrics.\n');

  // stdio inherit: o próprio terminal do Abner mostra as linhas em tempo
  // real; spawnSync bloqueia até o processo acabar (Ctrl+C), que é o uso
  // normal esperado aqui -- não é um erro a ser reportado.
  spawnSync(process.execPath, [WRANGLER, 'tail', worker, '--format', 'pretty'], {
    env,
    stdio: 'inherit',
  });
} catch (error) {
  console.error(`Erro: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
