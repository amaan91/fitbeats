import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const DATABASE_URL = process.env.DATABASE_URL;

let db;

if (DATABASE_URL) {
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
    async get(sql, params = []) {
      let i = 0;
      const { rows } = await pool.query(sql.replace(/\?/g, () => `$${++i}`), params);
      return rows[0];
    },
    async all(sql, params = []) {
      let i = 0;
      const { rows } = await pool.query(sql.replace(/\?/g, () => `$${++i}`), params);
      return rows;
    },
    async run(sql, params = []) {
      let i = 0;
      await pool.query(sql.replace(/\?/g, () => `$${++i}`), params);
    },
    async insert(sql, params = []) {
      let i = 0;
      const pgSql = sql.replace(/\?/g, () => `$${++i}`) + ' RETURNING *';
      const { rows } = await pool.query(pgSql, params);
      return { row: rows[0] };
    },
  };
} else {
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
    async get(sql, params = []) { return sqlite.prepare(sql).get(params); },
    async all(sql, params = []) { return sqlite.prepare(sql).all(params); },
    async run(sql, params = []) { sqlite.prepare(sql).run(params); },
    async insert(sql, params = []) {
      const result = sqlite.prepare(sql).run(params);
      const table = sql.match(/INSERT INTO (\w+)/i)?.[1];
      const row = sqlite.prepare(`SELECT * FROM ${table} WHERE rowid = ?`).get(result.lastInsertRowid);
      return { row };
    },
  };
}

export default db;
