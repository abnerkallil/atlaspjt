// Pure "mapa de cobertura" calculation: what fraction of the official
// content catalog already has at least one note linked to it, per subject.
//
// This is a demonstrative UX ratio, not the real pedagogical coverage
// calculation (that belongs to MVP-07/TEC-02, out of scope here) — see
// QUEST-007's Required Behavior.

export type CoverageCatalogItem = { id: string; subject: string };
export type CoverageNoteLink = { contentId: string };
export type CoverageNote = { links: CoverageNoteLink[] };

export type SubjectCoverage = {
  subject: string;
  total: number;
  covered: number;
  ratio: number;
};

export function computeContentCoverage(
  notes: CoverageNote[],
  catalog: CoverageCatalogItem[],
): SubjectCoverage[] {
  const coveredIds = new Set<string>();
  for (const note of notes) {
    for (const link of note.links) coveredIds.add(link.contentId);
  }

  const bySubject = new Map<string, { total: number; covered: number }>();
  for (const item of catalog) {
    const entry = bySubject.get(item.subject) ?? { total: 0, covered: 0 };
    entry.total += 1;
    if (coveredIds.has(item.id)) entry.covered += 1;
    bySubject.set(item.subject, entry);
  }

  return [...bySubject.entries()]
    .map(([subject, { total, covered }]) => ({
      subject,
      total,
      covered,
      ratio: total === 0 ? 0 : covered / total,
    }))
    .sort((a, b) => a.subject.localeCompare(b.subject, 'pt-BR'));
}

export function computeOverallCoverage(bySubject: SubjectCoverage[]): {
  total: number;
  covered: number;
  ratio: number;
} {
  const total = bySubject.reduce((sum, entry) => sum + entry.total, 0);
  const covered = bySubject.reduce((sum, entry) => sum + entry.covered, 0);
  return { total, covered, ratio: total === 0 ? 0 : covered / total };
}
