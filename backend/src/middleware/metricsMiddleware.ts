import { Request, Response, NextFunction } from 'express';

export interface SystemMetrics {
  totalRequests: number;
  totalErrors: number;
  activeSockets: number;
  totalBidsPlaced: number;
  routeLatencies: Record<string, number[]>;
  startTime: number;
}

export const metricsStore: SystemMetrics = {
  totalRequests: 0,
  totalErrors: 0,
  activeSockets: 0,
  totalBidsPlaced: 0,
  routeLatencies: {},
  startTime: Date.now()
};

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  metricsStore.totalRequests++;
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = req.route ? `${req.method} ${req.route.path}` : `${req.method} ${req.path}`;
    
    if (!metricsStore.routeLatencies[route]) {
      metricsStore.routeLatencies[route] = [];
    }
    // Keep last 100 duration measurements per route
    metricsStore.routeLatencies[route].push(duration);
    if (metricsStore.routeLatencies[route].length > 100) {
      metricsStore.routeLatencies[route].shift();
    }

    if (res.statusCode >= 400) {
      metricsStore.totalErrors++;
    }
  });

  next();
};
