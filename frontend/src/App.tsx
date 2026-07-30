import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Auction, User } from './types';
import { api } from './services/api';
import { socketService } from './services/socket';
import { soundManager } from './utils/audio';
import { Header } from './components/Header';
import { AuctionGrid } from './components/AuctionGrid';
import { AuctionDetailModal } from './components/AuctionDetailModal';
import { CreateAuctionModal } from './components/CreateAuctionModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { AuthModal } from './components/AuthModal';
import { Flame, Shield, Zap, Bell, CheckCircle2 } from 'lucide-react';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Watchlist state
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('vutto_watchlist') || '[]');
    } catch (e) {
      return [];
    }
  });
  const [isWatchlistOnly, setIsWatchlistOnly] = useState<boolean>(false);

  // Simulator bot state
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const simulatorTimerRef = useRef<any>(null);

  // Sound state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Toast System
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (title: string, message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev.slice(-4), { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Toggle watchlist
  const handleToggleWatchlist = (auctionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWatchlist((prev) => {
      const next = prev.includes(auctionId) ? prev.filter((id) => id !== auctionId) : [...prev, auctionId];
      localStorage.setItem('vutto_watchlist', JSON.stringify(next));
      return next;
    });
  };

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [makeFilter, setMakeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Check stored user session
  useEffect(() => {
    const token = localStorage.getItem('vutto_token');
    if (token) {
      api.getMe().then((res) => setUser(res.user)).catch(() => {
        localStorage.removeItem('vutto_token');
      });
    }
  }, []);

  // Fetch auctions
  const fetchAuctions = useCallback(async () => {
    try {
      const res = await api.getAuctions({
        status: statusFilter,
        make: makeFilter,
        search: searchQuery,
        sort: sortBy
      });
      setAuctions(res.auctions || []);
    } catch (e) {
      console.error('Failed to load auctions:', e);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, makeFilter, searchQuery, sortBy]);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  // Connect WebSocket & listen for global updates
  useEffect(() => {
    const socket = socketService.connect();
    setIsConnected(socket.connected);

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socketService.onMarketplaceUpdate((data: any) => {
      fetchAuctions();
      if (data?.currentBid) {
        addToast('New Live Bid Placed!', `Current high bid updated to $${data.currentBid.toLocaleString()}`, 'success');
      }
    });

    return () => {
      socketService.offMarketplaceUpdate();
    };
  }, [fetchAuctions]);

  // Automated Mock Live Bidding Simulator Bot
  useEffect(() => {
    if (isSimulating) {
      simulatorTimerRef.current = setInterval(async () => {
        const liveAuctions = auctions.filter((a) => a.status === 'LIVE');
        if (liveAuctions.length === 0) return;

        const randomAuc = liveAuctions[Math.floor(Math.random() * liveAuctions.length)];
        const inc = Math.random() > 0.5 ? 250 : 500;
        const nextAmount = (randomAuc.currentBid > 0 ? randomAuc.currentBid : randomAuc.startingBid) + inc;

        try {
          // Use buyer2 (Elena) as the bot bidder
          const loginRes = await api.quickLogin('BUYER_2');
          const token = loginRes.token;
          await fetch(`/api/auctions/${randomAuc.id}/bids`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ amount: nextAmount })
          });
          soundManager.playBidSuccess();
          addToast('Bot Counter-Bid', `Buyer Elena auto-bid $${nextAmount.toLocaleString()} on ${randomAuc.title.slice(0, 20)}...`, 'info');
        } catch (e) {}
      }, 7000);
    } else {
      if (simulatorTimerRef.current) clearInterval(simulatorTimerRef.current);
    }

    return () => {
      if (simulatorTimerRef.current) clearInterval(simulatorTimerRef.current);
    };
  }, [isSimulating, auctions]);

  const handleQuickLogin = async (role: string) => {
    try {
      const res = await api.quickLogin(role);
      localStorage.setItem('vutto_token', res.token);
      setUser(res.user);
      addToast('Role Switched', `Logged in as ${res.user.name} (${res.user.role})`, 'success');
    } catch (e) {
      console.error(e);
    }
  };

  const handleAuthSuccess = (loggedUser: User, token: string) => {
    localStorage.setItem('vutto_token', token);
    setUser(loggedUser);
    setIsAuthOpen(false);
    addToast('Welcome Back!', `Logged in as ${loggedUser.name}`, 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('vutto_token');
    setUser(null);
    addToast('Logged Out', 'Successfully signed out', 'info');
  };

  // Filtered auctions list (including watchlist filter)
  const displayedAuctions = isWatchlistOnly
    ? auctions.filter((a) => watchlist.includes(a.id))
    : auctions;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-x-hidden">
      
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto bg-slate-900/95 border border-slate-800 p-3.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-start gap-3 animate-toast-in text-xs"
          >
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/30">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white mb-0.5">{t.title}</div>
              <div className="text-slate-300 font-sans">{t.message}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Header Bar */}
      <Header
        user={user}
        onQuickLogin={handleQuickLogin}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenCreateAuction={() => setIsCreateOpen(true)}
        onOpenAdminDashboard={() => setIsAdminOpen(true)}
        isConnected={isConnected}
        watchlistCount={watchlist.length}
        onToggleWatchlistFilter={() => setIsWatchlistOnly(!isWatchlistOnly)}
        isWatchlistOnly={isWatchlistOnly}
        isSimulating={isSimulating}
        onToggleSimulate={() => setIsSimulating(!isSimulating)}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
      />

      {/* Hero Banner */}
      <div className="relative bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-b border-slate-800/80 py-10 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="space-y-3 max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              <Flame className="w-3.5 h-3.5 fill-orange-400" />
              <span>Premier Superbike & Vintage Auction Marketplace</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Live Bidding for High-Performance <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-cyan-400">Motorcycles</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Participate in real-time auctions with atomic concurrency protection, automated proxy bidding, and anti-sniping time extensions.
            </p>
          </div>

          {/* Quick Metrics Badge Banner */}
          <div className="grid grid-cols-2 gap-3 w-full md:w-auto shrink-0 font-mono text-xs">
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <div className="text-slate-400 text-[10px] uppercase flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-orange-400" /> Live Auctions
              </div>
              <div className="text-2xl font-black text-white mt-1">
                {auctions.filter(a => a.status === 'LIVE').length}
              </div>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <div className="text-slate-400 text-[10px] uppercase flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-cyan-400" /> Anti-Sniping
              </div>
              <div className="text-base font-bold text-cyan-400 mt-1">
                +2m Auto Ext.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <AuctionGrid
          auctions={displayedAuctions}
          onSelectAuction={(auc) => setSelectedAuction(auc)}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          makeFilter={makeFilter}
          setMakeFilter={setMakeFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortBy={sortBy}
          setSortBy={setSortBy}
          watchlist={watchlist}
          onToggleWatchlist={handleToggleWatchlist}
          isLoading={isLoading}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-slate-300">VUTTO MOTO</span> • Production-Grade Bike Auction Architecture
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>SQLite + Prisma</span>
            <span>•</span>
            <span>Socket.io Real-Time</span>
            <span>•</span>
            <span>Anti-Sniping Engine</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {selectedAuction && (
        <AuctionDetailModal
          auction={selectedAuction}
          user={user}
          onClose={() => setSelectedAuction(null)}
          onAuctionUpdated={fetchAuctions}
          onOpenAuth={() => setIsAuthOpen(true)}
        />
      )}

      {isCreateOpen && (
        <CreateAuctionModal
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => {
            setIsCreateOpen(false);
            fetchAuctions();
            addToast('Auction Created!', 'Your motorcycle auction is now live', 'success');
          }}
        />
      )}

      {isAdminOpen && (
        <AdminDashboardModal
          onClose={() => setIsAdminOpen(false)}
          onRefreshAuctions={fetchAuctions}
        />
      )}

      {isAuthOpen && (
        <AuthModal
          onClose={() => setIsAuthOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

    </div>
  );
}
