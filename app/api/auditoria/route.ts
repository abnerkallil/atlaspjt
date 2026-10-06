import { env } from 'cloudflare:workers';
import { listAudit, type D1Like, type EntityType } from '@/lib/pedagogy/transitions';

export const runtime = 'edge';

// Leitura da trilha de auditoria (TEC-06). Só leitura: transições são gravadas
// por lib/pedagogy/transitions.ts, nunca por esta rota. Protegida pelo proxy (DEC-007).
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const entityType = params.get('entityType');
  if (entityType !== null && entityType !== 'conteudo' && entityType !== 'disciplina') {
    return Response.json({ error: 'entityType deve ser "conteudo" ou "disciplina".' }, { status: 400 });
  }
  const limit = Number(params.get('limit') ?? 100);
  const db = (env as unknown as { DB?: D1Like }).DB;
  if (!db) return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
  try {
    const entries = await listAudit(db, {
      entityType: (entityType as EntityType | null) ?? undefined,
      entityId: params.get('entityId') ?? undefined,
      limit: Number.isFinite(limit) ? limit : 100,
    });
    return Response.json({ entries });
  } catch {
    return Response.json({ error: 'Não foi possível ler a auditoria.' }, { status: 500 });
  }
}
