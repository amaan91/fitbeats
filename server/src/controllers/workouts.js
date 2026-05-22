import db from '../db/database.js';

export async function getWorkouts(req, res) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  const rows = await db.all(
    'SELECT * FROM workouts WHERE user_id = ? ORDER BY created_at DESC',
    [req.session.userId]
  );
  res.json(rows);
}

export async function createWorkout(req, res) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  const { type, duration_minutes, intensity, notes } = req.body;
  if (!type || !duration_minutes || !intensity) {
    return res.status(400).json({ error: 'type, duration_minutes, and intensity are required' });
  }
  const { row } = await db.insert(
    `INSERT INTO workouts (user_id, type, duration_minutes, intensity, notes) VALUES (?, ?, ?, ?, ?)`,
    [req.session.userId, type, duration_minutes, intensity, notes || null]
  );
  res.status(201).json(row);
}

export async function deleteWorkout(req, res) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  await db.run('DELETE FROM workouts WHERE id = ? AND user_id = ?', [req.params.id, req.session.userId]);
  res.status(204).end();
}

export async function getStats(req, res) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  const isPostgres = !!process.env.DATABASE_URL;
  const weekFilter = isPostgres
    ? `created_at >= NOW() - INTERVAL '7 days'`
    : `created_at >= datetime('now', '-7 days')`;
  const stats = await db.get(`
    SELECT
      COUNT(*) AS total_workouts,
      COALESCE(SUM(duration_minutes), 0) AS total_minutes,
      ROUND(AVG(intensity), 1) AS avg_intensity,
      COUNT(CASE WHEN ${weekFilter} THEN 1 END) AS workouts_this_week
    FROM workouts WHERE user_id = ?
  `, [req.session.userId]);
  res.json(stats);
}
