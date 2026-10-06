// Pré-requisitos e bloqueio de início (MVP-01 / DEC-05). Pré-requisito pendente
// não é um estado do DEC-03: é calculado a partir do estado dos conteúdos dos
// quais este depende.
import type { ContentState } from './states.js';

// Estados em que o conteúdo conta como cumprido para quem depende dele.
// "em-revisao-ativa" e "bloqueado" não contam: o DEC-03 reabre o conteúdo até o
// domínio ser comprovado de novo.
export const PREREQUISITE_MET_STATES: readonly ContentState[] = ['concluido', 'aguardando-revisao', 'revalidado'];

export function isPrerequisiteMet(state: ContentState): boolean {
  return PREREQUISITE_MET_STATES.includes(state);
}

export function pendingPrerequisites(
  prerequisites: readonly string[],
  stateOf: (contentId: string) => ContentState,
): string[] {
  return prerequisites.filter((id) => !isPrerequisiteMet(stateOf(id)));
}
