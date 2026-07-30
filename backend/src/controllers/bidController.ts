import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.js';
import * as auctionService from '../services/auctionService.js';
import { prisma } from '../db/prisma.js';

const placeBidSchema = z.object({
  amount: z.number().positive(),
  maxProxyAmount: z.number().positive().optional()
});

export async function placeBidHandler(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { id: auctionId } = req.params;
    const parseResult = placeBidSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation error', details: parseResult.error.format() });
    }

    const { amount, maxProxyAmount } = parseResult.data;

    const result = await auctionService.placeBid({
      auctionId,
      userId: req.user.id,
      amount,
      maxProxyAmount
    });

    return res.status(201).json({
      bid: result.newBid,
      auction: result.updatedAuction,
      extendedByAntiSnipe: result.extendedByAntiSnipe
    });
  } catch (err: any) {
    return res.status(err.statusCode || 500).json({ error: err.message || 'Failed to place bid' });
  }
}

export async function getAuctionBids(req: AuthRequest, res: Response) {
  try {
    const { id: auctionId } = req.params;
    const bids = await prisma.bid.findMany({
      where: { auctionId },
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    return res.json({ bids });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch bids' });
  }
}
