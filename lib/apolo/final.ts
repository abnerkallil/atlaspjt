// Atividade final e recuperação (APO-19, DEC-016/DEC-018). Provas por
// DISCIPLINA, gravadas na mesma tabela do exame de meio de curso
// (`atlas_exam_attempts`, APO-18) — uma linha por instrumento
// (`atividade_final`, `recuperacao`), o mesmo índice único garante tentativa
// única de cada uma. Montagem, gravação, correção e KR-20 são as do exame
// (`lib/apolo/exam.ts`); o que é só destas duas mora aqui:
//
// - escopo: a disciplina inteira (todos os conteúdos, sem recorte por nível);
// - tempo: 90 s por questão COM rolagem da sobra para a questão seguinte
//   (`rolloverTiming`), medida pelo relógio do servidor questão a questão
//   (`answerFinalQuestion`, na ordem da prova);
// - cascata da atividade final: nota ajustada = nota bruta × (1 − erro do
//   exame de meio), sem piso nem teto além do natural (confirmado pelo
//   Abner: limitar quebraria o propósito — quem foi mal no exame de meio não
//   pode gabaritar o conteúdo só com a avaliação final);
// - recuperação (modelo "faculdade", confirmado pelo Abner 2026-10-09): NÃO
//   aplica a cascata de novo sobre a própria nota bruta. Resgata só os
//   pontos que a cascata cortou da atividade final: `removido = bruta da
//   atividade final − ajustada da atividade final`; `ajustada da
//   recuperação = ajustada da atividade final + (bruta da recuperação / 100)
//   × removido`. No máximo (recuperação 100%) a nota volta à bruta ORIGINAL
//   da atividade final — nunca à do exame de meio, que não é teto da
//   recuperação, só da atividade final. Vale a maior nota ajustada das duas
//   (`effectiveFinalActivity`, lib/progress.ts) — como a recuperação nunca
//   fica abaixo da atividade final por construção, na prática é sempre ela
//   quando existe; só depois de atividade final insatisfatória (nota
//   ajustada abaixo do corte).
//
// FSM existente (`lib/pedagogy/states.ts`, DEC-03), nenhuma transição nova
// (DEC-018): `conteudo-100` (sistema, em `syncDisciplineState`) →
// `iniciar-atividade-final` (confirmação) → `atividade-final-aprovada` |
// `atividade-final-insatisfatoria` (sistema, pela nota ajustada) →
// `iniciar-recuperacao` (confirmação) → `recuperacao-entregue` (sistema).
import { applyTransition, currentState, planTransition, type D1Like } from '../pedagogy/transitions.js';
import { effectiveFinalActivity } from '../progress.js';
import { QuizError, sanitizeAnswers, type Answers } from '../quizzes.js';
import { APOLO_CORRECTOR_VERSION, buildBoletim, type Boletim, type BoletimCascade } from './corrector.js';
import {
  EXAM_INSTRUMENT,
  FINAL_INSTRUMENT,
  RECOVERY_INSTRUMENT,
  applyIgnoringConflict,
  buildExamQuestions,
  disciplineContents,
  examReliability,
  examRow,
  existingAttemptId,
  getExamAttempt,
  gradeExamAnswers,
  hasRollover,
  insertExamAttempt,
  modelAnswersOf,
  parseJson,
  rolloverTiming,
  syncDisciplineState,
  type ExamAttempt,
  type ExamRow,
  type ExamScope,
  type QuestionTiming,
  type StoredExamQuestions,
  type StoredExamResult,
} from './exam.js';
import { resolvePlan } from './plans.js';

export type FinalInstrument = typeof FINAL_INSTRUMENT | typeof RECOVERY_INSTRUMENT;

// ---------------------------------------------------------------------------
// Regras puras
// ---------------------------------------------------------------------------

// Escopo da atividade final e da recuperação: a disciplina inteira, pela
// ordem do roadmap.
export function resolveFinalScope(contents: { id: string; position: number }[]): ExamScope {
  const ordered = [...contents].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
  return {
    rule: 'disciplina',
    levels: null,
    contentIds: ordered.map((content) => content.id),
    totalContents: ordered.length,
  };
}

const round1 = (value: number) => Math.round(value * 10) / 10;

// Cascata (APO-19): `ajustada = bruta × (1 − erro do exame de meio)`, com
// `erro = 1 − nota do exame de meio / 100`. Ex.: 33% de erro no exame de
// meio (nota 67) corta 33% da nota da atividade final — 90 vira 60,3. Sem
// piso nem teto além do natural (erro entre 0 e 100% → ajustada entre 0 e a
// bruta), por decisão explícita do Abner. Mesmo arredondamento do corretor
// (uma casa decimal, `scoreResults`).
export function applyMidtermCascade(
  rawScore: number,
  midterm: { attemptId: string; score: number },
): BoletimCascade {
  const midtermError = 1 - midterm.score / 100;
  return {
    rawScore,
    midtermAttemptId: midterm.attemptId,
    midtermScore: midterm.score,
    midtermErrorPercent: round1(midtermError * 100),
    adjustedScore: round1(rawScore * (1 - midtermError)),
  };
}

// Recuperação (APO-19, modelo "faculdade" confirmado pelo Abner): resgate
// aditivo, não uma segunda cascata. `removido` é o quanto a cascata da
// atividade final cortou (bruta − ajustada); a recuperação devolve a fração
// proporcional ao seu próprio aproveitamento. Ex.: exame de meio 50% →
// removido = metade da nota bruta da atividade final; recuperação 100% →
// devolve o removido inteiro, voltando à nota bruta ORIGINAL da atividade
// final (nunca à do exame de meio — que não é teto da recuperação, só da
// atividade final). Mesmo arredondamento do corretor (uma casa decimal).
export function applyRecoveryBuyback(
  recoveryRawScore: number,
  finalActivity: { rawScore: number; adjustedScore: number },
  midterm: { attemptId: string; score: number },
): BoletimCascade {
  const midtermError = 1 - midterm.score / 100;
  const removedAmount = round1(finalActivity.rawScore - finalActivity.adjustedScore);
  const recoveryContribution = round1((recoveryRawScore / 100) * removedAmount);
  return {
    rawScore: recoveryRawScore,
    midtermAttemptId: midterm.attemptId,
    midtermScore: midterm.score,
    midtermErrorPercent: round1(midtermError * 100),
    adjustedScore: round1(finalActivity.adjustedScore + recoveryContribution),
    removedAmount,
    recoveryContribution,
  };
}

// ---------------------------------------------------------------------------
// D1
// ---------------------------------------------------------------------------

const FLOW: Record<
  FinalInstrument,
  { label: string; released: string; running: string; startEvent: string }
> = {
  atividade_final: {
    label: 'atividade final',
    released: 'atividade-final-liberada',
    running: 'atividade-final-em-curso',
    startEvent: 'iniciar-atividade-final',
  },
  recuperacao: {
    label: 'recuperação',
    released: 'recuperacao-liberada',
    running: 'recuperacao-em-curso',
    startEvent: 'iniciar-recuperacao',
  },
};

const BEFORE_FINAL = new Set(['em-andamento', 'exame-meio-liberado', 'exame-meio-em-curso', 'exame-meio-concluido']);

function notReleasedMessage(instrument: FinalInstrument, state: string): string {
  if (instrument === FINAL_INSTRUMENT) {
    return BEFORE_FINAL.has(state)
      ? 'A atividade final é liberada depois do exame de meio de curso entregue, com 100% dos conteúdos concluídos e todas as atividades aprovadas.'
      : 'A atividade final desta disciplina já foi encerrada.';
  }
  return state === 'concluida'
    ? 'A disciplina já foi concluída: a recuperação só existe depois de uma atividade final insatisfatória, e uma vez só.'
    : 'A recuperação é liberada só depois de uma atividade final insatisfatória.';
}

// Inicia a atividade final ou a recuperação (tentativa única de cada uma).
// Mesmo padrão do `startExameMeio`: sem `confirmed: true`, TransitionError
// 'confirmation' (409) antes de qualquer escrita; tentativa já existente é
// devolvida sem nova transição; corrida resolvida pelo índice único.
async function startFinalInstrument(
  db: D1Like,
  disciplineId: string,
  instrument: FinalInstrument,
  options: { confirmed?: boolean; now?: string; id?: string },
): Promise<ExamAttempt> {
  const now = options.now ?? new Date().toISOString();
  const flow = FLOW[instrument];
  const existing = await existingAttemptId(db, disciplineId, instrument);
  if (existing) return (await getExamAttempt(db, existing))!;

  const { state } = await syncDisciplineState(db, disciplineId, { now });
  // Reparo: estado já em curso sem tentativa gravada.
  const alreadyStarted = state === flow.running;
  if (!alreadyStarted && state !== flow.released) {
    throw new QuizError(notReleasedMessage(instrument, state), 409);
  }
  const id = options.id ?? crypto.randomUUID();
  const transition = {
    entityType: 'disciplina' as const,
    entityId: disciplineId,
    event: flow.startEvent,
    actor: 'usuario' as const,
    confirmed: options.confirmed === true,
    reason: `Iniciou a ${flow.label} (tentativa única), com confirmação explícita.`,
  };
  if (!alreadyStarted) planTransition(transition, state, now, id);

  const scope = resolveFinalScope(await disciplineContents(db, disciplineId));
  if (scope.contentIds.length === 0) throw new QuizError('Esta disciplina ainda não tem conteúdos.', 409);
  const plan = resolvePlan(instrument);
  // A recuperação tenta não repetir as questões da atividade final (só
  // prioridade do seletor: sem banco para completar, elas voltam).
  let recentlySeen: string[] = [];
  if (instrument === RECOVERY_INSTRUMENT) {
    const finalId = await existingAttemptId(db, disciplineId, FINAL_INSTRUMENT);
    const finalRow = finalId ? await examRow(db, finalId) : null;
    recentlySeen = finalRow ? (parseJson<StoredExamQuestions>(finalRow.questions_json)?.questionIds ?? []) : [];
  }
  const { chosen, warnings, reasons } = await buildExamQuestions(db, scope, plan, id, now, { recentlySeen });
  if (!alreadyStarted) await applyTransition(db, transition, { now });
  return insertExamAttempt(db, { id, disciplineId, instrument, scope, plan, chosen, warnings, reasons, now });
}

export function startAtividadeFinal(
  db: D1Like,
  disciplineId: string,
  options: { confirmed?: boolean; now?: string; id?: string } = {},
): Promise<ExamAttempt> {
  return startFinalInstrument(db, disciplineId, FINAL_INSTRUMENT, options);
}

export function startRecuperacao(
  db: D1Like,
  disciplineId: string,
  options: { confirmed?: boolean; now?: string; id?: string } = {},
): Promise<ExamAttempt> {
  return startFinalInstrument(db, disciplineId, RECOVERY_INSTRUMENT, options);
}

function assertRollover(row: ExamRow) {
  if (!hasRollover(row.instrument)) {
    throw new QuizError('Esta tentativa não é de atividade final nem de recuperação.', 409);
  }
}

function timedQuestions(row: ExamRow) {
  const stored = parseJson<StoredExamQuestions>(row.questions_json);
  return {
    ids: stored?.questionIds ?? [],
    questions: (stored?.questions ?? []).map((question) => ({ id: question.id, seconds: question.seconds })),
  };
}

// Responde UMA questão, a da vez (a primeira ainda sem resposta, na ordem da
// prova), e grava o momento pelo relógio do servidor — é daí que sai o
// tempo gasto em cada questão e a sobra que rola para a seguinte. Sem
// voltar: questão já respondida não muda. Resposta em branco vale (pula a
// questão, o tempo conta do mesmo jeito). Atrasar não recusa a resposta, só
// marca `late` (mesma regra do quiz).
export async function answerFinalQuestion(
  db: D1Like,
  attemptId: string,
  questionId: unknown,
  rawAnswer: unknown,
  options: { now?: string } = {},
): Promise<ExamAttempt> {
  const now = options.now ?? new Date().toISOString();
  const row = await examRow(db, attemptId);
  assertRollover(row);
  if (row.status !== 'em-andamento') throw new QuizError('As respostas desta tentativa já foram travadas.', 409);
  const { ids } = timedQuestions(row);
  const result = parseJson<StoredExamResult>(row.result_json) ?? {};
  const answeredAt = { ...result.answeredAt };
  const index = ids.findIndex((id) => !(id in answeredAt));
  if (index < 0) throw new QuizError('Todas as questões já foram respondidas; falta travar ou enviar.', 409);
  if (questionId !== ids[index]) {
    throw new QuizError(`Responda na ordem: a questão da vez é a ${index + 1}ª.`, 409);
  }
  const answers = parseJson<Answers>(row.answers_json) ?? {};
  const answer = sanitizeAnswers({ [ids[index]]: rawAnswer }, new Set([ids[index]]))[ids[index]];
  if (answer) answers[ids[index]] = answer;
  answeredAt[ids[index]] = now;
  const [updated] = await db.batch([
    db
      .prepare(
        `UPDATE atlas_exam_attempts SET answers_json = ?2, result_json = ?3
         WHERE id = ?1 AND status = 'em-andamento' AND COALESCE(result_json, '') = ?4`,
      )
      .bind(attemptId, JSON.stringify(answers), JSON.stringify({ ...result, answeredAt }), row.result_json ?? ''),
  ]);
  if (!updated || updated.meta.changes !== 1) {
    throw new QuizError('A tentativa mudou durante a operação. Tente de novo.', 409);
  }
  return (await getExamAttempt(db, attemptId))!;
}

// Fecha as respostas (na trava ou no envio direto): o que já foi respondido
// questão a questão vale como gravado (não volta); o resto entra agora, com
// o relógio de agora. Daí sai o tempo com rolagem e o `late` da tentativa.
function closeAnswers(
  row: ExamRow,
  rawAnswers: unknown,
  now: string,
): { answers: Answers; answeredAt: Record<string, string>; timing: QuestionTiming[]; late: boolean } {
  const { ids, questions } = timedQuestions(row);
  const recorded = parseJson<StoredExamResult>(row.result_json)?.answeredAt ?? {};
  const previous = parseJson<Answers>(row.answers_json) ?? {};
  const incoming = sanitizeAnswers(rawAnswers, new Set(ids));
  const answers: Answers = {};
  const answeredAt: Record<string, string> = {};
  for (const id of ids) {
    if (id in recorded) {
      answeredAt[id] = recorded[id];
      if (previous[id]) answers[id] = previous[id];
    } else {
      answeredAt[id] = now;
      if (incoming[id]) answers[id] = incoming[id];
    }
  }
  const timing = rolloverTiming(questions, row.started_at, answeredAt);
  return { answers, answeredAt, timing, late: timing.some((item) => item.late) };
}

// Trava as respostas e libera o gabarito das dissertativas (DEC-04), como
// `lockExam`, fechando o tempo com rolagem.
export async function lockFinal(
  db: D1Like,
  attemptId: string,
  rawAnswers: unknown,
  options: { now?: string } = {},
): Promise<ExamAttempt> {
  const now = options.now ?? new Date().toISOString();
  const row = await examRow(db, attemptId);
  assertRollover(row);
  if (row.status !== 'em-andamento') throw new QuizError('As respostas desta tentativa já foram travadas.', 409);
  const { ids } = timedQuestions(row);
  const { answers, answeredAt, timing, late } = closeAnswers(row, rawAnswers, now);
  const modelAnswers = await modelAnswersOf(db, ids);
  const [result] = await db.batch([
    db
      .prepare(
        `UPDATE atlas_exam_attempts SET status = 'autoavaliacao', answers_json = ?2, result_json = ?3
         WHERE id = ?1 AND status = 'em-andamento' AND COALESCE(result_json, '') = ?4`,
      )
      .bind(
        attemptId,
        JSON.stringify(answers),
        JSON.stringify({ lockedAt: now, late, modelAnswers, answeredAt, timing }),
        row.result_json ?? '',
      ),
  ]);
  if (!result || result.meta.changes !== 1) throw new QuizError('As respostas desta tentativa já foram travadas.', 409);
  return (await getExamAttempt(db, attemptId))!;
}

// Nota do exame de meio de curso entregue da disciplina — a base da cascata.
async function midtermOf(db: D1Like, disciplineId: string): Promise<{ attemptId: string; score: number }> {
  const row = await db
    .prepare(
      `SELECT id, score FROM atlas_exam_attempts
       WHERE discipline_id = ?1 AND instrument = ?2 AND status = 'enviado' AND score IS NOT NULL`,
    )
    .bind(disciplineId, EXAM_INSTRUMENT)
    .first<{ id: string; score: number }>();
  if (!row) {
    throw new QuizError('Exame de meio de curso entregue não encontrado: sem ele não há como aplicar a cascata.', 409);
  }
  return { attemptId: row.id, score: Number(row.score) };
}

// Atividade final entregue da disciplina — a base do resgate da
// recuperação (bruta e ajustada, lidas do boletim já gravado, DEC-016: sem
// recorrigir nada, só reler o que já foi emitido).
async function finalActivityOf(db: D1Like, disciplineId: string): Promise<{ rawScore: number; adjustedScore: number }> {
  const row = await db
    .prepare(
      `SELECT result_json FROM atlas_exam_attempts
       WHERE discipline_id = ?1 AND instrument = ?2 AND status = 'enviado'`,
    )
    .bind(disciplineId, FINAL_INSTRUMENT)
    .first<{ result_json: string | null }>();
  const cascade = row ? parseJson<StoredExamResult>(row.result_json)?.boletim?.cascade : null;
  if (!cascade) {
    throw new QuizError('Atividade final entregue não encontrada: sem ela não há o que resgatar na recuperação.', 409);
  }
  return { rawScore: cascade.rawScore, adjustedScore: cascade.adjustedScore };
}

// Envio: corrige (corretor único, APO-13), aplica a cascata do exame de meio
// (atividade final) ou o resgate aditivo da atividade final (recuperação),
// grava resultado e boletim uma única vez (DEC-016) — com a nota bruta e as
// bases usadas, para o boletim continuar reconstituível sem reler outras
// tentativas — e dispara o evento da FSM: atividade final →
// `atividade-final-aprovada` (ajustada >= corte) ou
// `atividade-final-insatisfatoria`; recuperação → `recuperacao-entregue`
// (sempre: fim da cadeia, vale a maior nota).
export async function submitFinal(
  db: D1Like,
  attemptId: string,
  payload: { answers?: unknown; selfAssessments?: unknown },
  options: { now?: string } = {},
): Promise<ExamAttempt> {
  const now = options.now ?? new Date().toISOString();
  const row = await examRow(db, attemptId);
  assertRollover(row);
  if (row.status === 'enviado') throw new QuizError('Esta tentativa já foi enviada.', 409);
  const instrument = row.instrument as FinalInstrument;
  const flow = FLOW[instrument];

  const stored = parseJson<StoredExamQuestions>(row.questions_json);
  const locked = row.status === 'autoavaliacao';
  const lockInfo = locked ? parseJson<StoredExamResult>(row.result_json) : null;
  const closed = locked
    ? {
        answers: sanitizeAnswers(parseJson<Answers>(row.answers_json), new Set(stored?.questionIds ?? [])),
        answeredAt: lockInfo?.answeredAt ?? {},
        timing: lockInfo?.timing ?? [],
        late: lockInfo?.late === true,
      }
    : closeAnswers(row, payload.answers, now);
  const { answers, results, correct, counted, score } = await gradeExamAnswers(
    db,
    row,
    closed.answers,
    payload.selfAssessments,
  );
  const midterm = await midtermOf(db, row.discipline_id);
  const cascade =
    instrument === FINAL_INSTRUMENT
      ? applyMidtermCascade(score, midterm)
      : applyRecoveryBuyback(score, await finalActivityOf(db, row.discipline_id), midterm);
  const passingScore = stored?.passingScore ?? resolvePlan(instrument).passingScore;
  const passed = counted > 0 && cascade.adjustedScore >= passingScore;
  const reliability = await examReliability(
    db,
    row,
    { results, score },
    `tentativas enviadas da ${flow.label} nesta disciplina, pela nota bruta (aplicações repetidas no tempo no lugar de várias pessoas, APO-10)`,
  );
  const boletim: Boletim = {
    ...buildBoletim(attemptId, results, now, Number(row.plan_version), reliability),
    passed,
    cascade,
  };

  const [updated] = await db.batch([
    db
      .prepare(
        `UPDATE atlas_exam_attempts
         SET status = 'enviado', submitted_at = ?2, answers_json = ?3, result_json = ?4, score = ?5, passed = ?6, corrector_version = ?7
         WHERE id = ?1 AND status = ?8 AND COALESCE(result_json, '') = ?9`,
      )
      .bind(
        attemptId,
        now,
        JSON.stringify(answers),
        JSON.stringify({
          results,
          late: closed.late,
          modelAnswers: lockInfo?.modelAnswers,
          answeredAt: closed.answeredAt,
          timing: closed.timing,
          boletim,
        }),
        cascade.adjustedScore,
        passed ? 1 : 0,
        APOLO_CORRECTOR_VERSION,
        row.status,
        row.result_json ?? '',
      ),
  ]);
  if (!updated || updated.meta.changes !== 1) throw new QuizError('Esta tentativa já foi enviada.', 409);

  const detail =
    instrument === FINAL_INSTRUMENT
      ? `${correct}/${counted} (bruta ${score}% × (1 − ${cascade.midtermErrorPercent}% de erro no exame de meio) = ${cascade.adjustedScore}%, mínimo ${passingScore}%)`
      : `${correct}/${counted} (bruta ${score}% resgata ${cascade.recoveryContribution}% dos ${cascade.removedAmount}% cortados da atividade final = ${cascade.adjustedScore}%, mínimo ${passingScore}%)`;
  if ((await currentState(db, 'disciplina', row.discipline_id)) === flow.running) {
    if (instrument === FINAL_INSTRUMENT) {
      await applyIgnoringConflict(
        db,
        {
          entityType: 'disciplina',
          entityId: row.discipline_id,
          event: passed ? 'atividade-final-aprovada' : 'atividade-final-insatisfatoria',
          actor: 'sistema',
          reason: `Atividade final ${passed ? 'aprovada' : 'insatisfatória'}: ${detail}.${passed ? '' : ' Recuperação liberada.'}`,
        },
        now,
      );
    } else {
      const grade = await getFinalActivityGrade(db, row.discipline_id);
      await applyIgnoringConflict(
        db,
        {
          entityType: 'disciplina',
          entityId: row.discipline_id,
          event: 'recuperacao-entregue',
          actor: 'sistema',
          reason: `Recuperação entregue: ${detail}. Vale a maior nota: ${grade.finalActivity?.score ?? cascade.adjustedScore}% (${grade.finalActivity?.source === RECOVERY_INSTRUMENT ? 'recuperação' : 'atividade final'}).`,
        },
        now,
      );
    }
  }
  return (await getExamAttempt(db, attemptId))!;
}

export type FinalActivityGrade = {
  disciplineId: string;
  // Notas emitidas (coluna `score`): exame de meio sem ajuste; atividade
  // final e recuperação já ajustadas pela cascata.
  exameMeio: number | null;
  atividadeFinal: number | null;
  recuperacao: number | null;
  // A nota da atividade final que vale para a disciplina: a maior das duas
  // ajustadas (só a atividade final enquanto não houver recuperação).
  finalActivity: { score: number; source: FinalInstrument } | null;
};

// Só lê notas já emitidas (DEC-016) e escolhe a maior — mesma regra de
// `effectiveFinalActivity` (lib/progress.ts), que o progresso usa.
export async function getFinalActivityGrade(db: D1Like, disciplineId: string): Promise<FinalActivityGrade> {
  const { results } = await db
    .prepare(
      `SELECT id, instrument, score FROM atlas_exam_attempts
       WHERE discipline_id = ?1 AND status = 'enviado' AND score IS NOT NULL`,
    )
    .bind(disciplineId)
    .all<{ id: string; instrument: string; score: number }>();
  const exams = results.map((row) => ({ id: row.id, instrument: row.instrument, score: Number(row.score) }));
  const scoreOf = (instrument: string) => exams.find((item) => item.instrument === instrument)?.score ?? null;
  const best = effectiveFinalActivity(exams);
  return {
    disciplineId,
    exameMeio: scoreOf(EXAM_INSTRUMENT),
    atividadeFinal: scoreOf(FINAL_INSTRUMENT),
    recuperacao: scoreOf(RECOVERY_INSTRUMENT),
    finalActivity: best ? { score: best.score, source: best.source } : null,
  };
}
