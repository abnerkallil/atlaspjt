// Exame de meio de curso (APO-18, DEC-016/DEC-018). Prova por DISCIPLINA —
// diferente de quiz/revisão/atividade, que são por conteúdo
// (`atlas_quiz_attempts`) — com tentativa única garantida no banco
// (`atlas_exam_attempts`, índice único em discipline_id+instrument), nota
// própria (corte de 70% do plano `exame_meio`, APO-11) e boletim com KR-20.
//
// A liberação e o início seguem a FSM da disciplina que já existia
// (`lib/pedagogy/states.ts`, DEC-03), sem nenhuma transição nova:
// `conteudo-50` (sistema, ao chegar em 50% de cobertura) → `iniciar-exame-
// meio` (exige confirmação explícita do usuário) → `exame-meio-entregue`
// (sistema, no envio). Tudo passa por `applyTransition`, com auditoria.
//
// Escopo ("primeira metade" da disciplina): todo conteúdo com nível curado
// `iniciante` ou `intermediario` (`atlas_contents.level`, curadoria humana,
// nunca classificação automática — DEC-014). Enquanto a disciplina não tiver
// NENHUM conteúdo nivelado, vale a primeira metade pela posição (⌈n/2⌉) —
// degradação graciosa enquanto a curadoria não chega (ver docs/APOLO.md).
//
// APO-19: a mesma tabela guarda também a atividade final e a recuperação
// (uma linha por instrumento, mesmo índice único). O que é comum às três
// provas — montagem, gravação, correção, KR-20, liberação pela cobertura e o
// tempo (com e sem rolagem) — mora aqui; o que é só da atividade final e da
// recuperação (cascata, resposta questão a questão, maior nota) mora em
// `lib/apolo/final.ts`.
import {
  TransitionError,
  applyTransition,
  currentState,
  planTransition,
  type D1Like,
} from '../pedagogy/transitions.js';
import { COVERED_STATES } from '../progress.js';
import type { ContentState } from '../pedagogy/states.js';
import {
  DEADLINE_GRACE_SECONDS,
  QuizError,
  listAllQuestions,
  listCandidateQuestions,
  listQuestions,
  optionOrder,
  publicQuestion,
  sanitizeAnswers,
  shuffleQuestion,
  type Answers,
  type PublicQuestion,
  type Question,
  type QuestionResult,
} from '../quizzes.js';
import {
  APOLO_CORRECTOR_VERSION,
  buildBoletim,
  gradeQuestion,
  scoreResults,
  type Boletim,
  type BoletimCascade,
  type BoletimReliability,
} from './corrector.js';
import { kr20 } from './item-stats.js';
import { resolvePlan, type ExamPlan } from './plans.js';
import { getStudentProfile } from './profile.js';
import { selectQuestions as selectApoloQuestions } from './selector.js';
import type { QuestionKind } from './types.js';

export const EXAM_INSTRUMENT = 'exame_meio';

// Nível do conteúdo (APO-18): texto livre no banco, validado aqui (mesmo
// padrão de `theme`, DEC-014). Valor fora deste conjunto conta como "sem
// nível".
export const CONTENT_LEVELS = ['iniciante', 'intermediario', 'avancado'] as const;
export type ContentLevel = (typeof CONTENT_LEVELS)[number];
export function isContentLevel(value: unknown): value is ContentLevel {
  return typeof value === 'string' && (CONTENT_LEVELS as readonly string[]).includes(value);
}
// O exame de meio de curso cobre até o nível intermediário, inclusive.
export const MIDTERM_LEVELS: readonly ContentLevel[] = ['iniciante', 'intermediario'];

// Fração de conteúdos cobertos (COVERED_STATES, mesma régua do componente
// Cobertura de lib/progress.ts) que libera o exame (`conteudo-50`).
export const MIDTERM_COVERAGE = 0.5;
// APO-19: fração que libera a atividade final (`conteudo-100`) — junto com
// todas as atividades aprovadas (DEC-018).
export const FINAL_COVERAGE = 1;

// Instrumentos por disciplina gravados em `atlas_exam_attempts` (APO-18/19).
export const FINAL_INSTRUMENT = 'atividade_final';
export const RECOVERY_INSTRUMENT = 'recuperacao';
export const DISCIPLINE_INSTRUMENTS = [EXAM_INSTRUMENT, FINAL_INSTRUMENT, RECOVERY_INSTRUMENT] as const;
export type DisciplineInstrument = (typeof DISCIPLINE_INSTRUMENTS)[number];
export function isDisciplineInstrument(value: unknown): value is DisciplineInstrument {
  return typeof value === 'string' && (DISCIPLINE_INSTRUMENTS as readonly string[]).includes(value);
}
// Só a atividade final e a recuperação têm rolagem de tempo (APO-19); o
// exame de meio continua com o tempo total somado, sem rolagem (APO-18).
export function hasRollover(instrument: string): boolean {
  return instrument === FINAL_INSTRUMENT || instrument === RECOVERY_INSTRUMENT;
}

// 'disciplina' (APO-19): todos os conteúdos da disciplina, sem recorte.
export type ExamScopeRule = 'nivel' | 'posicao' | 'disciplina';
export type ExamScope = {
  rule: ExamScopeRule;
  // Níveis que entraram (só na regra 'nivel').
  levels: ContentLevel[] | null;
  contentIds: string[];
  totalContents: number;
};

export type ExamStatus = 'em-andamento' | 'autoavaliacao' | 'enviado';

export type ExamAttempt = {
  id: string;
  disciplineId: string;
  disciplineTitle: string;
  instrument: string;
  status: ExamStatus;
  startedAt: string;
  deadlineAt: string | null;
  submittedAt: string | null;
  scope: ExamScope;
  questions: PublicQuestion[];
  answers: Answers | null;
  results: QuestionResult[] | null;
  score: number | null;
  passed: boolean | null;
  late: boolean;
  modelAnswers: Record<string, string> | null;
  boletim: Boletim | null;
  planVersion: number;
  correctorVersion: number | null;
  // APO-19 (só atividade final e recuperação; nulos no exame de meio):
  // momento em que cada questão foi respondida (relógio do servidor), o
  // tempo questão a questão com a rolagem, a questão da vez com o prazo dela
  // (só em andamento) e a cascata do exame de meio (só depois do envio).
  answeredAt: Record<string, string> | null;
  timing: QuestionTiming[] | null;
  currentQuestion: { questionId: string; index: number; deadlineAt: string | null } | null;
  cascade: BoletimCascade | null;
};

// ---------------------------------------------------------------------------
// Regras puras
// ---------------------------------------------------------------------------

// Resolve o escopo a partir dos conteúdos da disciplina (qualquer ordem).
export function resolveExamScope(
  contents: { id: string; position: number; level: string | null }[],
): ExamScope {
  const ordered = [...contents].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
  const leveled = ordered.some((content) => isContentLevel(content.level));
  if (leveled) {
    return {
      rule: 'nivel',
      levels: [...MIDTERM_LEVELS],
      contentIds: ordered
        .filter((content) => isContentLevel(content.level) && MIDTERM_LEVELS.includes(content.level))
        .map((content) => content.id),
      totalContents: ordered.length,
    };
  }
  return {
    rule: 'posicao',
    levels: null,
    contentIds: ordered.slice(0, Math.ceil(ordered.length / 2)).map((content) => content.id),
    totalContents: ordered.length,
  };
}

// Divide o tamanho da prova entre os conteúdos do escopo o mais igual
// possível, sem passar do que cada um tem no banco (enchimento por nível
// d'água: quem tem pouco entrega tudo, a sobra vai para quem tem mais).
// Determinístico; a ordem de `order` só desempata o resto.
export function allocateContentQuotas(
  available: Record<string, number>,
  size: number,
  order: readonly string[],
): Record<string, number> {
  const quotas = Object.fromEntries(order.map((id) => [id, 0])) as Record<string, number>;
  let remaining = Math.max(0, size);
  let open = order.filter((id) => (available[id] ?? 0) > 0);
  while (remaining > 0 && open.length > 0) {
    const share = Math.floor(remaining / open.length);
    for (const id of open) {
      if (remaining === 0) break;
      const add = Math.min(Math.max(share, 1), available[id] - quotas[id], remaining);
      quotas[id] += add;
      remaining -= add;
    }
    open = open.filter((id) => quotas[id] < available[id]);
  }
  return quotas;
}

// Tempo total: soma do tempo por questão do plano (90 s, APO-18), sem
// rolagem de sobra; com cálculo/lacuna numérica (sem limite) não há tempo total.
export function examTotalSeconds(
  questions: { kind: QuestionKind }[],
  plan: ExamPlan = resolvePlan('exame_meio'),
): number | null {
  let total = 0;
  for (const question of questions) {
    const seconds = plan.secondsByKind[question.kind];
    if (seconds === null) return null;
    total += seconds;
  }
  return total;
}

// Tempo da atividade final e da recuperação (APO-19): mesma base de 90 s por
// questão, mas a sobra de uma questão passa para a seguinte — respondeu uma
// questão de 90 s em 60 s, a próxima tem 90 + 30 = 120 s. Questão a questão,
// pela ordem da prova, a partir do momento em que cada uma foi respondida
// (relógio do servidor, gravado no `responder`; ver lib/apolo/final.ts):
//
// - gasto = resposta desta − resposta da anterior (a primeira conta do início);
// - prazo = base + sobra herdada; atrasada se gasto > prazo + tolerância
//   (DEADLINE_GRACE_SECONDS, a mesma do quiz);
// - sobra = prazo − gasto (nunca negativa: estourar zera a sobra, não
//   desconta da próxima);
// - cálculo/lacuna numérica continuam sem limite: não atrasam e deixam a
//   sobra herdada passar intacta para a seguinte.
//
// Questão ainda sem resposta: a primeira delas é a "da vez" (prazo conta da
// última resposta); depois dela não há prazo calculável.
export type QuestionTiming = {
  questionId: string;
  baseSeconds: number | null;
  carriedSeconds: number;
  budgetSeconds: number | null;
  deadlineAt: string | null;
  answeredAt: string | null;
  spentSeconds: number | null;
  leftoverSeconds: number;
  late: boolean;
};

export function rolloverTiming(
  questions: { id: string; seconds: number | null }[],
  startedAt: string,
  answeredAt: Record<string, string>,
  graceSeconds: number = DEADLINE_GRACE_SECONDS,
): QuestionTiming[] {
  const timing: QuestionTiming[] = [];
  let previous: number | null = Date.parse(startedAt);
  let carried = 0;
  for (const question of questions) {
    const base = question.seconds;
    const budget = base === null ? null : base + carried;
    const at = answeredAt[question.id] ?? null;
    const deadlineAt =
      previous !== null && budget !== null ? new Date(previous + budget * 1000).toISOString() : null;
    if (at === null || previous === null) {
      timing.push({
        questionId: question.id,
        baseSeconds: base,
        carriedSeconds: carried,
        budgetSeconds: budget,
        deadlineAt,
        answeredAt: null,
        spentSeconds: null,
        leftoverSeconds: 0,
        late: false,
      });
      previous = null;
      carried = 0;
      continue;
    }
    const answered = Math.max(Date.parse(at), previous);
    const spent = (answered - previous) / 1000;
    const late = budget !== null && spent > budget + graceSeconds;
    const leftover = budget === null ? carried : Math.max(0, budget - spent);
    timing.push({
      questionId: question.id,
      baseSeconds: base,
      carriedSeconds: carried,
      budgetSeconds: budget,
      deadlineAt,
      answeredAt: at,
      spentSeconds: spent,
      leftoverSeconds: leftover,
      late,
    });
    previous = answered;
    carried = leftover;
  }
  return timing;
}

// ---------------------------------------------------------------------------
// D1
// ---------------------------------------------------------------------------

export function parseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function addSeconds(iso: string, seconds: number) {
  return new Date(Date.parse(iso) + seconds * 1000).toISOString();
}

// Igual ao tratamento de `submitQuiz` (lib/quizzes.ts): se outro caminho já
// moveu o estado no meio do caminho, a transição perdida não derruba a
// operação.
export async function applyIgnoringConflict(
  db: D1Like,
  request: Parameters<typeof applyTransition>[1],
  now: string,
): Promise<boolean> {
  try {
    await applyTransition(db, request, { now });
    return true;
  } catch (error) {
    if (error instanceof TransitionError && error.code === 'conflict') return false;
    throw error;
  }
}

// Curadoria humana do nível (APO-18). Só valida e grava — quem chama é
// sempre uma ação explícita do Abner, nunca o Apolo por conta própria.
export async function setContentLevel(db: D1Like, contentId: string, level: ContentLevel | null): Promise<void> {
  if (level !== null && !isContentLevel(level)) {
    throw new QuizError(`Nível inválido: use ${CONTENT_LEVELS.join(', ')} ou nenhum.`, 400);
  }
  const [result] = await db.batch([
    db.prepare('UPDATE atlas_contents SET level = ?2 WHERE id = ?1').bind(contentId, level),
  ]);
  if (!result || result.meta.changes !== 1) throw new QuizError('Conteúdo não encontrado.', 404);
}

export async function disciplineContents(db: D1Like, disciplineId: string) {
  const { results } = await db
    .prepare(
      `SELECT c.id, c.position, c.level, s.state FROM atlas_contents c
       LEFT JOIN atlas_content_states s ON s.content_id = c.id
       WHERE c.discipline_id = ?1 ORDER BY c.position, c.id`,
    )
    .bind(disciplineId)
    .all<{ id: string; position: number; level: string | null; state: string | null }>();
  return results.map((row) => ({ ...row, position: Number(row.position) }));
}

export async function examScope(db: D1Like, disciplineId: string): Promise<ExamScope> {
  return resolveExamScope(await disciplineContents(db, disciplineId));
}

export type DisciplineExamStatus = {
  disciplineId: string;
  state: string;
  covered: number;
  total: number;
  // APO-19 (DEC-018): conteúdos da disciplina com atividade aprovada
  // (evidência `atividade`), segunda condição de `conteudo-100`.
  atividadesAprovadas: number;
  // true quando esta chamada disparou `conteudo-50` ou `conteudo-100`.
  released: boolean;
};

// Conteúdos da disciplina com pelo menos uma evidência `atividade` — só
// gravada quando a atividade é aprovada (> 70%, APO-17/DEC-018).
async function approvedActivityCount(db: D1Like, disciplineId: string): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COUNT(DISTINCT e.content_id) AS n FROM atlas_evidences e
       JOIN atlas_contents c ON c.id = e.content_id
       WHERE c.discipline_id = ?1 AND e.kind = 'atividade'`,
    )
    .bind(disciplineId)
    .first<{ n: number }>();
  return Number(row?.n ?? 0);
}

// Libera as provas da disciplina pela cobertura (mesma lista COVERED_STATES
// do componente de Cobertura, lib/progress.ts), sempre pela FSM existente:
//
// - `conteudo-50` (sistema): em `em-andamento`, com pelo menos metade dos
//   conteúdos cobertos → exame de meio de curso liberado (APO-18);
// - `conteudo-100` (sistema, APO-19): em `exame-meio-concluido`, com todos
//   os conteúdos cobertos E todos com atividade aprovada (DEC-018: as duas
//   condições gatam o mesmo evento) → atividade final liberada.
//
// Um passo por chamada (nunca pula o exame de meio). Idempotente: fora
// desses dois estados não faz nada; uma corrida com outra chamada não derruba
// nada (conflito ignorado).
export async function syncDisciplineState(
  db: D1Like,
  disciplineId: string,
  options: { now?: string } = {},
): Promise<DisciplineExamStatus> {
  const now = options.now ?? new Date().toISOString();
  const state = await currentState(db, 'disciplina', disciplineId);
  const contents = await disciplineContents(db, disciplineId);
  const total = contents.length;
  const covered = contents.filter((content) =>
    COVERED_STATES.includes((content.state ?? 'nao-iniciado') as ContentState),
  ).length;
  const atividadesAprovadas = await approvedActivityCount(db, disciplineId);
  let released = false;
  let next = state;
  if (state === 'em-andamento' && total > 0 && covered / total >= MIDTERM_COVERAGE) {
    released = await applyIgnoringConflict(
      db,
      {
        entityType: 'disciplina',
        entityId: disciplineId,
        event: 'conteudo-50',
        actor: 'sistema',
        reason: `${covered} de ${total} conteúdos concluídos (mínimo 50%): exame de meio de curso liberado.`,
      },
      now,
    );
    next = 'exame-meio-liberado';
  } else if (
    state === 'exame-meio-concluido' &&
    total > 0 &&
    covered / total >= FINAL_COVERAGE &&
    atividadesAprovadas >= total
  ) {
    released = await applyIgnoringConflict(
      db,
      {
        entityType: 'disciplina',
        entityId: disciplineId,
        event: 'conteudo-100',
        actor: 'sistema',
        reason: `${covered} de ${total} conteúdos concluídos e ${atividadesAprovadas} de ${total} atividades aprovadas (DEC-018): atividade final liberada.`,
      },
      now,
    );
    next = 'atividade-final-liberada';
  }
  return {
    disciplineId,
    state: released ? next : await currentState(db, 'disciplina', disciplineId),
    covered,
    total,
    atividadesAprovadas,
    released,
  };
}

// Mesmo gatilho, a partir de um conteúdo (usado depois do envio de um quiz).
export async function syncDisciplineOfContent(
  db: D1Like,
  contentId: string,
  options: { now?: string } = {},
): Promise<DisciplineExamStatus | null> {
  const row = await db
    .prepare('SELECT discipline_id FROM atlas_contents WHERE id = ?1')
    .bind(contentId)
    .first<{ discipline_id: string }>();
  return row ? syncDisciplineState(db, row.discipline_id, options) : null;
}

export type ExamRow = {
  id: string;
  discipline_id: string;
  discipline_title: string;
  instrument: string;
  status: ExamStatus;
  started_at: string;
  deadline_at: string | null;
  submitted_at: string | null;
  scope_json: string;
  questions_json: string;
  answers_json: string | null;
  result_json: string | null;
  score: number | null;
  passed: number | null;
  plan_version: number;
  corrector_version: number | null;
};

export type StoredExamQuestions = {
  questionIds: string[];
  optionOrders?: Record<string, number[]>;
  questions: PublicQuestion[];
  passingScore: number;
  warnings?: string[];
};

export type StoredExamResult = {
  results?: QuestionResult[];
  late?: boolean;
  lockedAt?: string;
  modelAnswers?: Record<string, string>;
  boletim?: Boletim;
  // APO-19 (atividade final e recuperação): relógio do servidor por questão
  // (já em andamento) e o tempo com rolagem fechado na trava/envio.
  answeredAt?: Record<string, string>;
  timing?: QuestionTiming[];
};

const SELECT_EXAM = `SELECT a.*, d.title AS discipline_title FROM atlas_exam_attempts a
  JOIN atlas_disciplines d ON d.id = a.discipline_id`;

function examFromRow(row: ExamRow): ExamAttempt {
  const stored = parseJson<StoredExamQuestions>(row.questions_json);
  const result = parseJson<StoredExamResult>(row.result_json);
  const scope = parseJson<ExamScope>(row.scope_json) ?? {
    rule: 'posicao',
    levels: null,
    contentIds: [],
    totalContents: 0,
  };
  const questions = stored?.questions ?? [];
  const rollover = hasRollover(row.instrument);
  const answeredAt = rollover ? (result?.answeredAt ?? {}) : null;
  // Tempo fechado na trava/envio vale como gravado; em andamento, é recalculado
  // do que já foi respondido (mesma regra pura, mesmos dados gravados).
  const timing =
    answeredAt === null
      ? null
      : (result?.timing ??
        rolloverTiming(
          questions.map((question) => ({ id: question.id, seconds: question.seconds })),
          row.started_at,
          answeredAt,
        ));
  const currentIndex =
    timing && row.status === 'em-andamento' ? timing.findIndex((item) => item.answeredAt === null) : -1;
  return {
    id: row.id,
    disciplineId: row.discipline_id,
    disciplineTitle: row.discipline_title,
    instrument: row.instrument,
    status: row.status,
    startedAt: row.started_at,
    deadlineAt: row.deadline_at,
    submittedAt: row.submitted_at,
    scope,
    questions,
    answers: parseJson<Answers>(row.answers_json),
    results: result?.results ?? null,
    score: row.score === null ? null : Number(row.score),
    passed: row.passed === null ? null : Number(row.passed) === 1,
    late: result?.late === true,
    modelAnswers: row.status === 'em-andamento' ? null : (result?.modelAnswers ?? null),
    boletim: result?.boletim ?? null,
    planVersion: Number(row.plan_version),
    correctorVersion: row.corrector_version === null ? null : Number(row.corrector_version),
    answeredAt,
    timing,
    currentQuestion:
      timing && currentIndex >= 0
        ? {
            questionId: timing[currentIndex].questionId,
            index: currentIndex,
            deadlineAt: timing[currentIndex].deadlineAt,
          }
        : null,
    cascade: result?.boletim?.cascade ?? null,
  };
}

export async function getExamAttempt(db: D1Like, id: string): Promise<ExamAttempt | null> {
  const row = await db.prepare(`${SELECT_EXAM} WHERE a.id = ?1`).bind(id).first<ExamRow>();
  return row ? examFromRow(row) : null;
}

export async function listExamAttempts(
  db: D1Like,
  filter: { disciplineId?: string } = {},
): Promise<ExamAttempt[]> {
  const { results } = await db
    .prepare(`${SELECT_EXAM} WHERE (?1 IS NULL OR a.discipline_id = ?1) ORDER BY a.started_at DESC, a.rowid DESC`)
    .bind(filter.disciplineId ?? null)
    .all<ExamRow>();
  return results.map(examFromRow);
}

export type ExamQueueItem = DisciplineExamStatus & {
  disciplineTitle: string;
  scope: ExamScope;
  // Tentativa do exame de meio (APO-18), mantida com o mesmo nome.
  attemptId: string | null;
  // APO-19: a tentativa de cada instrumento por disciplina, se houver.
  attemptIds: Record<DisciplineInstrument, string | null>;
};

// Todas as disciplinas, já sincronizadas (dispara `conteudo-50`/`conteudo-100`
// onde couber), com o escopo que o exame de meio teria hoje e as tentativas.
export async function listExamQueue(db: D1Like, options: { now?: string } = {}): Promise<ExamQueueItem[]> {
  const { results } = await db
    .prepare(
      `SELECT d.id, d.title FROM atlas_disciplines d JOIN atlas_phases p ON p.id = d.phase_id
       ORDER BY p.position, d.position`,
    )
    .all<{ id: string; title: string }>();
  const { results: attempts } = await db
    .prepare('SELECT id, discipline_id, instrument FROM atlas_exam_attempts')
    .all<{ id: string; discipline_id: string; instrument: string }>();
  const queue: ExamQueueItem[] = [];
  for (const row of results) {
    const status = await syncDisciplineState(db, row.id, options);
    const attemptIds = Object.fromEntries(
      DISCIPLINE_INSTRUMENTS.map((instrument) => [
        instrument,
        attempts.find((item) => item.discipline_id === row.id && item.instrument === instrument)?.id ?? null,
      ]),
    ) as Record<DisciplineInstrument, string | null>;
    queue.push({
      ...status,
      disciplineTitle: row.title,
      scope: await examScope(db, row.id),
      attemptId: attemptIds[EXAM_INSTRUMENT],
      attemptIds,
    });
  }
  return queue;
}

export async function existingAttemptId(
  db: D1Like,
  disciplineId: string,
  instrument: DisciplineInstrument = EXAM_INSTRUMENT,
): Promise<string | null> {
  const row = await db
    .prepare('SELECT id FROM atlas_exam_attempts WHERE discipline_id = ?1 AND instrument = ?2')
    .bind(disciplineId, instrument)
    .first<{ id: string }>();
  return row?.id ?? null;
}

// Monta a prova (sem gravar nada) sobre um escopo já resolvido: cota por
// conteúdo e seletor do Apolo (APO-12) com o plano do instrumento.
// `recentlySeen` (APO-19): a recuperação evita repetir a atividade final.
export async function buildExamQuestions(
  db: D1Like,
  scope: ExamScope,
  plan: ExamPlan,
  id: string,
  now: string,
  options: { recentlySeen?: string[] } = {},
): Promise<{ chosen: Question[]; warnings: string[] }> {
  const bank = await listQuestions(db, scope.contentIds);
  const candidates = await listCandidateQuestions(db, scope.contentIds);
  const availableByContent: Record<string, number> = {};
  for (const candidate of candidates) {
    if (candidate.lifecycleState !== 'ativa') continue;
    availableByContent[candidate.contentId] = (availableByContent[candidate.contentId] ?? 0) + 1;
  }
  const quotas = allocateContentQuotas(availableByContent, plan.size, scope.contentIds);
  const profile = await getStudentProfile(db);
  const selection = selectApoloQuestions({
    plan,
    profile,
    bank: candidates,
    recentlySeen: options.recentlySeen ?? [],
    seed: id,
    now,
    perContentQuota: quotas,
  });
  const byId = new Map(bank.map((question) => [question.id, question]));
  const picked = selection.flatMap((item) => {
    const question = byId.get(item.questionId);
    return question ? [question] : [];
  });
  if (picked.length === 0) {
    throw new QuizError('Os conteúdos do exame ainda não têm questões cadastradas.', 409);
  }
  // Intercalação do plano: ordem embaralhada com semente, misturando conteúdos.
  const chosen: Question[] = plan.interleaving
    ? optionOrder(picked.length, `${id}:ordem`).map((index) => picked[index])
    : picked;
  const warnings =
    chosen.length < plan.size
      ? [`Banco dos conteúdos do exame tem só ${chosen.length} de ${plan.size} questões; o exame sai com o que existe.`]
      : [];
  return { chosen, warnings };
}

// Grava a tentativa (questões embaralhadas, prazo total, escopo e plano).
// Corrida: o índice único em (discipline_id, instrument) deixa uma só — quem
// perde o INSERT devolve a da outra chamada.
export async function insertExamAttempt(
  db: D1Like,
  input: {
    id: string;
    disciplineId: string;
    instrument: DisciplineInstrument;
    scope: ExamScope;
    plan: ExamPlan;
    chosen: Question[];
    warnings: string[];
    now: string;
  },
): Promise<ExamAttempt> {
  const { id, disciplineId, instrument, scope, plan, chosen, warnings, now } = input;
  // Teto do tempo da prova inteira; com rolagem (APO-19) é o mesmo total —
  // a sobra só muda de questão, nunca cresce.
  const seconds = examTotalSeconds(chosen, plan);
  const optionOrders: Record<string, number[]> = {};
  for (const question of chosen) {
    if (question.kind === 'multipla' && question.options) {
      optionOrders[question.id] = optionOrder(question.options.length, `${id}:${question.id}`);
    }
  }
  const shown = chosen.map((question) => ({
    ...publicQuestion(shuffleQuestion(question, optionOrders[question.id])),
    seconds: plan.secondsByKind[question.kind],
  }));
  const stored: StoredExamQuestions = {
    questionIds: chosen.map((question) => question.id),
    optionOrders,
    questions: shown,
    passingScore: plan.passingScore,
    warnings,
  };
  try {
    await db.batch([
      db
        .prepare(
          `INSERT INTO atlas_exam_attempts
             (id, discipline_id, instrument, status, started_at, deadline_at, scope_json, questions_json, plan_version)
           VALUES (?1, ?2, ?3, 'em-andamento', ?4, ?5, ?6, ?7, ?8)`,
        )
        .bind(
          id,
          disciplineId,
          instrument,
          now,
          seconds === null ? null : addSeconds(now, seconds),
          JSON.stringify(scope),
          JSON.stringify(stored),
          plan.version,
        ),
    ]);
  } catch (error) {
    const winner = await existingAttemptId(db, disciplineId, instrument);
    if (winner) return (await getExamAttempt(db, winner))!;
    throw error;
  }
  return (await getExamAttempt(db, id))!;
}

// Inicia o exame de meio de curso (tentativa única). Exige `confirmed: true`
// (DEC-03: `iniciar-exame-meio` pede confirmação explícita) — sem ela, o
// mesmo TransitionError 'confirmation' (409) de qualquer outra transição, e
// nada é gravado. Se já existe tentativa para a disciplina (em andamento ou
// enviada), devolve essa, sem criar outra — o índice único do banco garante
// isso mesmo sob corrida.
export async function startExameMeio(
  db: D1Like,
  disciplineId: string,
  options: { confirmed?: boolean; now?: string; id?: string } = {},
): Promise<ExamAttempt> {
  const now = options.now ?? new Date().toISOString();
  const existing = await existingAttemptId(db, disciplineId);
  if (existing) return (await getExamAttempt(db, existing))!;

  const { state } = await syncDisciplineState(db, disciplineId, { now });
  // Reparo: estado já em curso sem tentativa gravada (falha entre a
  // transição e o INSERT) — monta a prova sem disparar a transição de novo.
  const alreadyStarted = state === 'exame-meio-em-curso';
  if (!alreadyStarted && state !== 'exame-meio-liberado') {
    throw new QuizError(
      state === 'em-andamento'
        ? 'O exame de meio de curso é liberado ao concluir 50% dos conteúdos da disciplina.'
        : 'O exame de meio de curso desta disciplina já foi encerrado.',
      409,
    );
  }
  const id = options.id ?? crypto.randomUUID();
  const transition = {
    entityType: 'disciplina' as const,
    entityId: disciplineId,
    event: 'iniciar-exame-meio',
    actor: 'usuario' as const,
    confirmed: options.confirmed === true,
    reason: 'Iniciou o exame de meio de curso (tentativa única), com confirmação explícita.',
  };
  // Confirmação conferida antes de montar a prova (mesma regra pura de
  // applyTransition): sem ela, erro sem nenhuma leitura extra nem escrita.
  if (!alreadyStarted) planTransition(transition, state, now, id);

  const scope = await examScope(db, disciplineId);
  if (scope.contentIds.length === 0) {
    throw new QuizError(
      scope.rule === 'nivel'
        ? 'Nenhum conteúdo desta disciplina está nivelado como iniciante ou intermediário.'
        : 'Esta disciplina ainda não tem conteúdos.',
      409,
    );
  }
  const plan = resolvePlan('exame_meio');
  const { chosen, warnings } = await buildExamQuestions(db, scope, plan, id, now);
  if (!alreadyStarted) await applyTransition(db, transition, { now });
  return insertExamAttempt(db, {
    id,
    disciplineId,
    instrument: EXAM_INSTRUMENT,
    scope,
    plan,
    chosen,
    warnings,
    now,
  });
}

export async function examRow(db: D1Like, attemptId: string): Promise<ExamRow> {
  const row = await db
    .prepare(`${SELECT_EXAM} WHERE a.id = ?1`)
    .bind(attemptId)
    .first<ExamRow>();
  if (!row) throw new QuizError('Tentativa não encontrada.', 404);
  return row;
}

// O exame de meio (sem rolagem) e a atividade final/recuperação (com rolagem,
// lib/apolo/final.ts) têm fluxos de trava e envio próprios; a rota escolhe
// pelo instrumento, e cada fluxo recusa a tentativa do outro.
function assertMidterm(row: ExamRow) {
  if (row.instrument !== EXAM_INSTRUMENT) {
    throw new QuizError('Esta tentativa não é de exame de meio de curso.', 409);
  }
}

function isLate(row: ExamRow, now: string) {
  return row.deadline_at !== null && Date.parse(now) > Date.parse(row.deadline_at) + DEADLINE_GRACE_SECONDS * 1000;
}

export async function modelAnswersOf(db: D1Like, ids: string[]): Promise<Record<string, string>> {
  const modelAnswers: Record<string, string> = {};
  for (const question of await listAllQuestions(db, ids)) {
    if (question.kind === 'dissertativa') modelAnswers[question.id] = question.modelAnswer ?? '';
  }
  return modelAnswers;
}

// Trava as respostas e libera o gabarito das dissertativas para a
// autoavaliação (DEC-04), igual a `lockQuiz`.
export async function lockExam(
  db: D1Like,
  attemptId: string,
  rawAnswers: unknown,
  options: { now?: string } = {},
): Promise<ExamAttempt> {
  const now = options.now ?? new Date().toISOString();
  const row = await examRow(db, attemptId);
  assertMidterm(row);
  if (row.status !== 'em-andamento') throw new QuizError('As respostas desta tentativa já foram travadas.', 409);
  const ids = parseJson<StoredExamQuestions>(row.questions_json)?.questionIds ?? [];
  const answers = sanitizeAnswers(rawAnswers, new Set(ids));
  const modelAnswers = await modelAnswersOf(db, ids);
  const [result] = await db.batch([
    db
      .prepare(
        `UPDATE atlas_exam_attempts SET status = 'autoavaliacao', answers_json = ?2, result_json = ?3
         WHERE id = ?1 AND status = 'em-andamento'`,
      )
      .bind(attemptId, JSON.stringify(answers), JSON.stringify({ lockedAt: now, late: isLate(row, now), modelAnswers })),
  ]);
  if (!result || result.meta.changes !== 1) throw new QuizError('As respostas desta tentativa já foram travadas.', 409);
  return (await getExamAttempt(db, attemptId))!;
}

// KR-20 da prova (mesma aproximação do APO-10: aplicações repetidas fazem o
// papel de "várias pessoas"), sobre todas as tentativas enviadas deste
// instrumento na disciplina, incluindo a que está sendo enviada. A nota de
// cada aplicação é a BRUTA do corretor (`boletim.score`): na atividade final
// e na recuperação a coluna `score` é a nota ajustada pela cascata (APO-19),
// que não mede consistência da prova.
export async function examReliability(
  db: D1Like,
  row: ExamRow,
  current: { results: QuestionResult[]; score: number },
  basis: string,
): Promise<BoletimReliability> {
  const { results: previous } = await db
    .prepare(
      `SELECT result_json, score FROM atlas_exam_attempts
       WHERE discipline_id = ?1 AND instrument = ?2 AND status = 'enviado' AND id <> ?3 AND score IS NOT NULL`,
    )
    .bind(row.discipline_id, row.instrument, row.id)
    .all<{ result_json: string | null; score: number }>();
  const administrations = [
    ...previous.map((item) => {
      const stored = parseJson<StoredExamResult>(item.result_json);
      return { results: stored?.results ?? [], score: stored?.boletim?.score ?? Number(item.score) };
    }),
    current,
  ];
  const items = new Map<string, { correct: number; answers: number }>();
  for (const administration of administrations) {
    for (const result of administration.results) {
      if (result.voided) continue;
      const item = items.get(result.questionId) ?? { correct: 0, answers: 0 };
      item.answers += 1;
      item.correct += result.correct ? 1 : 0;
      items.set(result.questionId, item);
    }
  }
  return {
    kr20: kr20([...items.values()], administrations.map((item) => item.score)),
    basis,
    administrations: administrations.length,
  };
}

// Correção comum às três provas por disciplina: autoavaliação das
// dissertativas por cima das respostas e corretor único do Apolo (APO-13),
// questão por questão na ordem gravada.
export async function gradeExamAnswers(
  db: D1Like,
  row: ExamRow,
  baseAnswers: Answers,
  selfAssessments: unknown,
): Promise<{ answers: Answers; results: QuestionResult[]; correct: number; counted: number; score: number }> {
  const stored = parseJson<StoredExamQuestions>(row.questions_json);
  const ids = stored?.questionIds ?? [];
  const bank = new Map((await listAllQuestions(db, ids)).map((item) => [item.id, item]));
  const answers: Answers = { ...baseAnswers };
  for (const [id, verdict] of Object.entries(
    selfAssessments && typeof selfAssessments === 'object' ? (selfAssessments as Record<string, unknown>) : {},
  )) {
    if (bank.get(id)?.kind !== 'dissertativa' || (verdict !== 'certa' && verdict !== 'errada')) continue;
    answers[id] = { ...answers[id], selfAssessment: verdict };
  }
  const results = ids.flatMap((id) => {
    const question = bank.get(id);
    return question ? [gradeQuestion(shuffleQuestion(question, stored?.optionOrders?.[id]), answers[id])] : [];
  });
  const { correct, counted, score } = scoreResults(results);
  return { answers, results, correct, counted, score };
}

// Envio: corrige pelo corretor único do Apolo (APO-13), grava resultado e
// boletim uma única vez (DEC-016) e dispara `exame-meio-entregue` (sistema).
// Em "em-andamento" recebe as respostas; em "autoavaliacao" usa as travadas
// e só aceita a autoavaliação das dissertativas — igual a `submitQuiz`.
export async function submitExam(
  db: D1Like,
  attemptId: string,
  payload: { answers?: unknown; selfAssessments?: unknown },
  options: { now?: string } = {},
): Promise<ExamAttempt> {
  const now = options.now ?? new Date().toISOString();
  const row = await examRow(db, attemptId);
  assertMidterm(row);
  if (row.status === 'enviado') throw new QuizError('Esta tentativa já foi enviada.', 409);

  const stored = parseJson<StoredExamQuestions>(row.questions_json);
  const ids = stored?.questionIds ?? [];
  const locked = row.status === 'autoavaliacao';
  const { answers, results, correct, counted, score } = await gradeExamAnswers(
    db,
    row,
    sanitizeAnswers(locked ? parseJson<Answers>(row.answers_json) : payload.answers, new Set(ids)),
    payload.selfAssessments,
  );
  const passingScore = stored?.passingScore ?? resolvePlan('exame_meio').passingScore;
  const passed = counted > 0 && score >= passingScore;
  const lockInfo = locked ? parseJson<StoredExamResult>(row.result_json) : null;
  const late = locked ? lockInfo?.late === true : isLate(row, now);
  const reliability = await examReliability(
    db,
    row,
    { results, score },
    'tentativas enviadas do exame de meio de curso nesta disciplina (aplicações repetidas no tempo no lugar de várias pessoas, APO-10)',
  );
  const boletim: Boletim = {
    ...buildBoletim(attemptId, results, now, Number(row.plan_version), reliability),
    passed,
  };

  const [updated] = await db.batch([
    db
      .prepare(
        `UPDATE atlas_exam_attempts
         SET status = 'enviado', submitted_at = ?2, answers_json = ?3, result_json = ?4, score = ?5, passed = ?6, corrector_version = ?7
         WHERE id = ?1 AND status = ?8`,
      )
      .bind(
        attemptId,
        now,
        JSON.stringify(answers),
        JSON.stringify({ results, late, modelAnswers: lockInfo?.modelAnswers, boletim }),
        score,
        passed ? 1 : 0,
        APOLO_CORRECTOR_VERSION,
        row.status,
      ),
  ]);
  if (!updated || updated.meta.changes !== 1) throw new QuizError('Esta tentativa já foi enviada.', 409);

  if ((await currentState(db, 'disciplina', row.discipline_id)) === 'exame-meio-em-curso') {
    await applyIgnoringConflict(
      db,
      {
        entityType: 'disciplina',
        entityId: row.discipline_id,
        event: 'exame-meio-entregue',
        actor: 'sistema',
        reason: `Exame de meio de curso ${passed ? 'aprovado' : 'reprovado'}: ${correct}/${counted} (${score}%, mínimo ${passingScore}%).`,
      },
      now,
    );
  }
  return (await getExamAttempt(db, attemptId))!;
}
