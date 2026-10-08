import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Bill, PaymentMethod } from '../types';
import { 
  Receipt, 
  Search, 
  Clock, 
  FileText, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  Utensils, 
  CreditCard, 
  Eye, 
  PlusCircle, 
  X, 
  Bell, 
  ArrowRight
} from 'lucide-react';
import { BrandWatermark } from '../components/BrandWatermark';

export interface WaiterLedgerItem {
  id: string;
  type: 'bill_requested' | 'running' | 'paid';
  invoiceNumber: string;
  timeStr: string;
  durationStr: string;
  tableNumber: string;
  floor: string;
  itemsCount: number;
  itemsSummary: string;
  totalAmount: number;
  statusText: 'BILL REQUESTED' | 'DINING / RUNNING' | 'PAID';
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Pending';
  rawBill?: Bill;
  tableId?: string;
  requestId?: string;
  kotNumbers: string[];
}

export const WaiterBillsPage: React.FC = () => {
  const {
    currentUser,
    tables,
    setTables,
    bills,
    kots,
    pendingBillRequests,
    settleBillRequest,
    openBillDetailsModal,
    openReceiptModal,
    selectTableForPOS,
    setActiveTab,
    showToast,
    currentBranch,
  } = useApp();

  // Active filter tab: 'all' | 'bill_requested' | 'running' | 'paid'
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'bill_requested' | 'running' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Quick Settle Modal state
  const [quickSettleTarget, setQuickSettleTarget] = useState<WaiterLedgerItem | null>(null);
  const [selectedPayMode, setSelectedPayMode] = useState<'cash' | 'upi' | 'card'>('cash');

  const waiterName = currentUser?.name?.replace(/\s*\(Waiter\)$/i, '').trim() || 'Ramesh Patel';

  // Helper: Floor calculation based on table number
  const getTableFloor = (tblNumStr: string | number) => {
    const num = typeof tblNumStr === 'number' ? tblNumStr : parseInt(String(tblNumStr).replace(/\D/g, ''), 10) || 1;
    return num <= 5 ? 'Ground Floor' : num <= 8 ? 'First Floor' : 'Outdoor / Terrace';
  };

  // Helper: Duration calculation
  const getElapsedDuration = (timeStr?: string, defaultMins = 38) => {
    if (!timeStr) return `${defaultMins} mins`;
    try {
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (!match) return `${defaultMins} mins`;
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const ampm = (match[3] || '').toUpperCase();
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      const now = new Date();
      const start = new Date();
      start.setHours(h, m, 0, 0);
      const diffMs = now.getTime() - start.getTime();
      if (diffMs > 0 && diffMs < 12 * 3600 * 1000) {
        const diffMins = Math.floor(diffMs / 60000);
        return `${diffMins} mins`;
      }
    } catch {
      // fallback
    }
    return `${defaultMins} mins`;
  };

  // 1. Build Bill-Requested Items
  const billRequestedItems = useMemo<WaiterLedgerItem[]>(() => {
    const effectiveBranch = currentBranch === 'all' ? 'main' : currentBranch;
    const items: WaiterLedgerItem[] = [];

    // Find tables with status === 'billing'
    tables.forEach(tbl => {
      if (tbl.status !== 'billing') return;
      if (currentBranch !== 'all' && tbl.branchId !== effectiveBranch) return;

      const matchingReq = pendingBillRequests.find(
        r => r.tableNumber.toLowerCase() === tbl.name.toLowerCase() &&
             (currentBranch === 'all' || r.branchId === tbl.branchId)
      );

      const tableKots = kots.filter(
        k => (currentBranch === 'all' || k.branchId === tbl.branchId) &&
             k.orderType === 'dine_in' &&
             k.tableNumber?.toLowerCase() === tbl.name.toLowerCase() &&
             !k.isBilled &&
             k.status !== 'cancelled'
      );

      const totalFromKots = tableKots.reduce((sum, k) => sum + k.totalAmount, 0);
      const totalAmount = tbl.currentAmount || matchingReq?.totalAmount || totalFromKots || 1243;
      const kotNums = tableKots.map(k => k.kotNumber).filter(Boolean);
      const allKotItems = tableKots.flatMap(k => k.items);
      const itemsCount = allKotItems.length > 0 ? allKotItems.reduce((acc, i) => acc + i.quantity, 0) : 4;
      const summary = allKotItems.length > 0 
        ? allKotItems.slice(0, 3).map(i => `${i.name} × ${i.quantity}`).join(', ') + (allKotItems.length > 3 ? '...' : '')
        : 'Chicken Biryani × 2, Butter Naan × 3';

      const timeStr = tbl.billRequestedAt || tbl.seatedAt || '12:48 PM';
      const durationStr = getElapsedDuration(tbl.seatedAt || '12:22 PM', 42);

      items.push({
        id: matchingReq?.id || `req_${tbl.id}`,
        type: 'bill_requested',
        invoiceNumber: `INV-${10080 + tbl.number}`,
        timeStr,
        durationStr,
        tableNumber: tbl.name,
        floor: tbl.floor || getTableFloor(tbl.number),
        itemsCount,
        itemsSummary: summary,
        totalAmount,
        statusText: 'BILL REQUESTED',
        paymentMode: (matchingReq?.paymentMethod as any) ? (matchingReq!.paymentMethod === 'cash' ? 'Cash' : matchingReq!.paymentMethod === 'upi' ? 'UPI' : 'Card') : 'Pending',
        tableId: tbl.id,
        requestId: matchingReq?.id,
        kotNumbers: kotNums.length > 0 ? kotNums : [`KOT-1002${tbl.number}`],
      });
    });

    // Also include pending requests that might not be synced to tables
    pendingBillRequests.forEach(req => {
      const alreadyIn = items.some(it => it.tableNumber.toLowerCase() === req.tableNumber.toLowerCase());
      if (!alreadyIn && (currentBranch === 'all' || req.branchId === effectiveBranch)) {
        const tblNum = parseInt(req.tableNumber.replace(/\D/g, ''), 10) || 1;
        items.push({
          id: req.id,
          type: 'bill_requested',
          invoiceNumber: `INV-${10080 + tblNum}`,
          timeStr: req.requestedAt || '12:45 PM',
          durationStr: '38 mins',
          tableNumber: req.tableNumber,
          floor: getTableFloor(tblNum),
          itemsCount: 4,
          itemsSummary: 'Dining Order Items',
          totalAmount: req.totalAmount || 1133,
          statusText: 'BILL REQUESTED',
          paymentMode: req.paymentMethod === 'cash' ? 'Cash' : req.paymentMethod === 'upi' ? 'UPI' : req.paymentMethod === 'card' ? 'Card' : 'Pending',
          requestId: req.id,
          kotNumbers: req.kotNumbers?.length ? req.kotNumbers : [`KOT-1002${tblNum}`],
        });
      }
    });

    return items;
  }, [tables, pendingBillRequests, kots, currentBranch]);

  // 2. Build Active Running / Dining Items
  const runningDiningItems = useMemo<WaiterLedgerItem[]>(() => {
    const effectiveBranch = currentBranch === 'all' ? 'main' : currentBranch;
    const items: WaiterLedgerItem[] = [];

    tables.forEach(tbl => {
      if (tbl.status !== 'occupied') return;
      if (currentBranch !== 'all' && tbl.branchId !== effectiveBranch) return;

      const tableKots = kots.filter(
        k => (currentBranch === 'all' || k.branchId === tbl.branchId) &&
             k.orderType === 'dine_in' &&
             k.tableNumber?.toLowerCase() === tbl.name.toLowerCase() &&
             !k.isBilled &&
             k.status !== 'cancelled'
      );

      const totalFromKots = tableKots.reduce((sum, k) => sum + k.totalAmount, 0);
      const totalAmount = tbl.currentAmount || totalFromKots || 640;
      const kotNums = tableKots.map(k => k.kotNumber).filter(Boolean);
      const allKotItems = tableKots.flatMap(k => k.items);
      const itemsCount = allKotItems.length > 0 ? allKotItems.reduce((acc, i) => acc + i.quantity, 0) : 3;
      const summary = allKotItems.length > 0 
        ? allKotItems.slice(0, 3).map(i => `${i.name} × ${i.quantity}`).join(', ') + (allKotItems.length > 3 ? '...' : '')
        : 'Mutton Biryani × 1, Roti × 4';

      const timeStr = tbl.seatedAt || '12:15 PM';
      const durationStr = getElapsedDuration(tbl.seatedAt, 32);

      items.push({
        id: `run_${tbl.id}`,
        type: 'running',
        invoiceNumber: `ORD-T${tbl.number}`,
        timeStr,
        durationStr,
        tableNumber: tbl.name,
        floor: tbl.floor || getTableFloor(tbl.number),
        itemsCount,
        itemsSummary: summary,
        totalAmount,
        statusText: 'DINING / RUNNING',
        paymentMode: 'Pending',
        tableId: tbl.id,
        kotNumbers: kotNums.length > 0 ? kotNums : [`KOT-1003${tbl.number}`],
      });
    });

    return items;
  }, [tables, kots, currentBranch]);

  // 3. Build Settled Bills Today (Waiter Shift Ledger)
  const settledBillsToday = useMemo<WaiterLedgerItem[]>(() => {
    const effectiveBranch = currentBranch === 'all' ? 'main' : currentBranch;
    const todayStr = new Date().toISOString().split('T')[0];

    return bills
      .filter(b => {
        if (currentBranch !== 'all' && b.branchId !== effectiveBranch) return false;
        if (b.status === 'cancelled') return false;
        // Filter by today's date
        const matchDate = b.date === todayStr || (b.date && (b.date.includes('07 Sep 2026') || b.date.includes('Today')));
        return matchDate;
      })
      .map(b => {
        const tblNum = b.tableNumber ? parseInt(b.tableNumber.replace(/\D/g, ''), 10) || 1 : 1;
        const pMode = b.paymentMethod === 'upi' ? 'UPI' : b.paymentMethod === 'card' ? 'Card' : b.paymentMethod === 'split' ? 'Card' : 'Cash';
        const itemsCount = b.items?.length > 0 ? b.items.reduce((acc, i) => acc + i.quantity, 0) : 3;
        const summary = b.items?.length > 0 
          ? b.items.slice(0, 3).map(i => `${i.name} × ${i.quantity}`).join(', ') + (b.items.length > 3 ? '...' : '')
          : 'Dine-in Order';

        return {
          id: b.id,
          type: 'paid' as const,
          invoiceNumber: b.billNumber,
          timeStr: b.time || '01:15 PM',
          durationStr: '52 mins',
          tableNumber: b.tableNumber || `Table ${tblNum}`,
          floor: getTableFloor(tblNum),
          itemsCount,
          itemsSummary: summary,
          totalAmount: b.grandTotal,
          statusText: 'PAID' as const,
          paymentMode: pMode as any,
          rawBill: b,
          kotNumbers: b.kotNumbers?.length ? b.kotNumbers : [b.kotNumber || 'KOT-10012'],
        };
      });
  }, [bills, currentBranch]);

  // Combined Master Ledger List
  const allLedgerItems = useMemo<WaiterLedgerItem[]>(() => {
    return [...billRequestedItems, ...runningDiningItems, ...settledBillsToday];
  }, [billRequestedItems, runningDiningItems, settledBillsToday]);

  // Filtered List based on tab and search
  const displayedItems = useMemo<WaiterLedgerItem[]>(() => {
    let list: WaiterLedgerItem[] = [];

    if (activeFilterTab === 'all') {
      list = allLedgerItems;
    } else if (activeFilterTab === 'bill_requested') {
      list = billRequestedItems;
    } else if (activeFilterTab === 'running') {
      list = runningDiningItems;
    } else if (activeFilterTab === 'paid') {
      list = settledBillsToday;
    }

    if (!searchQuery.trim()) return list;

    const query = searchQuery.toLowerCase().trim();
    return list.filter(item => 
      item.tableNumber.toLowerCase().includes(query) ||
      item.invoiceNumber.toLowerCase().includes(query) ||
      item.itemsSummary.toLowerCase().includes(query) ||
      item.paymentMode.toLowerCase().includes(query)
    );
  }, [activeFilterTab, allLedgerItems, billRequestedItems, runningDiningItems, settledBillsToday, searchQuery]);

  // Waiter Shift Metrics
  const billRequestsCount = billRequestedItems.length;
  const billRequestsAmount = billRequestedItems.reduce((acc, it) => acc + it.totalAmount, 0);

  const settledCount = settledBillsToday.length;
  const settledAmount = settledBillsToday.reduce((acc, it) => acc + it.totalAmount, 0);

  const activeRunningCount = runningDiningItems.length;

  // Helper to build Bill object for preview/print modals
  const constructBillForModal = (item: WaiterLedgerItem): Bill => {
    if (item.rawBill) return item.rawBill;

    const subtotal = Math.round(item.totalAmount / 1.1);
    const cgstAmount = Number((subtotal * 0.05).toFixed(2));
    const sgstAmount = Number((subtotal * 0.05).toFixed(2));
    const grandTotal = item.totalAmount;

    return {
      id: `bill_modal_${item.id}`,
      billNumber: item.invoiceNumber.startsWith('INV-') ? item.invoiceNumber : `INV-${item.invoiceNumber.replace(/\D/g, '') || '10089'}`,
      kotNumbers: item.kotNumbers,
      kotNumber: item.kotNumbers[0] || 'KOT-10022',
      branchId: 'main',
      branchName: 'Main Branch',
      date: new Date().toISOString().split('T')[0],
      time: item.timeStr,
      tableNumber: item.tableNumber,
      orderType: 'dine_in',
      customerName: 'Dine-In Guest',
      stewardName: waiterName,
      items: [
        { id: 'item_1', name: 'Chicken Biryani Special', quantity: 2, rate: 280, amount: 560 },
        { id: 'item_2', name: 'Butter Naan', quantity: 3, rate: 50, amount: 150 },
        { id: 'item_3', name: 'Butter Chicken Handi', quantity: 1, rate: 320, amount: 320 },
        { id: 'item_4', name: 'Fresh Lime Soda', quantity: 2, rate: 50, amount: 100 },
      ],
      subtotal,
      gstPercent: 10,
      gstAmount: Number((cgstAmount + sgstAmount).toFixed(2)),
      cgstPercent: 5,
      cgstAmount,
      sgstPercent: 5,
      sgstAmount,
      discountAmount: 0,
      grandTotal,
      paymentMethod: (item.paymentMode.toLowerCase() as PaymentMethod) || 'cash',
      status: item.type === 'paid' ? 'paid' : 'unpaid',
      paymentStatus: item.type === 'paid' ? 'PAID' : 'UNPAID',
      isPaid: item.type === 'paid',
      isEstimate: item.type !== 'paid',
      cashierName: 'Cashier Desk'
    };
  };

  const handleViewBill = (item: WaiterLedgerItem) => {
    const billObj = constructBillForModal(item);
    openBillDetailsModal(billObj);
  };

  const handlePrintBill = (item: WaiterLedgerItem) => {
    const billObj = constructBillForModal(item);
    openReceiptModal(billObj);
  };

  const handleOpenQuickSettle = (item: WaiterLedgerItem) => {
    setQuickSettleTarget(item);
    setSelectedPayMode('cash');
  };

  const handleConfirmQuickSettle = () => {
    if (!quickSettleTarget) return;

    if (quickSettleTarget.requestId) {
      settleBillRequest(quickSettleTarget.requestId, selectedPayMode);
    } else if (quickSettleTarget.tableId) {
      setTables(prev => prev.map(tbl => tbl.id === quickSettleTarget.tableId ? {
        ...tbl,
        status: 'available',
        currentAmount: 0,
        guestCount: undefined,
        guestName: undefined,
        seatedAt: undefined,
        billRequested: false,
        billRequestedAt: undefined,
        billRequestedBy: undefined
      } : tbl));
      showToast(
        'Table Settled & Freed',
        `${quickSettleTarget.tableNumber} bill of ₹${quickSettleTarget.totalAmount.toLocaleString('en-IN')} marked PAID via ${selectedPayMode.toUpperCase()}. Table is now Available.`,
        'success'
      );
    }

    setQuickSettleTarget(null);
  };

  const handleAddItemsRedirect = (item: WaiterLedgerItem) => {
    selectTableForPOS(item.tableNumber);
    setActiveTab('pos');
  };

  return (
    <div 
      className="waiter-bills-page relative min-h-full w-full px-4 md:px-6 py-4 space-y-4 font-sans text-slate-200"
      style={{ backgroundColor: 'transparent' }}
    >
      {/* Background Crest Watermark */}
      <BrandWatermark opacity={0.15} />

      <div className="relative z-10 space-y-4">
        {/* TOP STATS BAR (WAITER-SPECIFIC METRICS) */}
        <div 
          className="w-full flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 md:p-5 rounded-2xl shadow-xl border border-slate-800"
          style={{ backgroundColor: '#0d1527', border: '1px solid #1e293b' }}
        >
          {/* Left: Page Title & Subtitle */}
          <div className="shrink-0 space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#7a0c1a]/30 border border-[#8f1020]/60 flex items-center justify-center text-rose-400">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>My Bills & Table Orders</span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track running bills, customer bill requests, and shift sales for {waiterName}
                </p>
              </div>
            </div>
          </div>

          {/* Right Metric Cards (Shift stats for current logged-in waiter) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
            {/* 1. [🔔 Bill Requests] */}
            <div 
              className="px-4 py-3 rounded-xl border border-amber-500/30 shadow-xs flex items-center gap-3 transition-all"
              style={{ backgroundColor: '#080c16' }}
            >
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  Bill Requests
                </div>
                <div className="text-sm md:text-base font-extrabold text-white">
                  {billRequestsCount} {billRequestsCount === 1 ? 'Table' : 'Tables'} • <span className="text-emerald-400 font-mono">₹{billRequestsAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* 2. [✓ Settled Today] */}
            <div 
              className="px-4 py-3 rounded-xl border border-emerald-500/30 shadow-xs flex items-center gap-3 transition-all"
              style={{ backgroundColor: '#080c16' }}
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Settled Today
                </div>
                <div className="text-sm md:text-base font-extrabold text-white">
                  {settledCount} Bills • <span className="text-emerald-400 font-mono">₹{settledAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* 3. [🍽 Active Running] */}
            <div 
              className="px-4 py-3 rounded-xl border border-sky-500/30 shadow-xs flex items-center gap-3 transition-all"
              style={{ backgroundColor: '#080c16' }}
            >
              <div className="w-9 h-9 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center shrink-0">
                <Utensils className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">
                  Active Running
                </div>
                <div className="text-sm md:text-base font-extrabold text-white">
                  {activeRunningCount} {activeRunningCount === 1 ? 'Table' : 'Tables'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FILTER & SEGMENTATION TABS + SEARCH BAR */}
        <div 
          className="w-full p-3.5 md:p-4 rounded-xl border border-slate-800 shadow-md space-y-3"
          style={{ backgroundColor: '#0d1527', border: '1px solid #1e293b' }}
        >
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Segmentation Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              {/* Tab 1: All My Tables */}
              <button
                type="button"
                onClick={() => setActiveFilterTab('all')}
                className={`py-2 px-3.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeFilterTab === 'all'
                    ? 'bg-[#1e293b] text-white border border-slate-600 shadow-xs'
                    : 'bg-white/[0.05] hover:bg-white/[0.09] text-slate-300 border border-white/10'
                }`}
              >
                <span>All My Tables</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/15 text-white">
                  {allLedgerItems.length}
                </span>
              </button>

              {/* Tab 2: 🔔 Bill Requested (Highlighted / Amber pill) */}
              <button
                type="button"
                onClick={() => setActiveFilterTab('bill_requested')}
                className={`py-2 px-3.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeFilterTab === 'bill_requested'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.4)] border border-amber-300'
                    : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30'
                }`}
              >
                <Bell className="w-3.5 h-3.5 shrink-0" />
                <span>Bill Requested</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeFilterTab === 'bill_requested' ? 'bg-black/20 text-slate-950' : 'bg-amber-500/30 text-amber-200'
                }`}>
                  {billRequestsCount}
                </span>
              </button>

              {/* Tab 3: 🍽 Running / Dining */}
              <button
                type="button"
                onClick={() => setActiveFilterTab('running')}
                className={`py-2 px-3.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeFilterTab === 'running'
                    ? 'bg-sky-600 text-white border border-sky-400 shadow-xs'
                    : 'bg-white/[0.05] hover:bg-white/[0.09] text-slate-300 border border-white/10'
                }`}
              >
                <Utensils className="w-3.5 h-3.5 shrink-0" />
                <span>Running / Dining</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/15 text-white">
                  {runningDiningItems.length}
                </span>
              </button>

              {/* Tab 4: ✓ Settled / Closed */}
              <button
                type="button"
                onClick={() => setActiveFilterTab('paid')}
                className={`py-2 px-3.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeFilterTab === 'paid'
                    ? 'bg-emerald-600 text-white border border-emerald-400 shadow-xs'
                    : 'bg-white/[0.05] hover:bg-white/[0.09] text-slate-300 border border-white/10'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Settled / Closed</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/15 text-white">
                  {settledBillsToday.length}
                </span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by Table #, Invoice #, or Dish name..."
                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                style={{ backgroundColor: '#080c16', border: '1px solid #1e293b', color: '#ffffff' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* MAIN BILLS DATA TABLE */}
        <div 
          className="rounded-2xl border border-slate-800 shadow-xl overflow-hidden"
          style={{ backgroundColor: '#0d1527', border: '1px solid #1e293b' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead 
                style={{ backgroundColor: '#0b1120', borderBottom: '2px solid #1e293b' }}
                className="uppercase tracking-wider text-[11px] font-bold text-slate-300"
              >
                <tr>
                  <th className="py-3.5 px-4 font-bold">INVOICE / ORDER NO</th>
                  <th className="py-3.5 px-4 font-bold">TIME / DURATION</th>
                  <th className="py-3.5 px-4 font-bold">TABLE / SECTION</th>
                  <th className="py-3.5 px-4 font-bold">ITEMS COUNT</th>
                  <th className="py-3.5 px-4 font-bold text-right">TOTAL AMOUNT</th>
                  <th className="py-3.5 px-4 font-bold text-center">STATUS</th>
                  <th className="py-3.5 px-4 font-bold text-center">PAY MODE</th>
                  <th className="py-3.5 px-4 font-bold text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {displayedItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-bold text-white">No Matching Bills or Orders Found</div>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Try adjusting your search query or switching to another filter tab above.
                      </p>
                    </td>
                  </tr>
                ) : (
                  displayedItems.map((item, idx) => {
                    const isEven = idx % 2 === 0;
                    const rowBg = isEven ? '#0d1527' : '#080c16';

                    return (
                      <tr 
                        key={item.id}
                        className="hover:bg-slate-800/40 transition-colors border-b border-slate-800/60"
                        style={{ backgroundColor: rowBg }}
                      >
                        {/* 1. INVOICE / ORDER NO */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-extrabold text-white text-xs">
                            {item.invoiceNumber}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {item.kotNumbers.join(', ')}
                          </div>
                        </td>

                        {/* 2. TIME / DURATION */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-200">
                            {item.timeStr}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{item.durationStr}</span>
                          </div>
                        </td>

                        {/* 3. TABLE / SECTION */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] text-amber-400 font-mono font-extrabold">
                              {item.tableNumber.replace(/\D/g, '') || 'T'}
                            </span>
                            <span>{item.tableNumber}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {item.floor}
                          </div>
                        </td>

                        {/* 4. ITEMS COUNT */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-200">
                            {item.itemsCount} items
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px]" title={item.itemsSummary}>
                            {item.itemsSummary}
                          </div>
                        </td>

                        {/* 5. TOTAL AMOUNT (Vivid Emerald Green) */}
                        <td className="py-3.5 px-4 text-right">
                          <div 
                            className="font-mono font-black text-base"
                            style={{ color: '#10b981' }}
                          >
                            ₹{item.totalAmount.toLocaleString('en-IN')}
                          </div>
                        </td>

                        {/* 6. STATUS BADGES */}
                        <td className="py-3.5 px-4 text-center">
                          {item.type === 'bill_requested' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                              BILL REQUESTED
                            </span>
                          )}
                          {item.type === 'running' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                              DINING / RUNNING
                            </span>
                          )}
                          {item.type === 'paid' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              PAID
                            </span>
                          )}
                        </td>

                        {/* 7. PAYMENT MODE */}
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            item.paymentMode === 'Pending'
                              ? 'bg-slate-800 text-slate-400 border-slate-700'
                              : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 font-bold'
                          }`}>
                            {item.paymentMode === 'Cash' && '💵 '}
                            {item.paymentMode === 'UPI' && '📱 '}
                            {item.paymentMode === 'Card' && '💳 '}
                            {item.paymentMode}
                          </span>
                        </td>

                        {/* 8. ACTIONS */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* If Bill Requested: [View Bill], [Print], [Quick Settle] */}
                            {item.type === 'bill_requested' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleViewBill(item)}
                                  className="p-1.5 rounded-lg bg-blue-900/40 hover:bg-blue-800 text-blue-300 border border-blue-700/50 transition-colors cursor-pointer"
                                  title="View itemized guest check"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePrintBill(item)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                                  title="Print provisional bill"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenQuickSettle(item)}
                                  className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs border border-emerald-400/50 shadow-xs transition-all cursor-pointer flex items-center gap-1"
                                  title="Quick settle bill and free table"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Quick Settle</span>
                                </button>
                              </>
                            )}

                            {/* If Paid: [View Invoice], [Re-print] */}
                            {item.type === 'paid' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleViewBill(item)}
                                  className="py-1 px-2 rounded-lg bg-blue-900/40 hover:bg-blue-800 text-blue-300 border border-blue-700/50 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                                  title="View invoice receipt"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePrintBill(item)}
                                  className="py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                                  title="Re-print receipt"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>Print</span>
                                </button>
                              </>
                            )}

                            {/* If Running: [Add Items / POS] */}
                            {item.type === 'running' && (
                              <button
                                type="button"
                                onClick={() => handleAddItemsRedirect(item)}
                                className="py-1 px-2.5 rounded-lg bg-[#7a0c1a] hover:bg-[#8f1020] text-white font-bold text-xs border border-rose-800/60 shadow-xs transition-all cursor-pointer flex items-center gap-1"
                                title="Open table order in POS"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                <span>Add Items / POS</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* QUICK SETTLE MODAL */}
      {quickSettleTarget && (
        <div 
          onClick={() => setQuickSettleTarget(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-sans text-slate-200 animate-in fade-in duration-150"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-800 animate-in zoom-in-95 duration-200"
            style={{ backgroundColor: '#0d1527', border: '1px solid #1e293b' }}
          >
            {/* Modal Header */}
            <div 
              className="flex items-center justify-between px-5 py-4 border-b border-slate-800"
              style={{ backgroundColor: '#0b1120', borderBottom: '1px solid #1e293b' }}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Settle & Free Table</h3>
                  <p className="text-xs text-slate-400">Collect payment and make table Available</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickSettleTarget(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Table & Total Amount Summary */}
              <div 
                className="p-3.5 rounded-xl border border-slate-800 flex items-center justify-between"
                style={{ backgroundColor: '#080c16' }}
              >
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>{quickSettleTarget.tableNumber}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-xs text-slate-400 font-normal">{quickSettleTarget.floor}</span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    {quickSettleTarget.invoiceNumber}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-mono font-black text-emerald-400">
                    ₹{quickSettleTarget.totalAmount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase">Total Payable</div>
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Select Collected Payment Mode:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cash', label: 'Cash', icon: '💵' },
                    { id: 'upi', label: 'UPI / QR', icon: '📱' },
                    { id: 'card', label: 'Card', icon: '💳' },
                  ].map(mode => {
                    const isSelected = selectedPayMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setSelectedPayMode(mode.id as any)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-[#0c2340] text-cyan-300 border-2 border-cyan-400 shadow-md font-extrabold'
                            : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        }`}
                      >
                        <span className="text-base">{mode.icon}</span>
                        <span>{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div 
              className="p-4 border-t border-slate-800 flex items-center justify-end gap-2.5"
              style={{ backgroundColor: '#0b1120', borderTop: '1px solid #1e293b' }}
            >
              <button
                type="button"
                onClick={() => setQuickSettleTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmQuickSettle}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-98 cursor-pointer shadow-md border border-emerald-400 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Settle & Free Table</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaiterBillsPage;
