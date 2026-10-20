// APA-13: limite de 90 páginas por usuário em uma janela rolante de 24h,
// chaveado por getApacheUserId() (DEC-019). A checagem e a escrita acontecem
// no mesmo UPDATE condicional (ON CONFLICT ... DO UPDATE ... WHERE), sem
// leitura separada antes — isso é o que evita a corrida entre duas chamadas
// concorrentes: cada uma só conta como aceita se o próprio UPDATE afetar uma
// linha, e o SQLite serializa os writes de uma mesma linha.
import type { D1Like } from '../pedagogy/transitions.js';

export const APACHE_DAILY_PAGE_LIMIT = 90;
const WINDOW_SECONDS = 24 * 60 * 60;

export class ApacheQuotaError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApacheQuotaError';
  }
}

// `now` é injetável para teste; em produção é sempre `new Date()`.
export async function assertQuota(
  db: D1Like,
  userId: string,
  pagesRequested: number,
  now: Date = new Date(),
): Promise<void> {
  if (pagesRequested <= 0) return;
  if (pagesRequested > APACHE_DAILY_PAGE_LIMIT) {
    throw new ApacheQuotaError(
      `Este envio tem ${pagesRequested} páginas, mais que o limite diário de ${APACHE_DAILY_PAGE_LIMIT}.`,
      413,
    );
  }

  const nowIso = now.toISOString();
  const [result] = await db.batch([
    db
      .prepare(
        `INSERT INTO atlas_apache_quota (user_id, window_start, pages_used, updated_at)
         VALUES (?1, ?2, ?3, ?2)
         ON CONFLICT (user_id) DO UPDATE SET
           pages_used = CASE
             WHEN (unixepoch(?2) - unixepoch(window_start)) > ?4 THEN ?3
             ELSE pages_used + ?3
           END,
           window_start = CASE
             WHEN (unixepoch(?2) - unixepoch(window_start)) > ?4 THEN ?2
             ELSE window_start
           END,
           updated_at = ?2
         WHERE (unixepoch(?2) - unixepoch(window_start)) > ?4
            OR pages_used + ?3 <= ?5`,
      )
      .bind(userId, nowIso, pagesRequested, WINDOW_SECONDS, APACHE_DAILY_PAGE_LIMIT),
  ]);

  if (!result || result.meta.changes === 0) {
    throw new ApacheQuotaError(
      `Limite de ${APACHE_DAILY_PAGE_LIMIT} páginas por dia atingido. Tenta de novo mais tarde.`,
      429,
    );
  }
}

// Chamado quando o processamento falha por erro do sistema (não quando o
// arquivo é descartado por ser irrelevante — aí as páginas ficam debitadas,
// porque o processamento rodou normalmente).
export async function refundQuota(db: D1Like, userId: string, pages: number): Promise<void> {
  if (pages <= 0) return;
  await db.batch([
    db
      .prepare(
        `UPDATE atlas_apache_quota SET pages_used = MAX(0, pages_used - ?2), updated_at = ?3 WHERE user_id = ?1`,
      )
      .bind(userId, pages, new Date().toISOString()),
  ]);
}
