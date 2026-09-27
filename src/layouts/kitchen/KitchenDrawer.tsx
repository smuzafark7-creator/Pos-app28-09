import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  CheckCircle2, 
  Ban, 
  Sliders, 
  ChefHat, 
  Search,
  AlertTriangle,
  TrendingUp,
  Package,
  Utensils,
  Plus,
  Minus,
  History,
  BarChart3,
  RotateCcw,
  Clock
} from 'lucide-react';

interface KitchenDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeDrawerTab: 'active' | 'completed' | 'stock86' | 'dispatched' | 'settings';
  setActiveDrawerTab?: (tab: 'active' | 'completed' | 'stock86' | 'dispatched' | 'settings') => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const KitchenDrawer: React.FC<KitchenDrawerProps> = ({
  isOpen,
  onClose,
  activeDrawerTab,
  isMuted,
  onToggleMute
}) => {
  const { 
    kots, 
    menuItems, 
    updateMenuItemStock,
    dispatchedItemStats,
    currentBranch,
    updateKOTStatus,
    showToast
  } = useApp();

  const [menuSearch, setMenuSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'available' | 'few_left' | 'sold_out'>('all');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [ticketSort, setTicketSort] = useState<'oldest' | 'newest'>('oldest');
  const [dispatchedSearch, setDispatchedSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeKots = kots.filter(
    k => (currentBranch === 'all' || k.branchId === currentBranch) && (k.status === 'new' || k.status === 'preparing')
  );

  const completedKots = kots.filter(
    k => (currentBranch === 'all' || k.branchId === currentBranch) && (k.status === 'ready' || k.status === 'served')
  );

  // Categories list for stock filter
  const categories = ['All', ...Array.from(new Set(menuItems.map(m => m.category).filter(Boolean)))];

  // Counts for stock tab
  const availableCount = menuItems.filter(m => (m.stockStatus === 'available' || !m.stockStatus) && m.available !== false).length;
  const fewLeftCount = menuItems.filter(m => m.stockStatus === 'few_left' && (m.stockCount ?? 0) > 0).length;
  const soldOutCount = menuItems.filter(m => !m.available || m.stockStatus === 'sold_out' || (m.stockStatus === 'few_left' && (m.stockCount ?? 0) <= 0)).length;

  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase()) || 
                          item.category.toLowerCase().includes(menuSearch.toLowerCase());
    const matchesCat = categoryFilter === 'All' || item.category === categoryFilter;

    let matchesStock = true;
    if (stockFilter === 'available') {
      matchesStock = (item.stockStatus === 'available' || !item.stockStatus) && item.available !== false;
    } else if (stockFilter === 'few_left') {
      matchesStock = item.stockStatus === 'few_left' && (item.stockCount ?? 0) > 0;
    } else if (stockFilter === 'sold_out') {
      matchesStock = !item.available || item.stockStatus === 'sold_out' || (item.stockStatus === 'few_left' && (item.stockCount ?? 0) <= 0);
    }

    return matchesSearch && matchesCat && matchesStock;
  });

  // Dispatched aggregations
  const totalDispatched = dispatchedItemStats.reduce((sum, d) => sum + d.totalServed, 0);
  const totalDineInDispatched = dispatchedItemStats.reduce((sum, d) => sum + d.dineIn, 0);
  const totalTakeawayDispatched = dispatchedItemStats.reduce((sum, d) => sum + d.takeaway, 0);

  const filteredDispatchedItems = dispatchedItemStats.filter(d =>
    d.name.toLowerCase().includes(dispatchedSearch.toLowerCase())
  );

  const filteredCompletedKots = completedKots.filter(kot => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    const matchKot = kot.kotNumber.toLowerCase().includes(q);
    const matchTable = (kot.tableNumber || '').toLowerCase().includes(q);
    const matchItem = kot.items.some(it => it.name.toLowerCase().includes(q));
    return matchKot || matchTable || matchItem;
  });

  const handleRecallOrder = (kotId: string, kotNumber: string) => {
    updateKOTStatus(kotId, 'preparing');
    showToast('KOT Recalled', `KOT #${kotNumber} returned to Kitchen cooking queue`, 'info');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl bg-[#161B26] border border-white/10 shadow-2xl overflow-hidden text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Dedicated Context-Aware Modal Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between shrink-0 bg-[#161B26]">
          <div className="flex items-center gap-3">
            {activeDrawerTab === 'stock86' && (
              <>
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xs shrink-0">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-sm sm:text-base tracking-wider uppercase text-white">
                    Item Availability & Live 86 Inventory
                  </h2>
                  <p className="text-[11px] text-slate-400">Live portion limits, 86 manager & POS synchronization</p>
                </div>
              </>
            )}

            {activeDrawerTab === 'dispatched' && (
              <>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xs shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-sm sm:text-base tracking-wider uppercase text-white">
                    Dispatched Dishes Summary
                  </h2>
                  <p className="text-[11px] text-slate-400">Real-time served totals & Dine-in vs Takeaway breakdown</p>
                </div>
              </>
            )}

            {activeDrawerTab === 'completed' && (
              <>
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-xs shrink-0">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-sm sm:text-base tracking-wider uppercase text-white">
                    Order History & Recall
                  </h2>
                  <p className="text-[11px] text-slate-400">Recently completed tickets with one-click recall to kitchen queue</p>
                </div>
              </>
            )}

            {activeDrawerTab === 'active' && (
              <>
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xs shrink-0">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-sm sm:text-base tracking-wider uppercase text-white">
                    Active Kitchen Queue
                  </h2>
                  <p className="text-[11px] text-slate-400">Currently active KOT tickets</p>
                </div>
              </>
            )}

            {activeDrawerTab === 'settings' && (
              <>
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-xs shrink-0">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-sm sm:text-base tracking-wider uppercase text-white">
                    Kitchen Display Settings
                  </h2>
                  <p className="text-[11px] text-slate-400">Audio chimes & ticket sorting preferences</p>
                </div>
              </>
            )}
          </div>

          {/* Right: Summary badges & Close Button */}
          <div className="flex items-center gap-3">
            {activeDrawerTab === 'stock86' && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-600/40 text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{availableCount} Available</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-950/70 border border-amber-600/40 text-[11px] font-bold text-amber-400 flex items-center gap-1.5 shadow-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>{fewLeftCount} Low</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-rose-950/70 border border-rose-600/40 text-[11px] font-bold text-rose-400 flex items-center gap-1.5 shadow-xs">
                  <Ban className="w-3.5 h-3.5 text-rose-400" />
                  <span>{soldOutCount} Sold Out</span>
                </span>
              </div>
            )}

            {activeDrawerTab === 'dispatched' && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-600/40 text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 shadow-xs">
                  <span>{totalDispatched} Total Served</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#1E2433] border border-white/10 text-[11px] font-semibold text-slate-300">
                  {totalDineInDispatched} Dine-In • {totalTakeawayDispatched} Takeaway
                </span>
              </div>
            )}

            {activeDrawerTab === 'completed' && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-sky-950/70 border border-sky-600/40 text-[11px] font-bold text-sky-400 flex items-center gap-1.5 shadow-xs">
                  <History className="w-3.5 h-3.5 text-sky-400" />
                  <span>{completedKots.length} Completed</span>
                </span>
              </div>
            )}

            {/* Clean Close Button */}
            <button 
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white transition-colors cursor-pointer border border-white/10 shrink-0"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body with smooth scrolling */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#18191D]">
          
          {/* TAB 1: ITEM AVAILABILITY & STOCK (86) CONTROLS */}
          {activeDrawerTab === 'stock86' && (
            <div className="space-y-4">
              {/* Header Info & Sync Status Box */}
              <div className="p-4 bg-[#161B26] border border-white/[0.08] rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <Ban className="w-4 h-4 text-rose-400" />
                    <span>Item Availability & Live 86 Inventory Controls</span>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    LIVE TERMINAL SYNC
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Controls immediately synchronize with Cashier POS & Waiter pads. Marking an item <strong className="text-rose-400">Sold Out</strong> blocks addition. Marking <strong className="text-amber-400">Few Left</strong> shows remaining portions that auto-decrement with placed orders.
                </p>
              </div>

              {/* Search, Status Segment Filter Buttons, and Category Filter Bar */}
              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={menuSearch}
                      onChange={e => setMenuSearch(e.target.value)}
                      placeholder="Search dish by name or category..."
                      className="w-full pl-9 pr-8 py-2 bg-[#161B26] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-xs"
                    />
                    {menuSearch && (
                      <button 
                        onClick={() => setMenuSearch('')}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Status Segment Filter Buttons */}
                  <div className="flex items-center gap-1 bg-[#161B26] p-1 rounded-xl border border-white/[0.08] text-xs shrink-0">
                    <button
                      onClick={() => setStockFilter('all')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        stockFilter === 'all' ? 'bg-[#1E2433] text-white border border-white/10 shadow-xs' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      All ({menuItems.length})
                    </button>
                    <button
                      onClick={() => setStockFilter('available')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        stockFilter === 'available' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 shadow-xs' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Avail ({availableCount})
                    </button>
                    <button
                      onClick={() => setStockFilter('few_left')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        stockFilter === 'few_left' ? 'bg-amber-950/80 text-amber-300 border border-amber-600/50 shadow-xs' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Few ({fewLeftCount})
                    </button>
                    <button
                      onClick={() => setStockFilter('sold_out')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        stockFilter === 'sold_out' ? 'bg-rose-950/80 text-rose-300 border border-rose-600/50 shadow-xs' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      86-ed ({soldOutCount})
                    </button>
                  </div>
                </div>

                {/* Category Pills */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer border ${
                        categoryFilter === cat
                          ? 'bg-amber-500 text-white font-bold border-amber-400 shadow-xs'
                          : 'bg-[#161B26] text-slate-400 hover:text-white border-white/[0.08]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2-Column Responsive Item Controls Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredMenuItems.length === 0 ? (
                  <div className="col-span-full p-12 text-center text-slate-500 text-xs bg-[#161B26] rounded-2xl border border-white/[0.08]">
                    No menu items found matching search or filters.
                  </div>
                ) : (
                  filteredMenuItems.map(item => {
                    const isSoldOut = !item.available || item.stockStatus === 'sold_out' || (item.stockStatus === 'few_left' && (item.stockCount ?? 0) <= 0);
                    const isFewLeft = item.stockStatus === 'few_left' && (item.stockCount ?? 0) > 0;
                    const isAvailable = (item.stockStatus === 'available' || !item.stockStatus) && item.available !== false;
                    const currentCount = typeof item.stockCount === 'number' ? item.stockCount : 5;

                    return (
                      <div 
                        key={item.id} 
                        className={`p-3.5 rounded-2xl bg-[#1E2433] border transition-all space-y-3 shadow-sm flex flex-col justify-between ${
                          isSoldOut 
                            ? 'border-rose-900/50 bg-[#1e1c24]' 
                            : isFewLeft 
                            ? 'border-amber-600/40 bg-[#222123]' 
                            : 'border-white/[0.08] hover:border-white/20'
                        }`}
                      >
                        {/* Item Info & Current Status Pill */}
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                <span className="text-xs sm:text-sm font-bold text-white leading-tight">{item.name}</span>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-1 pl-4.5">
                                {item.category} • ₹{item.price}
                              </div>
                            </div>

                            {/* Current Status Badge */}
                            <div className="shrink-0">
                              {isAvailable && (
                                <span className="bg-emerald-950/70 text-emerald-400 border border-emerald-600/40 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  Available
                                </span>
                              )}
                              {isFewLeft && (
                                <span className="bg-amber-950/80 text-amber-400 border border-amber-600/50 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                                  Only {item.stockCount} Left
                                </span>
                              )}
                              {isSoldOut && (
                                <span className="bg-rose-950/80 text-rose-400 border border-rose-600/50 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Ban className="w-3 h-3 text-rose-400" />
                                  Sold Out (86)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 3-Way Stock Status Segmented Control */}
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-1 bg-[#161B26] p-1 rounded-xl border border-white/[0.08]">
                            {/* Option 1: Available (Green) */}
                            <button
                              type="button"
                              onClick={() => updateMenuItemStock(item.id, 'available')}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                isAvailable
                                  ? 'bg-emerald-600 text-white shadow-xs border border-emerald-500'
                                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Available</span>
                            </button>

                            {/* Option 2: Few Left (Amber with count) */}
                            <button
                              type="button"
                              onClick={() => {
                                const nextCount = typeof item.stockCount === 'number' && item.stockCount > 0 ? item.stockCount : 5;
                                updateMenuItemStock(item.id, 'few_left', nextCount);
                              }}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                isFewLeft
                                  ? 'bg-amber-600 text-white shadow-xs border border-amber-500'
                                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                              }`}
                            >
                              <AlertTriangle className="w-3 h-3" />
                              <span>Few Left</span>
                            </button>

                            {/* Option 3: Sold Out / 86 (Red) */}
                            <button
                              type="button"
                              onClick={() => updateMenuItemStock(item.id, 'sold_out')}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                isSoldOut
                                  ? 'bg-rose-600 text-white shadow-xs border border-rose-500'
                                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                              }`}
                            >
                              <Ban className="w-3 h-3" />
                              <span>Sold Out</span>
                            </button>
                          </div>

                          {/* Editable Stepper & Quick-Number Presets for "Few Left" */}
                          {isFewLeft && (
                            <div className="p-2.5 rounded-xl bg-[#161B26] border border-amber-500/30 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                                  Remaining Plates:
                                </span>
                                
                                {/* Inline Stepper [- Input +] */}
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = Math.max(1, currentCount - 1);
                                      updateMenuItemStock(item.id, 'few_left', next);
                                    }}
                                    className="w-6 h-6 rounded bg-[#18191D] hover:bg-white/[0.1] text-amber-300 flex items-center justify-center font-bold border border-white/[0.1] cursor-pointer"
                                    title="Decrement 1 plate"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  
                                  <input
                                    type="number"
                                    min="1"
                                    max="99"
                                    value={currentCount}
                                    onChange={e => {
                                      const val = parseInt(e.target.value, 10);
                                      if (!isNaN(val) && val >= 0) {
                                        if (val === 0) {
                                          updateMenuItemStock(item.id, 'sold_out');
                                        } else {
                                          updateMenuItemStock(item.id, 'few_left', val);
                                        }
                                      }
                                    }}
                                    className="w-12 h-6 text-center font-extrabold text-xs text-amber-400 bg-[#18191D] border border-amber-500/40 rounded focus:outline-none focus:border-amber-400"
                                  />

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = currentCount + 1;
                                      updateMenuItemStock(item.id, 'few_left', next);
                                    }}
                                    className="w-6 h-6 rounded bg-[#18191D] hover:bg-white/[0.1] text-amber-300 flex items-center justify-center font-bold border border-white/[0.1] cursor-pointer"
                                    title="Increment 1 plate"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Quick Presets */}
                              <div className="flex items-center gap-1 text-[10px]">
                                <span className="text-slate-400">Quick:</span>
                                {[2, 4, 6, 10, 15].map(preset => (
                                  <button
                                    key={preset}
                                    type="button"
                                    onClick={() => updateMenuItemStock(item.id, 'few_left', preset)}
                                    className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                                      currentCount === preset
                                        ? 'bg-amber-500 text-white font-bold border-amber-400'
                                        : 'bg-[#18191D] text-slate-300 hover:text-white border-white/[0.08]'
                                    }`}
                                  >
                                    {preset}
                                  </button>
                                ))}
                                <span className="text-slate-400 text-[10px] ml-auto">
                                  Decrements on punch
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: REAL-TIME SERVED COUNTER (Dine-in vs Takeaway Breakdown) */}
          {activeDrawerTab === 'dispatched' && (
            <div className="space-y-4">
              {/* Header Box */}
              <div className="p-4 bg-[#161B26] border border-white/[0.08] rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Real-Time Served Counter (Shift Analytics)</span>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    LIVE SHIFT DISPATCH
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Track item-level dispatched dishes dynamically per shift. Increments automatically when kitchen marks an order as <strong>Ready</strong> or <strong>Served</strong>.
                </p>

                {/* Shift Metrics Bar */}
                <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                  <div className="p-2.5 rounded-xl bg-[#1E2433] border border-white/[0.08]">
                    <div className="text-lg font-black text-white">{totalDispatched}</div>
                    <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Served</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#1E2433] border border-emerald-500/30">
                    <div className="text-lg font-black text-emerald-400">{totalDineInDispatched}</div>
                    <div className="text-[11px] text-emerald-400 uppercase font-semibold">Dine-in</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#1E2433] border border-sky-500/30">
                    <div className="text-lg font-black text-sky-400">{totalTakeawayDispatched}</div>
                    <div className="text-[11px] text-sky-400 uppercase font-semibold">Takeaway</div>
                  </div>
                </div>
              </div>

              {/* Search Dispatched */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={dispatchedSearch}
                  onChange={e => setDispatchedSearch(e.target.value)}
                  placeholder="Filter dispatched dishes..."
                  className="w-full pl-9 pr-4 py-2 bg-[#161B26] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-xs"
                />
              </div>

              {/* Itemized Dispatched List in 2 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredDispatchedItems.length === 0 ? (
                  <div className="col-span-full p-12 text-center text-slate-500 text-xs bg-[#161B26] rounded-2xl border border-white/[0.08]">
                    No dishes dispatched yet in this shift.
                  </div>
                ) : (
                  filteredDispatchedItems.map((dish, idx) => {
                    const dineInPct = dish.totalServed > 0 ? (dish.dineIn / dish.totalServed) * 100 : 0;
                    const takeawayPct = dish.totalServed > 0 ? (dish.takeaway / dish.totalServed) * 100 : 0;

                    return (
                      <div
                        key={dish.name}
                        className="p-3.5 rounded-2xl bg-[#1E2433] border border-white/[0.08] shadow-sm space-y-2.5 hover:border-emerald-500/40 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-white/[0.05] text-slate-400 text-[10px] font-bold flex items-center justify-center">
                              #{idx + 1}
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-white">{dish.name}</span>
                          </div>
                          <span className="text-xs font-black text-emerald-400 bg-emerald-950/70 border border-emerald-700/50 px-2.5 py-0.5 rounded-full">
                            {dish.totalServed} Served
                          </span>
                        </div>

                        {/* Breakdown: Dine-in vs Takeaway */}
                        <div className="flex items-center justify-between text-xs text-slate-300">
                          <div className="flex items-center gap-1 text-emerald-400">
                            <Utensils className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="font-semibold">{dish.dineIn} Dine-in</span>
                          </div>
                          <div className="flex items-center gap-1 text-sky-400">
                            <Package className="w-3.5 h-3.5 text-sky-400" />
                            <span className="font-semibold">{dish.takeaway} Takeaway</span>
                          </div>
                        </div>

                        {/* Visual Ratio Bar */}
                        <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden flex">
                          <div 
                            className="h-full bg-emerald-500" 
                            style={{ width: `${dineInPct}%` }}
                            title={`${dish.dineIn} Dine-in (${Math.round(dineInPct)}%)`}
                          />
                          <div 
                            className="h-full bg-sky-500" 
                            style={{ width: `${takeawayPct}%` }}
                            title={`${dish.takeaway} Takeaway (${Math.round(takeawayPct)}%)`}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVE ORDERS */}
          {activeDrawerTab === 'active' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-white/[0.08]">
                <span>Active Cooking Queue</span>
                <span className="text-amber-400 font-bold">{activeKots.length} Tickets</span>
              </div>
              {activeKots.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No active orders right now. Kitchen queue is clear!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeKots.map(kot => (
                    <div key={kot.id} className="p-3.5 rounded-2xl bg-[#1E2433] border border-white/[0.08] shadow-md space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">KOT #{kot.kotNumber}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-[#161B26] border border-white/[0.08] text-slate-300 font-semibold">
                          {kot.timeFormatted}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 flex items-center justify-between">
                        <span className="font-bold text-amber-400">{kot.tableNumber ? `Table ${kot.tableNumber}` : 'Takeaway'}</span>
                        <span className="text-[10px] text-slate-400">{kot.items.length} items</span>
                      </div>

                      <div className="space-y-1 pt-1 border-t border-white/[0.06] text-xs">
                        {kot.items.map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between text-slate-300">
                            <span>{it.name}</span>
                            <span className="font-bold text-amber-400">×{it.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PREPARED / COMPLETED ORDERS & RECALL */}
          {activeDrawerTab === 'completed' && (
            <div className="space-y-4">
              {/* Header Info & Search Filter */}
              <div className="p-4 bg-[#161B26] border border-white/[0.08] rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-white">Shift Order Archive & Recall Log</span>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
                    {completedKots.length} SERVED / READY
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Review previously dispatched or prepared orders. If a ticket was closed accidentally or requires kitchen rework, click <strong>Recall to Kitchen</strong> to restore it directly back to the active queue.
                </p>

                {/* Search Bar */}
                <div className="relative pt-1">
                  <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={e => setHistorySearch(e.target.value)}
                    placeholder="Search by KOT #, Table, or dish name..."
                    className="w-full pl-9 pr-4 py-2 bg-[#1E2433] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-xs"
                  />
                </div>
              </div>

              {/* Order Cards Grid */}
              {filteredCompletedKots.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs bg-[#161B26] rounded-2xl border border-white/[0.08]">
                  {historySearch ? 'No completed orders match your search criteria.' : 'No completed orders in this shift yet.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredCompletedKots.map(kot => (
                    <div 
                      key={kot.id} 
                      className="p-4 rounded-2xl bg-[#1E2433] border border-white/[0.08] shadow-md space-y-3 hover:border-white/20 transition-colors"
                    >
                      {/* Ticket Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white text-xs sm:text-sm">KOT #{kot.kotNumber}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#161B26] border border-white/10 text-amber-400 font-bold">
                            {kot.tableNumber ? `Table ${kot.tableNumber}` : 'Takeaway'}
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full font-bold uppercase">
                          {kot.status}
                        </span>
                      </div>

                      {/* Timestamp & Item count */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Placed: {kot.timeFormatted}</span>
                        {kot.readyAt && <span>• Ready: {kot.readyAt}</span>}
                      </div>

                      {/* Items List */}
                      <div className="space-y-1 py-2 border-y border-white/[0.06] text-xs max-h-36 overflow-y-auto">
                        {kot.items.map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between text-slate-200">
                            <span className="truncate pr-2">{it.name}</span>
                            <span className="font-bold text-emerald-400 shrink-0">×{it.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {kot.specialInstructions && (
                        <div className="text-[11px] text-amber-300/90 italic bg-amber-950/30 border border-amber-800/30 px-2.5 py-1 rounded-lg">
                          Note: {kot.specialInstructions}
                        </div>
                      )}

                      {/* Action Bar: Recall Button */}
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRecallOrder(kot.id, kot.kotNumber)}
                          className="px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 hover:text-white border border-sky-500/30 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          title="Restore this order back to active kitchen queue"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                          <span>Recall to Kitchen</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: STATION SETTINGS */}
          {activeDrawerTab === 'settings' && (
            <div className="space-y-4 max-w-xl mx-auto">
              <div className="text-xs font-bold text-white flex items-center gap-1.5 pb-2 border-b border-white/[0.08]">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Station & Display Settings</span>
              </div>

              {/* Sound Audio alert toggle */}
              <div className="p-4 rounded-2xl bg-[#1E2433] border border-white/[0.08] shadow-md space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Audio Order Chimes</span>
                  <button
                    type="button"
                    onClick={onToggleMute}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      isMuted 
                        ? 'bg-rose-950/50 text-rose-300 border border-rose-800/50' 
                        : 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50'
                    }`}
                  >
                    {isMuted ? 'MUTED' : 'ENABLED'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Plays audible chime whenever a new KOT ticket arrives from Cashier POS or Waiter pad.
                </p>
              </div>

              {/* Ticket Sorting */}
              <div className="p-4 rounded-2xl bg-[#1E2433] border border-white/[0.08] shadow-md space-y-2">
                <span className="text-xs font-semibold text-white">Ticket Queue Sorting</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTicketSort('oldest')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      ticketSort === 'oldest' ? 'bg-amber-500 text-white shadow-xs' : 'bg-[#161B26] text-slate-400 border border-white/[0.08]'
                    }`}
                  >
                    Oldest First (FIFO)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTicketSort('newest')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      ticketSort === 'newest' ? 'bg-amber-500 text-white shadow-xs' : 'bg-[#161B26] text-slate-400 border border-white/[0.08]'
                    }`}
                  >
                    Newest First
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
