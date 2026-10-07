// Executa o wrangler do projeto (e o git) sem shell, para backup.mjs e
// restore-local.mjs. Em falha para com a mensagem do passo, como deploy.mjs.
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const WRANGLER = resolve('node_modules/wrangler/bin/wrangler.js');

export function createRunner(env = process.env) {
  function run(command, args, failure, { capture = false } = {}) {
    const result = spawnSync(command, args, {
      env,
      encoding: capture ? 'utf8' : undefined,
      maxBuffer: 64 * 1024 * 1024,
      // stdin fora do terminal: o wrangler não pergunta nada no meio do backup.
      stdio: capture ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'inherit', 'inherit'],
    });
    if (result.error || result.status !== 0) {
      if (capture) process.stderr.write(`${result.stdout ?? ''}${result.stderr ?? ''}`);
      throw new Error(failure);
    }
    return result.stdout ?? '';
  }

  const wrangler = (args, failure, options) => run(process.execPath, [WRANGLER, ...args], failure, options);

  function wranglerJson(args, failure) {
    const output = wrangler([...args, '--json'], failure, { capture: true });
    try {
      return JSON.parse(output.slice(output.search(/[[{]/)));
    } catch {
      process.stderr.write(output);
      throw new Error(`${failure} (resposta inesperada do wrangler)`);
    }
  }

  // Linhas de um `wrangler d1 execute --command`.
  function d1Rows(args, sql, failure) {
    return wranglerJson(['d1', 'execute', ...args, '--command', sql], failure).flatMap((item) => item.results ?? []);
  }

  return { run, wrangler, wranglerJson, d1Rows };
}
