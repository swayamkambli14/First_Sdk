export const AURUM_APP_ID = import.meta.env['VITE_APP_ID'] ?? '04fb8529-928e-4e18-87f7-0087df2ce102';
export const AURUM_API_BASE = import.meta.env['VITE_API_BASE_URL'] ?? 'http://localhost:3000';

export const AURUM_TIER_NAMES: Record<string, string> = {
  bronze:   'Silver Key',
  silver:   'Gold Key',
  gold:     'Platinum Key',
  platinum: 'Diamond Key',
};

export const AURUM_BADGE_NAMES: Record<string, { name: string; desc: string; icon: string }> = {
  first_purchase:  { name: 'First Night',    desc: 'Awarded after your first stay at Aurum Hotels',       icon: '🏨' },
  power_buyer:     { name: 'Grand Spender',  desc: 'Awarded to guests who spend over $500 with us',       icon: '💎' },
  top_referrer:    { name: 'Ambassador',     desc: 'Awarded when you refer 5 or more friends to Aurum',   icon: '🤝' },
  tier_gold:       { name: 'Platinum Key',   desc: 'Awarded when you reach Platinum Key status',          icon: '🔑' },
  tier_platinum:   { name: 'Diamond Key',    desc: 'Awarded when you reach Diamond Key status',           icon: '👑' },
  lucky_subscriber:{ name: 'Suite Life',     desc: 'Awarded to guests who unlock a suite upgrade reward', icon: '🛎️' },
};

export const RARITY_MINT_PRICE: Record<string, string> = {
  common:    '0',
  uncommon:  '0',
  rare:      '0.001',
  epic:      '0.005',
  legendary: '0.02',
};

export const RARITY_DISPLAY: Record<string, string> = {
  common:    '★ Standard',
  uncommon:  '★★ Select',
  rare:      '★★★ Rare',
  epic:      '★★★★ Epic',
  legendary: '★★★★★ Legendary',
};

// Aurum-themed earn actions mapped to ChainLoyalty event types
export const EARN_ACTIONS = [
  {
    id: 'dining',
    icon: '🍽️',
    title: 'Dine at The Aurum Restaurant',
    desc: 'Enjoy a meal and earn Gold',
    goldAmount: 120,
    eventType: 'purchase',
    metadata: { amount: 120, category: 'dining' },
  },
  {
    id: 'spa',
    icon: '🧖',
    title: 'Book a Spa Treatment',
    desc: 'Relax and earn Gold + chance at a badge',
    goldAmount: 75,
    eventType: 'milestone',
    metadata: { milestone_name: 'spa_booked' },
  },
  {
    id: 'upgrade',
    icon: '🛏️',
    title: 'Upgrade Your Room',
    desc: 'Elevate your stay and earn Gold',
    goldAmount: 150,
    eventType: 'subscription',
    metadata: { plan: 'suite_upgrade' },
  },
  {
    id: 'review',
    icon: '✍️',
    title: 'Write a Review',
    desc: 'Share your experience and earn Gold',
    goldAmount: 50,
    eventType: 'feature_usage',
    metadata: { feature_name: 'review_submitted' },
  },
];

export const MOCK_STAYS = [
  {
    id: 1,
    room: 'Grand Suite',
    checkIn: 'Mar 12, 2026',
    checkOut: 'Mar 15, 2026',
    nights: 3,
    goldEarned: 1020,
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80',
  },
  {
    id: 2,
    room: 'Junior Suite',
    checkIn: 'Jan 28, 2026',
    checkOut: 'Jan 30, 2026',
    nights: 2,
    goldEarned: 680,
    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&q=80',
  },
  {
    id: 3,
    room: 'Presidential Suite',
    checkIn: 'Dec 31, 2025',
    checkOut: 'Jan 2, 2026',
    nights: 2,
    goldEarned: 1400,
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&q=80',
  },
];
