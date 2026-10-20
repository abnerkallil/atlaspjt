'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Copy, Sparkles } from 'lucide-react';
import { PageHeading } from '@/components/atlas/page-heading';
import {
  buildRoadmapPrompt,
  EMPTY_ROADMAP_PROMPT_INPUT,
  ROADMAP_GOAL_OPTIONS,
  ROADMAP_LEVEL_OPTIONS,
  type RoadmapPromptInput,
} from '@/lib/roadmap-prompt';

// CG-gerador-roadmap: a pessoa descreve o que quer aprender e recebe um prompt
// pronto para colar em qualquer IA de texto. O prompt pedido é montado 100% no
// cliente (sem nenhuma chamada de IA daqui) — ver lib/roadmap-prompt.ts.
export function RoadmapGeneratorPage() {
  const [input, setInput] = useState<RoadmapPromptInput>(EMPTY_ROADMAP_PROMPT_INPUT);
  const [copied, setCopied] = useState(false);

  const set = <K extends keyof RoadmapPromptInput>(key: K, value: RoadmapPromptInput[K]) => {
    setInput((prev) => ({ ...prev, [key]: value }));
    setCopied(false);
  };

  const topicFilled = input.topic.trim().length > 0;
  const prompt = useMemo(() => buildRoadmapPrompt(input), [input]);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="rg-view" aria-labelledby="rg-title">
      <PageHeading
        eyebrow="ROADMAP"
        title="Gerador de prompt de roadmap."
        titleId="rg-title"
        aside={
          <Link className="quiet-button" href="/roadmap">
            <ArrowLeft size={16} /> Voltar ao roadmap
          </Link>
        }
      >
        Descreva o que você quer aprender e receba um prompt pronto para colar em qualquer IA de texto — ela devolve um
        roadmap no mesmo padrão que o Atlas usa.
      </PageHeading>

      <div className="rg-workspace">
        <form className="rg-form cm-form" onSubmit={(event) => event.preventDefault()}>
          <label className="cm-field">
            <span>O que você quer aprender</span>
            <textarea
              rows={2}
              value={input.topic}
              placeholder="Ex.: Direito Administrativo para concursos, Excel avançado, violão popular…"
              onChange={(event) => set('topic', event.target.value)}
            />
          </label>

          <label className="cm-field">
            <span>Seu nível atual</span>
            <select value={input.currentLevel} onChange={(event) => set('currentLevel', event.target.value as RoadmapPromptInput['currentLevel'])}>
              {ROADMAP_LEVEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="cm-field">
            <span>Nível que quer atingir</span>
            <select value={input.targetLevel} onChange={(event) => set('targetLevel', event.target.value as RoadmapPromptInput['targetLevel'])}>
              {ROADMAP_LEVEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="cm-field">
            <span>Objetivo</span>
            <select value={input.goal} onChange={(event) => set('goal', event.target.value as RoadmapPromptInput['goal'])}>
              {ROADMAP_GOAL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="cm-field">
            <span>Detalhe do objetivo (opcional)</span>
            <input
              value={input.goalDetail}
              placeholder="Ex.: concurso de Técnico do TCU, promoção para analista, viagem para a Itália…"
              onChange={(event) => set('goalDetail', event.target.value)}
            />
          </label>

          <label className="cm-field">
            <span>Horas disponíveis por semana (opcional)</span>
            <input
              value={input.weeklyHours}
              inputMode="numeric"
              placeholder="Ex.: 10"
              onChange={(event) => set('weeklyHours', event.target.value)}
            />
          </label>

          <label className="cm-field">
            <span>Prazo desejado (opcional)</span>
            <input
              value={input.deadline}
              placeholder="Ex.: 3 meses, até dezembro de 2026…"
              onChange={(event) => set('deadline', event.target.value)}
            />
          </label>

          <label className="cm-field">
            <span>Outras observações (opcional)</span>
            <textarea
              rows={3}
              value={input.constraints}
              placeholder="Ex.: prefiro exemplos práticos, já li tal livro, tenho dificuldade com cálculo…"
              onChange={(event) => set('constraints', event.target.value)}
            />
          </label>
        </form>

        <aside className="rg-preview">
          <div className="rg-preview-head">
            <p className="eyebrow">PROMPT PRONTO</p>
            <button
              type="button"
              className={copied ? 'qz-outline rg-copy copied' : 'primary-button rg-copy'}
              disabled={!topicFilled}
              onClick={() => void copyPrompt()}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copiado!' : 'Copiar prompt'}
            </button>
          </div>
          {topicFilled ? (
            <textarea className="rg-prompt-text" readOnly rows={18} value={prompt} />
          ) : (
            <p className="rm-muted">Preencha ao menos &quot;o que você quer aprender&quot; para gerar o prompt.</p>
          )}
          <p className="rg-hint">
            <Sparkles size={14} /> Cole o prompt em qualquer IA (ChatGPT, Claude, etc.). Ela devolve o roadmap estruturado — o
            Atlas não importa esse resultado automaticamente.
          </p>
        </aside>
      </div>
    </section>
  );
}
