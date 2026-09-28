// Export consolidado de notas e pastas (QUEST-008, Bloco A / DEC-004).
// Somente leitura: chama GET /api/notes e GET /api/notes/folders.
//
// Uso:
//   pnpm run export:data                                  # local (http://localhost:3000)
//   pnpm run export:data -- --url https://seu-site        # produção
//   pnpm run export:data -- --out caminho/arquivo.json    # destino do arquivo
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  args: process.argv.slice(2).filter((arg) => arg !== '--'),
  options: {
    url: { type: 'string', default: 'http://localhost:3000' },
    out: { type: 'string' },
  },
});

const baseUrl = values.url.replace(/\/+$/, '');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outPath = values.out ?? `outputs/atlas-export-${stamp}.json`;

async function fetchList(path, key) {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) {
    throw new Error(`GET ${path} falhou: HTTP ${response.status}`);
  }
  const body = await response.json();
  if (!Array.isArray(body[key])) {
    throw new Error(`GET ${path}: resposta sem a lista "${key}".`);
  }
  return body[key];
}

const notes = await fetchList('/api/notes', 'notes');
const folders = await fetchList('/api/notes/folders', 'folders');

// Contagem conferida contra uma segunda leitura dos mesmos endpoints.
const [notesCheck, foldersCheck] = await Promise.all([
  fetchList('/api/notes', 'notes'),
  fetchList('/api/notes/folders', 'folders'),
]);
if (notesCheck.length !== notes.length || foldersCheck.length !== folders.length) {
  throw new Error(
    'Os dados mudaram durante o export (contagens divergem entre leituras). Rode novamente.',
  );
}

const exportData = {
  format: 'atlas-export',
  version: 1,
  exportedAt: new Date().toISOString(),
  source: baseUrl,
  counts: { notes: notes.length, folders: folders.length },
  notes,
  folders,
};

await mkdir(dirname(outPath), { recursive: true });
await writeFile(outPath, `${JSON.stringify(exportData, null, 2)}\n`, 'utf8');
console.log(
  `Export gravado em ${outPath}: ${notes.length} notas, ${folders.length} pastas.`,
);
