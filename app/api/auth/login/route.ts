import { safeNextPath, sessionCookie, createSessionToken, verifyPassword } from '@/lib/auth';
import { getAuthSecrets } from '@/lib/auth-env';

export const runtime = 'edge';

function redirect(request: Request, path: string, cookie?: string) {
  const headers = new Headers({ location: new URL(path, request.url).toString() });
  if (cookie) headers.append('set-cookie', cookie);
  return new Response(null, { status: 303, headers });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const password = form.get('password');
  const next = safeNextPath(typeof form.get('next') === 'string' ? (form.get('next') as string) : null);
  const secrets = getAuthSecrets();

  if (!secrets) return redirect(request, '/login?error=config');

  if (typeof password === 'string' && password && (await verifyPassword(password, secrets.passwordHash))) {
    const token = await createSessionToken(secrets.sessionSecret, Math.floor(Date.now() / 1000));
    return redirect(request, next, sessionCookie(token));
  }

  // Atraso fixo em falhas, para desestimular tentativa e erro em série.
  await new Promise((resolve) => setTimeout(resolve, 750));
  const retry = new URLSearchParams({ error: 'invalid' });
  if (next !== '/') retry.set('next', next);
  return redirect(request, `/login?${retry}`);
}
