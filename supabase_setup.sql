-- ─────────────────────────────────────────────
-- Drop old table
-- ─────────────────────────────────────────────
DROP TABLE IF EXISTS public.users CASCADE;

-- ─────────────────────────────────────────────
-- Users table (custom auth, no Supabase Auth)
-- ─────────────────────────────────────────────
CREATE TABLE public.users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email               TEXT UNIQUE NOT NULL,
  password            TEXT NOT NULL,
  name                TEXT,
  wallet_address      TEXT UNIQUE,
  app_id              TEXT DEFAULT 'demo-app',
  referral_code       TEXT UNIQUE DEFAULT upper(substring(md5(random()::text), 1, 8)),
  referred_by_wallet  TEXT,
  current_tier        TEXT DEFAULT 'bronze',
  current_points      INTEGER DEFAULT 0,
  total_points_earned INTEGER DEFAULT 0,
  first_seen_at       TIMESTAMPTZ DEFAULT NOW(),
  last_active_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS so anon key can read/write freely
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- Demo test users
-- ─────────────────────────────────────────────
INSERT INTO public.users (email, password, name, wallet_address, current_tier, current_points, total_points_earned)
VALUES
  ('demo@test.com',  'password123', 'Demo User',  '0x0000000000000000000000000000000000000001', 'gold',   2450, 5000),
  ('demo2@test.com', 'password123', 'Alice Web3', '0x0000000000000000000000000000000000000002', 'silver',  800, 1200);
