import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface Props {
  onClose: () => void;
}

export default function AuthModal({ onClose }: Props) {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (mode === 'login') {
      const err = await signIn(email, password);
      if (err) { setError(err); setLoading(false); return; }
      onClose();
      navigate('/dashboard');
    } else {
      if (!name.trim()) { setError('Name is required'); setLoading(false); return; }
      const err = await signUp(email, password, name);
      if (err) { setError(err); setLoading(false); return; }
      setSuccess('Account created! Check your email to confirm, then log in.');
      setMode('login');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-xl font-['Space_Mono']">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">✕</button>
        </div>

        {/* Tab toggle */}
        <div className="flex bg-gray-800 rounded-xl p-1 mb-6">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setSuccess(null); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === m ? 'bg-cyan-500 text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              {m === 'login' ? 'Log In' : 'Register'}
            </button>
          ))}
        </div>

        {success && (
          <div className="bg-green-900/40 border border-green-700 text-green-300 text-sm rounded-xl px-4 py-3 mb-4">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          )}
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-all text-sm"
          >
            {loading ? '...' : mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
