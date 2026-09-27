import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { 
  BarChart3, 
  Search, 
  X, 
  Utensils, 
  Package, 
  TrendingUp,
  Clock,
  Sparkles
} from 'lucide-react';

export const KitchenDispatchedView: React.FC = () => {
  const { dispatchedItemStats } = useApp();
  const [dispatchedSearch, setDispatchedSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'highest' | 'name'>('highest');

  // Metrics summary
  const totalDispatched = useMemo(() => {
    return dispatchedItemStats.reduce((acc, curr) => acc + curr.totalServed, 0);
  }, [dispatchedItemStats]);

  const totalDineInDispatched = useMemo(() => {
    return dispatchedItemStats.reduce((acc, curr) => acc + curr.dineIn, 0);
  }, [dispatchedItemStats]);

  const totalTakeawayDispatched = useMemo(() => {
    return dispatchedItemStats.reduce((acc, curr) => acc + curr.takeaway, 0);
  }, [dispatchedItemStats]);

  // Filtered & sorted dishes
  const filteredDispatchedItems = useMemo(() => {
    const list = dispatchedItemStats.filter(d =>
      d.name.toLowerCase().includes(dispatchedSearch.toLowerCase())
    );

    if (sortOrder === 'highest') {
      return list.sort((a, b) => b.totalServed - a.totalServed);
    } else {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [dispatchedItemStats, dispatchedSearch, sortOrder]);

  return (
    <div className="flex-1 h-full w-full overflow-y-auto bg-[#18191D] p-4 sm:p-6 text-slate-100 select-none">
      <div className="max-w-7xl mx-auto space-y-4 pb-8">
        {/* Full-Screen Page Header */}
        <div className="p-4 sm:p-5 bg-[#161B26] border border-white/[0.08] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-xs">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                  Dispatched Dishes Summary
                </h1>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  REAL-TIME SHIFT ANALYTICS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Item-level served velocity for the active shift. Automatically tallies as kitchen marks tickets ready or dispatched.
              </p>
            </div>
          </div>

          {/* Quick Shift Status Tag */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-600/40 text-xs font-bold text-emerald-400 flex items-center gap-1.5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{totalDispatched} Total Dishes Dispatched</span>
            </span>
          </div>
        </div>

        {/* 3 Large KPI Shift Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-2xl bg-[#161B26] border border-white/[0.08] shadow-md flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Dispatched</div>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">{totalDispatched}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Across all order types</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#161B26] border border-emerald-500/30 shadow-md flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Dine-In Plates</div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">{totalDineInDispatched}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {totalDispatched > 0 ? `${Math.round((totalDineInDispatched / totalDispatched) * 100)}% of shift volume` : 'Served to tables'}
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Utensils className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#161B26] border border-sky-500/30 shadow-md flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">Takeaway / Delivery</div>
              <div className="text-2xl sm:text-3xl font-black text-sky-400 mt-1">{totalTakeawayDispatched}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {totalDispatched > 0 ? `${Math.round((totalTakeawayDispatched / totalDispatched) * 100)}% of shift volume` : 'Packaged orders'}
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Package className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Search & Sort Controls Bar */}
        <div className="p-3.5 bg-[#161B26] border border-white/[0.08] rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={dispatchedSearch}
              onChange={e => setDispatchedSearch(e.target.value)}
              placeholder="Search dispatched dish by name..."
              className="w-full pl-10 pr-9 py-2 bg-[#1E2433] border border-white/[0.08] rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-inner"
            />
            {dispatchedSearch && (
              <button 
                type="button"
                onClick={() => setDispatchedSearch('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-[#1E2433] p-1 rounded-xl border border-white/[0.08] text-xs shrink-0">
            <button
              type="button"
              onClick={() => setSortOrder('highest')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                sortOrder === 'highest'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Highest Served First
            </button>
            <button
              type="button"
              onClick={() => setSortOrder('name')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                sortOrder === 'name'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dish Name (A-Z)
            </button>
          </div>
        </div>

        {/* Dispatched Dish Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredDispatchedItems.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 text-sm bg-[#161B26] rounded-2xl border border-white/[0.08]">
              {dispatchedSearch ? 'No dispatched dishes match your search query.' : 'No dishes have been marked as dispatched in this shift yet.'}
            </div>
          ) : (
            filteredDispatchedItems.map((dish, idx) => {
              const dineInPct = dish.totalServed > 0 ? (dish.dineIn / dish.totalServed) * 100 : 0;
              const takeawayPct = dish.totalServed > 0 ? (dish.takeaway / dish.totalServed) * 100 : 0;

              return (
                <div
                  key={dish.name}
                  className="p-4 rounded-2xl bg-[#1E2433] border border-white/[0.08] shadow-md space-y-3.5 hover:border-emerald-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-white/[0.05] text-slate-400 text-xs font-black flex items-center justify-center border border-white/10">
                        #{idx + 1}
                      </span>
                      <h3 className="text-sm font-extrabold text-white leading-tight">{dish.name}</h3>
                    </div>
                    <span className="text-xs font-black text-emerald-400 bg-emerald-950/80 border border-emerald-700/60 px-2.5 py-1 rounded-full shadow-xs">
                      {dish.totalServed} Served
                    </span>
                  </div>

                  {/* Dine-In vs Takeaway Counts */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-[#161B26] border border-emerald-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                        <Utensils className="w-3.5 h-3.5" />
                        <span>Dine-In</span>
                      </div>
                      <span className="font-extrabold text-white">{dish.dineIn}</span>
                    </div>

                    <div className="p-2 rounded-xl bg-[#161B26] border border-sky-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-sky-400 font-semibold">
                        <Package className="w-3.5 h-3.5" />
                        <span>Takeaway</span>
                      </div>
                      <span className="font-extrabold text-white">{dish.takeaway}</span>
                    </div>
                  </div>

                  {/* Ratio Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Dine-In: {Math.round(dineInPct)}%</span>
                      <span>Takeaway: {Math.round(takeawayPct)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-black/50 overflow-hidden flex shadow-inner">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${dineInPct}%` }}
                        title={`${dish.dineIn} Dine-in plates`}
                      />
                      <div
                        className="h-full bg-sky-500 transition-all duration-300"
                        style={{ width: `${takeawayPct}%` }}
                        title={`${dish.takeaway} Takeaway plates`}
                      />
                    </div>
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
