// Quizzes pré-cadastrados (MVP-04): execução, timer, envio, correção,
// tentativas, resultado e registro por conteúdo. Regras do DEC-10 e do DEC-04
// (correção determinística, sem IA). O resultado do quiz do conteúdo move o
// estado pelo applyTransition (DEC-03) com evidência "quiz" (TEC-06).
import {
  TransitionError,
  applyTransition,
  currentState,
  type D1Like,
} from './pedagogy/transitions.js';
import {
  reviewStageFor,
  reviewSummary,
  type ReviewStage,
  type ReviewSummary,
} from './reviews.js';
import { directedSelection, recoveryStatus } from './recovery.js';
import {
  gradeQuestion,
  scoreResults,
  PASSING_SCORE,
  VERIFICATION_MINIMUM,
} from './apolo/corrector.js';
export { gradeQuestion, scoreResults, PASSING_SCORE, VERIFICATION_MINIMUM };
import {
  QUESTION_KINDS,
  QUIZ_SIZE,
  QUESTION_SECONDS,
  isLifecycleState,
  type QuestionKind,
  type BloomLevel,
  type DifficultyLevel,
} from './apolo/types.js';
export { QUESTION_KINDS, QUIZ_SIZE, QUESTION_SECONDS };
export type { QuestionKind };
import { resolvePlan, type Instrument } from './apolo/plans.js';
import {
  selectQuestions as selectApoloQuestions,
  type CandidateQuestion,
} from './apolo/selector.js';
import { getStudentProfile } from './apolo/profile.js';

// APO-03: "certo_errado" é julgamento binário (como múltipla com 2
// alternativas fixas); "lacuna_numerica" é valor numérico simples, sem as 5
// verificações de raciocínio que o cálculo exige (DEC-10) — por isso tem
// correção própria em gradeQuestion, não reaproveita a de "calculo".
export const VERIFICATION_SIZE = 5;
// VERIFICATION_MINIMUM e PASSING_SCORE moraram aqui; a partir do APO-13 vivem
// em lib/apolo/corrector.ts (DEC-016) e são só reexportados acima.
// Folga para o envio automático que chega logo depois do fim do tempo.
const DEADLINE_GRACE_SECONDS = 30;

export type VerificationQuestion = {
  prompt: string;
  options: string[];
  correct: number;
};

export type Question = {
  id: string;
  contentId: string;
  position: number;
  kind: QuestionKind;
  prompt: string;
  context: string | null;
  options: string[] | null;
  correctOption: number | null;
  modelAnswer: string | null;
  expectedValue: number | null;
  tolerance: number | null;
  verification: VerificationQuestion[] | null;
  explanation: string;
};

// O que a tela recebe durante a tentativa: sem gabarito.
export type PublicQuestion = {
  id: string;
  kind: QuestionKind;
  prompt: string;
  context: string | null;
  options: string[] | null;
  verification: { prompt: string; options: string[] }[] | null;
  seconds: number | null;
};

export type Answer = {
  option?: number;
  text?: string;
  // Dissertativa: o usuário compara com o gabarito e diz se cobriu (DEC-04).
  selfAssessment?: 'certa' | 'errada';
  value?: number;
  verification?: number[];
};
export type Answers = Record<string, Answer>;

export type QuestionResult = {
  questionId: string;
  kind: QuestionKind;
  correct: boolean;
  voided: boolean;
  verificationCorrect?: number;
  explanation: string;
  modelAnswer: string | null;
  correctOption: number | null;
  expectedValue: number | null;
};

// em-andamento → (com dissertativas) autoavaliacao → enviado.
export type AttemptStatus = 'em-andamento' | 'autoavaliacao' | 'enviado';
// "quiz" do conteúdo (MVP-04); "revisao" 24h/7d/30d e "corretivo" depois de
// falhar a revisão (MVP-06); "atividade" (APO-17, DEC-018) é independente do
// state do conteúdo — pode ser feita a qualquer momento, sem travar nem
// liberar o quiz.
export type QuizPurpose = 'quiz' | 'revisao' | 'corretivo' | 'atividade';

export type QuizAttempt = {
  id: string;
  contentId: string;
  contentTitle: string;
  purpose: QuizPurpose;
  // Etapa da revisão (24h, 7d, 30d) em revisão e corretivo.
  stage: ReviewStage | null;
  // Resumo da revisão depois do envio.
  review: ReviewSummary | null;
  // Quiz dirigido (MVP-08): quantas questões erradas na última reprovação voltaram.
  directed: number;
  status: AttemptStatus;
  startedAt: string;
  deadlineAt: string | null;
  submittedAt: string | null;
  questions: PublicQuestion[];
  answers: Answers | null;
  results: QuestionResult[] | null;
  score: number | null;
  passed: boolean | null;
  late: boolean;
  // Gabarito das dissertativas, só depois de travar as respostas (autoavaliação).
  modelAnswers: Record<string, string> | null;
  evidenceId: string | null;
};

export class QuizError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'QuizError';
  }
}

// ---------------------------------------------------------------------------
// Regras puras
// ---------------------------------------------------------------------------

// Embaralhamento determinístico (mulberry32) a partir de uma semente em texto,
// para que a mesma tentativa sorteie sempre as mesmas questões.
function seededRandom(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let state = h >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Até QUIZ_SIZE questões do banco do conteúdo; com mais, sorteia e mantém a
// ordem do banco (do básico ao mais aplicado).
export function selectQuestions<T extends { id: string; position: number }>(
  bank: T[],
  seed: string,
  size = QUIZ_SIZE,
): T[] {
  const ordered = [...bank].sort(
    (a, b) => a.position - b.position || a.id.localeCompare(b.id),
  );
  if (ordered.length <= size) return ordered;
  const random = seededRandom(seed);
  const pool = [...ordered];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const chosen = new Set(pool.slice(0, size).map((item) => item.id));
  return ordered.filter((item) => chosen.has(item.id));
}

// Tempo total = soma dos tempos por questão (DEC-10). Com questão de cálculo
// (sem limite) o quiz não tem tempo total.
export function totalSeconds(
  questions: { kind: QuestionKind }[],
): number | null {
  let total = 0;
  for (const question of questions) {
    const seconds = QUESTION_SECONDS[question.kind];
    if (seconds === null) return null;
    total += seconds;
  }
  return total;
}

// Ordem embaralhada das alternativas por tentativa (o banco é escrito com a
// certa em qualquer posição, inclusive sempre a primeira). order[exibida] = original.
export function optionOrder(count: number, seed: string): number[] {
  const random = seededRandom(seed);
  const order = Array.from({ length: count }, (_, index) => index);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

// Aplica a ordem da tentativa: a tela vê e responde pelo índice exibido.
export function shuffleQuestion(
  question: Question,
  order: number[] | undefined,
): Question {
  if (
    (question.kind !== 'multipla' && question.kind !== 'certo_errado') ||
    !question.options ||
    !order ||
    order.length !== question.options.length
  )
    return question;
  const options = question.options;
  return {
    ...question,
    options: order.map((index) => options[index]),
    correctOption:
      question.correctOption === null
        ? null
        : order.indexOf(question.correctOption),
  };
}

export function publicQuestion(question: Question): PublicQuestion {
  return {
    id: question.id,
    kind: question.kind,
    prompt: question.prompt,
    context: question.context,
    options: question.options,
    verification:
      question.verification?.map(({ prompt, options }) => ({
        prompt,
        options,
      })) ?? null,
    seconds: QUESTION_SECONDS[question.kind],
  };
}

// gradeQuestion e scoreResults moraram aqui; a partir do APO-13 vivem em
// lib/apolo/corrector.ts (DEC-016, mesma lógica, reexportadas acima) junto
// com buildBoletim.

// ---------------------------------------------------------------------------
// Banco e tentativas no D1
// ---------------------------------------------------------------------------

type QuestionRow = {
  id: string;
  content_id: string;
  position: number;
  kind: QuestionKind;
  prompt: string;
  context: string | null;
  options_json: string | null;
  correct_option: number | null;
  model_answer: string | null;
  expected_value: number | null;
  tolerance: number | null;
  verification_json: string | null;
  explanation: string;
};

function parseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function questionFromRow(row: QuestionRow): Question {
  return {
    id: row.id,
    contentId: row.content_id,
    position: Number(row.position),
    kind: row.kind,
    prompt: row.prompt,
    context: row.context,
    options: parseJson<string[]>(row.options_json),
    correctOption:
      row.correct_option === null ? null : Number(row.correct_option),
    modelAnswer: row.model_answer,
    expectedValue:
      row.expected_value === null ? null : Number(row.expected_value),
    tolerance: row.tolerance === null ? null : Number(row.tolerance),
    verification: parseJson<VerificationQuestion[]>(row.verification_json),
    explanation: row.explanation,
  };
}

export async function listQuestions(
  db: D1Like,
  contentId: string,
): Promise<Question[]> {
  const { results } = await db
    .prepare(
      'SELECT * FROM atlas_questions WHERE content_id = ?1 AND active = 1 ORDER BY position, id',
    )
    .bind(contentId)
    .all<QuestionRow>();
  return results.map(questionFromRow);
}

type CandidateQuestionRow = {
  id: string;
  content_id: string;
  kind: QuestionKind;
  theme: string | null;
  subtopic_id: string | null;
  bloom_level: string | null;
  difficulty_nominal: string | null;
  lifecycle_state: string;
  item_model_id: string | null;
};

function candidateFromRow(row: CandidateQuestionRow): CandidateQuestion {
  return {
    id: row.id,
    contentId: row.content_id,
    kind: row.kind,
    theme: row.theme,
    subtopicId: row.subtopic_id,
    bloomLevel: row.bloom_level as BloomLevel | null,
    difficultyNominal: row.difficulty_nominal as DifficultyLevel | null,
    lifecycleState: isLifecycleState(row.lifecycle_state)
      ? row.lifecycle_state
      : 'ativa',
    itemModelId: row.item_model_id,
  };
}

// APO-14: as mesmas questões de `listQuestions`, com os campos que o Apolo
// acrescentou (tema, subtópico, Bloom, dificuldade, ciclo de vida, molde) —
// só para alimentar o seletor (lib/apolo/selector.ts); a prova em si continua
// vindo de `listQuestions`/`Question`, sem mudar o formato gravado na
// tentativa.
async function listCandidateQuestions(
  db: D1Like,
  contentId: string,
): Promise<CandidateQuestion[]> {
  const { results } = await db
    .prepare(
      `SELECT id, content_id, kind, theme, subtopic_id, bloom_level, difficulty_nominal, lifecycle_state, item_model_id
       FROM atlas_questions WHERE content_id = ?1 AND active = 1`,
    )
    .bind(contentId)
    .all<CandidateQuestionRow>();
  return results.map(candidateFromRow);
}

// APO-14: um conteúdo só usa o seletor do Apolo quando o banco já tem tema
// classificado em quantidade suficiente para o plano de hoje (DEC-10, 10
// questões) — ligação por conteúdo, a mitigação que o próprio card pede
// (banco pequeno/sem classificação repete questão). Sem isso, nada muda:
// segue o sorteio local de sempre (`selectQuestions`/`directedSelection`).
// Content classificado pelo APO-08 (carga inicial) e sem alerta do APO-10
// passa a usar o Apolo sozinho, sem precisar de outro código aqui.
function isApoloReady(candidates: CandidateQuestion[], size: number): boolean {
  return (
    candidates.filter((q) => q.lifecycleState === 'ativa' && q.theme !== null)
      .length >= size
  );
}

type AttemptRow = {
  id: string;
  content_id: string;
  content_title: string;
  purpose: QuizPurpose;
  // Etapa da revisão (24h, 7d, 30d) em revisão e corretivo.
  stage: ReviewStage | null;
  // Resumo da revisão depois do envio.
  review: ReviewSummary | null;
  // Quiz dirigido (MVP-08): quantas questões erradas na última reprovação voltaram.
  directed: number;
  status: AttemptStatus;
  started_at: string;
  deadline_at: string | null;
  submitted_at: string | null;
  questions_json: string;
  answers_json: string | null;
  result_json: string | null;
  score: number | null;
  passed: number | null;
  evidence_id: string | null;
};

const SELECT_ATTEMPT = `SELECT a.*, c.title AS content_title FROM atlas_quiz_attempts a
  JOIN atlas_contents c ON c.id = a.content_id`;

function attemptFromRow(row: AttemptRow): QuizAttempt {
  const stored = parseJson<{
    questions: PublicQuestion[];
    stage?: ReviewStage | null;
    directed?: number;
  }>(row.questions_json);
  const results = parseJson<{
    results?: QuestionResult[];
    late?: boolean;
    modelAnswers?: Record<string, string>;
    review?: ReviewSummary;
  }>(row.result_json);
  return {
    id: row.id,
    contentId: row.content_id,
    contentTitle: row.content_title,
    purpose: row.purpose,
    stage: stored?.stage ?? null,
    review: results?.review ?? null,
    directed: stored?.directed ?? 0,
    status: row.status,
    startedAt: row.started_at,
    deadlineAt: row.deadline_at,
    submittedAt: row.submitted_at,
    questions: stored?.questions ?? [],
    answers: parseJson<Answers>(row.answers_json),
    results: results?.results ?? null,
    score: row.score === null ? null : Number(row.score),
    passed: row.passed === null ? null : Number(row.passed) === 1,
    late: results?.late === true,
    modelAnswers:
      row.status === 'em-andamento' ? null : (results?.modelAnswers ?? null),
    evidenceId: row.evidence_id,
  };
}

export async function getAttempt(
  db: D1Like,
  id: string,
): Promise<QuizAttempt | null> {
  const row = await db
    .prepare(`${SELECT_ATTEMPT} WHERE a.id = ?1`)
    .bind(id)
    .first<AttemptRow>();
  return row ? attemptFromRow(row) : null;
}

export async function listAttempts(
  db: D1Like,
  filter: { contentId?: string; limit?: number } = {},
): Promise<QuizAttempt[]> {
  const limit = Math.min(Math.max(filter.limit ?? 20, 1), 100);
  const { results } = await db
    .prepare(
      `${SELECT_ATTEMPT} WHERE (?1 IS NULL OR a.content_id = ?1)
       ORDER BY a.started_at DESC, a.rowid DESC LIMIT ?2`,
    )
    .bind(filter.contentId ?? null, limit)
    .all<AttemptRow>();
  return results.map(attemptFromRow);
}

// Quizzes liberados: quiz do conteúdo ("aguardando quiz"), revisão
// ("aguardando revisão") e corretivo ("em revisão ativa"), com o tamanho do
// banco e a tentativa em andamento, se houver.
export type QuizQueueItem = {
  contentId: string;
  contentTitle: string;
  disciplineTitle: string;
  purpose: QuizPurpose;
  stage: ReviewStage | null;
  questionCount: number;
  openAttemptId: string | null;
  attempts: number;
};

const PURPOSE_BY_STATE: Record<string, QuizPurpose> = {
  'aguardando-quiz': 'quiz',
  // Reprovado: refaz o quiz direto (ou revisa antes) até passar com 70%.
  bloqueado: 'quiz',
  'aguardando-revisao': 'revisao',
  'em-revisao-ativa': 'corretivo',
};

export async function listQuizQueue(db: D1Like): Promise<QuizQueueItem[]> {
  const { results } = await db
    .prepare(
      `SELECT c.id, c.title, d.title AS discipline_title, s.state,
              (SELECT COUNT(*) FROM atlas_questions q WHERE q.content_id = c.id AND q.active = 1) AS question_count,
              (SELECT a.id FROM atlas_quiz_attempts a WHERE a.content_id = c.id AND a.status <> 'enviado') AS open_attempt
       FROM atlas_content_states s
       JOIN atlas_contents c ON c.id = s.content_id
       JOIN atlas_disciplines d ON d.id = c.discipline_id
       JOIN atlas_phases p ON p.id = d.phase_id
       WHERE s.state IN ('aguardando-quiz', 'bloqueado', 'aguardando-revisao', 'em-revisao-ativa')
       ORDER BY s.updated_at, p.position, d.position, c.position`,
    )
    .all<{
      id: string;
      title: string;
      discipline_title: string;
      state: string;
      question_count: number;
      open_attempt: string | null;
    }>();
  const queue: QuizQueueItem[] = [];
  for (const row of results) {
    const purpose = PURPOSE_BY_STATE[row.state];
    const attempts = await db
      .prepare(
        `SELECT COUNT(*) AS n FROM atlas_quiz_attempts WHERE content_id = ?1 AND purpose = ?2 AND status = 'enviado'`,
      )
      .bind(row.id, purpose)
      .first<{ n: number }>();
    queue.push({
      contentId: row.id,
      contentTitle: row.title,
      disciplineTitle: row.discipline_title,
      purpose,
      stage: purpose === 'quiz' ? null : await reviewStageFor(db, row.id),
      questionCount: Number(row.question_count),
      openAttemptId: row.open_attempt,
      attempts: Number(attempts?.n ?? 0),
    });
  }
  return queue;
}

function addSeconds(iso: string, seconds: number) {
  return new Date(Date.parse(iso) + seconds * 1000).toISOString();
}

// Monta e grava a tentativa (seleção de questões pelo Apolo ou sorteio
// local), já com purpose/instrument/stage decididos pelo chamador —
// compartilhado por startQuiz (liberado pelo state do conteúdo, DEC-03) e
// startAtividade (APO-17: independente do state, DEC-018).
async function createAttemptRecord(
  db: D1Like,
  contentId: string,
  purpose: QuizPurpose,
  instrument: Instrument,
  stage: ReviewStage | null,
  now: string,
  id: string,
): Promise<QuizAttempt> {
  const bank = await listQuestions(db, contentId);
  // MVP-08: depois de uma reprovação, as questões erradas voltam (quiz dirigido).
  const recovery = await recoveryStatus(db, contentId);
  const missedIds = recovery?.missed.map((item) => item.id) ?? [];
  const plan = resolvePlan(instrument);
  const candidates = await listCandidateQuestions(db, contentId);
  let chosen: Question[];
  let directed: number;
  if (isApoloReady(candidates, plan.size)) {
    // APO-14: seletor do Apolo (APO-12) — recuperação vencida > subtópico
    // fraco (APO-09) > cobertura do plano (APO-11). As erradas da última
    // reprovação (MVP-08) entram forçadas como "vencidas agora": o FSRS do
    // Apolo (lib/apolo/skill.ts) só vence depois de meio dia de estabilidade
    // mínima, e aqui elas precisam voltar na hora, igual sempre foi.
    const profile = await getStudentProfile(db);
    const forcedDue = new Set(missedIds);
    const filaRecuperacao = [
      ...profile.filaRecuperacao.filter((item) => !forcedDue.has(item.questionId)),
      ...missedIds.map((questionId) => ({
        questionId,
        difficulty: 5,
        stability: 0.5,
        reviewedAt: now,
        dueAt: now,
      })),
    ];
    const selection = selectApoloQuestions({
      plan,
      profile: { ...profile, filaRecuperacao },
      bank: candidates,
      recentlySeen: [],
      seed: id,
      now,
    });
    const pickedIds = new Set(selection.map((item) => item.questionId));
    chosen = bank.filter((item) => pickedIds.has(item.id));
    directed = selection.filter(
      (item) => item.reason === 'recuperacao-vencida' && forcedDue.has(item.questionId),
    ).length;
  } else {
    const drawn = selectQuestions(bank, id, plan.size);
    const picked = new Set(
      directedSelection(missedIds, bank, drawn, plan.size).map((item) => item.id),
    );
    chosen = missedIds.length ? bank.filter((item) => picked.has(item.id)) : drawn;
    directed = missedIds.filter((questionId) => picked.has(questionId)).length;
  }
  if (chosen.length === 0) {
    throw new QuizError(
      'Este conteúdo ainda não tem questões cadastradas.',
      409,
    );
  }
  const seconds = totalSeconds(chosen);
  const optionOrders: Record<string, number[]> = {};
  for (const question of chosen) {
    if (question.kind === 'multipla' && question.options) {
      optionOrders[question.id] = optionOrder(
        question.options.length,
        `${id}:${question.id}`,
      );
    }
  }
  const shown = chosen.map((question) =>
    shuffleQuestion(question, optionOrders[question.id]),
  );
  await db.batch([
    db
      .prepare(
        `INSERT INTO atlas_quiz_attempts (id, content_id, purpose, status, started_at, deadline_at, questions_json)
         VALUES (?1, ?2, ?6, 'em-andamento', ?3, ?4, ?5)`,
      )
      .bind(
        id,
        contentId,
        now,
        seconds === null ? null : addSeconds(now, seconds),
        JSON.stringify({
          questionIds: chosen.map((item) => item.id),
          optionOrders,
          questions: shown.map(publicQuestion),
          stage,
          directed,
        }),
        purpose,
      ),
  ]);
  return (await getAttempt(db, id))!;
}

// Inicia o quiz do conteúdo, ou devolve a tentativa em andamento (o tempo
// continua correndo de onde estava).
export async function startQuiz(
  db: D1Like,
  contentId: string,
  options: { now?: string; id?: string } = {},
): Promise<QuizAttempt> {
  const now = options.now ?? new Date().toISOString();
  const state = await currentState(db, 'conteudo', contentId);
  const purpose = PURPOSE_BY_STATE[state];
  if (!purpose) {
    throw new QuizError(
      'O quiz deste conteúdo é liberado ao concluir uma sessão de estudo.',
      409,
    );
  }
  // Mesma chave do índice único do banco (content_id, purpose): uma
  // tentativa em andamento de outro propósito (ex.: atividade) não bloqueia
  // nem é devolvida aqui.
  const open = await db
    .prepare(
      `SELECT id FROM atlas_quiz_attempts WHERE content_id = ?1 AND purpose = ?2 AND status <> 'enviado'`,
    )
    .bind(contentId, purpose)
    .first<{ id: string }>();
  if (open) return (await getAttempt(db, open.id))!;

  const stage = purpose === 'quiz' ? null : await reviewStageFor(db, contentId);
  const id = options.id ?? crypto.randomUUID();
  // APO-15: revisão tem plano próprio por etapa (24h/7d/30d, tamanho 10→30/60
  // confirmado pelo Abner); quiz e corretivo seguem com o de sempre.
  const instrument: Instrument =
    purpose === 'revisao' && stage
      ? (`revisao_${stage}` as 'revisao_24h' | 'revisao_7d' | 'revisao_30d')
      : purpose === 'corretivo'
        ? 'corretivo'
        : 'quiz';
  return createAttemptRecord(db, contentId, purpose, instrument, stage, now, id);
}

// APO-17 (DEC-018): Atividade do conteúdo — independente do state (DEC-03
// não é reaberto nem consultado aqui); pode ser feita a qualquer momento,
// com a mesma mecânica de refação do quiz (sem limite de tentativas, sem
// penalidade de nota). Só uma tentativa de atividade em andamento por
// conteúdo (mesmo índice único do banco, content_id+purpose) — uma tentativa
// de quiz em andamento no mesmo conteúdo não é afetada nem devolvida aqui.
export async function startAtividade(
  db: D1Like,
  contentId: string,
  options: { now?: string; id?: string } = {},
): Promise<QuizAttempt> {
  const now = options.now ?? new Date().toISOString();
  const open = await db
    .prepare(
      `SELECT id FROM atlas_quiz_attempts WHERE content_id = ?1 AND purpose = 'atividade' AND status <> 'enviado'`,
    )
    .bind(contentId)
    .first<{ id: string }>();
  if (open) return (await getAttempt(db, open.id))!;

  const id = options.id ?? crypto.randomUUID();
  return createAttemptRecord(db, contentId, 'atividade', 'atividade', null, now, id);
}

function sanitizeAnswers(raw: unknown, ids: Set<string>): Answers {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const answers: Answers = {};
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!ids.has(id) || !value || typeof value !== 'object') continue;
    const item = value as Record<string, unknown>;
    const answer: Answer = {};
    if (Number.isInteger(item.option)) answer.option = item.option as number;
    if (typeof item.text === 'string') answer.text = item.text.slice(0, 5000);
    if (item.selfAssessment === 'certa' || item.selfAssessment === 'errada')
      answer.selfAssessment = item.selfAssessment;
    if (typeof item.value === 'number' && Number.isFinite(item.value))
      answer.value = item.value;
    if (Array.isArray(item.verification)) {
      answer.verification = item.verification
        .slice(0, VERIFICATION_SIZE)
        .map((v) => (Number.isInteger(v) ? (v as number) : -1));
    }
    answers[id] = answer;
  }
  return answers;
}

type StoredQuestions = {
  questionIds: string[];
  optionOrders?: Record<string, number[]>;
};

function isLate(row: AttemptRow, now: string) {
  return (
    row.deadline_at !== null &&
    Date.parse(now) >
      Date.parse(row.deadline_at) + DEADLINE_GRACE_SECONDS * 1000
  );
}

// Trava as respostas (o tempo para de contar) e libera o gabarito das
// dissertativas para a autoavaliação (DEC-04). Sem dissertativa, envie direto.
export async function lockQuiz(
  db: D1Like,
  attemptId: string,
  rawAnswers: unknown,
  options: { now?: string } = {},
): Promise<QuizAttempt> {
  const now = options.now ?? new Date().toISOString();
  const row = await db
    .prepare('SELECT * FROM atlas_quiz_attempts WHERE id = ?1')
    .bind(attemptId)
    .first<AttemptRow>();
  if (!row) throw new QuizError('Tentativa não encontrada.', 404);
  if (row.status !== 'em-andamento')
    throw new QuizError('As respostas desta tentativa já foram travadas.', 409);
  const ids = parseJson<StoredQuestions>(row.questions_json)?.questionIds ?? [];
  const answers = sanitizeAnswers(rawAnswers, new Set(ids));
  const modelAnswers: Record<string, string> = {};
  for (const question of await listAllQuestions(db, ids)) {
    if (question.kind === 'dissertativa')
      modelAnswers[question.id] = question.modelAnswer ?? '';
  }
  const [result] = await db.batch([
    db
      .prepare(
        `UPDATE atlas_quiz_attempts SET status = 'autoavaliacao', answers_json = ?2, result_json = ?3
         WHERE id = ?1 AND status = 'em-andamento'`,
      )
      .bind(
        attemptId,
        JSON.stringify(answers),
        JSON.stringify({ lockedAt: now, late: isLate(row, now), modelAnswers }),
      ),
  ]);
  if (!result || result.meta.changes !== 1)
    throw new QuizError('As respostas desta tentativa já foram travadas.', 409);
  return (await getAttempt(db, attemptId))!;
}

// Envio: corrige, grava o resultado e a evidência e aplica a transição do
// quiz do conteúdo (aprovado → concluído; reprovado → bloqueado).
// Em "em-andamento" recebe as respostas; em "autoavaliacao" usa as respostas
// travadas e só aceita a autoavaliação das dissertativas.
export async function submitQuiz(
  db: D1Like,
  attemptId: string,
  payload: { answers?: unknown; selfAssessments?: unknown },
  options: { now?: string; evidenceId?: string } = {},
): Promise<QuizAttempt> {
  const now = options.now ?? new Date().toISOString();
  const row = await db
    .prepare('SELECT * FROM atlas_quiz_attempts WHERE id = ?1')
    .bind(attemptId)
    .first<AttemptRow>();
  if (!row) throw new QuizError('Tentativa não encontrada.', 404);
  if (row.status === 'enviado')
    throw new QuizError('Esta tentativa já foi enviada.', 409);

  const stored = parseJson<StoredQuestions>(row.questions_json);
  const ids = stored?.questionIds ?? [];
  const bank = new Map(
    (await listAllQuestions(db, ids)).map((item) => [item.id, item]),
  );
  const locked = row.status === 'autoavaliacao';
  const answers = sanitizeAnswers(
    locked ? parseJson<Answers>(row.answers_json) : payload.answers,
    new Set(ids),
  );
  for (const [id, verdict] of Object.entries(
    payload.selfAssessments && typeof payload.selfAssessments === 'object'
      ? (payload.selfAssessments as Record<string, unknown>)
      : {},
  )) {
    if (
      bank.get(id)?.kind !== 'dissertativa' ||
      (verdict !== 'certa' && verdict !== 'errada')
    )
      continue;
    answers[id] = { ...answers[id], selfAssessment: verdict };
  }
  const results = ids.flatMap((id) => {
    const question = bank.get(id);
    return question
      ? [
          gradeQuestion(
            shuffleQuestion(question, stored?.optionOrders?.[id]),
            answers[id],
          ),
        ]
      : [];
  });
  const { correct, counted, score, passed: passedThreshold } = scoreResults(results);
  // APO-17 (DEC-018): Atividade só aprova com nota > 70% (texto literal da
  // decisão), diferente do >= 70% do quiz/revisão (UX-04) — e só gera
  // evidência quando aprovada; reprovação não registra evidência nem
  // dispara nada (a Atividade não participa do DEC-03), só pode ser refeita
  // direto, igual ao quiz.
  const passed = row.purpose === 'atividade' ? counted > 0 && score > PASSING_SCORE : passedThreshold;
  const shouldRecordEvidence = row.purpose !== 'atividade' || passed;
  const lockInfo = locked
    ? parseJson<{ late?: boolean; modelAnswers?: Record<string, string> }>(
        row.result_json,
      )
    : null;
  const late = locked ? lockInfo?.late === true : isLate(row, now);
  const evidenceId = shouldRecordEvidence ? options.evidenceId ?? crypto.randomUUID() : null;
  const stage = parseJson<{ stage?: ReviewStage | null }>(row.questions_json)?.stage ?? null;
  const label =
    row.purpose === 'quiz'
      ? 'Quiz'
      : row.purpose === 'atividade'
        ? 'Atividade'
        : row.purpose === 'revisao'
          ? `Revisão de ${stage ?? '?'}`
          : `Quiz corretivo (${stage ?? '?'})`;
  const verdict =
    row.purpose === 'revisao' || row.purpose === 'atividade'
      ? passed
        ? 'aprovada'
        : 'reprovada'
      : passed
        ? 'aprovado'
        : 'reprovado';
  const summary = `${label} ${verdict}: ${correct}/${counted} (${score}%).`;
  const evidenceKind = row.purpose === 'quiz' ? 'quiz' : row.purpose === 'atividade' ? 'atividade' : 'revisao';

  const statements = [];
  if (shouldRecordEvidence) {
    statements.push(
      db
        .prepare(
          `INSERT INTO atlas_evidences (id, content_id, subtopic_id, kind, source_ref, summary, recorded_at)
           SELECT ?1, ?2, NULL, ?7, ?3, ?4, ?5
           WHERE EXISTS (SELECT 1 FROM atlas_quiz_attempts WHERE id = ?3 AND status = ?6)`,
        )
        .bind(evidenceId, row.content_id, attemptId, summary, now, row.status, evidenceKind),
    );
  }
  statements.push(
    db
      .prepare(
        `UPDATE atlas_quiz_attempts
         SET status = 'enviado', submitted_at = ?2, answers_json = ?3, result_json = ?4, score = ?5, passed = ?6, evidence_id = ?7
         WHERE id = ?1 AND status = ?8`,
      )
      .bind(
        attemptId,
        now,
        JSON.stringify(answers),
        JSON.stringify({ results, late, modelAnswers: lockInfo?.modelAnswers }),
        score,
        passed ? 1 : 0,
        evidenceId,
        row.status,
      ),
  );
  const batchResults = await db.batch(statements);
  const updated = batchResults[batchResults.length - 1];
  if (!updated || updated.meta.changes !== 1)
    throw new QuizError('Esta tentativa já foi enviada.', 409);

  const state = await currentState(db, 'conteudo', row.content_id);
  const minimum = `(mínimo ${PASSING_SCORE}%)`;
  const transition =
    row.purpose === 'quiz' && (state === 'aguardando-quiz' || (state === 'bloqueado' && passed))
      ? {
          event: passed ? 'quiz-aprovado' : 'quiz-reprovado',
          reason: passed
            ? `Quiz aprovado com ${score}% ${minimum}${state === 'bloqueado' ? ' ao refazer' : ''}.`
            : `Quiz reprovado com ${score}% ${minimum}; refaça o quiz (revise as notas antes, se quiser) até passar.`,
        }
      : row.purpose === 'revisao' && state === 'aguardando-revisao'
        ? {
            event: passed ? 'revisao-aprovada' : 'revisao-reprovada',
            reason: passed
              ? `Revisão de ${stage} aprovada com ${score}% ${minimum}.`
              : `Revisão de ${stage} reprovada com ${score}% ${minimum}; o conteúdo foi reaberto.`,
          }
        : row.purpose === 'corretivo' && state === 'em-revisao-ativa' && passed
          ? { event: 'revisao-aprovada', reason: `Quiz corretivo aprovado com ${score}% ${minimum}: domínio mostrado de novo.` }
          : null;
  if (transition) {
    try {
      await applyTransition(
        db,
        {
          entityType: 'conteudo',
          entityId: row.content_id,
          event: transition.event,
          actor: 'sistema',
          reason: transition.reason,
          evidenceId,
        },
        { now },
      );
    } catch (error) {
      if (!(error instanceof TransitionError && error.code === 'conflict'))
        throw error;
    }
  }
  if (row.purpose !== 'quiz' && stage) {
    const review = await reviewSummary(db, row.content_id, stage, passed);
    await db.batch([
      db
        .prepare('UPDATE atlas_quiz_attempts SET result_json = ?2 WHERE id = ?1')
        .bind(
          attemptId,
          JSON.stringify({ results, late, modelAnswers: lockInfo?.modelAnswers, review }),
        ),
    ]);
  }
  return (await getAttempt(db, attemptId))!;
}

// Inclui questões desativadas depois do sorteio: a tentativa é corrigida pelo
// banco do momento em que começou.
async function listAllQuestions(
  db: D1Like,
  ids: string[],
): Promise<Question[]> {
  if (ids.length === 0) return [];
  const placeholders = ids.map((_, index) => `?${index + 1}`).join(', ');
  const { results } = await db
    .prepare(`SELECT * FROM atlas_questions WHERE id IN (${placeholders})`)
    .bind(...ids)
    .all<QuestionRow>();
  return results.map(questionFromRow);
}

export function quizErrorResponse(error: unknown) {
  if (error instanceof QuizError)
    return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof TransitionError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.code === 'not-found' ? 404 : 409 },
    );
  }
  return Response.json(
    { error: 'Não foi possível concluir a operação do quiz.' },
    { status: 500 },
  );
}
