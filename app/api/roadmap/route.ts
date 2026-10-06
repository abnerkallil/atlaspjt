import { env } from 'cloudflare:workers';
import type { D1Like } from '@/lib/pedagogy/transitions';
import { getRoadmap } from '@/lib/roadmap-store';

export const runtime = 'edge';

// Roadmap persistido (TEC-04): hierarquia + estado atual. Protegida pelo proxy (DEC-007).
export async function GET() {
  const db = (env as unknown as { DB?: D1Like }).DB;
  if (!db) return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
  try {
    const roadmap = await getRoadmap(db);
    if (!roadmap) {
      return Response.json(
        { error: 'O catálogo ainda não foi carregado. Aplique as migrations do D1.' },
        { status: 404 },
      );
    }
    return Response.json({ roadmap });
  } catch {
    return Response.json({ error: 'Não foi possível ler o roadmap.' }, { status: 500 });
  }
}
