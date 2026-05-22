import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();

  async function handleLogout() {
    await api.post('/auth/logout');
    setUser(null);
    navigate('/');
  }

  return (
    <nav className="bg-neutral-900 border-b border-neutral-800 px-6 py-3 flex items-center justify-between">
      <Link to="/dashboard" className="text-white font-bold text-xl tracking-tight">
        🎵 FitBeats
      </Link>
      <div className="flex items-center gap-6">
        <Link to="/dashboard" className="text-neutral-400 hover:text-white text-sm transition-colors">
          Dashboard
        </Link>
        <Link to="/log" className="bg-green-500 hover:bg-green-400 text-black text-sm font-semibold px-4 py-2 rounded-full transition-colors">
          + Log Workout
        </Link>
        <span className="text-neutral-500 text-sm hidden sm:block">{user?.name}</span>
        <button onClick={handleLogout} className="text-neutral-500 hover:text-white text-sm transition-colors">
          Logout
        </button>
      </div>
    </nav>
  );
}
