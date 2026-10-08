// Banco de questões do MVP-04 em CSV: leitura, validação e SQL de carga.
// Usado pelo gerador da migration do banco inicial e por scripts/import-questions.mjs.
//
// Colunas (cabeçalho obrigatório, separador vírgula ou ponto e vírgula):
//   id, conteudo, ordem, tipo, enunciado, contexto, a, b, c, d, e, correta,
//   gabarito, valor_esperado, tolerancia, verificacao, explicacao, ativa
// tipo: multipla | dissertativa | calculo
// correta: letra da alternativa certa (múltipla escolha)
// verificacao: JSON com 5 perguntas [{"prompt","options":[...],"correct":0}] (cálculo)
// ativa: "nao" desativa a questão sem apagá-la (as tentativas antigas continuam corrigíveis).

const KINDS = ['multipla', 'dissertativa', 'calculo'];
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

function fail(line, message) {
  throw new Error(`Linha ${line}: ${message}`);
}

function number(value, line, name) {
  const parsed = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(parsed)) fail(line, `"${name}" precisa ser um número.`);
  return parsed;
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
    };
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
    if (kind === 'dissertativa' && !question.modelAnswer)
      fail(line, 'dissertativa precisa do "gabarito".');
    if (kind === 'calculo') {
      if (!row.valor_esperado)
        fail(line, 'cálculo precisa do "valor_esperado".');
      question.expectedValue = number(
        row.valor_esperado,
        line,
        'valor_esperado',
      );
      question.tolerance = row.tolerancia
        ? number(row.tolerancia, line, 'tolerancia')
        : 0;
      let verification;
      try {
        verification = JSON.parse(row.verificacao || '');
      } catch {
        fail(line, '"verificacao" precisa ser um JSON com as 5 perguntas.');
      }
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
  source = excluded.source, active = excluded.active, updated_at = excluded.updated_at`
      : 'ON CONFLICT(id) DO NOTHING';
  return questions
    .map(
      (q) =>
        `INSERT INTO atlas_questions (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value, tolerance, verification_json, explanation, source, active, updated_at)
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
        ]
          .map(literal)
          .join(', ')})
${conflict};`,
    )
    .join('\n--> statement-breakpoint\n');
}
