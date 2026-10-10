// Sugestão de nível de Bloom para rascunhos pendentes (APO-07, DEC-014):
// pré-marca `bloom_level` com um palpite regra-fixa (lib/apolo/bloom-classifier.ts,
// duplicado em scripts/lib/bloom-classifier.mjs — ver o comentário lá) para o
// Abner não ter que escolher do zero cada um dos 1.800 rascunhos em /rascunhos.
// Nunca decide por conta própria: só enche o campo onde ainda está vazio,
// nunca em rascunho já revisado (bloom_level preenchido) ou já aprovado/
// descartado, e a aprovação continua exigindo o humano confirmar Bloom,
// conteúdo e explicação antes de gravar a questão (nada muda nisso).
//
// Pedido do Abner (thread "Cards em escada do Apolo", 2026-10-10): ele não
// sabe o que determina o nível de Bloom, então pediu para a Claude pesquisar
// e fazer essa classificação por ele. Resumo da pesquisa em docs/FONTES.md.
//
// DEC-009: o ambiente vem de --target a cada execução, sem default.
//
// Uso:
//   pnpm run apolo:sugestao-bloom -- --check
//   pnpm run apolo:sugestao-bloom -- --target local
//   pnpm run apolo:sugestao-bloom -- --target production
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { suggestBloomLevel } from './lib/bloom-classifier.mjs';
import { requireTarget, runCli } from './lib/target-env.mjs';
import { createRunner } from './lib/wrangler-cli.mjs';

const LOCAL = { d1: 'site-creator-d1', config: 'wrangler.local.jsonc', where: '--local' };
const LOCAL_CONFIG = 'deploy.local.json';
const REMOTE_D1_CONFIG = '.wrangler/apolo-sugestao-bloom-d1.json';

function literal(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function resolveTarget(target, wranglerJson) {
  if (target !== 'production') return LOCAL;
  if (!existsSync(LOCAL_CONFIG)) throw new Error(`Arquivo ${LOCAL_CONFIG} não encontrado (veja deploy.example.json).`);
  const production = JSON.parse(readFileSync(LOCAL_CONFIG, 'utf8')).production;
  if (!production?.d1 || String(production.d1).startsWith('<')) {
    throw new Error(`Preencha "production.d1" em ${LOCAL_CONFIG} com o nome real.`);
  }
  const database = wranglerJson(['d1', 'list'], 'Não consegui listar os D1. Rode "npx wrangler login".').find(
    (item) => item.name === production.d1,
  );
  if (!database) throw new Error(`O D1 "${production.d1}" não existe nesta conta Cloudflare.`);
  writeFileSync(
    REMOTE_D1_CONFIG,
    JSON.stringify({ name: 'apolo-sugestao-bloom', d1_databases: [{ binding: 'DB', database_name: production.d1, database_id: database.uuid }] }),
  );
  return { d1: production.d1, config: REMOTE_D1_CONFIG, where: '--remote' };
}

await runCli(async () => {
  const { values } = parseArgs({
    args: process.argv.slice(2).filter((arg) => arg !== '--'),
    options: { target: { type: 'string' }, check: { type: 'boolean' } },
  });

  const { wranglerJson, d1Rows, wrangler } = createRunner(process.env);
  const target = values.check ? 'local' : requireTarget(values.target);
  const { d1, config, where } = resolveTarget(target, wranglerJson);

  const pending = d1Rows(
    [d1, where, '--config', config],
    `SELECT id, kind, prompt, context FROM atlas_question_drafts WHERE status = 'pendente' AND bloom_level IS NULL`,
    'Não consegui ler os rascunhos pendentes no D1.',
  );

  if (!pending.length) {
    console.log('Nenhum rascunho pendente sem Bloom — nada para sugerir.');
    return;
  }

  const counts = {};
  const updates = [];
  for (const row of pending) {
    const { level, matchedCue } = suggestBloomLevel(row.kind, row.prompt, row.context);
    counts[level] = (counts[level] ?? 0) + 1;
    updates.push({ id: row.id, level, matchedCue });
  }

  console.log(`${pending.length} rascunho(s) pendente(s) sem Bloom. Sugestão por nível:`);
  for (const [level, count] of Object.entries(counts)) console.log(`  ${level}: ${count}`);

  if (values.check) {
    console.log('Só --check: nada foi gravado. Rode com --target local ou --target production para aplicar.');
    return;
  }

  // Um UPDATE por rascunho, sempre condicionado a bloom_level ainda ser NULL
  // — mesmo que o Abner tenha revisado um rascunho entre a leitura e a
  // escrita, a condição garante que nunca sobrescrevemos uma escolha dele.
  const sql = updates
    .map((u) => `UPDATE atlas_question_drafts SET bloom_level = ${literal(u.level)} WHERE id = ${literal(u.id)} AND bloom_level IS NULL;`)
    .join('\n');
  wrangler(['d1', 'execute', d1, where, '--config', config, '--command', sql, '--yes'], 'Falha ao gravar as sugestões de Bloom no D1.');

  console.log(`Pronto: ${updates.length} rascunho(s) com sugestão de Bloom pré-marcada em ${d1} (sem alterar os já revisados).`);
  console.log('Nada foi aprovado — cada um continua exigindo revisão humana em /rascunhos antes de virar questão ativa.');
});
