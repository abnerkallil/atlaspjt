// Gerador de prompt de roadmap (CG-gerador-roadmap): monta, 100% no cliente e sem
// chamar nenhuma IA, um prompt pronto para colar em ChatGPT/Claude/etc. O prompt
// embute um documento que ensina a IA a devolver o roadmap no mesmo modelo que o
// Atlas usa (lib/roadmap-store.ts, lib/catalog/roadmap-seed.ts): Roadmap > Fases >
// Disciplinas > Conteúdos, com unidades e pré-requisitos em sequência.
// Isso não importa nada no Atlas automaticamente — é só o texto do prompt.

export type RoadmapGoal = 'concurso' | 'conhecimento' | 'trabalho' | 'outro';
export type RoadmapLevel = 'iniciante' | 'intermediario' | 'avancado' | 'especialista';

export const ROADMAP_GOAL_OPTIONS: { value: RoadmapGoal; label: string }[] = [
  { value: 'concurso', label: 'Concurso público' },
  { value: 'conhecimento', label: 'Conhecimento pessoal' },
  { value: 'trabalho', label: 'Trabalho / carreira' },
  { value: 'outro', label: 'Outro objetivo' },
];

export const ROADMAP_LEVEL_OPTIONS: { value: RoadmapLevel; label: string }[] = [
  { value: 'iniciante', label: 'Iniciante — nunca estudei o assunto' },
  { value: 'intermediario', label: 'Intermediário — já tenho uma base' },
  { value: 'avancado', label: 'Avançado — já estudei bastante' },
  { value: 'especialista', label: 'Especialista — quero aprofundar/atualizar' },
];

export type RoadmapPromptInput = {
  topic: string;
  currentLevel: RoadmapLevel;
  targetLevel: RoadmapLevel;
  goal: RoadmapGoal;
  goalDetail: string;
  weeklyHours: string;
  deadline: string;
  constraints: string;
};

export const EMPTY_ROADMAP_PROMPT_INPUT: RoadmapPromptInput = {
  topic: '',
  currentLevel: 'iniciante',
  targetLevel: 'avancado',
  goal: 'conhecimento',
  goalDetail: '',
  weeklyHours: '',
  deadline: '',
  constraints: '',
};

const goalLabel = (goal: RoadmapGoal) => ROADMAP_GOAL_OPTIONS.find((item) => item.value === goal)?.label ?? goal;
const levelLabel = (level: RoadmapLevel) => ROADMAP_LEVEL_OPTIONS.find((item) => item.value === level)?.label ?? level;

// O documento é fixo: descreve o modelo de dados do Atlas para quem só o lê, sem
// depender de nenhum conteúdo do usuário. Mantido como texto único para o prompt
// final ficar um bloco só, fácil de colar.
const ATLAS_ROADMAP_MODEL_DOC = `# Como o Atlas estrutura um roadmap de estudos

Monte o roadmap exatamente nesta hierarquia (é a mesma usada internamente pela plataforma Atlas):

Roadmap
  -> Fases (phases): grandes blocos do roadmap, em ordem. Normalmente uma fase por matéria/área.
    -> Disciplinas (disciplines): dentro de cada fase. No caso mais comum há uma única disciplina por fase, com o mesmo título da fase; use mais de uma só se a fase realmente mistura áreas distintas.
      -> Conteúdos (contents): os itens que a pessoa de fato estuda, em ordem (campo "position"). Cada conteúdo pertence a uma "unidade" (unit) — um agrupamento temático dentro da disciplina (ex.: "Fundamentos", "Operações", "Demonstrações").

Regras de pré-requisito (prerequisites):
- Dentro da MESMA unidade, os conteúdos formam uma cadeia sequencial: o conteúdo na posição N tem como pré-requisito o conteúdo na posição N-1 da mesma unidade. O primeiro conteúdo de cada unidade não tem pré-requisito (ou tem, no máximo, o último conteúdo da unidade anterior, se a transição for didaticamente obrigatória).
- Não crie pré-requisitos cruzados complexos (um conteúdo com vários pré-requisitos de unidades diferentes) a menos que seja estritamente necessário — o modelo favorece cadeias simples e lineares dentro de cada unidade.

Campos de cada nível:
- Roadmap: id (slug curto, kebab-case), title (nome curto), description (1 frase).
- Fase: id (slug), position (1, 2, 3…), title, summary (1 frase do que a fase cobre).
- Disciplina: id (slug), phaseId (id da fase correspondente), position, title.
- Conteúdo: id (slug curto e estável, ex. "fund-001"), disciplineId, position (sequencial dentro da disciplina), unit (nome da unidade), title (nome do conteúdo, curto e específico — não um título genérico), keywords (uma frase com os subtemas/palavras-chave que esse conteúdo cobre, separados por vírgula).
- Pré-requisito: contentId, prerequisiteId (ambos ids de conteúdos já definidos).

Formato de saída obrigatório:
1. Primeiro, devolva APENAS um bloco de código JSON (sem comentários dentro do JSON) com exatamente este formato:

\`\`\`json
{
  "roadmap": { "id": "...", "title": "...", "description": "..." },
  "phases": [ { "id": "...", "position": 1, "title": "...", "summary": "..." } ],
  "disciplines": [ { "id": "...", "phaseId": "...", "position": 1, "title": "..." } ],
  "contents": [ { "id": "...", "disciplineId": "...", "position": 1, "unit": "...", "title": "...", "keywords": "..." } ],
  "prerequisites": [ { "contentId": "...", "prerequisiteId": "..." } ]
}
\`\`\`

2. Depois do JSON, acrescente um resumo curto em texto (poucas frases) explicando a lógica da ordem escolhida — mas NUNCA repita a estrutura em outro formato (sem tabelas, sem listas markdown do roadmap) fora do JSON.
3. Não invente níveis extras na hierarquia e não pule nenhum campo listado acima.
4. Escreva todo o conteúdo (títulos, resumos, keywords) em português do Brasil.`;

function buildRequestSection(input: RoadmapPromptInput): string {
  const lines = [
    `- O que a pessoa quer aprender: ${input.topic.trim()}`,
    `- Nível atual: ${levelLabel(input.currentLevel)}`,
    `- Nível que quer atingir: ${levelLabel(input.targetLevel)}`,
    `- Objetivo: ${goalLabel(input.goal)}${input.goalDetail.trim() ? ` — ${input.goalDetail.trim()}` : ''}`,
  ];
  if (input.weeklyHours.trim()) lines.push(`- Disponibilidade: cerca de ${input.weeklyHours.trim()} horas por semana`);
  if (input.deadline.trim()) lines.push(`- Prazo desejado: ${input.deadline.trim()}`);
  if (input.constraints.trim()) lines.push(`- Observações/restrições adicionais: ${input.constraints.trim()}`);
  return lines.join('\n');
}

// Única função pública: recebe o que a pessoa preencheu e devolve o texto final do
// prompt, pronto para colar em qualquer IA de texto. Determinística — mesma
// entrada sempre gera o mesmo prompt.
export function buildRoadmapPrompt(input: RoadmapPromptInput): string {
  return `Você é um especialista em design curricular. Monte um roadmap de estudos completo e realista para a pessoa abaixo, seguindo RIGOROSAMENTE o modelo de dados descrito a seguir — é o mesmo modelo que a plataforma de estudos Atlas usa para todos os roadmaps dela.

${ATLAS_ROADMAP_MODEL_DOC}

## O que a pessoa pediu

${buildRequestSection(input)}

Monte o roadmap do zero para esse objetivo (ele não precisa ter relação com nenhum roadmap existente do Atlas). Cubra do nível atual até o nível desejado, com fases, unidades e conteúdos específicos — nada de títulos vagos como "Introdução" sem dizer a que. Responda só com o JSON no formato pedido e, depois dele, o resumo curto da lógica.`;
}
