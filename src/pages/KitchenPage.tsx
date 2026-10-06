import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { KOT } from '../types';
import { 
  CheckCircle, 
  Flame, 
  Ban, 
  Check,
  UtensilsCrossed,
  FilterX,
  Columns3,
  LayoutGrid,
  Search,
  RotateCcw
} from 'lucide-react';
import { KdsCard } from '../components/kitchen/KdsCard';
import { BrandWatermark } from '../components/BrandWatermark';
import { 
  KDS_STATUS_OPTIONS, 
  matchesKdsStatus, 
  getKdsStatusCounts,
  getKdsTypeCounts,
  KdsOrderType,
  KDS_ORDER_TYPE_OPTIONS,
  matchesKdsOrderType
} from '../components/kitchen/kdsFilters';

export const KitchenPage: React.FC = () => {
  const { 
    filteredKots, 
    menuItems,
    updateKOTStatus, 
    kdsAlerts, 
    dismissKDSAlert,
    kdsViewMode,
    setKdsViewMode,
    kdsStatusFilter,
    setKdsStatusFilter,
    kdsSearchQuery,
    setKdsSearchQuery
  } = useApp();

  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [kdsTypeFilter, setKdsTypeFilter] = useState<KdsOrderType>('All Types');

  // Auto-refresh timer for elapsed times every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Live status counts computed across tickets matching current order type
  const counts = useMemo(() => {
    return getKdsStatusCounts(filteredKots, 'All Stations', menuItems, kdsTypeFilter);
  }, [filteredKots, menuItems, kdsTypeFilter]);

  // Live order type counts computed for active tickets (New, Preparing, Ready)
  const typeCounts = useMemo(() => {
    return getKdsTypeCounts(filteredKots, 'All Stations', menuItems);
  }, [filteredKots, menuItems]);

  // All valid tickets (excluding completely voided/cancelled tickets)
  const allKots = useMemo(() => {
    return filteredKots.filter(k => k.status !== 'cancelled');
  }, [filteredKots]);

  // Helper function to match tickets against search query (KOT #, Table, Dish/Item Name)
  const matchesKdsSearch = (kot: KOT, query: string): boolean => {
    const q = query.trim().toLowerCase();
    if (!q) return true;

    // 1. Match by KOT Number (e.g. "10054" matches "KOT-10054" or "10054")
    if (kot.kotNumber && kot.kotNumber.toLowerCase().includes(q)) return true;

    // 2. Match by Table Number (e.g. "Table 3", "3", "T3")
    if (kot.tableNumber) {
      const tableWithWord = `table ${kot.tableNumber}`.toLowerCase();
      if (kot.tableNumber.toLowerCase().includes(q) || tableWithWord.includes(q)) return true;
    }
    if (kot.takeawayId && kot.takeawayId.toLowerCase().includes(q)) return true;

    // 3. Match by Item Name (e.g. "Biryani", "Naan")
    if (kot.items && kot.items.some(item => item.name && item.name.toLowerCase().includes(q))) return true;

    // Optional auxiliary matches (customer name, waiter name)
    if (kot.customerName && kot.customerName.toLowerCase().includes(q)) return true;
    if (kot.waiterName && kot.waiterName.toLowerCase().includes(q)) return true;

    return false;
  };

  // Combined tickets filtered by order type
  const typeFilteredKots = useMemo(() => {
    return allKots.filter(k => matchesKdsOrderType(k, kdsTypeFilter));
  }, [allKots, kdsTypeFilter]);

  // Real-time filtered tickets based on search query
  const searchedKots = useMemo(() => {
    if (!kdsSearchQuery || !kdsSearchQuery.trim()) {
      return typeFilteredKots;
    }
    return typeFilteredKots.filter(k => matchesKdsSearch(k, kdsSearchQuery));
  }, [typeFilteredKots, kdsSearchQuery]);

  // Active KOTs sorted by creation time for standard 3-column workflow
  const activeKots = useMemo(() => {
    return searchedKots
      .filter(k => k.status !== 'served')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [searchedKots]);

  const newKots = useMemo(() => activeKots.filter(k => k.status === 'new'), [activeKots]);
  const preparingKots = useMemo(() => activeKots.filter(k => k.status === 'preparing'), [activeKots]);
  const readyKots = useMemo(() => activeKots.filter(k => k.status === 'ready' || k.status === 'picked_up'), [activeKots]);

  // When a specific cooking status filter is clicked, filter tickets accordingly
  const statusFilteredKots = useMemo(() => {
    if (kdsStatusFilter === 'All') {
      return activeKots;
    }
    if (kdsStatusFilter === 'New') {
      return searchedKots
        .filter(k => k.status === 'new')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    if (kdsStatusFilter === 'Preparing') {
      return searchedKots
        .filter(k => k.status === 'preparing')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    if (kdsStatusFilter === 'Ready') {
      return searchedKots
        .filter(k => k.status === 'ready')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    if (kdsStatusFilter === 'Picked Up') {
      return searchedKots
        .filter(k => k.status === 'picked_up')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    if (kdsStatusFilter === 'Served / Completed' || kdsStatusFilter === 'Served') {
      return searchedKots
        .filter(k => k.status === 'served')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return searchedKots.filter(k => matchesKdsStatus(k, kdsStatusFilter));
  }, [searchedKots, activeKots, kdsStatusFilter]);

  const renderKOTCard = (kot: KOT) => (
    <KdsCard
      key={kot.id}
      kot={kot}
      currentTime={currentTime}
      onUpdateStatus={updateKOTStatus}
      mode="kitchen"
    />
  );

  return (
    <div 
      className="flex-1 h-full flex flex-col min-h-0 bg-[#0a0f1d] text-slate-100 select-none relative"
      style={{ backgroundColor: '#0a0f1d' }}
    >
      {/* Bilaal Restaurant Crest Watermark */}
      <BrandWatermark opacity={0.10} />
      {/* Real-time Cancellation Alerts Banner (if any voided items) */}
      {kdsAlerts.length > 0 && (
        <div className="p-4 bg-[#0a0f18] border-b border-slate-800/80 space-y-2 shrink-0">
          {kdsAlerts.map(alert => (
            <div
              key={alert.id}
              className="bg-rose-950/50 border-2 border-rose-800/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-pulse text-xs text-white"
            >
              <div className="flex items-start sm:items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <Ban className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 font-bold text-rose-200">
                    <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider">
                      CANCELLED ITEM ALERT
                    </span>
                    <span>{alert.kotNumber} • {alert.tableNumber ? `Table ${alert.tableNumber}` : 'Takeaway'}</span>
                    <span className="text-slate-400 font-normal">({alert.time})</span>
                  </div>
                  <div className="text-sm font-black text-white mt-0.5">
                    DO NOT PREPARE: {alert.itemName} ×{alert.quantity}
                  </div>
                  <div className="text-rose-300 text-[11px]">
                    Reason: <span className="text-white font-semibold">{alert.reason || 'Guest requested cancellation'}</span> • Voided by: {alert.voidedBy}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => dismissKDSAlert(alert.id)}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 self-end sm:self-center transition-colors cursor-pointer border border-rose-500 flex items-center gap-1 shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Acknowledge</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* KDS Status & Type Filter Bar + View Mode Switcher */}
      <div className="shrink-0 w-full px-4 py-2.5 bg-[#0a0f18]/95 border-b border-slate-800/80 flex items-center justify-between gap-3 sm:gap-4 shadow-xs overflow-x-auto select-none sticky top-0 z-20 backdrop-blur-md">
        {/* Left Side: Status Filter Pills */}
        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto ml-2 sm:ml-4">
          {KDS_STATUS_OPTIONS.map(opt => {
            const count = counts[opt.key] ?? counts[opt.label] ?? 0;
            const isActive = kdsStatusFilter === opt.key || (opt.key === 'Served' && kdsStatusFilter === 'Served / Completed');

            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setKdsStatusFilter(opt.key)}
                className={`px-3 py-1.5 text-xs whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 rounded-lg ${
                  isActive
                    ? 'bg-[#8b0000] text-white font-bold border border-red-500/50 shadow-xs'
                    : 'bg-slate-900/90 border border-slate-700/80 text-slate-200 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{opt.label}</span>
                <span className={isActive ? 'font-extrabold text-white/90' : 'text-slate-400 font-medium'}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Side: Shifted Type Filters + Active Filter Reset + [Columns] / [All Grid] View Switchers */}
        <div className="flex items-center gap-3 shrink-0 ml-auto">
          {/* ORDER TYPE Filter Group */}
          <div className="flex items-center gap-1.5 shrink-0">
            {KDS_ORDER_TYPE_OPTIONS.map(opt => {
              const count = typeCounts[opt.key] ?? 0;
              const isActive = kdsTypeFilter === opt.key;

              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setKdsTypeFilter(opt.key)}
                  className={`px-3 py-1.5 text-xs whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 rounded-lg ${
                    isActive
                      ? 'bg-[#1e3a8a] text-white font-bold border border-blue-500/60 shadow-xs'
                      : 'bg-slate-900/90 border border-slate-700/80 text-slate-200 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className={isActive ? 'font-extrabold text-white/90' : 'text-slate-400 font-medium'}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Filter Indicator & Reset */}
          {(kdsStatusFilter !== 'All' || kdsTypeFilter !== 'All Types' || (kdsSearchQuery && kdsSearchQuery.trim() !== '')) && (
            <button
              type="button"
              onClick={() => {
                setKdsStatusFilter('All');
                setKdsTypeFilter('All Types');
                setKdsSearchQuery('');
              }}
              className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700/80 shrink-0"
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>Reset</span>
            </button>
          )}

          {/* View Mode Switcher: [Columns] [All Grid] */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setKdsViewMode('columns')}
              className={`px-3 py-1.5 text-xs flex items-center gap-1.5 rounded-lg transition-colors cursor-pointer ${
                kdsViewMode === 'columns'
                  ? 'bg-[#1e3a8a] text-white font-bold border border-blue-500/60 shadow-xs'
                  : 'bg-slate-900/90 text-slate-200 border border-slate-700/80 hover:bg-slate-800 hover:text-white'
              }`}
              title="3-Column Workflow (New Orders | Preparing | Ready to Serve)"
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Columns</span>
            </button>
            <button
              type="button"
              onClick={() => setKdsViewMode('grid')}
              className={`px-3 py-1.5 text-xs flex items-center gap-1.5 rounded-lg transition-colors cursor-pointer ${
                kdsViewMode === 'grid'
                  ? 'bg-[#1e3a8a] text-white font-bold border border-blue-500/60 shadow-xs'
                  : 'bg-slate-900/90 text-slate-200 border border-slate-700/80 hover:bg-slate-800 hover:text-white'
              }`}
              title="Unified Auto-Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>All Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* KDS Viewport: Either 3-Column Workflow Board or Filtered Instant Grid */}
      {kdsStatusFilter === 'All' && kdsViewMode === 'columns' ? (
        <div className="flex-1 min-h-0 w-full px-4 py-3 flex flex-col overflow-y-auto">
          {kdsSearchQuery && kdsSearchQuery.trim() !== '' && activeKots.length === 0 && (
            <div className="mb-3 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200 shrink-0">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-amber-400 shrink-0" />
                <span>No active orders match &ldquo;<strong>{kdsSearchQuery}</strong>&rdquo; across KOT number, table, or dish name.</span>
              </div>
              <button
                type="button"
                onClick={() => setKdsSearchQuery('')}
                className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors cursor-pointer text-xs"
              >
                Clear Search
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full items-start">
            {/* 1. NEW ORDERS COLUMN */}
            <div className="flex flex-col h-full min-h-0 min-w-0">
              <div 
                onClick={() => setKdsStatusFilter('New')}
                className="shrink-0 p-3 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 font-bold flex items-center justify-between shadow-xs mb-3 cursor-pointer hover:border-slate-500 transition-colors"
                title="Click to filter to New Orders only"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-100">
                    1. NEW ORDERS
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-[#8b0000] text-white border border-rose-500/50">
                  {newKots.length}
                </span>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4 pb-4">
                {newKots.length === 0 ? (
                  <div className="h-48 sm:h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs bg-slate-900/40 rounded-2xl border border-dashed border-slate-800/80">
                    <div className="w-8 h-8 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 mb-2">
                      <Check className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-slate-300">No new orders waiting</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Incoming KOTs will show here</span>
                  </div>
                ) : (
                  newKots.map(renderKOTCard)
                )}
              </div>
            </div>

            {/* 2. PREPARING COLUMN */}
            <div className="flex flex-col h-full min-h-0 min-w-0">
              <div 
                onClick={() => setKdsStatusFilter('Preparing')}
                className="shrink-0 p-3 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 font-bold flex items-center justify-between shadow-xs mb-3 cursor-pointer hover:border-slate-500 transition-colors"
                title="Click to filter to Preparing orders only"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-100">
                    2. PREPARING
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-600 text-white border border-amber-500/50">
                  {preparingKots.length}
                </span>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4 pb-4">
                {preparingKots.length === 0 ? (
                  <div className="h-48 sm:h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs bg-slate-900/40 rounded-2xl border border-dashed border-slate-800/80">
                    <div className="w-8 h-8 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 mb-2">
                      <Flame className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-slate-300">No orders in preparation</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Orders in prep will show here</span>
                  </div>
                ) : (
                  preparingKots.map(renderKOTCard)
                )}
              </div>
            </div>

            {/* 3. READY TO SERVE / DISPATCH COLUMN */}
            <div className="flex flex-col h-full min-h-0 min-w-0">
              <div 
                onClick={() => setKdsStatusFilter('Ready')}
                className="shrink-0 p-3 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 font-bold flex items-center justify-between shadow-xs mb-3 cursor-pointer hover:border-slate-500 transition-colors"
                title="Click to filter to Ready orders only"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-100">
                    3. READY / DISPATCH
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-[#1e3a8a] text-white border border-blue-500/50">
                  {readyKots.length}
                </span>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4 pb-4">
                {readyKots.length === 0 ? (
                  <div className="h-48 sm:h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs bg-slate-900/40 rounded-2xl border border-dashed border-slate-800/80">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 mb-2">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-slate-300">No orders ready to serve</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Ready orders will show here</span>
                  </div>
                ) : (
                  readyKots.map(renderKOTCard)
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Unified Instant Grid View - Filters instantly to selected cooking status or shows all grid */
        <div className="flex-1 overflow-y-auto min-h-0 w-full px-4 py-3">
          {statusFilteredKots.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-[#161B26] border border-white/10 rounded-2xl">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 mb-3">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                {kdsSearchQuery && kdsSearchQuery.trim() !== ''
                  ? `No KOTs found matching "${kdsSearchQuery}"`
                  : (kdsStatusFilter === 'All' && kdsTypeFilter === 'All Types'
                    ? 'Kitchen Queue Clear' 
                    : 'No Matching Tickets')}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mb-3">
                {kdsSearchQuery && kdsSearchQuery.trim() !== ''
                  ? `No tickets match KOT number, table number, or dish name "${kdsSearchQuery}".`
                  : (kdsStatusFilter === 'All' && kdsTypeFilter === 'All Types'
                    ? 'All incoming KOT tickets have been prepared and served. New orders will display here instantly.'
                    : `There are currently no tickets matching ${kdsTypeFilter !== 'All Types' ? `"${kdsTypeFilter}"` : ''} ${kdsStatusFilter !== 'All' ? `"${kdsStatusFilter}" status` : ''}.`)}
              </p>
              {(kdsStatusFilter !== 'All' || kdsTypeFilter !== 'All Types' || (kdsSearchQuery && kdsSearchQuery.trim() !== '')) && (
                <button
                  type="button"
                  onClick={() => {
                    setKdsStatusFilter('All');
                    setKdsTypeFilter('All Types');
                    setKdsSearchQuery('');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  {kdsSearchQuery && kdsSearchQuery.trim() !== '' ? 'Clear Search' : 'View All Orders'}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
              {statusFilteredKots.map(renderKOTCard)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

