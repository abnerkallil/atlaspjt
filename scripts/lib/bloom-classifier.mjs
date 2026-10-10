// Mesma lógica de lib/apolo/bloom-classifier.ts, duplicada aqui de propósito
// (como themeSlug em apolo-fonte.mjs/apolo-fontes-autorais.mjs): este script
// roda fora do bundle da Worker, sem o compilador TS. Qualquer ajuste na
// regra precisa ser feito nos dois lugares — tests/apolo-bloom-classifier.test.ts
// cobre a versão TS; este arquivo não tem teste próprio porque é cópia 1:1.
function norm(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

const CUES = [
  {
    level: 'criar',
    patterns: [
      /\bcrie\b/, /\belabore\b/, /\bproponha\b/, /\bformule\b/, /\bdesenvolva um (plano|modelo|projeto|roteiro)\b/,
      /\bredija\b.*\b(minuta|peticao|parecer|plano)\b/, /\belabore\b.*\bplano\b/,
    ],
  },
  {
    level: 'avaliar',
    patterns: [
      /\bavalie\b/, /\bjulgue\b(?!.{0,20}certo ou errado)/, /\bcritique\b/, /\bjustifique sua escolha\b/,
      /\bqual (a melhor|a mais adequada|a opcao mais)\b.*\bconsiderando\b/, /\bargumente\b/,
      /\baponte a inconsistencia\b/, /\bidentifique o erro (de|no) (raciocinio|argumento)\b/,
    ],
  },
  {
    level: 'analisar',
    patterns: [
      /\banalise\b/, /\bdiferencie\b/, /\bcompare as (causas|consequencias)\b/, /\bqual a relacao entre\b/,
      /\bclassifique os elementos\b/, /\bquais fatores explicam\b/, /\bdecomponha\b/,
      /\bquais seriam as consequencias de\b/, /\bdistinga\b/,
    ],
  },
  {
    level: 'aplicar',
    patterns: [
      /\bcalcule\b/, /\bdetermine o (valor|resultado|saldo|total)\b/, /\baplique a (regra|formula|norma)\b/,
      /\bresolva\b/, /\bqual (e|sera) o (valor|resultado|saldo|total)\b/, /\bconsiderando o caso\b.*\bcalcule\b/,
      /\bem quanto\b/, /\bqual o montante\b/, /\bde quantas formas\b/, /\bproximo termo\b/,
    ],
  },
  {
    level: 'entender',
    patterns: [
      /\bexplique\b/, /\bdescreva\b/, /\bo que significa\b/, /\bresuma\b/, /\binterprete\b/,
      /\bqual a diferenca entre\b/, /\bexemplifique\b/, /\bem outras palavras\b/,
      /\bpor que\b/, /\bqual o motivo\b/,
    ],
  },
  {
    level: 'lembrar',
    patterns: [
      /\bdefina\b/, /\bcite\b/, /\bliste\b/, /\bidentifique\b/, /\bqual e o nome\b/,
      /\bassinale a alternativa que (apresenta|contem)\b/, /\baponte\b/, /\bqual o conceito de\b/,
      /\bsegundo (a lei|a constituicao|o codigo|a clt)\b/,
      /^sobre .+, qual das alternativas a seguir esta correta/,
    ],
  },
];

// Cenário numérico concreto (valor com unidade) + pergunta de quantidade,
// mesmo em frases diferentes — ver o comentário equivalente em
// lib/apolo/bloom-classifier.ts.
const NUMERIC_SCENARIO_UNIT =
  /\d+([.,]\d+)?\s?(metros?|km|m2|m²|kg|g|cm|dias?|anos?|mes(es)?|parcelas?|%|r\$|reais|unidades?|vezes)/;
const QUANTITY_QUESTION = /\b(quanto|quantos|quantas|qual)\b/;

function hasNumericScenario(text) {
  return NUMERIC_SCENARIO_UNIT.test(text) && QUANTITY_QUESTION.test(text);
}

const DEFAULT_BY_KIND = {
  calculo: 'aplicar',
  lacuna_numerica: 'aplicar',
  dissertativa: 'entender',
  certo_errado: 'entender',
  multipla: 'entender',
};

export function suggestBloomLevel(kind, prompt, context) {
  const text = norm(`${prompt} ${context ?? ''}`);
  for (const { level, patterns } of CUES) {
    if (level === 'aplicar' && hasNumericScenario(text)) {
      return { level, matchedCue: 'cenario-numerico-com-pergunta-de-quantidade' };
    }
    for (const pattern of patterns) {
      if (pattern.test(text)) return { level, matchedCue: pattern.source };
    }
  }
  return { level: DEFAULT_BY_KIND[kind] ?? 'entender', matchedCue: null };
}
