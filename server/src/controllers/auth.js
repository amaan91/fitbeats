import db from '../db/database.js';

export async function signup(req, res) {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
  try {
    const { row } = await db.insert(
      `INSERT INTO users (name, email) VALUES (?, ?)
       ON CONFLICT(email) DO UPDATE SET name = excluded.name`,
      [name, email]
    );
    const user = row || await db.get('SELECT id, name, email FROM users WHERE email = ?', [email]);
    req.session.userId = user.id;
    res.json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getMe(req, res) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  const user = await db.get('SELECT id, name, email FROM users WHERE id = ?', [req.session.userId]);
  res.json(user || null);
}

export function logout(req, res) {
  req.session.destroy(() => res.json({ success: true }));
}
