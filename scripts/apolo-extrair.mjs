// Extrator determinístico de questões (APO-06): lê um PDF do acervo de fontes
// (APO-05) ou um arquivo local, tira o texto com unpdf e corta em rascunhos
// de questão por regra (scripts/lib/extractor.mjs) — nunca IA (DEC-014).
// Não grava nada no D1: o resultado é um JSON de rascunhos para a curadoria
// (APO-07) revisar antes de qualquer questão virar prova de verdade.
//
// DEC-009: o ambiente vem de --target a cada execução, sem default (só
// necessário com --fonte, que baixa o PDF do R2).
//
// Uso:
//   pnpm run apolo:extrair -- --file prova.pdf --formato cebraspe --gabarito gabarito.txt
//   pnpm run apolo:extrair -- --target local --fonte <id-da-fonte> --saida rascunhos.json
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { cleanText, detectFormat, extractQuestions, parseGabarito } from './lib/extractor.mjs';
import { requireOption, requireTarget, runCli } from './lib/target-env.mjs';
import { createRunner } from './lib/wrangler-cli.mjs';

const LOCAL_CONFIG = 'deploy.local.json';
const REMOTE_D1_CONFIG = '.wrangler/apolo-extrair-d1.json';
const LOCAL = { d1: 'site-creator-d1', bucket: 'site-creator-r2', config: 'wrangler.local.jsonc' };
const FORMATS = ['cebraspe', 'alternativas', 'generico'];

async function readPdfText(path) {
  const { extractText } = await import('unpdf');
  const bytes = new Uint8Array(readFileSync(path));
  const { text, totalPages } = await extractText(bytes, { mergePages: true });
  return { text, totalPages };
}

// d1/r2 do alvo: o R2 usa o nome do bucket direto (sem --config); o D1 exige
// um arquivo com o id real do banco, resolvido via "wrangler d1 list".
function resolveTarget(target, wranglerJson) {
  if (target !== 'production') return { d1: LOCAL.d1, bucket: LOCAL.bucket, config: LOCAL.config, where: '--local' };
  if (!existsSync(LOCAL_CONFIG)) throw new Error(`Arquivo ${LOCAL_CONFIG} não encontrado (veja deploy.example.json).`);
  const production = JSON.parse(readFileSync(LOCAL_CONFIG, 'utf8')).production;
  for (const key of ['d1', 'bucket']) {
    if (!production?.[key] || String(production[key]).startsWith('<')) {
      throw new Error(`Preencha "production.${key}" em ${LOCAL_CONFIG} com o nome real.`);
    }
  }
  const database = wranglerJson(['d1', 'list'], 'Não consegui listar os D1. Rode "npx wrangler login".').find(
    (item) => item.name === production.d1,
  );
  if (!database) throw new Error(`O D1 "${production.d1}" não existe nesta conta Cloudflare.`);
  writeFileSync(
    REMOTE_D1_CONFIG,
    JSON.stringify({ name: 'apolo-extrair', d1_databases: [{ binding: 'DB', database_name: production.d1, database_id: database.uuid }] }),
  );
  return { d1: production.d1, bucket: production.bucket, config: REMOTE_D1_CONFIG, where: '--remote' };
}

await runCli(async () => {
  const { values } = parseArgs({
    args: process.argv.slice(2).filter((arg) => arg !== '--'),
    options: {
      target: { type: 'string' },
      file: { type: 'string' },
      fonte: { type: 'string' },
      formato: { type: 'string' },
      gabarito: { type: 'string' },
      saida: { type: 'string' },
    },
  });
  if (values.formato && !FORMATS.includes(values.formato)) {
    throw new Error(`--formato "${values.formato}" inválido. Use: ${FORMATS.join(', ')}.`);
  }

  let pdfPath = values.file;
  let cleanupDir = null;
  if (!pdfPath) {
    const fonteId = requireOption(values, 'fonte', 'o id da fonte (ou use --file para um PDF local)');
    const target = requireTarget(values.target);
    const { wrangler, wranglerJson, d1Rows } = createRunner(process.env);
    const { d1, bucket, config, where } = resolveTarget(target, wranglerJson);
    const rows = d1Rows(
      [d1, where, '--config', config],
      `SELECT object_key, title FROM atlas_question_sources WHERE id = '${fonteId.replace(/'/g, "''")}'`,
      'Não consegui consultar a fonte no D1.',
    );
    const row = rows[0];
    if (!row) throw new Error(`Fonte "${fonteId}" não encontrada.`);
    cleanupDir = mkdtempSync(join(tmpdir(), 'apolo-extrair-'));
    pdfPath = join(cleanupDir, 'fonte.pdf');
    console.log(`Baixando "${row.title}" do R2...`);
    wrangler(['r2', 'object', 'get', `${bucket}/${row.object_key}`, where, '--file', pdfPath], 'Falha ao baixar o PDF do R2.', {
      capture: true,
    });
  }
  if (!existsSync(pdfPath)) throw new Error(`Arquivo não encontrado: ${pdfPath}`);

  try {
    console.log(`Lendo ${pdfPath}...`);
    const { text, totalPages } = await readPdfText(pdfPath);
    console.log(`${totalPages} página(s) de texto extraídas.`);

    const format = values.formato ?? detectFormat(cleanText(text));
    const gabarito = values.gabarito ? parseGabarito(readFileSync(values.gabarito, 'utf8'), format) : new Map();
    const result = extractQuestions(text, { format, gabarito });

    console.log(`Formato: ${result.format}.`);
    console.log(`${result.drafts.length} rascunho(s) cortado(s) automaticamente, ${result.manual.length} manual(is), ${result.voided} anulada(s).`);
    for (const line of result.report) console.log(`  ${line}`);

    const output = values.saida ?? '.wrangler/apolo-rascunhos.json';
    writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
    console.log(`Rascunhos gravados em ${output} — revise na curadoria antes de importar.`);
  } finally {
    if (cleanupDir) rmSync(cleanupDir, { recursive: true, force: true });
  }
});
