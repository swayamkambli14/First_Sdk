# ChainLoyalty — Product Requirements Document (PRD)

**Version:** 1.0  
**Last Updated:** April 2026  
**Document Type:** Product Requirements Document  
**Project Codename:** ChainLoyalty — PS4 Blockchain  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [System Architecture Overview](#4-system-architecture-overview)
5. [Component 1 — Event Ingestion API](#5-component-1--event-ingestion-api)
6. [Component 2 — Configurable Rules Engine](#6-component-2--configurable-rules-engine)
7. [Component 3 — Rewards Engine](#7-component-3--rewards-engine)
8. [Component 4 — Wallet Integration](#8-component-4--wallet-integration)
9. [Component 5 — Referral System](#9-component-5--referral-system)
10. [Component 6 — Embeddable UI Components](#10-component-6--embeddable-ui-components)
11. [Component 7 — Demo SaaS Application](#11-component-7--demo-saas-application)
12. [Bonus Features](#12-bonus-features)
13. [Tech Stack Recommendations](#13-tech-stack-recommendations)
14. [Data Models](#14-data-models)
15. [API Reference Summary](#15-api-reference-summary)
16. [Security Considerations](#16-security-considerations)
17. [Out of Scope](#17-out-of-scope)

---

## 1. Executive Summary

ChainLoyalty is a **plug-and-play Web3 loyalty infrastructure platform**. Think of it as the "Stripe for blockchain-based loyalty programs." Just like how Stripe made it simple to accept payments without building your own payment processing system, ChainLoyalty makes it simple for any software company (SaaS) to give their users blockchain-based rewards — without needing any blockchain engineers on their team.

The platform sits in the middle. On one side, SaaS companies send events like "user made a purchase" or "user referred a friend." On the other side, ChainLoyalty automatically decides what rewards to give, tracks them on/off blockchain, manages user wallets, and even provides ready-made UI components the company can drop into their app.

The end user (the customer of the SaaS) gets a rich loyalty experience — points, badges (NFTs), leaderboards, referral bonuses — all tied to their crypto wallet identity. The SaaS company gets all of this by just calling a simple API. No Solidity. No blockchain expertise needed.

---

## 2. Problem Statement

### 2.1 Why Does This Problem Exist?

Traditional loyalty programs (like airline miles or coffee shop stamps) are built on old centralized systems. They have three big problems:

- **Siloed:** Your Starbucks points can't be used at McDonald's. Rewards are trapped inside one company.
- **Opaque:** Users have to trust the company to honor their points. There's no way to verify anything.
- **Not portable:** When you stop using an app, your rewards are gone forever.

Web3 (blockchain technology) solves all three problems. Rewards can live in your wallet, move across apps, and be verified by anyone on a public blockchain. However, building Web3 loyalty is extremely hard:

- You need to write **Solidity** (the programming language for smart contracts), which is complex and risky
- You need to handle **crypto wallets**, which are confusing for most users
- You need to connect **on-chain** (blockchain) and **off-chain** (normal database) systems together
- One mistake in a smart contract can mean losing real money

### 2.2 Who Is This For?

**Primary Users (Builders):** SaaS companies / developers who want to add loyalty features to their apps. They call ChainLoyalty's API.

**End Users (Consumers):** The actual customers of those SaaS companies. They interact with the rewards dashboard, connect their wallet, and earn rewards.

**Platform Admins:** The team managing ChainLoyalty itself — configuring rules, monitoring the system, and supporting integrating companies.

---

## 3. Goals & Success Metrics

### 3.1 Primary Goals

- Build a fully functional loyalty infrastructure that any developer can integrate in under a day
- Abstract away all blockchain complexity behind clean API endpoints
- Support real wallet-based identity (not email logins)
- Make reward rules fully configurable without code changes
- Provide embeddable UI so integrating companies don't need to build any frontend

### 3.2 What "Done" Looks Like (for the hackathon demo)

- A developer can register their app, get an API key, and send their first event in under 10 minutes
- A user can connect MetaMask, earn points for actions, get a badge, use a referral link, and see everything on a dashboard
- A judge can add a new rule through config (not code) and see it work immediately
- The demo SaaS app shows the full journey end-to-end: signup → action → reward → leaderboard

---

## 4. System Architecture Overview

ChainLoyalty is made up of 7 separate pieces that work together. Here's a simple mental model:

```
[SaaS App] 
    |
    | (sends events via API)
    v
[Event Ingestion API]  ← entry point for all activity
    |
    v
[Rules Engine]  ← decides what reward to give
    |
    v
[Rewards Engine]  ← actually gives the reward
    |
    +--→ [Points DB]
    +--→ [Badge/NFT Minter]
    +--→ [Probabilistic Reward Handler]
    |
[Referral System]  ← tracks who referred who
    |
[Wallet Integration Layer]  ← all identity tied to wallet
    |
[Embeddable UI Components]  ← frontend widgets for the end user
```

The system can be deployed as a single monolith (for the hackathon) or as microservices. A PostgreSQL or MongoDB database stores off-chain data. On-chain data lives on a blockchain testnet (like Sepolia).

---

## 5. Component 1 — Event Ingestion API

### 5.1 What It Is

This is the front door of the entire platform. When something happens in a SaaS app — a user buys something, signs up, uses a feature — the SaaS app sends that information to ChainLoyalty through this API. This is the only thing the integrating developer ever needs to call.

### 5.2 What It Needs to Do

- Accept HTTP POST requests (REST API) with event data
- Validate the incoming data (make sure the wallet address is valid, the event type is known, etc.)
- Handle at least **5 different types of events** simultaneously
- Queue events if there's high traffic so nothing gets lost
- Return a confirmation response quickly (should not make the SaaS app wait)

### 5.3 The 5 Required Event Types

| Event Type | Meaning | Example Metadata |
|---|---|---|
| `purchase` | User bought something | `{ amount: 49.99, currency: "USD" }` |
| `referral` | User referred someone | `{ referral_code: "ABC123", referee_wallet: "0x..." }` |
| `feature_usage` | User used a specific feature | `{ feature_name: "export", count: 1 }` |
| `milestone` | User hit a defined goal | `{ milestone_name: "first_project_created" }` |
| `subscription` | User subscribed or upgraded | `{ plan: "pro", billing_cycle: "monthly" }` |

### 5.4 Request Format

Every event sent to ChainLoyalty must include:
- `wallet_address` — the user's Ethereum wallet address (this is their identity)
- `event_type` — one of the 5 types above
- `app_id` — the API key of the SaaS company
- `metadata` — any extra info about the event (flexible key-value pairs)
- `timestamp` — when the event happened

### 5.5 What Happens After an Event is Received

1. The API validates the request
2. The event is stored in the database
3. The event is passed to the Rules Engine for evaluation
4. The Rules Engine tells the Rewards Engine what to do
5. The API returns `{ success: true, event_id: "..." }` to the caller

### 5.6 Concurrency Requirement

The API must handle multiple events coming in at the same time (concurrent submissions). This means using async processing and a job queue (like BullMQ or similar) so events don't block each other.

---

## 6. Component 2 — Configurable Rules Engine

### 6.1 What It Is

This is the brain of ChainLoyalty. After an event comes in, the Rules Engine looks at a set of rules and decides: "Should this user get a reward? What kind? How much?" The critical requirement here is that **rules must be configurable without changing code** — a judge should be able to add a new rule via a config file or UI and it should work immediately.

### 6.2 The 3 Rule Types

**Rule Type 1: Threshold-Based**

"When a value crosses a certain number, trigger a reward."

Examples:
- If total purchases > $100 → give Gold tier badge
- If points balance > 500 → upgrade to Silver tier
- If referral count > 5 → give Bonus Points

Configuration looks like:
```json
{
  "rule_id": "gold_spender",
  "type": "threshold",
  "event_type": "purchase",
  "field": "cumulative_amount",
  "operator": ">",
  "value": 100,
  "reward": { "type": "badge", "badge_id": "gold_spender" }
}
```

**Rule Type 2: Frequency-Based**

"When something happens X times in a time window, trigger a reward."

Examples:
- If user logs in 5 days in a row → give Streak badge
- If user makes 3 purchases in 7 days → give Loyal Customer badge
- If user uses a feature 10 times in a month → give Power User points

Configuration looks like:
```json
{
  "rule_id": "power_user_monthly",
  "type": "frequency",
  "event_type": "feature_usage",
  "count": 10,
  "window_days": 30,
  "reward": { "type": "points", "amount": 200 }
}
```

**Rule Type 3: Conditional**

"If a combination of conditions is true, trigger a reward."

Examples:
- If event is `purchase` AND metadata amount > 50 AND user tier is `silver` → give points
- If event is `referral` AND referral is confirmed → credit both users

Configuration looks like:
```json
{
  "rule_id": "big_purchase_bonus",
  "type": "conditional",
  "conditions": [
    { "field": "event_type", "operator": "==", "value": "purchase" },
    { "field": "metadata.amount", "operator": ">", "value": 50 }
  ],
  "logic": "AND",
  "reward": { "type": "points", "amount": 100 }
}
```

### 6.3 How Rules Are Stored

Rules are stored in a JSON config file or database table. The system reads them at runtime (or on change). Adding a new rule = adding a new JSON object. No code deployment needed.

### 6.4 Tier Progression

The rules engine also manages user tiers. Tiers are like levels (Bronze → Silver → Gold → Platinum). As users earn more points or hit milestones, they move up tiers. Tiers can unlock better rewards or higher multipliers.

---

## 7. Component 3 — Rewards Engine

### 7.1 What It Is

Once the Rules Engine decides "yes, this user should get a reward," the Rewards Engine is what actually gives it out. It handles 3 totally different reward types and keeps track of everything.

### 7.2 Reward Type 1 — Points

Points are the simplest reward. They're just numbers in a database tied to a wallet address. Think of them like airline miles.

Requirements:
- Add points to a wallet balance after a qualifying event
- Support multipliers (Gold tier users get 2x points)
- Track full history of points earned (with reason and timestamp)
- Support points expiry (optional but good to have)
- Expose current balance and history via API

### 7.3 Reward Type 2 — Badges (NFTs)

Badges are achievements. Unlike points, they're unique and permanent. In Web3, badges are implemented as NFTs (Non-Fungible Tokens) — digital items that live in the user's wallet and can be verified by anyone.

Requirements:
- Each badge has a name, image, description, and rarity level
- When a badge is earned, it's recorded in the database (off-chain first for speed)
- If on-chain minting is enabled (bonus feature), the badge is minted as an ERC-721 or ERC-1155 NFT on testnet
- A user can only earn each unique badge once (no duplicates)
- Badges should have metadata following the OpenSea NFT metadata standard

### 7.4 Reward Type 3 — Probabilistic Rewards (Spin Wheel / Loot Box)

This is the fun one. When a user qualifies for a probabilistic reward, they get a random prize. The system picks from a weighted list of possible rewards. Think of it like a slot machine or loot box.

Requirements:
- Define a prize pool with weights (e.g., 50% chance of 10 points, 30% chance of 50 points, 15% chance of a badge, 5% chance of 200 points)
- When triggered, the system randomly picks a prize based on the weights
- The result is shown to the user (frontend can animate a spin wheel)
- The actual prize is then issued (points added, badge granted, etc.)
- All spins and outcomes are logged for transparency

### 7.5 Reward Attribution & History

Every reward issued must be linked to:
- The wallet address that earned it
- The event that triggered it
- The rule that matched
- The timestamp

This creates a full audit trail. The user can always see exactly why they earned what they earned.

---

## 8. Component 4 — Wallet Integration

### 8.1 What It Is

In traditional apps, users log in with email and password. In ChainLoyalty, users log in with their **crypto wallet**. The wallet address (like `0x742d35Cc...`) is the user's identity. All their rewards, points, and badges are attached to this address.

### 8.2 Supported Wallets

- **MetaMask** — the most popular browser extension wallet
- **WalletConnect** — a protocol that connects mobile wallets via QR code (supports 100+ wallets)

### 8.3 Authentication Flow (How Login Works)

This is called "Sign In With Ethereum" (SIWE). Here's how it works step by step:

1. User clicks "Connect Wallet" on the app
2. Their MetaMask pops up and they approve the connection
3. The app gets the user's wallet address
4. The backend generates a random message (called a "nonce") like: `"Sign this message to log in: abc123xyz"`
5. MetaMask asks the user to "sign" this message (no gas fees, no transaction — just a cryptographic signature)
6. The user approves
7. The backend verifies the signature — this proves the user actually owns that wallet address
8. The backend issues a JWT (session token) linked to that wallet address
9. The user is now logged in

This is secure because only someone with the private key of that wallet can produce that signature.

### 8.4 What "Wallet-Native Identity" Means in Practice

- No email, no password, no username — the wallet address IS the account
- If a user loses access to their wallet, they lose their account (this is Web3's tradeoff)
- All rewards, points, badges, and referral history are queryable by wallet address
- One wallet can be used across multiple SaaS apps that all integrate ChainLoyalty

---

## 9. Component 5 — Referral System

### 9.1 What It Is

A referral system lets existing users invite new users and earn rewards when those new users take action. ChainLoyalty's referral system is wallet-based — every wallet gets a unique referral code, and rewards go to wallet addresses, not emails.

### 9.2 How It Works

1. A user connects their wallet and gets a unique referral code (like `REF-0x1A2B-XYZ`)
2. They share this code or a link like `https://app.com/signup?ref=REF-0x1A2B-XYZ`
3. A new user signs up using that link
4. When the new user completes a qualifying action (e.g., first purchase), both users are rewarded
5. The referral chain is recorded on-chain or in the database

### 9.3 Fraud Prevention

Referral fraud is a huge problem (people referring themselves for free rewards). ChainLoyalty prevents this by:

- **No self-referrals:** The system checks if the referrer and referee share any on-chain activity patterns or the same IP
- **Wallet uniqueness:** Each wallet can only be referred once. You can't create a new wallet and refer yourself repeatedly (or at least, it's tracked)
- **Qualifying event required:** Rewards are only issued after a real action (like a purchase), not just on signup
- **Referral chain limits:** The system can be configured to track up to N levels of referral depth

### 9.4 What Gets Tracked

- Referrer wallet address
- Referee wallet address
- Referral code used
- Date of referral
- Qualifying event that triggered the reward
- Reward issued to both parties
- Status (pending / confirmed / fraudulent)

---

## 10. Component 6 — Embeddable UI Components

### 10.1 What It Is

ChainLoyalty provides two pre-built React components that any SaaS company can drop into their existing frontend. This means integrating companies don't need to build any loyalty UI themselves.

### 10.2 Component 1 — User Rewards Dashboard

This is a widget the end user sees when they want to check their rewards. It shows:

- Current points balance
- Current tier (Bronze / Silver / Gold / Platinum) with a progress bar to the next tier
- List of badges earned (with icons and descriptions)
- Recent rewards history (what was earned, when, and why)
- A "Spin the Wheel" button if a probabilistic reward is available
- Referral code and a "Copy Link" button

**Customization:** The component should accept theme props (primary color, font, border radius) so it matches the SaaS app's design.

### 10.3 Component 2 — Leaderboard

This is a public-facing widget showing the top users by points. It shows:

- Top N users (configurable, e.g., top 10 or top 50)
- Wallet address (abbreviated, like `0x1234...abcd`)
- Optional: ENS name if available (e.g., `alice.eth`)
- Points total
- Current tier badge icon
- Rank number with movement indicator (up/down from last week)

**Customization:** Number of entries shown, time period (all-time, monthly, weekly), fields displayed.

### 10.4 How to Embed Them

The components should be installable via npm:
```bash
npm install @chainloyalty/react
```

And used like:
```jsx
import { RewardsDashboard, Leaderboard } from '@chainloyalty/react';

<RewardsDashboard appId="YOUR_APP_ID" walletAddress={userWallet} />
<Leaderboard appId="YOUR_APP_ID" limit={10} period="monthly" />
```

Both components handle their own API calls internally. The integrating developer just provides the `appId` and `walletAddress`.

---

## 11. Component 7 — Demo SaaS Application

### 11.1 What It Is

A mock software-as-a-service application that demonstrates the entire ChainLoyalty system working end-to-end. This is the showpiece for the judges.

### 11.2 What the Demo App Simulates

The demo app is a fake "Project Management Tool" (like a mini Trello or Notion). It has the following simulated actions:

- **User signs up** → wallet connection, referral code attribution
- **User creates a project** → fires a `milestone` event
- **User invites a teammate** → fires a `referral` event
- **User upgrades to Pro plan** → fires a `subscription` event
- **User exports a report** → fires a `feature_usage` event
- **User makes a payment** → fires a `purchase` event

### 11.3 Critical Rule

The demo app must **never access the ChainLoyalty database directly**. Everything must go through the ChainLoyalty API. This proves the system works as a real third-party integration, not just a tightly coupled internal system.

### 11.4 The Full User Journey in the Demo

1. User visits the demo app and clicks "Connect Wallet" (MetaMask pops up)
2. User authenticates via wallet signature
3. If they came via a referral link, that referral is recorded
4. User performs actions in the app (create project, export, upgrade, etc.)
5. Each action fires an event to ChainLoyalty API in the background
6. The Rewards Dashboard widget in the corner updates with new points / badges
7. User can click the dashboard to see their full history
8. User can see the leaderboard and compare themselves to others
9. User gets a referral code and can copy it to invite friends

---

## 12. Bonus Features

### 12.1 No-Code Rule Builder UI

A visual drag-and-drop interface (like a flowchart builder) where a non-technical user (marketer or product manager) can create new reward rules without writing any code.

- Drag event types onto a canvas
- Set conditions with dropdown menus
- Define reward outputs
- Preview the rule in plain English before saving
- Saves to the same rules configuration the Rules Engine reads

### 12.2 On-Chain Badge Minting

Instead of just storing badges in a database, actually mint them as NFTs on a testnet blockchain.

- Use **ERC-721** (one unique token per badge) or **ERC-1155** (multiple copies of the same badge type)
- Deploy smart contracts to **Sepolia testnet** (Ethereum testnet, free to use)
- Store metadata (badge name, image, description) on IPFS
- When a user earns a badge, call the smart contract's `mint()` function to send the NFT to their wallet
- The user can view their badge in MetaMask or on OpenSea testnet

### 12.3 Analytics & Insights Dashboard

A business-facing dashboard (for the SaaS company that integrated ChainLoyalty) showing:

- Total events processed over time
- Points issued vs. redeemed
- Most earned badges
- Referral conversion rate (referrals sent vs. referrals that resulted in a qualifying action)
- Top users by engagement
- Tier distribution (how many users are Bronze vs. Silver vs. Gold)
- Weekly/monthly active reward earners

### 12.4 Developer SDK Package

An npm package that wraps all ChainLoyalty API calls with:

- TypeScript type definitions for all request/response shapes
- React hooks like `useRewards(walletAddress)`, `useLeaderboard(appId)`, `useReferral(walletAddress)`
- Automatic retry logic on failed API calls
- Optimistic UI updates (show the reward immediately before the API confirms)
- Clear error messages

### 12.5 Advanced Platform Features

- **Rate Limiting:** Each API key gets a request limit (e.g., 1000 events/minute) to prevent abuse
- **Webhooks:** After an event is processed and a reward is issued, ChainLoyalty sends a POST request to the SaaS app's webhook URL so they can react (e.g., show a popup to the user)
- **Gasless Transactions:** Use a relayer (like OpenGSN or Biconomy) so users don't need ETH in their wallet to receive NFT badges — ChainLoyalty pays the gas
- **Tier Decay:** If a user is inactive for 90 days, they drop one tier (configurable)

---

## 13. Tech Stack Recommendations

| Layer | Recommended Technology | Why |
|---|---|---|
| Backend API | Node.js + Express or Fastify | Fast, widely known, great Web3 library support |
| Database | PostgreSQL | Reliable relational DB for off-chain data |
| Job Queue | BullMQ + Redis | Handle concurrent event processing |
| Blockchain Library | ethers.js or viem | Industry standard for Ethereum interaction |
| Smart Contracts | Solidity + Hardhat | Standard tooling for EVM-compatible chains |
| Frontend | React + TypeScript | Component library requirement |
| Wallet Connection | wagmi + RainbowKit | Best-in-class wallet connection UX |
| Auth | SIWE (Sign In With Ethereum) | Standard for wallet-based auth |
| NFT Storage | IPFS via Pinata or NFT.Storage | Decentralized metadata storage |
| Testnet | Sepolia (Ethereum) | Free, well-supported, has faucets |

---

## 14. Data Models

### User / Wallet Record
```
wallet_address (primary key)
first_seen_at
last_active_at
current_tier
total_points_earned
current_points_balance
referral_code (unique)
referred_by_wallet (nullable)
```

### Event Record
```
event_id (UUID)
wallet_address (foreign key)
app_id
event_type
metadata (JSON)
timestamp
processed (boolean)
rules_matched (array)
```

### Reward Record
```
reward_id (UUID)
wallet_address
reward_type (points / badge / probabilistic)
reward_value (points amount or badge_id)
event_id (what triggered it)
rule_id (what rule matched)
issued_at
on_chain_tx_hash (nullable, for NFTs)
```

### Referral Record
```
referral_id (UUID)
referrer_wallet
referee_wallet
referral_code
created_at
qualifying_event_id (nullable)
status (pending / confirmed / fraudulent)
reward_issued (boolean)
```

### Rule Configuration
```
rule_id
rule_name
rule_type (threshold / frequency / conditional)
event_type
conditions (JSON)
reward_config (JSON)
is_active (boolean)
created_at
```

---

## 15. API Reference Summary

### Authentication
All API calls require an `Authorization: Bearer <API_KEY>` header.

### Key Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/v1/events` | Submit a product event |
| GET | `/v1/users/:wallet/rewards` | Get rewards for a wallet |
| GET | `/v1/users/:wallet/points` | Get points balance and history |
| GET | `/v1/users/:wallet/badges` | Get badges earned |
| POST | `/v1/users/:wallet/spin` | Trigger a spin-wheel reward |
| GET | `/v1/referrals/:wallet` | Get referral info for a wallet |
| POST | `/v1/auth/nonce` | Get a sign-in nonce |
| POST | `/v1/auth/verify` | Verify wallet signature and get JWT |
| GET | `/v1/leaderboard` | Get top users |
| GET | `/v1/rules` | Get all configured rules |
| POST | `/v1/rules` | Add a new rule (admin) |

---

## 16. Security Considerations

- **Wallet Signature Verification:** Every auth request must verify the cryptographic signature on the backend. Never trust a wallet address the frontend just sends without a signature.
- **Nonce Invalidation:** Each nonce used for login must be invalidated immediately after use to prevent replay attacks.
- **API Key Scoping:** Each SaaS company's API key should only let them submit events for their own `app_id`. They cannot read other apps' data.
- **Input Validation:** All wallet addresses must be checksummed and validated. All metadata must be sanitized to prevent injection attacks.
- **Rate Limiting:** Without rate limiting, a bad actor could spam events to farm rewards. Every API key must have request rate limits.
- **Referral Fraud:** As described in the Referral System section, multiple layers of fraud prevention are required.
- **Smart Contract Auditing:** Even on testnet, smart contracts should follow best practices (no reentrancy vulnerabilities, proper access control on `mint()` functions).

---

## 17. Out of Scope

The following are explicitly NOT required for this project:

- **Mainnet deployment:** All blockchain activity is on testnets only. No real money is involved.
- **Token creation / ERC-20:** ChainLoyalty issues points as database entries, not as actual crypto tokens (unless explicitly added as a bonus).
- **Mobile wallets (native app):** WalletConnect handles mobile via QR code in the browser. No native iOS/Android app is needed.
- **Multi-tenancy isolation at the database level:** A shared database with `app_id` scoping is sufficient for the hackathon demo.
- **Production-grade DevOps:** CI/CD pipelines, Kubernetes, etc. are not required. A working demo deployment is sufficient.
- **Real payment processing:** The demo app simulates purchases with fake amounts. No real Stripe or payment gateway integration is needed.

---

*This document covers all primary objectives and bonus features of the ChainLoyalty platform. Each section is designed to give developers a precise understanding of what needs to be built, why it exists, and how it fits into the larger system.*
