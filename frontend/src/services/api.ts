import { User, Auction, AuditLog, SystemMetrics, Role } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('vutto_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'An error occurred during API request');
  }
  return data as T;
}

export const api = {
  // Auth
  async register(body: { email: string; password: string; name: string; role: Role }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return handleResponse<{ user: User; token: string }>(res);
  },

  async login(body: { email: string; password: string }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return handleResponse<{ user: User; token: string }>(res);
  },

  async quickLogin(role: string) {
    const res = await fetch(`${API_BASE}/auth/quick-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    return handleResponse<{ user: User; token: string }>(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders()
    });
    return handleResponse<{ user: User }>(res);
  },

  // Auctions
  async getAuctions(params?: { status?: string; make?: string; search?: string; sort?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.make) query.append('make', params.make);
    if (params?.search) query.append('search', params.search);
    if (params?.sort) query.append('sort', params.sort);

    const res = await fetch(`${API_BASE}/auctions?${query.toString()}`, {
      headers: getHeaders()
    });
    return handleResponse<{ auctions: Auction[] }>(res);
  },

  async getAuction(id: string) {
    const res = await fetch(`${API_BASE}/auctions/${id}`, {
      headers: getHeaders()
    });
    return handleResponse<{ auction: Auction }>(res);
  },

  async createAuction(body: any) {
    const res = await fetch(`${API_BASE}/auctions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    return handleResponse<{ auction: Auction }>(res);
  },

  async updateAuctionStatus(id: string, status: string) {
    const res = await fetch(`${API_BASE}/auctions/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    return handleResponse<{ auction: Auction }>(res);
  },

  async updateReservePrice(id: string, reservePrice: number) {
    const res = await fetch(`${API_BASE}/auctions/${id}/reserve-price`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ reservePrice })
    });
    return handleResponse<{ auction: Auction }>(res);
  },

  // Bids
  async placeBid(auctionId: string, amount: number, maxProxyAmount?: number) {
    const res = await fetch(`${API_BASE}/auctions/${auctionId}/bids`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount, maxProxyAmount })
    });
    return handleResponse<{ bid: any; auction: Auction; extendedByAntiSnipe?: boolean }>(res);
  },

  // Metrics & Observability
  async getMetrics() {
    const res = await fetch(`${API_BASE}/metrics`, {
      headers: getHeaders()
    });
    return handleResponse<SystemMetrics>(res);
  },

  async getAuditLogs() {
    const res = await fetch(`${API_BASE}/audit-logs`, {
      headers: getHeaders()
    });
    return handleResponse<{ logs: AuditLog[] }>(res);
  }
};
