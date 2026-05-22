import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const WORKOUT_TYPES = [
  { value: 'run', label: 'Run', emoji: '🏃' },
  { value: 'lift', label: 'Lift', emoji: '🏋️' },
  { value: 'hiit', label: 'HIIT', emoji: '⚡' },
  { value: 'cycle', label: 'Cycle', emoji: '🚴' },
  { value: 'yoga', label: 'Yoga', emoji: '🧘' },
  { value: 'other', label: 'Other', emoji: '💪' },
];

export default function LogWorkout() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ type: 'run', duration_minutes: '', intensity: 5, notes: '' });
  const [step, setStep] = useState('form'); // 'form' | 'music'
  const [workout, setWorkout] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data: savedWorkout } = await api.post('/workouts', form);
      setWorkout(savedWorkout);

      const { data: music } = await api.get('/music/recommendations', {
        params: {
          workoutType: form.type,
          intensity: form.intensity,
          durationMinutes: form.duration_minutes,
        },
      });
      setTracks(music);
      setStep('music');
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'music') {
    return (
      <div className="min-h-screen bg-neutral-950 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🎵</div>
            <h1 className="text-white text-2xl font-bold">Workout logged!</h1>
            <p className="text-neutral-400 mt-1">
              {workout.duration_minutes} min {workout.type} · Intensity {workout.intensity}/10
            </p>
            <p className="text-neutral-500 text-sm mt-2">Here are songs to match your energy:</p>
          </div>

          <div className="space-y-3 mb-6">
            {tracks.map(track => (
              <a
                key={track.id}
                href={track.appleMusicUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-4 bg-neutral-900 border border-neutral-800 hover:border-neutral-600 rounded-xl p-3 transition-colors group"
              >
                {track.artwork && (
                  <img src={track.artwork} alt={track.album} className="w-14 h-14 rounded-lg flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-white font-medium truncate">{track.title}</p>
                  <p className="text-neutral-400 text-sm truncate">{track.artist}</p>
                  <p className="text-neutral-600 text-xs truncate">{track.album}</p>
                </div>
                <span className="text-green-500 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  Open ↗
                </span>
              </a>
            ))}
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full text-neutral-500 hover:text-white py-3 transition-colors"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="bg-neutral-900 rounded-2xl p-8 max-w-lg w-full border border-neutral-800">
        <h1 className="text-white text-2xl font-bold mb-6">Log a Workout</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-neutral-400 text-sm mb-3">Workout Type</label>
            <div className="grid grid-cols-3 gap-2">
              {WORKOUT_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: t.value }))}
                  className={`py-3 rounded-xl text-sm font-medium transition-colors border ${
                    form.type === t.value
                      ? 'bg-green-500 border-green-500 text-black'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-neutral-500'
                  }`}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-neutral-400 text-sm mb-2">Duration (minutes)</label>
            <input
              type="number"
              min="1"
              max="300"
              required
              value={form.duration_minutes}
              onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
              placeholder="e.g. 45"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-neutral-400 text-sm mb-2">
              Intensity: <span className="text-white font-semibold">{form.intensity}/10</span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={form.intensity}
              onChange={e => setForm(f => ({ ...f, intensity: Number(e.target.value) }))}
              className="w-full accent-green-500"
            />
            <div className="flex justify-between text-neutral-600 text-xs mt-1">
              <span>Easy</span><span>Moderate</span><span>Max effort</span>
            </div>
          </div>

          <div>
            <label className="block text-neutral-400 text-sm mb-2">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="How did it feel?"
              rows={2}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-green-500 transition-colors resize-none"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold py-4 rounded-xl text-lg transition-colors"
          >
            {loading ? 'Saving & finding music...' : 'Save Workout'}
          </button>
        </form>
      </div>
    </div>
  );
}
