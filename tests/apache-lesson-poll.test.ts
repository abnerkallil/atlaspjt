// APA-04: lógica pura do polling de ContentLesson.
import assert from 'node:assert/strict';
import test from 'node:test';
import { MAX_POLL_ATTEMPTS, resolvePollOutcome } from '../lib/apache/lesson-poll.js';

void test('404 (endpoint ainda não existe): esconde a tela, não é erro', () => {
  assert.deepEqual(resolvePollOutcome(true, null, 1), { kind: 'hidden' });
});

void test('resposta sem corpo válido: erro, para de repetir', () => {
  assert.deepEqual(resolvePollOutcome(false, null, 1), {
    kind: 'error',
    message: 'Não foi possível carregar a aula.',
  });
});

void test('pendente/gerando: continua repetindo enquanto não passou do limite', () => {
  const pendente = { status: 'pendente' as const };
  assert.deepEqual(resolvePollOutcome(false, pendente, 1), {
    kind: 'data',
    data: pendente,
    continuePolling: true,
  });
  assert.deepEqual(resolvePollOutcome(false, pendente, MAX_POLL_ATTEMPTS - 1), {
    kind: 'data',
    data: pendente,
    continuePolling: true,
  });
});

void test('pendente além do limite de tentativas: para de repetir, mas não é erro', () => {
  const pendente = { status: 'pendente' as const };
  assert.deepEqual(resolvePollOutcome(false, pendente, MAX_POLL_ATTEMPTS), {
    kind: 'data',
    data: pendente,
    continuePolling: false,
  });
});

void test('gerada com lesson: para de repetir (estado terminal)', () => {
  const lesson = {
    objetivo: 'x',
    conceitos: [],
    formulas: [],
    exemplos: [],
    pegadinhas: [],
    resumo: 'y',
  };
  const body = { status: 'gerada' as const, lesson };
  assert.deepEqual(resolvePollOutcome(false, body, 3), {
    kind: 'data',
    data: body,
    continuePolling: false,
  });
});

void test('gerada/reportada sem lesson: trata como erro, nunca card vazio', () => {
  assert.deepEqual(resolvePollOutcome(false, { status: 'gerada' }, 2), {
    kind: 'error',
    message: 'Não foi possível carregar esta aula agora. Tente de novo mais tarde.',
  });
  assert.deepEqual(resolvePollOutcome(false, { status: 'reportada' }, 2), {
    kind: 'error',
    message: 'Não foi possível carregar esta aula agora. Tente de novo mais tarde.',
  });
});

void test('erro: para de repetir', () => {
  const body = { status: 'erro' as const, errorMessage: 'falhou' };
  assert.deepEqual(resolvePollOutcome(false, body, 5), {
    kind: 'data',
    data: body,
    continuePolling: false,
  });
});
