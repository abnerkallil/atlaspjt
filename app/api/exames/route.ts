import { env } from 'cloudflare:workers';
import {
  listExamAttempts,
  listExamQueue,
  startExameMeio,
} from '@/lib/apolo/exam';
import type { D1Like } from '@/lib/pedagogy/transitions';
import { quizErrorResponse } from '@/lib/quizzes';

export const runtime = 'edge';

function database() {
  return (env as unknown as { DB?: D1Like }).DB;
}

// GET /api/exames → situação do exame de meio de curso por disciplina (já
// sincroniza: dispara `conteudo-50` onde a cobertura chegou a 50%) e
// tentativas. GET /api/exames?disciplina=contabilidade-geral → só as
// tentativas daquela disciplina.
export async function GET(request: Request) {
  const db = database();
  if (!db)
    return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
  try {
    const disciplineId =
      new URL(request.url).searchParams.get('disciplina') ?? undefined;
    const queue = disciplineId ? [] : await listExamQueue(db);
    const attempts = await listExamAttempts(db, { disciplineId });
    return Response.json({ queue, attempts, now: new Date().toISOString() });
  } catch (error) {
    return quizErrorResponse(error);
  }
}

// POST /api/exames { disciplineId, confirmar: true } → começa o exame de meio
// de curso (tentativa única; DEC-03 exige confirmação explícita — sem
// `confirmar: true`, 409 com code 'confirmation' e nada é gravado). Se a
// disciplina já tem tentativa, devolve a mesma.
export async function POST(request: Request) {
  const db = database();
  if (!db)
    return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
  try {
    const body = (await request.json().catch(() => ({}))) as {
      disciplineId?: unknown;
      confirmar?: unknown;
    };
    if (typeof body.disciplineId !== 'string' || !body.disciplineId.trim()) {
      return Response.json({ error: 'Informe a disciplina.' }, { status: 400 });
    }
    const attempt = await startExameMeio(db, body.disciplineId.trim(), {
      confirmed: body.confirmar === true,
    });
    return Response.json(
      { attempt, now: new Date().toISOString() },
      { status: 201 },
    );
  } catch (error) {
    return quizErrorResponse(error);
  }
}
