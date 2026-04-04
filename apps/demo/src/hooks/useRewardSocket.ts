/**
 * Gap #3 fix: WebSocket connection for real-time reward notifications.
 * Connects to the backend Socket.IO server and listens for reward_earned events.
 */
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useChainLoyaltyAuth } from './useChainLoyaltyAuth';

const WS_URL = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3000';

export interface RewardEvent {
  type: string;
  amount?: number;
  badge_id?: string;
  badge_name?: string;
  reason?: string;
}

export function useRewardSocket(onReward: (reward: RewardEvent) => void) {
  const { walletAddress, isAuthenticated } = useChainLoyaltyAuth();
  const socketRef = useRef<Socket | null>(null);
  const onRewardRef = useRef(onReward);
  onRewardRef.current = onReward;

  useEffect(() => {
    if (!walletAddress || !isAuthenticated) return;

    const socket = io(WS_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      // Join the wallet-specific room so we only receive our own rewards
      socket.emit('join', { wallet_address: walletAddress });
    });

    socket.on('reward_earned', (data: { reward: RewardEvent }) => {
      onRewardRef.current(data.reward);
    });

    socket.on('connect_error', () => {
      // Silently ignore — WebSocket is enhancement, not critical path
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [walletAddress, isAuthenticated]);
}
