import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Key } from 'lucide-react';
import { useChainLoyaltyAuth } from '../../hooks/useChainLoyaltyAuth';
import { useUserStats } from '../../hooks/useRewardsData';
import { AURUM_TIER_NAMES } from '../../config/aurum';
import axios from 'axios';

export default function AurumNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated } = useChainLoyaltyAuth();
  const { stats } = useUserStats();
  const navigate = useNavigate();
  const [custodialSignedIn, setCustodialSignedIn] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    axios.get('/v1/user-auth/me', { withCredentials: true })
      .then(() => setCustodialSignedIn(true))
      .catch(() => setCustodialSignedIn(false));
  }, []);

  const isSignedIn = isAuthenticated || custodialSignedIn;
  const tierName = AURUM_TIER_NAMES[(stats?.tier ?? 'bronze').toLowerCase()] ?? 'Silver Key';
  const balance = stats?.currentPointsBalance ?? 0;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-aurum-midnight shadow-lg' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="font-display text-2xl font-semibold tracking-wide text-aurum-gold">
          AURUM
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-8">
          {[['/', 'Home'], ['/rooms', 'Rooms'], ['/dining', 'Dining'], ['/rewards', 'Aurum Circle']].map(([path, label]) => (
            <Link
              key={path}
              to={path}
              className={`text-sm font-medium tracking-wide transition-colors ${
                scrolled ? 'text-aurum-ivory/80 hover:text-aurum-gold' : 'text-white/80 hover:text-aurum-gold'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden lg:flex items-center gap-4">
          {isSignedIn && stats ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 bg-aurum-gold/10 border border-aurum-gold/30 hover:border-aurum-gold/60 px-3 py-1.5 rounded-lg transition-all"
            >
              <Key size={13} className="text-aurum-gold" />
              <span className="text-aurum-gold font-semibold text-sm">{balance.toLocaleString()} Gold</span>
              <span className="text-aurum-ivory/50 text-xs">·</span>
              <span className="text-aurum-ivory/70 text-xs">{tierName}</span>
            </button>
          ) : (
            <Link to="/join" className="text-sm font-medium text-aurum-ivory/80 hover:text-aurum-gold transition-colors">
              Sign In
            </Link>
          )}
          <Link
            to="/join"
            className="btn-gold px-5 py-2 rounded-lg text-sm"
          >
            Book a Stay
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="lg:hidden text-aurum-ivory"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-aurum-midnight border-t border-white/10 px-6 py-4 space-y-3">
          {[['/', 'Home'], ['/rooms', 'Rooms'], ['/dining', 'Dining'], ['/rewards', 'Aurum Circle'], ['/join', 'Sign In']].map(([path, label]) => (
            <Link
              key={path}
              to={path}
              onClick={() => setMenuOpen(false)}
              className="block text-aurum-ivory/80 hover:text-aurum-gold text-sm font-medium py-1"
            >
              {label}
            </Link>
          ))}
          <Link to="/join" onClick={() => setMenuOpen(false)} className="block btn-gold px-5 py-2 rounded-lg text-sm text-center mt-2">
            Book a Stay
          </Link>
        </div>
      )}
    </nav>
  );
}
