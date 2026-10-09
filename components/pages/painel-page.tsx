'use client';

import { useEffect, useState } from 'react';
import { PageHeading } from '@/components/atlas/page-heading';
import type { ApoloPanel } from '@/lib/apolo/dashboard';

// APO-22: painel do banco e do Apolo — onde o banco está fraco (cobertura por
// tema/conteúdo/Bloom/dificuldade, questões em alerta) e o que o Apolo andou
// decidindo (acervo e espaço no R2, ponto do usuário por tema, últimas
// provas montadas com o motivo de cada questão). Só leitura; tudo
// recalculado do histórico a cada chamada (DEC-017).
const REASON_LABEL: Record<string, string> = {
  'recuperacao-vencida': 'Recuperação vencida',
  'subtopico-fraco': 'Subtópico fraco',
  'cobertura-do-plano': 'Cobertura do plano',
};

function formatBytes(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

async function errorOf(response: Response) {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? 'Não foi possível carregar o painel.';
}

export function PainelPage() {
  const [panel, setPanel] = useState<ApoloPanel | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/apolo/painel')
      .then(async (response) => {
        if (!response.ok) throw new Error(await errorOf(response));
        return (await response.json()) as ApoloPanel;
      })
      .then((data) => {
        if (active) {
          setPanel(data);
          setLoadError('');
        }
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : 'Não foi possível carregar o painel.');
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="cm" aria-labelledby="painel-title">
      <PageHeading eyebrow="APOLO" title="Painel do banco e do Apolo" titleId="painel-title">
        Onde o banco está fraco e o que o Apolo andou decidindo — recalculado do histórico a cada visita.
      </PageHeading>

      {loadError && <p className="rm-error" role="alert">{loadError}</p>}
      {!panel && !loadError && <p className="cm-empty">Carregando painel…</p>}
      {panel && (
        <>
          <h2>Cobertura do banco, por tema</h2>
          {panel.coverage.themes.length === 0 && panel.coverage.withoutTheme.length === 0 && (
            <p className="cm-empty">Nenhuma questão ativa ainda.</p>
          )}
          <ul className="cm-list">
            {panel.coverage.themes.map((theme) => (
              <li key={theme.theme} className="cm-item">
                <div className="cm-item-head">
                  <strong>{theme.theme}</strong>
                  <span>{theme.active} questões ativas{theme.lowContents > 0 ? ` · ${theme.lowContents} conteúdo(s) abaixo de 30` : ''}</span>
                </div>
                <ul className="cm-list">
                  {theme.contents.map((content) => (
                    <li key={content.contentId} className="cm-item">
                      <p className="cm-text">
                        {content.low ? <strong aria-label="abaixo de 30 questões">⚠ </strong> : null}
                        {content.contentTitle}: {content.active} ativas
                        {' · Bloom: '}
                        {Object.entries(content.byBloom).map(([level, count]) => `${level} ${count}`).join(', ') || 'sem classificação'}
                        {' · Dificuldade: '}
                        {Object.entries(content.byDifficulty).filter(([, count]) => count > 0).map(([level, count]) => `${level} ${count}`).join(', ')}
                      </p>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
            {panel.coverage.withoutTheme.length > 0 && (
              <li className="cm-item">
                <div className="cm-item-head"><strong>Sem tema atribuído</strong></div>
                <ul className="cm-list">
                  {panel.coverage.withoutTheme.map((content) => (
                    <li key={content.contentId} className="cm-item">
                      <p className="cm-text">
                        {content.low ? <strong aria-label="abaixo de 30 questões">⚠ </strong> : null}
                        {content.contentTitle}: {content.active} ativas
                      </p>
                    </li>
                  ))}
                </ul>
              </li>
            )}
          </ul>

          <h2>Questões em alerta</h2>
          {panel.audit.alerts.length === 0 ? (
            <p className="cm-empty">Nenhuma questão alertada no momento.</p>
          ) : (
            <ul className="cm-list">
              {panel.audit.alerts.map((alert) => (
                <li key={alert.questionId} className="cm-item">
                  <p className="cm-text">{alert.questionId}: {alert.reasons.join(', ')}</p>
                </li>
              ))}
            </ul>
          )}

          <h2>Acervo de fontes no R2</h2>
          <p className="cm-text">{panel.sources.count} fontes · {formatBytes(panel.sources.totalBytes)} ocupados.</p>
          <ul className="cm-list">
            {panel.sources.byTheme.map((item) => (
              <li key={item.theme} className="cm-item">
                <p className="cm-text">{item.theme}: {item.count} fontes · {formatBytes(item.bytes)}</p>
              </li>
            ))}
          </ul>

          <h2>Ponto do usuário por tema</h2>
          {panel.skillByTheme.length === 0 ? (
            <p className="cm-empty">Nenhuma resposta registrada ainda.</p>
          ) : (
            <ul className="cm-list">
              {panel.skillByTheme.map((item) => (
                <li key={item.theme} className="cm-item">
                  <p className="cm-text">{item.theme}: Elo {item.elo} ({item.correct} de {item.answers} respostas corretas)</p>
                </li>
              ))}
            </ul>
          )}

          <h2>Últimas provas montadas</h2>
          {panel.lastExams.length === 0 ? (
            <p className="cm-empty">Nenhuma prova de disciplina (exame de meio, atividade final ou recuperação) montada ainda.</p>
          ) : (
            <ul className="cm-list">
              {panel.lastExams.map((exam) => (
                <li key={exam.attemptId} className="cm-item">
                  <div className="cm-item-head">
                    <strong>{exam.disciplineTitle}</strong>
                    <span>{exam.instrument} · {exam.submittedAt ? 'enviada' : 'em andamento'}</span>
                  </div>
                  <p className="cm-text">
                    {exam.questions.map((question) => `${question.questionId} (${question.voided ? 'anulada' : question.correct ? 'certa' : 'errada'}${question.reason ? `, ${REASON_LABEL[question.reason] ?? question.reason}` : ''})`).join('; ')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
