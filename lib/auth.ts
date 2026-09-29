// Autenticação de usuário único (DEC-007): senha verificada contra um hash
// PBKDF2 e sessão em cookie assinado (HMAC-SHA256), stateless. Só Web Crypto,
// compatível com o runtime edge do Worker. Segredos vêm de Worker secrets.

export const SESSION_COOKIE = 'atlas_session';
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;
// Renovação deslizante: o cookie é reemitido quando passou deste intervalo.
export const SESSION_RENEW_AFTER_SECONDS = 24 * 60 * 60;

const PBKDF2_ITERATIONS = 100_000; // teto do Workers runtime
const encoder = new TextEncoder();

export type AuthSecrets = { passwordHash: string; sessionSecret: string };

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array | null {
  try {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  let diff = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i += 1) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
    key,
    256,
  );
  return new Uint8Array(bits);
}

// Formato: pbkdf2-sha256$<iterações>$<salt b64url>$<hash b64url>
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2-sha256$${PBKDF2_ITERATIONS}$${toBase64Url(salt)}$${toBase64Url(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iterations, saltB64, hashB64] = stored.split('$');
  const count = Number(iterations);
  const salt = saltB64 ? fromBase64Url(saltB64) : null;
  const expected = hashB64 ? fromBase64Url(hashB64) : null;
  if (scheme !== 'pbkdf2-sha256' || !Number.isInteger(count) || count < 1 || !salt || !expected) {
    return false;
  }
  return timingSafeEqual(await pbkdf2(password, salt, count), expected);
}

async function hmac(secret: string, message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(message)));
}

// Valor do cookie: v1.<emitido em>.<expira em>.<assinatura>  (segundos Unix)
export async function createSessionToken(secret: string, nowSeconds: number): Promise<string> {
  const payload = `v1.${nowSeconds}.${nowSeconds + SESSION_TTL_SECONDS}`;
  return `${payload}.${toBase64Url(await hmac(secret, payload))}`;
}

export type SessionCheck = { valid: false } | { valid: true; renew: boolean };

export async function checkSessionToken(
  token: string | undefined,
  secret: string,
  nowSeconds: number,
): Promise<SessionCheck> {
  if (!token) return { valid: false };
  const parts = token.split('.');
  if (parts.length !== 4 || parts[0] !== 'v1') return { valid: false };
  const [version, issued, expires, signature] = parts;
  const provided = fromBase64Url(signature);
  if (!provided) return { valid: false };
  const expected = await hmac(secret, `${version}.${issued}.${expires}`);
  if (!timingSafeEqual(provided, expected)) return { valid: false };
  const issuedAt = Number(issued);
  const expiresAt = Number(expires);
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) || expiresAt <= nowSeconds) {
    return { valid: false };
  }
  return { valid: true, renew: nowSeconds - issuedAt >= SESSION_RENEW_AFTER_SECONDS };
}

export function sessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
}

export function clearedSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

export function readCookie(header: string | null, name: string): string | undefined {
  for (const part of (header ?? '').split(';')) {
    const index = part.indexOf('=');
    if (index > 0 && part.slice(0, index).trim() === name) return part.slice(index + 1).trim();
  }
  return undefined;
}

// Só caminhos internos: evita open redirect via ?next=.
export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return '/';
  }
  return value;
}
