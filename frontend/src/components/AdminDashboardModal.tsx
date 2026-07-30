import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SystemMetrics, AuditLog, Auction } from '../types';
import { X, Activity, Shield, Database, Cpu, Clock, RefreshCw, Edit2, Play, Square, AlertCircle } from 'lucide-react';

interface AdminDashboardModalProps {
  onClose: () => void;
  onRefreshAuctions: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({ onClose, onRefreshAuctions }) => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'operations' | 'audit'>('metrics');
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingReserveId, setEditingReserveId] = useState<string | null>(null);
  const [newReservePrice, setNewReservePrice] = useState<string>('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [mRes, aRes, aucRes] = await Promise.all([
        api.getMetrics(),
        api.getAuditLogs(),
        api.getAuctions({ status: 'ALL' })
      ]);
      setMetrics(mRes);
      setAuditLogs(aRes.logs || []);
      setAuctions(aucRes.auctions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (auctionId: string, newStatus: string) => {
    try {
      await api.updateAuctionStatus(auctionId, newStatus);
      await loadData();
      onRefreshAuctions();
    } catch (e) {
      alert('Failed to update auction status');
    }
  };

  const handleUpdateReserve = async (auctionId: string) => {
    const val = parseFloat(newReservePrice);
    if (isNaN(val) || val <= 0) return;
    try {
      await api.updateReservePrice(auctionId, val);
      setEditingReserveId(null);
      setNewReservePrice('');
      await loadData();
      onRefreshAuctions();
    } catch (e) {
      alert('Failed to update reserve price');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">System Observability & Operations Hub</h2>
              <p className="text-xs text-slate-400">Live operational metrics, audit logs, and lifecycle controls</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl text-xs transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Stats</span>
            </button>
            <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-800/80 bg-slate-950/30 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-4 py-2.5 rounded-t-xl transition border-t border-x ${
              activeTab === 'metrics'
                ? 'bg-slate-900 border-slate-800 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            System Metrics & Health
          </button>
          <button
            onClick={() => setActiveTab('operations')}
            className={`px-4 py-2.5 rounded-t-xl transition border-t border-x ${
              activeTab === 'operations'
                ? 'bg-slate-900 border-slate-800 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Auction Lifecycle Controls ({auctions.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 rounded-t-xl transition border-t border-x ${
              activeTab === 'audit'
                ? 'bg-slate-900 border-slate-800 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Security Audit Logs ({auditLogs.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">

          {/* TAB 1: METRICS */}
          {activeTab === 'metrics' && metrics && (
            <div className="space-y-6 text-xs">
              
              {/* Stat Cards Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" /> Uptime
                  </div>
                  <div className="text-xl font-bold font-mono text-white">{metrics.system.uptimeSeconds}s</div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-amber-400" /> Memory RSS / Heap
                  </div>
                  <div className="text-xl font-bold font-mono text-amber-400">
                    {metrics.system.memoryMb.rss}MB / {metrics.system.memoryMb.heapUsed}MB
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" /> Active WS Sockets
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-400">{metrics.traffic.activeSockets}</div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 text-orange-400" /> Total Bids Processed
                  </div>
                  <div className="text-xl font-bold font-mono text-orange-400">{metrics.traffic.totalBidsPlaced}</div>
                </div>
              </div>

              {/* Latency Table */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <h3 className="font-bold text-white text-sm mb-3">API Route Latency Diagnostics</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                        <th className="py-2">Endpoint Route</th>
                        <th className="py-2">Hits</th>
                        <th className="py-2">Avg Latency (ms)</th>
                        <th className="py-2">Max Latency (ms)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {Object.entries(metrics.latencies).map(([route, stat]) => (
                        <tr key={route} className="hover:bg-slate-900/50">
                          <td className="py-2 font-semibold text-slate-200">{route}</td>
                          <td className="py-2 text-slate-400">{stat.count}</td>
                          <td className="py-2 text-emerald-400">{stat.avgMs} ms</td>
                          <td className="py-2 text-amber-400">{stat.maxMs} ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: OPERATIONS */}
          {activeTab === 'operations' && (
            <div className="space-y-4 text-xs">
              <div className="overflow-x-auto bg-slate-950 rounded-2xl border border-slate-800 p-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                      <th className="py-2">Auction Title</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Current Bid</th>
                      <th className="py-2">Reserve Price</th>
                      <th className="py-2 text-right">Lifecycle Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {auctions.map((auc) => (
                      <tr key={auc.id} className="hover:bg-slate-900/50">
                        <td className="py-3 font-semibold text-white max-w-xs truncate">{auc.title}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                            auc.status === 'LIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {auc.status}
                          </span>
                        </td>
                        <td className="py-3 font-mono font-bold text-slate-200">${auc.currentBid.toLocaleString()}</td>
                        <td className="py-3 font-mono text-slate-400">
                          {editingReserveId === auc.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={newReservePrice}
                                onChange={(e) => setNewReservePrice(e.target.value)}
                                className="w-20 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white"
                              />
                              <button onClick={() => handleUpdateReserve(auc.id)} className="bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded font-bold">Save</button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span>${auc.reservePrice.toLocaleString()}</span>
                              <button onClick={() => { setEditingReserveId(auc.id); setNewReservePrice(auc.reservePrice.toString()); }} className="text-slate-500 hover:text-cyan-400">
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            {auc.status !== 'LIVE' && (
                              <button
                                onClick={() => handleStatusChange(auc.id, 'LIVE')}
                                className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1"
                              >
                                <Play className="w-3 h-3" /> Set Live
                              </button>
                            )}
                            {auc.status === 'LIVE' && (
                              <button
                                onClick={() => handleStatusChange(auc.id, 'ENDED')}
                                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1"
                              >
                                <Square className="w-3 h-3" /> Force End
                              </button>
                            )}
                            {auc.status !== 'CANCELLED' && (
                              <button
                                onClick={() => handleStatusChange(auc.id, 'CANCELLED')}
                                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-2 py-1 rounded text-[11px] font-medium"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-4 text-xs">
              <div className="overflow-x-auto bg-slate-950 rounded-2xl border border-slate-800 p-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                      <th className="py-2">Timestamp</th>
                      <th className="py-2">Action</th>
                      <th className="py-2">User</th>
                      <th className="py-2">Entity</th>
                      <th className="py-2">Details JSON</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/50">
                        <td className="py-2 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="py-2 font-bold text-cyan-400">{log.action}</td>
                        <td className="py-2 text-slate-200">{log.user?.name || log.userId || 'System'}</td>
                        <td className="py-2 text-slate-400">{log.entityType} ({log.entityId?.slice(0, 6) || '-'})</td>
                        <td className="py-2 text-slate-500 max-w-xs truncate">{log.detailsJson || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
