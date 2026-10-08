'use client';

import { useEffect, useState } from 'react';
import { LifeBuoy } from 'lucide-react';
import type { RecoveryStatus } from '@/lib/recovery';

const PURPOSE_LABEL: Record<string, string> = { quiz: 'quiz', revisao: 'revisão', corretivo: 'quiz corretivo' };

// Estudo dirigido (MVP-08): depois de uma reprovação, a sessão mostra o que foi
// errado, com a resposta certa e a explicação, antes do próximo quiz.
export function DirectedStudy({ contentId }: { contentId: string }) {
  const [recovery, setRecovery] = useState<RecoveryStatus | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(`/api/recuperacao?conteudo=${encodeURIComponent(contentId)}`)
      .then((response) => (response.ok ? (response.json() as Promise<{ recovery: RecoveryStatus | null }>) : null))
      .then((body) => {
        if (alive && body) setRecovery(body.recovery);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [contentId]);

  if (!recovery) return null;
  const when = new Date(recovery.lastFailureAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return (
    <details className="ss-directed" open={recovery.missed.length <= 3}>
      <summary>
        <LifeBuoy size={16} aria-hidden="true" />
        <span>
          <strong>Estudo dirigido</strong>{recovery.missed.length > 3 && ` (${recovery.missed.length} questões para revisar)`}
          {` · ${PURPOSE_LABEL[recovery.lastPurpose] ?? 'quiz'} de ${when}: ${String(recovery.lastScore).replace('.', ',')}%`}
          {recovery.failures >= 2 && ` · ${recovery.failures} reprovações seguidas`}
        </span>
      </summary>
      <p>
        {recovery.missed.length
          ? `Revise ${recovery.missed.length === 1 ? 'a questão que você errou' : `as ${recovery.missed.length} questões que você errou`}. Elas voltam no próximo quiz.`
          : 'Revise o conteúdo antes do próximo quiz.'}
      </p>
      {recovery.missed.length > 0 && (
        <ol>
          {recovery.missed.map((item) => (
            <li key={item.id}>
              <strong>{item.prompt}</strong>
              {item.answer && <span>Resposta certa: {item.answer}</span>}
              <small>{item.explanation}</small>
            </li>
          ))}
        </ol>
      )}
    </details>
  );
}
