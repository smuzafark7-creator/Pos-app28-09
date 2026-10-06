import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Bill, PaymentMethod } from '../types';
import { 
  Search, 
  Receipt, 
  Printer, 
  Eye, 
  Filter, 
  Calendar, 
  Building2, 
  CreditCard,
  Download,
  CheckCircle2,
  X,
  Clock,
  User,
  Utensils,
  DollarSign,
  Ban,
  AlertTriangle,
  Send,
  ChevronDown
} from 'lucide-react';
import { BRANCHES } from '../data/mockData';
import { BrandWatermark } from '../components/BrandWatermark';

const isBillKotSent = (b: Bill) => {
  if (b.kotStatus === 'KOT Sent' || b.kotStatus === 'DISPATCHED') return true;
  if (b.kotSent === true) return true;
  if (Boolean(b.kotNumber || (b.kotNumbers && b.kotNumbers.length > 0) || b.kotId)) return true;
  return false;
};

export const BillsPage: React.FC = () => {
  const { 
    bills, 
    openReceiptModal, 
    openBillDetailsModal, 
    sendKotForBill,
    currentBranch, 
    setBranch, 
    branches, 
    currentUser, 
    showToast 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('All');
  const [paymentFilter, setPaymentFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>('All');
  const [kotStatusFilter, setKotStatusFilter] = useState<string>('All');
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return bills.filter(bill => {
      // Branch filter: if user is not owner, restricted by currentUser/currentBranch, else by selectedBranch
      const matchBranch = selectedBranch === 'all' 
        ? (currentBranch === 'all' || bill.branchId === currentBranch)
        : bill.branchId === selectedBranch;

      const matchSearch = bill.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (bill.customerName && bill.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (bill.tableNumber && bill.tableNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (bill.kotNumber && bill.kotNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchPayment = paymentFilter === 'All' || bill.paymentMethod.toLowerCase() === paymentFilter.toLowerCase();
      
      const matchOrderType = (() => {
        if (orderTypeFilter === 'All') return true;
        const bType = (bill.orderType || '').toLowerCase().replace(/[\s_-]/g, '');
        const fType = orderTypeFilter.toLowerCase().replace(/[\s_-]/g, '');
        if (fType === 'dinein') return bType === 'dinein';
        if (fType === 'takeaway') return bType === 'takeaway';
        if (fType === 'delivery') return bType === 'delivery' || bType === 'parcel';
        if (fType === 'parcel') return bType === 'parcel';
        return bType === fType;
      })();

      const matchStatus = statusFilter === 'All' 
        ? true 
        : statusFilter === 'paid' 
          ? bill.status !== 'cancelled' 
          : statusFilter === 'cancelled' 
            ? bill.status === 'cancelled' 
            : bill.status === statusFilter;

      const matchKotStatus = kotStatusFilter === 'All'
        ? true
        : kotStatusFilter === 'sent'
          ? isBillKotSent(bill)
          : !isBillKotSent(bill);

      // Date filtering
      let matchDate = true;
      if (dateFilter === 'Today') {
        const todayStr = new Date().toISOString().split('T')[0];
        matchDate = bill.date === todayStr || (bill.date ? (bill.date.includes('07 Sep 2026') || bill.date.includes('Today')) : false);
      } else if (dateFilter === 'Yesterday') {
        matchDate = bill.date ? (bill.date.includes('06 Sep') || bill.date.includes('Yesterday')) : false;
      }

      return matchBranch && matchSearch && matchPayment && matchOrderType && matchStatus && matchKotStatus && matchDate;
    });
  }, [bills, currentBranch, selectedBranch, searchQuery, paymentFilter, orderTypeFilter, statusFilter, kotStatusFilter, dateFilter]);

  const totalAmount = useMemo(() => {
    return filtered
      .filter(b => b.status !== 'cancelled')
      .reduce((sum, b) => sum + b.grandTotal, 0);
  }, [filtered]);

  // Dynamic counts for quick filter pill tabs (calculated across current ledger bills)
  const pillCounts = useMemo(() => {
    let allCount = bills.length;
    let dineInCount = 0;
    let takeawayCount = 0;
    let deliveryCount = 0;

    bills.forEach(b => {
      const t = (b.orderType || '').toLowerCase().replace(/[\s_-]/g, '');
      if (t === 'dinein') {
        dineInCount++;
      } else if (t === 'takeaway') {
        takeawayCount++;
      } else if (t === 'delivery' || t === 'parcel') {
        deliveryCount++;
      } else {
        dineInCount++;
      }
    });

    return {
      all: allCount,
      dineIn: dineInCount,
      takeaway: takeawayCount,
      delivery: deliveryCount,
    };
  }, [bills]);

  const orderTypePills = useMemo(() => [
    { key: 'All', id: 'filter-pill-all', label: 'All Bills', count: pillCounts.all },
    { key: 'dine_in', id: 'filter-pill-dine-in', label: 'Dine In', count: pillCounts.dineIn },
    { key: 'takeaway', id: 'filter-pill-takeaway', label: 'Takeaway', count: pillCounts.takeaway },
    { key: 'delivery', id: 'filter-pill-delivery', label: 'Delivery', count: pillCounts.delivery },
  ], [pillCounts]);

  const isPillActive = (key: string) => {
    if (key === 'All') return orderTypeFilter === 'All';
    if (key === 'dine_in') return orderTypeFilter === 'dine_in' || orderTypeFilter === 'dine in' || orderTypeFilter === 'dine-in';
    if (key === 'takeaway') return orderTypeFilter === 'takeaway';
    if (key === 'delivery') return orderTypeFilter === 'delivery' || orderTypeFilter === 'parcel';
    return false;
  };

  const handlePillSelect = (key: string) => {
    setOrderTypeFilter(key);
  };

  // Calculate drawer cash: sum of cash paid bills (including split payments) + opening float (₹5,000)
  const shiftCashSales = useMemo(() => {
    return bills
      .filter(b => b.status !== 'cancelled')
      .reduce((sum, b) => {
        if (b.paymentMethod === 'cash') return sum + b.grandTotal;
        if (b.paymentMethod === 'split' && b.splitDetails) return sum + (b.splitDetails.cash || 0);
        return sum;
      }, 0);
  }, [bills]);

  const shiftTotalPaid = useMemo(() => {
    return bills
      .filter(b => b.status !== 'cancelled')
      .reduce((sum, b) => sum + b.grandTotal, 0);
  }, [bills]);

  const drawerCashBalance = 5000 + shiftCashSales;

  return (
    <div 
      className="bills-main-wrapper relative z-2 min-h-full w-full px-4 md:px-6 py-4 space-y-4 font-sans text-slate-200 bg-transparent"
      style={{ backgroundColor: 'transparent', position: 'relative', zIndex: 2 }}
    >
      {/* Bilaal Restaurant Crest Watermark */}
      <BrandWatermark opacity={0.18} />

      <div className="relative z-10 space-y-4">
        {/* Top Banner (Dark Slate Surface) - Full Width Spread */}
      <div 
        className="bills-card-surface w-full flex flex-col xl:flex-row xl:items-center justify-between gap-3 px-4 md:px-5 py-3 rounded-xl shadow-xs"
        style={{ backgroundColor: '#0d1527', border: '1px solid #334155' }}
      >
        {/* Left: Title & Subtitle */}
        <div className="shrink-0">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400 shrink-0" />
            <h2 
              className="bills-page-title tracking-tight whitespace-nowrap"
              style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff', fontWeight: 800, fontSize: '18px' }}
            >
              Bills & Invoices Ledger
            </h2>
          </div>
          <p 
            className="bills-page-subtitle mt-0.5"
            style={{ color: '#94a3b8', WebkitTextFillColor: '#94a3b8', fontSize: '12px' }}
          >
            Complete billing register, tax receipts archive & settled accounts
          </p>
        </div>

        {/* Center: Filter Pills Group centered with ample breathing room */}
        <div className="flex items-center justify-start xl:justify-center gap-2 sm:gap-3 overflow-x-auto py-1 scrollbar-none flex-1 min-w-0 mx-0 xl:mx-4">
          {orderTypePills.map(pill => {
            const active = isPillActive(pill.key);

            return (
              <button
                key={pill.key}
                id={pill.id}
                type="button"
                onClick={() => handlePillSelect(pill.key)}
                className={`flex items-center justify-between gap-2.5 px-3.5 sm:px-4 py-2 min-w-[105px] sm:min-w-[115px] rounded-full text-xs font-bold transition-all whitespace-nowrap select-none cursor-pointer shrink-0 ${
                  active 
                    ? 'bills-tab-active shadow-xs' 
                    : 'bills-tab-inactive bills-tab-vanilla hover:bg-[#efe5c0]'
                }`}
                style={active ? { 
                  backgroundColor: '#7a0c1a', 
                  color: '#ffffff',
                  WebkitTextFillColor: '#ffffff',
                  fontWeight: 800,
                  border: '1px solid #8f1020',
                  borderRadius: '9999px'
                } : { 
                  backgroundColor: '#faf5ef', 
                  borderColor: '#eadbba',
                  border: '1px solid #eadbba', 
                  color: '#0f172a',
                  WebkitTextFillColor: '#0f172a',
                  fontWeight: 750,
                  borderRadius: '9999px'
                }}
              >
                <span style={{ 
                  color: active ? '#ffffff' : '#0f172a', 
                  WebkitTextFillColor: active ? '#ffffff' : '#0f172a', 
                  fontWeight: active ? 800 : 750 
                }}>
                  {pill.label}
                </span>
                <span
                  className={`text-xs font-mono transition-colors ${active ? 'bills-count-active' : 'bills-count-vanilla'}`}
                  style={active ? { 
                    color: '#ffffff', 
                    WebkitTextFillColor: '#ffffff', 
                    fontWeight: 800, 
                    backgroundColor: 'rgba(0, 0, 0, 0.35)',
                    padding: '2px 8px',
                    borderRadius: '9999px'
                  } : { 
                    color: '#0f172a', 
                    WebkitTextFillColor: '#0f172a', 
                    fontWeight: 800,
                    backgroundColor: '#e5dac2',
                    padding: '2px 8px',
                    borderRadius: '9999px'
                  }}
                >
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: The 3 KPI summary cards cleanly docked without clipping */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Drawer Cash */}
          <div 
            className="bills-card-surface flex items-center gap-2 px-3 py-1.5 rounded-xl shadow-xs min-w-fit shrink-0"
            style={{ backgroundColor: '#0d1527', border: '1px solid #334155' }}
          >
            <DollarSign className="w-4 h-4 shrink-0" style={{ color: '#10b981' }} />
            <div className="text-left">
              <span 
                className="bills-kpi-label text-[9px] uppercase tracking-wider block leading-tight whitespace-nowrap"
                style={{ color: '#94a3b8', fontWeight: 600 }}
              >
                Drawer Cash
              </span>
              <span 
                className="bills-kpi-value text-xs sm:text-sm font-mono leading-none"
                style={{ color: '#10b981', fontWeight: 800 }}
              >
                ₹{drawerCashBalance.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Shift Bills */}
          <div 
            className="bills-card-surface flex items-center gap-2 px-3 py-1.5 rounded-xl shadow-xs min-w-fit shrink-0"
            style={{ backgroundColor: '#0d1527', border: '1px solid #334155' }}
          >
            <div className="text-left">
              <span 
                className="bills-kpi-label text-[9px] uppercase tracking-wider block leading-tight whitespace-nowrap"
                style={{ color: '#94a3b8', fontWeight: 600 }}
              >
                Shift Bills
              </span>
              <div className="flex items-center gap-1.5 text-xs leading-none mt-0.5">
                <span className="font-bold text-white font-mono">{bills.length}</span>
                <span className="text-slate-600 text-[10px]">|</span>
                <span className="text-[10px] text-slate-400">Total:</span>
                <span 
                  className="bills-kpi-value font-mono"
                  style={{ color: '#10b981', fontWeight: 800 }}
                >
                  ₹{shiftTotalPaid.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Filtered Revenue & Count */}
          <div 
            className="bills-card-surface flex items-center gap-2 px-3 py-1.5 rounded-xl shadow-xs min-w-fit shrink-0"
            style={{ backgroundColor: '#0d1527', border: '1px solid #334155' }}
          >
            <div className="text-left">
              <span 
                className="bills-kpi-label text-[9px] uppercase tracking-wider block leading-tight whitespace-nowrap"
                style={{ color: '#94a3b8', fontWeight: 600 }}
              >
                Filtered Revenue
              </span>
              <div className="flex items-center gap-1.5 text-xs leading-none mt-0.5">
                <span 
                  className="bills-kpi-value font-mono"
                  style={{ color: '#10b981', fontWeight: 800 }}
                >
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
                <span className="text-slate-600 text-[10px]">|</span>
                <span className="font-semibold text-slate-300 font-mono">
                  {filtered.length} Bills
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar with all required filters (Dark Slate Surface) - Full Width Spread */}
      <div 
        className="bills-container w-full p-4 rounded-xl shadow-xs space-y-3"
        style={{ backgroundColor: '#0d1527', border: '1px solid #334155' }}
      >
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94a3b8' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Invoice #, guest name, table..."
              className="bills-search-input w-full pl-9 pr-3 py-2 rounded-lg text-xs placeholder:text-[#94a3b8] focus:outline-none focus:border-slate-500"
              style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff' }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 overflow-x-auto text-xs">
            {/* Branch Filter */}
            <div className="relative">
              <select
                value={selectedBranch}
                onChange={e => setSelectedBranch(e.target.value)}
                className="bills-select-filter appearance-none pl-3 pr-8 py-1.5 rounded-lg focus:outline-none cursor-pointer"
                style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', WebkitTextFillColor: '#ffffff', fontWeight: 600, fontSize: '13px' }}
              >
                <option value="all" style={{ backgroundColor: '#0f172a', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>All Branches</option>
                <option value="main" style={{ backgroundColor: '#0f172a', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>Main Branch</option>
                <option value="city" style={{ backgroundColor: '#0f172a', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>City Branch</option>
                <option value="beach" style={{ backgroundColor: '#0f172a', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>Beach Road Branch</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Date Filter */}
            <div className="relative">
              <select
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="bills-select-filter appearance-none pl-3 pr-8 py-1.5 rounded-lg focus:outline-none cursor-pointer"
                style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', WebkitTextFillColor: '#ffffff', fontWeight: 600, fontSize: '13px' }}
              >
                <option value="All" style={{ backgroundColor: '#0f172a', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>All Dates</option>
                <option value="Today" style={{ backgroundColor: '#0f172a', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>Today (07 Sep)</option>
                <option value="Yesterday" style={{ backgroundColor: '#0f172a', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>Yesterday</option>
                <option value="This Week" style={{ backgroundColor: '#0f172a', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>This Week</option>
                <option value="This Month" style={{ backgroundColor: '#0f172a', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>This Month</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Payment Method Filter */}
            <div className="relative">
              <select
                value={paymentFilter}
                onChange={e => setPaymentFilter(e.target.value)}
                className="bills-select-filter appearance-none pl-3 pr-8 py-1.5 rounded-lg focus:outline-none cursor-pointer"
                style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', WebkitTextFillColor: '#ffffff', fontWeight: 600, fontSize: '13px' }}
              >
                <option value="All" style={{ backgroundColor: '#0f172a', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>All Payments</option>
                <option value="upi" style={{ backgroundColor: '#0f172a', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>UPI</option>
                <option value="cash" style={{ backgroundColor: '#0f172a', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>Cash</option>
                <option value="card" style={{ backgroundColor: '#0f172a', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>Card</option>
                <option value="split" style={{ backgroundColor: '#0f172a', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>Split</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Order Type Filter */}
            <div className="relative">
              <select
                value={orderTypeFilter}
                onChange={e => setOrderTypeFilter(e.target.value)}
                className="bills-select-filter appearance-none pl-3 pr-8 py-1.5 rounded-lg focus:outline-none cursor-pointer"
                style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', WebkitTextFillColor: '#ffffff', fontWeight: 600, fontSize: '13px' }}
              >
                <option value="All" style={{ backgroundColor: '#0f172a', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>All Types</option>
                <option value="dine_in" style={{ backgroundColor: '#0f172a', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>Dine-in</option>
                <option value="takeaway" style={{ backgroundColor: '#0f172a', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>Takeaway</option>
                <option value="delivery" style={{ backgroundColor: '#0f172a', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>Delivery</option>
                <option value="parcel" style={{ backgroundColor: '#0f172a', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>Parcel</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bills-select-filter appearance-none pl-3 pr-8 py-1.5 rounded-lg focus:outline-none cursor-pointer"
                style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', WebkitTextFillColor: '#ffffff', fontWeight: 600, fontSize: '13px' }}
              >
                <option value="All" style={{ backgroundColor: '#0f172a', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>All Status</option>
                <option value="paid" style={{ backgroundColor: '#0f172a', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>PAID</option>
                <option value="cancelled" style={{ backgroundColor: '#0f172a', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>VOIDED / CANCELLED</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* KOT Status Filter */}
            <div className="relative">
              <select
                value={kotStatusFilter}
                onChange={e => setKotStatusFilter(e.target.value)}
                className="bills-select-filter appearance-none pl-3 pr-8 py-1.5 rounded-lg focus:outline-none cursor-pointer"
                style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', WebkitTextFillColor: '#ffffff', fontWeight: 600, fontSize: '13px' }}
              >
                <option value="All" style={{ backgroundColor: '#0f172a', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>All KOT Status</option>
                <option value="sent" style={{ backgroundColor: '#0f172a', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>KOT Sent</option>
                <option value="unsent" style={{ backgroundColor: '#0f172a', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>KOT Not Sent</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>
      </div>

      {/* Bills Table Grid (Dark Slate Surface) */}
      <div 
        className="bills-container rounded-xl shadow-xs overflow-hidden"
        style={{ backgroundColor: '#0d1527', border: '1px solid #334155' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead 
              style={{ backgroundColor: '#0b1120', borderBottom: '2px solid #334155' }}
              className="bills-table-header uppercase tracking-wider text-[10px]"
            >
              <tr>
                <th className="py-3 px-4" style={{ color: '#cbd5e1', fontWeight: 700 }}>Invoice No</th>
                <th className="py-3 px-4" style={{ color: '#cbd5e1', fontWeight: 700 }}>Date</th>
                <th className="py-3 px-4" style={{ color: '#cbd5e1', fontWeight: 700 }}>Branch</th>
                <th className="py-3 px-4" style={{ color: '#cbd5e1', fontWeight: 700 }}>Order Type</th>
                <th className="py-3 px-4" style={{ color: '#cbd5e1', fontWeight: 700 }}>Table / Guest</th>
                <th className="py-3 px-4" style={{ color: '#cbd5e1', fontWeight: 700 }}>Items</th>
                <th className="py-3 px-4 text-right" style={{ color: '#cbd5e1', fontWeight: 700 }}>Amount</th>
                <th className="py-3 px-4" style={{ color: '#cbd5e1', fontWeight: 700 }}>Payment</th>
                <th className="py-3 px-4 text-center" style={{ color: '#cbd5e1', fontWeight: 700 }}>Status</th>
                <th className="py-3 px-4 text-center" style={{ color: '#cbd5e1', fontWeight: 700 }}>KOT Status</th>
                <th className="py-3 px-4 text-right" style={{ color: '#cbd5e1', fontWeight: 700 }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filtered.map((bill, index) => {
                const isEven = index % 2 === 0;
                const isSelected = selectedBillId === bill.id;
                const rowBg = isSelected ? '#172554' : (isEven ? '#0d1527' : '#090e1a');
                return (
                  <tr 
                    key={bill.id} 
                    className={`bills-table-row ${isEven ? 'bills-row-even' : 'bills-row-odd'} ${isSelected ? 'bills-row-selected' : ''} border-b border-slate-800/80 transition-colors group cursor-pointer`}
                    style={{ backgroundColor: rowBg }}
                    onClick={() => {
                      setSelectedBillId(bill.id);
                      openBillDetailsModal(bill);
                    }}
                  >
                    <td className="bills-data-text py-3.5 px-4" style={{ color: '#ffffff', fontWeight: 600 }}>
                      {bill.billNumber}
                    </td>
                    <td className="bills-data-text py-3.5 px-4" style={{ color: '#ffffff', fontWeight: 600 }}>
                      <div>{bill.date}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{bill.time}</div>
                    </td>
                    <td className="bills-data-text py-3.5 px-4" style={{ color: '#ffffff', fontWeight: 600 }}>
                      {bill.branchName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span 
                        className="bills-order-badge capitalize px-2 py-0.5 rounded text-xs font-medium"
                        style={{ 
                          backgroundColor: '#1e293b', 
                          color: '#f1f5f9', 
                          WebkitTextFillColor: '#f1f5f9',
                          border: '1px solid #475569' 
                        }}
                      >
                        {bill.orderType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="bills-data-text py-3.5 px-4">
                      {bill.tableNumber ? (
                        <span 
                          className="bills-table-num"
                          style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff', fontWeight: 700 }}
                        >
                          {bill.tableNumber}
                        </span>
                      ) : (
                        <span 
                          className="bills-guest-name"
                          style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff', fontWeight: 600 }}
                        >
                          {bill.customerName || 'Takeaway'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-medium">
                      {bill.items.length} items
                    </td>
                    <td className="bills-amount-val py-3.5 px-4 text-right" style={{ color: '#10b981', fontWeight: 800, fontSize: '14px' }}>
                      ₹{bill.grandTotal.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span 
                        className="bills-payment-mode font-semibold uppercase text-xs"
                        style={{ color: '#cbd5e1', WebkitTextFillColor: '#cbd5e1', fontWeight: 600, fontSize: '12px' }}
                      >
                        {bill.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {bill.status === 'cancelled' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/60 text-rose-400 border border-rose-800">
                          <Ban className="w-3 h-3" />
                          VOIDED
                        </span>
                      ) : (
                        <span 
                          className="bills-badge-paid inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold"
                          style={{
                            backgroundColor: 'rgba(6, 78, 59, 0.7)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: '#34d399',
                            WebkitTextFillColor: '#34d399',
                            boxShadow: '0 0 8px rgba(16, 185, 129, 0.2)'
                          }}
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          PAID
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center" onClick={e => e.stopPropagation()}>
                      {isBillKotSent(bill) ? (
                        <span 
                          className="bills-badge-kot inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold whitespace-nowrap"
                          style={{
                            backgroundColor: 'rgba(6, 78, 59, 0.7)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: '#34d399',
                            WebkitTextFillColor: '#34d399',
                            boxShadow: '0 0 8px rgba(16, 185, 129, 0.2)'
                          }}
                          title={bill.kotNumbers?.join(', ') || bill.kotNumber || bill.kotId || 'KOT Sent to Kitchen'}
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>KOT Sent</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => sendKotForBill(bill)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold bg-amber-950/70 hover:bg-amber-900 text-amber-300 hover:text-amber-100 border border-amber-600/80 transition-all cursor-pointer shadow-xs group/btn whitespace-nowrap"
                          title="KOT not sent! Click to instantly dispatch to Kitchen KDS"
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 animate-pulse" />
                          <span>KOT Not Sent</span>
                          <span className="text-[9px] text-amber-400 underline font-mono ml-0.5 group-hover/btn:text-white">(Send)</span>
                        </button>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => sendKotForBill(bill)}
                          className={`bills-btn-kot flex items-center gap-1 cursor-pointer transition-colors shadow-2xs whitespace-nowrap ${
                            isBillKotSent(bill)
                              ? 'font-semibold px-2.5 py-1.5 rounded-lg text-xs'
                              : 'bg-amber-600 hover:bg-amber-500 text-white border border-amber-500 font-bold px-2.5 py-1.5 rounded-lg text-xs animate-pulse hover:animate-none'
                          }`}
                          style={isBillKotSent(bill) ? {
                            backgroundColor: '#1e293b',
                            color: '#fcd34d',
                            WebkitTextFillColor: '#fcd34d',
                            border: '1px solid rgba(245, 158, 11, 0.4)'
                          } : undefined}
                          title={isBillKotSent(bill) ? 'Re-send KOT to Kitchen KDS' : 'Send KOT to Kitchen KDS'}
                        >
                          {isBillKotSent(bill) ? (
                            <>
                              <Utensils className="w-3 h-3 text-amber-300" />
                              <span>Re-send KOT</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3 h-3 text-white" />
                              <span>Send KOT</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBillId(bill.id);
                            openBillDetailsModal(bill);
                          }}
                          className="bills-btn-view font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                          style={{
                            backgroundColor: '#1e3a8a',
                            color: '#ffffff',
                            WebkitTextFillColor: '#ffffff',
                            border: '1px solid rgba(59, 130, 246, 0.5)'
                          }}
                          title="View Full Bill Details"
                        >
                          <Eye className="w-3 h-3 text-white" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => openReceiptModal(bill)}
                          className="bills-btn-print font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                          style={{
                            backgroundColor: '#1e293b',
                            color: '#f1f5f9',
                            WebkitTextFillColor: '#f1f5f9',
                            border: '1px solid #334155'
                          }}
                          title="Print Thermal Receipt"
                        >
                          <Printer className="w-3 h-3 text-slate-300" />
                          <span>Print</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div 
            className="p-12 text-center text-xs"
            style={{ backgroundColor: '#0d1527', color: '#94a3b8' }}
          >
            No bills match the selected filters or search query.
          </div>
        )}
      </div>
    </div>
  </div>
  );
};
