import { env } from 'cloudflare:workers';
import type { AuthSecrets } from '@/lib/auth';

// Worker secrets (`wrangler secret put`). Sem eles a autenticação falha fechada.
export function getAuthSecrets(): AuthSecrets | null {
  const bindings = env as unknown as Record<string, string | undefined>;
  const passwordHash = bindings.ATLAS_PASSWORD_HASH;
  const sessionSecret = bindings.ATLAS_SESSION_SECRET;
  return passwordHash && sessionSecret ? { passwordHash, sessionSecret } : null;
}
