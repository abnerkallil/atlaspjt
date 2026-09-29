import { NextResponse, type NextRequest } from 'next/server';
import { checkSessionToken, createSessionToken, readCookie, sessionCookie, SESSION_COOKIE } from '@/lib/auth';
import { getAuthSecrets } from '@/lib/auth-env';

// DEC-007: ponto único de verificação de sessão, no servidor. Tudo é protegido
// por padrão (falha fechada); só o fluxo de login e assets estáticos são públicos.
const PUBLIC_PATHS = new Set(['/login', '/api/auth/login', '/api/auth/logout', '/favicon.svg', '/og.png']);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  const secrets = getAuthSecrets();
  const session = secrets
    ? await checkSessionToken(
        readCookie(request.headers.get('cookie'), SESSION_COOKIE),
        secrets.sessionSecret,
        Math.floor(Date.now() / 1000),
      )
    : ({ valid: false } as const);

  if (secrets && session.valid) {
    const response = NextResponse.next();
    if (session.renew) {
      const token = await createSessionToken(secrets.sessionSecret, Math.floor(Date.now() / 1000));
      response.headers.append('set-cookie', sessionCookie(token));
    }
    return response;
  }

  if (pathname.startsWith('/api/')) {
    return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  }
  const login = new URL('/login', request.url);
  if (pathname !== '/') login.searchParams.set('next', pathname + request.nextUrl.search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ['/((?!_next/).*)'],
};
