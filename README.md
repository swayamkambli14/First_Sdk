# ChainLoyalty

Plug-and-play Web3 loyalty infrastructure. Send events from your SaaS app, get points, badges (NFTs), leaderboards, and referral rewards — all tied to crypto wallet identity.

```
[SaaS App] → POST /v1/events → [Rules Engine] → [Rewards Engine] → [Points/Badges/Spin Wheel]
                                                                  → [WebSocket] → [Dashboard]
```

## Prerequisites

- Node.js 20+
- Docker + Docker Compose
- MetaMask browser extension

## Setup

```bash
git clone <repo>
cp .env.example .env
# Fill in JWT_SECRET, REFERRAL_SECRET, ADMIN_SECRET, WEBHOOK_SECRET
# (generate with: openssl rand -hex 32)

docker-compose up -d          # Start PostgreSQL + Redis
npm install                   # Install all workspace deps
npm run db:migrate            # Apply Prisma schema
npm run db:seed               # Seed demo app + badges
npm run dev                   # Start API on :3000
```

Demo app (separate terminal):
```bash
cd apps/demo && npm run dev   # Starts on :5173
```

## Running Tests

```bash
# API unit tests
cd apps/api && npm test

# Smart contract tests
cd contracts && npx hardhat test
```

## Adding a New Rule

Edit `apps/api/src/config/rules.config.json` — no server restart needed (hot-reload via fs.watch):

```json
{
  "rule_id": "my_new_rule",
  "name": "My New Rule",
  "enabled": true,
  "priority": 10,
  "type": "conditional",
  "trigger_event": "purchase",
  "conditions": {
    "operator": "AND",
    "checks": [
      { "field": "metadata.amount", "op": ">", "value": 100 }
    ]
  },
  "reward": { "type": "points", "amount": 50, "reason": "Big purchase bonus" },
  "cooldown_hours": 24,
  "max_triggers_per_user": null
}
```

## Deploying Contracts to Sepolia

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network sepolia
# Copy the deployed address to .env as BADGE_NFT_CONTRACT_ADDRESS
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/v1/events` | API Key | Submit a user event |
| GET | `/v1/users/:wallet/profile` | JWT | Full user profile |
| GET | `/v1/users/:wallet/rewards` | JWT | Reward history |
| GET | `/v1/users/:wallet/badges` | JWT | Earned badges |
| GET | `/v1/users/:wallet/points` | JWT | Points balance |
| GET | `/v1/leaderboard` | None | Public leaderboard |
| POST | `/v1/auth/nonce` | None | SIWE step 1 |
| POST | `/v1/auth/verify` | None | SIWE step 2 |
| POST | `/v1/auth/logout` | JWT | Logout |
| GET | `/v1/referrals/:wallet` | JWT | Referral stats |
| POST | `/v1/apps/register` | None | Register new app |
| GET | `/v1/admin/rules` | Admin | List rules |
| POST | `/v1/admin/rules/reload` | Admin | Hot-reload rules |
| POST | `/v1/admin/rules/test` | Admin | Test a rule |

## Known Limitations

- Leaderboard period filtering (weekly/monthly) uses total_points_earned, not period-scoped points
- WebSocket auth uses basic JWT decode (not full verification) — suitable for demo
- On-chain minting requires BLOCKCHAIN_MINTING_ENABLED=true and a funded Sepolia wallet
