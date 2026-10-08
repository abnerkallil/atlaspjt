// "O Atlas observou" em Hoje (UX-06): uma observação por regra fixa sobre o
// progresso calculado (MVP-07), sem IA. Ordem: conteúdo em risco, sem histórico,
// sequência de dias, retenção nas revisões e, por fim, a constância do mês.
import type { ProgressReport } from './progress.js';

export type Observation = { title: string; text: string; href: string; linkLabel: string };

const days = (count: number) => `${count} ${count === 1 ? 'dia' : 'dias'}`;

export function observe(progress: ProgressReport): Observation {
  const [risk] = progress.atRisk;
  if (risk) {
    const others = progress.atRisk.length - 1;
    return {
      title: `${risk.title} pede atenção.`,
      text: `${risk.reason} ${risk.action}${others > 0 ? ` Há mais ${others} ${others === 1 ? 'conteúdo' : 'conteúdos'} em risco em Progresso.` : ''}`,
      href: `/relatorio?conteudo=${encodeURIComponent(risk.id)}`,
      linkLabel: 'Ver relatório do conteúdo',
    };
  }
  const { streak, studiedDays } = progress.consistency;
  if (studiedDays === 0) {
    return {
      title: 'Ainda sem histórico.',
      text: 'Depois das primeiras sessões, o Atlas mostra aqui o que observou sobre o seu ritmo e a sua retenção.',
      href: '/progresso',
      linkLabel: 'Ver progresso',
    };
  }
  if (streak >= 3) {
    return {
      title: `${days(streak)} seguidos de estudo.`,
      text: 'Sessões frequentes fixam mais que maratonas. Uma sessão hoje mantém a sequência.',
      href: '/progresso',
      linkLabel: 'Ver consistência',
    };
  }
  const { reviewsTaken, retention } = progress.overall;
  if (reviewsTaken > 0) {
    return {
      title: `${retention}% das revisões aprovadas.`,
      text:
        retention >= 75
          ? 'Boa retenção: as revisões 24h/7d/30d estão segurando o que você estudou.'
          : 'Abaixo de 75%: vale revisar as notas antes da próxima revisão.',
      href: '/progresso',
      linkLabel: 'Ver retenção',
    };
  }
  return {
    title: `${days(studiedDays)} com estudo nos últimos 28.`,
    text: 'Sessões curtas e frequentes fixam mais que maratonas.',
    href: '/progresso',
    linkLabel: 'Ver consistência',
  };
}
