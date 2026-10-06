import type { DatabaseSync } from 'node:sqlite';
import type { D1Like, D1LikeStatement } from '../../lib/pedagogy/transitions.js';

type SqlValue = string | number | null;

// Adaptador mínimo com a semântica do D1 sobre node:sqlite: placeholders ?N e
// batch atômico (tudo ou nada), como o D1 faz. O node:sqlite do Node 22.13 (CI)
// não aceita ?N posicional, então ?N vira ? com os valores na ordem de uso.
function positional(sql: string, values: SqlValue[]): [string, SqlValue[]] {
  const ordered: SqlValue[] = [];
  const text = sql.replace(/\?(\d+)/g, (_, index: string) => {
    ordered.push(values[Number(index) - 1] ?? null);
    return '?';
  });
  return [text, ordered];
}

class Statement implements D1LikeStatement {
  constructor(
    private readonly db: DatabaseSync,
    readonly sql: string,
    readonly values: SqlValue[] = [],
  ) {}

  bind(...values: unknown[]) {
    return new Statement(this.db, this.sql, values as SqlValue[]);
  }

  private query() {
    const [text, values] = positional(this.sql, this.values);
    return { statement: this.db.prepare(text), values };
  }

  first<T>() {
    const { statement, values } = this.query();
    return Promise.resolve((statement.get(...values) as T | undefined) ?? null);
  }

  all<T>() {
    const { statement, values } = this.query();
    return Promise.resolve({ results: statement.all(...values) as T[] });
  }

  run() {
    const { statement, values } = this.query();
    return { meta: { changes: Number(statement.run(...values).changes) } };
  }
}

export function d1(db: DatabaseSync): D1Like {
  return {
    prepare: (sql) => new Statement(db, sql),
    batch(statements) {
      db.exec('BEGIN');
      try {
        const results = statements.map((statement) => (statement as Statement).run());
        db.exec('COMMIT');
        return Promise.resolve(results);
      } catch (error) {
        db.exec('ROLLBACK');
        return Promise.reject(error instanceof Error ? error : new Error(String(error)));
      }
    },
  };
}
