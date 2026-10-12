// Aplica um arquivo de classificação (conteúdo + tipo de conhecimento) aos
// rascunhos pendentes (APO-07, DEC-014, pedido do Abner em 2026-10-12 para
// os ~3.600 rascunhos de banco-novo + fontes-autorais).
//
// Quem decide o conteúdo e o tipo de conhecimento é a thread de curadoria,
// não este script — ele só grava uma decisão já tomada. Nunca aprova um
// rascunho nem decide nada por conta própria.
//
// Cada rascunho usa UM dos dois caminhos de conteúdo:
//   - contentId: já existe um nó real no roadmap (hoje só Contabilidade
//     Geral/Tributária, ~157 nós).
//   - contentLabel {theme, title}: ainda não existe roadmap para esse tema
//     (direito, matemática, português, departamento pessoal/fiscal, etc.) —
//     grava em atlas_content_taxonomy (aberta, sem enum, mesmo princípio de
//     atlas_themes) e liga o rascunho por content_label_id. Essa taxonomia é
//     a matéria-prima do futuro gerador de roadmap personalizado.
//
// Rascunhos são identificados por text_hash (mesmo FNV-1a de
// scripts/lib/question-bank.mjs), não por id — o arquivo de classificação é
// escrito a partir do prompt da questão, sem precisar saber o id real da
// linha em produção.
//
// Nunca sobrescreve um rascunho já revisado (content_id/content_label_id ou
// knowledge_type já preenchidos) nem um que não esteja mais "pendente" —
// mesmo que a classificação tenha sido gerada antes de alguém revisar à mão.
//
// Uso:
//   pnpm run apolo:aplicar-curadoria -- --file caminho.json --check
//   pnpm run apolo:aplicar-curadoria -- --file caminho.json --target local
//   pnpm run apolo:aplicar-curadoria -- --file caminho.json --target production
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { requireTarget, requireOption, runCli } from './lib/target-env.mjs';
import { createRunner } from './lib/wrangler-cli.mjs';

const LOCAL = { d1: 'site-creator-d1', config: 'wrangler.local.jsonc', where: '--local' };
const LOCAL_CONFIG = 'deploy.local.json';
const REMOTE_D1_CONFIG = '.wrangler/apolo-aplicar-curadoria-d1.json';
const SQL_FILE = '.wrangler/apolo-aplicar-curadoria.sql';
const CHUNK_SIZE = 300;

// Mesma lista de lib/apolo/question-bank.ts (KNOWLEDGE_TYPES), duplicada
// porque este script roda fora do bundle da Worker (mesmo princípio do
// bloom-classifier duplicado em scripts/lib).
const KNOWLEDGE_TYPES = ['factual', 'conceitual', 'procedimental', 'metacognitivo'];

function literal(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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
    JSON.stringify({ name: 'apolo-aplicar-curadoria', d1_databases: [{ binding: 'DB', database_name: production.d1, database_id: database.uuid }] }),
  );
  return { d1: production.d1, config: REMOTE_D1_CONFIG, where: '--remote' };
}

function loadClassifications(path) {
  const entries = JSON.parse(readFileSync(path, 'utf8'));
  if (!Array.isArray(entries)) throw new Error(`${path} precisa ser uma lista de classificações.`);
  for (const entry of entries) {
    if (!entry.textHash) throw new Error(`Entrada sem textHash: ${JSON.stringify(entry)}`);
    if (entry.contentId && entry.contentLabel) {
      throw new Error(`${entry.textHash}: use contentId OU contentLabel, nunca os dois.`);
    }
    if (!entry.contentId && !entry.contentLabel) {
      throw new Error(`${entry.textHash}: falta contentId ou contentLabel.`);
    }
    if (entry.contentLabel && (!entry.contentLabel.theme || !entry.contentLabel.title)) {
      throw new Error(`${entry.textHash}: contentLabel precisa de theme e title.`);
    }
    if (entry.knowledgeType && !KNOWLEDGE_TYPES.includes(entry.knowledgeType)) {
      throw new Error(`${entry.textHash}: knowledgeType "${entry.knowledgeType}" inválido (${KNOWLEDGE_TYPES.join(', ')}).`);
    }
  }
  return entries;
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
    options: { target: { type: 'string' }, check: { type: 'boolean' }, file: { type: 'string' } },
  });

  const filePath = requireOption(values, 'file', 'o caminho do arquivo de classificação');
  const entries = loadClassifications(filePath);
  console.log(`${entries.length} classificação(ões) no arquivo.`);

  const { wranglerJson, d1Rows, wrangler } = createRunner(process.env);
  const target = values.check ? 'local' : requireTarget(values.target);
  const { d1, config, where } = resolveTarget(target, wranglerJson);

  // Temas válidos já cadastrados (atlas_themes) — um contentLabel.theme que
  // não existe aqui é erro de digitação na classificação, não tema novo:
  // tema novo é sempre cadastrado pela tela /rascunhos (POST /api/apolo/temas),
  // nunca por este script.
  const themes = new Set(d1Rows([d1, where, '--config', config], `SELECT id FROM atlas_themes`, 'Não consegui ler os temas no D1.').map((row) => row.id));
  for (const entry of entries) {
    if (entry.contentLabel && !themes.has(entry.contentLabel.theme)) {
      throw new Error(`${entry.textHash}: tema "${entry.contentLabel.theme}" não existe em atlas_themes.`);
    }
  }

  // Taxonomia existente, para reusar o mesmo id em vez de duplicar o mesmo
  // par tema+título (ex.: 50 rascunhos sobre "Prescrição e decadência
  // tributária" devem cair na mesma linha de atlas_content_taxonomy).
  const existingTaxonomy = new Map(
    d1Rows([d1, where, '--config', config], `SELECT id, theme_id, title FROM atlas_content_taxonomy`, 'Não consegui ler a taxonomia no D1.').map((row) => [
      `${row.theme_id}::${row.title}`,
      row.id,
    ]),
  );

  const now = new Date().toISOString();
  const taxonomyInserts = [];
  const resolvedLabelId = new Map(); // "theme::title" -> id (novo ou existente)
  for (const entry of entries) {
    if (!entry.contentLabel) continue;
    const key = `${entry.contentLabel.theme}::${entry.contentLabel.title}`;
    if (existingTaxonomy.has(key)) {
      resolvedLabelId.set(key, existingTaxonomy.get(key));
      continue;
    }
    if (resolvedLabelId.has(key)) continue;
    const id = `${entry.contentLabel.theme}--${slugify(entry.contentLabel.title)}`;
    resolvedLabelId.set(key, id);
    taxonomyInserts.push(
      `INSERT INTO atlas_content_taxonomy (id, theme_id, title, created_at) VALUES (${literal(id)}, ${literal(entry.contentLabel.theme)}, ${literal(entry.contentLabel.title)}, ${literal(now)}) ON CONFLICT(id) DO NOTHING;`,
    );
  }

  // Sempre condicionado a status = 'pendente' e aos campos ainda NULL — nunca
  // sobrescreve uma revisão humana que já aconteceu entre a leitura da fila
  // e esta gravação (mesmo princípio de apolo-sugestao-bloom.mjs).
  const draftUpdates = entries.map((entry) => {
    const sets = [];
    if (entry.contentId) sets.push(`content_id = ${literal(entry.contentId)}`);
    if (entry.contentLabel) sets.push(`content_label_id = ${literal(resolvedLabelId.get(`${entry.contentLabel.theme}::${entry.contentLabel.title}`))}`);
    if (entry.knowledgeType) sets.push(`knowledge_type = ${literal(entry.knowledgeType)}`);
    return (
      `UPDATE atlas_question_drafts SET ${sets.join(', ')} ` +
      `WHERE text_hash = ${literal(entry.textHash)} AND status = 'pendente' ` +
      `AND content_id IS NULL AND content_label_id IS NULL;`
    );
  });

  if (values.check) {
    console.log(`Só --check: ${taxonomyInserts.length} linha(s) nova(s) de taxonomia, ${draftUpdates.length} UPDATE(s) de rascunho — nada foi gravado.`);
    return;
  }

  if (taxonomyInserts.length) runBatched(wrangler, d1, where, config, taxonomyInserts, 'taxonomia nova');
  runBatched(wrangler, d1, where, config, draftUpdates, 'rascunhos');

  console.log(`Pronto: ${draftUpdates.length} rascunho(s) classificado(s) em ${d1}. Nada foi aprovado — continua exigindo revisão humana em /rascunhos.`);
});
