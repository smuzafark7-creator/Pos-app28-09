import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  TrendingUp, 
  ShoppingBag, 
  Utensils, 
  Package, 
  ChefHat, 
  CheckCircle2, 
  Building2, 
  CreditCard, 
  QrCode, 
  Banknote,
  ArrowRight,
  Clock,
  ChevronRight,
  Users,
  Bell,
  Grid3X3,
  Check,
  Flame
} from 'lucide-react';
import { BRANCHES } from '../data/mockData';
import { BrandWatermark } from '../components/BrandWatermark';

export const DashboardPage: React.FC = () => {
  const { 
    computedStats, 
    currentBranch, 
    setBranch, 
    setActiveTab, 
    filteredKots, 
    filteredBills, 
    openReceiptModal,
    currentUser,
    filteredTables,
    selectTableForPOS,
    pendingBillRequests,
    updateKOTStatus,
    requestBill
  } = useApp();

  const isConsolidated = currentBranch === 'all';
  const branchName = isConsolidated ? 'All Branches (Consolidated)' : (BRANCHES.find(b => b.id === currentBranch)?.name || 'Main Branch');

  // -------------------------------------------------------------
  // WAITER ROLE: Limited Operational View (No sensitive financials)
  // -------------------------------------------------------------
  if (currentUser?.role === 'waiter') {
    const occupiedTables = filteredTables.filter(t => t.status === 'occupied' || t.status === 'billing' || t.status === 'ready');
    const availableTables = filteredTables.filter(t => t.status === 'available');
    const readyKots = filteredKots.filter(k => k.status === 'ready' && !k.isBilled);
    const cookingKots = filteredKots.filter(k => (k.status === 'preparing' || k.status === 'new') && !k.isBilled);

    return (
      <div className="relative p-4 sm:p-6 space-y-6 max-w-7xl mx-auto font-mono text-slate-100">
        <BrandWatermark opacity={0.09} />
        {/* Top Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111c2e] p-4 sm:p-5 rounded-lg border border-slate-800/80 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Floor Operations Console</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Floor dispatch & kitchen monitor for <strong className="text-slate-200">{branchName}</strong> • Logged in as <span className="text-emerald-400 font-bold">{currentUser?.name || 'Waiter'} (Waiter)</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('tables')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Tables Floor</span>
            </button>
            <button
              onClick={() => setActiveTab('pos')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <span>Dine-In POS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveTab('kitchen')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors border border-slate-700 cursor-pointer"
            >
              <ChefHat className="w-3.5 h-3.5 text-emerald-400" />
              <span>KDS</span>
            </button>
          </div>
        </div>

        {/* Operational KPI Cards (No sensitive financials/revenue) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Occupied Tables */}
          <div className="bg-[#111c2e] p-4 rounded-lg border border-slate-800/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider">Occupied Tables</span>
              <div className="p-1.5 rounded bg-amber-950/50 text-amber-400 border border-amber-800/60">
                <Utensils className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-white tracking-tight">
              {occupiedTables.length} <span className="text-xs text-slate-500 font-normal">/ {filteredTables.length} Total</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {availableTables.length} tables currently available
            </div>
          </div>

          {/* Food Ready for Pickup */}
          <div className="bg-[#111c2e] p-4 rounded-lg border border-emerald-500/40 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-400">Food Ready</span>
              <div className="p-1.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-emerald-400 tracking-tight">
              {readyKots.length} <span className="text-xs text-emerald-500/80 font-normal">orders</span>
            </div>
            <div className="text-[10px] text-emerald-400 mt-1 font-semibold">
              {readyKots.length > 0 ? 'Ready to serve to tables now!' : 'No orders awaiting pickup'}
            </div>
          </div>

          {/* Cooking in Kitchen */}
          <div className="bg-[#111c2e] p-4 rounded-lg border border-slate-800/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider">Kitchen Cooking</span>
              <div className="p-1.5 rounded bg-sky-950/50 text-sky-400 border border-sky-800/60">
                <ChefHat className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-white tracking-tight">
              {cookingKots.length} <span className="text-xs text-slate-500 font-normal">KOTs</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Actively in preparation
            </div>
          </div>

          {/* Bill Requests Pending Cashier */}
          <div className="bg-[#111c2e] p-4 rounded-lg border border-purple-500/40 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-purple-300">Bill Requests</span>
              <div className="p-1.5 rounded bg-purple-950/60 text-purple-400 border border-purple-800/60">
                <Bell className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-purple-300 tracking-tight">
              {pendingBillRequests.length} <span className="text-xs text-purple-400/80 font-normal">pending</span>
            </div>
            <div className="text-[10px] text-purple-400 mt-1">
              Awaiting cashier desk settlement
            </div>
          </div>
        </div>

        {/* Food Ready Alert Section */}
        {readyKots.length > 0 && (
          <div className="bg-emerald-950/40 border border-emerald-500/80 rounded-lg p-4 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <h3 className="font-bold text-sm text-emerald-300">
                KITCHEN COUNTER: Food Ready for Service ({readyKots.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {readyKots.map(kot => (
                <div key={kot.id} className="bg-[#111c2e] p-3 rounded-lg border border-emerald-500/40 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{kot.kotNumber}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {kot.tableNumber || 'Takeaway'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 space-y-0.5 max-h-24 overflow-y-auto">
                    {(kot.items || []).map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{it?.quantity || 1}x {it?.name || (it as any)?.menuItem?.name || 'Item'}</span>
                        {it?.notes && <span className="text-[10px] text-amber-400 italic">({it.notes})</span>}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => updateKOTStatus(kot.id, 'served')}
                    className="w-full py-1.5 rounded bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>MARK AS SERVED TO TABLE</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Two-Column Operational Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Live Floor Table Matrix */}
          <div className="lg:col-span-2 bg-[#111c2e] p-5 rounded-lg border border-slate-800/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">Live Table Floor Matrix</h3>
                <p className="text-xs text-slate-400">Tap table to open in POS or request bill from Cashier</p>
              </div>
              <button
                onClick={() => setActiveTab('tables')}
                className="text-xs text-emerald-400 font-bold hover:underline flex items-center gap-1"
              >
                <span>Full Floor Plan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {filteredTables.map(tbl => {
                const isOccupied = tbl.status === 'occupied';
                const isReady = tbl.status === 'ready';
                const isBilling = tbl.status === 'billing';

                let borderCls = 'border-slate-800 bg-[#0c131f] hover:border-emerald-500';
                if (isReady) borderCls = 'border-emerald-500/60 bg-emerald-950/30';
                else if (isBilling) borderCls = 'border-purple-500/60 bg-purple-950/30';
                else if (isOccupied) borderCls = 'border-amber-500/50 bg-amber-950/25';

                return (
                  <div
                    key={tbl.id}
                    onClick={() => selectTableForPOS(tbl.name)}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer hover:shadow-xs flex flex-col justify-between ${borderCls}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white">{tbl.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        isReady ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        isBilling ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                        isOccupied ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {tbl.status}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>{tbl.capacity} seats</span>
                      {tbl.seatedAt && <span>{tbl.seatedAt}</span>}
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-between gap-1 text-[10px]">
                      <button
                        onClick={(e) => { e.stopPropagation(); selectTableForPOS(tbl.name); }}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 cursor-pointer"
                      >
                        POS
                      </button>
                      {isOccupied || isReady ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); requestBill(tbl.name); }}
                          className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer"
                          title="Request bill from cashier"
                        >
                          Req Bill
                        </button>
                      ) : isBilling ? (
                        <span className="text-[9px] text-purple-300 font-bold">Requested</span>
                      ) : (
                        <span className="text-[9px] text-emerald-400 font-bold">Free</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Col: In-Flight Kitchen Orders Queue */}
          <div className="bg-[#111c2e] p-5 rounded-lg border border-slate-800/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">Kitchen In-Flight Queue</h3>
                <p className="text-xs text-slate-400">Live prep status</p>
              </div>
              <button
                onClick={() => setActiveTab('kitchen')}
                className="text-xs text-emerald-400 font-bold hover:underline"
              >
                View KDS
              </button>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto">
              {cookingKots.map(kot => (
                <div key={kot.id} className="p-3 bg-[#0c131f] border border-slate-800 rounded-lg space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{kot.kotNumber}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {kot.status === 'preparing' ? 'PREPARING' : 'NEW'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 flex items-center justify-between">
                    <span>{kot.tableNumber || 'Takeaway'}</span>
                    <span>{kot.items.reduce((s, i) => s + i.quantity, 0)} items</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {(kot.items || []).map(i => `${i?.quantity || 1}x ${i?.name || (i as any)?.menuItem?.name || 'Item'}`).join(', ')}
                  </div>
                </div>
              ))}

              {cookingKots.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-500">
                  No orders currently cooking in kitchen.
                </div>
              )}
            </div>

            {/* Bill Requests status list */}
            {pendingBillRequests.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-purple-400" />
                  <span>Pending Cashier Settlements ({pendingBillRequests.length})</span>
                </h4>
                {pendingBillRequests.map(r => (
                  <div key={r.id} className="p-2 bg-purple-950/40 border border-purple-800/60 rounded text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white">{r.tableNumber}</span>
                      <span className="text-[10px] text-purple-300 block">Requested at {r.requestedAt}</span>
                    </div>
                    <span className="text-[10px] font-bold bg-purple-500/20 text-purple-200 border border-purple-500/30 px-1.5 py-0.5 rounded">
                      ₹{r.totalAmount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // EXECUTIVE DASHBOARD (Owner / Manager / Cashier with Financials)
  // -------------------------------------------------------------

  const totalPayments = computedStats.paymentBreakdown.cash + 
    computedStats.paymentBreakdown.upi + 
    computedStats.paymentBreakdown.card;

  const cashPct = Math.round((computedStats.paymentBreakdown.cash / (totalPayments || 1)) * 100);
  const upiPct = Math.round((computedStats.paymentBreakdown.upi / (totalPayments || 1)) * 100);
  const cardPct = Math.round((computedStats.paymentBreakdown.card / (totalPayments || 1)) * 100);

  // Hourly mock activity distribution for visual trend chart
  const hourlyData = [
    { hour: '11 AM', sales: 18500, orders: 34 },
    { hour: '12 PM', sales: 42300, orders: 82 },
    { hour: '1 PM', sales: 64100, orders: 126 },
    { hour: '2 PM', sales: 48900, orders: 94 },
    { hour: '3 PM', sales: 21500, orders: 42 },
    { hour: '4 PM', sales: 23150, orders: 50 },
  ];

  const maxHourlySales = Math.max(...hourlyData.map(h => h.sales));

  return (
    <div className="relative space-y-6 max-w-7xl mx-auto">
      <BrandWatermark opacity={0.09} />
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-3.5">
        {/* Today's Sales */}
        <div className="bg-[#111c2e] p-4 rounded-lg border border-slate-800/80 shadow-2xs relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider font-mono">Today's Sales</span>
            <div className="p-1.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-white tracking-tight font-mono">
            ₹{computedStats.todaySales.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-emerald-400 font-mono font-medium mt-1 flex items-center gap-0.5">
            <span>+14.2% vs yesterday</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-[#111c2e] p-4 rounded-lg border border-slate-800/80 shadow-2xs hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider font-mono">Total Orders</span>
            <div className="p-1.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-white tracking-tight font-mono">
            {computedStats.totalOrders}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            All order modes
          </div>
        </div>

        {/* Dine-in Orders */}
        <div className="bg-[#111c2e] p-4 rounded-lg border border-slate-800/80 shadow-2xs hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider font-mono">Dine-in Orders</span>
            <div className="p-1.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-white tracking-tight font-mono">
            {computedStats.dineInOrders}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            Avg table: 42 min
          </div>
        </div>

        {/* Takeaway Orders */}
        <div className="bg-[#111c2e] p-4 rounded-lg border border-slate-800/80 shadow-2xs hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider font-mono">Takeaway Orders</span>
            <div className="p-1.5 rounded bg-sky-950/80 text-sky-400 border border-sky-800/60">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-white tracking-tight font-mono">
            {computedStats.takeawayOrders}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            Parcel pickups
          </div>
        </div>

        {/* Card 5: Pending KOTs (Awaiting Kitchen Pickup) */}
        <div 
          onClick={() => setActiveTab(currentUser?.role === 'owner' ? 'kitchen' : 'kot')}
          className="bg-[#111c2e] p-4 rounded-lg border border-rose-900/50 shadow-2xs hover:border-rose-500/60 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-rose-400 font-mono">Pending KOTs</span>
            <div className="p-1.5 rounded bg-rose-950/80 text-rose-400 border border-rose-800/60 group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-rose-400 tracking-tight font-mono">
            {computedStats.pendingKOTs}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1 truncate">
            Awaiting Kitchen Pickup
          </div>
        </div>

        {/* Card 6: Active Cooking (Food in Preparation) */}
        <div 
          onClick={() => setActiveTab('kitchen')}
          className="bg-[#111c2e] p-4 rounded-lg border border-amber-900/50 shadow-2xs hover:border-amber-500/60 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-amber-400 font-mono">Active Cooking</span>
            <div className="p-1.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800/60 group-hover:scale-105 transition-transform">
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="text-xl font-bold text-amber-400 tracking-tight font-mono">
            {computedStats.activeCookingKOTs}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1 truncate">
            Food in Preparation
          </div>
        </div>

        {/* Card 7: Settled Bills */}
        <div 
          onClick={() => setActiveTab('bills')}
          className="bg-[#111c2e] p-4 rounded-lg border border-slate-800/80 shadow-2xs hover:border-emerald-500/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider font-mono">Settled Bills</span>
            <div className="p-1.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-400 tracking-tight font-mono">
            {computedStats.paidBills}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            100% audited
          </div>
        </div>
      </div>

      {/* Middle Row: Payment Breakdown & Branch Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Payment Breakdown Card */}
        <div className="lg:col-span-5 bg-[#111c2e] p-5 rounded-lg border border-slate-800/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div>
                <h3 className="font-bold text-sm text-white font-mono">Payment Reconciliation</h3>
                <p className="text-xs text-slate-400">Breakdown by tender channel</p>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700/80">
                ₹{totalPayments.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Visual multi-segment bar */}
            <div className="mt-4 mb-4">
              <div className="h-2.5 w-full rounded bg-slate-800 flex overflow-hidden border border-slate-700/80">
                <div style={{ width: `${upiPct}%` }} className="bg-emerald-500 h-full" title={`UPI: ${upiPct}%`} />
                <div style={{ width: `${cashPct}%` }} className="bg-amber-500 h-full" title={`Cash: ${cashPct}%`} />
                <div style={{ width: `${cardPct}%` }} className="bg-sky-500 h-full" title={`Card: ${cardPct}%`} />
              </div>
            </div>

            {/* Breakdown List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0f172a] border border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 flex items-center justify-center">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">UPI Payments</div>
                    <div className="text-[11px] text-slate-400">GPay, PhonePe, Dynamic QR</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-white font-mono">
                    ₹{computedStats.paymentBreakdown.upi.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono font-semibold">{upiPct}% share</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0f172a] border border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-amber-950/80 text-amber-400 border border-amber-800/60 flex items-center justify-center">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Cash Payments</div>
                    <div className="text-[11px] text-slate-400">Physical register drawer</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-white font-mono">
                    ₹{computedStats.paymentBreakdown.cash.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-amber-400 font-mono font-semibold">{cashPct}% share</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0f172a] border border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-sky-950/80 text-sky-400 border border-sky-800/60 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Card Payments</div>
                    <div className="text-[11px] text-slate-400">POS Swipe / Tap & Pay EDC</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-white font-mono">
                    ₹{computedStats.paymentBreakdown.card.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-sky-400 font-mono font-semibold">{cardPct}% share</div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between font-mono">
            <span>Includes split payments allocated by share</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Reconciled
            </span>
          </div>
        </div>

        {/* Branch Performance Comparison */}
        <div className="lg:col-span-7 bg-[#111c2e] p-5 rounded-lg border border-slate-800/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div>
                <h3 className="font-bold text-sm text-white font-mono">Branch Revenue Metrics</h3>
                <p className="text-xs text-slate-400">Cross-branch comparative performance</p>
              </div>
              <span className="text-xs font-mono font-medium text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700/80">
                3 Active Branches
              </span>
            </div>

            {/* Performance Bars */}
            <div className="space-y-3 mt-4">
              {/* Main Branch */}
              <div 
                onClick={() => setBranch('main')}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  currentBranch === 'main' ? 'border-emerald-500 bg-emerald-950/30' : 'border-slate-800/80 bg-[#0f172a] hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-baseline mb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Main Branch</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700/60">MG Road</span>
                  </div>
                  <span className="text-sm font-bold text-white font-mono">
                    ₹{computedStats.branchPerformance.main.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded transition-all duration-500" 
                    style={{ width: `${Math.round((computedStats.branchPerformance.main / computedStats.todaySales) * 100)}%` }} 
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 mt-1.5 font-mono">
                  <span>182 Orders completed</span>
                  <span className="font-medium text-slate-200">
                    {Math.round((computedStats.branchPerformance.main / computedStats.todaySales) * 100)}% share
                  </span>
                </div>
              </div>

              {/* City Branch */}
              <div 
                onClick={() => setBranch('city')}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  currentBranch === 'city' ? 'border-sky-500 bg-sky-950/30' : 'border-slate-800/80 bg-[#0f172a] hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-baseline mb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-white">City Branch</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700/60">Jayanagar 4th</span>
                  </div>
                  <span className="text-sm font-bold text-white font-mono">
                    ₹{computedStats.branchPerformance.city.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded overflow-hidden">
                  <div 
                    className="h-full bg-sky-500 rounded transition-all duration-500" 
                    style={{ width: `${Math.round((computedStats.branchPerformance.city / computedStats.todaySales) * 100)}%` }} 
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 mt-1.5 font-mono">
                  <span>136 Orders completed</span>
                  <span className="font-medium text-slate-200">
                    {Math.round((computedStats.branchPerformance.city / computedStats.todaySales) * 100)}% share
                  </span>
                </div>
              </div>

              {/* Beach Road Branch */}
              <div 
                onClick={() => setBranch('beach')}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  currentBranch === 'beach' ? 'border-amber-500 bg-amber-950/30' : 'border-slate-800/80 bg-[#0f172a] hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-baseline mb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">Beach Road Branch</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700/60">Promenade</span>
                  </div>
                  <span className="text-sm font-bold text-white font-mono">
                    ₹{computedStats.branchPerformance.beach.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded transition-all duration-500" 
                    style={{ width: `${Math.round((computedStats.branchPerformance.beach / computedStats.todaySales) * 100)}%` }} 
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 mt-1.5 font-mono">
                  <span>110 Orders completed</span>
                  <span className="font-medium text-slate-200">
                    {Math.round((computedStats.branchPerformance.beach / computedStats.todaySales) * 100)}% share
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between font-mono">
            <span>Select any branch card to isolate data telemetry</span>
            <span className="text-emerald-400 font-semibold cursor-pointer hover:underline" onClick={() => setBranch('all')}>
              View Consolidated
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Orders Data Grid & Pending Kitchen Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders Data Grid */}
        <div className="lg:col-span-7 bg-[#111c2e] p-5 rounded-lg border border-slate-800/80 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div>
              <h3 className="font-bold text-sm text-white font-mono">Recent Audited Invoices</h3>
              <p className="text-xs text-slate-400">Live sequential billing ledger</p>
            </div>
            <button
              onClick={() => setActiveTab('bills')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono cursor-pointer"
            >
              <span>View All Ledger</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/80 mt-2">
            {filteredBills.slice(0, 5).map(b => (
              <div 
                key={b.id} 
                onClick={() => openReceiptModal(b)}
                className="py-3 flex items-center justify-between hover:bg-slate-800/50 px-2 rounded-lg cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center font-mono font-bold text-xs">
                    {b.billNumber.replace('INV-', '#')}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      {b.tableNumber || (b.orderType === 'takeaway' ? 'Takeaway' : 'Parcel')}
                      <span className="ml-2 text-[10px] font-mono font-normal text-slate-300 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/60">{b.branchName}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {b.time} • {b.items.length} items • <span className="uppercase">{b.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-white font-mono">₹{b.grandTotal}</div>
                  <span className="inline-block text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                    Paid
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Kitchen Orders Widget */}
        <div className="lg:col-span-5 bg-[#111c2e] p-5 rounded-lg border border-slate-800/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white font-mono">Active Kitchen Orders (KOT)</h3>
              </div>
              <button
                onClick={() => setActiveTab('kitchen')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono cursor-pointer"
              >
                <span>KDS Terminal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 mt-3">
              {filteredKots.filter(k => k.status !== 'served' && k.status !== 'cancelled').slice(0, 3).map(k => (
                <div key={k.id} className="p-3 rounded-lg bg-[#0f172a] border border-slate-800/80 text-xs">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-bold text-white font-mono">{k.kotNumber} • {k.tableNumber || 'Takeaway'}</span>
                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded uppercase border ${
                      k.status === 'ready' 
                        ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60' 
                        : k.status === 'preparing'
                        ? 'bg-amber-950/80 text-amber-400 border-amber-800/60'
                        : 'bg-rose-950/80 text-rose-400 border-rose-800/60'
                    }`}>
                      {k.status === 'new' ? 'PENDING' : k.status === 'preparing' ? 'COOKING' : k.status}
                    </span>
                  </div>
                  <div className="text-slate-300 space-y-0.5 text-[11px] font-mono">
                    {(k.items || []).map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{it?.quantity || 1} × {it?.name || (it as any)?.menuItem?.name || 'Item'}</span>
                        <span className="text-slate-400">₹{((it?.rate || (it as any)?.menuItem?.price || 0) * (it?.quantity || 1))}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> {k.timeFormatted}
                    </span>
                    <span className="font-medium text-slate-300">{k.branchName}</span>
                  </div>
                </div>
              ))}

              {filteredKots.filter(k => k.status !== 'served' && k.status !== 'cancelled').length === 0 && (
                <div className="p-6 text-center text-xs text-slate-500 font-mono">
                  No active tickets in kitchen queue.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('kot')}
            className="w-full mt-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition-colors text-center font-mono border border-slate-700 cursor-pointer"
          >
            Manage All KOT Tickets
          </button>
        </div>
      </div>
    </div>
  );
};
