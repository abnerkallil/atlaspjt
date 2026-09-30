// Gera os dois valores de Worker secret da autenticação (DEC-007). Nada é gravado
// em disco. Depois de `pnpm run build` e `prepare-own-deploy.mjs`, grave cada
// valor como Worker secret (o `wrangler` pede o valor em prompt, sem eco):
//   npx wrangler secret put ATLAS_PASSWORD_HASH  --config dist/server/wrangler.json
//   npx wrangler secret put ATLAS_SESSION_SECRET --config dist/server/wrangler.json
// Para desenvolvimento local, os mesmos nomes vão em `.dev.vars` (ignorado pelo git).
// Sem os dois secrets o Worker recusa todo acesso (falha fechada).
//
// Uso: node scripts/hash-password.mjs            (pede a senha no terminal)
//      ATLAS_PASSWORD=... node scripts/hash-password.mjs
import { randomBytes, webcrypto } from 'node:crypto';
import { createInterface } from 'node:readline/promises';

const ITERATIONS = 100_000; // teto do Workers runtime; igual a lib/auth.ts
const b64url = (bytes) => Buffer.from(bytes).toString('base64url');

let password = process.env.ATLAS_PASSWORD;
if (!password) {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  password = await rl.question('Senha: ');
  rl.close();
}
if (!password || password.length < 12) throw new Error('Use uma senha com pelo menos 12 caracteres.');

const salt = randomBytes(16);
const key = await webcrypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
const bits = await webcrypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, key, 256);

console.log(`ATLAS_PASSWORD_HASH=pbkdf2-sha256$${ITERATIONS}$${b64url(salt)}$${b64url(new Uint8Array(bits))}`);
console.log(`ATLAS_SESSION_SECRET=${b64url(randomBytes(32))}`);
