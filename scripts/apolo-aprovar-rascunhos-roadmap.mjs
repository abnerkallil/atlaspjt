// Aprova em lote os rascunhos pendentes do Apolo que já têm conteúdo do
// roadmap principal de Contabilidade preenchido (content_id — a curadoria
// só grava esse campo quando o nó já existe em lib/content-catalog.ts/
// atlas_contents, nunca para content_label_id, que é taxonomia de temas sem
// roadmap ainda). Pedido do Abner (thread "Aprovar rascunhos do roadmap de
// contabilidade", 2026-11-11): aprovar automaticamente tudo que já bate com
// um conteúdo do roadmap principal, substituindo — só para este lote — a
// regra de nunca aprovar sem revisão humana (DEC-014).
//
// Replica exatamente o que approveDraft() (lib/apolo/drafts.ts) faz por
// rascunho — grava a questão em atlas_questions na próxima posição do
// conteúdo, já ativa, e marca o rascunho como 'aprovado' — mas em lote via
// SQL gerado localmente, calculando a posição seguinte em memória (um
// próximo-position por content_id, incrementado a cada rascunho) em vez de
// uma subquery por linha, que atribuiria a mesma posição a várias questões
// do mesmo conteúdo dentro do mesmo lote.
//
// Só aprova um rascunho que já tem os três campos que approveDraft() exige:
// content_id, bloom_level e explanation (não vazia). Rascunhos sem Bloom
// ainda precisam passar por `pnpm run apolo:sugestao-bloom` primeiro (não é
// chamado por este script, para manter cada gravação auditável e no seu
// próprio lote). Nunca toca um rascunho que não esteja 'pendente' nem um
// cujo content_id não exista em atlas_contents (nó inventado/typo na
// classificação anterior) — esses ficam de fora e são listados no resumo.
//
// Uso:
//   pnpm run apolo:aprovar-roadmap -- --check
//   pnpm run apolo:aprovar-roadmap -- --target local
//   pnpm run apolo:aprovar-roadmap -- --target production
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { requireTarget, runCli } from './lib/target-env.mjs';
import { createRunner } from './lib/wrangler-cli.mjs';

const LOCAL = { d1: 'site-creator-d1', config: 'wrangler.local.jsonc', where: '--local' };
const LOCAL_CONFIG = 'deploy.local.json';
const REMOTE_D1_CONFIG = '.wrangler/apolo-aprovar-roadmap-d1.json';
const SQL_FILE = '.wrangler/apolo-aprovar-roadmap.sql';
const CHUNK_SIZE = 150; // duas gravações por rascunho (INSERT + UPDATE) dentro do limite de 300 do apolo-aplicar-curadoria.

function literal(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
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
    JSON.stringify({ name: 'apolo-aprovar-roadmap', d1_databases: [{ binding: 'DB', database_name: production.d1, database_id: database.uuid }] }),
  );
  return { d1: production.d1, config: REMOTE_D1_CONFIG, where: '--remote' };
}

function runBatched(wrangler, d1, where, config, statements, label) {
  let written = 0;
  for (let i = 0; i < statements.length; i += CHUNK_SIZE) {
    const chunk = statements.slice(i, i + CHUNK_SIZE);
    writeFileSync(SQL_FILE, `${chunk.join('\n')}\n`);
    try {
      wrangler(['d1', 'execute', d1, where, '--config', config, '--file', SQL_FILE, '--yes'], `Falha ao gravar o lote de ${label} ${i + 1}-${i + chunk.length}.`);
    } finally {
      writeFileSync(SQL_FILE, '');
    }
    written += chunk.length;
    console.log(`  ${label}: ${written}/${statements.length}...`);
  }
}

await runCli(async () => {
  const { values } = parseArgs({
    args: process.argv.slice(2).filter((arg) => arg !== '--'),
    options: { target: { type: 'string' }, check: { type: 'boolean' } },
  });

  const { wranglerJson, d1Rows, wrangler } = createRunner(process.env);
  const target = values.check ? 'local' : requireTarget(values.target);
  const { d1, config, where } = resolveTarget(target, wranglerJson);

  const validContentIds = new Set(
    d1Rows([d1, where, '--config', config], `SELECT id FROM atlas_contents`, 'Não consegui ler os conteúdos no D1.').map((row) => row.id),
  );

  const candidates = d1Rows(
    [d1, where, '--config', config],
    `SELECT d.id AS id, d.content_id AS content_id, d.subtopic_id AS subtopic_id, d.theme AS theme, d.kind AS kind,
            d.prompt AS prompt, d.context AS context, d.options_json AS options_json, d.correct_option AS correct_option,
            d.model_answer AS model_answer, d.expected_value AS expected_value, d.tolerance AS tolerance,
            d.verification_json AS verification_json, d.explanation AS explanation, d.bloom_level AS bloom_level,
            d.knowledge_type AS knowledge_type, d.origin AS origin, d.exam_board AS exam_board, d.exam_org AS exam_org,
            d.exam_year AS exam_year, d.text_hash AS text_hash, s.object_key AS source_object_key, d.created_at AS created_at
     FROM atlas_question_drafts d
     LEFT JOIN atlas_question_sources s ON s.id = d.source_id
     WHERE d.status = 'pendente' AND d.content_id IS NOT NULL AND d.bloom_level IS NOT NULL
       AND d.explanation IS NOT NULL AND TRIM(d.explanation) <> ''
     ORDER BY d.content_id, d.created_at`,
    'Não consegui ler os rascunhos pendentes no D1.',
  );

  const eligible = [];
  const skippedUnknownContent = [];
  for (const row of candidates) {
    if (validContentIds.has(row.content_id)) {
      eligible.push(row);
    } else {
      skippedUnknownContent.push(row);
    }
  }

  console.log(`${candidates.length} rascunho(s) pendente(s) com conteúdo + Bloom + explicação preenchidos.`);
  if (skippedUnknownContent.length) {
    console.log(
      `  ${skippedUnknownContent.length} ignorado(s): content_id não existe em atlas_contents (classificação antiga/typo) — ` +
        `${[...new Set(skippedUnknownContent.map((r) => r.content_id))].join(', ')}`,
    );
  }
  console.log(`${eligible.length} rascunho(s) elegível(eis) para aprovação automática.`);

  const stillPendingWithoutBloom = d1Rows(
    [d1, where, '--config', config],
    `SELECT COUNT(*) AS total FROM atlas_question_drafts WHERE status = 'pendente' AND content_id IS NOT NULL AND bloom_level IS NULL`,
    'Não consegui contar rascunhos sem Bloom no D1.',
  )[0]?.total ?? 0;
  if (Number(stillPendingWithoutBloom) > 0) {
    console.log(
      `  Aviso: ${stillPendingWithoutBloom} rascunho(s) com conteúdo preenchido ainda sem bloom_level — rode ` +
        `"pnpm run apolo:sugestao-bloom -- --target ${target}" antes para incluí-los nesta aprovação.`,
    );
  }

  const byContent = new Map();
  for (const row of eligible) {
    const list = byContent.get(row.content_id) ?? [];
    list.push(row);
    byContent.set(row.content_id, list);
  }
  console.log(`Conteúdo(s) do roadmap que vão ganhar questão nova: ${byContent.size}`);
  for (const [contentId, rows] of byContent) {
    console.log(`  ${contentId}: +${rows.length}`);
  }

  if (values.check) {
    console.log('Só --check: nada foi gravado.');
    return;
  }

  if (!eligible.length) {
    console.log('Nada para aprovar.');
    return;
  }

  const nextPositionByContent = new Map(
    d1Rows(
      [d1, where, '--config', config],
      `SELECT content_id, COALESCE(MAX(position) + 1, 0) AS next_position FROM atlas_questions GROUP BY content_id`,
      'Não consegui ler as posições atuais em atlas_questions.',
    ).map((row) => [row.content_id, Number(row.next_position)]),
  );

  const now = new Date().toISOString();
  const statements = [];
  const approvedSummary = new Map();
  for (const row of eligible) {
    const position = nextPositionByContent.get(row.content_id) ?? 0;
    nextPositionByContent.set(row.content_id, position + 1);
    const questionId = `${row.content_id}-rascunho-${row.id.slice(0, 8)}`;

    statements.push(
      `INSERT INTO atlas_questions
       (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value,
        tolerance, verification_json, explanation, source, active, updated_at, theme, bloom_level, lifecycle_state,
        subtopic_id, knowledge_type, origin, exam_board, exam_org, exam_year, source_object_key, text_hash)
       VALUES (${literal(questionId)}, ${literal(row.content_id)}, ${position}, ${literal(row.kind)}, ${literal(row.prompt)}, ` +
        `${literal(row.context)}, ${literal(row.options_json)}, ${literal(row.correct_option)}, ${literal(row.model_answer)}, ` +
        `${literal(row.expected_value)}, ${literal(row.tolerance)}, ${literal(row.verification_json)}, ${literal(row.explanation)}, ` +
        `'importado', 1, ${literal(now)}, ${literal(row.theme)}, ${literal(row.bloom_level)}, 'ativa', ${literal(row.subtopic_id)}, ` +
        `${literal(row.knowledge_type)}, ${literal(row.origin)}, ${literal(row.exam_board)}, ${literal(row.exam_org)}, ` +
        `${literal(row.exam_year)}, ${literal(row.source_object_key)}, ${literal(row.text_hash)});`,
    );
    statements.push(
      `UPDATE atlas_question_drafts SET status = 'aprovado', approved_question_id = ${literal(questionId)}, reviewed_at = ${literal(now)} ` +
        `WHERE id = ${literal(row.id)} AND status = 'pendente';`,
    );
    approvedSummary.set(row.content_id, (approvedSummary.get(row.content_id) ?? 0) + 1);
  }

  runBatched(wrangler, d1, where, config, statements, 'aprovação de rascunhos');

  console.log(`Pronto: ${eligible.length} rascunho(s) aprovado(s) e já ativo(s) em ${d1}, cobrindo ${approvedSummary.size} conteúdo(s) do roadmap.`);
});
