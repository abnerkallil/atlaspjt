import { env } from 'cloudflare:workers';
import {
  EXAM_INSTRUMENT,
  isDisciplineInstrument,
  listExamAttempts,
  listExamQueue,
  startExameMeio,
} from '@/lib/apolo/exam';
import {
  getFinalActivityGrade,
  startAtividadeFinal,
  startRecuperacao,
} from '@/lib/apolo/final';
import type { D1Like } from '@/lib/pedagogy/transitions';
import { quizErrorResponse } from '@/lib/quizzes';

export const runtime = 'edge';

function database() {
  return (env as unknown as { DB?: D1Like }).DB;
}

// GET /api/exames → situação das provas por disciplina (já sincroniza:
// dispara `conteudo-50` onde a cobertura chegou a 50% e `conteudo-100` onde
// chegou a 100% com todas as atividades aprovadas) e tentativas.
// GET /api/exames?disciplina=contabilidade-geral → só as tentativas daquela
// disciplina e as notas (exame de meio, atividade final e recuperação
// ajustadas, e a que vale — APO-19).
export async function GET(request: Request) {
  const db = database();
  if (!db)
    return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
  try {
    const disciplineId =
      new URL(request.url).searchParams.get('disciplina') ?? undefined;
    const queue = disciplineId ? [] : await listExamQueue(db);
    const attempts = await listExamAttempts(db, { disciplineId });
    const grade = disciplineId
      ? await getFinalActivityGrade(db, disciplineId)
      : null;
    return Response.json({
      queue,
      attempts,
      ...(grade ? { grade } : {}),
      now: new Date().toISOString(),
    });
  } catch (error) {
    return quizErrorResponse(error);
  }
}

// POST /api/exames { disciplineId, instrument?, confirmar: true } → começa a
// prova da disciplina: `exame_meio` (padrão, APO-18), `atividade_final` ou
// `recuperacao` (APO-19). Tentativa única de cada uma; DEC-03 exige
// confirmação explícita — sem `confirmar: true`, 409 com code
// 'confirmation' e nada é gravado. Se a tentativa já existe, devolve a mesma.
export async function POST(request: Request) {
  const db = database();
  if (!db)
    return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
  try {
    const body = (await request.json().catch(() => ({}))) as {
      disciplineId?: unknown;
      instrument?: unknown;
      confirmar?: unknown;
    };
    if (typeof body.disciplineId !== 'string' || !body.disciplineId.trim()) {
      return Response.json({ error: 'Informe a disciplina.' }, { status: 400 });
    }
    const instrument = body.instrument ?? EXAM_INSTRUMENT;
    if (!isDisciplineInstrument(instrument)) {
      return Response.json(
        {
          error:
            'Instrumento inválido: use exame_meio, atividade_final ou recuperacao.',
        },
        { status: 400 },
      );
    }
    const options = { confirmed: body.confirmar === true };
    const disciplineId = body.disciplineId.trim();
    const attempt =
      instrument === 'atividade_final'
        ? await startAtividadeFinal(db, disciplineId, options)
        : instrument === 'recuperacao'
          ? await startRecuperacao(db, disciplineId, options)
          : await startExameMeio(db, disciplineId, options);
    return Response.json(
      { attempt, now: new Date().toISOString() },
      { status: 201 },
    );
  } catch (error) {
    return quizErrorResponse(error);
  }
}
