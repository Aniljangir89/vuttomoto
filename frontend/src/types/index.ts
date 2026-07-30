export type Role = 'BUYER' | 'SELLER' | 'ADMIN';
export type AuctionStatus = 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'ENDED' | 'SOLD' | 'UNSOLD' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface Motorcycle {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  engineCc: number;
  condition: string;
  titleStatus: string;
  imagesJson: string;
  specsJson: string;
  sellerId: string;
  seller?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Bid {
  id: string;
  auctionId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  amount: number;
  maxProxyAmount?: number | null;
  isAutoBid: boolean;
  timestamp: string;
}

export interface Auction {
  id: string;
  motorcycleId: string;
  motorcycle: Motorcycle;
  title: string;
  description: string;
  startingBid: number;
  reservePrice: number;
  minBidIncrement: number;
  currentBid: number;
  winningUserId?: string | null;
  winningUser?: {
    id: string;
    name: string;
    email: string;
  } | null;
  status: AuctionStatus;
  startTime: string;
  endTime: string;
  antiSnipeSeconds: number;
  createdAt: string;
  bids?: Bid[];
  _count?: {
    bids: number;
  };
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  detailsJson?: string | null;
  ipAddress?: string | null;
  timestamp: string;
}

export interface SystemMetrics {
  system: {
    uptimeSeconds: number;
    memoryMb: { rss: number; heapUsed: number };
    nodeVersion: string;
  };
  traffic: {
    totalRequests: number;
    totalErrors: number;
    activeSockets: number;
    totalBidsPlaced: number;
  };
  database: {
    userCount: number;
    auctionCount: number;
    activeAuctions: number;
    bidCount: number;
  };
  latencies: Record<string, { avgMs: number; maxMs: number; count: number }>;
}
