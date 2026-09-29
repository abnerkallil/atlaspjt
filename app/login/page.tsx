import { safeNextPath } from '@/lib/auth';

export const metadata = { title: 'Entrar — Atlas' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const message =
    error === 'invalid'
      ? 'Senha incorreta.'
      : error === 'config'
        ? 'Autenticação não configurada neste ambiente.'
        : null;

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <form
        method="post"
        action="/api/auth/login"
        style={{ display: 'grid', gap: 14, width: 'min(360px, 100%)' }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 760, letterSpacing: '.18em' }}>ATLAS</h1>
        <input type="hidden" name="next" value={safeNextPath(next)} />
        <label style={{ display: 'grid', gap: 6, fontSize: 14 }}>
          Senha
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            style={{ padding: '10px 12px', border: '1px solid #ddd9e7', borderRadius: 10 }}
          />
        </label>
        {message && (
          <p role="alert" style={{ color: '#b42318', fontSize: 14, margin: 0 }}>
            {message}
          </p>
        )}
        <button
          type="submit"
          style={{ padding: '10px 14px', border: 0, borderRadius: 10, background: '#2463eb', color: '#fff', cursor: 'pointer' }}
        >
          Entrar
        </button>
      </form>
    </main>
  );
}
