// Carga do catálogo curado da planilha no D1 (TEC-04 / DEC-010).
// Estrutura escolhida pelo Abner em 2026-10-06: uma fase por matéria (cada fase
// com uma disciplina de mesmo nome) e pré-requisitos em sequência dentro de cada
// unidade da planilha. A planilha só cura o catálogo; estado e progresso nunca
// saem daqui (ficam em atlas_content_states / atlas_state_audit).
import { CONTENT_CATALOG_SNAPSHOT_DATE, contentCatalog, type ContentReference } from '../content-catalog.js';

export const CATALOG_ROADMAP_ID = 'atlas-contabil';

const SUBJECTS: { subject: ContentReference['subject']; phaseId: string; disciplineId: string; summary: string }[] = [
  {
    subject: 'Contabilidade Geral',
    phaseId: 'fase-contabilidade-geral',
    disciplineId: 'contabilidade-geral',
    summary: 'Fundamentos, mecânica contábil, operações e demonstrações.',
  },
  {
    subject: 'Contabilidade Tributária',
    phaseId: 'fase-contabilidade-tributaria',
    disciplineId: 'contabilidade-tributaria',
    summary: 'Regimes de tributação, tributos, obrigações e reforma tributária.',
  },
];

export type CatalogRoadmap = {
  roadmap: { id: string; title: string; description: string };
  phases: { id: string; position: number; title: string; summary: string }[];
  disciplines: { id: string; phaseId: string; position: number; title: string }[];
  contents: { id: string; disciplineId: string; position: number; unit: string; title: string; keywords: string }[];
  prerequisites: { contentId: string; prerequisiteId: string }[];
};

export function buildCatalogRoadmap(catalog: ContentReference[] = contentCatalog): CatalogRoadmap {
  const result: CatalogRoadmap = {
    roadmap: {
      id: CATALOG_ROADMAP_ID,
      title: 'Contabilidade',
      description: 'Roadmap curado a partir do catálogo oficial da planilha Atlas.',
    },
    phases: [],
    disciplines: [],
    contents: [],
    prerequisites: [],
  };
  SUBJECTS.forEach((entry, index) => {
    result.phases.push({ id: entry.phaseId, position: index + 1, title: entry.subject, summary: entry.summary });
    result.disciplines.push({ id: entry.disciplineId, phaseId: entry.phaseId, position: 1, title: entry.subject });
    let previous: ContentReference | undefined;
    catalog
      .filter((item) => item.subject === entry.subject)
      .forEach((item, position) => {
        result.contents.push({
          id: item.id,
          disciplineId: entry.disciplineId,
          position: position + 1,
          unit: item.unit,
          title: item.title,
          keywords: item.keywords,
        });
        if (previous && previous.unit === item.unit) {
          result.prerequisites.push({ contentId: item.id, prerequisiteId: previous.id });
        }
        previous = item;
      });
  });
  return result;
}

const q = (value: string | number) => (typeof value === 'number' ? String(value) : `'${value.replaceAll("'", "''")}'`);

// SQL idempotente: cria o que falta e atualiza títulos/ordem do que já existe,
// sem tocar em estado, evidência ou auditoria.
export function catalogSeedSql(now: string, roadmap: CatalogRoadmap = buildCatalogRoadmap()): string {
  const lines = [
    '-- Gerado por `pnpm run db:catalog` a partir de lib/content-catalog.ts (TEC-04).',
    '-- Não edite à mão: o teste tests/catalog-roadmap.test.ts compara com o gerador.',
    `INSERT INTO atlas_roadmaps (id, title, description, origin, created_at, updated_at) VALUES (${q(roadmap.roadmap.id)}, ${q(roadmap.roadmap.title)}, ${q(roadmap.roadmap.description)}, 'curado', ${q(now)}, ${q(now)}) ON CONFLICT(id) DO UPDATE SET title = excluded.title, description = excluded.description, updated_at = excluded.updated_at;`,
  ];
  for (const phase of roadmap.phases) {
    lines.push(
      `INSERT INTO atlas_phases (id, roadmap_id, position, title, summary) VALUES (${q(phase.id)}, ${q(roadmap.roadmap.id)}, ${phase.position}, ${q(phase.title)}, ${q(phase.summary)}) ON CONFLICT(id) DO UPDATE SET position = excluded.position, title = excluded.title, summary = excluded.summary;`,
    );
  }
  for (const discipline of roadmap.disciplines) {
    lines.push(
      `INSERT INTO atlas_disciplines (id, phase_id, position, title) VALUES (${q(discipline.id)}, ${q(discipline.phaseId)}, ${discipline.position}, ${q(discipline.title)}) ON CONFLICT(id) DO UPDATE SET position = excluded.position, title = excluded.title;`,
    );
  }
  for (const content of roadmap.contents) {
    lines.push(
      `INSERT INTO atlas_contents (id, discipline_id, position, unit, title, keywords) VALUES (${q(content.id)}, ${q(content.disciplineId)}, ${content.position}, ${q(content.unit)}, ${q(content.title)}, ${q(content.keywords)}) ON CONFLICT(id) DO UPDATE SET discipline_id = excluded.discipline_id, position = excluded.position, unit = excluded.unit, title = excluded.title, keywords = excluded.keywords;`,
    );
  }
  for (const edge of roadmap.prerequisites) {
    lines.push(
      `INSERT OR IGNORE INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES (${q(edge.contentId)}, ${q(edge.prerequisiteId)});`,
    );
  }
  return `${lines.join('\n--> statement-breakpoint\n')}\n`;
}

// Migration que carrega o catálogo; o carimbo de data é a data do snapshot da
// planilha, para que a geração seja determinística.
export const CATALOG_SEED_MIGRATION = '0005_catalog_seed';

export function catalogSeedMigrationSql(): string {
  return catalogSeedSql(`${CONTENT_CATALOG_SNAPSHOT_DATE}T00:00:00.000Z`);
}
