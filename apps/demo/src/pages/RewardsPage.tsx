import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Info } from 'lucide-react';
import AurumNav from '../components/aurum/AurumNav';
import { AURUM_BADGE_NAMES, AURUM_TIER_NAMES, RARITY_MINT_PRICE, RARITY_DISPLAY, AURUM_APP_ID } from '../config/aurum';
import axios from 'axios';

interface BadgeDef {
  badgeId: string;
  name: string;
  description?: string;
  rarity: string;
}

const TIERS = [
  { key: 'bronze',   name: 'Silver Key',   min: 0,     mult: '1×',    perks: ['Gold on every stay', 'Member rates'] },
  { key: 'silver',   name: 'Gold Key',     min: 500,   mult: '1.25×', perks: ['Room upgrade priority', 'Early check-in'] },
  { key: 'gold',     name: 'Platinum Key', min: 2000,  mult: '1.5×',  perks: ['Late checkout', 'Complimentary breakfast'] },
  { key: 'platinum', name: 'Diamond Key',  min: 10000, mult: '2×',    perks: ['Dedicated concierge', 'Suite guarantee'] },
];

export default function RewardsPage() {
  const [badges, setBadges] = useState<BadgeDef[]>([]);
  const [stats, setStats] = useState<{ stays: number; gold: number; badges: number } | null>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    // Fetch badge definitions
    axios.get('/v1/business/badges', {
      headers: { Authorization: `Bearer ${import.meta.env['VITE_API_KEY'] ?? ''}` },
    }).then((r) => {
      const data = r.data as { badges: BadgeDef[] };
      if (data.badges?.length) setBadges(data.badges);
    }).catch(() => {});

    // Fetch real analytics from the API
    axios.get(`/v1/leaderboard?app_id=${import.meta.env['VITE_APP_ID'] ?? ''}&period=all_time&limit=1`)
      .then((r) => {
        const data = r.data as { total?: number };
        setStats((prev) => ({ stays: data.total ?? prev?.stays ?? 0, gold: prev?.gold ?? 0, badges: prev?.badges ?? 0 }));
      }).catch(() => {});

    // Animate counters
    setTimeout(() => setAnimated(true), 300);
  }, []);

  const rarityStars = (r: string) => RARITY_DISPLAY[r] ?? r;
  const mintPrice = (r: string) => RARITY_MINT_PRICE[r] ?? '0';

  // Fallback badge list if API returns nothing
  const displayBadges: BadgeDef[] = badges.length > 0 ? badges : [
    { badgeId: 'first_purchase', name: 'First Night', rarity: 'common', description: 'Complete your first stay' },
    { badgeId: 'power_buyer', name: 'Grand Spender', rarity: 'rare', description: 'Spend over $500 with Aurum' },
    { badgeId: 'top_referrer', name: 'Ambassador', rarity: 'epic', description: 'Refer 5 or more friends' },
    { badgeId: 'lucky_subscriber', name: 'Suite Life', rarity: 'rare', description: 'Unlock a suite upgrade reward' },
    { badgeId: 'tier_gold', name: 'Platinum Key', rarity: 'epic', description: 'Reach Platinum Key status' },
    { badgeId: 'tier_platinum', name: 'Diamond Key', rarity: 'legendary', description: 'Reach Diamond Key status' },
  ];

  return (
    <div className="bg-aurum-ivory min-h-screen">
      <AurumNav />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 bg-aurum-midnight overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-aurum-gold text-xs tracking-[0.3em] uppercase mb-4">Aurum Circle</p>
          <h1 className="font-display text-6xl font-light text-aurum-ivory mb-4">
            Every Stay <em className="text-aurum-gold">Rewarded</em>
          </h1>
          <p className="text-aurum-ivory/60 text-lg max-w-xl mx-auto mb-8">
            Earn Gold on every experience. Unlock exclusive badges. Rise through the tiers.
          </p>
          <Link to="/join" className="btn-gold px-8 py-3.5 rounded-xl text-sm font-semibold inline-block">
            Join Aurum Circle — It's Free
          </Link>
        </div>
      </section>

      {/* Live stats */}
      <section className="bg-aurum-gold py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { label: 'Stays Rewarded', value: stats ? stats.stays.toLocaleString() : '—' },
            { label: 'Gold Distributed', value: stats ? `${(stats.gold / 1000000).toFixed(1)}M` : '—' },
            { label: 'Exclusive Badges', value: stats ? stats.badges.toLocaleString() : '—' },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-display text-4xl text-aurum-midnight font-semibold">{s.value}</p>
              <p className="text-aurum-midnight/60 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tier table */}
      <section className="py-24 px-6 bg-aurum-ivory">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-aurum-gold text-xs tracking-[0.3em] uppercase mb-3">Membership Tiers</p>
            <h2 className="font-display text-5xl text-aurum-midnight font-light">The Keys to Aurum</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {TIERS.map((tier, i) => (
              <div key={tier.key} className={`rounded-2xl p-6 ${i === 3 ? 'bg-aurum-midnight text-aurum-ivory' : 'bg-white shadow-card'}`}>
                <p className={`text-xs tracking-widest uppercase mb-2 ${i === 3 ? 'text-aurum-gold' : 'text-aurum-text-secondary'}`}>
                  {tier.name}
                </p>
                <p className={`font-display text-3xl font-light mb-1 ${i === 3 ? 'text-aurum-gold' : 'text-aurum-midnight'}`}>
                  {tier.min === 0 ? 'Free' : `${tier.min.toLocaleString()} Gold`}
                </p>
                <p className={`text-sm mb-4 ${i === 3 ? 'text-aurum-ivory/50' : 'text-aurum-text-secondary'}`}>
                  {tier.mult} earn multiplier
                </p>
                <ul className="space-y-1.5">
                  {tier.perks.map((p) => (
                    <li key={p} className={`text-xs flex items-center gap-1.5 ${i === 3 ? 'text-aurum-ivory/70' : 'text-aurum-text-secondary'}`}>
                      <span className="text-aurum-gold">✦</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Badges showcase */}
      <section className="py-24 px-6 bg-aurum-ivory-dark">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-aurum-gold text-xs tracking-[0.3em] uppercase mb-3">Exclusive Badges</p>
            <h2 className="font-display text-5xl text-aurum-midnight font-light">Achievements Worth Keeping</h2>
            <p className="text-aurum-text-secondary mt-3 max-w-lg mx-auto">
              Earn badges by reaching milestones. Rare badges can be permanently recorded as a digital collectible.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {displayBadges.map((badge) => {
              const info = AURUM_BADGE_NAMES[badge.badgeId] ?? { name: badge.name, icon: '🏅', desc: badge.description ?? '' };
              const price = mintPrice(badge.rarity);
              const isPaid = parseFloat(price) > 0;
              return (
                <div key={badge.badgeId} className="bg-white rounded-2xl p-5 shadow-card hover:shadow-gold transition-all">
                  <span className="text-4xl block mb-3">{info.icon}</span>
                  <h3 className="font-display text-lg text-aurum-midnight mb-1">{info.name}</h3>
                  <p className="text-aurum-text-secondary text-xs mb-3 leading-relaxed">{info.desc}</p>
                  <p className="text-aurum-gold text-xs font-semibold mb-2">{rarityStars(badge.rarity)}</p>
                  {isPaid ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-aurum-text-secondary text-[10px]">Digital collectible · {price} ETH</span>
                      <div className="relative group">
                        <Info size={11} className="text-aurum-text-secondary cursor-help" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-aurum-midnight text-aurum-ivory text-[10px] rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          This badge is permanently recorded as a digital collectible. It's yours forever, even if you leave Aurum Hotels.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-aurum-text-secondary text-[10px]">Earn by completing your first stay</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Referral CTA */}
      <section className="py-24 px-6 bg-aurum-midnight">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-aurum-gold text-xs tracking-[0.3em] uppercase mb-4">Refer & Earn</p>
          <h2 className="font-display text-5xl text-aurum-ivory font-light mb-4">
            Bring a Friend to Aurum.<br /><em className="text-aurum-gold">You Both Win.</em>
          </h2>
          <div className="flex justify-center gap-12 my-8">
            <div>
              <p className="font-display text-4xl text-aurum-gold">200</p>
              <p className="text-aurum-ivory/50 text-sm">Gold for you</p>
            </div>
            <div className="w-px bg-white/10" />
            <div>
              <p className="font-display text-4xl text-aurum-gold">100</p>
              <p className="text-aurum-ivory/50 text-sm">Welcome Gold for them</p>
            </div>
          </div>
          <Link to="/dashboard" className="btn-gold px-8 py-3.5 rounded-xl text-sm font-semibold inline-block">
            Get Your Referral Link
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-aurum-midnight border-t border-white/10 py-8 px-6 text-center">
        <p className="text-aurum-ivory/20 text-[10px]">Aurum Circle loyalty infrastructure powered by ChainLoyalty.</p>
      </footer>
    </div>
  );
}
