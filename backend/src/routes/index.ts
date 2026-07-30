import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import * as auctionController from '../controllers/auctionController.js';
import * as bidController from '../controllers/bidController.js';
import * as metricsController from '../controllers/metricsController.js';
import * as auditController from '../controllers/auditController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Auth endpoints
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/quick-login', authController.quickLogin);
router.get('/auth/me', authenticateToken, authController.getMe);

// Auction endpoints
router.get('/auctions', auctionController.listAuctions);
router.get('/auctions/:id', auctionController.getAuction);
router.post('/auctions', authenticateToken, requireRole(['SELLER', 'ADMIN']), auctionController.createAuctionHandler);
router.patch('/auctions/:id/status', authenticateToken, requireRole(['ADMIN']), auctionController.updateStatusHandler);
router.patch('/auctions/:id/reserve-price', authenticateToken, requireRole(['ADMIN', 'SELLER']), auctionController.updateReservePriceHandler);

// Bid endpoints
router.post('/auctions/:id/bids', authenticateToken, requireRole(['BUYER', 'ADMIN']), bidController.placeBidHandler);
router.get('/auctions/:id/bids', bidController.getAuctionBids);

// Observability & Metrics
router.get('/health', metricsController.getHealth);
router.get('/metrics', metricsController.getMetrics);
router.get('/audit-logs', authenticateToken, requireRole(['ADMIN']), auditController.listAuditLogs);

export default router;
