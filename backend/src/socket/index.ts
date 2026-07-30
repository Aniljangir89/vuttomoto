import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { metricsStore } from '../middleware/metricsMiddleware.js';
import { logger } from '../logger/index.js';

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    metricsStore.activeSockets++;
    logger.info({ socketId: socket.id }, 'Client connected to WebSocket server');

    socket.on('join_auction', (auctionId: string) => {
      socket.join(`auction:${auctionId}`);
      logger.info({ socketId: socket.id, auctionId }, 'Client joined auction room');
      
      // Broadcast active room viewer count
      const roomSize = io?.sockets.adapter.rooms.get(`auction:${auctionId}`)?.size || 0;
      io?.to(`auction:${auctionId}`).emit('viewer_count_update', { auctionId, count: roomSize });
    });

    socket.on('leave_auction', (auctionId: string) => {
      socket.leave(`auction:${auctionId}`);
      logger.info({ socketId: socket.id, auctionId }, 'Client left auction room');
      
      const roomSize = io?.sockets.adapter.rooms.get(`auction:${auctionId}`)?.size || 0;
      io?.to(`auction:${auctionId}`).emit('viewer_count_update', { auctionId, count: roomSize });
    });

    socket.on('disconnect', () => {
      metricsStore.activeSockets = Math.max(0, metricsStore.activeSockets - 1);
      logger.info({ socketId: socket.id }, 'Client disconnected from WebSocket server');
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io server not initialized');
  }
  return io;
}

export function emitAuctionBidUpdate(auctionId: string, payload: {
  auctionId: string;
  currentBid: number;
  winningUserId?: string | null;
  endTime: string;
  extendedByAntiSnipe?: boolean;
  bid: any;
}) {
  if (io) {
    io.to(`auction:${auctionId}`).emit('bid_updated', payload);
    io.emit('marketplace_auction_updated', {
      auctionId: payload.auctionId,
      currentBid: payload.currentBid,
      endTime: payload.endTime
    });
  }
}

export function emitAuctionStatusUpdate(auctionId: string, payload: {
  auctionId: string;
  status: string;
  winningUserId?: string | null;
  finalBid?: number;
}) {
  if (io) {
    io.to(`auction:${auctionId}`).emit('auction_status_changed', payload);
    io.emit('marketplace_auction_status_changed', payload);
  }
}
