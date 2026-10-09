import { env } from 'cloudflare:workers';
import { getApoloPanel } from '@/lib/apolo/index';
import type { D1Like } from '@/lib/pedagogy/transitions';

export const runtime = 'edge';

// GET /api/apolo/painel → painel do banco e do Apolo (APO-22): cobertura por
// tema/conteúdo/Bloom/dificuldade, questões em alerta (APO-10), acervo e
// espaço no R2 (APO-05), ponto do usuário por tema (APO-09) e as últimas
// provas montadas com o motivo de cada questão. Tudo recalculado do
// histórico a cada chamada (DEC-017), sem nenhum estado próprio.
export async function GET() {
  const { DB } = env as unknown as { DB?: D1Like };
  if (!DB) return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
  return Response.json(await getApoloPanel(DB));
}
