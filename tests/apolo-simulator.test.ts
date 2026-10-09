// APO-23: simulador do Apolo — alunos sintéticos de habilidade conhecida
// respondendo pelo modelo de Rasch, para provar que o motor funciona antes
// de dar nota de verdade. Três propriedades, as três pedidas pelo card:
// (1) o Elo converge para a habilidade verdadeira; (2) o seletor respeita
// plano/cota/exposição; (3) o KR-20 de uma prova de 60 itens bem calibrada
// chega a 0,80. Números e parâmetros documentados em
// docs/APOLO.md ("Painel do simulador").
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  foldEloTrajectory,
  probability,
  simulatorRandom,
  simulateAssemblies,
  simulatedKr20,
  simulateStudentAnswers,
  syntheticBank,
  syntheticStudents,
} from '../lib/apolo/simulator.js';
import { selectQuestions, type SelectInput } from '../lib/apolo/selector.js';
import { resolvePlan } from '../lib/apolo/plans.js';

void test('simulatorRandom: determinístico (mesma semente, mesma sequência); sementes diferentes divergem', () => {
  const a = simulatorRandom('x');
  const b = simulatorRandom('x');
  const c = simulatorRandom('y');
  const seqA = Array.from({ length: 5 }, () => a());
  const seqB = Array.from({ length: 5 }, () => b());
  const seqC = Array.from({ length: 5 }, () => c());
  assert.deepEqual(seqA, seqB);
  assert.notDeepEqual(seqA, seqC);
});

void test('probability: 0,5 quando item e habilidade são iguais; sobe com habilidade maior (Rasch/Elo)', () => {
  assert.equal(probability(1200, 1200), 0.5);
  assert.ok(probability(1400, 1200) > 0.5);
  assert.ok(probability(1000, 1200) < 0.5);
});

void test('(1) Elo converge para a habilidade verdadeira dentro da faixa cadastrada (facil/media/dificil), com margem de 100 pontos em 300 respostas', () => {
  for (const theta of [1000, 1200, 1400]) {
    const answers = simulateStudentAnswers(theta, 300, `aluno-${theta}`);
    const trajectory = foldEloTrajectory(answers);
    const final = trajectory.at(-1)!;
    assert.ok(Math.abs(final - theta) < 100, `θ=${theta}: Elo final ${final.toFixed(0)} deveria estar a menos de 100 pontos`);
  }
});

void test('(1) Elo fora da faixa cadastrada (acima de "dificil") converge mais devagar, mas na direção certa — disclosed em docs/APOLO.md', () => {
  // θ=1800 nunca encontra oponente mais difícil que "dificil" (1400): o
  // Elo sobe, mas devagar, porque o modelo não tem como medir habilidade
  // acima do que o banco cadastra. Propriedade mais fraca: converge na
  // direção certa e se aproxima com mais dados, não que alcance θ.
  const theta = 1800;
  const short = foldEloTrajectory(simulateStudentAnswers(theta, 100, 'fora-faixa-100')).at(-1)!;
  const long = foldEloTrajectory(simulateStudentAnswers(theta, 600, 'fora-faixa-600')).at(-1)!;
  assert.ok(short > 1200, 'sobe a partir do ponto de partida (1200)');
  assert.ok(long > short, 'com mais respostas, sobe mais — não estaciona');
});

void test('(2) o seletor nunca ultrapassa o plano nem a cota por conteúdo, mesmo repetido com sementes diferentes', () => {
  const plan = resolvePlan('quiz');
  const bank = syntheticBank({ count: plan.size * 3, spread: 400, contentCount: 3 });
  const baseInput: Omit<SelectInput, 'seed'> = {
    plan,
    profile: { temas: [], filaRecuperacao: [] },
    bank,
    recentlySeen: [],
    now: '2026-10-09T00:00:00.000Z',
  };
  const { assemblies } = simulateAssemblies(selectQuestions, baseInput, 30);
  for (const assembly of assemblies) {
    assert.ok(assembly.length <= plan.size, 'nunca mais que o tamanho do plano');
    assert.equal(assembly.length, new Set(assembly).size, 'nenhuma questão repetida na mesma prova');
  }
});

void test('(2) o seletor espalha a exposição do banco ao longo de várias provas, mas com viés estrutural pelos últimos itens empatados — disclosed em docs/APOLO.md', () => {
  // Com cobertura do plano totalmente empatada entre os candidatos (banco
  // homogêneo: mesmo kind, plano sem difficultyMix), `pickFromTopN`
  // (lib/apolo/selector.ts) sorteia só entre os 5 primeiros do array ainda
  // disponível, em ordem estável — não entre os 5 melhores de todo o
  // empate. Isso espalha bem a exposição entre a maioria do banco, mas os
  // últimos itens do array (que só entram nessa janela de 5 perto do fim
  // da prova) ficam estruturalmente sub-expostos; com banco pouco maior
  // que o plano, 1-2 nunca saem em 40 provas. Propriedade real do seletor
  // de produção, não um defeito deste simulador — ver "Viés de exposição
  // com empate total" em docs/APOLO.md.
  const plan = resolvePlan('quiz');
  // Banco um pouco maior que o plano: toda prova tem que rodar por candidatos distintos.
  const bank = syntheticBank({ count: plan.size + 5, spread: 200, contentCount: 1 });
  const baseInput: Omit<SelectInput, 'seed'> = {
    plan,
    profile: { temas: [], filaRecuperacao: [] },
    bank,
    recentlySeen: [],
    now: '2026-10-09T00:00:00.000Z',
  };
  const runs = 40;
  const { exposure } = simulateAssemblies(selectQuestions, baseInput, runs);
  assert.ok(exposure.size >= bank.length - 2, 'a maior parte do banco é exposta ao menos uma vez em 40 provas');
  for (const count of exposure.values()) {
    assert.ok(count < runs, 'nenhum item sai em toda prova — o sorteio entre os 5 melhores espalha a exposição');
  }
});

void test('(2) cota por conteúdo (perContentQuota) nunca é ultrapassada', () => {
  const plan = resolvePlan('exame_meio');
  const bank = syntheticBank({ count: plan.size * 2, spread: 400, contentCount: 4 });
  const quota = 5;
  const baseInput: Omit<SelectInput, 'seed'> = {
    plan,
    profile: { temas: [], filaRecuperacao: [] },
    bank,
    recentlySeen: [],
    now: '2026-10-09T00:00:00.000Z',
    perContentQuota: Object.fromEntries(bank.map((item) => [item.contentId, quota])),
  };
  const { assemblies } = simulateAssemblies(selectQuestions, baseInput, 10);
  for (const assembly of assemblies) {
    const byContent = new Map<string, number>();
    for (const id of assembly) {
      const contentId = bank.find((item) => item.id === id)!.contentId;
      byContent.set(contentId, (byContent.get(contentId) ?? 0) + 1);
    }
    for (const count of byContent.values()) assert.ok(count <= quota, `cota de ${quota} por conteúdo respeitada`);
  }
});

void test('(3) KR-20 de uma prova de 60 itens bem calibrada ao Elo da população chega a 0,80 — a meta do card', () => {
  const items = syntheticBank({ count: 60, spread: 400 });
  const students = syntheticStudents(60, 400);
  const value = simulatedKr20(items, students, 'kr20-meta');
  assert.ok(value !== null && value >= 0.8, `KR-20 ${value} deveria ser >= 0.80`);
});

void test('(3) KR-20 cai abaixo da meta com população pouco diversa — a meta depende da calibração, não é sempre 1', () => {
  // População muito homogênea (θ quase igual): quase não há variância entre
  // provas para o KR-20 medir — propriedade oposta ao teste anterior,
  // confirmando que a meta de 0,80 é informativa, não um artefato da conta.
  const items = syntheticBank({ count: 60, spread: 400 });
  const students = syntheticStudents(60, 100);
  const value = simulatedKr20(items, students, 'kr20-homogeneo');
  assert.ok(value !== null && value < 0.8, `KR-20 ${value} deveria ficar abaixo de 0.80 com população homogênea`);
});
