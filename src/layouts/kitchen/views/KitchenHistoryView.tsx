import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { 
  History, 
  Search, 
  X, 
  RotateCcw, 
  Clock, 
  Utensils, 
  Package, 
  FileText,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export const KitchenHistoryView: React.FC = () => {
  const { filteredKots, updateKOTStatus, showToast } = useApp();
  const [historySearch, setHistorySearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'dineIn' | 'takeaway'>('all');

  // Completed KOTs (served or ready)
  const completedKots = useMemo(() => {
    return filteredKots
      .filter(k => k.status === 'served' || k.status === 'ready')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filteredKots]);

  // Filtered list
  const filteredList = useMemo(() => {
    return completedKots.filter(kot => {
      // Search
      const q = historySearch.toLowerCase().trim();
      const matchSearch = !q ||
        kot.kotNumber.toLowerCase().includes(q) ||
        (kot.tableNumber || '').toLowerCase().includes(q) ||
        kot.items.some(it => it.name.toLowerCase().includes(q));

      // Type filter
      let matchType = true;
      if (typeFilter === 'dineIn') matchType = !!kot.tableNumber;
      if (typeFilter === 'takeaway') matchType = !kot.tableNumber;

      return matchSearch && matchType;
    });
  }, [completedKots, historySearch, typeFilter]);

  const handleRecallOrder = (kotId: string, kotNumber: string) => {
    updateKOTStatus(kotId, 'preparing');
    showToast('KOT Recalled', `KOT #${kotNumber} returned to Kitchen cooking queue`, 'info');
  };

  return (
    <div className="flex-1 h-full w-full overflow-y-auto bg-[#18191D] p-4 sm:p-6 text-slate-100 select-none">
      <div className="max-w-7xl mx-auto space-y-4 pb-8">
        {/* Full-Screen Page Header */}
        <div className="p-4 sm:p-5 bg-[#161B26] border border-white/[0.08] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0 shadow-xs">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                  Order History & Recall Log
                </h1>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
                  {completedKots.length} COMPLETED THIS SHIFT
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Archived orders dispatched during this shift. If an order was bumped by mistake or needs rework, use Recall to restore it to the live queue.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-[#1E2433] border border-white/10 text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{completedKots.length} Orders Archived</span>
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-3.5 bg-[#161B26] border border-white/[0.08] rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={historySearch}
              onChange={e => setHistorySearch(e.target.value)}
              placeholder="Search by KOT #, table number, or dish name..."
              className="w-full pl-10 pr-9 py-2 bg-[#1E2433] border border-white/[0.08] rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-inner"
            />
            {historySearch && (
              <button 
                type="button"
                onClick={() => setHistorySearch('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Type Segmented Filter */}
          <div className="flex items-center gap-1 bg-[#1E2433] p-1 rounded-xl border border-white/[0.08] text-xs shrink-0">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Types ({completedKots.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('dineIn')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                typeFilter === 'dineIn'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dine-In ({completedKots.filter(k => !!k.tableNumber).length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('takeaway')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                typeFilter === 'takeaway'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Takeaway ({completedKots.filter(k => !k.tableNumber).length})
            </button>
          </div>
        </div>

        {/* Order History Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredList.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 text-sm bg-[#161B26] rounded-2xl border border-white/[0.08]">
              {historySearch ? 'No archived orders match your search query.' : 'No completed or served orders recorded in this shift yet.'}
            </div>
          ) : (
            filteredList.map(kot => (
              <div
                key={kot.id}
                className="p-4 rounded-2xl bg-[#1E2433] border border-white/[0.08] shadow-md flex flex-col justify-between space-y-3.5 hover:border-sky-500/40 transition-colors"
              >
                <div>
                  {/* Top Bar: KOT Number, Destination & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">KOT #{kot.kotNumber}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-lg bg-[#161B26] border border-white/10 text-amber-400 font-bold flex items-center gap-1">
                        {kot.tableNumber ? (
                          <>
                            <Utensils className="w-3 h-3" />
                            <span>Table {kot.tableNumber}</span>
                          </>
                        ) : (
                          <>
                            <Package className="w-3 h-3" />
                            <span>Takeaway</span>
                          </>
                        )}
                      </span>
                    </div>

                    <span className="text-[10px] text-emerald-400 bg-emerald-950/70 border border-emerald-700/60 px-2.5 py-0.5 rounded-full font-bold uppercase">
                      {kot.status}
                    </span>
                  </div>

                  {/* Timing Info */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Placed: {kot.timeFormatted}</span>
                    {kot.readyAt && <span>• Ready: {kot.readyAt}</span>}
                  </div>

                  {/* Items List */}
                  <div className="mt-3 pt-2.5 border-t border-white/[0.06] space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {kot.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-slate-200">
                        <div className="flex items-center gap-1.5 truncate pr-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </div>
                        <span className="font-extrabold text-emerald-400 shrink-0 text-xs">
                          ×{item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Special instructions */}
                  {kot.specialInstructions && (
                    <div className="mt-2.5 text-[11px] text-amber-300/90 italic bg-amber-950/30 border border-amber-800/30 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">Note: {kot.specialInstructions}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Action: Recall Button */}
                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {kot.items.length} {kot.items.length === 1 ? 'item' : 'items'}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRecallOrder(kot.id, kot.kotNumber)}
                    className="px-3.5 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 hover:text-white border border-sky-500/40 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                    title="Restore this order back to active cooking queue"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                    <span>Recall to Kitchen</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
