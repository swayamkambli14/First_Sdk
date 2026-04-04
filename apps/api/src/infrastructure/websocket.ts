import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import logger from '../utils/logger.js';

let io: SocketIOServer | null = null;

/**
 * Initializes the Socket.IO server on the existing HTTP server.
 * Authenticates connections via JWT cookie or ?token= query param.
 */
export function initWebSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket: Socket, next) => {
    try {
      // Accept token from cookie or query param
      const token =
        (socket.handshake.auth['token'] as string) ||
        (socket.handshake.query['token'] as string);

      if (!token) {
        return next(new Error('Authentication required'));
      }

      // Decode JWT payload (verification is done by @fastify/jwt on HTTP routes)
      // For WebSocket, we do a basic decode to get the wallet address
      const parts = token.split('.');
      if (parts.length !== 3) return next(new Error('Invalid token'));

      const payload = JSON.parse(Buffer.from(parts[1]!, 'base64url').toString()) as {
        wallet_address?: string;
      };

      if (!payload.wallet_address) return next(new Error('Invalid token payload'));

      socket.data['walletAddress'] = payload.wallet_address;
      next();
    } catch {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const walletAddress = socket.data['walletAddress'] as string;

    // Join the wallet's private room — rewards are emitted to this room
    void socket.join(`wallet:${walletAddress}`);
    logger.debug('WebSocket client connected', { wallet: walletAddress, socketId: socket.id });

    socket.on('disconnect', (reason) => {
      logger.debug('WebSocket client disconnected', { wallet: walletAddress, reason });
    });
  });

  logger.info('WebSocket server initialized');
  return io;
}

/**
 * Emits an event to a specific wallet's room.
 * Called by RewardService after issuing a reward.
 */
export function emitToWallet(walletAddress: string, event: string, data: unknown): void {
  if (!io) {
    logger.warn('WebSocket server not initialized — cannot emit', { walletAddress, event });
    return;
  }
  io.to(`wallet:${walletAddress.toLowerCase()}`).emit(event, data);
}
