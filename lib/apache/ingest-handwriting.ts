// APA-11: fallback de letra de mão via Workers AI (Llama 3.2 11B vision).
// Acionado pelo chamador (APA-12) quando a `confidence` de uma página do
// OCR (APA-10, escala 0-100 do Tesseract) fica abaixo de
// OCR_CONFIDENCE_FALLBACK_THRESHOLD, ou quando a pessoa marca o checkbox
// "Este arquivo tem letra de mão" no formulário de envio. Só roda no
// servidor -- `env.AI` não existe no navegador, ao contrário do OCR do
// APA-10, que só roda lá.
//
// Os bytes da imagem só existem como o `ArrayBuffer` recebido por
// parâmetro: este módulo nunca os grava em R2, D1 ou qualquer outro
// lugar, e não guarda referência além da chamada — depois que
// `extractHandwriting` retorna (sucesso ou erro), não resta nenhuma
// cópia dos bytes do lado do servidor.
import type { D1Like } from '../pedagogy/transitions.js';
import { ApacheError } from './errors.js';
import { MAX_OCR_FILE_BYTES } from './ocr.js';
import {
  estimateNeurons,
  neuronBudgetRemaining,
  recordNeuronUsage,
  FALLBACK_PROMPT_TOKENS,
} from './neuron-meter.js';

// Verificado em developers.cloudflare.com/workers-ai/models/llama-3.2-11b-vision-instruct/
// em 2026-10-21: aceita `messages` (chat) + `image` (base64 ou data URI).
// Taxa de neurons deste modelo já está cadastrada em NEURON_RATE_PER_MILLION_TOKENS
// (lib/apache/neuron-meter.ts).
export const HANDWRITING_MODEL = '@cf/meta/llama-3.2-11b-vision-instruct';

// Corte de confiança do OCR (APA-10) abaixo do qual o chamador deve
// acionar este fallback -- decisão do card APA-11.
export const OCR_CONFIDENCE_FALLBACK_THRESHOLD = 70;

// Teto explícito de tokens de saída: uma página manuscrita não precisa de
// mais que isso (bem mais que o default de 256 do modelo), e dá um "pior
// caso" conhecido para a checagem de orçamento abaixo.
export const MAX_OUTPUT_TOKENS = 1024;

const HANDWRITING_ERROR_RESPONSE_SHAPE =
  'A transcrição da letra de mão veio num formato inesperado.';

// Prompt fixo, sem nenhum texto vindo do aluno ou do arquivo -- a imagem é
// enviada como dado binário separado, nunca concatenada nesta string, então
// não há superfície de prompt-injection aqui (DEC-020 item 1 é sobre texto
// concatenado no prompt; esse nunca é o caso deste módulo).
const HANDWRITING_PROMPT =
  'Transcreva o texto manuscrito desta imagem, em português. Devolva só o texto transcrito, sem comentários e sem formatação markdown.';

const GENERIC_HANDWRITING_ERROR =
  'Não foi possível ler a letra de mão deste arquivo. Tente enviar uma foto mais nítida.';

const BUDGET_EXHAUSTED_ERROR =
  'Orçamento diário de IA do Apache esgotado. Tente de novo depois da meia-noite (UTC).';

// Entrada deste módulo é sempre uma imagem: a página já veio da própria
// imagem enviada ou do render de uma página de PDF escaneado (ocr.ts
// sempre gera PNG nesse segundo caso) -- nunca um PDF bruto.
const SUPPORTED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

// Marcador interno (nunca um ApacheError real) usado só para sinalizar, no
// catch de extractHandwriting, que o erro veio do orçamento e não deve
// cair na mensagem genérica -- ver toUserFacingError.
class NeuronBudgetExhaustedError extends Error {}

// Sem uma fórmula oficial publicada de tokens-por-imagem para este modelo
// (ao contrário da família Clef, que documenta patches de 32x32px), usamos
// a mesma estimativa de fallback adotada em todo o Apache quando não há
// usage ainda (FALLBACK_PROMPT_TOKENS, 3k) como pior caso de entrada antes
// da chamada. A saída tem o teto explícito de MAX_OUTPUT_TOKENS.
function worstCaseNeuronEstimate(): number {
  return estimateNeurons(HANDWRITING_MODEL, {
    promptTokens: FALLBACK_PROMPT_TOKENS,
    completionTokens: MAX_OUTPUT_TOKENS,
  });
}

// Só a fração de `env.AI.run` que este módulo usa -- mesmo princípio do
// `MarkdownConversionAi` em ingest-digital.ts: evita depender do pacote
// `@cloudflare/workers-types` inteiro e facilita o mock nos testes.
export type VisionAi = {
  run(
    model: string,
    inputs: {
      messages: { role: 'system' | 'user'; content: string }[];
      image: string;
      max_tokens: number;
    },
  ): Promise<{
    response?: unknown;
    // Nomes exatamente como o Workers AI devolve (snake_case) -- ver
    // developers.cloudflare.com/ai-search/api/search/workers-binding/.
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  }>;
};

export type HandwritingExtraction = { text: string; neuronsUsed: number };

function toBase64(bytes: ArrayBuffer): string {
  // btoa espera uma string binária; evitamos depender de Buffer (só
  // disponível via nodejs_compat) para este módulo rodar igual em
  // qualquer runtime de Workers.
  const view = new Uint8Array(bytes);
  let binary = '';
  const CHUNK_SIZE = 0x8000;
  for (let i = 0; i < view.length; i += CHUNK_SIZE) {
    binary += String.fromCharCode(...view.subarray(i, i + CHUNK_SIZE));
  }
  return btoa(binary);
}

function assertFileSize(bytes: ArrayBuffer): void {
  if (bytes.byteLength > MAX_OCR_FILE_BYTES) {
    throw new ApacheError('Arquivo maior que 10 MB.', 413);
  }
}

function assertSupportedMimeType(mimeType: string): void {
  if (!SUPPORTED_MIME_TYPES.has(mimeType)) {
    // DEC-020 item 8: nunca ecoa o mimeType recebido de volta pro chamador.
    throw new ApacheError('Arquivo não é uma imagem suportada para leitura de letra de mão.', 400);
  }
}

// Workers AI sinaliza orçamento de neurons esgotado com o código 3036
// (HTTP 429). O erro lançado pelo binding real carrega isso de formas
// diferentes dependendo do runtime (campo `code`, `status`, ou só no
// `message`) -- checamos todas para não deixar passar batido como erro
// genérico, já que o chamador (APA-12) precisa distinguir "esgotado" (filar
// pro dia seguinte, DEC-019) de qualquer outra falha.
function isNeuronBudgetExhaustedResponse(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const withCode = error as { code?: unknown; status?: unknown; message?: unknown };
  if (withCode.code === 3036 || withCode.status === 429) return true;
  return typeof withCode.message === 'string' && withCode.message.includes('3036');
}

// DEC-020 item 8: mensagem crua do Workers AI (erro de rede, formato
// inesperado, etc.) nunca chega à tela -- só ApacheError (sempre texto
// nosso) passa adiante, exceto o caso de orçamento esgotado, que o
// chamador precisa reconhecer pelo texto fixo acima.
function toUserFacingError(error: unknown): ApacheError {
  if (error instanceof ApacheError) return error;
  if (error instanceof NeuronBudgetExhaustedError || isNeuronBudgetExhaustedResponse(error)) {
    return new ApacheError(BUDGET_EXHAUSTED_ERROR, 429);
  }
  return new ApacheError(GENERIC_HANDWRITING_ERROR, 500);
}

export async function extractHandwriting(
  ai: VisionAi,
  db: D1Like,
  imageBytes: ArrayBuffer,
  mimeType: string,
  now: Date = new Date(),
): Promise<HandwritingExtraction> {
  try {
    assertFileSize(imageBytes);
    assertSupportedMimeType(mimeType);

    // Checa o orçamento diário pelo pior caso ANTES de gastar qualquer
    // neuron (DEC-019): nunca estoura mesmo que o usage real da chamada
    // venha menor do que esse pior caso.
    const nowIso = now.toISOString();
    const budget = await neuronBudgetRemaining(db, nowIso);
    if (budget.overLimit || budget.remaining < worstCaseNeuronEstimate()) {
      throw new NeuronBudgetExhaustedError();
    }

    const image = `data:${mimeType};base64,${toBase64(imageBytes)}`;
    let result: Awaited<ReturnType<VisionAi['run']>>;
    try {
      result = await ai.run(HANDWRITING_MODEL, {
        messages: [
          { role: 'system', content: 'Você transcreve texto manuscrito de imagens, sem adicionar comentários.' },
          { role: 'user', content: HANDWRITING_PROMPT },
        ],
        image,
        max_tokens: MAX_OUTPUT_TOKENS,
      });
    } catch (error) {
      if (isNeuronBudgetExhaustedResponse(error)) throw new NeuronBudgetExhaustedError();
      throw error;
    }

    // Só texto puro é aceito: sem response_format/JSON mode pedido aqui,
    // um `response` que não seja string é um formato que este módulo não
    // sabe interpretar com segurança (nunca tenta serializar e devolver).
    if (typeof result.response !== 'string') {
      throw new ApacheError(HANDWRITING_ERROR_RESPONSE_SHAPE, 500);
    }
    const text = result.response.trim();
    if (!text) {
      throw new ApacheError('A transcrição da letra de mão veio vazia.', 422);
    }

    const hasUsage =
      typeof result.usage?.prompt_tokens === 'number' && typeof result.usage?.completion_tokens === 'number';
    const neuronsUsed = estimateNeurons(
      HANDWRITING_MODEL,
      hasUsage
        ? { promptTokens: result.usage!.prompt_tokens!, completionTokens: result.usage!.completion_tokens! }
        : undefined,
    );

    await recordNeuronUsage(db, neuronsUsed, nowIso);

    return { text, neuronsUsed };
  } catch (error) {
    throw toUserFacingError(error);
  }
}
