import type { ApacheConcept, RenderedLesson } from "./schema.js";

// Lógica pura do polling de ContentLesson (APA-04) — sem fetch, sem DOM, sem
// React, para poder ser testada com node:test (o repo não tem jsdom/Testing
// Library para testar o componente em si).

export type LessonStatus = "pendente" | "gerando" | "gerada" | "reportada" | "erro";

// `enrichment` (APA-07): diff do enriquecimento concluído contra a aula
// atual, calculado na leitura (schema.ts: diffEnrichmentAgainstLesson),
// nunca gravado. O componente ContentLesson (APA-04) ainda não exibe este
// campo — fica pronto para o card que adicionar esse bloco na UI.
export type LessonEnrichmentDiff = {
  status: "concluido";
  novos: ApacheConcept[];
  reforcos: { conceitoId: string; texto: string }[];
};

export type LessonResponse = {
  status: LessonStatus;
  lesson?: RenderedLesson;
  enrichment?: LessonEnrichmentDiff;
  errorMessage?: string;
};

// Enquanto a API do APA-07 não existe, toda sessão de estudo recebe 404 daqui
// — não é um erro para mostrar, é "funcionalidade ainda não disponível":
// a tela não deve exibir nada (nem o card .al-*).
export const MAX_POLL_ATTEMPTS = 120; // 120 x 5s ≈ 10 minutos

export type LessonPollOutcome =
  | { kind: "hidden" }
  | { kind: "data"; data: LessonResponse; continuePolling: boolean }
  | { kind: "error"; message: string };

const TERMINAL_STATUSES: LessonStatus[] = ["gerada", "reportada", "erro"];

export function resolvePollOutcome(
  is404: boolean,
  body: LessonResponse | null,
  attempts: number,
): LessonPollOutcome {
  if (is404) return { kind: "hidden" };
  if (!body) {
    return { kind: "error", message: "Não foi possível carregar a aula." };
  }
  const needsLesson = body.status === "gerada" || body.status === "reportada";
  if (needsLesson && !body.lesson) {
    return { kind: "error", message: "Não foi possível carregar esta aula agora. Tente de novo mais tarde." };
  }
  const terminal = TERMINAL_STATUSES.includes(body.status);
  const continuePolling = !terminal && attempts < MAX_POLL_ATTEMPTS;
  return { kind: "data", data: body, continuePolling };
}
