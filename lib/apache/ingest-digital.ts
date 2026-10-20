// APA-09: ingestão de arquivo digital (PDF/DOCX/XLSX) via env.AI.toMarkdown —
// grátis para texto digital, sem OCR (um PDF escaneado sai vazio ou quase
// vazio, ver `provavelmenteEscaneado` abaixo; nesse caso o chamador tenta
// APA-10). Chamado pelo APA-12 depois de `validateApacheUpload` (magic
// bytes) já ter confirmado o tipo do arquivo.
import { ApacheError } from './errors.js';

// Gate APA-14 item 5: teto duro, independente da heurística de páginas
// abaixo — evita que um arquivo minta sobre a contagem de páginas para
// contornar o corte síncrono/fila ou a cota diária (90 páginas × 6.000
// caracteres, mesmo teto usado por APA-13).
export const MAX_EXTRACTED_CHARS = 540_000;

// Heurística de tamanho de página, usada tanto no teto acima quanto na
// estimativa de páginas abaixo quando não há marcador de página (DOCX/
// XLSX, ou PDF sem quebras detectadas). Não é exata — é a mesma premissa
// de 6.000 caracteres/página da cota diária (APA-13), nunca a contagem
// real do documento original.
const CHARS_PER_PAGE_ESTIMATE = 6_000;

// Abaixo disso, o markdown extraído é considerado "provavelmente
// escaneado": o toMarkdown roda sem OCR, então um PDF escaneado (ou uma
// página em branco/imagem pura) volta vazio ou quase vazio independente
// do tamanho do arquivo original.
const SCANNED_LIKELY_MAX_CHARS = 200;

// Marcador de página que o toMarkdown emite para PDFs digitais (ex.:
// "### Page 3"). DOCX/XLSX não têm paginação real, então a contagem cai
// no fallback por tamanho de texto acima.
const PAGE_MARKER_PATTERN = /^#+\s*Page\s+\d+\s*$/gim;

const SUPPORTED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
]);

export type DigitalExtraction = {
  markdown: string;
  pages: number;
  provavelmenteEscaneado: boolean;
};

// Só a fração de `Ai.toMarkdown` que este módulo usa — evita depender do
// pacote `@cloudflare/workers-types` inteiro só por esse tipo e facilita
// o mock nos testes.
export type MarkdownConversionAi = {
  toMarkdown(file: { name: string; blob: Blob }): Promise<{
    format: 'markdown' | 'text' | 'error';
    data?: string;
    error?: string;
  }>;
};

export async function extractDigital(
  ai: MarkdownConversionAi,
  file: { bytes: ArrayBuffer; mimeType: string; name?: string },
): Promise<DigitalExtraction> {
  if (!SUPPORTED_MIME_TYPES.has(file.mimeType)) {
    throw new ApacheError('tipo de arquivo não suportado para ingestão digital', 415);
  }

  const result = await ai.toMarkdown({
    name: file.name ?? 'documento',
    blob: new Blob([file.bytes], { type: file.mimeType }),
  });

  if (result.format === 'error' || result.data === undefined) {
    throw new ApacheError('não foi possível extrair o conteúdo do arquivo', 422);
  }

  const markdown = result.data;

  // Gate APA-14 item 5: rejeita antes de qualquer outro cálculo, mesmo que
  // a heurística de páginas abaixo diga um número menor.
  if (markdown.length > MAX_EXTRACTED_CHARS) {
    throw new ApacheError('arquivo excede o tamanho máximo de conteúdo extraído', 413);
  }

  const pageMarkers = markdown.match(PAGE_MARKER_PATTERN);
  const pages =
    pageMarkers && pageMarkers.length > 0
      ? pageMarkers.length
      : Math.max(1, Math.ceil(markdown.length / CHARS_PER_PAGE_ESTIMATE));

  const provavelmenteEscaneado = markdown.trim().length < SCANNED_LIKELY_MAX_CHARS;

  return { markdown, pages, provavelmenteEscaneado };
}
