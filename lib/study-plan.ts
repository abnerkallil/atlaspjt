// Qual conteúdo estudar agora (MVP-02). Regra pura sobre o roadmap do D1:
// 1. a sessão aberta mais recente (retomar de onde parou);
// 2. o primeiro conteúdo, na ordem do roadmap, que pede atenção — reaberto por
//    revisão, bloqueado por quiz ou já em estudo;
// 3. o primeiro conteúdo não iniciado cujos pré-requisitos já foram cumpridos.
import type { ContentState } from './pedagogy/states.js';
import type { RoadmapContentView, RoadmapView } from './roadmap-store.js';

export type NextStudy =
  | { kind: 'retomar'; sessionId: string; contentId: string }
  | { kind: 'iniciar'; contentId: string; reason: string };

const NEEDS_ATTENTION: { state: ContentState; reason: string }[] = [
  { state: 'em-revisao-ativa', reason: 'Reaberto após falhar na revisão.' },
  { state: 'bloqueado', reason: 'Bloqueado pelo quiz: estude de novo para refazer.' },
  { state: 'em-estudo', reason: 'Você começou este conteúdo e ainda não encerrou.' },
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
  for (const { state, reason } of NEEDS_ATTENTION) {
    const match = contents.find((content) => content.state === state);
    if (match) return { kind: 'iniciar', contentId: match.id, reason };
  }
  const next = contents.find((content) => content.state === 'nao-iniciado' && !content.locked);
  return next ? { kind: 'iniciar', contentId: next.id, reason: 'Próximo conteúdo liberado do roadmap.' } : null;
}
