import { useState } from 'react';
import api from '../api';

export default function LandingPage({ setUser }) {
  const [form, setForm] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/signup', form);
      setUser(data);
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 px-4">
      <div className="text-6xl mb-6">🎵💪</div>
      <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">FitBeats</h1>
      <p className="text-neutral-400 text-lg max-w-sm text-center mb-10">
        Log your workouts. Get Apple Music song recommendations matched to your intensity.
      </p>

      <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 w-full max-w-sm space-y-4">
        <div>
          <label className="block text-neutral-400 text-sm mb-2">Your name</label>
          <input
            type="text"
            required
            placeholder="Amaan"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-green-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-neutral-400 text-sm mb-2">Email</label>
          <input
            type="email"
            required
            placeholder="you@email.com"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-green-500 transition-colors"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold py-3 rounded-xl transition-colors"
        >
          {loading ? 'Getting started...' : 'Get Started'}
        </button>
      </form>
    </div>
  );
}
