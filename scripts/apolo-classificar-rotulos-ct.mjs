// Reclassifica, só para Contabilidade Tributária, rascunhos pendentes que
// ainda estão "soltos" (content_id NULL, só com content_label_id — taxonomia
// pré-roadmap) mas cujo rótulo bate claramente, por nome, com um conteúdo
// específico do roadmap que hoje tem 0 questão aprovada. Baseado no
// levantamento /mnt/project-files/notes/levantamento-rascunhos-vs-roadmap-ct-2026-11-11.md
// (pedido do Abner na thread "Aprovar rascunhos do roadmap de contabilidade",
// 2026-11-11, estendido pelo coordenador para incluir esses rascunhos na
// mesma aprovação em lote).
//
// Só os casos em que o levantamento aponta UM conteúdo específico (não uma
// faixa com vários nós, onde a distribuição exigiria ler cada enunciado):
// CT-003, CT-004, CT-005, CT-006, CT-008, CT-009, CT-010, CT-068, CT-112.
// Faixas como CT-030..039, CT-040..045, CT-046..055, CT-056..062, CT-063..072,
// CT-073..077, CT-078..082, CT-083..090 e CT-091..098 ficam de fora — o
// levantamento não resolve ali um content_id único por rascunho, então não é
// "match claro" (pedido do coordenador: só os claros). Essas faixas precisam
// de uma curadoria questão a questão, fora do escopo deste script.
//
// Os padrões abaixo batem por substring no content_label_id (formato
// "<tema>--<slug>", scripts/apolo-aplicar-curadoria.mjs) justamente porque o
// levantamento só deu os rótulos abreviados, não a lista exata — por isso
// este script sempre roda com --check primeiro: ele mostra quantos rascunhos
// cada padrão capturou, para comparar com as contagens do levantamento antes
// de gravar qualquer coisa. Só toca rascunho 'pendente' com content_id NULL
// (nunca sobrescreve uma classificação já feita) e só nos temas
// direito-tributario, tributacao e departamento-fiscal (mesmo escopo do
// levantamento).
//
// Uso:
//   pnpm run apolo:classificar-ct -- --check --target <local|production>
//   pnpm run apolo:classificar-ct -- --target local
//   pnpm run apolo:classificar-ct -- --target production
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { requireTarget, runCli } from './lib/target-env.mjs';
import { createRunner } from './lib/wrangler-cli.mjs';

const LOCAL = { d1: 'site-creator-d1', config: 'wrangler.local.jsonc', where: '--local' };
const LOCAL_CONFIG = 'deploy.local.json';
const REMOTE_D1_CONFIG = '.wrangler/apolo-classificar-ct-d1.json';
const SQL_FILE = '.wrangler/apolo-classificar-ct.sql';
const SCOPED_THEMES = ['direito-tributario', 'tributacao', 'departamento-fiscal'];

// Cada entrada: content_id alvo (único, conforme o levantamento) + lista de
// substrings do content_label_id que batem com ele por nome.
const MAPPING = [
  { contentId: 'CT-003', patterns: ['competencia-tributaria'] },
  {
    contentId: 'CT-004',
    patterns: [
      'especies-tributarias',
      'conceito-de-imposto',
      'conceito-de-tributo',
      'taxa-fato-gerador',
      'taxa-especie-tributaria-vs-imposto',
      'contribuicoes-especiais-cide',
      'classificacao-dos-tributos-reais-e-pessoais',
      'tributos-diretos-e-indiretos',
      'tributo-direto-x-indireto',
      'bitributacao',
    ],
  },
  {
    contentId: 'CT-005',
    patterns: [
      'anterioridade',
      'capacidade-contributiva',
      'legalidade-tributaria',
      'imunidade',
      'imunidades',
      'irretroatividade',
      'vedacao-ao-confisco',
      'uniformidade-geografica',
      'seletividade-ipi-e-icms',
      'nao-cumulatividade-icms-e-ipi',
      'progressividade',
    ],
  },
  { contentId: 'CT-006', patterns: ['obrigacao-tributaria', 'fato-gerador-e-obrigacao-tributaria'] },
  {
    contentId: 'CT-008',
    patterns: [
      'sujeitos-da-relacao-tributaria',
      'sujeicao-passiva',
      'capacidade-tributaria-passiva',
      'responsavel-tributario-distincao-de-contribuinte',
      'responsabilidade-tributaria',
      'solidariedade-tributaria-passiva',
    ],
  },
  { contentId: 'CT-009', patterns: ['lancamento-tributario'] },
  {
    contentId: 'CT-010',
    patterns: [
      'isencao-tributaria',
      'divida-ativa-tributaria',
      'prescricao-e-decadencia',
      'decadencia',
      'extincao-do-credito',
      'denuncia-espontanea',
      'moratoria',
      'suspensao-da-exigibilidade',
      'compensacao-tributaria',
      'remissao',
      'anistia',
      'transacao-tributaria',
      'repeticao-de-indebito',
      'conversao-de-deposito-em-renda',
      'dacao-em-pagamento',
      'prazo-de-prescricao',
      'prescricao-intercorrente',
      'exclusao-do-credito-isencao',
      'parcelamento-tributario',
    ],
  },
  { contentId: 'CT-068', patterns: ['substituicao-tributaria'] },
  { contentId: 'CT-112', patterns: ['planejamento-tributario', 'elisao-fiscal', 'sonegacao-fiscal'] },
];

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
    JSON.stringify({ name: 'apolo-classificar-ct', d1_databases: [{ binding: 'DB', database_name: production.d1, database_id: database.uuid }] }),
  );
  return { d1: production.d1, config: REMOTE_D1_CONFIG, where: '--remote' };
}

await runCli(async () => {
  const { values } = parseArgs({
    args: process.argv.slice(2).filter((arg) => arg !== '--'),
    options: { target: { type: 'string' }, check: { type: 'boolean' } },
  });

  const { wranglerJson, d1Rows, wrangler } = createRunner(process.env);
  const target = requireTarget(values.target);
  const { d1, config, where } = resolveTarget(target, wranglerJson);

  const themeFilter = `theme IN (${SCOPED_THEMES.map(literal).join(', ')})`;

  let totalMatched = 0;
  const statements = [];
  for (const { contentId, patterns } of MAPPING) {
    const likeClause = patterns.map((p) => `content_label_id LIKE '%${p.replace(/'/g, "''")}%'`).join(' OR ');
    const rows = d1Rows(
      [d1, where, '--config', config],
      `SELECT id, content_label_id FROM atlas_question_drafts
       WHERE status = 'pendente' AND content_id IS NULL AND content_label_id IS NOT NULL
         AND ${themeFilter} AND (${likeClause})`,
      `Não consegui ler os rascunhos candidatos a ${contentId} no D1.`,
    );
    console.log(`${contentId}: ${rows.length} rascunho(s) batendo pelos rótulos [${patterns.join(', ')}]`);
    totalMatched += rows.length;
    for (const row of rows) {
      statements.push(
        `UPDATE atlas_question_drafts SET content_id = ${literal(contentId)}, content_label_id = NULL ` +
          `WHERE id = ${literal(row.id)} AND status = 'pendente' AND content_id IS NULL;`,
      );
    }
  }

  console.log(`Total: ${totalMatched} rascunho(s) vão ganhar content_id (compare com o levantamento antes de aplicar).`);

  if (values.check || !statements.length) {
    console.log(values.check ? 'Só --check: nada foi gravado.' : 'Nada para classificar.');
    return;
  }

  const CHUNK_SIZE = 300;
  let written = 0;
  for (let i = 0; i < statements.length; i += CHUNK_SIZE) {
    const chunk = statements.slice(i, i + CHUNK_SIZE);
    writeFileSync(SQL_FILE, `${chunk.join('\n')}\n`);
    try {
      wrangler(['d1', 'execute', d1, where, '--config', config, '--file', SQL_FILE, '--yes'], `Falha ao gravar o lote ${i + 1}-${i + chunk.length}.`);
    } finally {
      writeFileSync(SQL_FILE, '');
    }
    written += chunk.length;
    console.log(`  ${written}/${statements.length}...`);
  }

  console.log(`Pronto: ${written} rascunho(s) classificado(s) com content_id em ${d1}. Nenhum foi aprovado ainda — ` +
    `rode apolo:sugestao-bloom e depois apolo:aprovar-roadmap para aprová-los.`);
});
