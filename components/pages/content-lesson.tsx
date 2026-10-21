'use client';

import { useEffect, useState } from 'react';
import { Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { resolvePollOutcome, type LessonResponse } from '@/lib/apache/lesson-poll';

const POLL_INTERVAL_MS = 5000;

async function parseBody(response: Response): Promise<LessonResponse | null> {
  return (await response.json().catch(() => null)) as LessonResponse | null;
}

export function ContentLesson({ contentId }: { contentId: string }) {
  const [data, setData] = useState<LessonResponse | null>(null);
  const [loadError, setLoadError] = useState('');
  const [hidden, setHidden] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportError, setReportError] = useState('');

  async function sendReport() {
    if (!window.confirm('Avisar que esta aula tem um erro? Ela entra na fila de revisão.')) return;
    setReporting(true);
    setReportError('');
    try {
      const response = await fetch(`/api/apache/aulas/${encodeURIComponent(contentId)}/reportar`, {
        method: 'POST',
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        // Falha ao reportar não deve esconder a aula já carregada — por
        // isso um estado próprio, nunca o loadError do polling (que oculta
        // tudo, inclusive o .al-body que acabou de ser exibido).
        setReportError(body?.error ?? 'Não foi possível reportar o erro.');
        return;
      }
      setData((current) => (current ? { ...current, status: 'reportada' } : current));
    } finally {
      setReporting(false);
    }
  }

  useEffect(() => {
    let active = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;

    function scheduleNext() {
      if (!active) return;
      timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
    }

    function poll() {
      if (!active) return;
      // Aba em segundo plano: não gasta requisição, só reagenda a checagem.
      // Volta a pedir de verdade assim que a aba fica visível de novo
      // (listener abaixo chama poll() direto).
      if (document.visibilityState === 'hidden') {
        scheduleNext();
        return;
      }
      attempts += 1;
      fetch(`/api/apache/aulas/${encodeURIComponent(contentId)}`)
        .then(async (response) => {
          if (response.status === 404) return resolvePollOutcome(true, null, attempts);
          return resolvePollOutcome(false, await parseBody(response), attempts);
        })
        .then((outcome) => {
          if (!active) return;
          if (outcome.kind === 'hidden') {
            setHidden(true);
            setData(null);
            setLoadError('');
            return; // endpoint ainda não existe (APA-07) — não é erro, não repete
          }
          if (outcome.kind === 'error') {
            setHidden(false);
            setLoadError(outcome.message);
            return; // erro real — não repete sozinho, evita loop infinito
          }
          setHidden(false);
          setLoadError('');
          setData(outcome.data);
          if (outcome.continuePolling) scheduleNext();
        })
        .catch((error: unknown) => {
          if (!active) return;
          setHidden(false);
          setLoadError(error instanceof Error ? error.message : 'Não foi possível carregar a aula.');
        });
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'visible' && active) {
        if (timeoutId) clearTimeout(timeoutId);
        poll();
      }
    }

    poll();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      active = false;
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [contentId]);

  if (hidden) return null;

  return (
    <section className="al-card">
      {loadError && <p className="al-flag" role="alert">{loadError}</p>}

      {!loadError && data === null && <p className="al-empty">Preparando a aula deste conteúdo…</p>}

      {!loadError && (data?.status === 'pendente' || data?.status === 'gerando') && (
        <p className="al-empty">
          <Spinner className="size-3.5" /> A aula deste conteúdo está sendo escrita. Isso leva poucos minutos — pode
          continuar estudando, ela aparece aqui quando estiver pronta.
        </p>
      )}

      {!loadError && data?.status === 'erro' && (
        <p className="al-flag">Não foi possível gerar esta aula agora. Tente de novo mais tarde.</p>
      )}

      {!loadError && (data?.status === 'gerada' || data?.status === 'reportada') && data.lesson && (
        <>
          {data.status === 'reportada' && (
            <p className="al-flag">Erro reportado — esta aula está na fila de revisão e pode ser atualizada em breve.</p>
          )}
          <article className="al-body">
            <p className="eyebrow">AULA GERADA POR IA</p>
            <p>{data.lesson.objetivo}</p>
            {data.lesson.conceitos.map((conceito, index) => (
              <div key={index}>
                <h3>{conceito.titulo}</h3>
                <p>{conceito.corpo}</p>
              </div>
            ))}
            {data.lesson.formulas.length > 0 && (
              <section>
                <h3>Fórmulas</h3>
                {data.lesson.formulas.map((formula, index) => (
                  <p key={index}><strong>{formula.expr}</strong> — {formula.legenda}</p>
                ))}
              </section>
            )}
            {data.lesson.exemplos.length > 0 && (
              <section>
                <h3>Exemplos</h3>
                {data.lesson.exemplos.map((exemplo, index) => <p key={index}>{exemplo}</p>)}
              </section>
            )}
            {data.lesson.pegadinhas.length > 0 && (
              <section>
                <h3>Pegadinhas de prova</h3>
                {data.lesson.pegadinhas.map((pegadinha, index) => <p key={index}>{pegadinha}</p>)}
              </section>
            )}
            <section>
              <h3>Resumo</h3>
              <p>{data.lesson.resumo}</p>
            </section>
            {reportError && <p className="al-flag" role="alert">{reportError}</p>}
            {data.status !== 'reportada' && (
              <Button variant="outline" className="ss-outline" onClick={() => void sendReport()} disabled={reporting}>
                <Flag size={14} /> Reportar erro
              </Button>
            )}
          </article>
        </>
      )}
    </section>
  );
}
