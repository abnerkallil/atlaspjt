// Qual o próximo passo de estudo (MVP-02, revisto na UX-06). Regra pura sobre o roadmap do D1:
// 1. a sessão aberta mais recente (retomar de onde parou);
// 2. o primeiro conteúdo, na ordem do roadmap, que pede atenção: quiz a refazer
//    (corretivo ou reprovado), quiz liberado, revisão vencida ou estudo já começado;
// 3. o primeiro conteúdo não iniciado cujos pré-requisitos já foram cumpridos.
import type { ContentState } from './pedagogy/states.js';
import type { RoadmapContentView, RoadmapView } from './roadmap-store.js';

export type NextStudy =
  | { kind: 'retomar'; sessionId: string; contentId: string }
  | { kind: 'iniciar'; contentId: string; reason: string }
  // Próximo passo é um quiz (/quizzes?conteudo=); estudar antes é opcional quando
  // `canStudy` (conteúdo reprovado: revisar as notas antes de refazer).
  | { kind: 'quiz'; contentId: string; reason: string; label: string; canStudy: boolean };

type Attention =
  | { state: ContentState; kind: 'quiz'; reason: string; label: string; canStudy: boolean }
  | { state: ContentState; kind: 'iniciar'; reason: string };

const NEEDS_ATTENTION: Attention[] = [
  {
    state: 'em-revisao-ativa',
    kind: 'quiz',
    label: 'Fazer o quiz corretivo',
    reason: 'Falhou na revisão: passe no quiz corretivo para revalidar o conteúdo.',
    canStudy: true,
  },
  {
    state: 'bloqueado',
    kind: 'quiz',
    label: 'Refazer o quiz',
    reason: 'Reprovado no quiz: refaça até passar com 70% (revise as notas antes, se quiser). O próximo conteúdo espera.',
    canStudy: true,
  },
  { state: 'aguardando-quiz', kind: 'quiz', label: 'Fazer o quiz', reason: 'Sessão concluída: o quiz confirma o conteúdo.', canStudy: false },
  { state: 'aguardando-revisao', kind: 'quiz', label: 'Fazer a revisão', reason: 'A revisão espaçada venceu: o quiz de revisão mantém o conteúdo firme.', canStudy: false },
  { state: 'em-estudo', kind: 'iniciar', reason: 'Você começou este conteúdo e ainda não encerrou.' },
];

export function roadmapContents(roadmap: RoadmapView | null): (RoadmapContentView & {
  disciplineId: string;
  disciplineTitle: string;
})[] {
  if (!roadmap) return [];
  return roadmap.phases.flatMap((phase) =>
    phase.disciplines.flatMap((discipline) =>
      discipline.contents.map((content) => ({
        ...content,
        disciplineId: discipline.id,
        disciplineTitle: discipline.title,
      })),
    ),
  );
}

export function pickNextStudy(
  roadmap: RoadmapView | null,
  openSessions: { id: string; contentId: string }[],
): NextStudy | null {
  const [open] = openSessions;
  if (open) return { kind: 'retomar', sessionId: open.id, contentId: open.contentId };
  const contents = roadmapContents(roadmap);
  for (const item of NEEDS_ATTENTION) {
    const match = contents.find((content) => content.state === item.state);
    if (!match) continue;
    return item.kind === 'quiz'
      ? { kind: 'quiz', contentId: match.id, reason: item.reason, label: item.label, canStudy: item.canStudy }
      : { kind: 'iniciar', contentId: match.id, reason: item.reason };
  }
  const next = contents.find((content) => content.state === 'nao-iniciado' && !content.locked);
  return next ? { kind: 'iniciar', contentId: next.id, reason: 'Próximo conteúdo liberado do roadmap.' } : null;
}
