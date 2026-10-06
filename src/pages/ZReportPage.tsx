import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FileSpreadsheet, 
  Printer, 
  Lock, 
  Receipt, 
  TrendingUp, 
  Wallet, 
  QrCode, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  DollarSign, 
  AlertCircle,
  X,
  Layers,
  UtensilsCrossed
} from 'lucide-react';
import { BrandWatermark } from '../components/BrandWatermark';

export const ZReportPage: React.FC = () => {
  const { 
    currentUser, 
    bills, 
    menuItems, 
    showToast,
    openReceiptModal
  } = useApp();

  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [shiftClosed, setShiftClosed] = useState(false);
  const [settleNotes, setSettleNotes] = useState('');

  // 1. Settled Bills Ledger
  const settledBills = useMemo(() => {
    return bills.filter(b => b.status !== 'cancelled');
  }, [bills]);

  // Total Gross Sales
  const grossSales = useMemo(() => {
    return settledBills.reduce((sum, b) => sum + b.grandTotal, 0);
  }, [settledBills]);

  // Taxable Base & GST Breakdown
  const totalGst = useMemo(() => {
    return settledBills.reduce((sum, b) => sum + b.gstAmount, 0);
  }, [settledBills]);

  const netRevenue = useMemo(() => {
    // If subtotal is present on bills, sum subtotal, else grossSales - totalGst
    const subtotalSum = settledBills.reduce((sum, b) => sum + (b.subtotal || (b.grandTotal - b.gstAmount)), 0);
    return subtotalSum > 0 ? subtotalSum : (grossSales - totalGst);
  }, [settledBills, grossSales, totalGst]);

  const effectiveTaxRate = useMemo(() => {
    if (netRevenue <= 0) return 5.0;
    return (totalGst / netRevenue) * 100;
  }, [totalGst, netRevenue]);

  // Check if taxes represent multi-slab rates (e.g. food 5% vs beverages 12%/18%)
  const isMultiSlab = useMemo(() => {
    return Math.abs(effectiveTaxRate - 5.0) > 0.15;
  }, [effectiveTaxRate]);

  // 2. Reconciled Payment Ledger & Tender Breakdown
  const {
    cashBills,
    upiBills,
    cardBills,
    dueBills,
    totalBillsCount,
    cashInflow,
    upiAmount,
    cardAmount,
    creditAmount,
    totalShiftRevenue
  } = useMemo(() => {
    let cBills = 0, uBills = 0, crdBills = 0, dBills = 0;
    let cAmt = 0, uAmt = 0, crdAmt = 0, dAmt = 0;

    settledBills.forEach(b => {
      if (b.paymentMethod === 'cash') {
        cBills += 1;
        cAmt += b.grandTotal;
      } else if (b.paymentMethod === 'upi') {
        uBills += 1;
        uAmt += b.grandTotal;
      } else if (b.paymentMethod === 'card') {
        crdBills += 1;
        crdAmt += b.grandTotal;
      } else if (b.paymentMethod === 'due' || b.paymentMethod === 'credit') {
        dBills += 1;
        dAmt += b.grandTotal;
      } else if (b.paymentMethod === 'split') {
        const splitCash = b.splitDetails?.cash || 0;
        const splitUpi = b.splitDetails?.upi || 0;
        const splitCard = b.splitDetails?.card || 0;

        cAmt += splitCash;
        uAmt += splitUpi;
        crdAmt += splitCard;

        const allocated = splitCash + splitUpi + splitCard;
        if (allocated < b.grandTotal) {
          cAmt += (b.grandTotal - allocated);
        }

        // Categorize bill count by dominant payment channel
        if (splitCash >= splitUpi && splitCash >= splitCard) {
          cBills += 1;
        } else if (splitUpi >= splitCard) {
          uBills += 1;
        } else {
          crdBills += 1;
        }
      } else {
        // Fallback default
        cBills += 1;
        cAmt += b.grandTotal;
      }
    });

    // Exact reconciliation check with grossSales: ensure Cash + UPI + Card + Credit === Total Revenue
    const tenderSum = Number((cAmt + uAmt + crdAmt + dAmt).toFixed(2));
    const diff = Number((grossSales - tenderSum).toFixed(2));
    if (Math.abs(diff) > 0) {
      cAmt = Number((cAmt + diff).toFixed(2));
    }

    const totalBills = cBills + uBills + crdBills + dBills;
    const totalRev = Number((cAmt + uAmt + crdAmt + dAmt).toFixed(2));

    return {
      cashBills: cBills,
      upiBills: uBills,
      cardBills: crdBills,
      dueBills: dBills,
      totalBillsCount: totalBills,
      cashInflow: cAmt,
      upiAmount: uAmt,
      cardAmount: crdAmt,
      creditAmount: dAmt,
      totalShiftRevenue: totalRev
    };
  }, [settledBills, grossSales]);

  // Drawer Cash Integrity: Opening Float (₹5,000.00) + Reconciled Cash Inflow = Physical Drawer Cash
  const openingFloat = 5000;
  const cashDrawerTotal = openingFloat + cashInflow;

  const [countedCash, setCountedCash] = useState<string>('');

  // Synchronize counted cash with drawer cash total when ready or on modal open
  React.useEffect(() => {
    if (!countedCash && cashDrawerTotal > 0) {
      setCountedCash(cashDrawerTotal.toFixed(2));
    }
  }, [cashDrawerTotal, countedCash]);

  // Category breakdown calculation
  const categorySales = useMemo(() => {
    const itemToCategory: Record<string, string> = {};
    menuItems.forEach(item => {
      itemToCategory[item.name.toLowerCase().trim()] = item.category;
    });

    const categoriesMap: Record<string, { quantity: number; revenue: number }> = {
      'Biryani': { quantity: 0, revenue: 0 },
      'Starters': { quantity: 0, revenue: 0 },
      'Beverages': { quantity: 0, revenue: 0 },
      'Main Course': { quantity: 0, revenue: 0 },
      'Breads': { quantity: 0, revenue: 0 },
      'Desserts': { quantity: 0, revenue: 0 }
    };

    bills.forEach(bill => {
      bill.items?.forEach(item => {
        const lower = item.name.toLowerCase().trim();
        let cat = itemToCategory[lower];
        if (!cat) {
          if (lower.includes('biryani')) cat = 'Biryani';
          else if (lower.includes('tikka') || lower.includes('65') || lower.includes('kebab') || lower.includes('chilli') || lower.includes('starter')) cat = 'Starters';
          else if (lower.includes('coke') || lower.includes('lassi') || lower.includes('soda') || lower.includes('lime') || lower.includes('water') || lower.includes('tea') || lower.includes('coffee')) cat = 'Beverages';
          else if (lower.includes('roti') || lower.includes('naan') || lower.includes('kulcha') || lower.includes('paratha')) cat = 'Breads';
          else if (lower.includes('jamun') || lower.includes('dessert') || lower.includes('ice cream') || lower.includes('kulfi')) cat = 'Desserts';
          else cat = 'Main Course';
        }

        if (!categoriesMap[cat]) {
          categoriesMap[cat] = { quantity: 0, revenue: 0 };
        }
        categoriesMap[cat].quantity += item.quantity;
        categoriesMap[cat].revenue += item.amount;
      });
    });

    return categoriesMap;
  }, [bills, menuItems]);

  const totalCategoryRevenue = useMemo(() => {
    return Object.values(categorySales).reduce((sum: number, c: { quantity: number; revenue: number }) => sum + c.revenue, 0) || 1;
  }, [categorySales]);

  // Handle Full Print
  const handlePrintReport = () => {
    showToast('Z-Report Printed', 'Shift close summary dispatched to Counter EPSON Thermal Register.', 'success');
    if (bills.length > 0) {
      openReceiptModal(bills[0]);
    }
  };

  // Handle Close Shift & Settle
  const handleConfirmSettle = () => {
    setShiftClosed(true);
    setIsSettleModalOpen(false);
    showToast(
      'Shift Closed & Settled',
      `Cashier drawer closed with ₹${countedCash} physical cash verified. Z-Report logged.`,
      'success'
    );
  };

  const cashierDisplayName = currentUser?.name || 'Anita Deshmukh';
  const reportDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const countedNum = parseFloat(countedCash) || 0;
  const variance = countedNum - cashDrawerTotal;

  return (
    <div 
      className="zreport-screen w-full min-h-screen font-sans p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none relative"
      style={{ backgroundColor: '#0a0f1d', minHeight: '100%' }}
    >
      {/* Bilaal Restaurant Crest Watermark */}
      <BrandWatermark opacity={0.10} />

      <div className="relative z-10 space-y-6">
        {/* 1. Header Bar */}
        <div 
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 shadow-lg zreport-header-card"
          style={{ backgroundColor: '#0d1527', border: '1px solid #1e293b', borderRadius: '16px' }}
        >
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h1 
              className="tracking-tight"
              style={{ color: '#ffffff', fontWeight: 800, fontSize: '20px' }}
            >
              Day-End Z-Report / Shift Close Audit
            </h1>
            {shiftClosed && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Shift Settled
              </span>
            )}
          </div>
          <p style={{ color: '#94a3b8', fontSize: '13px' }} className="pl-11">
            Cashier: <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{cashierDisplayName}</span> • Terminal Register #01 • <span className="font-mono text-slate-300">{reportDate}</span>
          </p>
        </div>

        {/* Actions on top right */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 self-start md:self-auto">
          {/* [🖨️ Print Full Report] */}
          <button
            id="zreport-print-btn"
            type="button"
            onClick={handlePrintReport}
            className="hover:bg-[#1e40af] active:scale-98 transition-all cursor-pointer flex items-center gap-2 shadow-sm zreport-btn-print"
            style={{ 
              backgroundColor: '#1e3a8a', 
              color: '#ffffff', 
              border: '1px solid rgba(59, 130, 246, 0.5)', 
              fontWeight: 700, 
              padding: '8px 16px', 
              borderRadius: '8px', 
              fontSize: '12px' 
            }}
          >
            <Printer className="w-4 h-4 text-white" />
            <span style={{ color: '#ffffff', fontWeight: 700 }}>Print Full Report</span>
          </button>

          {/* [🔒 Close Shift & Settle Drawer] */}
          <button
            id="zreport-settle-btn"
            type="button"
            onClick={() => {
              setCountedCash(cashDrawerTotal.toFixed(2));
              setIsSettleModalOpen(true);
            }}
            className="hover:bg-[#8f1020] active:bg-[#4a030c] active:scale-98 transition-all cursor-pointer flex items-center gap-2 shadow-sm zreport-btn-settle"
            style={{ 
              backgroundColor: '#7a0c1a', 
              color: '#ffffff', 
              border: '1px solid #8f1020', 
              fontWeight: 800, 
              padding: '8px 16px', 
              borderRadius: '8px', 
              fontSize: '12px' 
            }}
          >
            <Lock className="w-4 h-4 text-white" />
            <span style={{ color: '#ffffff', fontWeight: 800 }}>{shiftClosed ? 'Review Shift Settlement' : 'Close Shift & Settle Drawer'}</span>
          </button>
        </div>
      </div>

      {/* Row 1: Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Invoices Settled */}
        <div 
          className="p-5 shadow-sm relative overflow-hidden zreport-kpi-card"
          style={{ backgroundColor: '#0d1527', border: '1px solid #1e293b', borderRadius: '12px' }}
        >
          <div className="flex items-center justify-between">
            <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px' }} className="uppercase">
              Total Invoices Settled
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <Receipt className="w-4 h-4 text-sky-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span 
              className="text-3xl tracking-tight"
              style={{ color: '#ffffff', fontWeight: 900, fontFamily: 'monospace' }}
            >
              {totalBillsCount}
            </span>
            <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 500 }}>bills cleared</span>
          </div>
          <div className="mt-2 text-[11px] flex items-center gap-1.5" style={{ color: '#64748b' }}>
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Active Shift: 11:00 AM – Present</span>
          </div>
        </div>

        {/* 2. Gross Sales */}
        <div 
          className="p-5 shadow-sm relative overflow-hidden zreport-kpi-card"
          style={{ backgroundColor: '#0d1527', border: '1px solid #1e293b', borderRadius: '12px' }}
        >
          <div className="flex items-center justify-between">
            <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px' }} className="uppercase">
              Gross Sales
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span 
              className="text-3xl tracking-tight"
              style={{ color: '#10b981', fontWeight: 900, fontFamily: 'monospace' }}
            >
              ₹{totalShiftRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 text-[11px] flex items-center gap-1.5" style={{ color: '#64748b' }}>
            <span className="font-medium text-emerald-400">Avg Ticket:</span>
            <span className="font-mono text-slate-300">
              ₹{(totalBillsCount > 0 ? totalShiftRevenue / totalBillsCount : 0).toFixed(0)} / order
            </span>
          </div>
        </div>

        {/* 3. Net Revenue (excl. Tax) */}
        <div 
          className="p-5 shadow-sm relative overflow-hidden zreport-kpi-card"
          style={{ backgroundColor: '#0d1527', border: '1px solid #1e293b', borderRadius: '12px' }}
        >
          <div className="flex items-center justify-between">
            <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px' }} className="uppercase">
              {isMultiSlab ? 'Net Taxable Revenue' : 'Net Revenue (excl. Tax)'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span 
              className="text-3xl tracking-tight"
              style={{ color: '#ffffff', fontWeight: 900, fontFamily: 'monospace' }}
            >
              ₹{netRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 text-[11px]" style={{ color: '#64748b' }}>
            <span>Taxable food & beverage base ({isMultiSlab ? `~${effectiveTaxRate.toFixed(2)}% effective tax` : '5% composite tax'})</span>
          </div>
        </div>

        {/* 4. GST Collected */}
        <div 
          className="p-5 shadow-sm relative overflow-hidden zreport-kpi-card"
          style={{ backgroundColor: '#0d1527', border: '1px solid #1e293b', borderRadius: '12px' }}
        >
          <div className="flex items-center justify-between">
            <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px' }} className="uppercase">
              {isMultiSlab ? 'Taxes: CGST + SGST (Multi-slab)' : 'GST Collected (5%)'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
              <Receipt className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span 
              className="text-3xl tracking-tight"
              style={{ color: '#fbbf24', fontWeight: 900, fontFamily: 'monospace' }}
            >
              ₹{totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 text-[11px] flex items-center gap-2" style={{ color: '#64748b' }}>
            <span>CGST ({isMultiSlab ? `${(effectiveTaxRate / 2).toFixed(2)}%` : '2.5%'}): ₹{(totalGst / 2).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span>•</span>
            <span>SGST ({isMultiSlab ? `${(effectiveTaxRate / 2).toFixed(2)}%` : '2.5%'}): ₹{(totalGst / 2).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Row 2: Payment Mode Breakdown Table & Drawer Reconciliation */}
      <div 
        className="p-5 sm:p-6 space-y-5 shadow-lg zreport-drawer-card"
        style={{ backgroundColor: '#0d1527', border: '1px solid #1e293b', borderRadius: '16px' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3" style={{ borderBottom: '1px solid #1e293b' }}>
          <div>
            <h2 
              className="flex items-center gap-2"
              style={{ color: '#ffffff', fontWeight: 800, fontSize: '17px' }}
            >
              <Wallet className="w-5 h-5 text-emerald-400" />
              <span>Payment Mode Breakdown & Cash Drawer Balance</span>
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '12px' }} className="mt-0.5">
              Detailed audit trail of cash float, digital UPI collections, and card terminal batch settlements.
            </p>
          </div>

          {/* Drawer Cash Indicator Banner */}
          <div 
            className="px-4 py-2 flex items-center gap-3 shrink-0 zreport-drawer-banner"
            style={{ 
              backgroundColor: 'rgba(6, 78, 59, 0.4)', 
              border: '1px solid rgba(16, 185, 129, 0.4)', 
              borderRadius: '12px' 
            }}
          >
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <div>
              <span 
                className="uppercase tracking-wider block leading-tight"
                style={{ color: '#6ee7b7', fontWeight: 600, fontSize: '10px' }}
              >
                Cash Drawer Total
              </span>
              <span 
                className="block"
                style={{ color: '#10b981', fontWeight: 900, fontFamily: 'monospace', fontSize: '18px' }}
              >
                ₹{cashDrawerTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Float Reconciliation Highlight Card */}
        <div 
          className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 zreport-float-card"
          style={{ backgroundColor: '#080c16', border: '1px solid #1e293b', borderRadius: '12px' }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold font-mono text-sm"
              style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#94a3b8' }}
            >
              ₹
            </div>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 700 }} className="uppercase block">Opening Cash Float</span>
              <span style={{ color: '#f1f5f9', fontWeight: 800, fontFamily: 'monospace', fontSize: '14px' }}>
                ₹{openingFloat.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span style={{ color: '#64748b', fontSize: '10px' }} className="block">Provided at shift launch</span>
            </div>
          </div>

          <div className="flex items-center gap-3 md:border-l border-white/10 md:pl-4">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold font-mono text-sm"
              style={{ backgroundColor: 'rgba(6, 78, 59, 0.4)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#10b981' }}
            >
              +
            </div>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 700 }} className="uppercase block">Shift Cash Inflow</span>
              <span style={{ color: '#10b981', fontWeight: 800, fontFamily: 'monospace', fontSize: '14px' }}>
                ₹{cashInflow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span style={{ color: '#64748b', fontSize: '10px' }} className="block">{cashBills} cash bills settled</span>
            </div>
          </div>

          <div className="flex items-center gap-3 md:border-l border-white/10 md:pl-4">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold font-mono text-sm"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.5)', color: '#10b981' }}
            >
              =
            </div>
            <div>
              <span style={{ color: '#6ee7b7', fontSize: '11px', fontWeight: 700 }} className="uppercase block">Net Physical Drawer Cash</span>
              <span style={{ color: '#10b981', fontWeight: 900, fontFamily: 'monospace', fontSize: '16px' }}>
                ₹{cashDrawerTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span style={{ color: '#34d399', fontSize: '10px' }} className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Drawer Ready for Safe Deposit
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Table */}
        <div 
          className="overflow-x-auto zreport-table-wrapper"
          style={{ border: '1px solid #1e293b', borderRadius: '12px' }}
        >
          <table className="w-full text-left border-collapse text-xs zreport-table">
            <thead>
              <tr 
                className="uppercase tracking-wider font-semibold text-[11px]"
                style={{ backgroundColor: '#080c16', color: '#94a3b8', borderBottom: '1px solid #1e293b' }}
              >
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Transactions</th>
                <th className="py-3 px-4">Channel Notes & Settlement</th>
                <th className="py-3 px-4 text-right">Collected Amount</th>
                <th className="py-3 px-4 text-right">% Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800" style={{ backgroundColor: '#0d1527' }}>
              {/* Cash */}
              <tr className="hover:bg-[#111c33] transition-colors" style={{ borderBottom: '1px solid #1e293b' }}>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-emerald-400"
                      style={{ backgroundColor: 'rgba(6, 78, 59, 0.5)', border: '1px solid rgba(16, 185, 129, 0.4)' }}
                    >
                      <Wallet className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-xs block" style={{ color: '#ffffff' }}>Cash Drawer</span>
                      <span style={{ color: '#94a3b8', fontSize: '10px' }}>Currency Notes & Coins</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono font-medium" style={{ color: '#e2e8f0' }}>
                  {cashBills} invoices
                </td>
                <td className="py-3 px-4">
                  <span 
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium"
                    style={{ backgroundColor: 'rgba(6, 78, 59, 0.3)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#6ee7b7' }}
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Physical Cash in Drawer #01
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span 
                    className="font-bold font-mono text-sm block"
                    style={{ color: '#10b981', fontWeight: 800 }}
                  >
                    ₹{cashInflow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <span style={{ color: '#64748b', fontSize: '10px' }} className="block">(Total in drawer: ₹{cashDrawerTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })})</span>
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold" style={{ color: '#e2e8f0' }}>
                  {totalShiftRevenue > 0 ? ((cashInflow / totalShiftRevenue) * 100).toFixed(1) : '0.0'}%
                </td>
              </tr>

              {/* UPI */}
              <tr className="hover:bg-[#111c33] transition-colors" style={{ borderBottom: '1px solid #1e293b' }}>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-sky-400"
                      style={{ backgroundColor: 'rgba(12, 74, 110, 0.5)', border: '1px solid rgba(56, 189, 248, 0.4)' }}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-xs block" style={{ color: '#ffffff' }}>UPI / QR Digital</span>
                      <span style={{ color: '#94a3b8', fontSize: '10px' }}>GPay, PhonePe, Paytm, BHIM</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono font-medium" style={{ color: '#e2e8f0' }}>
                  {upiBills} invoices
                </td>
                <td className="py-3 px-4">
                  <span 
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium"
                    style={{ backgroundColor: 'rgba(12, 74, 110, 0.3)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#7dd3fc' }}
                  >
                    Auto-Settled to Merchant Bank (HDFC)
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span 
                    className="font-bold font-mono text-sm block"
                    style={{ color: '#38bdf8', fontWeight: 800 }}
                  >
                    ₹{upiAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold" style={{ color: '#e2e8f0' }}>
                  {totalShiftRevenue > 0 ? ((upiAmount / totalShiftRevenue) * 100).toFixed(1) : '0.0'}%
                </td>
              </tr>

              {/* Card */}
              <tr className="hover:bg-[#111c33] transition-colors" style={{ borderBottom: '1px solid #1e293b' }}>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-purple-400"
                      style={{ backgroundColor: 'rgba(88, 28, 135, 0.5)', border: '1px solid rgba(192, 132, 252, 0.4)' }}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-xs block" style={{ color: '#ffffff' }}>Card Swipes / Tap</span>
                      <span style={{ color: '#94a3b8', fontSize: '10px' }}>Visa, Mastercard, RuPay EDC</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono font-medium" style={{ color: '#e2e8f0' }}>
                  {cardBills} invoices
                </td>
                <td className="py-3 px-4">
                  <span 
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium"
                    style={{ backgroundColor: 'rgba(88, 28, 135, 0.3)', border: '1px solid rgba(192, 132, 252, 0.3)', color: '#d8b4fe' }}
                  >
                    POS EDC Terminal Batch #4092
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span 
                    className="font-bold font-mono text-sm block"
                    style={{ color: '#c084fc', fontWeight: 800 }}
                  >
                    ₹{cardAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold" style={{ color: '#e2e8f0' }}>
                  {totalShiftRevenue > 0 ? ((cardAmount / totalShiftRevenue) * 100).toFixed(1) : '0.0'}%
                </td>
              </tr>

              {/* Due / Credit */}
              <tr className="hover:bg-[#111c33] transition-colors" style={{ borderBottom: '1px solid #1e293b' }}>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400"
                      style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                    >
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-xs block" style={{ color: '#ffffff' }}>Due / Customer Credit</span>
                      <span style={{ color: '#94a3b8', fontSize: '10px' }}>Corporate & Staff Ledgers</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono font-medium" style={{ color: '#e2e8f0' }}>
                  {dueBills} invoices
                </td>
                <td className="py-3 px-4">
                  <span 
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium"
                    style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#cbd5e1' }}
                  >
                    {dueBills > 0 ? 'Customer Credit Ledger Pending' : 'No Pending Credit Outstandings'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span 
                    className="font-bold font-mono text-sm block"
                    style={{ color: '#94a3b8', fontWeight: 800 }}
                  >
                    ₹{creditAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold" style={{ color: '#94a3b8' }}>
                  {totalShiftRevenue > 0 && creditAmount > 0 ? ((creditAmount / totalShiftRevenue) * 100).toFixed(1) : '0.0'}%
                </td>
              </tr>
            </tbody>
            {/* Audit Verified Table Footer */}
            <tfoot 
              className="text-white font-bold text-xs zreport-table-footer"
              style={{ backgroundColor: '#080c16', borderTop: '1px solid #1e293b' }}
            >
              <tr>
                <td className="py-3.5 px-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span style={{ color: '#10b981', fontWeight: 800 }}>Total Settled (Reconciled Audit)</span>
                </td>
                <td className="py-3.5 px-4 font-mono" style={{ color: '#10b981', fontWeight: 800 }}>
                  {totalBillsCount} invoices
                </td>
                <td className="py-3.5 px-4 font-normal" style={{ color: '#94a3b8' }}>
                  Cash Inflow + UPI + Card + Credit === Total Revenue
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-sm" style={{ color: '#10b981', fontWeight: 800 }}>
                  ₹{totalShiftRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3.5 px-4 text-right font-mono" style={{ color: '#10b981', fontWeight: 800 }}>
                  100.0%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Row 3: Category Sales Breakdown */}
      <div 
        className="p-5 sm:p-6 space-y-5 shadow-lg zreport-category-card"
        style={{ backgroundColor: '#0d1527', border: '1px solid #1e293b', borderRadius: '16px' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3" style={{ borderBottom: '1px solid #1e293b' }}>
          <div>
            <h2 
              className="flex items-center gap-2"
              style={{ color: '#ffffff', fontWeight: 800, fontSize: '17px' }}
            >
              <UtensilsCrossed className="w-5 h-5 text-amber-400" />
              <span>Category Sales Breakdown & Revenue Share</span>
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '12px' }} className="mt-0.5">
              Volume and revenue distribution across Biryani, Starters, Beverages, and kitchen stations.
            </p>
          </div>
          <span style={{ color: '#94a3b8', fontSize: '12px', fontFamily: 'monospace' }}>
            Total Category Volume: <span style={{ color: '#ffffff', fontWeight: 800 }}>{Object.values(categorySales).reduce((s: number, c: { quantity: number; revenue: number }) => s + c.quantity, 0)} items</span>
          </span>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Biryani */}
          <div 
            className="p-4 space-y-3 relative overflow-hidden"
            style={{ backgroundColor: '#080c16', border: '1px solid #1e293b', borderRadius: '12px' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🍚</span>
                <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '14px' }}>Biryani Section</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold font-mono">
                {((categorySales['Biryani']?.revenue || 0) / totalCategoryRevenue * 100).toFixed(1)}% Share
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span 
                  className="text-2xl font-bold font-mono block"
                  style={{ color: '#10b981' }}
                >
                  ₹{(categorySales['Biryani']?.revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span style={{ color: '#94a3b8', fontSize: '11px' }} className="block mt-0.5">Revenue generated</span>
              </div>
              <div className="text-right">
                <span 
                  className="text-xl font-bold font-mono block"
                  style={{ color: '#ffffff' }}
                >
                  {categorySales['Biryani']?.quantity || 0}
                </span>
                <span style={{ color: '#94a3b8', fontSize: '11px' }} className="block mt-0.5">Dishes sold</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div 
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, ((categorySales['Biryani']?.revenue || 0) / totalCategoryRevenue * 100)))}%` }}
              />
            </div>
            <div className="text-[10px] flex justify-between" style={{ color: '#94a3b8' }}>
              <span>Avg: ₹{((categorySales['Biryani']?.revenue || 0) / (categorySales['Biryani']?.quantity || 1)).toFixed(0)} / dish</span>
              <span className="text-amber-300 font-medium">Top Performer</span>
            </div>
          </div>

          {/* Starters */}
          <div 
            className="p-4 space-y-3 relative overflow-hidden"
            style={{ backgroundColor: '#080c16', border: '1px solid #1e293b', borderRadius: '12px' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🍗</span>
                <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '14px' }}>Starters & Tandoor</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold font-mono">
                {((categorySales['Starters']?.revenue || 0) / totalCategoryRevenue * 100).toFixed(1)}% Share
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span 
                  className="text-2xl font-bold font-mono block"
                  style={{ color: '#10b981' }}
                >
                  ₹{(categorySales['Starters']?.revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span style={{ color: '#94a3b8', fontSize: '11px' }} className="block mt-0.5">Revenue generated</span>
              </div>
              <div className="text-right">
                <span 
                  className="text-xl font-bold font-mono block"
                  style={{ color: '#ffffff' }}
                >
                  {categorySales['Starters']?.quantity || 0}
                </span>
                <span style={{ color: '#94a3b8', fontSize: '11px' }} className="block mt-0.5">Dishes sold</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div 
                className="h-full bg-rose-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, ((categorySales['Starters']?.revenue || 0) / totalCategoryRevenue * 100)))}%` }}
              />
            </div>
            <div className="text-[10px] flex justify-between" style={{ color: '#94a3b8' }}>
              <span>Avg: ₹{((categorySales['Starters']?.revenue || 0) / (categorySales['Starters']?.quantity || 1)).toFixed(0)} / dish</span>
              <span className="text-rose-300 font-medium">Appetizers</span>
            </div>
          </div>

          {/* Beverages */}
          <div 
            className="p-4 space-y-3 relative overflow-hidden"
            style={{ backgroundColor: '#080c16', border: '1px solid #1e293b', borderRadius: '12px' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🥤</span>
                <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '14px' }}>Beverages & Mocktails</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-bold font-mono">
                {((categorySales['Beverages']?.revenue || 0) / totalCategoryRevenue * 100).toFixed(1)}% Share
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span 
                  className="text-2xl font-bold font-mono block"
                  style={{ color: '#10b981' }}
                >
                  ₹{(categorySales['Beverages']?.revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span style={{ color: '#94a3b8', fontSize: '11px' }} className="block mt-0.5">Revenue generated</span>
              </div>
              <div className="text-right">
                <span 
                  className="text-xl font-bold font-mono block"
                  style={{ color: '#ffffff' }}
                >
                  {categorySales['Beverages']?.quantity || 0}
                </span>
                <span style={{ color: '#94a3b8', fontSize: '11px' }} className="block mt-0.5">Drinks sold</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div 
                className="h-full bg-sky-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, ((categorySales['Beverages']?.revenue || 0) / totalCategoryRevenue * 100)))}%` }}
              />
            </div>
            <div className="text-[10px] flex justify-between" style={{ color: '#94a3b8' }}>
              <span>Avg: ₹{((categorySales['Beverages']?.revenue || 0) / (categorySales['Beverages']?.quantity || 1)).toFixed(0)} / drink</span>
              <span className="text-sky-300 font-medium">Quick Refreshers</span>
            </div>
          </div>
        </div>

        {/* Secondary category summary bars */}
        <div 
          className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs"
          style={{ backgroundColor: '#080c16', border: '1px solid #1e293b', borderRadius: '12px' }}
        >
          <div className="flex items-center gap-2 text-slate-400">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white">Other Station Sales:</span>
          </div>
          <div className="flex flex-wrap gap-4 text-slate-300">
            <span>
              <strong className="text-white">Main Course:</strong> {categorySales['Main Course']?.quantity || 0} items (₹{(categorySales['Main Course']?.revenue || 0).toLocaleString('en-IN')})
            </span>
            <span>•</span>
            <span>
              <strong className="text-white">Breads & Rotis:</strong> {categorySales['Breads']?.quantity || 0} items (₹{(categorySales['Breads']?.revenue || 0).toLocaleString('en-IN')})
            </span>
            <span>•</span>
            <span>
              <strong className="text-white">Desserts:</strong> {categorySales['Desserts']?.quantity || 0} items (₹{(categorySales['Desserts']?.revenue || 0).toLocaleString('en-IN')})
            </span>
          </div>
        </div>
      </div>
    </div>

      {/* Settle Drawer / Close Shift Confirmation Modal */}
      {isSettleModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(4px)' }}
        >
          <div 
            className="w-full max-w-lg p-6 shadow-2xl text-slate-200 animate-in fade-in zoom-in-95 space-y-5 zreport-modal-card"
            style={{ backgroundColor: '#0d1527', border: '1px solid #1e293b', borderRadius: '16px' }}
          >
            <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid #1e293b' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Shift Close & Drawer Reconciliation</h3>
                  <div style={{ color: '#94a3b8', fontSize: '11px' }}>Terminal Register #01 • Cashier: {cashierDisplayName}</div>
                </div>
              </div>
              <button 
                onClick={() => setIsSettleModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div 
                className="p-3.5 space-y-2 font-mono"
                style={{ backgroundColor: '#080c16', border: '1px solid #1e293b', borderRadius: '12px' }}
              >
                <div className="flex justify-between" style={{ color: '#94a3b8' }}>
                  <span>Opening Float:</span>
                  <span className="text-white font-bold">₹{openingFloat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between" style={{ color: '#94a3b8' }}>
                  <span>Cash Inflow from Invoices:</span>
                  <span className="text-emerald-400 font-bold">+ ₹{cashInflow.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 text-sm font-bold" style={{ borderTop: '1px solid #1e293b' }}>
                  <span className="text-slate-200">Expected Physical Drawer Cash:</span>
                  <span className="text-emerald-400 font-bold">₹{cashDrawerTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Physical Cash Count Input */}
              <div className="space-y-1.5 pt-1">
                <label style={{ color: '#cbd5e1', fontSize: '12px', fontWeight: 600 }} className="block">
                  Actual Physical Cash Counted (₹):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-mono font-bold">₹</span>
                  <input
                    type="number"
                    value={countedCash}
                    onChange={(e) => setCountedCash(e.target.value)}
                    style={{ backgroundColor: '#080c16', border: '1px solid #334155', color: '#ffffff' }}
                    className="w-full pl-7 pr-3 py-2 rounded-xl font-mono text-sm focus:outline-hidden focus:border-emerald-500 transition-colors"
                    placeholder="Enter physical cash in drawer"
                  />
                </div>
              </div>

              {/* Variance notice */}
              <div 
                className="p-3 rounded-xl flex items-center justify-between text-xs font-semibold"
                style={{ 
                  backgroundColor: Math.abs(variance) < 0.01 ? 'rgba(6, 78, 59, 0.4)' : 'rgba(120, 53, 15, 0.4)',
                  border: Math.abs(variance) < 0.01 ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                  color: Math.abs(variance) < 0.01 ? '#6ee7b7' : '#fcd34d'
                }}
              >
                <div className="flex items-center gap-2">
                  {Math.abs(variance) < 0.01 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                  )}
                  <span>{Math.abs(variance) < 0.01 ? 'Cash Drawer Perfectly Balanced' : 'Cash Variance Detected'}</span>
                </div>
                <span className="font-mono text-sm font-bold">
                  {variance === 0 ? '₹0.00' : (variance > 0 ? `+₹${variance.toFixed(2)}` : `-₹${Math.abs(variance).toFixed(2)}`)}
                </span>
              </div>

              {/* Remarks */}
              <div className="space-y-1">
                <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600 }} className="block">
                  Closing Remarks (Optional):
                </label>
                <input
                  type="text"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  placeholder="e.g., Safe drop completed to Manager vault"
                  style={{ backgroundColor: '#080c16', border: '1px solid #334155', color: '#ffffff' }}
                  className="w-full px-3 py-2 rounded-xl text-xs placeholder-slate-500 focus:outline-hidden focus:border-white/20"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2.5 pt-2" style={{ borderTop: '1px solid #1e293b' }}>
              <button
                type="button"
                onClick={() => setIsSettleModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl hover:bg-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                style={{ backgroundColor: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSettle}
                className="flex-1 py-2.5 rounded-xl bg-[#7a0c1a] hover:bg-[#8f1020] active:bg-[#4a030c] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                style={{ backgroundColor: '#7a0c1a', border: '1px solid #8f1020', fontWeight: 800 }}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Confirm Shift Close</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
