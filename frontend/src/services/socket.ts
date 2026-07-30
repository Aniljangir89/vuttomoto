import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      const serverUrl = import.meta.env.VITE_API_URL || window.location.origin;
      this.socket = io(serverUrl, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        console.log('Socket.io connected:', this.socket?.id);
      });

      this.socket.on('disconnect', () => {
        console.log('Socket.io disconnected');
      });
    }
    return this.socket;
  }

  joinAuction(auctionId: string) {
    this.socket?.emit('join_auction', auctionId);
  }

  leaveAuction(auctionId: string) {
    this.socket?.emit('leave_auction', auctionId);
  }

  onBidUpdated(callback: (data: any) => void) {
    this.socket?.on('bid_updated', callback);
  }

  offBidUpdated(callback?: (data: any) => void) {
    this.socket?.off('bid_updated', callback);
  }

  onAuctionStatusChanged(callback: (data: any) => void) {
    this.socket?.on('auction_status_changed', callback);
  }

  offAuctionStatusChanged(callback?: (data: any) => void) {
    this.socket?.off('auction_status_changed', callback);
  }

  onViewerCountUpdate(callback: (data: { auctionId: string; count: number }) => void) {
    this.socket?.on('viewer_count_update', callback);
  }

  offViewerCountUpdate(callback?: (data: any) => void) {
    this.socket?.off('viewer_count_update', callback);
  }

  onMarketplaceUpdate(callback: (data: any) => void) {
    this.socket?.on('marketplace_auction_updated', callback);
    this.socket?.on('marketplace_auction_status_changed', callback);
  }

  offMarketplaceUpdate() {
    this.socket?.off('marketplace_auction_updated');
    this.socket?.off('marketplace_auction_status_changed');
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
