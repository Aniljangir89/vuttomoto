import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';
import { metricsMiddleware } from './middleware/metricsMiddleware.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Trust proxy header for cloud reverse proxies (Render, Nginx, AWS)
app.set('trust proxy', 1);

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));

// CORS setup
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', apiLimiter);

// Observability metrics middleware
app.use(metricsMiddleware);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Mount routes
app.use('/api', routes);

// Global Error Handler
app.use(errorHandler);

export default app;
