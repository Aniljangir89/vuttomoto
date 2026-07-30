import React, { useState, useEffect } from 'react';
import { Auction, User, Bid } from '../types';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { soundManager } from '../utils/audio';
import { X, Clock, ShieldCheck, Zap, AlertTriangle, Eye, CheckCircle2, History, TrendingUp, CheckSquare, Store } from 'lucide-react';

interface AuctionDetailModalProps {
  auction: Auction;
  user: User | null;
  onClose: () => void;
  onAuctionUpdated: () => void;
  onOpenAuth: () => void;
}

export const AuctionDetailModal: React.FC<AuctionDetailModalProps> = ({
  auction: initialAuction,
  user,
  onClose,
  onAuctionUpdated,
  onOpenAuth
}) => {
  const [auction, setAuction] = useState<Auction>(initialAuction);
  const [bids, setBids] = useState<Bid[]>(initialAuction.bids || []);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'inspection' | 'analytics'>('overview');
  const [customBidAmount, setCustomBidAmount] = useState<string>('');
  const [maxProxyAmount, setMaxProxyAmount] = useState<string>('');
  const [enableProxy, setEnableProxy] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [antiSnipeNotification, setAntiSnipeNotification] = useState<boolean>(false);
  const [viewerCount, setViewerCount] = useState<number>(1);
  const [timeLeft, setTimeLeft] = useState<string>('');

  let images: string[] = [];
  try {
    images = JSON.parse(auction.motorcycle.imagesJson || '[]');
  } catch (e) {
    images = ['https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80'];
  }

  let specs: Record<string, any> = {};
  try {
    specs = JSON.parse(auction.motorcycle.specsJson || '{}');
  } catch (e) {
    specs = {};
  }

  // Fetch full auction details with complete bid history from database on modal mount
  useEffect(() => {
    api.getAuction(initialAuction.id).then((res) => {
      if (res.auction) {
        setAuction(res.auction);
        if (res.auction.bids) {
          setBids(res.auction.bids);
        }
      }
    }).catch(console.error);
  }, [initialAuction.id]);

  // Subscribe to Socket.io room for live bid updates
  useEffect(() => {
    socketService.joinAuction(auction.id);

    const handleBidUpdated = (data: any) => {
      if (data.auctionId === auction.id) {
        setAuction((prev) => ({
          ...prev,
          currentBid: data.currentBid,
          winningUserId: data.winningUserId,
          endTime: data.endTime
        }));

        if (data.bid) {
          setBids((prev) => [data.bid, ...prev]);
          if (user && data.bid.userId !== user.id) {
            soundManager.playOutbidAlert();
          }
        }

        if (data.extendedByAntiSnipe) {
          soundManager.playAntiSnipe();
          setAntiSnipeNotification(true);
          setTimeout(() => setAntiSnipeNotification(false), 8000);
        }
      }
    };

    const handleStatusChanged = (data: any) => {
      if (data.auctionId === auction.id) {
        setAuction((prev) => ({
          ...prev,
          status: data.status,
          winningUserId: data.winningUserId
        }));
      }
    };

    const handleViewerCount = (data: { auctionId: string; count: number }) => {
      if (data.auctionId === auction.id) {
        setViewerCount(data.count);
      }
    };

    socketService.onBidUpdated(handleBidUpdated);
    socketService.onAuctionStatusChanged(handleStatusChanged);
    socketService.onViewerCountUpdate(handleViewerCount);

    return () => {
      socketService.offBidUpdated(handleBidUpdated);
      socketService.offAuctionStatusChanged(handleStatusChanged);
      socketService.offViewerCountUpdate(handleViewerCount);
      socketService.leaveAuction(auction.id);
    };
  }, [auction.id, user]);

  // Live Timer Countdown Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date().getTime();
      const end = new Date(auction.endTime).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('AUCTION ENDED');
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [auction.endTime]);

  const minNextBid = auction.currentBid > 0 
    ? auction.currentBid + auction.minBidIncrement 
    : auction.startingBid;

  const handleQuickBid = async (increment: number) => {
    const targetAmount = auction.currentBid > 0 ? auction.currentBid + increment : auction.startingBid + increment;
    await submitBid(targetAmount);
  };

  const handleCustomBid = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(customBidAmount);
    if (isNaN(amount)) {
      setErrorMessage('Please enter a valid bid amount');
      return;
    }
    const proxy = enableProxy && maxProxyAmount ? parseFloat(maxProxyAmount) : undefined;
    await submitBid(amount, proxy);
  };

  const isSeller = user && (user.id === auction?.motorcycle?.sellerId || user.email === auction?.motorcycle?.seller?.email || user.role === 'ADMIN');

  const handleSellerAction = async (status: string) => {
    try {
      setIsSubmitting(true);
      const res = await api.updateAuctionStatus(auction.id, status);
      if (res.auction) {
        setAuction((prev) => ({
          ...prev,
          ...res.auction,
          motorcycle: res.auction.motorcycle || prev.motorcycle
        }));
      }
      onAuctionUpdated();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitBid = async (amount: number, proxyCap?: number) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const res = await api.placeBid(auction.id, amount, proxyCap);
      soundManager.playBidSuccess();
      setCustomBidAmount('');
      setMaxProxyAmount('');
      if (res.auction) {
        setAuction((prev) => ({
          ...prev,
          ...res.auction,
          motorcycle: res.auction.motorcycle || prev.motorcycle
        }));
      }
      // Re-fetch complete bid history from DB
      const fresh = await api.getAuction(auction.id);
      if (fresh.auction && fresh.auction.bids) {
        setBids(fresh.auction.bids);
      }
      onAuctionUpdated();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to place bid');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatUSD = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const reserveMet = auction.currentBid >= auction.reservePrice;

  // Render SVG Price Escalation Chart
  const renderPriceChart = () => {
    const sortedBids = [...bids].reverse();
    if (sortedBids.length < 2) {
      return (
        <div className="p-6 text-center text-xs text-slate-500">
          Not enough bid history data points to generate price escalation chart.
        </div>
      );
    }

    const amounts = sortedBids.map((b) => b.amount);
    const maxVal = Math.max(...amounts);
    const minVal = Math.min(...amounts);
    const range = maxVal - minVal || 1;

    const width = 400;
    const height = 140;
    const padding = 20;

    const points = amounts.map((amt, idx) => {
      const x = padding + (idx / (amounts.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((amt - minVal) / range) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-semibold uppercase flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Price Escalation Trajectory
          </span>
          <span className="text-emerald-400 font-mono font-bold">
            +{Math.round(((maxVal - minVal) / minVal) * 100)}% Growth
          </span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28 sm:h-32 overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <polyline
            fill="none"
            stroke="#f97316"
            strokeWidth="3"
            points={points}
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 lg:p-6 overflow-y-auto bg-slate-950/90 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl my-auto animate-scale-in max-h-[92vh] flex flex-col">
        
        {/* Anti-Sniping Real-time Notification Banner */}
        {antiSnipeNotification && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2 font-bold text-xs flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>ANTI-SNIPING TRIGGERED: Auction end time extended by +2 Minutes!</span>
            </div>
          </div>
        )}

        {/* Top Header Controls */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">
                {auction.motorcycle.make}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 font-mono">
                ID: {auction.id.slice(0, 6)}
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-display font-black text-white line-clamp-1">{auction.title}</h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="bg-slate-800/80 text-cyan-400 border border-cyan-500/30 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span>{viewerCount}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Scrollable on small mobile screens) */}
        <div className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 pt-3 border-b border-slate-800/80 bg-slate-950/30 text-xs font-semibold overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 sm:px-4 py-2 rounded-t-xl transition whitespace-nowrap border-t border-x ${
              activeTab === 'overview'
                ? 'bg-slate-900 border-slate-800 text-orange-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Overview & Specs
          </button>
          <button
            onClick={() => setActiveTab('inspection')}
            className={`px-3 sm:px-4 py-2 rounded-t-xl transition whitespace-nowrap border-t border-x ${
              activeTab === 'inspection'
                ? 'bg-slate-900 border-slate-800 text-orange-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> 15-Point Inspection
            </span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 sm:px-4 py-2 rounded-t-xl transition whitespace-nowrap border-t border-x ${
              activeTab === 'analytics'
                ? 'bg-slate-900 border-slate-800 text-orange-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> Price Analytics
            </span>
          </button>
        </div>

        {/* Modal Body Layout (Scrollable container) */}
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto flex-1">
          
          {/* Left Column (7 cols on desktop, full width on mobile) */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6">

            {activeTab === 'overview' && (
              <>
                {/* Main Image Viewer */}
                <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl">
                  <img
                    src={images[selectedImageIndex] || images[0]}
                    alt={auction.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                      auction.status === 'LIVE' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {auction.status}
                    </span>
                  </div>
                </div>

                {/* Thumbnail selector */}
                {images.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`relative w-16 sm:w-20 h-12 sm:h-14 rounded-lg overflow-hidden border-2 transition shrink-0 ${
                          selectedImageIndex === idx ? 'border-orange-500 opacity-100' : 'border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Seller Provenance & Info Card */}
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold text-sm shrink-0">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-white">{auction?.motorcycle?.seller?.name || 'Verified Moto Garage'}</span>
                        <span className="bg-amber-500/10 text-amber-400 text-[9px] px-1.5 py-0.2 rounded font-mono uppercase font-bold border border-amber-500/30">VERIFIED SELLER</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">{auction?.motorcycle?.seller?.email || 'seller@auction.com'}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 justify-end">
                      <ShieldCheck className="w-3.5 h-3.5" /> Trusted Dealer
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block">Seller ID: {auction?.motorcycle?.sellerId ? auction.motorcycle.sellerId.slice(0, 8) : 'S-8482'}</span>
                  </div>
                </div>

                {/* Description */}
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Seller Notes & Overview</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{auction.description}</p>
                </div>

                {/* Detailed Technical Specs Table */}
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Verified Technical Specifications</h3>
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase">Engine Capacity</span>
                      <span className="font-mono font-bold text-white text-xs sm:text-sm">{auction?.motorcycle?.engineCc || 998} cc</span>
                    </div>
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase">Odometer</span>
                      <span className="font-mono font-bold text-white text-xs sm:text-sm">{auction?.motorcycle?.mileage ? auction.motorcycle.mileage.toLocaleString() : '0'} mi</span>
                    </div>
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase">Condition Grade</span>
                      <span className="font-mono font-bold text-orange-400 text-xs sm:text-sm">{auction?.motorcycle?.condition || 'Mint'}</span>
                    </div>
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase">Title Status</span>
                      <span className="font-mono font-bold text-emerald-400 text-xs sm:text-sm">{auction?.motorcycle?.titleStatus || 'Clean'} Title</span>
                    </div>

                    {Object.entries(specs).map(([key, val]) => (
                      <div key={key} className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block text-[10px] uppercase">{key}</span>
                        <span className="font-mono font-medium text-slate-200 text-xs truncate block">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'inspection' && (
              <div className="bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <h3 className="font-bold text-white">Certified Master Mechanic Inspection Report</h3>
                      <p className="text-[10px] text-slate-400">Inspected & Verified by Technical Auditors</p>
                    </div>
                  </div>
                  <span className="self-start sm:self-auto bg-emerald-500/20 text-emerald-400 font-bold px-2.5 py-1 rounded-full border border-emerald-500/40 text-[10px]">
                    GRADE 100/100
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { title: 'Frame Integrity & Alignment', status: 'PASS - Zero stress cracks' },
                    { title: 'Engine Compression Check', status: 'PASS - Factory 13.5:1 specs' },
                    { title: 'Transmission & Quickshifter', status: 'PASS - Smooth engagement' },
                    { title: 'Brembo Brake Systems', status: 'PASS - 90% Pad life' },
                    { title: 'Öhlins Suspension Seals', status: 'PASS - No leaks detected' },
                    { title: 'Electrical & ECU Diagnostics', status: 'PASS - Zero error codes' }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                      <div className="font-bold text-slate-200">{item.title}</div>
                      <div className="text-[11px] text-emerald-400 font-mono mt-0.5">{item.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-4">
                {renderPriceChart()}
              </div>
            )}

          </div>

          {/* Right Column: Live Bidding Console & Feed (5 cols on desktop) */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-6">

            {/* Current Price & Timer Console Box */}
            <div className="bg-gradient-to-b from-slate-950 to-slate-900 p-4 sm:p-6 rounded-2xl border border-orange-500/30 neon-border-orange space-y-4">
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Current High Bid</span>
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono">{formatUSD(auction.currentBid > 0 ? auction.currentBid : auction.startingBid)}</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider block flex items-center gap-1 justify-end">
                    <Clock className="w-3.5 h-3.5 text-orange-400" /> Remaining
                  </span>
                  <span className="text-base sm:text-lg font-bold font-mono text-orange-400">{timeLeft}</span>
                </div>
              </div>

              {/* Reserve Price Met Tag */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <span className="text-slate-400">Reserve Price:</span>
                {reserveMet ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-4 h-4" /> Reserve Met
                  </span>
                ) : (
                  <span className="text-amber-400 font-medium text-[11px]">Reserve Not Met (${auction.reservePrice.toLocaleString()})</span>
                )}
              </div>

              {/* Anti-Sniping Protection Notice */}
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Anti-Sniping: Bids in final 2m extend clock by 2m.</span>
              </div>

              {/* Bidding Control Panel */}
              {auction.status === 'LIVE' ? (
                <div className="space-y-3 pt-1">
                  
                  {errorMessage && (
                    <div className="bg-red-500/10 border border-red-500/40 p-2.5 rounded-xl text-xs text-red-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Quick Bid Increment Buttons */}
                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">
                      1-Click Instant Bids
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[250, 500, 1000].map((inc) => (
                        <button
                          key={inc}
                          onClick={() => handleQuickBid(inc)}
                          disabled={isSubmitting}
                          className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs transition border border-slate-700 hover:border-orange-500/40 disabled:opacity-50"
                        >
                          +${inc}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Bid Input */}
                  <form onSubmit={handleCustomBid} className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                          Custom Bid (Min: {formatUSD(minNextBid)})
                        </label>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono">$</span>
                        <input
                          type="number"
                          value={customBidAmount}
                          onChange={(e) => setCustomBidAmount(e.target.value)}
                          placeholder={minNextBid.toString()}
                          min={minNextBid}
                          step={auction.minBidIncrement}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    {/* Proxy Auto-Bidding Toggle */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-slate-300 font-medium cursor-pointer flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={enableProxy}
                            onChange={(e) => setEnableProxy(e.target.checked)}
                            className="rounded bg-slate-800 border-slate-700 text-orange-500 focus:ring-0 cursor-pointer"
                          />
                          <span>Enable Proxy Auto-Bidding</span>
                        </label>
                      </div>

                      {enableProxy && (
                        <div className="pt-1">
                          <input
                            type="number"
                            value={maxProxyAmount}
                            onChange={(e) => setMaxProxyAmount(e.target.value)}
                            placeholder="Maximum Auto-Bid Ceiling ($)"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">
                            System will counter-bid up to your cap.
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-slate-950 font-black py-3 rounded-xl text-xs transition shadow-lg shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4 fill-slate-950" />
                      <span>{isSubmitting ? 'Transmitting Bid...' : 'PLACE CONFIRMED BID'}</span>
                    </button>
                  </form>

                  {/* Seller Direct Actions */}
                  {isSeller && auction.status === 'LIVE' && (
                    <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/30 space-y-2 mt-3">
                      <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                        <Store className="w-3.5 h-3.5" /> Seller Controls
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleSellerAction('ENDED')}
                          disabled={isSubmitting || bids.length === 0}
                          className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-2 rounded-lg text-[11px] transition disabled:opacity-40"
                        >
                          Accept Bid & Sell Now
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSellerAction('CANCELLED')}
                          disabled={isSubmitting}
                          className="bg-slate-800 hover:bg-slate-700 text-red-400 font-semibold py-2 rounded-lg text-[11px] border border-slate-700 disabled:opacity-40"
                        >
                          Cancel Listing
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-900 p-3 rounded-xl text-center border border-slate-800">
                  <span className="text-xs font-bold text-slate-400">
                    Bidding is closed ({auction.status})
                  </span>
                </div>
              )}
            </div>

            {/* Real-time Bid History Feed */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-orange-400" /> Live Activity Feed ({bids.length})
                </h3>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {bids.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No bids placed yet. Be the first to bid!</p>
                ) : (
                  bids.map((b, idx) => (
                    <div
                      key={b.id || idx}
                      className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                        idx === 0
                          ? 'bg-orange-500/10 border-orange-500/30 text-white font-semibold'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-6 sm:w-7 h-6 sm:h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          idx === 0 ? 'bg-orange-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {b.user?.name?.slice(0, 2).toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-200 truncate max-w-[100px] sm:max-w-[140px]">{b.user?.name || 'Bidder'}</div>
                          <div className="text-[9px] sm:text-[10px] text-slate-500 font-mono">
                            {new Date(b.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-xs text-white">{formatUSD(b.amount)}</div>
                        {idx === 0 && <span className="text-[8px] sm:text-[9px] text-orange-400 font-bold uppercase tracking-wider block">HIGH BIDDER</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
