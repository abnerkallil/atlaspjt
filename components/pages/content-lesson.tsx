'use client';

import { useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import type { RenderedLesson } from '@/lib/apache/schema';

type LessonStatus = 'pendente' | 'gerando' | 'gerada' | 'reportada' | 'erro';

type LessonResponse = {
  status: LessonStatus;
  lesson?: RenderedLesson;
  errorMessage?: string;
};

async function errorOf(response: Response) {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? 'Não foi possível carregar a aula.';
}

export function ContentLesson({ contentId }: { contentId: string }) {
  const [data, setData] = useState<LessonResponse | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;

    function load() {
      fetch(`/api/apache/aulas/${encodeURIComponent(contentId)}`)
        .then(async (response) => {
          if (!response.ok) throw new Error(await errorOf(response));
          return (await response.json()) as LessonResponse;
        })
        .then((result) => {
          if (!active) return;
          setData(result);
          setLoadError('');
          if (result.status === 'gerada' || result.status === 'reportada' || result.status === 'erro') {
            clearInterval(timer);
          }
        })
        .catch((error: unknown) => {
          if (active) setLoadError(error instanceof Error ? error.message : 'Não foi possível carregar a aula.');
        });
    }

    load();
    const timer = setInterval(load, 5000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [contentId]);

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
          </article>
        </>
      )}
    </section>
  );
}
