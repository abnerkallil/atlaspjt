// APA-10: ingestão de foto/print/PDF escaneado, OCR no navegador.
// Roda só do lado do cliente (Worker do Tesseract.js) — nunca chamado do
// servidor. `tesseract.js` é a única dependência nova deste card; `unpdf`
// (já instalado, PDF.js embutido) é reusado para renderizar cada página de
// um PDF escaneado como imagem antes do OCR — não adiciona `pdfjs-dist`.
//
// Tesseract.js e os dados do idioma (`por`) só são baixados quando o OCR é
// de fato acionado (import() dinâmico dentro de createOcrWorker), para não
// pesar o bundle principal de quem nunca envia foto/escaneado.
import { getDocumentProxy, renderPageAsImage } from "unpdf";
import { ApacheError } from "./errors.js";

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

function pickOcrStrategy(mimeType: string): OcrStrategy {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  throw new ApacheError(`tipo "${mimeType}" não é imagem nem PDF escaneado`, 400);
}

async function createOcrWorker(
  pageRef: { page: number; totalPages: number },
  onProgress?: (progress: ApacheOcrProgress) => void,
) {
  const { createWorker } = await import("tesseract.js");
  return createWorker("por", 1, {
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
): Promise<ApacheOcrPageResult[]> {
  const pageRef = { page: 1, totalPages: 1 };
  const worker = await createOcrWorker(pageRef, onProgress);
  try {
    const blob = new Blob([file.bytes], { type: file.mimeType });
    const { text, confidence } = await recognizePage(worker, blob);
    return [{ page: 1, text, confidence }];
  } finally {
    await worker.terminate();
  }
}

async function ocrScannedPdf(
  file: ApacheOcrInput,
  onProgress?: (progress: ApacheOcrProgress) => void,
): Promise<ApacheOcrPageResult[]> {
  const pdf = await getDocumentProxy(new Uint8Array(file.bytes));
  const totalPages = pdf.numPages;
  if (totalPages < 1) {
    throw new ApacheError("PDF escaneado sem páginas", 400);
  }
  const pageRef = { page: 1, totalPages };
  const worker = await createOcrWorker(pageRef, onProgress);
  try {
    const results: ApacheOcrPageResult[] = [];
    for (let page = 1; page <= totalPages; page += 1) {
      pageRef.page = page;
      const image = await renderPageAsImage(pdf, page, { scale: PDF_RENDER_SCALE });
      const blob = new Blob([image as ArrayBuffer], { type: "image/png" });
      const { text, confidence } = await recognizePage(worker, blob);
      results.push({ page, text, confidence });
    }
    return results;
  } finally {
    await worker.terminate();
  }
}

// Ponto único chamado pelo formulário de enriquecimento (APA-12): decide a
// estratégia pelo mimeType e devolve texto + confidence por página. Quem
// chama decide o fallback por confiança (APA-11, corte em 70).
export async function ocrFile(
  file: ApacheOcrInput,
  onProgress?: (progress: ApacheOcrProgress) => void,
): Promise<ApacheOcrPageResult[]> {
  const strategy = pickOcrStrategy(file.mimeType);
  return strategy === "image" ? ocrImage(file, onProgress) : ocrScannedPdf(file, onProgress);
}

export { pickOcrStrategy };
