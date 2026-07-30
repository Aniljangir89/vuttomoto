import { Request, Response } from 'express';
import { metricsStore } from '../middleware/metricsMiddleware.js';
import { prisma } from '../db/prisma.js';

export async function getHealth(req: Request, res: Response) {
  try {
    // Ping Database
    await prisma.$queryRaw`SELECT 1`;
    return res.json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - metricsStore.startTime) / 1000)
    });
  } catch (err: any) {
    return res.status(503).json({
      status: 'DOWN',
      error: 'Database connection failed'
    });
  }
}

export async function getMetrics(req: Request, res: Response) {
  try {
    const memoryUsage = process.memoryUsage();
    
    const [userCount, auctionCount, bidCount, activeAuctions] = await Promise.all([
      prisma.user.count(),
      prisma.auction.count(),
      prisma.bid.count(),
      prisma.auction.count({ where: { status: 'LIVE' } })
    ]);

    // Calculate latency percentiles per route
    const latencyStats: Record<string, { avgMs: number; maxMs: number; count: number }> = {};
    for (const [route, times] of Object.entries(metricsStore.routeLatencies)) {
      if (times.length > 0) {
        const sum = times.reduce((a, b) => a + b, 0);
        latencyStats[route] = {
          avgMs: Math.round(sum / times.length),
          maxMs: Math.max(...times),
          count: times.length
        };
      }
    }

    return res.json({
      system: {
        uptimeSeconds: Math.floor((Date.now() - metricsStore.startTime) / 1000),
        memoryMb: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024)
        },
        nodeVersion: process.version
      },
      traffic: {
        totalRequests: metricsStore.totalRequests,
        totalErrors: metricsStore.totalErrors,
        activeSockets: metricsStore.activeSockets,
        totalBidsPlaced: metricsStore.totalBidsPlaced
      },
      database: {
        userCount,
        auctionCount,
        activeAuctions,
        bidCount
      },
      latencies: latencyStats
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to generate system metrics' });
  }
}
