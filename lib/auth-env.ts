import { env } from 'cloudflare:workers';
import type { AuthSecrets } from '@/lib/auth';

// Worker secrets (`wrangler secret put`). Sem eles a autenticação falha fechada.
export function getAuthSecrets(): AuthSecrets | null {
  const bindings = env as unknown as Record<string, string | undefined>;
  const passwordHash = bindings.ATLAS_PASSWORD_HASH;
  const sessionSecret = bindings.ATLAS_SESSION_SECRET;
  return passwordHash && sessionSecret ? { passwordHash, sessionSecret } : null;
}

// Limite de tentativas de login por IP (Workers Rate Limiting, binding
// LOGIN_RATE_LIMITER). Sem o binding o login segue funcionando, só sem limite.
export async function loginAllowed(request: Request): Promise<boolean> {
  const limiter = (env as unknown as { LOGIN_RATE_LIMITER?: RateLimit }).LOGIN_RATE_LIMITER;
  if (!limiter) return true;
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const { success } = await limiter.limit({ key: `login:${ip}` });
  return success;
}
