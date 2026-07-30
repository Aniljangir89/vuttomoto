import { Request, Response } from 'express';
import { z } from 'zod';
import * as auctionService from '../services/auctionService.js';
import { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../db/prisma.js';
import { createAuditLog } from '../utils/auditLogger.js';

const createAuctionSchema = z.object({
  title: z.string().min(3),
  description: z.string(),
  startingBid: z.number().positive(),
  reservePrice: z.number().positive(),
  minBidIncrement: z.number().positive().default(100),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  antiSnipeSeconds: z.number().positive().default(120),
  motorcycle: z.object({
    make: z.string(),
    model: z.string(),
    year: z.number().int(),
    mileage: z.number().int(),
    engineCc: z.number().int(),
    condition: z.string(),
    titleStatus: z.string(),
    images: z.array(z.string()),
    specs: z.record(z.any())
  })
});

export async function listAuctions(req: Request, res: Response) {
  try {
    const { status, make, search, minPrice, maxPrice, sort } = req.query;
    const auctions = await auctionService.getAuctions({
      status: status as string,
      make: make as string,
      search: search as string,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      sort: sort as string
    });
    return res.json({ auctions });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch auctions' });
  }
}

export async function getAuction(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const auction = await auctionService.getAuctionById(id);
    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }
    return res.json({ auction });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch auction' });
  }
}

export async function createAuctionHandler(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const parseResult = createAuctionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation error', details: parseResult.error.format() });
    }

    const data = parseResult.data;

    const auction = await auctionService.createAuction({
      title: data.title,
      description: data.description,
      startingBid: data.startingBid,
      reservePrice: data.reservePrice,
      minBidIncrement: data.minBidIncrement,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      antiSnipeSeconds: data.antiSnipeSeconds,
      motorcycle: {
        ...data.motorcycle,
        imagesJson: JSON.stringify(data.motorcycle.images),
        specsJson: JSON.stringify(data.motorcycle.specs),
        sellerId: req.user.id
      }
    });

    return res.status(201).json({ auction });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create auction' });
  }
}

export async function updateStatusHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['DRAFT', 'SCHEDULED', 'LIVE', 'ENDED', 'SOLD', 'UNSOLD', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updated = await auctionService.updateAuctionStatus(id, status, req.user?.id);
    return res.json({ auction: updated });
  } catch (err: any) {
    return res.status(err.statusCode || 500).json({ error: err.message || 'Failed to update status' });
  }
}

export async function updateReservePriceHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { reservePrice } = req.body;

    if (typeof reservePrice !== 'number' || reservePrice <= 0) {
      return res.status(400).json({ error: 'Invalid reserve price' });
    }

    const updated = await prisma.auction.update({
      where: { id },
      data: { reservePrice }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'UPDATE_RESERVE_PRICE',
      entityType: 'AUCTION',
      entityId: id,
      details: { newReservePrice: reservePrice }
    });

    return res.json({ auction: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update reserve price' });
  }
}
