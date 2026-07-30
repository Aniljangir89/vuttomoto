import http from 'http';
import app from './app.js';
import { config } from './config/index.js';
import { logger } from './logger/index.js';
import { initSocketServer } from './socket/index.js';
import { checkAndExpireAuctions } from './services/auctionService.js';

const httpServer = http.createServer(app);

// Initialize WebSockets
initSocketServer(httpServer);

// Start periodic auction timer engine (checks state every 10 seconds)
const TIMER_INTERVAL_MS = 10000;
const timerInstance = setInterval(async () => {
  try {
    await checkAndExpireAuctions();
  } catch (err) {
    logger.error({ err }, 'Error in auction status expiration timer worker');
  }
}, TIMER_INTERVAL_MS);

httpServer.listen(config.port, () => {
  logger.info(`Bike Auction Platform Backend running on port ${config.port} [${config.nodeEnv}]`);
});

// Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Initiating graceful shutdown...`);
  clearInterval(timerInstance);
  httpServer.close(() => {
    logger.info('HTTP & Socket.io server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
