/**
 * Global Zustand store — single source of truth for the demo app.
 * Auth, user data, badges, rewards, referrals, leaderboard, chain data, toasts.
 */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import axios from 'axios';
import { ethers } from 'ethers';

const API = '/v1';
const APP_ID = import.meta.env['VITE_APP_ID'] ?? 'demo-app-id';
const RPC_URL = import.meta.env['VITE_BLOCKCHAIN_RPC_URL'] ?? 'https://eth-sepolia.g.alchemy.com/v2/YZtc-AuzXiZkr2BOVIvER';

const ADDRS = {
  clp:      '0xC272844F17f4ce599474373c05A6B1AD98A7B8b4',
  tracker:  '= import.meta.env['VITE_APP_ID'] ?? 'demo-app-id';
const RPC_URL = import.meta.env['VITE_BLOCKCHAIN_RPC_URL'] ?? 'h