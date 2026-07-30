# Bike Auction Platform - System Architecture & Design Document

## 1. Executive Overview

This document details the software architecture, design decisions, data models, real-time event pipeline, concurrency controls, and security model of the **Vutto Moto Bike Auction Platform**. The system is built for high-concurrency live motorcycle auctions, supporting simultaneous active auctions, real-time bid broadcasting, anti-sniping time extensions, and operational observability.

---

## 2. High-Level Architecture Diagram

```
                                  ┌────────────────────────────────────────────────┐
                                  │             React Single Page Application      │
                                  │            (Vite + TypeScript + Tailwind)      │
                                  └───────────────┬────────────────┬───────────────┘
                                                  │                │
                                       HTTP REST  │                │ WebSockets
                                        Requests  │                │ (Bi-directional)
                                                  ▼                ▼
                                  ┌────────────────────────────────────────────────┐
                                  │             Express Backend API Server         │
                                  │   (TypeScript + Helmet + Pino + Socket.io)     │
                                  └───────┬──────────────┬─────────────────┬───────┘
                                          │              │                 │
                                          ▼              ▼                 ▼
                                    ┌───────────┐  ┌───────────┐     ┌───────────┐
                                    │ SQLite DB │  │Anti-Snipe │     │Observability
                                    │ (Prisma)  │  │Timer Engine     │& Audit Log│
                                    └───────────┘  └───────────┘     └───────────┘
```

---

## 3. Core Technical Features & Algorithms

### 3.1 Real-Time WebSocket Event Pipeline (`Socket.io`)
To support live interactive bidding, the backend utilizes `Socket.io`. Clients join isolated socket rooms corresponding to specific auction IDs (`auction:<auctionId>`).

- **Events Emitted**:
  - `bid_updated`: Emitted whenever a valid bid is placed. Broadcasts current bid, winning user ID, updated end time, and anti-sniping extension flags.
  - `auction_status_changed`: Emitted when an auction transitions state (`SCHEDULED` ➔ `LIVE` ➔ `ENDED` / `SOLD`).
  - `viewer_count_update`: Broadcasts real-time counter of active bidders watching a specific auction.

### 3.2 Concurrency & Race Condition Safety
Simultaneous bid submissions by multiple users are wrapped inside an **atomic database transaction** (`prisma.$transaction`).
- **Pessimistic / Isolated State Lock**: Bids are validated within the transaction against the current high bid and reserve price before inserting the bid record.
- **Race Condition Immunity**: Two simultaneous bids for the same amount will execute sequentially inside SQLite WAL-mode transactions. The second bid will be rejected with an explicit error: `"Bid amount must be at least $X"`.

### 3.3 Anti-Sniping Protection Engine
"Sniping" occurs when bidders submit last-second bids to win without allowing competitors to respond.
- **Algorithm**: When a bid is placed within `antiSnipeSeconds` (default: 120 seconds) of the auction's `endTime`, the engine automatically extends `endTime` by `antiSnipeSeconds`.
- The extended end time is saved to the database and broadcasted in real time via Socket.io to all connected clients.

### 3.4 Proxy / Auto-Bidding Logic
Buyers can set a `maxProxyAmount`. When another buyer places a bid lower than the proxy cap, the system automatically places an incremental counter-bid on behalf of the proxy bidder.

---

## 4. Entity Relationship & Data Schema

```
  +-------------------+       1:N       +---------------------+       1:N       +--------------------+
  |       User        |---------------> |     Motorcycle      |---------------> |      Auction       |
  +-------------------+                 +---------------------+                 +--------------------+
  | id (UUID)         |                 | id (UUID)           |                 | id (UUID)          |
  | email (String)    |                 | make, model, year   |                 | title, description |
  | passwordHash      |                 | mileage, engineCc   |                 | startingBid        |
  | role (BUYER/ADMIN)|                 | imagesJson          |                 | reservePrice       |
  +-------------------+                 +---------------------+                 | currentBid         |
                                                                                | status             |
                                                                                | startTime, endTime |
                                                                                +--------------------+
                                                                                          │ 1:N
                                                                                          ▼
                                                                                +--------------------+
                                                                                |        Bid         |
                                                                                +--------------------+
                                                                                | id, amount         |
                                                                                | maxProxyAmount     |
                                                                                | isAutoBid          |
                                                                                | timestamp          |
                                                                                +--------------------+
```

---

## 5. Security & Observability Architecture

1. **JWT & RBAC Middleware**: Strict role checks (`BUYER`, `SELLER`, `ADMIN`).
2. **Rate Limiting**: `express-rate-limit` prevents brute-force API requests.
3. **Structured Logging**: `Pino` JSON logger.
4. **Audit Logging**: Sensitive actions (reserve price edits, state force-overrides, auction creations) are saved to the `AuditLog` table.
5. **Observability Metrics (`/api/metrics`)**: Exposes system uptime, process memory RSS/heap, active WebSockets, total bids processed, and API route latency statistics.
