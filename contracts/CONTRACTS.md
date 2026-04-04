# ChainLoyalty Smart Contract System

## Overview

Five purpose-built contracts working together. The backend never calls token or badge contracts directly — everything goes through RewardController.

---

## BurnTracker.sol

An append-only analytics ledger. Every time tokens are burned anywhere in the system, this contract records it: who burned, how much, when, and why. It exposes rolling 24h/7d/30d burn windows and a full history feed. This is what powers the live burn visualization on the dashboard — real on-chain data, no mocking.

---

## CLoyaltyToken (CLP)

The heart of ChainLoyalty's token economy. Every point earned by a user is a real ERC-20 token on Ethereum. Unlike traditional loyalty points that can be inflated arbitrarily, CLP has a hard supply cap set at deployment and a built-in deflationary mechanism — 1% of every transfer is permanently destroyed (burned), making each remaining token progressively scarcer over time.

**Burn triggers:**
- Transfer tax: 1% burned automatically on every transfer (configurable 0.5%–3%, governance-bounded)
- Redemption: user burns 100% of tokens to claim a physical or special reward
- Fraud penalty: ML fraud model flags a wallet → tokens burned on-chain with evidence hash
- Tier decay: wallets inactive for 90+ days lose 5% of their balance

All burn events are logged to BurnTracker and emit `TokensBurned` events for real-time frontend consumption.

---

## BadgeNFT

Achievements that live forever. When a user earns a badge on ChainLoyalty, it's minted as a soulbound NFT — permanently attached to their wallet, verifiable by anyone, impossible to fake or transfer.

**Key upgrades over v1:**
- On-chain rarity tiers: COMMON, RARE, EPIC, LEGENDARY
- LEGENDARY badges require a minimum CLP balance at mint time — engagement gates access to the rarest rewards
- EPIC and LEGENDARY minting burns CLP — direct deflationary pressure from badge issuance
- Badge evolution: burn 3 RARE badges to receive 1 EPIC, burn 3 EPIC to receive 1 LEGENDARY
- Optional expiry per badge type
- On-chain IPFS metadata hash — badges are verifiable without trusting the backend
- Fixed soulbound implementation (v1 had a dead-code bug in the transfer override)

---

## RewardController

The single entry point for all reward issuance. The backend calls this contract only — it orchestrates CLoyaltyToken and BadgeNFT internally. Large mints (>10,000 CLP) require GOVERNANCE_ROLE as a second-signer guard. Referral rewards are issued atomically — both parties get credited in one transaction or neither does.

---

## ReferralRegistry

On-chain referral attribution for full transparency. Every referral relationship is recorded on-chain: who referred whom, via which code, and when rewards were issued. Self-referrals and circular referral chains are blocked at the contract level. The full referral ancestry chain is queryable for any wallet.

---

## Security Properties

- No `tx.origin` used anywhere
- No unbounded loops (batch capped at 200, referral chain capped at 10 levels)
- All state-changing functions emit events
- Burn rate bounded by hardcoded constants (cannot be set to 100% to rug users)
- DEFAULT_ADMIN_ROLE cannot be renounced (prevents permanent lockout)
- Zero-address checks on all mint and transfer functions
- Checks-Effects-Interactions pattern followed throughout
