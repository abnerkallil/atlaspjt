// Leitura do roadmap persistido no D1 (TEC-04): hierarquia do DEC-05 com o
// estado atual de cada conteúdo (DEC-03). Só leitura; mudanças de estado passam
// por lib/pedagogy/transitions.ts, que grava a auditoria.
import { INITIAL_CONTENT_STATE, isContentState, type ContentState } from './pedagogy/states.js';
import { isPrerequisiteMet, pendingPrerequisites } from './pedagogy/prerequisites.js';
import type { D1Like } from './pedagogy/transitions.js';

export type RoadmapContentView = {
  id: string;
  position: number;
  unit: string | null;
  title: string;
  keywords: string | null;
  estimatedMinutes: number | null;
  state: ContentState;
  stateUpdatedAt: string | null;
  prerequisites: string[];
  // MVP-01: pré-requisitos ainda não cumpridos; "locked" quando isso impede começar.
  pendingPrerequisites: string[];
  locked: boolean;
};

export type RoadmapProgress = { total: number; completed: number; percent: number };
export type RoadmapDisciplineView = {
  id: string;
  position: number;
  title: string;
  progress: RoadmapProgress;
  contents: RoadmapContentView[];
};
export type RoadmapPhaseView = {
  id: string;
  position: number;
  title: string;
  summary: string | null;
  progress: RoadmapProgress;
  disciplines: RoadmapDisciplineView[];
};
export type RoadmapView = { id: string; title: string; description: string | null; phases: RoadmapPhaseView[] };

type ContentRow = {
  id: string;
  phase_id: string;
  phase_position: number;
  phase_title: string;
  phase_summary: string | null;
  discipline_id: string;
  discipline_position: number;
  discipline_title: string;
  position: number;
  unit: string | null;
  title: string;
  keywords: string | null;
  estimated_minutes: number | null;
  state: string | null;
  state_updated_at: string | null;
};

// MVP: um único roadmap curado (DEC-05); devolve o mais antigo se houver mais.
export async function getRoadmap(db: D1Like): Promise<RoadmapView | null> {
  const roadmap = await db
    .prepare('SELECT id, title, description FROM atlas_roadmaps ORDER BY created_at, id LIMIT 1')
    .first<{ id: string; title: string; description: string | null }>();
  if (!roadmap) return null;

  const [{ results: rows }, { results: edges }] = await Promise.all([
    db
      .prepare(
        `SELECT c.id, p.id AS phase_id, p.position AS phase_position, p.title AS phase_title, p.summary AS phase_summary,
                d.id AS discipline_id, d.position AS discipline_position, d.title AS discipline_title,
                c.position, c.unit, c.title, c.keywords, c.estimated_minutes,
                s.state, s.updated_at AS state_updated_at
         FROM atlas_phases p
         JOIN atlas_disciplines d ON d.phase_id = p.id
         JOIN atlas_contents c ON c.discipline_id = d.id
         LEFT JOIN atlas_content_states s ON s.content_id = c.id
         WHERE p.roadmap_id = ?1
         ORDER BY p.position, d.position, c.position`,
      )
      .bind(roadmap.id)
      .all<ContentRow>(),
    db
      .prepare(
        `SELECT r.content_id, r.prerequisite_id FROM atlas_content_prerequisites r
         JOIN atlas_contents c ON c.id = r.content_id
         JOIN atlas_disciplines d ON d.id = c.discipline_id
         JOIN atlas_phases p ON p.id = d.phase_id
         WHERE p.roadmap_id = ?1
         ORDER BY r.content_id, r.prerequisite_id`,
      )
      .bind(roadmap.id)
      .all<{ content_id: string; prerequisite_id: string }>(),
  ]);

  const prerequisites = new Map<string, string[]>();
  for (const edge of edges) {
    prerequisites.set(edge.content_id, [...(prerequisites.get(edge.content_id) ?? []), edge.prerequisite_id]);
  }

  const phases: RoadmapPhaseView[] = [];
  for (const row of rows) {
    let phase = phases.at(-1);
    if (phase?.id !== row.phase_id) {
      phase = {
        id: row.phase_id,
        position: row.phase_position,
        title: row.phase_title,
        summary: row.phase_summary,
        progress: EMPTY_PROGRESS,
        disciplines: [],
      };
      phases.push(phase);
    }
    let discipline = phase.disciplines.at(-1);
    if (discipline?.id !== row.discipline_id) {
      discipline = {
        id: row.discipline_id,
        position: row.discipline_position,
        title: row.discipline_title,
        progress: EMPTY_PROGRESS,
        contents: [],
      };
      phase.disciplines.push(discipline);
    }
    discipline.contents.push({
      id: row.id,
      position: row.position,
      unit: row.unit,
      title: row.title,
      keywords: row.keywords,
      estimatedMinutes: row.estimated_minutes,
      state: row.state && isContentState(row.state) ? row.state : INITIAL_CONTENT_STATE,
      stateUpdatedAt: row.state_updated_at,
      prerequisites: prerequisites.get(row.id) ?? [],
      pendingPrerequisites: [],
      locked: false,
    });
  }

  const stateById = new Map<string, ContentState>();
  for (const phase of phases) {
    for (const discipline of phase.disciplines) {
      for (const content of discipline.contents) stateById.set(content.id, content.state);
    }
  }
  for (const phase of phases) {
    for (const discipline of phase.disciplines) {
      for (const content of discipline.contents) {
        content.pendingPrerequisites = pendingPrerequisites(
          content.prerequisites,
          (id) => stateById.get(id) ?? INITIAL_CONTENT_STATE,
        );
        content.locked = content.state === INITIAL_CONTENT_STATE && content.pendingPrerequisites.length > 0;
      }
      discipline.progress = progressOf(discipline.contents);
    }
    phase.progress = progressOf(phase.disciplines.flatMap((discipline) => discipline.contents));
  }
  return { ...roadmap, phases };
}

const EMPTY_PROGRESS: RoadmapProgress = { total: 0, completed: 0, percent: 0 };

// Progresso bruto: fração de conteúdos cumpridos. Pesos e penalidades são do MVP-07/08.
function progressOf(contents: RoadmapContentView[]): RoadmapProgress {
  const completed = contents.filter((content) => isPrerequisiteMet(content.state)).length;
  return {
    total: contents.length,
    completed,
    percent: contents.length ? Math.round((completed / contents.length) * 100) : 0,
  };
}
