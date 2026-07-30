import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { prisma } from '../db/prisma.js';

describe('Bike Auction Platform Integration Tests', () => {
  beforeAll(async () => {
    // Ensure clean state or DB readiness
    await prisma.$connect();
  });

  describe('Health & Observability API', () => {
    it('GET /api/health - should return UP status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
      expect(res.body).toHaveProperty('uptimeSeconds');
    });

    it('GET /api/metrics - should return system metrics', async () => {
      const res = await request(app).get('/api/metrics');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('system');
      expect(res.body).toHaveProperty('traffic');
      expect(res.body).toHaveProperty('database');
    });
  });

  describe('Authentication API', () => {
    it('POST /api/auth/register - should register a new user', async () => {
      const uniqueEmail = `testuser_${Date.now()}@example.com`;
      const res = await request(app).post('/api/auth/register').send({
        email: uniqueEmail,
        password: 'password123',
        name: 'Test Buyer',
        role: 'BUYER'
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(uniqueEmail);
    });

    it('POST /api/auth/quick-login - should quick login demo accounts', async () => {
      const res = await request(app).post('/api/auth/quick-login').send({
        role: 'BUYER'
      });

      if (res.status === 200) {
        expect(res.body).toHaveProperty('token');
        expect(res.body.user.role).toBe('BUYER');
      } else {
        // Seed might not have been executed yet in plain test env
        expect(res.status).toBe(404);
      }
    });
  });

  describe('Auctions Marketplace API', () => {
    it('GET /api/auctions - should list all auctions', async () => {
      const res = await request(app).get('/api/auctions');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.auctions)).toBe(true);
    });
  });
});
