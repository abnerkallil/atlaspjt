// Tipos do Apolo (DEC-014). Tema é etiqueta de texto livre (nunca enum fixo —
// o banco de questões é universal, DEC-014 Eixo 2); dificuldade e Bloom usam
// conjuntos fixos pequenos porque são taxonomias externas conhecidas, não
// "universais/abertas por definição" como tema.
//
// QUESTION_KINDS/QuestionKind e QUIZ_SIZE/QUESTION_SECONDS (DEC-10) moram
// aqui desde o APO-14: `lib/quizzes.ts` precisou passar a importar
// `lib/apolo/plans.ts` e `lib/apolo/selector.ts` (para usar o seletor no
// startQuiz), e esses dois já importavam essas constantes de volta de
// `lib/quizzes.ts` — um ciclo de import em runtime. Aqui nenhum dos dois
// lados do ciclo depende do outro; `lib/quizzes.ts` as reexporta com os
// mesmos nomes, então nenhum chamador existente mudou.
export const QUESTION_KINDS = [
  'multipla',
  'dissertativa',
  'calculo',
  'certo_errado',
  'lacuna_numerica',
] as const;
export type QuestionKind = (typeof QUESTION_KINDS)[number];

// DEC-10: quiz de nota com 10 questões; 1 min por múltipla escolha; até 5 min
// por dissertativa; cálculo sem limite.
export const QUIZ_SIZE = 10;
export const QUESTION_SECONDS: Record<QuestionKind, number | null> = {
  multipla: 60,
  dissertativa: 300,
  calculo: null,
  certo_errado: 60,
  lacuna_numerica: null,
};

export const BLOOM_LEVELS = [
  'lembrar',
  'entender',
  'aplicar',
  'analisar',
  'avaliar',
  'criar',
] as const;
export type BloomLevel = (typeof BLOOM_LEVELS)[number];

export const DIFFICULTY_LEVELS = ['facil', 'media', 'dificil'] as const;
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

// Ciclo de vida (DEC-014): Apolo só seleciona/expande itens em 'ativa'.
export const LIFECYCLE_STATES = ['rascunho', 'curadoria', 'ativa', 'aposentada'] as const;
export type LifecycleState = (typeof LIFECYCLE_STATES)[number];

export function isLifecycleState(value: string): value is LifecycleState {
  return (LIFECYCLE_STATES as readonly string[]).includes(value);
}

// Campos que o Apolo acrescenta a `atlas_questions` (migração aditiva,
// DEC-014); os campos pré-existentes continuam em lib/quizzes.ts.
export type QuestionApoloFields = {
  theme: string | null;
  bloomLevel: BloomLevel | null;
  difficultyNominal: DifficultyLevel | null;
  lifecycleState: LifecycleState;
  itemModelId: string | null;
};

// Molde (item model, DEC-014): dado curado que parametriza um gerador
// determinístico em código (lib/apolo/generators.ts). O molde nunca contém a
// lógica de geração, só os parâmetros dela.
export type ItemModel = {
  id: string;
  theme: string;
  title: string;
  kind: QuestionKind;
  generatorKey: string;
  // Formato específico de cada generatorKey; validado pelo gerador, não aqui.
  params: Record<string, unknown>;
  bloomLevel: BloomLevel | null;
  difficultyNominal: DifficultyLevel | null;
  lifecycleState: LifecycleState;
  curatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type ItemModelRow = {
  id: string;
  theme: string;
  title: string;
  kind: string;
  generator_key: string;
  params_json: string;
  bloom_level: string | null;
  difficulty_nominal: string | null;
  lifecycle_state: string;
  curated_by: string;
  created_at: string;
  updated_at: string;
};

export function itemModelFromRow(row: ItemModelRow): ItemModel {
  const lifecycleState = isLifecycleState(row.lifecycle_state)
    ? row.lifecycle_state
    : 'rascunho';
  return {
    id: row.id,
    theme: row.theme,
    title: row.title,
    kind: row.kind as QuestionKind,
    generatorKey: row.generator_key,
    params: JSON.parse(row.params_json) as Record<string, unknown>,
    bloomLevel: (row.bloom_level as BloomLevel | null) ?? null,
    difficultyNominal: (row.difficulty_nominal as DifficultyLevel | null) ?? null,
    lifecycleState,
    curatedBy: row.curated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
