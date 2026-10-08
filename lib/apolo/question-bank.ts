// Banco de questões v2 (APO-03, DEC-014): campos que o Apolo acrescenta a
// `atlas_questions` além da fundação do APO-01 — subtópico, dimensão de
// conhecimento, proveniência (curada/oficial/molde), dados de prova oficial,
// fonte no R2 e hash do enunciado para detectar duplicatas.
export const KNOWLEDGE_TYPES = ['factual', 'conceitual', 'procedimental', 'metacognitivo'] as const;
export type KnowledgeType = (typeof KNOWLEDGE_TYPES)[number];

export const QUESTION_ORIGINS = ['curada', 'oficial', 'molde'] as const;
export type QuestionOrigin = (typeof QUESTION_ORIGINS)[number];

export type QuestionBankFields = {
  subtopicId: string | null;
  knowledgeType: KnowledgeType | null;
  origin: QuestionOrigin | null;
  examBoard: string | null;
  examOrg: string | null;
  examYear: number | null;
  sourceObjectKey: string | null;
  textHash: string | null;
  // Chave é o índice da alternativa (como string, por ser chave de objeto JSON).
  optionExplanations: Record<string, string> | null;
};

// FNV-1a de 32 bits: rápido, determinístico e suficiente para detectar
// duplicatas exatas de enunciado — não precisa ser criptográfico (não há
// ameaça de colisão adversária aqui, só repetição acidental na curadoria).
export function hashQuestionText(text: string): string {
  const normalized = text.trim().toLowerCase().replace(/\s+/g, ' ');
  let hash = 0x811c9dc5;
  for (let i = 0; i < normalized.length; i += 1) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
