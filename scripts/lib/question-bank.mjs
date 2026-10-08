// Banco de questões (APO-04): leitura em CSV ou JSON v2, linter (Haladyna et
// al.) e SQL de carga. Usado pelo gerador da migration do banco inicial e por
// scripts/import-questions.mjs.
//
// Colunas do CSV (cabeçalho obrigatório, separador vírgula ou ponto e vírgula):
//   id, conteudo, ordem, tipo, enunciado, contexto, a, b, c, d, e, correta,
//   gabarito, valor_esperado, tolerancia, verificacao, explicacao, ativa,
//   tema, subtopico_id, bloom, dificuldade, tipo_conhecimento, origem,
//   banca, orgao, ano, fonte_r2
// tipo: multipla | dissertativa | calculo | certo_errado | lacuna_numerica
//   (DEC-014/APO-03: certo_errado é julgamento binário; lacuna_numerica é
//   valor com tolerância, sem as 5 verificações de raciocínio do cálculo.)
// correta: letra da alternativa certa (múltipla escolha); "certo"/"errado" (certo_errado)
// verificacao: JSON com 5 perguntas [{"prompt","options":[...],"correct":0}] (cálculo)
// ativa: "nao" desativa a questão sem apagá-la (as tentativas antigas continuam corrigíveis).
// As colunas de APO-01/02/03 são opcionais em ambos os formatos; vazias viram NULL.
//
// JSON v2 (--file banco.json): array de objetos com as mesmas chaves do CSV,
// mas sem precisar escapar vírgulas/JSON dentro de células — "verificacao" e
// "explicacoes_alternativas" já vêm como array/objeto, não como string.

const KINDS = ['multipla', 'dissertativa', 'calculo', 'certo_errado', 'lacuna_numerica'];
const LETTERS = ['a', 'b', 'c', 'd', 'e'];

// CSV com aspas (RFC 4180). Detecta ";" quando o cabeçalho usa ponto e vírgula (Excel pt-BR).
export function parseCsv(text) {
  const source = text.replace(/^﻿/, '');
  const firstLine = source.slice(0, source.search(/\r?\n|$/));
  const separator =
    firstLine.split(';').length > firstLine.split(',').length ? ';' : ',';
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"' && field === '') {
      quoted = true;
    } else if (char === separator) {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  const nonEmpty = rows.filter((item) =>
    item.some((cell) => cell.trim() !== ''),
  );
  if (nonEmpty.length === 0) return [];
  const header = nonEmpty[0].map((cell) => cell.trim().toLowerCase());
  return nonEmpty.slice(1).map((cells, index) => {
    const record = { __line: index + 2 };
    header.forEach((name, column) => {
      record[name] = (cells[column] ?? '').trim();
    });
    return record;
  });
}

// JSON v2: array de objetos com as mesmas chaves do CSV. "__line" vira o
// índice do item (1-based) para os erros apontarem o mesmo jeito que o CSV.
export function parseJsonV2(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('JSON inválido.');
  }
  if (!Array.isArray(parsed)) throw new Error('JSON v2 precisa ser um array de questões.');
  return parsed.map((item, index) => ({ ...item, __line: index + 1 }));
}

function fail(line, message) {
  throw new Error(`Linha ${line}: ${message}`);
}

function number(value, line, name) {
  const parsed = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(parsed)) fail(line, `"${name}" precisa ser um número.`);
  return parsed;
}

// Aceita tanto o valor já estruturado (JSON v2) quanto a string JSON (CSV).
function parsedOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

// Converte e valida as linhas; erros dizem a linha do arquivo.
export function rowsToQuestions(rows) {
  const seen = new Set();
  return rows.map((row) => {
    const line = row.__line;
    const contentId = row.conteudo;
    if (!contentId) fail(line, 'informe "conteudo" (ex.: CG-001).');
    const kind = (row.tipo || '').toLowerCase();
    if (!KINDS.includes(kind))
      fail(line, `"tipo" deve ser ${KINDS.join(', ')}.`);
    const position = row.ordem ? number(row.ordem, line, 'ordem') : null;
    if (position === null || !Number.isInteger(position) || position < 1)
      fail(line, '"ordem" precisa ser um inteiro a partir de 1.');
    const id = row.id || `${contentId}-Q${String(position).padStart(2, '0')}`;
    if (seen.has(id)) fail(line, `id repetido: ${id}.`);
    seen.add(id);
    if (!row.enunciado) fail(line, 'informe o "enunciado".');
    if (!row.explicacao)
      fail(line, 'informe a "explicacao" mostrada na correção.');

    const question = {
      __line: line,
      id,
      contentId,
      position,
      kind,
      prompt: row.enunciado,
      context: row.contexto || null,
      options: null,
      correctOption: null,
      modelAnswer: row.gabarito || null,
      expectedValue: null,
      tolerance: null,
      verification: null,
      explanation: row.explicacao,
      active: !['nao', 'não', '0', 'false'].includes(
        (row.ativa || '').toLowerCase(),
      ),
      // APO-01/02/03: opcionais em ambos os formatos; ausentes viram NULL.
      theme: row.tema || null,
      subtopicId: row.subtopico_id || null,
      bloomLevel: row.bloom || null,
      difficultyNominal: row.dificuldade || null,
      knowledgeType: row.tipo_conhecimento || null,
      origin: row.origem || null,
      examBoard: row.banca || null,
      examOrg: row.orgao || null,
      examYear: row.ano ? number(row.ano, line, 'ano') : null,
      sourceObjectKey: row.fonte_r2 || null,
      optionExplanations: null,
    };
    const optionExplanations = parsedOrNull(row.explicacoes_alternativas);
    if (optionExplanations === undefined)
      fail(line, '"explicacoes_alternativas" precisa ser um JSON válido.');
    question.optionExplanations = optionExplanations;
    if (kind === 'multipla') {
      const options = LETTERS.map((letter) => row[letter] ?? '').filter(
        (option) => option !== '',
      );
      if (options.length < 2)
        fail(
          line,
          'múltipla escolha precisa de ao menos 2 alternativas (a, b...).',
        );
      const correct = LETTERS.indexOf((row.correta || '').toLowerCase());
      if (correct < 0 || correct >= options.length)
        fail(line, '"correta" deve ser a letra de uma alternativa preenchida.');
      question.options = options;
      question.correctOption = correct;
    }
    if (kind === 'certo_errado') {
      const value = (row.correta || '').toLowerCase();
      if (value !== 'certo' && value !== 'errado')
        fail(line, '"correta" deve ser "certo" ou "errado".');
      question.options = ['Errado', 'Certo'];
      question.correctOption = value === 'certo' ? 1 : 0;
    }
    if (kind === 'dissertativa' && !question.modelAnswer)
      fail(line, 'dissertativa precisa do "gabarito".');
    if (kind === 'calculo' || kind === 'lacuna_numerica') {
      if (!row.valor_esperado)
        fail(line, `${kind} precisa do "valor_esperado".`);
      question.expectedValue = number(
        row.valor_esperado,
        line,
        'valor_esperado',
      );
      question.tolerance = row.tolerancia
        ? number(row.tolerancia, line, 'tolerancia')
        : 0;
    }
    if (kind === 'calculo') {
      const verification = parsedOrNull(row.verificacao);
      if (verification === undefined)
        fail(line, '"verificacao" precisa ser um JSON com as 5 perguntas.');
      const valid =
        Array.isArray(verification) &&
        verification.length === 5 &&
        verification.every(
          (item) =>
            item &&
            typeof item.prompt === 'string' &&
            Array.isArray(item.options) &&
            item.options.length >= 2 &&
            Number.isInteger(item.correct) &&
            item.correct >= 0 &&
            item.correct < item.options.length,
        );
      if (!valid)
        fail(
          line,
          '"verificacao" precisa de 5 perguntas com prompt, options e correct.',
        );
      question.verification = verification;
    }
    return question;
  });
}

function literal(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
}

// FNV-1a de 32 bits (mesmo algoritmo de lib/apolo/question-bank.ts,
// deliberadamente duplicado aqui: este script roda fora do bundle da Worker —
// mesmo princípio de lib/apolo/generators.ts reimplementar o seededRandom de
// lib/quizzes.ts, DEC-014). Usado para detectar enunciados duplicados.
export function hashQuestionText(text) {
  const normalized = text.trim().toLowerCase().replace(/\s+/g, ' ');
  let hash = 0x811c9dc5;
  for (let i = 0; i < normalized.length; i += 1) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

const ALL_NONE_OF_ABOVE = /\b(todas|nenhuma)\s+(d?as\s+)?anteriores\b/i;
const NEGATION_WORDS = /\b(não|nunca|exceto|incorreta|falsa)\b/i;
const HIGHLIGHTED_NEGATION = /(\*\*|__|[A-ZÀ-Ú]{3,})/;

// Linter de escrita de itens (APO-04, regras de Haladyna, Downing & Rodriguez
// 2002): avisos de estilo não bloqueiam a importação (mitigação do risco de
// "linter chato demais"); duplicatas (enunciado repetido ou alternativas
// repetidas dentro da mesma questão) são erro, porque indicam questão quebrada.
export function lintQuestions(questions) {
  const issues = [];
  const byHash = new Map();
  for (const q of questions) {
    const hash = hashQuestionText(q.prompt);
    const dupe = byHash.get(hash);
    if (dupe) {
      issues.push({
        line: q.__line,
        id: q.id,
        severity: 'erro',
        message: `enunciado duplicado do de "${dupe}" (mesmo texto normalizado).`,
      });
    } else {
      byHash.set(hash, q.id);
    }

    if (q.options) {
      const normalized = q.options.map((o) => o.trim().toLowerCase());
      const seen = new Set();
      for (const option of normalized) {
        if (seen.has(option)) {
          issues.push({
            line: q.__line,
            id: q.id,
            severity: 'erro',
            message: 'alternativas repetidas (mesmo texto em mais de uma opção).',
          });
          break;
        }
        seen.add(option);
      }
      const correct = q.options[q.correctOption];
      if (correct && q.options.length > 2) {
        const others = q.options.filter((_, i) => i !== q.correctOption);
        const avgOthers = others.reduce((sum, o) => sum + o.length, 0) / others.length;
        if (avgOthers > 0 && correct.length > avgOthers * 1.5) {
          issues.push({
            line: q.__line,
            id: q.id,
            severity: 'aviso',
            message: 'a alternativa certa é bem mais longa que as outras (Haladyna).',
          });
        }
      }
      if (q.options.some((o) => ALL_NONE_OF_ABOVE.test(o))) {
        issues.push({
          line: q.__line,
          id: q.id,
          severity: 'aviso',
          message: '"todas/nenhuma das anteriores" dificulta a correção e favorece eliminação parcial (Haladyna).',
        });
      }
    }

    if (NEGATION_WORDS.test(q.prompt) && !HIGHLIGHTED_NEGATION.test(q.prompt)) {
      issues.push({
        line: q.__line,
        id: q.id,
        severity: 'aviso',
        message: 'negação no enunciado sem destaque (negrito ou maiúsculas) — fácil de passar batido.',
      });
    }

    if (!/[?:]\s*$/.test(q.prompt.trim())) {
      issues.push({
        line: q.__line,
        id: q.id,
        severity: 'aviso',
        message: 'enunciado não parece terminar em pergunta ou instrução ("?" ou ":").',
      });
    }
  }
  return issues;
}

// mode "seed": não sobrescreve questões já existentes (o usuário pode ter editado).
// mode "import": o arquivo do usuário vale (atualiza as existentes).
export function questionsSql(questions, { mode, updatedAt }) {
  const source = mode === 'import' ? 'importado' : 'curado';
  const conflict =
    mode === 'import'
      ? `ON CONFLICT(id) DO UPDATE SET content_id = excluded.content_id, position = excluded.position, kind = excluded.kind,
  prompt = excluded.prompt, context = excluded.context, options_json = excluded.options_json,
  correct_option = excluded.correct_option, model_answer = excluded.model_answer,
  expected_value = excluded.expected_value, tolerance = excluded.tolerance,
  verification_json = excluded.verification_json, explanation = excluded.explanation,
  source = excluded.source, active = excluded.active, updated_at = excluded.updated_at,
  theme = excluded.theme, bloom_level = excluded.bloom_level, difficulty_nominal = excluded.difficulty_nominal,
  subtopic_id = excluded.subtopic_id, knowledge_type = excluded.knowledge_type, origin = excluded.origin,
  exam_board = excluded.exam_board, exam_org = excluded.exam_org, exam_year = excluded.exam_year,
  source_object_key = excluded.source_object_key, text_hash = excluded.text_hash,
  option_explanations_json = excluded.option_explanations_json`
      : 'ON CONFLICT(id) DO NOTHING';
  return questions
    .map(
      (q) =>
        `INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at,
  theme, bloom_level, difficulty_nominal, subtopic_id, knowledge_type, origin, exam_board, exam_org, exam_year, source_object_key, text_hash, option_explanations_json)
VALUES (${[
          q.id,
          q.contentId,
          q.position,
          q.kind,
          q.prompt,
          q.context,
          q.options ? JSON.stringify(q.options) : null,
          q.correctOption,
          q.modelAnswer,
          q.expectedValue,
          q.tolerance,
          q.verification ? JSON.stringify(q.verification) : null,
          q.explanation,
          source,
          q.active ? 1 : 0,
          updatedAt,
          q.theme ?? null,
          q.bloomLevel ?? null,
          q.difficultyNominal ?? null,
          q.subtopicId ?? null,
          q.knowledgeType ?? null,
          q.origin ?? null,
          q.examBoard ?? null,
          q.examOrg ?? null,
          q.examYear ?? null,
          q.sourceObjectKey ?? null,
          hashQuestionText(q.prompt),
          q.optionExplanations ? JSON.stringify(q.optionExplanations) : null,
        ]
          .map(literal)
          .join(', ')})
${conflict};`,
    )
    .join('\n--> statement-breakpoint\n');
}
