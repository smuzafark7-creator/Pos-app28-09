import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { KdsCard } from '../components/kitchen/KdsCard';
import { 
  KDS_STATUS_OPTIONS, 
  KDS_ORDER_TYPE_OPTIONS, 
  KdsOrderType,
  matchesKdsStatus, 
  matchesKdsOrderType, 
  getKdsStatusCounts, 
  getKdsTypeCounts 
} from '../components/kitchen/kdsFilters';
import { 
  Columns3, 
  LayoutGrid, 
  UtensilsCrossed, 
  RotateCcw, 
  Check, 
  Flame, 
  CheckCircle 
} from 'lucide-react';
import { BrandWatermark } from '../components/BrandWatermark';

export const KOTPage: React.FC = () => {
  const { filteredKots, menuItems, updateKOTStatus } = useApp();
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<KdsOrderType>('All Types');
  const [viewMode, setViewMode] = useState<'columns' | 'grid'>('columns');
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Auto-refresh timer for elapsed times every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Live status counts computed across tickets matching current order type
  const counts = useMemo(() => {
    return getKdsStatusCounts(filteredKots, 'All Stations', menuItems, typeFilter);
  }, [filteredKots, menuItems, typeFilter]);

  // Live order type counts computed for active tickets (New, Preparing, Ready)
  const typeCounts = useMemo(() => {
    return getKdsTypeCounts(filteredKots, 'All Stations', menuItems);
  }, [filteredKots, menuItems]);

  // All valid tickets (excluding completely voided/cancelled tickets)
  const validKots = useMemo(() => {
    return filteredKots.filter(k => k.status !== 'cancelled');
  }, [filteredKots]);

  // KOTs filtered by selected Order Type
  const typeFilteredKots = useMemo(() => {
    return validKots.filter(k => matchesKdsOrderType(k, typeFilter));
  }, [validKots, typeFilter]);

  // Active tickets (non-served, non-cancelled) for 3-Column board
  const activeKots = useMemo(() => {
    return typeFilteredKots
      .filter(k => k.status !== 'served')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [typeFilteredKots]);

  const newKots = useMemo(() => activeKots.filter(k => k.status === 'new'), [activeKots]);
  const preparingKots = useMemo(() => activeKots.filter(k => k.status === 'preparing'), [activeKots]);
  const readyKots = useMemo(() => activeKots.filter(k => k.status === 'ready' || k.status === 'picked_up'), [activeKots]);

  // Final displayed KOTs when in grid view or status-filtered
  const displayedKots = useMemo(() => {
    if (statusFilter === 'All') {
      return [...typeFilteredKots].sort((a, b) => {
        // Active tickets first, served tickets last (newest served first)
        if (a.status === 'served' && b.status !== 'served') return 1;
        if (a.status !== 'served' && b.status === 'served') return -1;
        if (a.status === 'served' && b.status === 'served') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    }
    if (statusFilter === 'New') {
      return typeFilteredKots
        .filter(k => k.status === 'new')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    if (statusFilter === 'Preparing') {
      return typeFilteredKots
        .filter(k => k.status === 'preparing')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    if (statusFilter === 'Ready') {
      return typeFilteredKots
        .filter(k => k.status === 'ready')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    if (statusFilter === 'Picked Up') {
      return typeFilteredKots
        .filter(k => k.status === 'picked_up')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    if (statusFilter === 'Served' || statusFilter === 'Served / Completed') {
      return typeFilteredKots
        .filter(k => k.status === 'served')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return typeFilteredKots.filter(k => matchesKdsStatus(k, statusFilter));
  }, [typeFilteredKots, statusFilter]);

  return (
    <div 
      className="flex-1 min-h-screen flex flex-col bg-[#0a0f1d] text-slate-100 font-sans pb-16 relative"
      style={{ backgroundColor: '#0a0f1d' }}
    >
      {/* Bilaal Restaurant Crest Watermark */}
      <BrandWatermark opacity={0.10} />

      {/* 1. POS-THEMED SUB-HEADER FILTER BAR */}
      <div 
        className="kot-filter-bar shrink-0 w-full px-4 py-2.5 border-b flex items-center justify-between gap-3 sm:gap-4 shadow-xs overflow-x-auto select-none sticky top-0 z-20 backdrop-blur-md"
        style={{ backgroundColor: '#0a0f18', borderColor: '#1e293b' }}
      >
        {/* Left Section: Status Filter Pills */}
        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto ml-2 sm:ml-4">
          {KDS_STATUS_OPTIONS.map(opt => {
            const count = counts[opt.key] ?? 0;
            const isActive = statusFilter === opt.key;

            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setStatusFilter(opt.key)}
                className={`kot-filter-pill px-3 py-1.5 text-xs whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 rounded-lg font-bold ${
                  isActive ? 'kot-filter-pill-active' : 'kot-filter-pill-inactive'
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: '#8b0000',
                        color: '#ffffff',
                        fontWeight: 800,
                        border: '1px solid #b91c1c'
                      }
                    : {
                        backgroundColor: '#0f172a',
                        color: '#f1f5f9',
                        fontWeight: 700,
                        border: '1px solid #334155'
                      }
                }
              >
                <span className="kot-pill-label" style={{ color: isActive ? '#ffffff' : '#f1f5f9' }}>{opt.label}</span>
                <span 
                  className="kot-count-badge px-1.5 py-0.2 rounded-full text-[11px]"
                  style={{ 
                    backgroundColor: isActive ? 'rgba(0,0,0,0.3)' : 'rgba(51, 65, 85, 0.6)',
                    color: isActive ? '#ffffff' : '#f1f5f9', 
                    fontWeight: 800 
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Middle/Right Section: Order Type Filter Pills + Reset + View Controls */}
        <div className="flex items-center gap-3 shrink-0 ml-auto">
          {/* Order Type Filter Pills (All Types, Dine In, Takeaway, Delivery) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {KDS_ORDER_TYPE_OPTIONS.map(opt => {
              const count = typeCounts[opt.key] ?? 0;
              const isActive = typeFilter === opt.key;

              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setTypeFilter(opt.key)}
                  className={`kot-filter-pill px-3 py-1.5 text-xs whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 rounded-lg font-bold ${
                    isActive ? 'kot-filter-pill-active' : 'kot-filter-pill-inactive'
                  }`}
                  style={
                    isActive
                      ? {
                          backgroundColor: '#8b0000',
                          color: '#ffffff',
                          fontWeight: 800,
                          border: '1px solid #b91c1c'
                        }
                      : {
                          backgroundColor: '#0f172a',
                          color: '#f1f5f9',
                          fontWeight: 700,
                          border: '1px solid #334155'
                        }
                  }
                >
                  <span className="kot-pill-label" style={{ color: isActive ? '#ffffff' : '#f1f5f9' }}>{opt.label}</span>
                  <span 
                    className="kot-count-badge px-1.5 py-0.2 rounded-full text-[11px]"
                    style={{ 
                      backgroundColor: isActive ? 'rgba(0,0,0,0.3)' : 'rgba(51, 65, 85, 0.6)',
                      color: isActive ? '#ffffff' : '#f1f5f9', 
                      fontWeight: 800 
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Reset Button if filters active */}
          {(statusFilter !== 'All' || typeFilter !== 'All Types') && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('All');
                setTypeFilter('All Types');
              }}
              className="kot-btn-reset flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
              style={{
                backgroundColor: '#0f172a',
                color: '#cbd5e1',
                border: '1px solid #334155'
              }}
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>Reset</span>
            </button>
          )}

          {/* Far Right Section: View Toggle Controls (Columns / All Grid) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('columns')}
              className={`kot-btn-columns px-3 py-1.5 text-xs flex items-center gap-1.5 rounded-lg transition-colors cursor-pointer font-bold ${
                viewMode === 'columns' ? 'kot-btn-columns-active' : ''
              }`}
              style={
                viewMode === 'columns'
                  ? {
                      backgroundColor: '#1e3a8a',
                      color: '#ffffff',
                      border: '1px solid rgba(59, 130, 246, 0.5)'
                    }
                  : {
                      backgroundColor: '#0f172a',
                      color: '#cbd5e1',
                      border: '1px solid #334155'
                    }
              }
              title="3-Column Workflow (New Orders | Preparing | Ready to Serve)"
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Columns</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`kot-btn-grid px-3 py-1.5 text-xs flex items-center gap-1.5 rounded-lg transition-colors cursor-pointer font-bold ${
                viewMode === 'grid' ? 'kot-btn-grid-active' : ''
              }`}
              style={
                viewMode === 'grid'
                  ? {
                      backgroundColor: '#1e3a8a',
                      color: '#ffffff',
                      border: '1px solid rgba(59, 130, 246, 0.5)'
                    }
                  : {
                      backgroundColor: '#0f172a',
                      color: '#cbd5e1',
                      border: '1px solid #334155'
                    }
              }
              title="Unified Auto-Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>All Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. KOT VIEWPORT: 3-Column Workflow Board OR Full-Width Grid */}
      {statusFilter === 'All' && viewMode === 'columns' ? (
        <div className="flex-1 min-h-0 w-full px-4 py-3 flex flex-col overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start w-full">
            {/* 1. NEW ORDERS COLUMN */}
            <div 
              className="kot-column-box flex flex-col min-w-0 p-3 rounded-2xl border"
              style={{ backgroundColor: '#0b1120', borderColor: '#1e293b' }}
            >
              <div 
                onClick={() => setStatusFilter('New')}
                className="kot-col-header shrink-0 p-3 rounded-xl border flex items-center justify-between shadow-xs mb-3 cursor-pointer hover:border-slate-500 transition-colors"
                style={{ backgroundColor: '#0d1527', borderColor: '#1e293b' }}
                title="Click to filter to New Orders only"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span 
                    className="text-xs uppercase tracking-wider font-bold"
                    style={{ color: '#cbd5e1', fontWeight: 700 }}
                  >
                    1. NEW ORDERS
                  </span>
                </div>
                <span 
                  className="kot-col-badge kot-col-badge-new px-2.5 py-0.5 rounded-full text-xs font-extrabold text-white shadow-xs"
                  style={{ backgroundColor: '#8b0000', color: '#ffffff', border: '1px solid rgba(244, 63, 94, 0.5)' }}
                >
                  {newKots.length}
                </span>
              </div>
              <div className="space-y-4">
                {newKots.length === 0 ? (
                  <div 
                    className="h-48 sm:h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs rounded-xl border border-dashed"
                    style={{ backgroundColor: '#0d1527', borderColor: '#1e293b' }}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 mb-2">
                      <Check className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-slate-300">No new orders waiting</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Incoming KOTs will show here</span>
                  </div>
                ) : (
                  newKots.map(kot => (
                    <KdsCard
                      key={kot.id}
                      kot={kot}
                      currentTime={currentTime}
                      onUpdateStatus={updateKOTStatus}
                      mode="cashier"
                    />
                  ))
                )}
              </div>
            </div>

            {/* 2. PREPARING COLUMN */}
            <div 
              className="kot-column-box flex flex-col min-w-0 p-3 rounded-2xl border"
              style={{ backgroundColor: '#0b1120', borderColor: '#1e293b' }}
            >
              <div 
                onClick={() => setStatusFilter('Preparing')}
                className="kot-col-header shrink-0 p-3 rounded-xl border flex items-center justify-between shadow-xs mb-3 cursor-pointer hover:border-slate-500 transition-colors"
                style={{ backgroundColor: '#0d1527', borderColor: '#1e293b' }}
                title="Click to filter to Preparing orders only"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span 
                    className="text-xs uppercase tracking-wider font-bold"
                    style={{ color: '#cbd5e1', fontWeight: 700 }}
                  >
                    2. PREPARING
                  </span>
                </div>
                <span 
                  className="kot-col-badge kot-col-badge-prep px-2.5 py-0.5 rounded-full text-xs font-extrabold text-white shadow-xs"
                  style={{ backgroundColor: '#d97706', color: '#ffffff', border: '1px solid rgba(245, 158, 11, 0.5)' }}
                >
                  {preparingKots.length}
                </span>
              </div>
              <div className="space-y-4">
                {preparingKots.length === 0 ? (
                  <div 
                    className="h-48 sm:h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs rounded-xl border border-dashed"
                    style={{ backgroundColor: '#0d1527', borderColor: '#1e293b' }}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 mb-2">
                      <Flame className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-slate-300">No orders in preparation</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Orders in prep will show here</span>
                  </div>
                ) : (
                  preparingKots.map(kot => (
                    <KdsCard
                      key={kot.id}
                      kot={kot}
                      currentTime={currentTime}
                      onUpdateStatus={updateKOTStatus}
                      mode="cashier"
                    />
                  ))
                )}
              </div>
            </div>

            {/* 3. READY TO SERVE / DISPATCH COLUMN */}
            <div 
              className="kot-column-box flex flex-col min-w-0 p-3 rounded-2xl border"
              style={{ backgroundColor: '#0b1120', borderColor: '#1e293b' }}
            >
              <div 
                onClick={() => setStatusFilter('Ready')}
                className="kot-col-header shrink-0 p-3 rounded-xl border flex items-center justify-between shadow-xs mb-3 cursor-pointer hover:border-slate-500 transition-colors"
                style={{ backgroundColor: '#0d1527', borderColor: '#1e293b' }}
                title="Click to filter to Ready orders only"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span 
                    className="text-xs uppercase tracking-wider font-bold"
                    style={{ color: '#cbd5e1', fontWeight: 700 }}
                  >
                    3. READY / DISPATCH
                  </span>
                </div>
                <span 
                  className="kot-col-badge kot-col-badge-ready px-2.5 py-0.5 rounded-full text-xs font-extrabold text-white shadow-xs"
                  style={{ backgroundColor: '#1e3a8a', color: '#ffffff', border: '1px solid rgba(59, 130, 246, 0.5)' }}
                >
                  {readyKots.length}
                </span>
              </div>
              <div className="space-y-4">
                {readyKots.length === 0 ? (
                  <div 
                    className="h-48 sm:h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs rounded-xl border border-dashed"
                    style={{ backgroundColor: '#0d1527', borderColor: '#1e293b' }}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 mb-2">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-slate-300">No orders ready to serve</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Ready orders will show here</span>
                  </div>
                ) : (
                  readyKots.map(kot => (
                    <KdsCard
                      key={kot.id}
                      kot={kot}
                      currentTime={currentTime}
                      onUpdateStatus={updateKOTStatus}
                      mode="cashier"
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Full-Width Grid View - When in All Grid mode or filtering by a specific status */
        <div className="flex-1 overflow-y-auto min-h-0 w-full px-4 py-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
            {displayedKots.map(kot => (
              <KdsCard
                key={kot.id}
                kot={kot}
                currentTime={currentTime}
                onUpdateStatus={updateKOTStatus}
                mode="cashier"
              />
            ))}
          </div>

          {/* Empty State */}
          {displayedKots.length === 0 && (
            <div className="p-12 text-center text-xs rounded-2xl border border-slate-800/80 text-gray-400 bg-slate-900/60 shadow-lg flex flex-col items-center justify-center max-w-lg mx-auto mt-8">
              <UtensilsCrossed className="w-10 h-10 text-slate-600 mb-3" />
              <h3 className="text-base font-bold text-slate-200 mb-1">No Matching KOT Tickets</h3>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                There are currently no tickets matching {typeFilter !== 'All Types' ? `"${typeFilter}"` : ''} {statusFilter !== 'All' ? `"${statusFilter}" status` : ''}.
              </p>
              {(statusFilter !== 'All' || typeFilter !== 'All Types') && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('All');
                    setTypeFilter('All Types');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#1e3a8a] hover:bg-[#162e56] text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Show All KOTs
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KOTPage;

