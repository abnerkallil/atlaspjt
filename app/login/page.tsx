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
        <details style={{ fontSize: 14, color: '#5b5670' }}>
          <summary style={{ cursor: 'pointer', padding: '4px 0' }}>Esqueci a senha</summary>
          <p style={{ margin: '8px 0 0', lineHeight: 1.5 }}>
            O Atlas tem um único usuário e não envia e-mail de recuperação. A senha é
            redefinida por quem administra a conta Cloudflare do Atlas: gere uma nova com{' '}
            <code>pnpm run auth:secrets</code> e grave os dois valores como Worker secrets. O
            passo a passo está em <code>docs/auth.md</code> no repositório.
          </p>
        </details>
      </form>
    </main>
  );
}
