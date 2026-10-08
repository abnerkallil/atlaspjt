// Extrator determinístico de questões (APO-06): transforma o texto cru de um
// PDF (já extraído, ver scripts/apolo-extrair.mjs) em rascunhos de questão,
// por regra — nunca IA (DEC-014). Peças puras, usadas pelo CLI e testadas
// direto aqui, sem precisar de um PDF de verdade (unpdf só entra no script,
// como camada de E/S: "PDF -> texto"; o corte do texto é testado com
// fixtures de texto em tests/fixtures/apolo-extrator-*.txt).
//
// Três parsers, na ordem do card: Cebraspe (afirmação + Certo/Errado, contra
// um gabarito externo), alternativas A-E (FGV/FCC/Vunesp) e um genérico de
// rede de segurança (pergunta + alternativas, ou pergunta + gabarito) para
// apostila/lista sem formato de concurso. O que nenhum parser conseguir
// cortar com segurança vira "manual" — a curadoria (APO-07) resolve depois;
// uma resposta de gabarito "ANULADA" tira o item fora, sem virar manual.

const PAGE_NUMBER_LINE = /^(página\s*)?\d+(\s*\/\s*\d+)?$/i;
const ITEM_NUMBER = /(?:^|\n)[ \t]*(\d{1,3})[.)][ \t]+/g;
const OPTION_LETTER = /(?:^|\n)[ \t]*([A-E])[.)][ \t]+/g;

// Tira linha de cabeçalho/rodapé repetida (mesmo texto em 2+ páginas) e
// número de página solto; mantém a ordem e o espaçamento entre questões.
export function cleanText(raw) {
  const lines = raw.replace(/\f/g, '\n').split(/\r?\n/).map((line) => line.trim());
  const counts = new Map();
  for (const line of lines) {
    if (!line) continue;
    counts.set(line, (counts.get(line) ?? 0) + 1);
  }
  const noisy = new Set(
    [...counts].filter(([line, count]) => count >= 2 && line.length <= 90 && !/[.:?]$/.test(line)).map(([line]) => line),
  );
  return lines.filter((line) => line && !noisy.has(line) && !PAGE_NUMBER_LINE.test(line)).join('\n');
}

export function detectFormat(text) {
  const hasNumberedItems = new RegExp(ITEM_NUMBER.source, 'm').test(text);
  if (hasNumberedItems && /\b(certo|errado)\b/i.test(text) && !new RegExp(OPTION_LETTER.source, 'm').test(text)) {
    return 'cebraspe';
  }
  if (new RegExp(OPTION_LETTER.source, 'm').test(text)) return 'alternativas';
  return 'generico';
}

// Quebra o texto em blocos por número de item (1, 2, 3…), devolvendo também o
// texto antes do primeiro número (normalmente instrução da prova, descartado).
function splitByItemNumber(text) {
  const matches = [...text.matchAll(ITEM_NUMBER)];
  return matches.map((match, index) => {
    const start = match.index + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : text.length;
    return { number: Number(match[1]), body: text.slice(start, end).trim() };
  });
}

// Cebraspe: cada item é uma afirmação julgada Certo/Errado contra o gabarito
// oficial (arquivo separado — DEC-07's "leitura do gabarito quando existir").
// gabarito: Map<number, 'certo'|'errado'|'anulada'>.
export function extractCebraspe(text, gabarito = new Map()) {
  const drafts = [];
  const manual = [];
  let voided = 0;
  for (const { number, body } of splitByItemNumber(text)) {
    const prompt = body.replace(/\s+/g, ' ').trim();
    if (!prompt) continue;
    const answer = gabarito.get(number);
    if (answer === 'anulada') {
      voided += 1;
      continue;
    }
    if (answer === 'certo' || answer === 'errado') {
      drafts.push({ number, kind: 'certo_errado', prompt, correta: answer, confidence: 'auto' });
    } else {
      manual.push({ number, prompt, reason: 'sem gabarito para este item' });
    }
  }
  return { drafts, manual, voided };
}

// Alternativas A-E (FGV/FCC/Vunesp): cada item tem um enunciado seguido de
// 2 a 5 alternativas rotuladas. gabarito: Map<number, letra ou 'anulada'>.
export function extractAlternatives(text, gabarito = new Map()) {
  const drafts = [];
  const manual = [];
  let voided = 0;
  for (const { number, body } of splitByItemNumber(text)) {
    const optionMatches = [...body.matchAll(OPTION_LETTER)];
    if (optionMatches.length < 2) {
      manual.push({ number, prompt: body.replace(/\s+/g, ' ').trim(), reason: 'não achei alternativas A-E' });
      continue;
    }
    const prompt = body.slice(0, optionMatches[0].index).replace(/\s+/g, ' ').trim();
    const options = optionMatches.map((match, index) => {
      const start = match.index + match[0].length;
      const end = index + 1 < optionMatches.length ? optionMatches[index + 1].index : body.length;
      return body.slice(start, end).replace(/\s+/g, ' ').trim();
    });
    if (!prompt || options.some((option) => !option)) {
      manual.push({ number, prompt: prompt || body.replace(/\s+/g, ' ').trim(), reason: 'enunciado ou alternativa vazia' });
      continue;
    }
    const answer = gabarito.get(number);
    if (answer === 'anulada') {
      voided += 1;
      continue;
    }
    const letters = optionMatches.map((match) => match[1]);
    const correctIndex = answer ? letters.indexOf(answer.toUpperCase()) : -1;
    if (correctIndex < 0) {
      manual.push({ number, prompt, reason: 'sem gabarito para este item' });
      continue;
    }
    drafts.push({ number, kind: 'multipla', prompt, options, correctOption: correctIndex, confidence: 'auto' });
  }
  return { drafts, manual, voided };
}

const GENERIC_ANSWER_LINE = /\n[ \t]*(resposta|gabarito)[ \t]*:[ \t]*/i;

// Rede de segurança para apostila/lista sem formato de concurso: tenta
// "pergunta + alternativas" (como alternativas A-E) e, se não achar, tenta
// "pergunta + gabarito" numa linha "Resposta:"/"Gabarito:"; o que sobrar fica
// manual, sem derrubar o restante do arquivo.
export function extractGeneric(text, gabarito = new Map()) {
  const byAlternatives = extractAlternatives(text, gabarito);
  if (byAlternatives.drafts.length) return byAlternatives;

  const drafts = [];
  const manual = [];
  for (const { number, body } of splitByItemNumber(text)) {
    const answerMatch = GENERIC_ANSWER_LINE.exec(body);
    if (!answerMatch) {
      manual.push({ number, prompt: body.replace(/\s+/g, ' ').trim(), reason: 'não achei alternativas nem gabarito' });
      continue;
    }
    const prompt = body.slice(0, answerMatch.index).replace(/\s+/g, ' ').trim();
    const modelAnswer = body.slice(answerMatch.index + answerMatch[0].length).replace(/\s+/g, ' ').trim();
    if (!prompt || !modelAnswer) {
      manual.push({ number, prompt: prompt || body.replace(/\s+/g, ' ').trim(), reason: 'enunciado ou gabarito vazio' });
      continue;
    }
    drafts.push({ number, kind: 'dissertativa', prompt, modelAnswer, confidence: 'auto' });
  }
  return { drafts, manual, voided: 0 };
}

const EXTRACTORS = { cebraspe: extractCebraspe, alternativas: extractAlternatives, generico: extractGeneric };

// Ponto de entrada do CLI: limpa o texto, decide o formato (ou usa o
// informado) e roda o parser certo. Sempre devolve um relatório do que não
// pôde cortar, nunca lança por causa de um item malformado isolado.
export function extractQuestions(rawText, { format, gabarito = new Map() } = {}) {
  const text = cleanText(rawText);
  const chosenFormat = format && EXTRACTORS[format] ? format : detectFormat(text);
  const { drafts, manual, voided } = EXTRACTORS[chosenFormat](text, gabarito);
  const report = [
    ...manual.map((item) => `Questão ${item.number}: manual (${item.reason})`),
    ...(voided ? [`${voided} questão(ões) anulada(s) pelo gabarito, fora do rascunho.`] : []),
  ];
  return { format: chosenFormat, drafts, manual, voided, report };
}

// Gabarito em texto simples, uma linha por item: "1 C", "2 ANULADA", "3 B".
// "C"/"E" é ambíguo entre Certo/Errado (Cebraspe) e letra de alternativa — por
// isso o formato é explícito, o mesmo que vai para extractQuestions.
export function parseGabarito(text, format = 'cebraspe') {
  const gabarito = new Map();
  for (const line of text.split(/\r?\n/)) {
    const match = /^\s*(\d{1,3})[.)]?\s+([a-zA-Z]+)\s*$/.exec(line);
    if (!match) continue;
    const value = match[2].toLowerCase();
    if (value.startsWith('anul')) {
      gabarito.set(Number(match[1]), 'anulada');
      continue;
    }
    const normalized =
      format === 'cebraspe'
        ? value === 'c' || value === 'certo'
          ? 'certo'
          : value === 'e' || value === 'errado'
            ? 'errado'
            : null
        : /^[a-e]$/.test(value)
          ? value.toUpperCase()
          : null;
    if (normalized) gabarito.set(Number(match[1]), normalized);
  }
  return gabarito;
}
