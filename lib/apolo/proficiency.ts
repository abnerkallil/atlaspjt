// Exame de proficiência (APO-20, DEC-05). Por CONTEÚDO, reusando
// `atlas_quiz_attempts` com `purpose = 'proficiencia'` — mesmo índice único
// (content_id, purpose) do quiz/atividade (APO-14/APO-17); nenhuma migration
// nova. Objetivo: quem já domina o conteúdo prova isso e pula o estudo, sem
// afetar nota nenhuma (DEC-05/DEC-017) — só a transição `dispensa-
// proficiencia` que já existia na FSM (`lib/pedagogy/states.ts`, DEC-03):
// `nao-iniciado` → `concluido`, com evidência `proficiencia`.
//
// Diferente do exame de meio/atividade final (lista fixa sorteada no início,
// `lib/apolo/exam.ts`/`final.ts`), este é adaptativo de verdade (CAT —
// computerized adaptive testing, Rasch de 1 parâmetro, DEC-017: só prioriza
// e decide a parada, nunca a nota): cada resposta atualiza a estimativa de
// habilidade (θ, na mesma escala Elo do modelo do aluno, `lib/apolo/
// skill.ts`) e escolhe a próxima questão — a mais informativa, a de
// dificuldade mais próxima de θ — até parar por erro-padrão baixo (com um
// mínimo de questões antes, por decisão nossa — a mitigação que o próprio
// card pede para "prova curta é menos precisa") ou por atingir o tamanho
// máximo do plano `proficiencia` (20, `lib/apolo/plans.ts`). A nota final é
// sempre a de sempre: corretor único, acerto/total × 100
// (`lib/apolo/corrector.ts`) sobre as questões administradas — θ nunca entra
// nela. Nota acima de 85% dispensa; do contrário, nada é gravado na FSM e o
// exame pode ser refeito, como o quiz/atividade.
//
// Simplificações assumidas (disclosed, sem decisão do Abner):
// - Limiar de parada por erro-padrão (52 pontos Elo) e mínimo de questões
//   (5) são nossos, não confirmados — ver as constantes abaixo.
// - Dissertativa fica fora do banco de candidatas: exigiria autoavaliação
//   por questão (DEC-04) no meio do loop adaptativo, que este card não pede.
// - Do plano `proficiencia` (APO-11) só o tamanho (20, teto máximo) é usado
//   aqui; `kindMix`/`difficultyMix`/`bloomMix`/`interleaving` não valem — a
//   escolha de questão é toda pelo motor adaptativo (θ), não pela cobertura
//   do plano.
import {
  TransitionError,
  applyTransition,
  currentState,
  type D1Like,
} from '../pedagogy/transitions.js';
import {
  QuizError,
  gradeQuestion,
  listCandidateQuestions,
  listQuestions,
  optionOrder,
  publicQuestion,
  sanitizeAnswers,
  scoreResults,
  shuffleQuestion,
  type Answers,
  type AttemptStatus,
  type PublicQuestion,
  type Question,
  type QuestionResult,
} from '../quizzes.js';
import { buildBoletim, type Boletim } from './corrector.js';
import { getItemAudit } from './item-audit.js';
import { resolvePlan } from './plans.js';
import { DEFAULT_DIFFICULTY_ELO, DIFFICULTY_ELO, INITIAL_ELO } from './skill.js';
import type { CandidateQuestion } from './selector.js';

// ---------------------------------------------------------------------------
// Regras puras (CAT — Rasch de 1 parâmetro, escala Elo)
// ---------------------------------------------------------------------------

// Elo↔logit: a mesma constante implícita no 10^(Δ/400) do Elo (lib/apolo/
// skill.ts) — um logito vale 400/ln(10) ≈ 173,7 pontos Elo.
const LOGIT_SCALE = Math.log(10) / 400;
const NEWTON_ITERATIONS = 15;
const THETA_MIN = 400;
const THETA_MAX = 2400;

// Convenção usual de CAT (ex.: Weiss & Kingsbury): parar com erro-padrão
// abaixo de 0,3 logito — aqui convertido para pontos Elo (0,3 / LOGIT_SCALE).
// Não confirmado pelo Abner (disclosed).
export const SE_STOP_ELO = Math.round(0.3 / LOGIT_SCALE);
// Mitigação do próprio card ("prova curta é menos precisa"): nenhuma parada
// por erro-padrão antes disso, ainda que o erro já esteja baixo.
export const MIN_QUESTIONS = 5;
// "Nota acima de 85" (texto literal do card e da transição na FSM) —
// diferente do corte de 70% (PASSING_SCORE) do resto do Apolo.
export const PROFICIENCY_THRESHOLD = 85;

export function probability(theta: number, itemElo: number): number {
  return 1 / (1 + 10 ** ((itemElo - theta) / 400));
}

function clampTheta(value: number): number {
  return Math.min(THETA_MAX, Math.max(THETA_MIN, value));
}

// Estimativa de máxima verossimilhança por Newton-Raphson, com θ e passo
// sempre dentro de [THETA_MIN, THETA_MAX] (sem isso, acertar ou errar tudo
// diverge para o infinito — problema clássico do CAT). Sem resposta nenhuma,
// θ fica no ponto de partida e o erro-padrão é infinito (nenhuma precisão
// ainda). θ só prioriza/decide a parada (DEC-017); a nota nunca sai daqui.
export function estimateAbility(
  responses: { itemElo: number; correct: boolean }[],
  startTheta: number = INITIAL_ELO,
): { theta: number; se: number | null } {
  if (responses.length === 0) return { theta: startTheta, se: null };
  let theta = startTheta;
  for (let iteration = 0; iteration < NEWTON_ITERATIONS; iteration += 1) {
    let infoSum = 0;
    let scoreSum = 0;
    for (const { itemElo, correct } of responses) {
      const p = probability(theta, itemElo);
      infoSum += p * (1 - p);
      scoreSum += (correct ? 1 : 0) - p;
    }
    if (infoSum <= 0) break;
    theta = clampTheta(theta + scoreSum / (LOGIT_SCALE * infoSum));
  }
  let infoSum = 0;
  for (const { itemElo } of responses) {
    const p = probability(theta, itemElo);
    infoSum += p * (1 - p);
  }
  const se = infoSum > 0 ? 1 / (LOGIT_SCALE * Math.sqrt(infoSum)) : Number.POSITIVE_INFINITY;
  return { theta, se };
}

// Próxima questão: sempre a mais informativa (dificuldade mais próxima de
// θ) entre as ainda não administradas — um CAT de Rasch clássico escolhe
// assim, nunca por sorteio (mesmo princípio do modo adaptativo do seletor,
// `lib/apolo/selector.ts`, topN=1), aqui com θ atualizado a cada resposta em
// vez de uma lista fixa sorteada no início. Empate exato (mesma distância):
// desempate pelo id, para o resultado ser determinístico. Nulo com o banco
// esgotado.
export function pickNextItem(pool: { id: string; itemElo: number }[], theta: number): string | null {
  if (pool.length === 0) return null;
  const ranked = [...pool].sort(
    (a, b) => Math.abs(a.itemElo - theta) - Math.abs(b.itemElo - theta) || a.id.localeCompare(b.id),
  );
  return ranked[0].id;
}

// ---------------------------------------------------------------------------
// D1
// ---------------------------------------------------------------------------

type StoppedBy = 'erro-padrao' | 'tamanho-maximo' | 'banco-esgotado';

type ProficiencyState = {
  // Dificuldade (Elo, APO-10) de toda candidata ativa do conteúdo, só
  // multipla/certo_errado/calculo/lacuna_numerica (sem dissertativa) —
  // instantâneo do início da tentativa, reusado a cada escolha de questão
  // (não recalculado a cada resposta: outra tentativa alhures não deveria
  // mudar o motor em andamento desta).
  itemElo: Record<string, number>;
  optionOrders: Record<string, number[]>;
  questions: PublicQuestion[];
  administered: string[];
  responses: { questionId: string; correct: boolean }[];
  theta: number;
  se: number | null;
};

type StoredResult = {
  results: QuestionResult[];
  boletim: Boletim;
  theta: number;
  se: number | null;
  stoppedBy: StoppedBy;
};

export type ProficiencyAttempt = {
  id: string;
  contentId: string;
  contentTitle: string;
  status: AttemptStatus;
  startedAt: string;
  submittedAt: string | null;
  administered: number;
  theta: number;
  se: number | null;
  currentQuestion: PublicQuestion | null;
  answers: Answers | null;
  results: QuestionResult[] | null;
  boletim: Boletim | null;
  score: number | null;
  dispensado: boolean | null;
  stoppedBy: StoppedBy | null;
};

type Row = {
  id: string;
  content_id: string;
  content_title: string;
  status: AttemptStatus;
  started_at: string;
  submitted_at: string | null;
  questions_json: string;
  answers_json: string | null;
  result_json: string | null;
  score: number | null;
  passed: number | null;
};

const SELECT_PROFICIENCY = `SELECT a.id, a.content_id, c.title AS content_title, a.status, a.started_at,
  a.submitted_at, a.questions_json, a.answers_json, a.result_json, a.score, a.passed
  FROM atlas_quiz_attempts a JOIN atlas_contents c ON c.id = a.content_id
  WHERE a.id = ?1 AND a.purpose = 'proficiencia'`;

function attemptFromRow(row: Row): ProficiencyAttempt {
  const state = JSON.parse(row.questions_json) as ProficiencyState;
  const stored = row.result_json ? (JSON.parse(row.result_json) as StoredResult) : null;
  return {
    id: row.id,
    contentId: row.content_id,
    contentTitle: row.content_title,
    status: row.status,
    startedAt: row.started_at,
    submittedAt: row.submitted_at,
    administered: state.administered.length,
    theta: stored?.theta ?? state.theta,
    se: stored?.se ?? state.se,
    currentQuestion: row.status === 'em-andamento' ? state.questions[state.questions.length - 1] : null,
    answers: row.answers_json ? (JSON.parse(row.answers_json) as Answers) : null,
    results: stored?.results ?? null,
    boletim: stored?.boletim ?? null,
    score: row.score === null ? null : Number(row.score),
    dispensado: row.passed === null ? null : Number(row.passed) === 1,
    stoppedBy: stored?.stoppedBy ?? null,
  };
}

export async function getProficiencyAttempt(db: D1Like, id: string): Promise<ProficiencyAttempt | null> {
  const row = await db.prepare(SELECT_PROFICIENCY).bind(id).first<Row>();
  return row ? attemptFromRow(row) : null;
}

async function proficiencyRow(db: D1Like, id: string): Promise<Row> {
  const row = await db.prepare(SELECT_PROFICIENCY).bind(id).first<Row>();
  if (!row) throw new QuizError('Tentativa de exame de proficiência não encontrada.', 404);
  return row;
}

// Dificuldade (Elo) de cada candidata: a já medida pelo histórico real
// (APO-10, `getItemAudit`) ou, sem histórico ainda, a nominal da questão
// (mesmo fallback do resto do Apolo, `DEFAULT_DIFFICULTY_ELO`).
async function itemEloMap(db: D1Like, candidates: CandidateQuestion[]): Promise<Record<string, number>> {
  const { items } = await getItemAudit(db);
  const known = new Map(items.map((item) => [item.questionId, item.elo]));
  const map: Record<string, number> = {};
  for (const candidate of candidates) {
    map[candidate.id] =
      known.get(candidate.id) ??
      (candidate.difficultyNominal ? DIFFICULTY_ELO[candidate.difficultyNominal] : DEFAULT_DIFFICULTY_ELO);
  }
  return map;
}

function presentQuestion(question: Question, id: string, seed: string): { optionOrder: number[] | undefined; public: PublicQuestion } {
  const order =
    (question.kind === 'multipla' || question.kind === 'certo_errado') && question.options
      ? optionOrder(question.options.length, seed)
      : undefined;
  return { optionOrder: order, public: publicQuestion(shuffleQuestion(question, order)) };
}

// Inicia o exame (tentativa única em andamento, mesmo índice único do banco
// content_id+purpose do quiz/atividade) ou devolve a já aberta. Só antes de
// começar o conteúdo (`nao-iniciado`) — depois disso a dispensa não faz
// sentido (DEC-05), e a transição da FSM recusaria mesmo que chegássemos lá.
export async function startProficiencia(
  db: D1Like,
  contentId: string,
  options: { now?: string; id?: string } = {},
): Promise<ProficiencyAttempt> {
  const now = options.now ?? new Date().toISOString();
  const open = await db
    .prepare(`SELECT id FROM atlas_quiz_attempts WHERE content_id = ?1 AND purpose = 'proficiencia' AND status <> 'enviado'`)
    .bind(contentId)
    .first<{ id: string }>();
  if (open) return (await getProficiencyAttempt(db, open.id))!;

  const state = await currentState(db, 'conteudo', contentId);
  if (state !== 'nao-iniciado') {
    throw new QuizError('O exame de proficiência só vale antes de começar o conteúdo.', 409);
  }

  const candidates = (await listCandidateQuestions(db, contentId)).filter(
    (question) => question.lifecycleState === 'ativa' && question.kind !== 'dissertativa',
  );
  if (candidates.length === 0) {
    throw new QuizError('Este conteúdo ainda não tem questões cadastradas para o exame de proficiência.', 409);
  }
  const itemElo = await itemEloMap(db, candidates);
  const id = options.id ?? crypto.randomUUID();
  const theta = INITIAL_ELO;
  const firstId = pickNextItem(
    candidates.map((candidate) => ({ id: candidate.id, itemElo: itemElo[candidate.id] })),
    theta,
  )!;
  const bank = await listQuestions(db, contentId);
  const question = bank.find((item) => item.id === firstId)!;
  const presented = presentQuestion(question, firstId, `${id}:${firstId}`);
  const initial: ProficiencyState = {
    itemElo,
    optionOrders: presented.optionOrder ? { [firstId]: presented.optionOrder } : {},
    questions: [presented.public],
    administered: [firstId],
    responses: [],
    theta,
    se: null,
  };
  await db.batch([
    db
      .prepare(
        `INSERT INTO atlas_quiz_attempts (id, content_id, purpose, status, started_at, deadline_at, questions_json)
         VALUES (?1, ?2, 'proficiencia', 'em-andamento', ?3, NULL, ?4)`,
      )
      .bind(id, contentId, now, JSON.stringify(initial)),
  ]);
  return (await getProficiencyAttempt(db, id))!;
}

// Responde a questão da vez (sempre a última de `administered` — a única
// ainda sem resposta, pela invariante do motor: nunca há mais de uma questão
// pendente). Atualiza θ/erro-padrão e decide: parar (grava resultado,
// evidência se dispensado, e dispara `dispensa-proficiencia`) ou escolher a
// próxima questão mais informativa e devolver a tentativa em andamento.
export async function answerProficiencia(
  db: D1Like,
  attemptId: string,
  questionId: unknown,
  rawAnswer: unknown,
  options: { now?: string } = {},
): Promise<ProficiencyAttempt> {
  const now = options.now ?? new Date().toISOString();
  const row = await proficiencyRow(db, attemptId);
  if (row.status !== 'em-andamento') throw new QuizError('Esta tentativa já foi enviada.', 409);
  const state = JSON.parse(row.questions_json) as ProficiencyState;
  const current = state.administered[state.administered.length - 1];
  if (questionId !== current) {
    throw new QuizError('Responda a questão da vez, na ordem em que foi apresentada.', 409);
  }

  const bank = await listQuestions(db, row.content_id);
  const byId = new Map(bank.map((question) => [question.id, question]));
  const question = byId.get(current)!;
  const answers = row.answers_json ? (JSON.parse(row.answers_json) as Answers) : {};
  const answer = sanitizeAnswers({ [current]: rawAnswer }, new Set([current]))[current];
  if (answer) answers[current] = answer;
  const graded = gradeQuestion(shuffleQuestion(question, state.optionOrders[current]), answer);
  const responses = [...state.responses, { questionId: current, correct: graded.correct && !graded.voided }];
  const { theta, se } = estimateAbility(responses.map((item) => ({ itemElo: state.itemElo[item.questionId], correct: item.correct })));

  const plan = resolvePlan('proficiencia');
  const remaining = Object.keys(state.itemElo).filter((id) => !state.administered.includes(id));
  const sizeDone = responses.length >= plan.size;
  const bankDone = remaining.length === 0;
  const seDone = responses.length >= MIN_QUESTIONS && se !== null && se <= SE_STOP_ELO;
  const stop = sizeDone || bankDone || seDone;

  const previousJson = row.questions_json;
  if (!stop) {
    const nextId = pickNextItem(
      remaining.map((id) => ({ id, itemElo: state.itemElo[id] })),
      theta,
    )!;
    const nextQuestion = byId.get(nextId)!;
    const presented = presentQuestion(nextQuestion, nextId, `${attemptId}:${nextId}`);
    const next: ProficiencyState = {
      ...state,
      optionOrders: presented.optionOrder ? { ...state.optionOrders, [nextId]: presented.optionOrder } : state.optionOrders,
      questions: [...state.questions, presented.public],
      administered: [...state.administered, nextId],
      responses,
      theta,
      se,
    };
    const [updated] = await db.batch([
      db
        .prepare(
          `UPDATE atlas_quiz_attempts SET answers_json = ?2, questions_json = ?3
           WHERE id = ?1 AND status = 'em-andamento' AND questions_json = ?4`,
        )
        .bind(attemptId, JSON.stringify(answers), JSON.stringify(next), previousJson),
    ]);
    if (!updated || updated.meta.changes !== 1) {
      throw new QuizError('A tentativa mudou durante a operação. Tente de novo.', 409);
    }
    return (await getProficiencyAttempt(db, attemptId))!;
  }

  // Parada: corrige todas as administradas (mesmo corretor de sempre,
  // DEC-016/DEC-017 — θ só escolheu/decidiu a parada, nunca a nota).
  const results: QuestionResult[] = state.administered.map((id) => {
    if (id === current) return graded;
    const bankQuestion = byId.get(id)!;
    return gradeQuestion(shuffleQuestion(bankQuestion, state.optionOrders[id]), answers[id]);
  });
  const { correct, counted, score } = scoreResults(results);
  const dispensado = counted > 0 && score > PROFICIENCY_THRESHOLD;
  const boletim = buildBoletim(attemptId, results, now, plan.version);
  const stoppedBy: StoppedBy = sizeDone ? 'tamanho-maximo' : bankDone ? 'banco-esgotado' : 'erro-padrao';
  const stored: StoredResult = { results, boletim, theta, se, stoppedBy };
  const evidenceId = dispensado ? crypto.randomUUID() : null;
  const summary = `Exame de proficiência: ${correct}/${counted} (${score}%), acima do corte de ${PROFICIENCY_THRESHOLD}%.`;

  const statements = [];
  if (evidenceId) {
    statements.push(
      db
        .prepare(
          `INSERT INTO atlas_evidences (id, content_id, subtopic_id, kind, source_ref, summary, recorded_at)
           SELECT ?1, ?2, NULL, 'proficiencia', ?3, ?4, ?5
           WHERE EXISTS (SELECT 1 FROM atlas_quiz_attempts WHERE id = ?3 AND status = 'em-andamento')`,
        )
        .bind(evidenceId, row.content_id, attemptId, summary, now),
    );
  }
  statements.push(
    db
      .prepare(
        `UPDATE atlas_quiz_attempts
         SET status = 'enviado', submitted_at = ?2, answers_json = ?3, result_json = ?4, score = ?5, passed = ?6, evidence_id = ?7
         WHERE id = ?1 AND status = 'em-andamento' AND questions_json = ?8`,
      )
      .bind(attemptId, now, JSON.stringify(answers), JSON.stringify(stored), score, dispensado ? 1 : 0, evidenceId, previousJson),
  );
  const batchResults = await db.batch(statements);
  const updated = batchResults[batchResults.length - 1];
  if (!updated || updated.meta.changes !== 1) {
    throw new QuizError('A tentativa mudou durante a operação. Tente de novo.', 409);
  }

  if (dispensado) {
    try {
      await applyTransition(
        db,
        {
          entityType: 'conteudo',
          entityId: row.content_id,
          event: 'dispensa-proficiencia',
          actor: 'sistema',
          reason: `${summary} Dispensado sem precisar estudar.`,
          evidenceId,
        },
        { now },
      );
    } catch (error) {
      if (!(error instanceof TransitionError && error.code === 'conflict')) throw error;
    }
  }
  return (await getProficiencyAttempt(db, attemptId))!;
}
