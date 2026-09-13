import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'drizzle-kit';

// Dev-only config for `drizzle-kit studio`, pointed at the local D1 database
// that Miniflare persists on disk (Wrangler local dev / vinext dev). This is
// a read/write viewer for local development only — it never touches
// production D1, and does not change how the app itself talks to D1
// (lib/notes-store.ts / app/api/notes/route.ts are untouched).
//
// Miniflare names the actual sqlite file after an internal hash that
// changes whenever the local D1 state is reset, so we resolve it at
// config-load time instead of hardcoding a path.
const d1Dir = join(
  process.cwd(),
  '.wrangler',
  'state',
  'v3',
  'd1',
  'miniflare-D1DatabaseObject',
);

function resolveLocalD1File(): string {
  if (!existsSync(d1Dir)) {
    throw new Error(
      `Local D1 database not found at ${d1Dir}. Run "pnpm dev" at least once ` +
        'so Miniflare creates the local database, then try again.',
    );
  }

  const candidate = readdirSync(d1Dir).find(
    (name) => name.endsWith('.sqlite') && name !== 'metadata.sqlite',
  );

  if (!candidate) {
    throw new Error(
      `Could not find the local D1 .sqlite file inside ${d1Dir}. Only ` +
        "Miniflare's internal metadata.sqlite was found — has \"pnpm dev\" " +
        'been run yet?',
    );
  }

  return join(d1Dir, candidate);
}

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: resolveLocalD1File(),
  },
});
