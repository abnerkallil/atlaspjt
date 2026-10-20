export type ApacheLesson = {
  v: 1;
  obj: string; // objetivo da aula, 1 frase
  cc: ApacheConcept[]; // conceitos
  rl: ApacheRelation[]; // relações entre conceitos (pode ser [])
  fm: ApacheFormula[]; // fórmulas (pode ser [])
  ex: ApacheExample[]; // exemplos práticos
  pg: string[]; // pegadinhas de prova
  rs: string; // resumo final
};
export type ApacheConcept = { id: string; nome: string; def: string };
export type ApacheRelation = { de: string; para: string; tipo: string };
export type ApacheFormula = { id: string; expr: string; legenda: string };
export type ApacheExample = { conceitoId: string; texto: string };

// "Ficha" extraída do material do aluno (lib/apache/*: o que é gravado em
// atlas_apache_enrichments.object_key) — guardada INDEPENDENTE da versão da
// aula (ver Gate APA-01 pergunta 2). Ainda não comparada com nada.
export type ApacheEnrichment = {
  v: 1;
  conceitos: ApacheConcept[]; // tudo que a IA extraiu do material
  irrelevante: boolean;
};

// Resultado comparado com a aula atual — calculado NA LEITURA, nunca gravado.
export type ApacheEnrichmentDiff = {
  novos: ApacheConcept[];
  reforcos: { conceitoId: string; texto: string }[];
};

export class ApacheError extends Error {}

// Gate APA-14 item 6: teto de tamanho por campo, para uma resposta de IA
// maliciosa ou malformada não gravar strings sem limite no R2/D1 para sempre.
const MAX_FIELD_CHARS = 2000;
const MAX_LIST_ITEMS = 20;

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function checkField(value: unknown, field: string): string {
  if (!isString(value)) {
    throw new ApacheError(`campo "${field}" ausente ou não é string`);
  }
  if (value.length > MAX_FIELD_CHARS) {
    throw new ApacheError(`campo "${field}" excede ${MAX_FIELD_CHARS} caracteres`);
  }
  return value;
}

function checkList(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new ApacheError(`campo "${field}" ausente ou não é lista`);
  }
  if (value.length > MAX_LIST_ITEMS) {
    throw new ApacheError(`campo "${field}" excede ${MAX_LIST_ITEMS} itens`);
  }
  return value;
}

function checkConcept(value: unknown, field: string): ApacheConcept {
  if (typeof value !== "object" || value === null) {
    throw new ApacheError(`item de "${field}" inválido`);
  }
  const v = value as Record<string, unknown>;
  return {
    id: checkField(v.id, `${field}.id`),
    nome: checkField(v.nome, `${field}.nome`),
    def: checkField(v.def, `${field}.def`),
  };
}

function checkRelation(value: unknown, field: string): ApacheRelation {
  if (typeof value !== "object" || value === null) {
    throw new ApacheError(`item de "${field}" inválido`);
  }
  const v = value as Record<string, unknown>;
  return {
    de: checkField(v.de, `${field}.de`),
    para: checkField(v.para, `${field}.para`),
    tipo: checkField(v.tipo, `${field}.tipo`),
  };
}

function checkFormula(value: unknown, field: string): ApacheFormula {
  if (typeof value !== "object" || value === null) {
    throw new ApacheError(`item de "${field}" inválido`);
  }
  const v = value as Record<string, unknown>;
  return {
    id: checkField(v.id, `${field}.id`),
    expr: checkField(v.expr, `${field}.expr`),
    legenda: checkField(v.legenda, `${field}.legenda`),
  };
}

function checkExample(value: unknown, field: string): ApacheExample {
  if (typeof value !== "object" || value === null) {
    throw new ApacheError(`item de "${field}" inválido`);
  }
  const v = value as Record<string, unknown>;
  return {
    conceitoId: checkField(v.conceitoId, `${field}.conceitoId`),
    texto: checkField(v.texto, `${field}.texto`),
  };
}

export function validateLesson(data: unknown): ApacheLesson {
  if (typeof data !== "object" || data === null) {
    throw new ApacheError("aula inválida: não é um objeto");
  }
  const d = data as Record<string, unknown>;
  if (d.v !== 1) {
    throw new ApacheError('campo "v" ausente ou diferente de 1');
  }
  return {
    v: 1,
    obj: checkField(d.obj, "obj"),
    cc: checkList(d.cc, "cc").map((c) => checkConcept(c, "cc")),
    rl: checkList(d.rl, "rl").map((r) => checkRelation(r, "rl")),
    fm: checkList(d.fm, "fm").map((f) => checkFormula(f, "fm")),
    ex: checkList(d.ex, "ex").map((e) => checkExample(e, "ex")),
    pg: checkList(d.pg, "pg").map((p, i) => checkField(p, `pg[${i}]`)),
    rs: checkField(d.rs, "rs"),
  };
}

export function validateEnrichment(data: unknown): ApacheEnrichment {
  if (typeof data !== "object" || data === null) {
    throw new ApacheError("ficha inválida: não é um objeto");
  }
  const d = data as Record<string, unknown>;
  if (d.v !== 1) {
    throw new ApacheError('campo "v" ausente ou diferente de 1');
  }
  if (typeof d.irrelevante !== "boolean") {
    throw new ApacheError('campo "irrelevante" ausente ou não é booleano');
  }
  return {
    v: 1,
    conceitos: checkList(d.conceitos, "conceitos").map((c) => checkConcept(c, "conceitos")),
    irrelevante: d.irrelevante,
  };
}

// Formato de prosa fixo (sem Markdown nem HTML — strings simples por seção,
// o componente React decide a marcação; ver APA-04):
export type RenderedLesson = {
  objetivo: string;
  conceitos: { titulo: string; corpo: string }[]; // 1 por ApacheConcept
  formulas: { expr: string; legenda: string }[];
  exemplos: string[];
  pegadinhas: string[];
  resumo: string;
};

export function renderLesson(lesson: ApacheLesson): RenderedLesson {
  return {
    objetivo: lesson.obj,
    conceitos: lesson.cc.map((c) => ({ titulo: c.nome, corpo: c.def })),
    formulas: lesson.fm.map((f) => ({ expr: f.expr, legenda: f.legenda })),
    exemplos: lesson.ex.map((e) => e.texto),
    pegadinhas: lesson.pg,
    resumo: lesson.rs,
  };
}

function normalizeName(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

// Compara a ficha extraída (ApacheEnrichment) contra a aula ATUAL — pura, sem
// IA, sem neurons. Chamada na leitura (GET /api/apache/aulas/:contentId,
// APA-07), nunca no momento de gravar a ficha (APA-12). Nome igual
// (normalizado) e def idêntica → ignora (já existe). Nome igual e def
// diferente → vira `reforcos`. Nome novo → vira `novos`.
export function diffEnrichmentAgainstLesson(
  lesson: ApacheLesson,
  ficha: ApacheEnrichment,
): ApacheEnrichmentDiff {
  const existentes = new Map(lesson.cc.map((c) => [normalizeName(c.nome), c]));
  const novos: ApacheConcept[] = [];
  const reforcos: { conceitoId: string; texto: string }[] = [];
  for (const concept of ficha.conceitos) {
    const existing = existentes.get(normalizeName(concept.nome));
    if (!existing) {
      novos.push(concept);
      continue;
    }
    if (existing.def.trim() !== concept.def.trim()) {
      reforcos.push({ conceitoId: existing.id, texto: concept.def });
    }
  }
  return { novos, reforcos };
}
