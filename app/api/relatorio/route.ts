import { env } from 'cloudflare:workers';
import { isDate } from '@/lib/agenda';
import type { D1Like } from '@/lib/pedagogy/transitions';
import { contentReport } from '@/lib/reports';

export const runtime = 'edge';

// GET /api/relatorio?conteudo=CG-001&hoje=AAAA-MM-DD&fuso=180 → relatório
// explicável do conteúdo (MVP-09): origem da nota, mudanças de estado, risco,
// próxima ação e histórico.
export async function GET(request: Request) {
  const db = (env as unknown as { DB?: D1Like }).DB;
  if (!db) return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
  const params = new URL(request.url).searchParams;
  const contentId = params.get('conteudo')?.trim();
  const today = params.get('hoje');
  if (!contentId) return Response.json({ error: 'Informe o conteúdo.' }, { status: 400 });
  if (!isDate(today)) return Response.json({ error: 'Informe a data de hoje (hoje=AAAA-MM-DD).' }, { status: 400 });
  const fuso = Number(params.get('fuso'));
  try {
    const report = await contentReport(db, contentId, {
      today,
      tzOffsetMinutes: Number.isInteger(fuso) && Math.abs(fuso) <= 840 ? fuso : 0,
    });
    if (!report) return Response.json({ error: 'Conteúdo não encontrado.' }, { status: 404 });
    return Response.json({ report });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Não foi possível montar o relatório.' }, { status: 500 });
  }
}
