import { env } from 'cloudflare:workers';
import { getItemAudit } from '@/lib/apolo/index';
import type { D1Like } from '@/lib/pedagogy/transitions';

export const runtime = 'edge';

// GET /api/apolo/estatisticas → estatística de itens e instrumentos (APO-10,
// DEC-017), recalculada do histórico de tentativas a cada chamada. O corte
// automático de questão alertada roda ao enviar o quiz (app/api/quizzes/[id]),
// não aqui — esta rota só lê.
export async function GET() {
  const { DB } = env as unknown as { DB?: D1Like };
  if (!DB) return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
  return Response.json(await getItemAudit(DB));
}
