import { env } from 'cloudflare:workers';
import type { D1Like } from '@/lib/pedagogy/transitions';
import { addDays, agendaErrorResponse, isDate, listAgenda, syncAgenda } from '@/lib/agenda';

export const runtime = 'edge';

// GET /api/agenda?hoje=AAAA-MM-DD&fuso=180&dias=7 → sincroniza a agenda (DEC-09) e
// as revisões (MVP-06) e devolve os itens de hoje até hoje + dias. "hoje" e
// "fuso" (Date.getTimezoneOffset, em minutos) vêm do navegador.
export async function GET(request: Request) {
  const db = (env as unknown as { DB?: D1Like }).DB;
  if (!db) return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
  const params = new URL(request.url).searchParams;
  const today = params.get('hoje');
  if (!isDate(today)) return Response.json({ error: 'Informe a data de hoje (hoje=AAAA-MM-DD).' }, { status: 400 });
  const days = Math.min(Math.max(Number(params.get('dias') ?? 7) || 7, 0), 31);
  try {
    const fuso = Number(params.get('fuso'));
    await syncAgenda(db, { today, tzOffsetMinutes: Number.isInteger(fuso) && Math.abs(fuso) <= 840 ? fuso : 0 });
    const items = await listAgenda(db, { from: today, to: addDays(today, days) });
    return Response.json({ today, items });
  } catch (error) {
    return agendaErrorResponse(error);
  }
}
