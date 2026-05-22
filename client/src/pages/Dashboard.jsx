import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const TYPE_EMOJI = { run: '🏃', lift: '🏋️', hiit: '⚡', cycle: '🚴', yoga: '🧘', other: '💪' };

export default function Dashboard({ user }) {
  const [workouts, setWorkouts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/workouts'), api.get('/workouts/stats')])
      .then(([w, s]) => { setWorkouts(w.data); setStats(s.data); })
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id) {
    await api.delete(`/workouts/${id}`);
    setWorkouts(ws => ws.filter(w => w.id !== id));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white text-3xl font-bold">Hey, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="text-neutral-400 mt-1">Here's your workout history.</p>
          </div>
          <Link
            to="/log"
            className="bg-green-500 hover:bg-green-400 text-black font-semibold px-5 py-2.5 rounded-full transition-colors"
          >
            + Log Workout
          </Link>
        </div>

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Workouts" value={stats.total_workouts ?? 0} />
            <StatCard label="Total Minutes" value={stats.total_minutes ?? 0} />
            <StatCard label="Avg Intensity" value={stats.avg_intensity ? `${stats.avg_intensity}/10` : '—'} />
            <StatCard label="This Week" value={stats.workouts_this_week ?? 0} />
          </div>
        )}

        {workouts.length === 0 ? (
          <div className="text-center py-20 text-neutral-600">
            <div className="text-5xl mb-4">🏁</div>
            <p className="text-lg">No workouts yet. Log your first one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workouts.map(w => (
              <WorkoutCard key={w.id} workout={w} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <p className="text-neutral-500 text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className="text-white text-2xl font-bold">{value}</p>
    </div>
  );
}

function WorkoutCard({ workout, onDelete }) {
  const date = new Date(workout.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center gap-4">
      <div className="text-3xl">{TYPE_EMOJI[workout.type] || '💪'}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white font-semibold capitalize">{workout.type}</span>
          <span className="text-neutral-500 text-sm">·</span>
          <span className="text-neutral-400 text-sm">{workout.duration_minutes} min</span>
          <span className="text-neutral-500 text-sm">·</span>
          <span className="text-neutral-400 text-sm">Intensity {workout.intensity}/10</span>
        </div>
        {workout.notes && <p className="text-neutral-500 text-sm mt-0.5 truncate">{workout.notes}</p>}
        <p className="text-neutral-600 text-xs mt-1">{date}</p>
      </div>
      <button
        onClick={() => onDelete(workout.id)}
        className="text-neutral-600 hover:text-red-400 text-sm transition-colors flex-shrink-0"
      >
        Delete
      </button>
    </div>
  );
}
