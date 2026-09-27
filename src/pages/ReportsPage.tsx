import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  CreditCard, 
  QrCode, 
  Banknote, 
  Utensils, 
  Package, 
  Building2, 
  Download, 
  Printer, 
  PieChart, 
  DollarSign, 
  ShoppingBag, 
  CheckCircle2, 
  Receipt 
} from 'lucide-react';
import { BRANCHES } from '../data/mockData';
import { BrandWatermark } from '../components/BrandWatermark';

export const ReportsPage: React.FC = () => {
  const { computedStats, currentBranch, branches, filteredBills, showToast } = useApp();
  const [dateFilter, setDateFilter] = useState<string>('Today');
  const [customDate, setCustomDate] = useState<string>('2026-09-07');

  // Compute metrics with date multipliers for demo filtering
  const multiplier = dateFilter === 'Today' ? 1 
    : dateFilter === 'Yesterday' ? 0.92 
    : dateFilter === 'This Week' ? 6.8 
    : dateFilter === 'This Month' ? 27.5 
    : 1;

  const totalSales = Math.round(computedStats.todaySales * multiplier);
  const totalOrders = Math.round(computedStats.totalOrders * multiplier);
  const aov = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

  // Payment Breakdown
  const cashSales = Math.round(computedStats.paymentBreakdown.cash * multiplier);
  const upiSales = Math.round(computedStats.paymentBreakdown.upi * multiplier);
  const cardSales = Math.round(computedStats.paymentBreakdown.card * multiplier);

  // Order Type Breakdown
  const dineInOrders = Math.round(computedStats.dineInOrders * multiplier);
  const takeawayOrders = Math.round(computedStats.takeawayOrders * multiplier);
  const parcelOrders = Math.max(1, Math.round(takeawayOrders * 0.4));
  const directTakeawayOrders = takeawayOrders - parcelOrders;

  const dineInRevenue = Math.round(totalSales * 0.68);
  const takeawayRevenue = Math.round(totalSales * 0.22);
  const parcelRevenue = totalSales - dineInRevenue - takeawayRevenue;

  // Branch Performance
  const mainBranchSales = Math.round(computedStats.branchPerformance.main * multiplier);
  const cityBranchSales = Math.round(computedStats.branchPerformance.city * multiplier);
  const beachBranchSales = Math.round(computedStats.branchPerformance.beach * multiplier);

  // Top Selling Items
  const topItems = [
    { name: 'Chicken Biryani', category: 'Biryani', qty: Math.round(142 * multiplier), revenue: Math.round(39760 * multiplier), pct: 28 },
    { name: 'Chicken 65', category: 'Starters', qty: Math.round(98 * multiplier), revenue: Math.round(23520 * multiplier), pct: 18 },
    { name: 'Butter Chicken', category: 'Main Course', qty: Math.round(65 * multiplier), revenue: Math.round(20800 * multiplier), pct: 15 },
    { name: 'Butter Naan', category: 'Breads', qty: Math.round(280 * multiplier), revenue: Math.round(14000 * multiplier), pct: 11 },
    { name: 'Mutton Biryani', category: 'Biryani', qty: Math.round(48 * multiplier), revenue: Math.round(17280 * multiplier), pct: 13 },
    { name: 'Coke / Soda', category: 'Beverages', qty: Math.round(210 * multiplier), revenue: Math.round(8400 * multiplier), pct: 7 },
  ];

  const handleExportReport = () => {
    showToast('Report Exported', `Generated Financial Statement for ${dateFilter}`);
    window.print();
  };

  return (
    <div 
      className="relative min-h-full w-full p-4 sm:p-6 space-y-6 max-w-7xl mx-auto font-mono text-slate-100 bg-[#0a0f1d]"
      style={{ backgroundColor: '#0a0f1d' }}
    >
      {/* Bilaal Restaurant Crest Watermark */}
      <BrandWatermark opacity={0.10} />

      <div className="relative z-10 space-y-6">
        {/* Top Banner */}
        <div 
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl border shadow-lg"
          style={{ backgroundColor: '#0d1527', borderColor: '#1e293b' }}
        >
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Executive Business Reports</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-sans">
              Consolidated operational metrics, revenue channels, and branch benchmarking for{' '}
              <strong className="text-white font-mono">
                {currentBranch === 'all' ? 'All 3 Branches' : (branches || []).find(b => b.id === currentBranch)?.name || 'Branch'}
              </strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Time Filter Tabs */}
            <div className="flex items-center p-1 rounded-lg border text-xs" style={{ backgroundColor: '#0b1120', borderColor: '#1e293b' }}>
              {['Today', 'Yesterday', 'This Week', 'This Month', 'Custom Date'].map(t => {
                const isActive = dateFilter === t;
                return (
                  <button
                    key={t}
                    onClick={() => setDateFilter(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isActive ? 'text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                    style={isActive ? { backgroundColor: '#8b0000', border: '1px solid #b91c1c' } : undefined}
                  >
                    {t}
                  </button>
                );
              })}
            </div>

            {dateFilter === 'Custom Date' && (
              <input
                type="date"
                value={customDate}
                onChange={e => setCustomDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-xs text-white focus:outline-none"
                style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}
              />
            )}

            <button
              onClick={handleExportReport}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-white text-xs font-bold transition-colors cursor-pointer hover:bg-blue-800"
              style={{ backgroundColor: '#1e3a8a', border: '1px solid rgba(59, 130, 246, 0.4)' }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* 4 Executive Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Today's Sales */}
          <div 
            className="p-5 rounded-xl border shadow-lg"
            style={{ backgroundColor: '#0d1527', borderColor: '#1e293b' }}
          >
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {dateFilter === 'Today' ? "Today's Sales" : `${dateFilter} Sales`}
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono" style={{ color: '#10b981' }}>
              ₹{totalSales.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 font-sans mt-1">
              Gross billed revenue across all modes
            </div>
          </div>

          {/* 2. Total Invoices */}
          <div 
            className="p-5 rounded-xl border shadow-lg"
            style={{ backgroundColor: '#0d1527', borderColor: '#1e293b' }}
          >
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Settled Bills
              </span>
              <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {totalOrders}
            </div>
            <div className="text-[11px] text-slate-400 font-sans mt-1">
              Paid customer orders processed
            </div>
          </div>

          {/* 3. Average Order Value */}
          <div 
            className="p-5 rounded-xl border shadow-lg"
            style={{ backgroundColor: '#0d1527', borderColor: '#1e293b' }}
          >
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Average Ticket (AOV)
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-950/80 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              ₹{aov.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 font-sans mt-1">
              Average spend per invoice
            </div>
          </div>

          {/* 4. Digital Pay Share */}
          <div 
            className="p-5 rounded-xl border shadow-lg"
            style={{ backgroundColor: '#0d1527', borderColor: '#1e293b' }}
          >
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Digital Pay Ratio
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-950/80 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                <QrCode className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {Math.round(((upiSales + cardSales) / (totalSales || 1)) * 100)}%
            </div>
            <div className="text-[11px] text-slate-400 font-sans mt-1">
              UPI + Card electronic receipts
            </div>
          </div>
        </div>

        {/* 3 Column Detailed Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Payment Method Breakdown */}
          <div 
            className="p-5 rounded-xl border shadow-lg space-y-4"
            style={{ backgroundColor: '#0d1527', borderColor: '#1e293b' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: '#1e293b' }}>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Payment Mode Breakdown</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-sans">Audit Ledger</span>
            </div>

            <div className="space-y-3 font-mono">
              {/* UPI */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">UPI / QR Code</span>
                  <span className="font-bold" style={{ color: '#38bdf8' }}>₹{upiSales.toLocaleString('en-IN')}</span>
                </div>
                <div className="h-2 w-full rounded overflow-hidden" style={{ backgroundColor: '#090e1a' }}>
                  <div 
                    className="h-full bg-sky-500 rounded" 
                    style={{ width: `${Math.round((upiSales / totalSales) * 100)}%` }} 
                  />
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  {Math.round((upiSales / totalSales) * 100)}% of total revenue
                </div>
              </div>

              {/* Cash */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Physical Cash</span>
                  <span className="font-bold" style={{ color: '#10b981' }}>₹{cashSales.toLocaleString('en-IN')}</span>
                </div>
                <div className="h-2 w-full rounded overflow-hidden" style={{ backgroundColor: '#090e1a' }}>
                  <div 
                    className="h-full bg-emerald-500 rounded" 
                    style={{ width: `${Math.round((cashSales / totalSales) * 100)}%` }} 
                  />
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  {Math.round((cashSales / totalSales) * 100)}% of total revenue
                </div>
              </div>

              {/* Card */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Credit / Debit Card</span>
                  <span className="font-bold text-purple-400">₹{cardSales.toLocaleString('en-IN')}</span>
                </div>
                <div className="h-2 w-full rounded overflow-hidden" style={{ backgroundColor: '#090e1a' }}>
                  <div 
                    className="h-full bg-purple-500 rounded" 
                    style={{ width: `${Math.round((cardSales / totalSales) * 100)}%` }} 
                  />
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  {Math.round((cardSales / totalSales) * 100)}% of total revenue
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Order Type Breakdown */}
          <div 
            className="p-5 rounded-xl border shadow-lg space-y-4"
            style={{ backgroundColor: '#0d1527', borderColor: '#1e293b' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: '#1e293b' }}>
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Dining Channel Split</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-sans">Channels</span>
            </div>

            <div className="space-y-3 font-mono">
              {/* Dine In */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Dine-In Tables</span>
                  <span className="font-bold text-white">₹{dineInRevenue.toLocaleString('en-IN')}</span>
                </div>
                <div className="h-2 w-full rounded overflow-hidden" style={{ backgroundColor: '#090e1a' }}>
                  <div 
                    className="h-full bg-amber-500 rounded" 
                    style={{ width: `${Math.round((dineInRevenue / totalSales) * 100)}%` }} 
                  />
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  {dineInOrders} orders • {Math.round((dineInRevenue / totalSales) * 100)}% of sales
                </div>
              </div>

              {/* Direct Takeaway */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Takeaway (Counter)</span>
                  <span className="font-bold text-white">₹{takeawayRevenue.toLocaleString('en-IN')}</span>
                </div>
                <div className="h-2 w-full rounded overflow-hidden" style={{ backgroundColor: '#090e1a' }}>
                  <div 
                    className="h-full bg-blue-500 rounded" 
                    style={{ width: `${Math.round((takeawayRevenue / totalSales) * 100)}%` }} 
                  />
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  {directTakeawayOrders} orders • {Math.round((takeawayRevenue / totalSales) * 100)}% of sales
                </div>
              </div>

              {/* Parcel */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Delivery / Parcel</span>
                  <span className="font-bold text-white">₹{parcelRevenue.toLocaleString('en-IN')}</span>
                </div>
                <div className="h-2 w-full rounded overflow-hidden" style={{ backgroundColor: '#090e1a' }}>
                  <div 
                    className="h-full bg-purple-500 rounded" 
                    style={{ width: `${Math.round((parcelRevenue / totalSales) * 100)}%` }} 
                  />
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  {parcelOrders} orders • {Math.round((parcelRevenue / totalSales) * 100)}% of sales
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Multi-Branch Performance */}
          <div 
            className="p-5 rounded-xl border shadow-lg space-y-4"
            style={{ backgroundColor: '#0d1527', borderColor: '#1e293b' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: '#1e293b' }}>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Branch Revenue Matrix</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-sans">3 Outlets</span>
            </div>

            <div className="space-y-3 font-mono">
              {/* Main Branch */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Main Branch</span>
                  <span className="text-white font-bold">₹{mainBranchSales.toLocaleString('en-IN')}</span>
                </div>
                <div className="h-2 w-full rounded overflow-hidden" style={{ backgroundColor: '#090e1a' }}>
                  <div 
                    className="h-full bg-emerald-500 rounded" 
                    style={{ width: `${Math.round((mainBranchSales / totalSales) * 100)}%` }} 
                  />
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  {Math.round((mainBranchSales / totalSales) * 100)}% contribution • Flagship MG Road
                </div>
              </div>

              {/* City Branch */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">City Branch</span>
                  <span className="text-white font-bold">₹{cityBranchSales.toLocaleString('en-IN')}</span>
                </div>
                <div className="h-2 w-full rounded overflow-hidden" style={{ backgroundColor: '#090e1a' }}>
                  <div 
                    className="h-full bg-teal-500 rounded" 
                    style={{ width: `${Math.round((cityBranchSales / totalSales) * 100)}%` }} 
                  />
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  {Math.round((cityBranchSales / totalSales) * 100)}% contribution • Jayanagar Complex
                </div>
              </div>

              {/* Beach Road Branch */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Beach Road Branch</span>
                  <span className="text-white font-bold">₹{beachBranchSales.toLocaleString('en-IN')}</span>
                </div>
                <div className="h-2 w-full rounded overflow-hidden" style={{ backgroundColor: '#090e1a' }}>
                  <div 
                    className="h-full bg-sky-500 rounded" 
                    style={{ width: `${Math.round((beachBranchSales / totalSales) * 100)}%` }} 
                  />
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  {Math.round((beachBranchSales / totalSales) * 100)}% contribution • Coastal Promenade
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Selling Items Table */}
        <div 
          className="rounded-xl border shadow-lg overflow-hidden"
          style={{ backgroundColor: '#0d1527', borderColor: '#1e293b' }}
        >
          <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: '#1e293b' }}>
            <div>
              <h3 className="font-bold text-sm text-white">Top Performing Dishes</h3>
              <p className="text-xs text-slate-400 font-sans">Sales volume and gross revenue contribution</p>
            </div>
            <span 
              className="text-xs px-2.5 py-1 rounded-lg border font-mono"
              style={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#cbd5e1' }}
            >
              {dateFilter}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead 
                className="border-b uppercase tracking-wider text-[10px]"
                style={{ backgroundColor: '#0b1120', borderColor: '#1e293b', color: '#cbd5e1' }}
              >
                <tr>
                  <th className="py-3 px-4 font-bold">Rank & Dish</th>
                  <th className="py-3 px-4 font-bold">Category</th>
                  <th className="py-3 px-4 text-center font-bold">Units Sold</th>
                  <th className="py-3 px-4 text-right font-bold">Gross Revenue</th>
                  <th className="py-3 px-4 text-right font-bold">Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {topItems.map((dish, idx) => {
                  const isEven = idx % 2 === 0;
                  const rowBg = isEven ? '#0d1527' : '#090e1a';
                  return (
                    <tr 
                      key={idx} 
                      className="hover:bg-[#172554] transition-colors"
                      style={{ backgroundColor: rowBg }}
                    >
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2.5">
                        <span 
                          className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold border"
                          style={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#cbd5e1' }}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-white">{dish.name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <span 
                          className="px-2 py-0.5 rounded text-[11px]"
                          style={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#cbd5e1' }}
                        >
                          {dish.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold font-mono text-white">
                        {dish.qty}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold font-mono" style={{ color: '#10b981' }}>
                        ₹{dish.revenue.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 rounded h-1.5 overflow-hidden" style={{ backgroundColor: '#090e1a' }}>
                            <div className="bg-emerald-500 h-full rounded" style={{ width: `${dish.pct * 3}%` }} />
                          </div>
                          <span className="text-[11px] font-bold font-mono text-slate-300">{dish.pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
