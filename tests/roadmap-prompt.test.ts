import assert from 'node:assert/strict';
import test from 'node:test';
import { buildRoadmapPrompt, EMPTY_ROADMAP_PROMPT_INPUT } from '../lib/roadmap-prompt.js';

void test('CG-gerador-roadmap: o prompt inclui o modelo do Atlas (fases/disciplinas/conteúdos) e o pedido da pessoa', () => {
  const prompt = buildRoadmapPrompt({
    ...EMPTY_ROADMAP_PROMPT_INPUT,
    topic: 'Direito Administrativo',
    currentLevel: 'iniciante',
    targetLevel: 'avancado',
    goal: 'concurso',
    goalDetail: 'Técnico do TCU',
    weeklyHours: '10',
    deadline: '3 meses',
  });

  // O modelo de dados do Atlas precisa estar descrito, com os mesmos nomes de
  // campo usados em lib/roadmap-store.ts / lib/catalog/roadmap-seed.ts.
  for (const token of ['phases', 'disciplines', 'contents', 'prerequisites', 'disciplineId', 'prerequisiteId', 'unit', 'keywords']) {
    assert.ok(prompt.includes(token), `prompt deveria mencionar "${token}"`);
  }

  // O pedido da pessoa precisa aparecer no texto final.
  assert.ok(prompt.includes('Direito Administrativo'));
  assert.ok(prompt.includes('Técnico do TCU'));
  assert.ok(prompt.includes('10 horas por semana'));
  assert.ok(prompt.includes('3 meses'));

  // Formato de saída: pede JSON num bloco de código, não uma lista/tabela solta.
  assert.ok(prompt.includes('```json'));
});

void test('CG-gerador-roadmap: determinístico e sem campos opcionais vazios no texto', () => {
  const input = { ...EMPTY_ROADMAP_PROMPT_INPUT, topic: 'Violão popular' };
  assert.equal(buildRoadmapPrompt(input), buildRoadmapPrompt(input));
  assert.ok(!buildRoadmapPrompt(input).includes('Disponibilidade:'));
  assert.ok(!buildRoadmapPrompt(input).includes('Prazo desejado:'));
});
