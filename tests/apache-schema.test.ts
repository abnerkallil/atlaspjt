import assert from "node:assert/strict";
import test from "node:test";
import {
  ApacheError,
  diffEnrichmentAgainstLesson,
  renderLesson,
  validateEnrichment,
  validateLesson,
  type ApacheEnrichment,
  type ApacheLesson,
} from "../lib/apache/schema.js";

function baseLesson(overrides: Partial<ApacheLesson> = {}): unknown {
  return {
    v: 1,
    obj: "Entender o conceito X",
    cc: [{ id: "c1", nome: "Conceito X", def: "Definição de X" }],
    rl: [],
    fm: [],
    ex: [],
    pg: [],
    rs: "Resumo da aula",
    ...overrides,
  };
}

void test("APA-03: aula sem obj é rejeitada", () => {
  const data = baseLesson();
  delete (data as Record<string, unknown>).obj;
  assert.throws(() => validateLesson(data), ApacheError);
});

void test("APA-03: aula sem cc é rejeitada", () => {
  const data = baseLesson();
  delete (data as Record<string, unknown>).cc;
  assert.throws(() => validateLesson(data), ApacheError);
});

void test("APA-03: aula válida é aceita e renderLesson mapeia direto", () => {
  const lesson = validateLesson(
    baseLesson({
      fm: [{ id: "f1", expr: "a+b", legenda: "soma" }],
      ex: [{ conceitoId: "c1", texto: "exemplo prático" }],
      pg: ["pegadinha 1"],
    }),
  );
  const rendered = renderLesson(lesson);
  assert.equal(rendered.objetivo, "Entender o conceito X");
  assert.deepEqual(rendered.conceitos, [{ titulo: "Conceito X", corpo: "Definição de X" }]);
  assert.deepEqual(rendered.formulas, [{ expr: "a+b", legenda: "soma" }]);
  assert.deepEqual(rendered.exemplos, ["exemplo prático"]);
  assert.deepEqual(rendered.pegadinhas, ["pegadinha 1"]);
  assert.equal(rendered.resumo, "Resumo da aula");
});

void test("APA-03: campo acima do teto de tamanho é rejeitado", () => {
  const data = baseLesson({ obj: "x".repeat(2001) });
  assert.throws(() => validateLesson(data), ApacheError);
});

void test("APA-03: lista acima do teto de itens é rejeitada", () => {
  const data = baseLesson({
    pg: Array.from({ length: 21 }, (_, i) => `pegadinha ${i}`),
  });
  assert.throws(() => validateLesson(data), ApacheError);
});

void test("APA-03: ficha sem irrelevante é rejeitada", () => {
  const data: unknown = { v: 1, conceitos: [] };
  assert.throws(() => validateEnrichment(data), ApacheError);
});

void test("APA-03: ficha válida é aceita", () => {
  const enrichment = validateEnrichment({
    v: 1,
    irrelevante: false,
    conceitos: [{ id: "e1", nome: "Novo conceito", def: "Definição nova" }],
  });
  assert.equal(enrichment.irrelevante, false);
  assert.equal(enrichment.conceitos.length, 1);
});

void test("APA-03: diffEnrichmentAgainstLesson — conceito repetido com def igual não aparece em nenhuma lista", () => {
  const lesson = validateLesson(baseLesson());
  const ficha: ApacheEnrichment = validateEnrichment({
    v: 1,
    irrelevante: false,
    conceitos: [{ id: "ignored", nome: "Conceito X", def: "Definição de X" }],
  });
  const diff = diffEnrichmentAgainstLesson(lesson, ficha);
  assert.deepEqual(diff.novos, []);
  assert.deepEqual(diff.reforcos, []);
});

void test("APA-03: diffEnrichmentAgainstLesson — conceito repetido com def diferente cai em reforcos", () => {
  const lesson = validateLesson(baseLesson());
  const ficha: ApacheEnrichment = validateEnrichment({
    v: 1,
    irrelevante: false,
    conceitos: [{ id: "ignored", nome: "conceito x", def: "Definição diferente" }],
  });
  const diff = diffEnrichmentAgainstLesson(lesson, ficha);
  assert.deepEqual(diff.novos, []);
  assert.deepEqual(diff.reforcos, [{ conceitoId: "c1", texto: "Definição diferente" }]);
});

void test("APA-03: diffEnrichmentAgainstLesson — conceito novo cai em novos", () => {
  const lesson = validateLesson(baseLesson());
  const novoConceito = { id: "e2", nome: "Conceito Y", def: "Definição de Y" };
  const ficha: ApacheEnrichment = validateEnrichment({
    v: 1,
    irrelevante: false,
    conceitos: [novoConceito],
  });
  const diff = diffEnrichmentAgainstLesson(lesson, ficha);
  assert.deepEqual(diff.novos, [novoConceito]);
  assert.deepEqual(diff.reforcos, []);
});

void test("APA-03: a mesma ficha comparada contra aulas (versões) diferentes dá resultados diferentes sem reprocessar a ficha", () => {
  const ficha: ApacheEnrichment = validateEnrichment({
    v: 1,
    irrelevante: false,
    conceitos: [{ id: "e3", nome: "Conceito Z", def: "Definição de Z" }],
  });

  const lessonV1 = validateLesson(baseLesson());
  const diffV1 = diffEnrichmentAgainstLesson(lessonV1, ficha);
  assert.deepEqual(diffV1.novos, ficha.conceitos);

  const lessonV2 = validateLesson(
    baseLesson({
      cc: [
        { id: "c1", nome: "Conceito X", def: "Definição de X" },
        { id: "c2", nome: "Conceito Z", def: "Definição de Z" },
      ],
    }),
  );
  const diffV2 = diffEnrichmentAgainstLesson(lessonV2, ficha);
  assert.deepEqual(diffV2.novos, []);
  assert.deepEqual(diffV2.reforcos, []);
});
