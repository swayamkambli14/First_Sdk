import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { appsApi, companyApi } from '../lib/api';
import { Button } from '../components/ui/Button';

type Mode = 'company-login' | 'company-register' | 'apikey';

export default function LoginPage() {
  const { login, setCompanyAuth } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('company-login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Company login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Company register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regIndustry, setRegIndustry] = useState('');
  const [regContact, setRegContact] = useState('');

  // API key login fields
  const [apiKey, setApiKey] = useState('');
  const [appId, setAppId] = useState('');

  const field = 'w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500';

  const handleCompanyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Email and password required'); return; }
    setLoading(true); setError('');
    try {
      const res = await companyApi.login(email, password);
      const d = res.data as { company_id: string; name: string; email: string; logo_url?: string; plan: string; session_token: string };
      // Fetch apps to get the active app id for business route auth
      let activeAppId: string | undefined;
      try {
        const appsRes = await companyApi.getApps(d.session_token);
        const apps = (appsRes.data as { apps: Array<{ id: string }> }).apps;
        if (apps.length > 0) activeAppId = apps[0]!.id;
      } catch { /* no apps yet */ }
      setCompanyAuth({ company_id: d.company_id, name: d.name, email: d.email, logo_url: d.logo_url, plan: d.plan }, d.session_token, activeAppId);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Invalid email or password');
    } finally { setLoading(false); }
  };

  const handleCompanyRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) { setError('Name, email and password are required'); return; }
    if (regPassword !== regConfirm) { setError('Passwords do not match'); return; }
    if (regPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true); setError('');
    try {
      const res = await companyApi.register({
        name: regName, email: regEmail, password: regPassword,
        contact_name: regContact || undefined,
        industry: regIndustry || undefined,
      });
      const d = res.data as { company_id: string; name: string; email: string; plan: string; session_token: string };
      // No apps yet on fresh register — activeAppId will be set when they create one
      setCompanyAuth({ company_id: d.company_id, name: d.name, email: d.email, plan: d.plan }, d.session_token);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Registration failed');
    } finally { setLoading(false); }
  };

  const handleApiKeyLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || !appId.trim()) { setError('Both fields are required'); return; }
    login(apiKey.trim(), appId.trim());
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-cyan-400 font-mono mb-2">ChainLoyalty</div>
          <p className="text-slate-400 text-sm">Business Dashboard</p>
        </div>

        {/* Mode tabs */}
        <div className="flex bg-slate-800 rounded-xl p-1 mb-6 gap-1">
          <button
            onClick={() => { setMode('company-login'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'company-login' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('company-register'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'company-register' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'}`}
          >
            Register
          </button>
          <button
            onClick={() => { setMode('apikey'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'apikey' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'}`}
          >
            API Key
          </button>
        </div>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8">
          {error && <p className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

          {/* Company Login */}
          {mode === 'company-login' && (
            <form onSubmit={handleCompanyLogin} className="space-y-4">
              <h2 className="text-white font-semibold text-lg mb-2">Welcome back</h2>

              {/* Demo credentials hint */}
              <div
                className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-3 py-2.5 cursor-pointer hover:bg-cyan-500/15 transition-colors"
                onClick={() => { setEmail('test@chainloyalty.dev'); setPassword('testpass123'); }}
              >
                <p className="text-cyan-400 text-xs font-mono font-bold mb-0.5">Demo credentials (click to fill)</p>
                <p className="text-slate-400 text-xs font-mono">Email: test@chainloyalty.dev</p>
                <p className="text-slate-400 text-xs font-mono">Password: testpass123</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className={field} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={field} />
              </div>
              <Button type="submit" loading={loading} className="w-full justify-center">Sign In</Button>
            </form>
          )}

          {/* Company Register */}
          {mode === 'company-register' && (
            <form onSubmit={handleCompanyRegister} className="space-y-4">
              <h2 className="text-white font-semibold text-lg mb-2">Create your account</h2>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Company Name *</label>
                <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="Acme Corp" className={field} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email *</label>
                <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="you@company.com" className={field} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Password *</label>
                  <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Min 8 chars" className={field} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Confirm *</label>
                  <input type="password" value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)} placeholder="Repeat" className={field} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Contact Name</label>
                  <input type="text" value={regContact} onChange={(e) => setRegContact(e.target.value)} placeholder="John Doe" className={field} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Industry</label>
                  <input type="text" value={regIndustry} onChange={(e) => setRegIndustry(e.target.value)} placeholder="E-commerce" className={field} />
                </div>
              </div>
              <Button type="submit" loading={loading} className="w-full justify-center">Create Account</Button>
            </form>
          )}

          {/* API Key Login */}
          {mode === 'apikey' && (
            <form onSubmit={handleApiKeyLogin} className="space-y-4">
              <h2 className="text-white font-semibold text-lg mb-2">Sign in with API Key</h2>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">API Key</label>
                <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk_live_..." className={field} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">App ID</label>
                <input type="text" value={appId} onChange={(e) => setAppId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className={field} />
              </div>
              <Button type="submit" className="w-full justify-center">Sign In</Button>
              <p className="text-slate-500 text-xs text-center">Use this if you have an existing API key from a previous session</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
