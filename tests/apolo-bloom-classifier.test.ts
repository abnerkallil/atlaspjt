// Sugestão de Bloom (APO-07): regra fixa, nunca IA — ver lib/apolo/bloom-classifier.ts
// para a base científica resumida. Estes testes travam o comportamento pelos
// exemplos reais do banco autoral (PR #67), um por nível alcançável por este
// formato de questão (objetiva: sem avaliar/criar neste conjunto).
import assert from 'node:assert/strict';
import test from 'node:test';
import { suggestBloomLevel } from '../lib/apolo/index.js';

void test('APO-07: reconhecimento puro sem cenário vira "lembrar"', () => {
  const { level, matchedCue } = suggestBloomLevel(
    'multipla',
    'Sobre direitos sociais, qual das alternativas a seguir esta correta?',
  );
  assert.equal(level, 'lembrar');
  assert.ok(matchedCue);
});

void test('APO-07: afirmação a julgar sem cenário numérico vira "entender"', () => {
  const { level } = suggestBloomLevel(
    'certo_errado',
    'O aviso previo so e devido quando o empregado pede demissao, nunca quando o empregador dispensa sem justa causa.',
  );
  assert.equal(level, 'entender');
});

void test('APO-07: problema com cenário numérico concreto vira "aplicar"', () => {
  const { level, matchedCue } = suggestBloomLevel(
    'multipla',
    'Um terreno retangular mede 28 metros de frente por 19 metros de fundo. Qual o perimetro, em metros?',
  );
  assert.equal(level, 'aplicar');
  assert.ok(matchedCue);
});

void test('APO-07: verbo de cálculo isolado também vira "aplicar"', () => {
  const { level } = suggestBloomLevel('multipla', 'Resolva para x: 8x + 75 = 99. Qual o valor de x?');
  assert.equal(level, 'aplicar');
});

void test('APO-07: verbo de análise vira "analisar" mesmo sem número', () => {
  const { level } = suggestBloomLevel(
    'dissertativa',
    'Analise as causas da inflação apresentadas no texto e explique como se relacionam.',
  );
  assert.equal(level, 'analisar');
});

void test('APO-07: pedido de julgamento entre alternativas vira "avaliar"', () => {
  const { level } = suggestBloomLevel(
    'dissertativa',
    'Avalie qual das duas estratégias de precificação descritas é mais adequada considerando o cenário da empresa.',
  );
  assert.equal(level, 'avaliar');
});

void test('APO-07: pedido de elaborar algo novo vira "criar"', () => {
  const { level } = suggestBloomLevel(
    'dissertativa',
    'Elabore um plano de contas adequado para a empresa descrita no enunciado.',
  );
  assert.equal(level, 'criar');
});

void test('APO-07: calculo/lacuna_numerica sem pista cai no padrão por tipo ("aplicar")', () => {
  assert.equal(suggestBloomLevel('calculo', 'Qual o resultado?').level, 'aplicar');
  assert.equal(suggestBloomLevel('lacuna_numerica', 'Complete: ___.').level, 'aplicar');
});

void test('APO-07: a sugestão nunca decide por conta própria — é só um ponto de partida', () => {
  // Mesma entrada, mesma saída sempre (determinístico, sem IO nem IA externa).
  const a = suggestBloomLevel('multipla', 'Sobre tributação, qual das alternativas a seguir esta correta?');
  const b = suggestBloomLevel('multipla', 'Sobre tributação, qual das alternativas a seguir esta correta?');
  assert.deepEqual(a, b);
});
