import { env } from 'cloudflare:workers';
import type { D1Like } from '@/lib/pedagogy/transitions';
import { isDate } from '@/lib/agenda';
import { computeProgress, loadProgressInput } from '@/lib/progress';

export const runtime = 'edge';

// GET /api/progresso?hoje=AAAA-MM-DD&fuso=180 → progresso calculado (MVP-07,
// DEC-02) a partir de estados, quizzes, revisões e sessões. "hoje" e "fuso"
// (Date.getTimezoneOffset) vêm do navegador, para a consistência seguir o dia local.
export async function GET(request: Request) {
  const db = (env as unknown as { DB?: D1Like }).DB;
  if (!db) return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
  const params = new URL(request.url).searchParams;
  const today = params.get('hoje');
  if (!isDate(today)) return Response.json({ error: 'Informe a data de hoje (hoje=AAAA-MM-DD).' }, { status: 400 });
  const fuso = Number(params.get('fuso'));
  try {
    const progress = computeProgress(await loadProgressInput(db), {
      now: new Date().toISOString(),
      today,
      tzOffsetMinutes: Number.isInteger(fuso) && Math.abs(fuso) <= 840 ? fuso : 0,
    });
    return Response.json({ progress });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Não foi possível calcular o progresso.' }, { status: 500 });
  }
}
