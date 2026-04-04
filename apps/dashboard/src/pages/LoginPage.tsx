import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { appsApi } from '../lib/api';
import { Button } from '../components/ui/Button';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState('');
  const [appId, setAppId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [appName, setAppName] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || !appId.trim()) { setError('Both fields are required'); return; }
    login(apiKey.trim(), appId.trim());
    navigate('/');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim()) { setError('App name is required'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await appsApi.register(appName.trim());
      const data = res.data as { app: { id: string }; api_key: string };
      setApiKey(data.api_key);
      setAppId(data.app.id);
      setShowRegister(false);
      alert(`App registered!\n\nAPI Key: ${data.api_key}\nApp ID: ${data.app.id}\n\nSave these — the API key won't be shown again.`);
    } catch {
      setError('Registration failed. Check the API is running.');
    } finally {
      setLoading(false);
    }
  };

  const field = 'w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500';

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-cyan-400 font-mono mb-2">ChainLoyalty</div>
          <p className="text-slate-400 text-sm">Business Dashboard</p>
        </div>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8">
          {!showRegister ? (
            <>
              <h2 className="text-white font-semibold text-lg mb-6">Sign in</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">API Key</label>
                  <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk_live_..." className={field} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">App ID</label>
                  <input type="text" value={appId} onChange={(e) => setAppId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className={field} />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <Button type="submit" className="w-full justify-center">Sign In</Button>
              </form>
              <p className="text-center text-slate-500 text-sm mt-4">
                No account?{' '}
                <button onClick={() => { setShowRegister(true); setError(''); }} className="text-cyan-400 hover:text-cyan-300">
                  Register a new app
                </button>
              </p>
            </>
          ) : (
            <>
              <h2 className="text-white font-semibold text-lg mb-6">Register a new app</h2>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">App Name</label>
                  <input type="text" value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="My Loyalty Program" className={field} />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <Button type="submit" loading={loading} className="w-full justify-center">Register App</Button>
              </form>
              <p className="text-center text-slate-500 text-sm mt-4">
                <button onClick={() => { setShowRegister(false); setError(''); }} className="text-cyan-400 hover:text-cyan-300">
                  ← Back to sign in
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
