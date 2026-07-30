import React, { useState } from 'react';
import { User } from '../types';
import { Flame, Activity, LogIn, LogOut, PlusCircle, Volume2, VolumeX, Heart, Menu, X } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface HeaderProps {
  user: User | null;
  onQuickLogin: (role: string) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenCreateAuction: () => void;
  onOpenAdminDashboard: () => void;
  isConnected: boolean;
  watchlistCount: number;
  onToggleWatchlistFilter: () => void;
  isWatchlistOnly: boolean;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onQuickLogin,
  onOpenAuth,
  onLogout,
  onOpenCreateAuction,
  onOpenAdminDashboard,
  isConnected,
  watchlistCount,
  onToggleWatchlistFilter,
  isWatchlistOnly,
  soundEnabled,
  setSoundEnabled
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSound = () => {
    const next = !soundEnabled;
    soundManager.enabled = next;
    setSoundEnabled(next);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl">
      {/* Top Demo Login Toolbar - 100% Mobile Responsive */}
      <div className="bg-slate-900/90 border-b border-slate-800/60 px-3 sm:px-6 py-2 sm:py-1.5 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          
          {/* Demo switcher buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-2">
            <span className="font-semibold text-orange-400 flex items-center gap-1 text-[11px] shrink-0">
              <Flame className="w-3.5 h-3.5 text-orange-500" /> Demo Switcher:
            </span>
            <div className="grid grid-cols-2 sm:flex items-center gap-1.5 w-full sm:w-auto">
              <button
                onClick={() => onQuickLogin('BUYER')}
                className={`px-2.5 py-1 sm:py-0.5 rounded text-[11px] font-semibold transition text-center ${
                  user?.email === 'buyer1@auction.com'
                    ? 'bg-orange-500 text-white font-bold shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Buyer Alex
              </button>
              <button
                onClick={() => onQuickLogin('BUYER_2')}
                className={`px-2.5 py-1 sm:py-0.5 rounded text-[11px] font-semibold transition text-center ${
                  user?.email === 'buyer2@auction.com'
                    ? 'bg-orange-500 text-white font-bold shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Buyer Elena
              </button>
              <button
                onClick={() => onQuickLogin('SELLER')}
                className={`px-2.5 py-1 sm:py-0.5 rounded text-[11px] font-semibold transition text-center ${
                  user?.role === 'SELLER'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Seller Moto
              </button>
              <button
                onClick={() => onQuickLogin('ADMIN')}
                className={`px-2.5 py-1 sm:py-0.5 rounded text-[11px] font-semibold transition text-center ${
                  user?.role === 'ADMIN'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Admin Apex
              </button>
            </div>
          </div>

          {/* Status & Sound Controls */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
            <span className="text-[10px] text-slate-400 font-mono sm:hidden">Connection Status</span>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSound}
                title={soundEnabled ? 'Mute sound' : 'Enable sound'}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-orange-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
              </button>

              <span className="flex items-center gap-1.5 text-slate-400 pl-2 border-l border-slate-800">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-ping' : 'bg-red-500'}`} />
                <span className="text-[10px] font-mono">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Main Clean Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-amber-500 to-cyan-400 p-0.5 shadow-lg shadow-orange-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <span className="text-xl">🏍️</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-display font-black tracking-wider text-white uppercase">Vutto<span className="text-orange-500">Moto</span></h1>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-3">
          {/* Watchlist Filter Button */}
          <button
            onClick={onToggleWatchlistFilter}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition border ${
              isWatchlistOnly
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-lg shadow-rose-500/10'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
          >
            <Heart className={`w-4 h-4 ${isWatchlistOnly ? 'fill-rose-400 text-rose-400' : 'text-slate-400'}`} />
            <span>Watchlist</span>
            {watchlistCount > 0 && (
              <span className="bg-rose-500 text-white font-mono text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {watchlistCount}
              </span>
            )}
          </button>

          {user && (user.role === 'SELLER' || user.role === 'ADMIN') && (
            <button
              onClick={onOpenCreateAuction}
              className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition shadow-lg shadow-orange-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>List Motorcycle</span>
            </button>
          )}

          {user && user.role === 'ADMIN' && (
            <button
              onClick={onOpenAdminDashboard}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 px-3.5 py-2 rounded-xl text-xs font-semibold transition"
            >
              <Activity className="w-4 h-4" />
              <span>Observability & Admin</span>
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              <div className="text-right">
                <div className="text-xs font-semibold text-white flex items-center gap-1 justify-end">
                  {user.name}
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono uppercase ${
                    user.role === 'ADMIN' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' :
                    user.role === 'SELLER' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
              </div>
              <button
                onClick={onLogout}
                title="Logout"
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-xl text-xs transition border border-slate-800"
            >
              <LogIn className="w-4 h-4 text-orange-500" />
              <span>Sign In</span>
            </button>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={onToggleWatchlistFilter}
            className={`p-2 rounded-xl text-xs font-semibold border ${
              isWatchlistOnly
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-slate-900 text-slate-300 border-slate-800'
            }`}
          >
            <Heart className={`w-4 h-4 ${isWatchlistOnly ? 'fill-rose-400 text-rose-400' : 'text-slate-400'}`} />
          </button>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-900 text-slate-300 border border-slate-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 p-4 space-y-3 animate-slide-up">
          {user && (
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">{user.name}</div>
                <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-slate-800 text-orange-400 border border-orange-500/30">
                {user.role}
              </span>
            </div>
          )}

          {user && (user.role === 'SELLER' || user.role === 'ADMIN') && (
            <button
              onClick={() => { onOpenCreateAuction(); setMobileMenuOpen(false); }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-amber-500 text-slate-950 font-bold py-2.5 rounded-xl text-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>List Motorcycle</span>
            </button>
          )}

          {user && user.role === 'ADMIN' && (
            <button
              onClick={() => { onOpenAdminDashboard(); setMobileMenuOpen(false); }}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-cyan-400 border border-cyan-500/30 font-semibold py-2.5 rounded-xl text-xs"
            >
              <Activity className="w-4 h-4" />
              <span>Observability Dashboard</span>
            </button>
          )}

          {user ? (
            <button
              onClick={() => { onLogout(); setMobileMenuOpen(false); }}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-red-400 border border-red-500/30 font-semibold py-2.5 rounded-xl text-xs"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              onClick={() => { onOpenAuth(); setMobileMenuOpen(false); }}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 text-slate-950 font-bold py-2.5 rounded-xl text-xs"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
