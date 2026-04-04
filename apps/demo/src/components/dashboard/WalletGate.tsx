import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useChainLoyaltyAuth } from '../../hooks/useChainLoyaltyAuth';
import { useAccount } from 'wagmi';
import axios from 'axios';

const APP_ID = import.meta.env['VITE_APP_ID'] ?? 'demo-app-id';

export default function WalletGate() {
  const { login } = useChainLoyaltyAuth();
  const { isConnected, address } = useAccount();
  const [mode, setMode] = useState<'email' | 'web3'>('email');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [siweLoading, setSiweLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (authMode === 'signup') {
        await axios.post('/v1/user-auth/signup', {
          email, password, display_name: name || undefined, app_id: APP_ID,
        }, { withCredentials: true });
        setSuccess('Account created! You\'re now signed in.');
        // Reload to trigger auth check
        setTimeout(() => window.location.reload(), 1000);
      } else {
        await axios.post('/v1/user-auth/login', {
          email, password, app_id: APP_ID,
        }, { withCredentials: true });
        window.location.reload();
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? (authMode === 'signup' ? 'Sign up failed. Please try again.' : 'Incorrect email or password.'));
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-black/30 border border-white/10 focus:border-cyan-500/50 rounded-xl px-4 py-3 text-white font-[\'DM_Sans\'] text-sm outline-none transition-colors placeholder-gray-700 min-h-[44px]';

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="font-['Space_Mono'] text-cyan-400 font-bold text-2xl">
            Chain<span className="text-white">Loyalty</span>
          </span>
          <p className="text-gray-500 text-sm mt-1">Your rewards, your way</p>
        </div>

        {/* Mode toggle */}
        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 mb-6 gap-1">
          <button
            onClick={() => { setMode('email'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'email' ? 'bg-cyan-500 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            <Mail size={14} className="inline mr-1.5" />
            Sign In
          </button>
          <button
            onClick={() => { setMode('web3'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'web3' ? 'bg-cyan-500 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            Advanced
          </button>
        </div>

        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6">

          {/* Email/Password path */}
          {mode === 'email' && (
            <>
              <div className="flex bg-black/20 rounded-xl p-1 mb-5 gap-1">
                {(['login', 'signup'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setAuthMode(m); setError(''); setSuccess(''); }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${authMode === m ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    {m === 'login' ? 'Sign In' : 'Create Account'}
                  </button>
                ))}
              </div>

              {success && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 mb-4">
                  <p className="text-green-400 text-xs font-mono">{success}</p>
                </div>
              )}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
                  <p className="text-red-400 text-xs font-mono">{error}</p>
                </div>
              )}

              <form onSubmit={handleEmailAuth} className="space-y-3">
                {authMode === 'signup' && (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name (optional)"
                    className={inputCls}
                  />
                )}
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className={inputCls}
                />
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    minLength={8}
                    className={`${inputCls} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-['Space_Mono'] font-bold text-sm rounded-xl transition-all active:scale-[0.97] min-h-[44px]"
                >
                  {loading ? '...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <p className="text-center text-gray-600 text-xs mt-4 flex items-center justify-center gap-1">
                <Lock size={10} /> Your rewards are safe and secure
              </p>
            </>
          )}

          {/* Web3 / MetaMask path */}
          {mode === 'web3' && (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm text-center leading-relaxed">
                Already have a MetaMask or WalletConnect account? Connect it here.
              </p>
              {!isConnected ? (
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <button
                      onClick={openConnectModal}
                      className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-['Space_Mono'] font-bold text-sm rounded-xl transition-all active:scale-[0.97] min-h-[44px]"
                    >
                      Connect Account
                    </button>
                  )}
                </ConnectButton.Custom>
              ) : (
                <button
                  onClick={async () => {
                    setSiweLoading(true);
                    setError('');
                    try {
                      await login();
                      window.location.reload();
                    } catch {
                      setError('Verification failed. Please try again.');
                    } finally {
                      setSiweLoading(false);
                    }
                  }}
                  disabled={siweLoading}
                  className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-['Space_Mono'] font-bold text-sm rounded-xl transition-all active:scale-[0.97] min-h-[44px]"
                >
                  {siweLoading ? 'Verifying...' : `Sign In as ${address?.slice(0, 6)}...${address?.slice(-4)}`}
                </button>
              )}
              {error && <p className="text-red-400 text-xs font-mono text-center">{error}</p>}
              <p className="text-gray-600 text-xs text-center">
                For advanced users with an existing account
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
