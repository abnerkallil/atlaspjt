import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

// Aplica todas as migrations do repositório num SQLite em memória, na ordem do
// journal do drizzle — o mesmo SQL que o D1 recebe.
export function migratedDatabase(): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  const journal = JSON.parse(readFileSync('drizzle/meta/_journal.json', 'utf8')) as {
    entries: { tag: string }[];
  };
  for (const { tag } of journal.entries) {
    for (const statement of readFileSync(`drizzle/${tag}.sql`, 'utf8').split('--> statement-breakpoint')) {
      if (statement.trim()) db.exec(statement);
    }
  }
  return db;
}
