import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  TrendingUp, 
  Receipt, 
  Users, 
  Clock, 
  UtensilsCrossed, 
  DollarSign, 
  Building2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const OwnerMetrics: React.FC = () => {
  const { bills, tables, kots, currentBranch, branches } = useApp();

  // Filter bills by branch if branch selected
  const branchBills = bills.filter(
    b => currentBranch === 'all' || b.branchId === currentBranch
  );

  const totalSales = branchBills.reduce((acc, b) => acc + b.grandTotal, 0);
  const totalGst = branchBills.reduce((acc, b) => acc + b.gstAmount, 0);
  const netRevenue = Math.max(0, totalSales - totalGst);
  const totalBillsCount = branchBills.length;
  const avgOrderValue = totalBillsCount > 0 ? totalSales / totalBillsCount : 0;

  // Active tables
  const branchTables = tables.filter(
    t => currentBranch === 'all' || t.branchId === currentBranch
  );
  const occupiedTables = branchTables.filter(t => t.status === 'occupied' || t.status === 'billing');
  const occupancyRate = branchTables.length > 0 
    ? Math.round((occupiedTables.length / branchTables.length) * 100) 
    : 0;

  // Active KOTs
  const activeKots = kots.filter(
    k => (currentBranch === 'all' || k.branchId === currentBranch) &&
         (k.status === 'new' || k.status === 'preparing')
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none font-sans">
      {/* 1. Gross Revenue */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Gross Sales
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-extrabold text-slate-900">
            ₹{totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-700 font-semibold">
            <TrendingUp className="w-3 h-3" />
            <span>+14.2% vs yesterday</span>
          </div>
        </div>
      </div>

      {/* 2. Net Sales & GST */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Net Revenue (Excl. Tax)
          </span>
          <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center">
            <Receipt className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-extrabold text-slate-900">
            ₹{netRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            GST 5%: ₹{totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* 3. Average Order Value (AOV) */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Avg Ticket Size (AOV)
          </span>
          <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-extrabold text-slate-900">
            ₹{avgOrderValue.toFixed(2)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Total Settled Bills: {totalBillsCount}
          </div>
        </div>
      </div>

      {/* 4. Table Occupancy & Active KOTs */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Table Occupancy
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-extrabold text-slate-900">
            {occupancyRate}%
          </div>
          <div className="mt-1 text-[11px] text-amber-700 font-semibold flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span>{occupiedTables.length} of {branchTables.length} Active • {activeKots.length} in Kitchen</span>
          </div>
        </div>
      </div>
    </div>
  );
};
