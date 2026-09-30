import { clearedSessionCookie } from '@/lib/auth';

export const runtime = 'edge';

export async function POST(request: Request) {
  return new Response(null, {
    status: 303,
    headers: {
      location: new URL('/login', request.url).toString(),
      'set-cookie': clearedSessionCookie(),
    },
  });
}
