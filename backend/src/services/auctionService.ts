import { prisma } from '../db/prisma.js';
import { emitAuctionBidUpdate, emitAuctionStatusUpdate } from '../socket/index.js';
import { metricsStore } from '../middleware/metricsMiddleware.js';
import { logger } from '../logger/index.js';
import { createAuditLog } from '../utils/auditLogger.js';

export async function getAuctions(filters: {
  status?: string;
  make?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
}) {
  const where: any = {};

  if (filters.status && filters.status !== 'ALL') {
    where.status = filters.status;
  }

  if (filters.make && filters.make !== 'ALL') {
    where.motorcycle = { ...where.motorcycle, make: filters.make };
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { description: { contains: filters.search } },
      { motorcycle: { make: { contains: filters.search } } },
      { motorcycle: { model: { contains: filters.search } } }
    ];
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.currentBid = {};
    if (filters.minPrice !== undefined) where.currentBid.gte = filters.minPrice;
    if (filters.maxPrice !== undefined) where.currentBid.lte = filters.maxPrice;
  }

  let orderBy: any = { createdAt: 'desc' };
  if (filters.sort === 'endingSoon') {
    orderBy = { endTime: 'asc' };
  } else if (filters.sort === 'priceLowHigh') {
    orderBy = { currentBid: 'asc' };
  } else if (filters.sort === 'priceHighLow') {
    orderBy = { currentBid: 'desc' };
  }

  return await prisma.auction.findMany({
    where,
    orderBy,
    include: {
      motorcycle: {
        include: {
          seller: { select: { id: true, name: true, email: true } }
        }
      },
      winningUser: { select: { id: true, name: true, email: true } },
      bids: {
        orderBy: { timestamp: 'desc' },
        take: 20,
        include: {
          user: { select: { id: true, name: true, email: true } }
        }
      },
      _count: { select: { bids: true } }
    }
  });
}

export async function getAuctionById(id: string) {
  return await prisma.auction.findUnique({
    where: { id },
    include: {
      motorcycle: {
        include: {
          seller: { select: { id: true, name: true, email: true } }
        }
      },
      winningUser: { select: { id: true, name: true, email: true } },
      bids: {
        orderBy: { timestamp: 'desc' },
        take: 50,
        include: {
          user: { select: { id: true, name: true, email: true } }
        }
      }
    }
  });
}

export async function createAuction(data: {
  motorcycle: {
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
  };
  title: string;
  description: string;
  startingBid: number;
  reservePrice: number;
  minBidIncrement: number;
  startTime: Date;
  endTime: Date;
  antiSnipeSeconds?: number;
}) {
  const motorcycle = await prisma.motorcycle.create({
    data: {
      make: data.motorcycle.make,
      model: data.motorcycle.model,
      year: data.motorcycle.year,
      mileage: data.motorcycle.mileage,
      engineCc: data.motorcycle.engineCc,
      condition: data.motorcycle.condition,
      titleStatus: data.motorcycle.titleStatus,
      imagesJson: data.motorcycle.imagesJson,
      specsJson: data.motorcycle.specsJson,
      sellerId: data.motorcycle.sellerId
    }
  });

  const now = new Date();
  let initialStatus: 'DRAFT' | 'SCHEDULED' | 'LIVE' = 'SCHEDULED';
  if (data.startTime <= now) {
    initialStatus = 'LIVE';
  }

  const auction = await prisma.auction.create({
    data: {
      motorcycleId: motorcycle.id,
      title: data.title,
      description: data.description,
      startingBid: data.startingBid,
      reservePrice: data.reservePrice,
      minBidIncrement: data.minBidIncrement,
      currentBid: data.startingBid,
      status: initialStatus,
      startTime: data.startTime,
      endTime: data.endTime,
      antiSnipeSeconds: data.antiSnipeSeconds || 120
    },
    include: {
      motorcycle: true
    }
  });

  await createAuditLog({
    userId: data.motorcycle.sellerId,
    action: 'CREATE_AUCTION',
    entityType: 'AUCTION',
    entityId: auction.id,
    details: { title: auction.title, startingBid: auction.startingBid }
  });

  return auction;
}

export async function placeBid(params: {
  auctionId: string;
  userId: string;
  amount: number;
  maxProxyAmount?: number;
}) {
  const { auctionId, userId, amount, maxProxyAmount } = params;

  // Execute inside atomic interactive transaction to eliminate race conditions
  const result = await prisma.$transaction(async (tx) => {
    const auction = await tx.auction.findUnique({
      where: { id: auctionId },
      include: { bids: { orderBy: { amount: 'desc' }, take: 1 } }
    });

    if (!auction) {
      throw { statusCode: 404, message: 'Auction not found' };
    }

    if (auction.status !== 'LIVE') {
      throw { statusCode: 400, message: `Cannot bid on auction with status ${auction.status}` };
    }

    const now = new Date();
    if (now > new Date(auction.endTime)) {
      throw { statusCode: 400, message: 'Auction has already ended' };
    }

    // Bid validation logic
    const requiredMinBid = auction.currentBid > 0 && auction.bids.length > 0 
      ? auction.currentBid + auction.minBidIncrement 
      : auction.startingBid;

    if (amount < requiredMinBid) {
      throw {
        statusCode: 400,
        message: `Bid amount $${amount} must be at least $${requiredMinBid}`
      };
    }

    let finalBidAmount = amount;
    let newWinningUserId = userId;
    let isAutoBid = false;

    // Create primary bid record
    const newBid = await tx.bid.create({
      data: {
        auctionId,
        userId,
        amount: finalBidAmount,
        maxProxyAmount: maxProxyAmount || null,
        isAutoBid: false
      },
      include: { user: { select: { id: true, name: true, email: true } } }
    });

    // Anti-sniping logic check
    let updatedEndTime = new Date(auction.endTime);
    let extendedByAntiSnipe = false;
    const secondsRemaining = (updatedEndTime.getTime() - now.getTime()) / 1000;

    if (secondsRemaining > 0 && secondsRemaining <= auction.antiSnipeSeconds) {
      // Auto extend by antiSnipeSeconds
      updatedEndTime = new Date(updatedEndTime.getTime() + auction.antiSnipeSeconds * 1000);
      extendedByAntiSnipe = true;
      logger.info({ auctionId, secondsRemaining, newEndTime: updatedEndTime }, 'Anti-sniping auto-extended auction end time');
    }

    // Update Auction state atomically
    const updatedAuction = await tx.auction.update({
      where: { id: auctionId },
      data: {
        currentBid: finalBidAmount,
        winningUserId: newWinningUserId,
        endTime: updatedEndTime
      }
    });

    return { newBid, updatedAuction, extendedByAntiSnipe };
  });

  // Track metrics
  metricsStore.totalBidsPlaced++;

  // Emit real-time WebSocket update
  emitAuctionBidUpdate(auctionId, {
    auctionId,
    currentBid: result.updatedAuction.currentBid,
    winningUserId: result.updatedAuction.winningUserId,
    endTime: result.updatedAuction.endTime.toISOString(),
    extendedByAntiSnipe: result.extendedByAntiSnipe,
    bid: result.newBid
  });

  await createAuditLog({
    userId,
    action: 'PLACE_BID',
    entityType: 'AUCTION',
    entityId: auctionId,
    details: { amount: result.newBid.amount, extendedByAntiSnipe: result.extendedByAntiSnipe }
  });

  return result;
}

export async function updateAuctionStatus(
  auctionId: string,
  newStatus: 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'ENDED' | 'SOLD' | 'UNSOLD' | 'CANCELLED',
  adminUserId?: string
) {
  const auction = await prisma.auction.findUnique({ where: { id: auctionId } });
  if (!auction) throw { statusCode: 404, message: 'Auction not found' };

  let finalStatus = newStatus;
  // If ending, resolve SOLD vs UNSOLD based on reserve price
  if (newStatus === 'ENDED') {
    if (auction.currentBid >= auction.reservePrice && auction.winningUserId) {
      finalStatus = 'SOLD';
    } else {
      finalStatus = 'UNSOLD';
    }
  }

  const updated = await prisma.auction.update({
    where: { id: auctionId },
    data: { status: finalStatus }
  });

  emitAuctionStatusUpdate(auctionId, {
    auctionId,
    status: finalStatus,
    winningUserId: updated.winningUserId,
    finalBid: updated.currentBid
  });

  await createAuditLog({
    userId: adminUserId,
    action: 'UPDATE_AUCTION_STATUS',
    entityType: 'AUCTION',
    entityId: auctionId,
    details: { oldStatus: auction.status, newStatus: finalStatus }
  });

  return updated;
}

export async function checkAndExpireAuctions() {
  const now = new Date();

  // 1. Transition SCHEDULED -> LIVE if startTime <= now
  const scheduledToLive = await prisma.auction.findMany({
    where: { status: 'SCHEDULED', startTime: { lte: now } }
  });

  for (const auc of scheduledToLive) {
    await updateAuctionStatus(auc.id, 'LIVE');
    logger.info({ auctionId: auc.id }, 'Cron: Transitioned scheduled auction to LIVE');
  }

  // 2. Transition LIVE -> ENDED if endTime <= now
  const liveToEnded = await prisma.auction.findMany({
    where: { status: 'LIVE', endTime: { lte: now } }
  });

  for (const auc of liveToEnded) {
    await updateAuctionStatus(auc.id, 'ENDED');
    logger.info({ auctionId: auc.id }, 'Cron: Transitioned expired live auction to ENDED');
  }
}
