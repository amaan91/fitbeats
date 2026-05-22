import db from '../db/database.js';

export function signup(req, res) {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

  try {
    const stmt = db.prepare(
      `INSERT INTO users (name, email) VALUES (?, ?)
       ON CONFLICT(email) DO UPDATE SET name = excluded.name`
    );
    const result = stmt.run(name, email);
    const id = result.lastInsertRowid || db.prepare('SELECT id FROM users WHERE email = ?').get(email).id;
    const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(id);
    req.session.userId = user.id;
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function getMe(req, res) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(req.session.userId);
  res.json(user || null);
}

export function logout(req, res) {
  req.session.destroy(() => res.json({ success: true }));
}
