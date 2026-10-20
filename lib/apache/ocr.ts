// APA-10: ingestão de foto/print/PDF escaneado, OCR no navegador.
// Roda só do lado do cliente (Worker do Tesseract.js) — nunca chamado do
// servidor. `tesseract.js` é a única dependência nova deste card; `unpdf`
// (já instalado, PDF.js embutido) é reusado para renderizar cada página de
// um PDF escaneado como imagem antes do OCR — não adiciona `pdfjs-dist`.
// `unpdf` é importado dinamicamente (só dentro de ocrScannedPdf) para não
// entrar no bundle do servidor, que roda em todo request mesmo sem OCR.
//
// Tesseract.js e os dados do idioma (`por`) só são carregados quando o OCR
// é de fato acionado (import() dinâmico dentro de createOcrWorker). Worker,
// core WASM e o traineddata de `por` são servidos pelo próprio Atlas em
// `public/tesseract/` (decisão de revisão do APA-10: evita depender de
// integridade/disponibilidade de CDN de terceiro para um fluxo de
// ingestão de dados do aluno) -- ver TESSERACT_* abaixo.
import { ApacheError } from "./errors.js";
import { APACHE_DAILY_PAGE_LIMIT } from "./quota.js";

export type ApacheOcrPageResult = {
  page: number; // 1-based
  text: string;
  confidence: number; // 0-100, escala nativa do Tesseract (APA-11 usa <70 como corte para o fallback de letra de mão)
};

export type ApacheOcrProgress = {
  page: number;
  totalPages: number;
  status: string; // status bruto do Tesseract (ex.: "recognizing text")
  progress: number; // 0-1, dentro da página atual
};

export type ApacheOcrInput = { bytes: ArrayBuffer; mimeType: string };

type OcrStrategy = "image" | "pdf";

// Escala de render do unpdf: mais nitidez para o OCR em troca de mais
// memória/tempo no navegador. 2x é o ponto usado nos exemplos do unpdf.
const PDF_RENDER_SCALE = 2;

// DEC-020 item 2: teto duro de tamanho de arquivo para o OCR no navegador —
// independe de qualquer heurística de página, igual ao teto de caracteres
// do APA-09 para ingestão digital.
export const MAX_OCR_FILE_BYTES = 10 * 1024 * 1024;

// Gate APA-14: ao decodificar um PDF não confiável, limita o tamanho de uma
// única imagem declarada (~16 megapixels) para uma página maliciosa não
// alocar memória sem limite (recomendação do unpdf para PDFs não confiáveis).
const MAX_PDF_IMAGE_PIXELS = 16_777_216;

// Assets do Tesseract hospedados pelo próprio Atlas (public/tesseract/),
// nunca via CDN de terceiro — ver nota de topo deste arquivo.
const TESSERACT_WORKER_PATH = "/tesseract/worker.min.js";
const TESSERACT_CORE_PATH = "/tesseract/core";
const TESSERACT_LANG_PATH = "/tesseract/lang";

const GENERIC_OCR_ERROR = "Não foi possível ler o arquivo. Tente novamente ou envie outra foto/PDF.";

function pickOcrStrategy(mimeType: string): OcrStrategy {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  // Nunca ecoa o mimeType (ou qualquer outro dado enviado pelo usuário) de
  // volta pra UI — DEC-020 item 8.
  throw new ApacheError("Arquivo não é imagem nem PDF.", 400);
}

// DEC-020 item 2: rejeita antes de abrir/decodificar qualquer coisa.
function assertFileSize(file: ApacheOcrInput): void {
  if (file.bytes.byteLength > MAX_OCR_FILE_BYTES) {
    throw new ApacheError("Arquivo maior que 10 MB.", 413);
  }
}

// Mesmo teto da cota diária (APA-13): um único arquivo não pode ter mais
// páginas do que o limite do dia inteiro.
function assertPageLimit(totalPages: number): void {
  if (totalPages > APACHE_DAILY_PAGE_LIMIT) {
    throw new ApacheError(`PDF com mais de ${APACHE_DAILY_PAGE_LIMIT} páginas.`, 413);
  }
}

// DEC-020 item 8: mensagem crua de pdf.js/Tesseract.js/rede nunca chega à
// tela. Só ApacheError (sempre texto nosso, sem dado do usuário embutido)
// passa — qualquer outro erro vira mensagem genérica.
function toUserFacingError(error: unknown): ApacheError {
  if (error instanceof ApacheError) return error;
  return new ApacheError(GENERIC_OCR_ERROR, 500);
}

function assertNotAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw new ApacheError("Leitura cancelada.", 400);
  }
}

async function safeTerminate(worker: { terminate: () => Promise<unknown> }): Promise<void> {
  try {
    await worker.terminate();
  } catch {
    // já terminado (ex.: abort concorrente) — nada a fazer.
  }
}

async function createOcrWorker(
  pageRef: { page: number; totalPages: number },
  onProgress?: (progress: ApacheOcrProgress) => void,
  signal?: AbortSignal,
) {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("por", 1, {
    workerPath: TESSERACT_WORKER_PATH,
    corePath: TESSERACT_CORE_PATH,
    langPath: TESSERACT_LANG_PATH,
    logger: (message: { status?: unknown; progress?: unknown }) => {
      if (!onProgress) return;
      if (typeof message?.progress !== "number") return;
      onProgress({
        page: pageRef.page,
        totalPages: pageRef.totalPages,
        status: typeof message.status === "string" ? message.status : "",
        progress: message.progress,
      });
    },
  });
  if (signal) {
    if (signal.aborted) {
      void safeTerminate(worker);
    } else {
      signal.addEventListener("abort", () => void safeTerminate(worker), { once: true });
    }
  }
  return worker;
}

async function recognizePage(
  worker: Awaited<ReturnType<typeof createOcrWorker>>,
  image: Blob,
): Promise<{ text: string; confidence: number }> {
  const { data } = await worker.recognize(image);
  return { text: data.text, confidence: data.confidence };
}

async function ocrImage(
  file: ApacheOcrInput,
  onProgress?: (progress: ApacheOcrProgress) => void,
  signal?: AbortSignal,
): Promise<ApacheOcrPageResult[]> {
  const pageRef = { page: 1, totalPages: 1 };
  const worker = await createOcrWorker(pageRef, onProgress, signal);
  try {
    assertNotAborted(signal);
    const blob = new Blob([file.bytes], { type: file.mimeType });
    const { text, confidence } = await recognizePage(worker, blob);
    return [{ page: 1, text, confidence }];
  } finally {
    await safeTerminate(worker);
  }
}

async function ocrScannedPdf(
  file: ApacheOcrInput,
  onProgress?: (progress: ApacheOcrProgress) => void,
  signal?: AbortSignal,
): Promise<ApacheOcrPageResult[]> {
  const { getDocumentProxy, renderPageAsImage } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(file.bytes), { maxImageSize: MAX_PDF_IMAGE_PIXELS });
  try {
    const totalPages = pdf.numPages;
    if (totalPages < 1) {
      throw new ApacheError("PDF escaneado sem páginas", 400);
    }
    assertPageLimit(totalPages);
    const pageRef = { page: 1, totalPages };
    const worker = await createOcrWorker(pageRef, onProgress, signal);
    try {
      const results: ApacheOcrPageResult[] = [];
      for (let page = 1; page <= totalPages; page += 1) {
        assertNotAborted(signal);
        pageRef.page = page;
        const pageProxy = await pdf.getPage(page);
        try {
          const image = await renderPageAsImage(pdf, page, { scale: PDF_RENDER_SCALE });
          const blob = new Blob([image as ArrayBuffer], { type: "image/png" });
          const { text, confidence } = await recognizePage(worker, blob);
          results.push({ page, text, confidence });
        } finally {
          pageProxy.cleanup();
        }
      }
      return results;
    } finally {
      await safeTerminate(worker);
    }
  } finally {
    await pdf.destroy();
  }
}

// Ponto único chamado pelo formulário de enriquecimento (APA-12): decide a
// estratégia pelo mimeType e devolve texto + confidence por página. Quem
// chama decide o fallback por confiança (APA-11, corte em 70). `signal`
// cancela o OCR em andamento (ex.: componente desmontado) e garante que o
// worker do Tesseract seja encerrado.
export async function ocrFile(
  file: ApacheOcrInput,
  onProgress?: (progress: ApacheOcrProgress) => void,
  signal?: AbortSignal,
): Promise<ApacheOcrPageResult[]> {
  try {
    assertFileSize(file);
    const strategy = pickOcrStrategy(file.mimeType);
    return strategy === "image" ? await ocrImage(file, onProgress, signal) : await ocrScannedPdf(file, onProgress, signal);
  } catch (error) {
    throw toUserFacingError(error);
  }
}

export { pickOcrStrategy };
