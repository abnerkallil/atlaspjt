// Regrava a migration de carga do catálogo a partir de lib/content-catalog.ts.
// Uso: pnpm run db:catalog (gera só arquivo; aplicar no D1 segue o fluxo normal
// de migrations, com o ambiente explícito do DEC-009).
import { writeFileSync } from 'node:fs';
import { CATALOG_SEED_MIGRATION, catalogSeedMigrationSql } from '../lib/catalog/roadmap-seed.js';

writeFileSync(`drizzle/${CATALOG_SEED_MIGRATION}.sql`, catalogSeedMigrationSql());
console.log(`OK: drizzle/${CATALOG_SEED_MIGRATION}.sql`);
