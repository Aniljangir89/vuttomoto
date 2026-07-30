# Production-Grade Bike Auction Platform 🏍️⚡

A full-stack, production-grade motorcycle live auction platform supporting real-time WebSocket bidding, anti-sniping protection, atomic transaction concurrency safety, role-based access control, comprehensive observability metrics, and automated test coverage.

---

## 🌟 Key Features

- **⚡ Real-Time Socket.io Bidding**: Live broadcasting of new bids, outbid alerts, synchronized countdown clocks, and active room viewer counts.
- **🛡️ Race Condition Immunity**: Bids are processed inside atomic Prisma database transactions to prevent race conditions during high-volume bidding.
- **⏱️ Anti-Sniping Protection Engine**: Automatically extends auction end time by +2 minutes if a bid is placed in the final 2 minutes.
- **🤖 Proxy Auto-Bidding**: Option for buyers to set maximum auto-bid ceilings for automatic incremental counter-bidding.
- **📊 Observability & System Metrics**: Built-in Admin Observability Dashboard (`/api/metrics`), live process memory tracking, WebSocket connections counter, and API route latency telemetry.
- **🔐 Audit Security Trail**: Immutable security audit log tracking all reserve price edits, status overrides, and user auth events.
- **🎭 Evaluator Demo Toolbar**: Instant 1-click role switcher (`Buyer Alex`, `Buyer Elena`, `Seller Moto Garage`, `Admin Apex`) for fast evaluation.

---

## 📁 Repository Structure

```
vutto-assignment/
├── backend/                  # Express + TypeScript + Prisma (SQLite) + Socket.io
│   ├── src/
│   │   ├── controllers/      # REST API Controllers (Auth, Auctions, Bids, Metrics, Audit)
│   │   ├── services/         # Auction domain logic, anti-sniping & transactions
│   │   ├── socket/           # Real-time WebSocket server & event broadcasting
│   │   ├── middleware/       # Auth JWT, rate limit, observability metrics
│   │   └── __tests__/        # Vitest integration test suite
│   └── prisma/               # Database schema & realistic seed data
├── frontend/                 # React 18 + Vite + TypeScript + TailwindCSS
│   ├── src/
│   │   ├── components/       # Header, AuctionCard, Grid, DetailModal, AdminDashboard
│   │   └── services/         # API & Socket.io client managers
├── docs/                     # Submission Deliverables
│   ├── ARCHITECTURE.md       # High-level architecture, schemas & sequence flows
│   ├── SETUP.md              # Local setup & running instructions
│   ├── DEPLOYMENT.md         # Production Docker deployment guide
│   └── ASSUMPTIONS_AND_TRADEOFFS.md # Engineering decisions & trade-offs
├── docker-compose.yml        # Unified container deployment
├── Dockerfile.backend
└── Dockerfile.frontend
```

---

## 🚀 Quick Start Instructions

### 1. Start Backend Server
```bash
cd backend
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```
> Server running at: `http://localhost:5000`

### 2. Start Frontend App
```bash
cd frontend
npm install
npm run dev
```
> Application running at: `http://localhost:3000`

### 3. Run Test Suite
```bash
cd backend
npm test
```
---

## 🔑 Demo Evaluator Credentials

Use the **Demo Quick Login Toolbar** at the top of the app, or manually sign in:

| Role | Email | Password |
| :--- | :--- | :--- |
| **BUYER (Alex)** | `buyer1@auction.com` | `password123` |
| **BUYER (Elena)** | `buyer2@auction.com` | `password123` |
| **SELLER (Moto Garage)** | `seller@auction.com` | `password123` |
| **ADMIN (Apex Admin)** | `admin@auction.com` | `password123` |
