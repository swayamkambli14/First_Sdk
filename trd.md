# ChainLoyalty — Technical Requirements Document (TRD)

**Version:** 1.0  
**Last Updated:** April 2026  
**Document Type:** Technical Requirements Document  
**Classification:** Internal Engineering Reference  

---

## Table of Contents

1. [Technical Overview](#1-technical-overview)
2. [System Architecture — Full Diagram](#2-system-architecture--full-diagram)
3. [Backend Architecture — Layer by Layer](#3-backend-architecture--layer-by-layer)
4. [Component Communication Map](#4-component-communication-map)
5. [Security Architecture — How Everything Is Tied Together](#5-security-architecture--how-everything-is-tied-together)
6. [Event Ingestion API — Technical Specification](#6-event-ingestion-api--technical-specification)
7. [Rules Engine — Deep Technical Design](#7-rules-engine--deep-technical-design)
8. [Rewards Engine — Technical Specification](#8-rewards-engine--technical-specification)
9. [Wallet Integration — Technical Specification](#9-wallet-integration--technical-specification)
10. [Referral System — Technical Specification](#10-referral-system--technical-specification)
11. [Embeddable UI Components — Technical Specification](#11-embeddable-ui-components--technical-specification)
12. [Database Schema — Complete Design](#12-database-schema--complete-design)
13. [Exact Workflow — End to End](#13-exact-workflow--end-to-end)
14. [Backend Build Steps — How to Build It](#14-backend-build-steps--how-to-build-it)
15. [Inter-Service Communication Protocols](#15-inter-service-communication-protocols)
16. [Error Handling Strategy](#16-error-handling-strategy)
17. [Environment Configuration](#17-environment-configuration)

---

## 1. Technical Overview

ChainLoyalty is built as a **modular monolith** for the initial version — all services live in the same codebase and Node.js process but are organized into clearly separated modules. This gives you the development speed of a monolith with the architectural discipline of microservices. Each module can be extracted into its own service later without restructuring logic.

### Core Technology Choices and Why

| Technology | Role | Reason |
|---|---|---|
| Node.js 20 LTS + TypeScript | Runtime + Language | Async-first, huge Web3 ecosystem, type safety |
| Fastify (not Express) | HTTP Server | 3x faster than Express, built-in schema validation, plugin architecture |
| PostgreSQL 15 | Primary Database | ACID compliance, JSONB for flexible metadata, strong indexing |
| Redis 7 | Cache + Message Queue | Sub-millisecond reads, BullMQ job queue support |
| BullMQ | Job Queue | Built on Redis, retries, priority queues, rate limiting per queue |
| ethers.js v6 | Blockchain Library | Industry standard, supports Sepolia, wallet signature verification |
| Hardhat | Smart Contract Dev | Local testnet, deployment scripts, contract testing |
| Prisma ORM | Database Access | Type-safe queries, migration management, great PostgreSQL support |
| Zod | Schema Validation | Runtime type validation for all API inputs, integrates with Fastify |
| JWT + SIWE | Authentication | Wallet-native auth with session tokens |
| Winston | Logging | Structured JSON logs, log levels, transport support |
| Prometheus + Grafana | Metrics & Monitoring | Industry standard observability stack |

---

## 2. System Architecture — Full Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL WORLD                                │
│                                                                       │
│   ┌──────────────────┐          ┌──────────────────────────────┐    │
│   │  SaaS Application │          │  End User Browser            │    │
│   │  (Integrating App)│          │  (MetaMask / WalletConnect)  │    │
│   └────────┬─────────┘          └──────────────┬───────────────┘    │
│            │ REST API calls                     │ HTTPS + WebSocket   │
└────────────┼───────────────────────────────────┼─────────────────────┘
             │                                   │
             ▼                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY LAYER                            │
│                                                                       │
│   ┌───────────────────────────────────────────────────────────┐     │
│   │  Nginx (Reverse Proxy + SSL Termination + Rate Limiting)   │     │
│   └───────────────────────────┬───────────────────────────────┘     │
│                               │                                       │
│   ┌───────────────────────────▼───────────────────────────────┐     │
│   │              Fastify HTTP Server (Port 3000)               │     │
│   │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │     │
│   │   │  Auth    │ │  Events  │ │  Rewards │ │  Referral  │  │     │
│   │   │  Router  │ │  Router  │ │  Router  │ │  Router    │  │     │
│   │   └──────────┘ └──────────┘ └──────────┘ └────────────┘  │     │
│   └───────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVICE LAYER                                 │
│                                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────┐  │
│  │   Auth      │  │    Event     │  │   Rules     │  │  Reward  │  │
│  │   Service   │  │    Service   │  │   Engine    │  │  Service │  │
│  └─────────────┘  └──────┬───────┘  └──────┬──────┘  └─────┬────┘  │
│                          │  pushes to       │  calls         │       │
│                          ▼  queue           ▼                ▼       │
│                   ┌──────────────┐  ┌─────────────┐  ┌──────────┐  │
│                   │  BullMQ      │  │  Rule       │  │ Referral │  │
│                   │  Job Queue   │  │  Evaluator  │  │ Service  │  │
│                   └──────────────┘  └─────────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                     │
│                                                                       │
│  ┌──────────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  PostgreSQL 15   │  │  Redis 7     │  │  Blockchain (Sepolia)  │ │
│  │  (Primary Store) │  │  (Cache +    │  │  (NFT Badges, on-chain │ │
│  │                  │  │   Queue)     │  │   reward records)      │ │
│  └──────────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Backend Architecture — Layer by Layer

The backend is organized into 5 distinct layers. Each layer only talks to the layer directly below it, never skipping layers. This is called **layered architecture** and it's the industry standard.

### Layer 1 — HTTP Layer (Fastify + Routers)
Receives HTTP requests. Does nothing except route the request to the correct controller and validate the schema of the incoming data using Zod. If the schema is invalid, it returns a 400 error immediately without touching anything below.

### Layer 2 — Controller Layer
Receives the validated request. Calls the appropriate Service. Formats the response. Does zero business logic. A controller is just a translator between HTTP and services.

### Layer 3 — Service Layer
Where all business logic lives. Services talk to each other, to repositories, and to the job queue. Services are completely unaware of HTTP — they accept plain TypeScript objects and return plain TypeScript objects.

### Layer 4 — Repository Layer
The only layer that talks to the database (via Prisma). Every database query is encapsulated in a repository method. Services never write raw SQL or call Prisma directly — they go through repositories.

### Layer 5 — Infrastructure Layer
External concerns: Redis, blockchain (ethers.js), IPFS, email/webhook dispatching. Services call infrastructure adapters using well-defined interfaces, so you can swap implementations (e.g., switch blockchain library) without changing service code.

### Folder Structure

```
/chainloyalty-api
├── /src
│   ├── /config               # Env vars, constants, rule configs
│   │   ├── env.ts
│   │   └── rules.config.json # ← THE RULES ENGINE CONFIGURATION FILE
│   ├── /plugins              # Fastify plugins (auth, cors, rate-limit)
│   ├── /routes               # HTTP route definitions
│   │   ├── auth.routes.ts
│   │   ├── events.routes.ts
│   │   ├── rewards.routes.ts
│   │   ├── referrals.routes.ts
│   │   └── leaderboard.routes.ts
│   ├── /controllers          # Request/response translation
│   ├── /services             # Business logic
│   │   ├── auth.service.ts
│   │   ├── event.service.ts
│   │   ├── rules.engine.ts   # ← CORE RULES ENGINE
│   │   ├── reward.service.ts
│   │   └── referral.service.ts
│   ├── /repositories         # All DB access
│   │   ├── user.repo.ts
│   │   ├── event.repo.ts
│   │   ├── reward.repo.ts
│   │   └── referral.repo.ts
│   ├── /workers              # BullMQ job processors
│   │   └── event.worker.ts
│   ├── /blockchain           # ethers.js + contract interactions
│   │   ├── provider.ts
│   │   └── badge-minter.ts
│   ├── /middleware           # Auth guard, API key check
│   ├── /schemas              # Zod validation schemas
│   └── /utils                # Helpers, logger, error classes
├── /prisma
│   ├── schema.prisma
│   └── migrations/
├── /contracts                # Solidity smart contracts
│   ├── BadgeNFT.sol
│   └── /scripts/deploy.ts
├── /test
└── docker-compose.yml
```

---

## 4. Component Communication Map

This defines exactly how each component talks to every other component.

```
Auth Service
  → reads/writes: UserRepository
  → reads: Redis (nonce cache)
  → writes: Redis (JWT blacklist)

Event Service
  → writes: EventRepository
  → pushes jobs: BullMQ (event-processing queue)
  → does NOT call RulesEngine directly (async via queue)

Event Worker (BullMQ consumer)
  → reads: EventRepository
  → calls: RulesEngine.evaluate(event)
  → calls: RewardService.issue(reward)
  → calls: ReferralService.process(event) if event_type == referral

Rules Engine
  → reads: rules.config.json (in-memory after startup, hot-reloaded on change)
  → reads: UserRepository (for frequency checks and tier lookups)
  → reads: EventRepository (for frequency/history checks)
  → returns: RewardInstruction[] to whoever called it (Event Worker)
  → does NOT write to DB directly

Reward Service
  → writes: RewardRepository
  → writes: UserRepository (update points balance, tier)
  → calls: BlockchainService.mintBadge() for NFT badges
  → publishes: WebhookService.dispatch() after reward issued

Referral Service
  → reads/writes: ReferralRepository
  → calls: RewardService.issue() for both referrer and referee
  → reads: UserRepository (fraud checks)

Leaderboard
  → reads: Redis (cached leaderboard, refreshed every 60s)
  → refreshes from: UserRepository on cache miss
```

---

## 5. Security Architecture — How Everything Is Tied Together

Security is not a feature — it's a property of the entire system. Here is how every layer is secured and how the components trust each other.

### 5.1 Two Types of API Callers

**Type A — SaaS App (Server-to-Server):** Uses a long-lived API key (`Bearer sk_live_...`). This key is tied to an `app_id` in the database. Every event submitted with this key is automatically scoped to that `app_id`. An app cannot read or write another app's data.

**Type B — End User (Browser):** Uses a short-lived JWT obtained after wallet authentication (SIWE flow). The JWT contains `wallet_address` and `app_id`. Every user-facing request is verified against this JWT.

### 5.2 Trust Boundary Map

```
Internet
  → Nginx: SSL/TLS termination, IP rate limiting (10 req/s per IP), request size limit (1MB)
  → Fastify: API key validation OR JWT validation on every route (middleware)
  → Controllers: no trust — everything already validated
  → Services: trust only typed TypeScript objects, never raw strings from outside
  → Repositories: use Prisma parameterized queries always (no SQL injection possible)
  → Blockchain: verify signature server-side before any auth action
```

### 5.3 API Key Security

- Keys are generated as `crypto.randomBytes(32).toString('hex')` — 256-bit entropy
- Stored in the database as a **bcrypt hash** (you never store the raw key)
- The raw key is shown to the developer only once at creation
- On each request, the incoming key is compared using `bcrypt.compare()` — timing-safe
- Keys can be revoked (soft-deleted in DB), rotation is supported

### 5.4 JWT Security

- Signed with `HS256` using a `JWT_SECRET` loaded from environment variables
- Payload: `{ wallet_address, app_id, iat, exp }` — nothing sensitive
- Expiry: 24 hours (configurable)
- Stored in `httpOnly` cookie on browser (not localStorage) to prevent XSS theft
- Revocation via Redis blacklist on logout (JWT ID stored in Redis with TTL = remaining expiry)

### 5.5 Wallet Signature Verification (SIWE — Complete Flow)

```
1. Client → POST /auth/nonce { wallet_address }
   Server: generates nonce = crypto.randomUUID()
   Server: stores nonce in Redis with key `nonce:{wallet_address}` TTL=5min
   Server: returns { nonce, message: "Sign this to login to ChainLoyalty: {nonce}" }

2. Client: user signs the message with MetaMask
   MetaMask: produces a 65-byte signature (ECDSA over keccak256 of message)

3. Client → POST /auth/verify { wallet_address, signature }
   Server: fetches nonce from Redis — if missing, reject (expired or already used)
   Server: ethers.verifyMessage(message, signature) → recoveredAddress
   Server: if recoveredAddress.toLowerCase() !== wallet_address.toLowerCase() → reject
   Server: DELETE nonce from Redis (one-time use, prevents replay attacks)
   Server: issue JWT → return in httpOnly cookie

Key security properties:
  - Nonce is single-use (deleted after verify)
  - Nonce expires in 5 minutes (TTL)
  - Signature verification is cryptographic — cannot be faked
  - Server never sees or stores the private key
```

### 5.6 Inter-Service Security (Inside the Monolith)

All services communicate via direct TypeScript function calls — no HTTP between them. This means there is no network attack surface between services. When we move to microservices, services will communicate via authenticated message queues (not open HTTP).

### 5.7 Database Security

- Prisma uses parameterized queries exclusively — SQL injection is structurally impossible
- Database user has minimum permissions (no DDL access in production)
- Sensitive fields (API key hashes) are never returned in Prisma query results (using Prisma `omit`)
- All database connections use SSL in production

---

## 6. Event Ingestion API — Technical Specification

### 6.1 Endpoint

```
POST /v1/events
Authorization: Bearer <API_KEY>
Content-Type: application/json
```

### 6.2 Request Schema (Zod)

```typescript
const EventSchema = z.object({
  wallet_address: z.string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  event_type: z.enum([
    'purchase', 'referral', 'feature_usage', 'milestone', 'subscription'
  ]),
  metadata: z.record(z.unknown()).optional().default({}),
  idempotency_key: z.string().uuid().optional(), // prevents duplicate events
  timestamp: z.string().datetime().optional().default(() => new Date().toISOString())
});
```

### 6.3 Idempotency

If the SaaS app retries a failed request, we must not process the same event twice. Solution: the caller sends an `idempotency_key` (UUID). We store this in Redis with TTL=24h. If we see the same key twice, we return the cached response immediately without re-processing.

### 6.4 Processing Pipeline

```
POST /v1/events
  │
  ├─ [Middleware] Validate API Key → get app_id
  ├─ [Middleware] Rate limit check (per API key, from Redis counter)
  ├─ [Schema] Zod validation → reject if invalid
  ├─ [Idempotency] Check Redis for duplicate key → return cached if exists
  │
  ├─ EventService.ingest(event, app_id):
  │     1. Normalize wallet_address to lowercase
  │     2. Upsert user record (create if first time seen)
  │     3. Write event to `events` table (status: 'pending')
  │     4. Push job to BullMQ queue: { event_id, priority: 'normal' }
  │     5. Return { event_id } immediately — do NOT wait for processing
  │
  └─ Response: 202 Accepted { event_id, status: "queued" }
```

### 6.5 BullMQ Event Worker

The worker runs in the same process (or separate worker thread). It picks up jobs from the queue and does the heavy processing asynchronously so the API stays fast.

```typescript
// event.worker.ts
eventQueue.process(async (job) => {
  const { event_id } = job.data;
  const event = await eventRepo.findById(event_id);

  // Step 1: Run Rules Engine
  const instructions = await rulesEngine.evaluate(event);

  // Step 2: Execute each reward instruction
  for (const instruction of instructions) {
    await rewardService.issue(instruction, event);
  }

  // Step 3: If referral event, process referral
  if (event.event_type === 'referral') {
    await referralService.process(event);
  }

  // Step 4: Mark event as processed
  await eventRepo.markProcessed(event_id);

  // Step 5: Dispatch webhook to SaaS app
  await webhookService.dispatch(event.app_id, { event_id, rewards_issued: instructions });
});
```

---

## 7. Rules Engine — Deep Technical Design

The Rules Engine is the most critical component of ChainLoyalty. It must be powerful, extensible, safe, and require zero code changes to add new rules. Here is the complete technical design.

### 7.1 Rules Configuration File

Rules live in `/src/config/rules.config.json`. This file is loaded into memory at startup and **watched for changes** using Node's `fs.watch()`. When the file changes, the engine hot-reloads without restarting.

```json
{
  "version": "1.0",
  "rules": [
    {
      "rule_id": "first_purchase_bonus",
      "name": "First Purchase Bonus",
      "description": "Award 100 points on a user's first ever purchase",
      "enabled": true,
      "priority": 10,
      "type": "threshold",
      "trigger_event": "purchase",
      "conditions": {
        "operator": "AND",
        "checks": [
          { "field": "user.lifetime_event_count.purchase", "op": "==", "value": 1 }
        ]
      },
      "reward": {
        "type": "points",
        "amount": 100,
        "reason": "First purchase reward"
      },
      "cooldown_hours": null,
      "max_triggers_per_user": 1
    },
    {
      "rule_id": "power_buyer_badge",
      "name": "Power Buyer Badge",
      "description": "Award badge when user spends over $500 total",
      "enabled": true,
      "priority": 20,
      "type": "threshold",
      "trigger_event": "purchase",
      "conditions": {
        "operator": "AND",
        "checks": [
          { "field": "user.cumulative_metadata.purchase.amount", "op": ">=", "value": 500 }
        ]
      },
      "reward": {
        "type": "badge",
        "badge_id": "power_buyer",
        "badge_name": "Power Buyer",
        "badge_image_url": "/badges/power-buyer.png",
        "rarity": "rare"
      },
      "max_triggers_per_user": 1
    },
    {
      "rule_id": "weekly_active_bonus",
      "name": "Weekly Active User",
      "description": "Award 50 points if user has 5+ events in the last 7 days",
      "enabled": true,
      "priority": 15,
      "type": "frequency",
      "trigger_event": "*",
      "conditions": {
        "operator": "AND",
        "checks": [
          { "field": "user.event_count_in_window", "window_days": 7, "op": ">=", "value": 5 }
        ]
      },
      "reward": {
        "type": "points",
        "amount": 50,
        "reason": "Weekly activity bonus"
      },
      "cooldown_hours": 168
    },
    {
      "rule_id": "high_value_conditional",
      "name": "Big Spender Bonus",
      "description": "Gold tier users get 3x points on purchases over $200",
      "enabled": true,
      "priority": 30,
      "type": "conditional",
      "trigger_event": "purchase",
      "conditions": {
        "operator": "AND",
        "checks": [
          { "field": "metadata.amount", "op": ">=", "value": 200 },
          { "field": "user.current_tier", "op": "==", "value": "gold" }
        ]
      },
      "reward": {
        "type": "points",
        "amount_formula": "metadata.amount * 3",
        "reason": "Gold tier big purchase multiplier"
      },
      "cooldown_hours": null
    },
    {
      "rule_id": "lucky_spin",
      "name": "Lucky Spin on Subscription",
      "description": "Users get a spin-wheel chance when they subscribe",
      "enabled": true,
      "priority": 5,
      "type": "conditional",
      "trigger_event": "subscription",
      "conditions": {
        "operator": "AND",
        "checks": [
          { "field": "metadata.plan", "op": "in", "value": ["pro", "enterprise"] }
        ]
      },
      "reward": {
        "type": "probabilistic",
        "spin_pool_id": "subscription_pool"
      },
      "cooldown_hours": 720
    }
  ],

  "spin_pools": {
    "subscription_pool": [
      { "reward_type": "points", "amount": 25, "weight": 50 },
      { "reward_type": "points", "amount": 100, "weight": 25 },
      { "reward_type": "points", "amount": 500, "weight": 10 },
      { "reward_type": "badge", "badge_id": "lucky_subscriber", "weight": 10 },
      { "reward_type": "points", "amount": 1000, "weight": 5 }
    ]
  },

  "tier_config": {
    "tiers": [
      { "name": "bronze", "min_points": 0, "multiplier": 1.0 },
      { "name": "silver", "min_points": 500, "multiplier": 1.25 },
      { "name": "gold", "min_points": 2000, "multiplier": 1.5 },
      { "name": "platinum", "min_points": 10000, "multiplier": 2.0 }
    ]
  }
}
```

### 7.2 Rules Engine — Core Algorithm

```typescript
// rules.engine.ts
class RulesEngine {
  private rules: Rule[] = [];
  private tierConfig: TierConfig;

  constructor() {
    this.loadRules();
    this.watchConfigFile(); // hot-reload on change
  }

  async evaluate(event: ProcessedEvent): Promise<RewardInstruction[]> {
    const user = await userRepo.findByWallet(event.wallet_address);
    const instructions: RewardInstruction[] = [];

    // Sort rules by priority (higher priority evaluated first)
    const applicableRules = this.rules
      .filter(r => r.enabled)
      .filter(r => r.trigger_event === event.event_type || r.trigger_event === '*')
      .sort((a, b) => b.priority - a.priority);

    for (const rule of applicableRules) {
      // Check cooldown — has this user triggered this rule recently?
      if (rule.cooldown_hours) {
        const lastTriggered = await rewardRepo.getLastTrigger(user.wallet_address, rule.rule_id);
        if (lastTriggered) {
          const hoursSince = (Date.now() - lastTriggered.getTime()) / 3_600_000;
          if (hoursSince < rule.cooldown_hours) continue; // skip, in cooldown
        }
      }

      // Check max_triggers_per_user
      if (rule.max_triggers_per_user !== null) {
        const triggerCount = await rewardRepo.countTriggers(user.wallet_address, rule.rule_id);
        if (triggerCount >= rule.max_triggers_per_user) continue; // already maxed out
      }

      // Evaluate conditions
      const context = await this.buildContext(event, user);
      const matched = this.evaluateConditions(rule.conditions, context);

      if (matched) {
        const instruction = this.buildRewardInstruction(rule, context);
        instructions.push(instruction);
      }
    }

    return instructions;
  }

  private async buildContext(event: ProcessedEvent, user: User): Promise<EvalContext> {
    // Build a flat context object with all fields a rule might need
    return {
      event_type: event.event_type,
      metadata: event.metadata,
      user: {
        wallet_address: user.wallet_address,
        current_tier: user.current_tier,
        total_points: user.total_points_earned,
        current_points: user.current_points_balance,
        lifetime_event_count: await eventRepo.countByType(user.wallet_address),
        event_count_in_window: await eventRepo.countInWindow(user.wallet_address, 7),
        cumulative_metadata: await eventRepo.getCumulativeMetadata(user.wallet_address),
      }
    };
  }

  private evaluateConditions(conditions: ConditionGroup, ctx: EvalContext): boolean {
    const results = conditions.checks.map(check => this.evaluateSingleCheck(check, ctx));
    return conditions.operator === 'AND'
      ? results.every(Boolean)
      : results.some(Boolean);
  }

  private evaluateSingleCheck(check: Condition, ctx: EvalContext): boolean {
    const value = this.resolvePath(check.field, ctx); // dot-notation path resolver
    switch (check.op) {
      case '==': return value === check.value;
      case '!=': return value !== check.value;
      case '>':  return Number(value) > Number(check.value);
      case '>=': return Number(value) >= Number(check.value);
      case '<':  return Number(value) < Number(check.value);
      case '<=': return Number(value) <= Number(check.value);
      case 'in': return Array.isArray(check.value) && check.value.includes(value);
      case 'contains': return String(value).includes(String(check.value));
      default: return false;
    }
  }

  private buildRewardInstruction(rule: Rule, ctx: EvalContext): RewardInstruction {
    const reward = { ...rule.reward };
    if (reward.amount_formula) {
      // Safe formula evaluator — resolves expressions like "metadata.amount * 3"
      reward.amount = this.evaluateFormula(reward.amount_formula, ctx);
    }
    // Apply tier multiplier for points
    if (reward.type === 'points') {
      const multiplier = this.getTierMultiplier(ctx.user.current_tier);
      reward.amount = Math.floor(reward.amount * multiplier);
    }
    return { rule_id: rule.rule_id, ...reward };
  }
}
```

### 7.3 Tier Recalculation

After every reward is issued, the system recalculates the user's tier:

```typescript
async function recalculateTier(wallet_address: string): Promise<void> {
  const user = await userRepo.findByWallet(wallet_address);
  const tiers = rulesEngine.getTierConfig(); // sorted ascending by min_points
  let newTier = 'bronze';
  for (const tier of tiers) {
    if (user.total_points_earned >= tier.min_points) newTier = tier.name;
  }
  if (newTier !== user.current_tier) {
    await userRepo.updateTier(wallet_address, newTier);
    // Issue a tier upgrade badge
    await rewardService.issue({ type: 'badge', badge_id: `tier_${newTier}` });
  }
}
```

---

## 8. Rewards Engine — Technical Specification

### 8.1 Points Issuance

```typescript
async function issuePoints(wallet: string, amount: number, reason: string, eventId: string, ruleId: string) {
  await db.$transaction(async (tx) => {
    // Atomic: increment balance + write history in one DB transaction
    await tx.user.update({ where: { wallet_address: wallet },
      data: {
        current_points_balance: { increment: amount },
        total_points_earned: { increment: amount }
      }
    });
    await tx.reward.create({ data: { wallet_address: wallet, reward_type: 'points',
        reward_value: amount, event_id: eventId, rule_id: ruleId, reason } });
  });
  await recalculateTier(wallet); // check if tier should change
}
```

### 8.2 Badge Issuance

Badges are idempotent — a wallet can only hold each badge once.

```typescript
async function issueBadge(wallet: string, badgeId: string, eventId: string, ruleId: string) {
  const existing = await rewardRepo.findBadge(wallet, badgeId);
  if (existing) return; // already has badge, do nothing

  await rewardRepo.createBadgeRecord(wallet, badgeId, eventId, ruleId);

  // Async: mint on-chain if blockchain minting is enabled
  if (config.BLOCKCHAIN_MINTING_ENABLED) {
    badgeMinterQueue.add({ wallet, badgeId }); // separate queue, non-blocking
  }
}
```

### 8.3 Probabilistic Reward (Spin Wheel)

```typescript
function spinWheel(poolId: string): SpinResult {
  const pool = rulesConfig.spin_pools[poolId];
  const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of pool) {
    random -= item.weight;
    if (random <= 0) return item; // winner
  }
  return pool[pool.length - 1]; // fallback
}
```

---

## 9. Wallet Integration — Technical Specification

### 9.1 Frontend Wallet Connection (wagmi + RainbowKit)

```typescript
// In the React frontend
import { useSignMessage, useAccount } from 'wagmi';

async function login() {
  const { address } = useAccount();
  // 1. Get nonce from backend
  const { nonce, message } = await api.post('/auth/nonce', { wallet_address: address });
  // 2. Sign message
  const signature = await signMessageAsync({ message });
  // 3. Verify and get JWT (set as httpOnly cookie by server)
  await api.post('/auth/verify', { wallet_address: address, signature });
}
```

### 9.2 Backend Signature Verification

```typescript
import { ethers } from 'ethers';

async function verifySignature(wallet: string, message: string, signature: string): Promise<boolean> {
  try {
    const recovered = ethers.verifyMessage(message, signature);
    return recovered.toLowerCase() === wallet.toLowerCase();
  } catch {
    return false; // invalid signature format
  }
}
```

---

## 10. Referral System — Technical Specification

### 10.1 Referral Code Generation

Each wallet gets a deterministic but unique referral code:

```typescript
function generateReferralCode(wallet_address: string): string {
  const hash = crypto.createHash('sha256').update(wallet_address + REFERRAL_SECRET).digest('hex');
  return 'REF-' + hash.substring(0, 8).toUpperCase(); // e.g., REF-A1B2C3D4
}
```

### 10.2 Fraud Detection Checks

Before confirming a referral, the system runs these checks in sequence:

```
Check 1: Self-referral — referrer_wallet === referee_wallet → REJECT
Check 2: Already referred — referee_wallet already has a confirmed referral → REJECT  
Check 3: Circular referral — if referee has ever referred the referrer → REJECT
Check 4: Same qualifying event — was the qualifying event already used for another referral? → REJECT
Check 5: Rate limit — has this referrer generated > 50 referral codes in 24h? → REVIEW FLAG
```

### 10.3 Referral Reward Flow

```
Qualifying event arrives (e.g., referee makes first purchase)
  │
  ├─ Look up referral record by referee_wallet
  ├─ Validate referral (all fraud checks pass)
  ├─ Mark referral status = 'confirmed'
  ├─ Issue reward to REFEREE (e.g., 50 points "Welcome bonus")
  └─ Issue reward to REFERRER (e.g., 100 points "Referral credit")
      Both rewards tied to the same referral_id in the reward table
```

---

## 11. Embeddable UI Components — Technical Specification

### 11.1 Package Structure

```
/packages/chainloyalty-react
├── src/
│   ├── components/
│   │   ├── RewardsDashboard.tsx
│   │   └── Leaderboard.tsx
│   ├── hooks/
│   │   ├── useRewards.ts
│   │   └── useLeaderboard.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

### 11.2 Component API Surface

```typescript
// RewardsDashboard props
interface RewardsDashboardProps {
  appId: string;
  walletAddress: string;
  theme?: {
    primaryColor?: string;
    borderRadius?: string;
    fontFamily?: string;
  };
  onRewardEarned?: (reward: Reward) => void; // callback hook
}

// Leaderboard props
interface LeaderboardProps {
  appId: string;
  limit?: number; // default 10
  period?: 'all_time' | 'monthly' | 'weekly'; // default 'all_time'
  showCurrentUser?: boolean; // highlight the connected wallet's rank
}
```

### 11.3 Real-time Updates via WebSocket

When a user earns a reward, the dashboard should update in real-time without a page refresh. Implementation: the backend emits a WebSocket event to the user's socket room when a reward is issued.

```typescript
// Server-side (using socket.io)
io.to(`wallet:${wallet_address}`).emit('reward_earned', { reward });

// Client-side (inside RewardsDashboard component)
useEffect(() => {
  socket.on('reward_earned', (data) => {
    setRewards(prev => [data.reward, ...prev]);
    toast(`You earned ${data.reward.amount} points!`);
  });
}, []);
```

---

## 12. Database Schema — Complete Design

```sql
-- Users (wallet-native identity)
CREATE TABLE users (
  wallet_address        VARCHAR(42) PRIMARY KEY,
  app_id               UUID NOT NULL REFERENCES apps(id),
  referral_code        VARCHAR(20) UNIQUE NOT NULL,
  referred_by_wallet   VARCHAR(42) REFERENCES users(wallet_address),
  current_tier         VARCHAR(20) NOT NULL DEFAULT 'bronze',
  current_points_balance BIGINT NOT NULL DEFAULT 0,
  total_points_earned  BIGINT NOT NULL DEFAULT 0,
  first_seen_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Apps (SaaS companies using ChainLoyalty)
CREATE TABLE apps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) NOT NULL,
  api_key_hash    VARCHAR(255) NOT NULL UNIQUE,
  webhook_url     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE
);

-- Events (raw event log — append-only)
CREATE TABLE events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address  VARCHAR(42) NOT NULL REFERENCES users(wallet_address),
  app_id          UUID NOT NULL REFERENCES apps(id),
  event_type      VARCHAR(50) NOT NULL,
  metadata        JSONB NOT NULL DEFAULT '{}',
  idempotency_key UUID UNIQUE,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',
  processed_at    TIMESTAMPTZ,
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_events_wallet ON events(wallet_address);
CREATE INDEX idx_events_type_wallet ON events(event_type, wallet_address);
CREATE INDEX idx_events_timestamp ON events(timestamp);

-- Rewards (all rewards ever issued)
CREATE TABLE rewards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address  VARCHAR(42) NOT NULL REFERENCES users(wallet_address),
  reward_type     VARCHAR(20) NOT NULL CHECK (reward_type IN ('points', 'badge', 'probabilistic')),
  reward_value    JSONB NOT NULL,
  rule_id         VARCHAR(100) NOT NULL,
  event_id        UUID REFERENCES events(id),
  reason          TEXT,
  on_chain_tx_hash VARCHAR(66),
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_rewards_wallet ON rewards(wallet_address);

-- Rule Trigger Log (for cooldown and max_triggers tracking)
CREATE TABLE rule_triggers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address  VARCHAR(42) NOT NULL,
  rule_id         VARCHAR(100) NOT NULL,
  triggered_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reward_id       UUID REFERENCES rewards(id)
);
CREATE INDEX idx_rule_triggers_wallet_rule ON rule_triggers(wallet_address, rule_id);

-- Referrals
CREATE TABLE referrals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_wallet VARCHAR(42) NOT NULL REFERENCES users(wallet_address),
  referee_wallet  VARCHAR(42) NOT NULL UNIQUE REFERENCES users(wallet_address),
  referral_code   VARCHAR(20) NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',
  qualifying_event_id UUID REFERENCES events(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at    TIMESTAMPTZ
);

-- Badges Master List
CREATE TABLE badge_definitions (
  badge_id        VARCHAR(100) PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  image_url       TEXT,
  rarity          VARCHAR(20) DEFAULT 'common',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 13. Exact Workflow — End to End

### Full Journey: New User Makes First Purchase via a SaaS App

```
T=0ms  SaaS App backend calls:
       POST /v1/events
       { wallet_address: "0xABC...", event_type: "purchase",
         metadata: { amount: 75, currency: "USD" }, idempotency_key: "uuid-1" }
       Authorization: Bearer sk_live_XXXX

T=1ms  Nginx: passes through (rate limit ok, SSL valid)

T=2ms  Fastify middleware:
       - Validates Bearer token → finds app_id = "app-123" in DB
       - Zod validates schema → passes
       - Idempotency check → not seen before, continues

T=4ms  EventService.ingest():
       - Normalizes wallet to lowercase
       - Upserts user record (first time → creates new user with referral code)
       - Writes event to DB: id="evt-456", status="pending"
       - Pushes job to BullMQ: { event_id: "evt-456" }

T=5ms  API returns: 202 { event_id: "evt-456", status: "queued" }
       (SaaS App gets response immediately — it's done)

T=6ms  BullMQ Worker picks up job:
       - Loads event "evt-456" from DB
       - Calls RulesEngine.evaluate(event)

T=7ms  RulesEngine:
       - Filters rules for event_type = "purchase"
       - Finds: [first_purchase_bonus, power_buyer_badge, big_spender_conditional]
       - Builds context: { metadata.amount: 75, user.lifetime_event_count.purchase: 1, user.current_tier: "bronze" }

       Rule "first_purchase_bonus":
         Check: user.lifetime_event_count.purchase == 1 → TRUE
         max_triggers = 1, current = 0 → OK
         → MATCH → issue 100 points

       Rule "power_buyer_badge":
         Check: user.cumulative_metadata.purchase.amount >= 500 → 75 < 500 → FALSE
         → NO MATCH

       Rule "high_value_conditional":
         Check: metadata.amount >= 200 → 75 < 200 → FALSE
         → NO MATCH

       Returns: [{ type: "points", amount: 100, reason: "First purchase reward", rule_id: "first_purchase_bonus" }]

T=9ms  RewardService.issue():
       - DB transaction: user.current_points_balance += 100, user.total_points_earned += 100
       - Insert into rewards table
       - Insert into rule_triggers table
       - recalculateTier(): 100 points < 500 (silver threshold) → stays "bronze"

T=11ms Event marked as processed in DB

T=12ms WebhookService dispatches POST to SaaS app's webhook_url:
       { event_id: "evt-456", rewards: [{ type: "points", amount: 100 }] }

T=12ms WebSocket emits to wallet room:
       io.to("wallet:0xabc...").emit("reward_earned", { type: "points", amount: 100 })

T=13ms RewardsDashboard React component in user's browser:
       - Receives WebSocket event
       - Updates points display: 0 → 100
       - Shows toast: "You earned 100 points!"
```

---

## 14. Backend Build Steps — How to Build It

### Phase 1 — Foundation (Days 1–2)

**Step 1: Project Initialization**
```bash
mkdir chainloyalty-api && cd chainloyalty-api
npm init -y
npm install fastify @fastify/cors @fastify/jwt @fastify/cookie @fastify/rate-limit
npm install prisma @prisma/client zod bullmq ioredis ethers winston
npm install -D typescript @types/node ts-node nodemon
npx tsc --init
npx prisma init
```

**Step 2: Docker Compose Setup**
Create `docker-compose.yml` with PostgreSQL 15 and Redis 7 services. Run `docker-compose up -d`. This gives you local databases immediately.

**Step 3: Prisma Schema**
Define all tables in `prisma/schema.prisma` based on the schema in Section 12. Run `npx prisma migrate dev --name init` to create the database.

**Step 4: Fastify Server Bootstrap**
Set up the main Fastify instance in `src/server.ts`. Register plugins: CORS, cookie, JWT, rate-limiter. Create a health check route `GET /health`. Confirm the server starts and returns 200.

**Step 5: Environment Configuration**
Create `.env` with all required variables: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `REFERRAL_SECRET`, `BLOCKCHAIN_RPC_URL`, `PRIVATE_KEY` (for contract calls). Use a library like `envalid` to validate env vars at startup and fail fast if anything is missing.

---

### Phase 2 — Auth & Wallet (Day 2–3)

**Step 6: Auth Routes**
Build `POST /auth/nonce` and `POST /auth/verify`. Implement the full SIWE flow from Section 5.5. Write the Redis nonce store and the `ethers.verifyMessage` check.

**Step 7: Auth Middleware**
Build two Fastify preHandler hooks: one for `API_KEY` auth (for SaaS apps), one for `JWT` auth (for end users). Apply the correct one to each route group.

---

### Phase 3 — Event Pipeline (Day 3–4)

**Step 8: Event Route + Controller**
Build `POST /v1/events`. Wire Zod schema validation. Implement idempotency key check with Redis.

**Step 9: Event Service + Repository**
Implement `EventService.ingest()` and `EventRepository` methods: `create`, `findById`, `markProcessed`, `countByType`, `countInWindow`, `getCumulativeMetadata`.

**Step 10: BullMQ Setup**
Create the event queue and worker. Configure retry logic: 3 retries with exponential backoff. Add a dead-letter queue for events that fail all retries.

---

### Phase 4 — Rules Engine (Day 4–5)

**Step 11: Rules Config**
Create `rules.config.json` with at least 5 sample rules covering all 3 rule types. Write the config loader with `fs.watch()` hot-reload.

**Step 12: Rules Engine Core**
Implement `RulesEngine` class: `evaluate()`, `buildContext()`, `evaluateConditions()`, `evaluateSingleCheck()`, `buildRewardInstruction()`. This is the hardest step — test each operator and formula carefully.

**Step 13: Tier System**
Implement `recalculateTier()`. Test that tier promotions trigger correctly after points are issued.

---

### Phase 5 — Rewards Engine (Day 5–6)

**Step 14: Reward Service**
Implement `issuePoints()`, `issueBadge()`, `spinWheel()`. All writes must be inside DB transactions.

**Step 15: Reward Repository**
Implement `createPointsReward`, `createBadgeReward`, `findBadge` (for idempotency), `countTriggers`, `getLastTrigger`.

---

### Phase 6 — Referral System (Day 6)**

**Step 16: Referral Service**
Implement referral code generation, `process()` method with all fraud checks, and reward issuance for both parties.

---

### Phase 7 — APIs + Leaderboard (Day 7)

**Step 17: Remaining REST Routes**
Build `GET /v1/users/:wallet/rewards`, `GET /v1/users/:wallet/points`, `GET /v1/users/:wallet/badges`, `GET /v1/referrals/:wallet`, `GET /v1/leaderboard`.

**Step 18: Leaderboard Caching**
Leaderboard queries are expensive. Cache the result in Redis with key `leaderboard:all_time` with 60-second TTL. On cache miss, query DB, store in Redis, return result.

---

### Phase 8 — Blockchain (Day 7–8)

**Step 19: Smart Contract**
Write `BadgeNFT.sol` — a simple ERC-1155 contract with an `onlyMinter` access control role. Deploy to Sepolia using Hardhat. Store the contract address in `.env`.

**Step 20: Badge Minter Service**
Implement `BlockchainService.mintBadge()` using ethers.js. This runs in a separate BullMQ queue (the `badge-minting` queue) so it never blocks the main event pipeline.

---

### Phase 9 — Webhooks & WebSockets (Day 8)

**Step 21: Webhook Dispatcher**
After every reward, HTTP POST to the SaaS app's configured `webhook_url` with reward details. Add HMAC-SHA256 signature header so the SaaS app can verify the webhook is genuine.

**Step 22: WebSocket Server**
Integrate socket.io with Fastify. On JWT auth, join the user to room `wallet:{address}`. Emit `reward_earned` events from RewardService.

---

### Phase 10 — Frontend & Polish (Day 8–9)

**Step 23: React Components**
Build `RewardsDashboard` and `Leaderboard` components. Add wagmi + RainbowKit for wallet connection. Wire up WebSocket listener for real-time updates.

**Step 24: Demo App**
Build the mock SaaS app. Wire all 5 event types to buttons in the UI. Embed the RewardsDashboard and Leaderboard components.

---

## 15. Inter-Service Communication Protocols

| From | To | Protocol | Why |
|---|---|---|---|
| HTTP Router | Service Layer | Direct TypeScript call | Same process, no overhead |
| Event Service | BullMQ | Redis queue push | Async, decoupled, retryable |
| BullMQ Worker | Rules Engine | Direct call | Same process |
| Reward Service | Blockchain Service | BullMQ (separate queue) | Slow, async, retriable |
| Reward Service | WebSocket | socket.io emit | Real-time push to browser |
| Backend | SaaS App Webhook | HTTPS POST (outbound) | Notify SaaS of reward issued |
| Frontend → Backend | REST + WebSocket | HTTPS + WSS | Standard web protocols |

---

## 16. Error Handling Strategy

Every layer has a defined error contract. Errors bubble up as typed TypeScript classes, not raw strings.

```typescript
// Custom error classes
class ValidationError extends AppError { statusCode = 400 }
class AuthenticationError extends AppError { statusCode = 401 }
class ForbiddenError extends AppError { statusCode = 403 }
class NotFoundError extends AppError { statusCode = 404 }
class ConflictError extends AppError { statusCode = 409 }
class RateLimitError extends AppError { statusCode = 429 }
class InternalError extends AppError { statusCode = 500 }
```

Fastify's global error handler catches all thrown errors and formats them into a consistent JSON response:
```json
{ "error": "ValidationError", "message": "Invalid wallet address format", "statusCode": 400 }
```

BullMQ job failures are caught, logged with full context (event_id, error stack), and retried up to 3 times. After 3 failures, the event moves to a dead-letter queue and an alert is raised.

---

## 17. Environment Configuration

```env
# Server
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/chainloyalty

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=<256-bit-random-string>
JWT_EXPIRY_HOURS=24
REFERRAL_SECRET=<256-bit-random-string>

# Blockchain
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/<YOUR_KEY>
DEPLOYER_PRIVATE_KEY=<wallet-private-key-for-minting>
BADGE_NFT_CONTRACT_ADDRESS=<deployed-contract-address>
BLOCKCHAIN_MINTING_ENABLED=true

# Rate Limiting
RATE_LIMIT_EVENTS_PER_MIN=1000
RATE_LIMIT_AUTH_PER_MIN=20

# Webhooks
WEBHOOK_SECRET=<hmac-signing-secret>
WEBHOOK_TIMEOUT_MS=5000

# Rules
RULES_CONFIG_PATH=./src/config/rules.config.json
```

All environment variables are validated at startup using `envalid`. The server refuses to start if any required variable is missing or malformed. This prevents silent misconfigurations in production.

---

*This document defines the complete technical blueprint for ChainLoyalty. Every component is specified with exact code patterns, data flows, security properties, and build steps. The Rules Engine is designed to be the strongest part of the system — configurable without code changes, hot-reloadable, fraud-resistant, and expressive enough to model any loyalty program logic.*