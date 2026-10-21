'use client';

// APA-12: formulário de envio do material do aluno para enriquecimento --
// rota própria (ver lib/apache/enrichment.ts), não é o formulário "Adicionar
// material" (ContentMaterials). PDF/DOCX/XLSX vão direto para o servidor
// (POST /api/apache/enriquecimento, que extrai o texto com APA-09); foto/
// print/PDF escaneado passam primeiro pelo OCR no navegador (ApacheOcrRunner,
// APA-10) antes de mandar o texto extraído para POST .../texto. Confidence
// baixa (<70) OU o checkbox "letra de mão" aciona o fallback de visão
// (APA-11, POST .../letra-de-mao) -- só para upload de 1 imagem só: um PDF
// escaneado de várias páginas não expõe a imagem de cada página para este
// componente (ocr.ts só devolve texto+confidence por página), então o
// fallback automático por página fica fora do escopo deste card para esse
// caso -- o checkbox manual ainda cobre o caso de imagem única.
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ApacheOcrRunner } from '@/components/apache/ocr-progress';
import type { ApacheOcrInput, ApacheOcrPageResult } from '@/lib/apache/ocr';
import { OCR_CONFIDENCE_FALLBACK_THRESHOLD } from '@/lib/apache/ingest-handwriting';

const DIGITAL_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

// Lado maior ~1120px, JPEG (card APA-11: a arquitetura do Llama 3.2 Vision
// processa a imagem em tiles de 560x560px -- enviar além disso só gasta
// banda/CPU sem ganho de leitura).
const HANDWRITING_MAX_SIDE = 1120;

type Stage = 'idle' | 'uploading' | 'ocr' | 'handwriting' | 'sending' | 'done' | 'error';

type EnrichmentOutcomeBody = { status?: string; reused?: boolean; message?: string; scanned?: boolean; error?: string };

async function resizeForHandwriting(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, HANDWRITING_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Não foi possível preparar a imagem.');
    ctx.drawImage(bitmap, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Não foi possível preparar a imagem.'))), 'image/jpeg', 0.85);
    });
  } finally {
    bitmap.close();
  }
}

function outcomeMessage(body: EnrichmentOutcomeBody | null): string {
  if (!body) return 'Material enviado.';
  if (body.reused) return 'Esse arquivo já tinha sido processado para este conteúdo — nada novo para reenviar.';
  if (body.status === 'processando') {
    return 'Recebido! O processamento continua em segundo plano — os novos conceitos aparecem na aula quando terminar.';
  }
  if (body.status === 'descartado') {
    return body.message ?? 'Esse arquivo não parece ter relação com este conteúdo — não foi somado à aula.';
  }
  if (body.status === 'concluido') return 'Material processado! Os novos conceitos já aparecem na aula.';
  return 'Material enviado.';
}

const GENERIC_SEND_ERROR = 'Não foi possível enviar o material agora. Tente de novo mais tarde.';

export function ApacheEnrichmentUpload({ contentId }: { contentId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [handwritten, setHandwritten] = useState(false);
  const [stage, setStage] = useState<Stage>('idle');
  const [message, setMessage] = useState('');
  const [ocrInput, setOcrInput] = useState<ApacheOcrInput | null>(null);

  const busy = stage === 'uploading' || stage === 'ocr' || stage === 'handwriting' || stage === 'sending';

  function onPickFile(nextFile: File | null) {
    setFile(nextFile);
    setOcrInput(null);
    setMessage('');
    setStage('idle');
  }

  const sendExtractedText = useCallback(
    async (text: string, pages: number) => {
      setStage('sending');
      try {
        const response = await fetch('/api/apache/enriquecimento/texto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentId, text, pages }),
        });
        const body = (await response.json().catch(() => null)) as EnrichmentOutcomeBody | null;
        if (!response.ok) {
          setStage('error');
          setMessage(body?.error ?? GENERIC_SEND_ERROR);
          return;
        }
        setStage('done');
        setMessage(outcomeMessage(body));
      } catch {
        setStage('error');
        setMessage(GENERIC_SEND_ERROR);
      }
    },
    [contentId],
  );

  const onOcrDone = useCallback(
    async (pages: ApacheOcrPageResult[]) => {
      try {
        let combinedText = pages.map((page) => page.text).join('\n\n');
        const needsHandwritingFallback =
          pages.length === 1 && (handwritten || pages[0].confidence < OCR_CONFIDENCE_FALLBACK_THRESHOLD);

        if (needsHandwritingFallback && file) {
          setStage('handwriting');
          try {
            const resized = await resizeForHandwriting(file);
            const form = new FormData();
            form.append('file', resized, 'pagina.jpg');
            const response = await fetch('/api/apache/enriquecimento/letra-de-mao', { method: 'POST', body: form });
            if (response.ok) {
              const body = (await response.json()) as { text: string };
              combinedText = body.text;
            }
            // Falha no fallback: segue com o texto do OCR mesmo (melhor que nada).
          } catch {
            // idem -- mantém o texto do OCR.
          }
        }

        await sendExtractedText(combinedText, pages.length);
      } catch (error) {
        setStage('error');
        setMessage(error instanceof Error ? error.message : GENERIC_SEND_ERROR);
      }
    },
    [file, handwritten, sendExtractedText],
  );

  async function onSubmitFile() {
    if (!file || busy) return;
    setMessage('');

    if (DIGITAL_MIME_TYPES.has(file.type)) {
      setStage('uploading');
      try {
        const form = new FormData();
        form.append('contentId', contentId);
        form.append('file', file);
        const response = await fetch('/api/apache/enriquecimento', { method: 'POST', body: form });
        const body = (await response.json().catch(() => null)) as EnrichmentOutcomeBody | null;
        if (!response.ok) {
          setStage('error');
          setMessage(body?.error ?? GENERIC_SEND_ERROR);
          return;
        }
        if (body?.scanned) {
          // toMarkdown não achou texto digital -- provavelmente escaneado:
          // refaz via OCR no navegador, mesmo fluxo de uma foto/print.
          const bytes = await file.arrayBuffer();
          setOcrInput({ bytes, mimeType: file.type });
          setStage('ocr');
          return;
        }
        setStage('done');
        setMessage(outcomeMessage(body));
      } catch {
        setStage('error');
        setMessage(GENERIC_SEND_ERROR);
      }
      return;
    }

    // Foto/print: OCR no navegador primeiro (ApacheOcrRunner, abaixo).
    const bytes = await file.arrayBuffer();
    setOcrInput({ bytes, mimeType: file.type });
    setStage('ocr');
  }

  return (
    <section className="al-card">
      <p className="eyebrow">ENRIQUECER COM SEU MATERIAL</p>
      <p className="al-empty">
        Envie um PDF, DOCX, XLSX, foto ou print do seu material de estudo deste conteúdo — a IA extrai os conceitos e
        mostra o que há de novo na aula.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmitFile();
        }}
        className="apache-enrich-form"
      >
        <input
          type="file"
          accept=".pdf,.docx,.xlsx,image/*"
          onChange={(event) => onPickFile(event.target.files?.[0] ?? null)}
          disabled={busy}
        />
        <label className="apache-enrich-checkbox">
          <input type="checkbox" checked={handwritten} onChange={(event) => setHandwritten(event.target.checked)} disabled={busy} />
          Este arquivo tem letra de mão
        </label>
        <Button type="submit" variant="outline" className="ss-outline" disabled={!file || busy}>
          Enviar material
        </Button>
      </form>

      {stage === 'ocr' && ocrInput && (
        <ApacheOcrRunner
          key={`${file?.name ?? ''}:${file?.size ?? 0}`}
          file={ocrInput}
          onDone={(pages) => void onOcrDone(pages)}
          onError={(errorMessage) => {
            setStage('error');
            setMessage(errorMessage);
          }}
        />
      )}
      {(stage === 'uploading' || stage === 'handwriting' || stage === 'sending') && (
        <p className="al-empty">
          <Spinner className="size-3.5" /> Processando o material…
        </p>
      )}
      {message && (
        <p className={stage === 'error' ? 'al-flag' : 'al-empty'} role={stage === 'error' ? 'alert' : undefined}>
          {message}
        </p>
      )}
    </section>
  );
}
