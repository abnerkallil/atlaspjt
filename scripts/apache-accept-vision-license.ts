// APA-16 (operacional): aceite da licença do @cf/meta/llama-3.2-11b-vision-instruct
// (gated model, precisa ser aceita uma vez por conta antes do binding `AI`
// funcionar com ele -- APA-11, OCR de letra de mão). Igual ao
// scripts/apache-bakeoff.ts: `getPlatformProxy` do pacote `wrangler` pega um
// binding `AI` remoto de verdade, autenticado com o MESMO login (wrangler
// OAuth) que o `wrangler d1 execute --remote` do Publicar Atlas já usa --
// nenhum API Token manual, nenhum Account ID para preencher (ver
// docs/APACHE.md, seção "O que o Abner precisa fazer").
//
// Uso (só precisa estar logado no wrangler -- `pnpm wrangler login`):
//   pnpm run apache:aceitar-licenca-visao
import { mkdirSync, writeFileSync } from 'node:fs';
import { getPlatformProxy } from 'wrangler';
import type { AiLike } from '../lib/apache/lesson-writer.js';
import { isVisionLicenseAcceptedError, VISION_LICENSE_ACCEPTED_CODE } from '../lib/apache/vision-license.js';

const CONFIG_PATH = '.wrangler/apache-accept-vision-license-config.json';
const MODEL_ID = '@cf/meta/llama-3.2-11b-vision-instruct';

function ensureConfig(): void {
  mkdirSync('.wrangler', { recursive: true });
  writeFileSync(
    CONFIG_PATH,
    JSON.stringify({
      name: 'apache-accept-vision-license',
      compatibility_date: '2026-05-15',
      compatibility_flags: ['nodejs_compat'],
      ai: { binding: 'AI' },
    }),
  );
}

async function main(): Promise<void> {
  ensureConfig();
  const proxy = await getPlatformProxy<{ AI: AiLike }>({ configPath: CONFIG_PATH, persist: false });
  try {
    // `{ prompt: 'agree' }` é o mecanismo documentado da Cloudflare para
    // aceitar a licença de um modelo gated -- a mesma chamada que o curl
    // direto na REST API faria, só que autenticada pelo login do wrangler
    // em vez de um token manual.
    const result = await proxy.env.AI.run(MODEL_ID, { prompt: 'agree' });
    console.log(`Licença de "${MODEL_ID}" aceita (ou já estava). Resposta:`);
    console.log(JSON.stringify(result));
  } catch (error) {
    // A Cloudflare sinaliza o aceite de um modelo gated lançando uma
    // "rejeição" cujo código é 5016 e cuja mensagem já é a confirmação do
    // aceite ("Thank you for agreeing to the usage terms...") -- não é uma
    // falha real (confirmado rodando o comando de verdade). Ver
    // lib/apache/vision-license.ts.
    if (isVisionLicenseAcceptedError(error)) {
      console.log(`Licença de "${MODEL_ID}" aceita (Cloudflare confirmou pelo código ${VISION_LICENSE_ACCEPTED_CODE}, que é sucesso, não erro).`);
    } else {
      throw error;
    }
  } finally {
    try {
      await proxy.dispose();
    } catch (error) {
      // Mesmo aviso de teardown do scripts/apache-bakeoff.ts no Windows --
      // não é falha da chamada em si.
      console.warn(`Aviso: erro ao encerrar a sessão do proxy remoto (ignorado): ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Falha ao aceitar a licença:', error);
    process.exit(1);
  });
