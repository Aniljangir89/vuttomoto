import React, { useState, useEffect } from 'react';
import { Auction } from '../types';
import { Clock, Gauge, Award, Tag, ChevronRight, Heart, ShieldCheck, Zap, Store } from 'lucide-react';

interface AuctionCardProps {
  auction: Auction;
  onSelect: (auction: Auction) => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (auctionId: string, e: React.MouseEvent) => void;
}

export const AuctionCard: React.FC<AuctionCardProps> = ({
  auction,
  onSelect,
  isWatchlisted,
  onToggleWatchlist
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [urgencyClass, setUrgencyClass] = useState<string>('countdown-safe');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const targetTime = auction.status === 'SCHEDULED' 
        ? new Date(auction.startTime).getTime() 
        : new Date(auction.endTime).getTime();
      
      const now = new Date().getTime();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft('00:00:00');
        setUrgencyClass('text-slate-500');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const totalMins = diff / (1000 * 60);
      if (auction.status === 'LIVE') {
        if (totalMins < 5) {
          setUrgencyClass('countdown-critical text-red-400 font-bold');
        } else if (totalMins < 30) {
          setUrgencyClass('countdown-warning text-amber-400 font-semibold');
        } else {
          setUrgencyClass('countdown-safe text-emerald-400');
        }
      } else {
        setUrgencyClass('text-cyan-400');
      }

      const formatNum = (num: number) => num.toString().padStart(2, '0');
      setTimeLeft(`${formatNum(hours)}:${formatNum(minutes)}:${formatNum(seconds)}`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [auction.startTime, auction.endTime, auction.status]);

  let images: string[] = [];
  try {
    images = JSON.parse(auction.motorcycle.imagesJson || '[]');
  } catch (e) {
    images = ['https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80'];
  }
  const coverImage = images[0] || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80';

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const reserveMet = auction.currentBid >= auction.reservePrice;

  const getStatusBadge = () => {
    switch (auction.status) {
      case 'LIVE':
        return (
          <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 glow-live shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            LIVE
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-[11px] font-semibold px-2.5 py-1 rounded-full">
            UPCOMING
          </span>
        );
      case 'SOLD':
        return (
          <span className="bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[11px] font-bold px-2.5 py-1 rounded-full">
            SOLD
          </span>
        );
      case 'ENDED':
      case 'UNSOLD':
        return (
          <span className="bg-slate-800 border border-slate-700 text-slate-400 text-[11px] font-medium px-2.5 py-1 rounded-full">
            ENDED
          </span>
        );
      default:
        return (
          <span className="bg-red-500/20 border border-red-500/40 text-red-400 text-[11px] font-medium px-2.5 py-1 rounded-full">
            {auction.status}
          </span>
        );
    }
  };

  return (
    <div
      onClick={() => onSelect(auction)}
      className="group relative bg-slate-900/80 rounded-2xl overflow-hidden border border-slate-800 hover:border-orange-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10 flex flex-col cursor-pointer animate-slide-up"
    >
      {/* Image Thumbnail with Overlay Badges */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
        <img
          src={coverImage}
          alt={auction.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40" />

        {/* Top Badges & Watchlist Heart */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2">
            {getStatusBadge()}
            {reserveMet && (
              <span className="bg-slate-950/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Reserve Met
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-mono flex items-center gap-1 border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-orange-400" />
              <span className={urgencyClass}>{timeLeft}</span>
            </div>

            <button
              onClick={(e) => onToggleWatchlist(auction.id, e)}
              title={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
              className={`p-1.5 rounded-full backdrop-blur-md transition border ${
                isWatchlisted
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-lg shadow-rose-500/20'
                  : 'bg-slate-950/70 text-slate-400 hover:text-white border-slate-800 hover:bg-slate-900'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isWatchlisted ? 'fill-rose-400 text-rose-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Bottom Bike Year / Engine Badge */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span className="bg-slate-950/90 backdrop-blur-md text-slate-200 text-xs px-2 py-0.5 rounded-md font-mono font-medium border border-slate-800">
            {auction.motorcycle.year}
          </span>
          <span className="bg-slate-950/90 backdrop-blur-md text-amber-400 text-xs px-2 py-0.5 rounded-md font-mono font-medium border border-slate-800">
            {auction.motorcycle.engineCc} cc
          </span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="text-xs font-semibold text-orange-400 uppercase tracking-widest mb-1 flex items-center justify-between">
            <span>{auction.motorcycle.make}</span>
            <span className="text-[10px] text-slate-500 font-mono">ID: {auction.id.slice(0, 6)}</span>
          </div>
          <h2 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-1">
            {auction.title}
          </h2>
          <p className="text-xs text-slate-400 line-clamp-2 mt-1 font-sans">
            {auction.description}
          </p>

          {/* Seller Tag Badge */}
          <div className="text-[11px] text-amber-400 font-semibold flex items-center gap-1.5 mt-2.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg w-fit">
            <Store className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Seller: {auction.motorcycle.seller?.name || 'Verified Moto Dealer'}</span>
          </div>

          {/* Key Specs tags */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className="text-[11px] text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-700/50">
              <Gauge className="w-3 h-3 text-slate-400" />
              {auction.motorcycle.mileage.toLocaleString()} mi
            </span>
            <span className="text-[11px] text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-700/50">
              <Award className="w-3 h-3 text-slate-400" />
              {auction.motorcycle.condition}
            </span>
            <span className="text-[11px] text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-700/50">
              <Tag className="w-3 h-3 text-slate-400" />
              {auction.motorcycle.titleStatus} Title
            </span>
          </div>
        </div>

        {/* Financial & Bid Stats */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider">
              {auction.status === 'LIVE' ? 'Current High Bid' : 'Starting / Final Bid'}
            </div>
            <div className="text-xl font-black text-white font-mono tracking-tight">
              {formatCurrency(auction.currentBid > 0 ? auction.currentBid : auction.startingBid)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <Zap className="w-3 h-3 text-orange-400" />
              {auction._count?.bids || 0} bids
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 group-hover:bg-orange-500 group-hover:text-slate-950 transition-colors flex items-center justify-center">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
