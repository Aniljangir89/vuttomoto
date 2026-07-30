# Production Deployment Guide

This document provides instructions for deploying the **Bike Auction Platform** in a production environment using Docker and Docker Compose.

---

## 1. Containerized Deployment with Docker Compose

### Step 1: Clone & Configure Environment Variables
Ensure `.env` contains your production settings:
```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secure-production-jwt-secret-key-2026"
NODE_ENV="production"
```

### Step 2: Build & Start Containers
Run the unified multi-stage build:
```bash
docker-compose up -d --build
```

---

## 2. Horizontal Scaling & High Availability Considerations

### WebSockets & Redis Adapter
For scaling out backend server instances across multiple nodes:
1. Replace in-memory Socket.io socket adapter with `@socket.io/redis-adapter`.
2. Configure Redis Pub/Sub so live bid events broadcast seamlessly across all backend worker nodes.

### Database Migration to PostgreSQL / Distributed SQL
To scale database writes under extreme traffic:
1. Update `schema.prisma` provider from `sqlite` to `postgresql`.
2. Deploy PostgreSQL with read replicas for zero-downtime database reads.
