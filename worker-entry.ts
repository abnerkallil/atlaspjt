// Entry do Worker (vite.config.ts: main). vinext não exporta um handler
// `queue` nativo (confirmado em node_modules/vinext/dist/server/
// fetch-handler.d.ts/.js — só fetch) — este arquivo envolve o handler que o
// vinext gera e acrescenta o `queue()` da fila de aulas do Apache (APA-07,
// DEC-019: Cloudflare Queues em vez de waitUntil). O fetch em si passa
// direto para o vinext, sem nenhuma lógica própria.
import vinextHandler from 'vinext/server/fetch-handler';
import { handleLessonQueueBatch, type LessonQueueMessage, type QueueBatchLike } from './lib/apache/queue';
import type { AiLike } from './lib/apache/lesson-writer';
import type { D1Like } from './lib/pedagogy/transitions';
import type { R2Like } from './lib/apache/lesson-store';

type ApacheEnv = {
  DB?: D1Like;
  ATTACHMENTS?: R2Like;
  AI?: AiLike;
};

export default {
  fetch: vinextHandler.fetch,
  // Consumer da fila `atlas-apache-aulas` (vite.config.ts: queues.consumers).
  // Entrega "pelo menos uma vez" — um lote pode repetir uma mensagem já
  // processada; processQueueItem já é idempotente (claim atômico por
  // status='pendente'), então reentrega nunca gera uma 2ª chamada de IA.
  async queue(batch: QueueBatchLike, env: ApacheEnv): Promise<void> {
    const { DB, ATTACHMENTS, AI } = env;
    if (!DB || !ATTACHMENTS || !AI) {
      console.error('Apache: fila de aulas recebeu um lote sem DB/ATTACHMENTS/AI configurados.');
      for (const message of batch.messages) message.retry();
      return;
    }
    await handleLessonQueueBatch(batch, DB, ATTACHMENTS, AI);
  },
} satisfies {
  fetch: typeof vinextHandler.fetch;
  queue(batch: QueueBatchLike, env: ApacheEnv): Promise<void>;
};

export type { LessonQueueMessage };
