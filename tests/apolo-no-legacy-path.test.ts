// APO-24: "nenhum endpoint cria tentativa ou nota sem o Apolo" — este teste
// varre as rotas que criam tentativa/nota (quiz, atividade, exame de meio,
// atividade final, proficiência) e os módulos que elas chamam, confirmando
// que o caminho antigo de montagem (APO-14's `isApoloReady`/`selectQuestions`
// local/`directedSelection`, removidos neste card) não existe mais em lugar
// nenhum — nem como texto fonte, nem como export em runtime.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as quizzes from '../lib/quizzes.js';
import * as recovery from '../lib/recovery.js';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

// Rotas que criam tentativa/nota (lêem o corpo e chamam a função que grava
// em atlas_quiz_attempts/atlas_exam_attempts) + os módulos de implementação
// por trás de cada uma.
const SOURCES = [
  'app/api/quizzes/route.ts',
  'app/api/atividades/route.ts',
  'app/api/exames/route.ts',
  'app/api/proficiencia/route.ts',
  'lib/quizzes.ts',
  'lib/recovery.ts',
  'lib/apolo/exam.ts',
  'lib/apolo/final.ts',
  'lib/apolo/proficiency.ts',
];

// Identificadores do caminho antigo (APO-14/MVP-04), removidos no APO-24.
// Qualquer ocorrência aqui significa que um fallback sem Apolo voltou.
const BANNED = ['isApoloReady', 'directedSelection'];

void test('APO-24: nenhuma rota ou módulo de tentativa/nota referencia o caminho antigo (isApoloReady/directedSelection)', () => {
  for (const relativePath of SOURCES) {
    const text = readFileSync(`${repoRoot}/${relativePath}`, 'utf8');
    for (const banned of BANNED) {
      assert.ok(
        !text.includes(banned),
        `${relativePath} não deveria referenciar "${banned}" (caminho antigo removido no APO-24)`,
      );
    }
  }
});

void test('APO-24: as funções do caminho antigo não existem mais como export (lib/quizzes.ts, lib/recovery.ts)', () => {
  assert.equal((quizzes as Record<string, unknown>).selectQuestions, undefined);
  assert.equal((recovery as Record<string, unknown>).directedSelection, undefined);
});
