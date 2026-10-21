'use client';

// APA-10: indicador de progresso do OCR no navegador, para o formulário de
// enriquecimento (APA-12) usar quando o arquivo enviado é imagem/print ou
// PDF sinalizado como escaneado. Não é o formulário em si — só o pedaço de
// UI que roda `ocrFile` e mostra o progresso por página enquanto ele roda.
import { useEffect, useState } from 'react';
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress';
import { ocrFile, type ApacheOcrInput, type ApacheOcrPageResult, type ApacheOcrProgress } from '@/lib/apache/ocr';

type ApacheOcrRunnerProps = {
  file: ApacheOcrInput;
  onDone: (pages: ApacheOcrPageResult[]) => void;
  onError: (message: string) => void;
};

// Quem monta este componente deve dar um `key` por arquivo (ex.: key={file
// hash/nome}) — troca de `file` sem remontar reaproveita o `progress` da
// rodada anterior até o primeiro evento de progresso chegar.

const GENERIC_ERROR = 'Não foi possível ler o arquivo. Tente novamente ou envie outra foto/PDF.';

function statusLabel(progress: ApacheOcrProgress | null): string {
  if (!progress) return 'Preparando OCR…';
  const pagina = progress.totalPages > 1 ? `página ${progress.page}/${progress.totalPages} — ` : '';
  return `${pagina}reconhecendo texto…`;
}

// Componente controlado: dispara o OCR no efeito (nunca no corpo do render)
// e expõe o resultado via onDone/onError — quem o usa (APA-12) decide o
// que fazer com o resultado (inclusive o fallback de letra de mão do
// APA-11, por confidence < 70). Desmontar cancela o OCR em andamento via
// AbortSignal, que encerra o worker do Tesseract (ver lib/apache/ocr.ts).
export function ApacheOcrRunner({ file, onDone, onError }: ApacheOcrRunnerProps) {
  const [progress, setProgress] = useState<ApacheOcrProgress | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    ocrFile(file, setProgress, controller.signal)
      .then((pages) => {
        if (!controller.signal.aborted) onDone(pages);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        // lib/apache/ocr.ts só rejeita com ApacheError (mensagem já segura
        // para a tela); qualquer outro caso cai no genérico por garantia.
        onError(error instanceof Error ? error.message : GENERIC_ERROR);
      });
    return () => controller.abort();
    // onDone/onError na dependência: quem usa este componente (APA-12)
    // deve passar callbacks estáveis (useCallback) para não reiniciar o
    // OCR em todo re-render.
  }, [file, onDone, onError]);

  const value = progress ? Math.round(progress.progress * 100) : 0;

  return (
    <Progress value={value} className="apache-ocr-progress">
      <ProgressLabel>{statusLabel(progress)}</ProgressLabel>
      <ProgressValue />
    </Progress>
  );
}
