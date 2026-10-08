import { env } from 'cloudflare:workers';
import { getStudentProfile } from '@/lib/apolo/index';
import type { D1Like } from '@/lib/pedagogy/transitions';

export const runtime = 'edge';

// GET /api/apolo/perfil → habilidade Elo por tema/conteúdo/subtópico e fila de
// recuperação por questão (APO-09, DEC-017), recalculadas do histórico de
// tentativas a cada chamada.
export async function GET() {
  const { DB } = env as unknown as { DB?: D1Like };
  if (!DB) return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
  return Response.json(await getStudentProfile(DB));
}
