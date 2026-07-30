import React from 'react';
import { Auction } from '../types';
import { AuctionCard } from './AuctionCard';
import { Search, Filter, ArrowUpDown, Heart } from 'lucide-react';

interface AuctionGridProps {
  auctions: Auction[];
  onSelectAuction: (auction: Auction) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  makeFilter: string;
  setMakeFilter: (make: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  watchlist: string[];
  onToggleWatchlist: (auctionId: string, e: React.MouseEvent) => void;
  isLoading?: boolean;
}

export const AuctionGrid: React.FC<AuctionGridProps> = ({
  auctions,
  onSelectAuction,
  statusFilter,
  setStatusFilter,
  makeFilter,
  setMakeFilter,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  watchlist,
  onToggleWatchlist,
  isLoading
}) => {
  const makes = ['ALL', 'Ducati', 'BMW', 'Kawasaki', 'Yamaha', 'Honda', 'Harley-Davidson'];

  return (
    <div className="space-y-6">
      {/* Search and Filters Header */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search make, model, specs..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto w-full md:w-auto">
          {['ALL', 'LIVE', 'SCHEDULED', 'SOLD'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === status
                  ? 'bg-orange-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Filters Dropdown Group */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={makeFilter}
              onChange={(e) => setMakeFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              {makes.map((m) => (
                <option key={m} value={m} className="bg-slate-900 text-white">
                  {m === 'ALL' ? 'All Makes' : m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-slate-900 text-white">Newest Listings</option>
              <option value="endingSoon" className="bg-slate-900 text-white">Ending Soonest</option>
              <option value="priceHighLow" className="bg-slate-900 text-white">Price: High to Low</option>
              <option value="priceLowHigh" className="bg-slate-900 text-white">Price: Low to High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 space-y-4">
              <div className="skeleton aspect-[16/10] w-full" />
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-1/2" />
              <div className="skeleton h-8 w-full" />
            </div>
          ))}
        </div>
      ) : auctions.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-3">🏍️</div>
          <h3 className="text-lg font-bold text-white mb-1">No Auctions Match Criteria</h3>
          <p className="text-xs text-slate-400">Try clearing filters or search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((auc) => (
            <AuctionCard
              key={auc.id}
              auction={auc}
              onSelect={onSelectAuction}
              isWatchlisted={watchlist.includes(auc.id)}
              onToggleWatchlist={onToggleWatchlist}
            />
          ))}
        </div>
      )}
    </div>
  );
};
