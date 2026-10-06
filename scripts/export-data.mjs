// Export consolidado de notas e pastas (QUEST-008, Bloco A / DEC-004).
// Somente leitura: chama GET /api/notes e GET /api/notes/folders.
//
// DEC-009: o ambiente é sempre explícito. `--target local` lê o servidor de dev
// (padrão http://localhost:3000); `--target production` exige `--url`.
// DEC-007: a API exige sessão. A senha vem de ATLAS_EXPORT_PASSWORD no ambiente
// do terminal (nunca de `.dev.vars`) e é usada só para abrir a sessão do export.
//
// Uso:
//   ATLAS_EXPORT_PASSWORD=... pnpm run export:data -- --target local
//   ATLAS_EXPORT_PASSWORD=... pnpm run export:data -- --target production --url https://seu-site
//   ... --out caminho/arquivo.json                        # destino do arquivo
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { parseArgs } from 'node:util';
import { requireOption, requireTarget, runCli } from './lib/target-env.mjs';

const { values } = parseArgs({
  args: process.argv.slice(2).filter((arg) => arg !== '--'),
  options: {
    target: { type: 'string' },
    url: { type: 'string' },
    out: { type: 'string' },
  },
});

let target;
let url;
await runCli(() => {
  target = requireTarget(values.target);
  url = target === 'production' ? requireOption(values, 'url', 'o endereço de produção') : (values.url ?? 'http://localhost:3000');
  if (!process.env.ATLAS_EXPORT_PASSWORD) {
    throw new Error('Defina ATLAS_EXPORT_PASSWORD com a senha do Atlas desse ambiente.');
  }
});

const baseUrl = url.replace(/\/+$/, '');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outPath = values.out ?? `outputs/atlas-export-${stamp}.json`;

async function openSession() {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    body: new URLSearchParams({ password: process.env.ATLAS_EXPORT_PASSWORD ?? '' }),
    redirect: 'manual',
  });
  const cookie = response.headers.get('set-cookie')?.split(';')[0];
  if (!cookie) throw new Error(`Login recusado em ${baseUrl} (senha incorreta ou servidor sem secrets).`);
  return cookie;
}

await runCli(async () => {
  const cookie = await openSession();

  async function fetchList(path, key) {
    const response = await fetch(`${baseUrl}${path}`, { headers: { cookie } });
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
    target,
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
});
