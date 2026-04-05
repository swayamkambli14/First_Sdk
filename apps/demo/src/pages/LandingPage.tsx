import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, ChevronRight, ArrowRight } from 'lucide-react';
import AurumNav from '../components/aurum/AurumNav';
import { AURUM_APP_ID, AURUM_TIER_NAMES } from '../config/aurum';
import axios from 'axios';

interface LeaderboardEntry {
  rank: number;
  wallet_address: string;
  tier: string;
  points: string;
}

const ROOMS = [
  {
    name: 'Junior Suite',
    desc: 'Elegant comfort with city views and a private terrace',
    price: 340,
    gold: 340,
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
  },
  {
    name: 'Grand Suite',
    desc: 'Expansive living spaces with butler service and panoramic views',
    price: 680,
    gold: 680,
    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80',
  },
  {
    name: 'Presidential Suite',
    desc: 'The pinnacle of luxury — private dining, spa, and dedicated staff',
    price: 1200,
    gold: 1200,
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
  },
];

const EXPERIENCES = [
  { name: 'The Aurum Restaurant', desc: 'Michelin-starred cuisine in an intimate setting', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80' },
  { name: 'Rooftop Bar', desc: 'Craft cocktails above the city skyline', image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&q=80' },
  { name: 'Spa & Wellness', desc: 'Restore and rejuvenate with world-class treatments', image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80' },
  { name: 'Private Tours', desc: 'Curated city experiences with a personal guide', image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&q=80' },
];

export default function LandingPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    axios.get(`/v1/leaderboard?app_id=${AURUM_APP_ID}&period=monthly&limit=5`)
      .then((r) => setLeaderboard((r.data as { leaderboard: LeaderboardEntry[] }).leaderboard ?? []))
      .catch(() => {});
  }, []);

  const abbrevWallet = (addr: string) =>
    addr.startsWith('0x') ? `Guest ${addr.slice(2, 5).toUpperCase()}` : addr.split('@')[0] ?? addr;

  return (
    <div className="bg-aurum-ivory min-h-screen">
      <AurumNav />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden grain-overlay">
        <img
          src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1920&q=90"
          alt="Aurum Hotels lobby"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-aurum-midnight/60 via-aurum-midnight/40 to-aurum-midnight/70" />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <p className="text-aurum-gold font-sans text-xs tracking-[0.3em] uppercase mb-6">Est. 1924 · Luxury Collection</p>
          <h1 className="font-display text-6xl lg:text-8xl font-light text-white leading-tight mb-6">
            Where Every Stay<br />
            <em className="text-aurum-gold">Becomes a Story</em>
          </h1>
          <p className="text-white/70 font-sans text-lg mb-10 max-w-xl mx-auto">
            Experience the world's finest hospitality — and earn Gold rewards with every moment.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/join" className="btn-gold px-8 py-3.5 rounded-lg text-sm font-semibold tracking-wide">
              Book a Stay
            </Link>
            <Link to="/join" className="btn-outline-gold px-8 py-3.5 rounded-lg text-sm font-semibold tracking-wide">
              Join Aurum Circle
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-aurum-gold/40 animate-pulse" />
        </div>
      </section>

      {/* ── Aurum Circle Teaser ───────────────────────────────────────────── */}
      <section className="bg-aurum-midnight py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-aurum-gold text-xs tracking-[0.3em] uppercase mb-4">Aurum Circle</p>
            <h2 className="font-display text-5xl font-light text-aurum-ivory mb-4">
              More Than Points.<br /><em>A Lifestyle.</em>
            </h2>
            <p className="text-aurum-ivory/50 font-sans max-w-lg mx-auto">
              Every stay, every meal, every experience earns you Gold. Redeem for upgrades, exclusive access, and rewards that last a lifetime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {[
              { icon: '🏨', title: 'Earn Gold on every experience', desc: 'Every stay, every meal, every spa visit — Gold accumulates automatically.' },
              { icon: '🏅', title: 'Unlock exclusive badges', desc: 'Carry your achievements everywhere. Each badge is uniquely yours.' },
              { icon: '🎁', title: 'Spin for surprise rewards', desc: 'Hit milestones and spin for bonus Gold, suite upgrades, and more.' },
            ].map((item) => (
              <div key={item.title} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-aurum-gold/30 transition-all">
                <span className="text-4xl mb-4 block">{item.icon}</span>
                <h3 className="font-display text-xl text-aurum-ivory mb-2">{item.title}</h3>
                <p className="text-aurum-ivory/50 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Live leaderboard */}
          <div className="bg-white/5 border border-aurum-gold/20 rounded-2xl p-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-xl text-aurum-ivory">This Month's Top Guests</h3>
              <span className="text-aurum-gold text-xs tracking-widest uppercase">Live</span>
            </div>
            {leaderboard.length === 0 ? (
              <p className="text-aurum-ivory/30 text-sm text-center py-4">Be the first to earn Gold this month</p>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry, i) => (
                  <div key={entry.rank} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-aurum-gold/50 text-sm w-5">#{i + 1}</span>
                      <span className="text-aurum-ivory text-sm">{abbrevWallet(entry.wallet_address)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-aurum-gold font-semibold text-sm">{parseInt(entry.points).toLocaleString()} Gold</span>
                      <span className="text-aurum-ivory/30 text-xs ml-2">· {AURUM_TIER_NAMES[entry.tier] ?? entry.tier}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link to="/join" className="flex items-center justify-center gap-2 mt-6 text-aurum-gold text-sm hover:text-aurum-gold-light transition-colors">
              Join Aurum Circle <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Rooms ─────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-aurum-ivory">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-aurum-gold text-xs tracking-[0.3em] uppercase mb-4">Accommodations</p>
            <h2 className="font-display text-5xl font-light text-aurum-midnight">Our Suites</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {ROOMS.map((room) => (
              <div key={room.name} className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-gold transition-all duration-300 hover:-translate-y-1">
                <div className="relative overflow-hidden h-56">
                  <img src={room.image} alt={room.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute bottom-3 left-3 bg-aurum-gold/90 text-aurum-midnight text-xs font-semibold px-2.5 py-1 rounded-full">
                    Earn {room.gold} Gold/night
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-display text-2xl text-aurum-midnight mb-1">{room.name}</h3>
                  <p className="text-aurum-text-secondary text-sm mb-4">{room.desc}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-aurum-midnight font-semibold">from ${room.price}</span>
                      <span className="text-aurum-text-secondary text-xs">/night</span>
                    </div>
                    <Link to="/join" className="btn-gold px-4 py-2 rounded-lg text-xs">Book Now</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Experiences ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-aurum-ivory-dark">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-aurum-gold text-xs tracking-[0.3em] uppercase mb-4">Dining & Experiences</p>
            <h2 className="font-display text-5xl font-light text-aurum-midnight">Earn Gold Everywhere</h2>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin">
            {EXPERIENCES.map((exp) => (
              <div key={exp.name} className="flex-shrink-0 w-72 bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-gold transition-all">
                <img src={exp.image} alt={exp.name} className="w-full h-44 object-cover" />
                <div className="p-5">
                  <h3 className="font-display text-xl text-aurum-midnight mb-1">{exp.name}</h3>
                  <p className="text-aurum-text-secondary text-sm mb-3">{exp.desc}</p>
                  <span className="text-aurum-gold text-xs font-semibold">✦ Earn Gold here too</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-aurum-ivory">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-aurum-gold text-xs tracking-[0.3em] uppercase mb-4">Guest Stories</p>
            <h2 className="font-display text-5xl font-light text-aurum-midnight">
              Loved by Our <em className="text-aurum-gold">Guests</em>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sophia R.',
                tier: 'Diamond Key',
                avatar: 'SR',
                rating: 5,
                text: 'The Aurum Circle program completely changed how I travel. I earned enough Gold in two stays to unlock a complimentary suite upgrade — the Presidential Suite was beyond anything I expected.',
                stay: 'Presidential Suite, March 2026',
              },
              {
                name: 'James L.',
                tier: 'Platinum Key',
                avatar: 'JL',
                rating: 5,
                text: "I've stayed at luxury hotels around the world, but none reward loyalty like Aurum. The Gold system is transparent, the tiers feel genuinely exclusive, and the concierge service at Platinum level is unmatched.",
                stay: 'Grand Suite, February 2026',
              },
              {
                name: 'Priya M.',
                tier: 'Gold Key',
                avatar: 'PM',
                rating: 5,
                text: 'Signing up took less than a minute and I immediately started earning Gold on my first dinner at The Aurum Restaurant. The spin wheel reward was a lovely surprise — I won a spa treatment!',
                stay: 'Junior Suite, January 2026',
              },
              {
                name: 'Marcus T.',
                tier: 'Platinum Key',
                avatar: 'MT',
                rating: 5,
                text: "The referral program is genuinely generous. I referred three colleagues for a corporate retreat and earned enough Gold to cover my next weekend stay. Aurum rewards loyalty in every sense.",
                stay: 'Grand Suite, March 2026',
              },
              {
                name: 'Elena V.',
                tier: 'Diamond Key',
                avatar: 'EV',
                rating: 5,
                text: 'What sets Aurum apart is the attention to detail — both in the rooms and in the rewards. My Diamond Key status means early check-in, late checkout, and a dedicated concierge who remembers my preferences.',
                stay: 'Presidential Suite, February 2026',
              },
              {
                name: 'David K.',
                tier: 'Gold Key',
                avatar: 'DK',
                rating: 5,
                text: "I was skeptical about another loyalty program, but Aurum Circle is different. The Gold I earn is real value — I redeemed it for a room upgrade on our anniversary trip. My wife was thrilled.",
                stay: 'Junior Suite, December 2025',
              },
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-7 shadow-card hover:shadow-gold transition-all duration-300 flex flex-col gap-4">
                {/* Stars */}
                <div className="flex gap-1">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} size={14} className="text-aurum-gold fill-aurum-gold" />
                  ))}
                </div>
                {/* Quote */}
                <p className="text-aurum-text-secondary text-sm leading-relaxed flex-1">
                  "{t.text}"
                </p>
                {/* Author */}
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-aurum-midnight flex items-center justify-center flex-shrink-0">
                    <span className="text-aurum-gold text-xs font-semibold font-display">{t.avatar}</span>
                  </div>
                  <div>
                    <p className="text-aurum-midnight font-semibold text-sm">{t.name}</p>
                    <p className="text-aurum-gold text-xs">{t.tier} · {t.stay}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="bg-aurum-midnight py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
            <div>
              <p className="font-display text-3xl text-aurum-gold mb-2">AURUM</p>
              <p className="text-aurum-ivory/40 text-sm italic">Where Every Stay Becomes a Story</p>
            </div>
            <div className="flex gap-12 text-sm text-aurum-ivory/50">
              <div className="space-y-2">
                <p className="text-aurum-ivory/80 font-semibold mb-3">Explore</p>
                {['Rooms', 'Dining', 'Experiences', 'Aurum Circle'].map((l) => (
                  <p key={l} className="hover:text-aurum-gold cursor-pointer transition-colors">{l}</p>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-aurum-ivory/80 font-semibold mb-3">Legal</p>
                {['Privacy Policy', 'Terms of Service', 'Contact Us'].map((l) => (
                  <p key={l} className="hover:text-aurum-gold cursor-pointer transition-colors">{l}</p>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-2">
            <p className="text-aurum-ivory/30 text-xs">© 2026 Aurum Hotels. All rights reserved.</p>
            <p className="text-aurum-ivory/20 text-[10px]">Aurum Circle loyalty infrastructure powered by ChainLoyalty.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
