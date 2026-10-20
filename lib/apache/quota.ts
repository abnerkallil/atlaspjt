// APA-13: limite de 90 páginas por usuário em uma janela rolante de 24h,
// chaveado por getApacheUserId() (DEC-019). A checagem e a escrita acontecem
// no mesmo UPDATE condicional (ON CONFLICT ... DO UPDATE ... WHERE), sem
// leitura separada antes — isso é o que evita a corrida entre duas chamadas
// concorrentes: cada uma só conta como aceita se o próprio UPDATE afetar uma
// linha, e o SQLite serializa os writes de uma mesma linha.
import type { D1Like } from '../pedagogy/transitions.js';
import { ApacheError } from './errors.js';

export const APACHE_DAILY_PAGE_LIMIT = 90;
const WINDOW_SECONDS = 24 * 60 * 60;

async function windowStartOf(db: D1Like, userId: string): Promise<string | null> {
  const row = await db
    .prepare('SELECT window_start FROM atlas_apache_quota WHERE user_id = ?1')
    .bind(userId)
    .first<{ window_start: string }>();
  return row?.window_start ?? null;
}

function hoursUntilReset(windowStart: string, now: Date): number {
  const resetAt = new Date(windowStart).getTime() + WINDOW_SECONDS * 1000;
  return Math.max(1, Math.ceil((resetAt - now.getTime()) / (60 * 60 * 1000)));
}

// Retorna o window_start da janela em que as páginas foram debitadas — o
// chamador deve guardar e passar para refundQuota, para o refund nunca
// acertar numa janela diferente da que gerou o débito (ver refundQuota).
export async function assertQuota(
  db: D1Like,
  userId: string,
  pagesRequested: number,
  now: Date = new Date(),
): Promise<string | null> {
  if (pagesRequested <= 0) return windowStartOf(db, userId);
  if (pagesRequested > APACHE_DAILY_PAGE_LIMIT) {
    throw new ApacheError(
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
    const windowStart = await windowStartOf(db, userId);
    const hours = windowStart ? hoursUntilReset(windowStart, now) : 24;
    throw new ApacheError(
      `Limite de ${APACHE_DAILY_PAGE_LIMIT} páginas por dia atingido. Tenta de novo em ${hours} hora${hours === 1 ? '' : 's'}.`,
      429,
    );
  }

  return windowStartOf(db, userId);
}

// Chamado quando o processamento falha por erro do sistema (não quando o
// arquivo é descartado por ser irrelevante — aí as páginas ficam debitadas,
// porque o processamento rodou normalmente). `windowStart` é o valor que
// assertQuota retornou quando debitou essas páginas: o refund só acerta
// enquanto a janela não mudou, senão devolveria páginas para a janela nova
// (reaberta depois do reset) em vez da que gerou o débito.
export async function refundQuota(
  db: D1Like,
  userId: string,
  pages: number,
  windowStart: string | null,
  now: Date = new Date(),
): Promise<void> {
  if (pages <= 0 || !windowStart) return;
  await db.batch([
    db
      .prepare(
        `UPDATE atlas_apache_quota SET pages_used = MAX(0, pages_used - ?2), updated_at = ?3
         WHERE user_id = ?1 AND window_start = ?4`,
      )
      .bind(userId, pages, now.toISOString(), windowStart),
  ]);
}
