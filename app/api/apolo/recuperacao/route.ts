import { env } from 'cloudflare:workers';
import { getRecoveryQueue } from '@/lib/apolo/index';
import type { D1Like } from '@/lib/pedagogy/transitions';

export const runtime = 'edge';

// GET /api/apolo/recuperacao → fila de recuperação por questão (APO-15):
// toda questão que já errou alguma vez e ainda não "se formou" (3 acertos em
// sessões diferentes desde o último erro), com a data de vencimento do FSRS
// (APO-09). Recalculada do zero a cada chamada, mesmo princípio do resto do
// Apolo (DEC-017) — esta rota só lê, não aplica nenhum corte.
export async function GET() {
  const { DB } = env as unknown as { DB?: D1Like };
  if (!DB) return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
  return Response.json({ queue: await getRecoveryQueue(DB) });
}
