import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { 
  Search, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Ban, 
  Plus, 
  Minus, 
  Utensils,
  RefreshCw
} from 'lucide-react';

export const KitchenStockView: React.FC = () => {
  const { menuItems, updateMenuItemStock } = useApp();

  const [menuSearch, setMenuSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'available' | 'few_left' | 'sold_out'>('all');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Categories list
  const categories = useMemo(() => {
    const cats = Array.from(new Set(menuItems.map(item => item.category)));
    return ['All', ...cats];
  }, [menuItems]);

  // Stock summary counts
  const availableCount = menuItems.filter(i => (i.stockStatus === 'available' || !i.stockStatus) && i.available !== false).length;
  const fewLeftCount = menuItems.filter(i => i.stockStatus === 'few_left' && (i.stockCount ?? 0) > 0).length;
  const soldOutCount = menuItems.filter(i => !i.available || i.stockStatus === 'sold_out' || (i.stockStatus === 'few_left' && (i.stockCount ?? 0) <= 0)).length;

  // Filtered menu items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      // 1. Search filter
      const matchesSearch = !menuSearch.trim() || 
        item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
        item.category.toLowerCase().includes(menuSearch.toLowerCase());

      // 2. Category filter
      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;

      // 3. Stock status filter
      const isSoldOut = !item.available || item.stockStatus === 'sold_out' || (item.stockStatus === 'few_left' && (item.stockCount ?? 0) <= 0);
      const isFewLeft = item.stockStatus === 'few_left' && (item.stockCount ?? 0) > 0;
      const isAvailable = (item.stockStatus === 'available' || !item.stockStatus) && item.available !== false;

      let matchesStatus = true;
      if (stockFilter === 'available') matchesStatus = isAvailable;
      else if (stockFilter === 'few_left') matchesStatus = isFewLeft;
      else if (stockFilter === 'sold_out') matchesStatus = isSoldOut;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [menuItems, menuSearch, categoryFilter, stockFilter]);

  return (
    <div className="flex-1 h-full w-full overflow-y-auto bg-[#18191D] p-4 sm:p-6 text-slate-100 select-none">
      <div className="max-w-7xl mx-auto space-y-4 pb-8">
        {/* Full-Screen Page Header */}
        <div className="p-4 sm:p-5 bg-[#161B26] border border-white/[0.08] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-xs">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                  Item Stock & 86 Manager
                </h1>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  REAL-TIME POS & WAITER SYNC
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Mark items sold out (86) or specify remaining plate counts. Changes apply instantly across Cashier POS and Waiter tablets.
              </p>
            </div>
          </div>

          {/* Metric Status Chips */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => setStockFilter('available')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                stockFilter === 'available'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                  : 'bg-emerald-950/50 text-emerald-400 border-emerald-600/40 hover:bg-emerald-950/80'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{availableCount} Available</span>
            </button>

            <button
              type="button"
              onClick={() => setStockFilter('few_left')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                stockFilter === 'few_left'
                  ? 'bg-amber-950 text-amber-300 border-amber-500 shadow-xs ring-1 ring-amber-500'
                  : 'bg-amber-950/50 text-amber-400 border-amber-600/40 hover:bg-amber-950/80'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>{fewLeftCount} Low Stock</span>
            </button>

            <button
              type="button"
              onClick={() => setStockFilter('sold_out')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                stockFilter === 'sold_out'
                  ? 'bg-rose-950 text-rose-300 border-rose-500 shadow-xs ring-1 ring-rose-500'
                  : 'bg-rose-950/50 text-rose-400 border-rose-600/40 hover:bg-rose-950/80'
              }`}
            >
              <Ban className="w-3.5 h-3.5 text-rose-400" />
              <span>{soldOutCount} Sold Out (86)</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar: Search + Segmented Tabs + Categories */}
        <div className="p-3.5 bg-[#161B26] border border-white/[0.08] rounded-2xl space-y-3 shadow-md">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={menuSearch}
                onChange={e => setMenuSearch(e.target.value)}
                placeholder="Search dishes by name or category..."
                className="w-full pl-10 pr-9 py-2 bg-[#1E2433] border border-white/[0.08] rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-inner"
              />
              {menuSearch && (
                <button 
                  type="button"
                  onClick={() => setMenuSearch('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Segment Filter */}
            <div className="flex items-center gap-1 bg-[#1E2433] p-1 rounded-xl border border-white/[0.08] text-xs shrink-0">
              <button
                type="button"
                onClick={() => setStockFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  stockFilter === 'all'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({menuItems.length})
              </button>
              <button
                type="button"
                onClick={() => setStockFilter('available')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  stockFilter === 'available'
                    ? 'bg-emerald-900 text-emerald-300 border border-emerald-500 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Avail ({availableCount})
              </button>
              <button
                type="button"
                onClick={() => setStockFilter('few_left')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  stockFilter === 'few_left'
                    ? 'bg-amber-900 text-amber-300 border border-amber-500 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Few ({fewLeftCount})
              </button>
              <button
                type="button"
                onClick={() => setStockFilter('sold_out')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  stockFilter === 'sold_out'
                    ? 'bg-rose-900 text-rose-300 border border-rose-500 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                86-ed ({soldOutCount})
              </button>
            </div>
          </div>

          {/* Category Chips Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors cursor-pointer border ${
                  categoryFilter === cat
                    ? 'bg-amber-500 text-white font-bold border-amber-400 shadow-xs'
                    : 'bg-[#1E2433] text-slate-400 hover:text-white border-white/[0.08]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Item Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredMenuItems.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 text-sm bg-[#161B26] rounded-2xl border border-white/[0.08]">
              No dishes found matching your current search or status filter.
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
                  className={`p-4 rounded-2xl bg-[#1E2433] border transition-all flex flex-col justify-between space-y-3.5 shadow-md ${
                    isSoldOut
                      ? 'border-rose-900/60 bg-[#211c24]'
                      : isFewLeft
                      ? 'border-amber-600/50 bg-[#232025]'
                      : 'border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  {/* Card Top: Dish Details & Status Badge */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <h3 className="text-sm font-extrabold text-white leading-tight">{item.name}</h3>
                        </div>
                        <div className="text-xs text-slate-400 mt-1 pl-4.5 font-medium">
                          {item.category} • ₹{item.price}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0">
                        {isAvailable && (
                          <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-600/50 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Available
                          </span>
                        )}
                        {isFewLeft && (
                          <span className="bg-amber-950/90 text-amber-400 border border-amber-600/60 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            {item.stockCount} Left
                          </span>
                        )}
                        {isSoldOut && (
                          <span className="bg-rose-950/90 text-rose-400 border border-rose-600/60 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Ban className="w-3 h-3 text-rose-400" />
                            Sold Out (86)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stock State Controls: Segmented Buttons */}
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-3 gap-1 bg-[#161B26] p-1 rounded-xl border border-white/[0.08]">
                      {/* Available */}
                      <button
                        type="button"
                        onClick={() => updateMenuItemStock(item.id, 'available')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          isAvailable
                            ? 'bg-emerald-600 text-white shadow-xs border border-emerald-500'
                            : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Available</span>
                      </button>

                      {/* Few Left */}
                      <button
                        type="button"
                        onClick={() => {
                          const nextCount = typeof item.stockCount === 'number' && item.stockCount > 0 ? item.stockCount : 5;
                          updateMenuItemStock(item.id, 'few_left', nextCount);
                        }}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          isFewLeft
                            ? 'bg-amber-600 text-white shadow-xs border border-amber-500'
                            : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                        }`}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        <span>Few Left</span>
                      </button>

                      {/* Sold Out (86) */}
                      <button
                        type="button"
                        onClick={() => updateMenuItemStock(item.id, 'sold_out')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          isSoldOut
                            ? 'bg-rose-600 text-white shadow-xs border border-rose-500'
                            : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                        }`}
                      >
                        <Ban className="w-3 h-3" />
                        <span>Sold Out</span>
                      </button>
                    </div>

                    {/* Stepper + Presets for Few Left */}
                    {isFewLeft && (
                      <div className="p-3 rounded-xl bg-[#161B26] border border-amber-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-amber-300 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            Remaining Plates:
                          </span>
                          
                          {/* Stepper */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const next = Math.max(1, currentCount - 1);
                                updateMenuItemStock(item.id, 'few_left', next);
                              }}
                              className="w-7 h-7 rounded-lg bg-[#1E2433] hover:bg-white/[0.1] text-amber-300 flex items-center justify-center font-bold border border-white/[0.1] cursor-pointer"
                              title="Decrement 1 plate"
                            >
                              <Minus className="w-3.5 h-3.5" />
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
                              className="w-14 h-7 text-center font-extrabold text-xs sm:text-sm text-amber-400 bg-[#1E2433] border border-amber-500/40 rounded-lg focus:outline-none focus:border-amber-400"
                            />

                            <button
                              type="button"
                              onClick={() => {
                                const next = currentCount + 1;
                                updateMenuItemStock(item.id, 'few_left', next);
                              }}
                              className="w-7 h-7 rounded-lg bg-[#1E2433] hover:bg-white/[0.1] text-amber-300 flex items-center justify-center font-bold border border-white/[0.1] cursor-pointer"
                              title="Increment 1 plate"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex items-center gap-1 text-[11px] pt-1">
                          <span className="text-slate-400 font-medium">Quick:</span>
                          {[2, 4, 6, 10, 15].map(preset => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => updateMenuItemStock(item.id, 'few_left', preset)}
                              className={`px-2 py-0.5 rounded-md border transition-colors cursor-pointer text-xs ${
                                currentCount === preset
                                  ? 'bg-amber-500 text-white font-bold border-amber-400'
                                  : 'bg-[#1E2433] text-slate-300 hover:text-white border-white/[0.08]'
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
    </div>
  );
};
