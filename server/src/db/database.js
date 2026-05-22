import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const DATABASE_URL = process.env.DATABASE_URL;

let db;

if (DATABASE_URL) {
  // Production: use PostgreSQL (Supabase)
  const pg = (await import('pg')).default;
  const pool = new pg.Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS workouts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('run','lift','hiit','yoga','cycle','other')),
      duration_minutes INTEGER NOT NULL CHECK(duration_minutes > 0),
      intensity INTEGER NOT NULL CHECK(intensity BETWEEN 1 AND 10),
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  db = {
    async run(sql, params = []) {
      const pgSql = sql.replace(/\?/g, (_, i) => `$${++i}`);
      let idx = 0;
      const pgSql2 = sql.replace(/\?/g, () => `$${++idx}`);
      await pool.query(pgSql2, params);
    },
    async get(sql, params = []) {
      let idx = 0;
      const pgSql = sql.replace(/\?/g, () => `$${++idx}`);
      const { rows } = await pool.query(pgSql, params);
      return rows[0];
    },
    async all(sql, params = []) {
      let idx = 0;
      const pgSql = sql.replace(/\?/g, () => `$${++idx}`);
      const { rows } = await pool.query(pgSql, params);
      return rows;
    },
    async insert(sql, params = []) {
      let idx = 0;
      const pgSql = sql.replace(/\?/g, () => `$${++idx}`);
      const returning = pgSql.includes('RETURNING') ? pgSql : pgSql + ' RETURNING *';
      const { rows } = await pool.query(returning, params);
      return { lastInsertRowid: rows[0]?.id, row: rows[0] };
    },
  };
} else {
  // Local dev: use SQLite
  const { default: Database } = await import('better-sqlite3');
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const sqlite = new Database(path.join(__dirname, '../../../fitbeats.db'));
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('run','lift','hiit','yoga','cycle','other')),
      duration_minutes INTEGER NOT NULL CHECK(duration_minutes > 0),
      intensity INTEGER NOT NULL CHECK(intensity BETWEEN 1 AND 10),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db = {
    async run(sql, params = []) { sqlite.prepare(sql).run(params); },
    async get(sql, params = []) { return sqlite.prepare(sql).get(params); },
    async all(sql, params = []) { return sqlite.prepare(sql).all(params); },
    async insert(sql, params = []) {
      const result = sqlite.prepare(sql).run(params);
      const table = sql.match(/INSERT INTO (\w+)/i)?.[1];
      const row = sqlite.prepare(`SELECT * FROM ${table} WHERE rowid = ?`).get(result.lastInsertRowid);
      return { lastInsertRowid: result.lastInsertRowid, row };
    },
  };
}

export default db;
