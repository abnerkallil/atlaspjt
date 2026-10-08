import { env } from 'cloudflare:workers';
import type { D1Like } from '@/lib/pedagogy/transitions';
import { adjustItem, agendaErrorResponse, completeItem, isDate, rescheduleItem } from '@/lib/agenda';

export const runtime = 'edge';

type Context = { params: Promise<{ id: string }> };

// PATCH /api/agenda/:id
//   { action: 'concluir' }
//   { action: 'reagendar', hoje, date, time?, reason? }
//   { action: 'ajustar', durationMinutes?, priority? }
export async function PATCH(request: Request, { params }: Context) {
  const db = (env as unknown as { DB?: D1Like }).DB;
  if (!db) return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
  const { id } = await params;
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    if (body.action === 'concluir') return Response.json({ item: await completeItem(db, id) });
    if (body.action === 'reagendar') {
      if (!isDate(body.hoje)) return Response.json({ error: 'Informe a data de hoje.' }, { status: 400 });
      return Response.json({
        item: await rescheduleItem(db, id, { date: body.date, time: body.time, reason: body.reason, today: body.hoje }),
      });
    }
    if (body.action === 'ajustar') {
      return Response.json({ item: await adjustItem(db, id, { durationMinutes: body.durationMinutes, priority: body.priority }) });
    }
    return Response.json({ error: 'Ação inválida.' }, { status: 400 });
  } catch (error) {
    return agendaErrorResponse(error);
  }
}
