# Assumptions & Technical Trade-offs

This document outlines the design assumptions, trade-offs, and engineering rationale behind the implementation of the **Bike Auction Platform**.

---

## 1. Database Selection: SQLite + Prisma ORM

### Rationale
- **Decision**: SQLite with WAL (Write-Ahead Logging) mode via Prisma ORM was chosen for local development and self-contained execution.
- **Trade-off**: While PostgreSQL or MySQL offer higher write concurrency across multiple server instances, SQLite provides instant zero-dependency execution for evaluators without requiring external database server instances or background daemons.
- **Production Path**: The Prisma abstraction layer allows switching to PostgreSQL by simply updating 1 line in `schema.prisma` (`provider = "postgresql"`).

---

## 2. Real-Time Engine: Socket.io vs Server-Sent Events (SSE)

### Rationale
- **Decision**: Socket.io bi-directional WebSockets.
- **Trade-off**: WebSockets maintain persistent TCP connections which consume server memory per active socket. However, for live bidding, the sub-millisecond bi-directional speed, active viewer count broadcasting, and instant outbid alerts provide a vastly superior user experience compared to polling or SSE.

---

## 3. Concurrency Protection Strategy

### Rationale
- **Decision**: Interactive Prisma transactions (`prisma.$transaction`) with strict price checks inside the isolation block.
- **Trade-off**: Requires slightly longer lock duration per bid write. However, it guarantees absolute immunity to race conditions (e.g., two users placing a $20,000 bid at the exact same millisecond).

---

## 4. Anti-Sniping Window Duration

### Rationale
- **Decision**: Configurable default of 120 seconds (2 minutes).
- **Trade-off**: Auto-extending auctions can prolong an auction beyond its original end time if active bidding war ensues. This mimics real-world auction houses (like Bring a Trailer or BaT) to maximize seller revenue and ensure fair bidding.
