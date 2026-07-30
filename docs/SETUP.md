# Local Setup & Quick Start Guide

Follow these instructions to run the **Bike Auction Platform** locally on your machine.

---

## Prerequisites

- **Node.js**: v18.0.0 or higher (v22 tested & verified)
- **NPM**: v9.0.0 or higher

---

## 1. Quick Start (Run Both Backend & Frontend)

### Step 1: Backend Setup
```bash
cd backend
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```
> The backend server will start on `http://localhost:5000`.

### Step 2: Frontend Setup (In a second terminal window)
```bash
cd frontend
npm install
npm run dev
```
> The frontend single-page application will start on `http://localhost:3000`.

---

## 2. Demo User Credentials

For seamless evaluation, the header toolbar contains a **"Demo Quick Login"** bar with instant 1-click login buttons. Alternatively, you can use these manual credentials:

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **BUYER (Alex)** | `buyer1@auction.com` | `password123` | Place live bids, set proxy auto-bidding |
| **BUYER (Elena)** | `buyer2@auction.com` | `password123` | Compete in live auctions |
| **SELLER (Moto Garage)** | `seller@auction.com` | `password123` | Publish new motorcycle listings |
| **ADMIN (Apex Admin)** | `admin@auction.com` | `password123` | Access Observability Dashboard, Audit Logs, Reserve Overrides |

---

## 3. Running Automated Tests

To execute the integration test suite:
```bash
cd backend
npm test
```
