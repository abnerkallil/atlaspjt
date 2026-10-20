'use client';

// APA-10: indicador de progresso do OCR no navegador, para o formulário de
// enriquecimento (APA-12) usar quando o arquivo enviado é imagem/print ou
// PDF sinalizado como escaneado. Não é o formulário em si — só o pedaço de
// UI que roda `ocrFile` e mostra o progresso por página enquanto ele roda.
import { useState } from 'react';
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress';
import { ocrFile, type ApacheOcrInput, type ApacheOcrPageResult, type ApacheOcrProgress } from '@/lib/apache/ocr';

type ApacheOcrRunnerProps = {
  file: ApacheOcrInput;
  onDone: (pages: ApacheOcrPageResult[]) => void;
  onError: (message: string) => void;
};

function statusLabel(progress: ApacheOcrProgress | null): string {
  if (!progress) return 'Preparando OCR…';
  const pagina = progress.totalPages > 1 ? `página ${progress.page}/${progress.totalPages} — ` : '';
  return `${pagina}reconhecendo texto…`;
}

// Componente controlado: dispara o OCR ao montar e expõe o resultado via
// onDone/onError — quem o usa (APA-12) decide o que fazer com o resultado
// (inclusive o fallback de letra de mão do APA-11, por confidence < 70).
export function ApacheOcrRunner({ file, onDone, onError }: ApacheOcrRunnerProps) {
  const [progress, setProgress] = useState<ApacheOcrProgress | null>(null);
  const [started, setStarted] = useState(false);

  if (!started) {
    setStarted(true);
    ocrFile(file, setProgress)
      .then(onDone)
      .catch((error: unknown) => onError(error instanceof Error ? error.message : 'Não foi possível ler o arquivo.'));
  }

  const value = progress ? Math.round(progress.progress * 100) : 0;

  return (
    <Progress value={value} className="apache-ocr-progress">
      <ProgressLabel>{statusLabel(progress)}</ProgressLabel>
      <ProgressValue />
    </Progress>
  );
}
