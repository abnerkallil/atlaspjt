// Sugestão de nível de Bloom (APO-07, DEC-014): sem IA externa, regra fixa
// em código, auditável — exatamente a mesma exigência que já vale para o
// resto do Apolo. Isto NUNCA decide por conta própria: só pré-marca o campo
// "Nível de Bloom" na curadoria (`/rascunhos`) com um palpite, que o humano
// confirma, troca ou ignora antes de aprovar (a aprovação continua exigindo
// Bloom preenchido, igual antes).
//
// Base científica (pesquisada para o Abner, resumo em `docs/FONTES.md`): a
// taxonomia revisada de Anderson & Krathwohl (2001) define o nível pelo
// *processo cognitivo que a pergunta exige* — o verbo de comando, não o
// assunto nem a dificuldade. Os seis níveis (do mais simples ao mais
// complexo): lembrar, entender, aplicar, analisar, avaliar, criar. A
// literatura sobre classificação automática (Jayakodi et al. 2016; Omar et
// al. 2012; UKM/Shaharanee et al.) usa exatamente essa ideia — casar o verbo
// de comando do enunciado com o nível — mas também mostra o limite dela:
// verbo isolado acerta só ~47-55% dos casos; com mais contexto (tipo de
// questão, se apresenta um caso concreto, se pede juízo entre alternativas)
// passa de 70%. As regras abaixo seguem essa segunda abordagem: o verbo é o
// sinal principal, mas o tipo da questão (`kind`) e pistas de "caso aplicado"
// ou "julgamento entre alternativas" desempatam. Ainda assim é uma
// aproximação — o Abner revisa e corrige sempre que o palpite não bater.
import type { QuestionKind } from './types.js';
import { BLOOM_LEVELS, type BloomLevel } from './types.js';

function norm(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

// Ordem de prioridade: do processo mais complexo (criar) para o mais simples
// (lembrar). Um enunciado que mistura pistas de mais de um nível fica com o
// mais complexo que aparecer — pedir para "calcular e depois justificar qual
// opção é melhor" é avaliar, não só aplicar.
const CUES: Array<{ level: BloomLevel; patterns: RegExp[] }> = [
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
      // Gabarito de reconhecimento puro, sem cenário nem verbo de comando:
      // "Sobre <assunto>, qual das alternativas a seguir está correta?" pede
      // só reconhecer a afirmação certa entre distratoras — o exemplo clássico
      // de "lembrar" na literatura (recognition), não "entender".
      /^sobre .+, qual das alternativas a seguir esta correta/,
    ],
  },
];

// Problema com cenário numérico concreto (um valor com unidade no enunciado)
// combinado com uma pergunta de quantidade — mesmo quando o número e a
// pergunta caem em frases diferentes ("Um terreno mede 28m... Qual o
// perímetro?"). Isso exige aplicar um procedimento ao caso dado, não só
// lembrar ou entender uma regra (Anderson & Krathwohl: o caso aplicado é o
// que distingue "aplicar" de "entender"). Checado separado das pistas de
// verbo porque as duas partes podem estar em frases diferentes do enunciado.
const NUMERIC_SCENARIO_UNIT =
  /\d+([.,]\d+)?\s?(metros?|km|m2|m²|kg|g|cm|dias?|anos?|mes(es)?|parcelas?|%|r\$|reais|unidades?|vezes)/;
const QUANTITY_QUESTION = /\b(quanto|quantos|quantas|qual)\b/;

function hasNumericScenario(text: string): boolean {
  return NUMERIC_SCENARIO_UNIT.test(text) && QUANTITY_QUESTION.test(text);
}

// Palpite de reserva quando nenhuma pista textual bate — varia por tipo de
// questão porque o formato já diz algo sobre o processo cognitivo típico
// (cálculo/lacuna numérica quase sempre pedem aplicar uma fórmula a um caso;
// certo/errado e múltipla escolha deste banco, em geral, restatam uma regra
// e pedem para o aluno reconhecer se ela foi aplicada certo — compreensão,
// não memorização pura, quando há qualquer contexto além do termo isolado).
const DEFAULT_BY_KIND: Record<QuestionKind, BloomLevel> = {
  calculo: 'aplicar',
  lacuna_numerica: 'aplicar',
  dissertativa: 'entender',
  certo_errado: 'entender',
  multipla: 'entender',
};

export type BloomSuggestion = {
  level: BloomLevel;
  // Pista que decidiu o nível, ou null quando veio do palpite de reserva por
  // tipo de questão (nenhum padrão textual bateu).
  matchedCue: string | null;
};

// Função pura, determinística: mesma entrada, mesma saída sempre — nunca
// chama rede nem modelo externo (DEC-014).
export function suggestBloomLevel(kind: QuestionKind, prompt: string, context?: string | null): BloomSuggestion {
  const text = norm(`${prompt} ${context ?? ''}`);
  for (const { level, patterns } of CUES) {
    // "aplicar" ganha também pelo cenário numérico cruzando frases, checado
    // antes das patterns pontuais desse nível (mesma prioridade na ordem).
    if (level === 'aplicar' && hasNumericScenario(text)) {
      return { level, matchedCue: 'cenario-numerico-com-pergunta-de-quantidade' };
    }
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return { level, matchedCue: pattern.source };
      }
    }
  }
  return { level: DEFAULT_BY_KIND[kind], matchedCue: null };
}

export function isBloomLevel(value: string): value is BloomLevel {
  return (BLOOM_LEVELS as readonly string[]).includes(value);
}
