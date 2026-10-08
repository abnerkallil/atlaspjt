// APO-06: extrator determinístico de questões, por regra (sem IA — DEC-014).
// Fixtures de texto representam o que já sairia do unpdf para cada formato
// (scripts/lib/extractor.mjs cuida só do corte; scripts/apolo-extrair.mjs
// cuida da parte de E/S com o PDF de verdade, fora deste spike).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

type Draft = Record<string, unknown>;
type ExtractResult = { format: string; drafts: Draft[]; manual: Draft[]; voided: number; report: string[] };
type ExtractorModule = {
  cleanText(raw: string): string;
  detectFormat(text: string): string;
  extractCebraspe(text: string, gabarito?: Map<number, string>): Omit<ExtractResult, 'format' | 'report'>;
  extractAlternatives(text: string, gabarito?: Map<number, string>): Omit<ExtractResult, 'format' | 'report'>;
  extractGeneric(text: string, gabarito?: Map<number, string>): Omit<ExtractResult, 'format' | 'report'>;
  extractQuestions(rawText: string, opts?: { format?: string; gabarito?: Map<number, string> }): ExtractResult;
  parseGabarito(text: string, format?: string): Map<number, string>;
};

const lib = (await import(
  pathToFileURL(join(process.cwd(), 'scripts/lib/extractor.mjs')).href
)) as ExtractorModule;

function fixture(name: string) {
  return readFileSync(join(process.cwd(), 'tests/fixtures', name), 'utf8');
}

void test('APO-06: limpeza tira cabeçalho repetido e número de página solto', () => {
  const raw = 'CABEÇALHO\n1. Pergunta um.\nCABEÇALHO\n2\n2. Pergunta dois.\nCABEÇALHO';
  const clean = lib.cleanText(raw);
  assert.ok(!clean.includes('CABEÇALHO'));
  assert.ok(!clean.split('\n').includes('2'));
  assert.ok(clean.includes('1. Pergunta um.'));
  assert.ok(clean.includes('2. Pergunta dois.'));
});

void test('APO-06: formato Cebraspe — corte confere com a contagem esperada, resto manual, anulada fora', () => {
  const text = fixture('apolo-extrator-cebraspe.txt');
  assert.equal(lib.detectFormat(lib.cleanText(text)), 'cebraspe');
  const gabarito = new Map<number, string>([
    [1, 'certo'],
    [2, 'errado'],
    [3, 'anulada'],
  ]);
  const result = lib.extractQuestions(text, { gabarito });
  assert.equal(result.format, 'cebraspe');
  assert.equal(result.drafts.length, 2);
  assert.deepEqual(result.drafts.map((d) => d.number), [1, 2]);
  assert.deepEqual(result.drafts.map((d) => d.correta), ['certo', 'errado']);
  assert.ok(result.drafts.every((d) => d.kind === 'certo_errado'));
  assert.equal(result.voided, 1);
  assert.equal(result.manual.length, 1);
  assert.equal(result.manual[0]?.number, 4);
  assert.ok(result.report.some((line) => line.includes('Questão 4: manual')));
  assert.ok(result.report.some((line) => line.includes('1 questão(ões) anulada')));
});

void test('APO-06: formato alternativas A-E (FGV/FCC/Vunesp) — corte confere, resto manual', () => {
  const text = fixture('apolo-extrator-alternativas.txt');
  assert.equal(lib.detectFormat(lib.cleanText(text)), 'alternativas');
  const gabarito = new Map<number, string>([
    [1, 'C'],
    [2, 'B'],
  ]);
  const result = lib.extractQuestions(text, { gabarito });
  assert.equal(result.format, 'alternativas');
  assert.equal(result.drafts.length, 2);
  assert.deepEqual(result.drafts.map((d) => d.correctOption), [2, 1]);
  assert.ok(result.drafts.every((d) => d.kind === 'multipla' && Array.isArray(d.options) && (d.options as unknown[]).length === 5));
  assert.equal(result.manual.length, 1);
  assert.equal(result.manual[0]?.number, 3);
  assert.equal(result.voided, 0);
});

void test('APO-06: parser genérico (pergunta + gabarito) — rede de segurança para apostila/lista', () => {
  const text = fixture('apolo-extrator-generico.txt');
  assert.equal(lib.detectFormat(lib.cleanText(text)), 'generico');
  const result = lib.extractQuestions(text);
  assert.equal(result.format, 'generico');
  assert.equal(result.drafts.length, 2);
  assert.ok(result.drafts.every((d) => d.kind === 'dissertativa' && typeof d.modelAnswer === 'string' && (d.modelAnswer as string).length > 0));
  assert.equal(result.manual.length, 1);
  assert.equal(result.manual[0]?.number, 3);
});

void test('APO-06: gabarito Cebraspe em texto simples (certo/errado/anulada, C/E como atalho)', () => {
  const gabarito = lib.parseGabarito('1 C\n2) ERRADO\n3. anulada\nlixo sem número', 'cebraspe');
  assert.deepEqual(
    [...gabarito.entries()].sort((a, b) => a[0] - b[0]),
    [[1, 'certo'], [2, 'errado'], [3, 'anulada']],
  );
});

void test('APO-06: gabarito de alternativas em texto simples (letra da opção, C/E não viram certo/errado)', () => {
  const gabarito = lib.parseGabarito('1 C\n2) B\n3. anulada\n4 e', 'alternativas');
  assert.deepEqual(
    [...gabarito.entries()].sort((a, b) => a[0] - b[0]),
    [[1, 'C'], [2, 'B'], [3, 'anulada'], [4, 'E']],
  );
});

void test('APO-06: item malformado (sem alternativas) não derruba o resto do arquivo', () => {
  const gabarito = new Map<number, string>([[2, 'A']]);
  const result = lib.extractAlternatives('1. Só enunciado, sem nenhuma alternativa.\n2. Outro.\nA) ok.\nB) ok.', gabarito);
  assert.equal(result.drafts.length, 1);
  assert.equal(result.manual.length, 1);
  assert.equal(result.manual[0]?.reason, 'não achei alternativas A-E');
});
