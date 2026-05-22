import db from '../db/database.js';

export function getWorkouts(req, res) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  const rows = db.prepare(
    'SELECT * FROM workouts WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.session.userId);
  res.json(rows);
}

export function createWorkout(req, res) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  const { type, duration_minutes, intensity, notes } = req.body;
  if (!type || !duration_minutes || !intensity) {
    return res.status(400).json({ error: 'type, duration_minutes, and intensity are required' });
  }
  const result = db.prepare(
    `INSERT INTO workouts (user_id, type, duration_minutes, intensity, notes)
     VALUES (?, ?, ?, ?, ?)`
  ).run(req.session.userId, type, duration_minutes, intensity, notes || null);

  const workout = db.prepare('SELECT * FROM workouts WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(workout);
}

export function deleteWorkout(req, res) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  db.prepare('DELETE FROM workouts WHERE id = ? AND user_id = ?').run(req.params.id, req.session.userId);
  res.status(204).end();
}

export function getStats(req, res) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  const stats = db.prepare(`
    SELECT
      COUNT(*) AS total_workouts,
      COALESCE(SUM(duration_minutes), 0) AS total_minutes,
      ROUND(AVG(intensity), 1) AS avg_intensity,
      COUNT(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 END) AS workouts_this_week
    FROM workouts WHERE user_id = ?
  `).get(req.session.userId);
  res.json(stats);
}
