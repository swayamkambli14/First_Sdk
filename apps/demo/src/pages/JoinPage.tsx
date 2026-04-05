import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useChainLoyaltyAuth } from '../hooks/useChainLoyaltyAuth';
import axios from 'axios';
import { AURUM_APP_ID } from '../config/aurum';

export default function JoinPage() {
  const navigate = useNavigate();
  const { login } = useChainLoyaltyAuth();
  const { isConnected, address } = useAccount();

  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [siweLoading, setSiweLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const inp = 'w-full border border-aurum-ivory-dark bg-white rounded-lg px-4 py-3 text-aurum-midnight text-sm focus:outline-none focus:ring-2 focus:ring-aurum-gold/40 placeholder-aurum-text-secondary';

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (tab === 'signup') {
        await axios.post('/v1/user-auth/signup', {
          email, password, display_name: name || undefined, app_id: AURUM_APP_ID,
        }, { withCredentials: true });
        navigate('/dashboard');
      } else {
        await axios.post('/v1/user-auth/login', {
          email, password, app_id: AURUM_APP_ID,
        }, { withCredentials: true });
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? (tab === 'signup' ? 'Sign up failed. Please try again.' : 'Incorrect email or password.'));
    } finally { setLoading(false); }
  };

  const handleSiwe = async () => {
    setSiweLoading(true); setError('');
    try { await login(); navigate('/dashboard'); }
    catch { setError('Verification failed. Please try again.'); }
    finally { setSiweLoading(false); }
  };

  return (
    <div className="min-h-screen bg-aurum-ivory flex">
      {/* Left — atmospheric image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=90"
          alt="Aurum Hotels corridor"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-aurum-midnight/60 to-transparent" />
        <div className="absolute bottom-12 left-10">
          <p className="font-display text-4xl text-white font-light mb-2">AURUM</p>
          <p className="text-white/60 text-sm italic">Where Every Stay Becomes a Story</p>
        </div>
      </div>

      {/* Right — auth form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-md">
          <Link to="/" className="font-display text-2xl text-aurum-gold font-semibold block mb-10 lg:hidden">AURUM</Link>

          <h1 className="font-display text-4xl text-aurum-midnight font-light mb-2">
            {tab === 'login' ? 'Welcome back.' : 'Join Aurum Circle.'}
          </h1>
          <p className="text-aurum-text-secondary text-sm mb-8">
            {tab === 'login' ? 'Sign in to access your Gold rewards.' : 'Create your account and start earning Gold instantly.'}
          </p>

          {/* Tab toggle */}
          <div className="flex bg-aurum-ivory-dark rounded-xl p-1 mb-8 gap-1">
            {(['login', 'signup'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t ? 'bg-aurum-midnight text-aurum-ivory shadow-sm' : 'text-aurum-text-secondary hover:text-aurum-midnight'
                }`}
              >
                {t === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-red-700 text-sm">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 text-green-700 text-sm">{success}</div>
          )}

          {/* Demo credentials hint — only on login tab */}
          {tab === 'login' && (
            <div
              className="bg-aurum-gold/10 border border-aurum-gold/30 rounded-xl px-4 py-3 mb-4 cursor-pointer hover:bg-aurum-gold/15 transition-colors"
              onClick={() => { setEmail('guest@aurum.demo'); setPassword('aurum1234'); }}
            >
              <p className="text-aurum-gold text-xs font-semibold mb-0.5">Demo credentials — click to fill</p>
              <p className="text-aurum-text-secondary text-xs font-mono">Email: guest@aurum.demo</p>
              <p className="text-aurum-text-secondary text-xs font-mono">Password: aurum1234</p>
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {tab === 'signup' && (
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inp} />
            )}
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-aurum-text-secondary" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required className={`${inp} pl-10`} />
            </div>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required minLength={8} className={`${inp} pr-12`} />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-aurum-text-secondary">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <button type="submit" disabled={loading} className="w-full btn-gold py-3.5 rounded-xl text-sm font-semibold disabled:opacity-50">
              {loading ? '...' : tab === 'login' ? 'Sign In' : 'Join Aurum Circle'}
            </button>
          </form>

          <p className="text-aurum-text-secondary text-xs text-center mt-4">
            Your Aurum Circle account is created instantly. No downloads required.
          </p>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-aurum-ivory-dark" />
            <span className="text-aurum-text-secondary text-xs">or</span>
            <div className="flex-1 h-px bg-aurum-ivory-dark" />
          </div>

          {/* Web3 — secondary, less prominent */}
          <div className="border border-aurum-ivory-dark rounded-xl p-5">
            <p className="text-aurum-text-secondary text-xs mb-4 text-center">Already have a crypto account?</p>
            {!isConnected ? (
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button onClick={openConnectModal} className="w-full btn-outline-gold py-3 rounded-xl text-sm font-medium">
                    Connect Account
                  </button>
                )}
              </ConnectButton.Custom>
            ) : (
              <button onClick={handleSiwe} disabled={siweLoading} className="w-full btn-outline-gold py-3 rounded-xl text-sm font-medium disabled:opacity-50">
                {siweLoading ? 'Verifying...' : `Sign in as ${address?.slice(0, 6)}...${address?.slice(-4)}`}
              </button>
            )}
            <p className="text-aurum-text-secondary text-[11px] text-center mt-3">For advanced users with an existing account</p>
          </div>
        </div>
      </div>
    </div>
  );
}
