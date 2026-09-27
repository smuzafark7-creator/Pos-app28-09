import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { KOT, KDSAlert } from '../../types';
import { ThemeToggle } from '../../components/ThemeToggle';
import { 
  ShieldCheck, 
  Printer, 
  LogOut, 
  User, 
  Clock, 
  Check, 
  AlertTriangle, 
  Utensils, 
  ReceiptText, 
  Users
} from 'lucide-react';

interface ManagerHeaderProps {
  printerStatus?: 'online' | 'offline';
  activeTabOverride?: string;
  onNavigate?: (tab: string) => void;
}

type NotificationCategory = 'all' | 'dine_in' | 'takeaway' | 'voids';

export const ManagerHeader: React.FC<ManagerHeaderProps> = ({ 
  printerStatus = 'online',
  activeTabOverride,
  onNavigate
}) => {
  const { 
    currentUser, 
    activeTab,
    setActiveTab, 
    showToast, 
    logout,
    filteredKots,
    kots,
    bills,
    kdsAlerts,
    openReceiptModal,
    currentBranch,
    selectTakeawayOrder,
    selectTableForPOS,
    setCartOrderType,
    updateKOTStatus,
    dismissKDSAlert
  } = useApp();

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationCategory, setNotificationCategory] = useState<NotificationCategory>('all');
  const [clearedKotAlertIds, setClearedKotAlertIds] = useState<string[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);

  const currentActive = activeTabOverride || activeTab;

  const handleTabClick = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    } else {
      setActiveTab(tab);
    }
  };

  // 1. Ready orders: BOTH Dine-In and Takeaway/Delivery/Parcel for Branch 1 / Main Branch
  const allReadyOrders = useMemo(() => {
    const list = filteredKots || kots || [];
    return list.filter(k => 
      k.status === 'ready' && 
      !k.isBilled && 
      (currentBranch === 'all' || k.branchId === currentBranch || k.branchId === 'main')
    );
  }, [filteredKots, kots, currentBranch]);

  // Dine-in ready orders
  const dineInReadyOrders = useMemo(() => {
    return allReadyOrders.filter(k => k.orderType === 'dine_in' && !clearedKotAlertIds.includes(k.id));
  }, [allReadyOrders, clearedKotAlertIds]);

  // Takeaway & parcel ready orders
  const takeawayReadyOrders = useMemo(() => {
    return allReadyOrders.filter(
      k => (k.orderType === 'takeaway' || k.orderType === 'parcel' || k.orderType === 'delivery') &&
           !clearedKotAlertIds.includes(k.id)
    );
  }, [allReadyOrders, clearedKotAlertIds]);

  // 2. Void & Cancellation alerts (KOT item voids & bill voids)
  const activeVoidAlerts = useMemo(() => {
    return (kdsAlerts || []).filter(a => !a.dismissed);
  }, [kdsAlerts]);

  // Total active alerts count
  const unreadCount = dineInReadyOrders.length + takeawayReadyOrders.length + activeVoidAlerts.length;

  // Active KOTs count (tickets in active queue: new, preparing, ready)
  const activeTickets = filteredKots || kots || [];
  const activeKotsCount = activeTickets.filter(
    k => (k.branchId === 'main' || currentBranch === 'all' || k.branchId === currentBranch) &&
         (k.status === 'new' || k.status === 'preparing' || k.status === 'ready')
  ).length;

  const handlePrintTest = () => {
    showToast('Test Receipt Sent', 'Thermal printer test dispatched to Manager Counter TM-T88VI (58mm).', 'success');
    if (bills.length > 0) {
      openReceiptModal(bills[0]);
    }
  };

  const handleClearAllAlerts = (e: React.MouseEvent) => {
    e.stopPropagation();
    setClearedKotAlertIds(allReadyOrders.map(o => o.id));
    (kdsAlerts || []).forEach(a => dismissKDSAlert(a.id));
    showToast('Alerts Cleared', 'All manager notifications cleared.', 'info');
  };

  const handleMarkDineInServed = (order: KOT) => {
    updateKOTStatus(order.id, 'served');
    showToast('Table Served', `Food marked as served for Table ${order.tableNumber || 'Table'}!`, 'success');
  };

  const handleMarkTakeawayHandedOver = (order: KOT) => {
    updateKOTStatus(order.id, 'served');
    const rawId = order.takeawayId || (order.kotNumber ? `TK-${order.kotNumber.replace(/\D/g, '').slice(-3)}` : '101');
    const displayId = rawId.startsWith('#') ? rawId : `#${rawId}`;
    showToast('Takeaway Packed', `Takeaway ${displayId} marked as handed over / packed!`, 'success');
  };

  const handleOpenOrderInPOS = (order: KOT) => {
    if (order.orderType === 'dine_in' && order.tableNumber) {
      selectTableForPOS(order.tableNumber);
      setCartOrderType('dine_in');
    } else {
      const takeawayLabel = order.takeawayId || (order.kotNumber ? `TK-${order.kotNumber.replace(/\D/g, '').slice(-3)}` : 'TK-101');
      selectTakeawayOrder(takeawayLabel);
      setCartOrderType('takeaway');
    }
    handleTabClick('pos');
    setIsNotificationOpen(false);
  };

  // Close notification on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="w-full flex items-center justify-between px-4 h-16 min-w-0 bg-[#0D111A] border-b border-white/10 select-none flex-shrink-0 shadow-xs font-sans z-30">
        {/* Left: Manager Console Branding + Horizontal Navigation Tabs */}
        <div className="flex items-center min-w-0 gap-2 sm:gap-3">
          {/* Manager Console Branding */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold shadow-xs shrink-0">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="hidden xl:block">
              <div className="text-xs font-bold tracking-wider text-white whitespace-nowrap">
                MANAGER CONSOLE
              </div>
              <div className="text-[10px] text-indigo-300 font-medium whitespace-nowrap">
                Branch 1 (Main)
              </div>
            </div>
            <div className="xl:hidden hidden sm:block">
              <div className="text-xs font-bold text-white whitespace-nowrap">
                MANAGER
              </div>
            </div>
          </div>

          {/* Integrated Horizontal Navigation Tabs */}
          <div className="flex items-center gap-1.5 shrink overflow-x-auto no-scrollbar max-w-[60vw] bg-black/25 p-1.5 rounded-2xl border border-[#e2d5be]/40 shadow-inner">
            {/* 1. Tables / Floor */}
            <button
              id="manager-tab-tables"
              type="button"
              onClick={() => handleTabClick('tables')}
              className={`rounded-xl px-4 py-2 flex items-center gap-2 text-xs md:text-sm whitespace-nowrap cursor-pointer transition-all ${
                currentActive === 'tables'
                  ? 'bg-[#f8f3e6] border border-[#e2d5be] !text-[#6b0f1a] font-bold shadow-md'
                  : 'bg-black/25 border border-transparent hover:border-[#e2d5be]/30 text-[#f8f3e6] hover:bg-[#f8f3e6]/10 font-medium'
              }`}
            >
              <span className="text-base">🪑</span>
              <span className={currentActive === 'tables' ? '!text-[#6b0f1a] font-bold' : 'text-[#f8f3e6]'}>Tables / Floor</span>
            </button>

            {/* 2. POS / Billing */}
            <button
              id="manager-tab-pos"
              type="button"
              onClick={() => handleTabClick('pos')}
              className={`rounded-xl px-4 py-2 flex items-center gap-2 text-xs md:text-sm whitespace-nowrap cursor-pointer transition-all ${
                currentActive === 'pos'
                  ? 'bg-[#f8f3e6] border border-[#e2d5be] !text-[#6b0f1a] font-bold shadow-md'
                  : 'bg-black/25 border border-transparent hover:border-[#e2d5be]/30 text-[#f8f3e6] hover:bg-[#f8f3e6]/10 font-medium'
              }`}
            >
              <span className="text-base">🖥️</span>
              <span className={currentActive === 'pos' ? '!text-[#6b0f1a] font-bold' : 'text-[#f8f3e6]'}>POS / Billing</span>
            </button>

            {/* 3. Bills & Ledger */}
            <button
              id="manager-tab-bills"
              type="button"
              onClick={() => handleTabClick('bills')}
              className={`rounded-xl px-4 py-2 flex items-center gap-2 text-xs md:text-sm whitespace-nowrap cursor-pointer transition-all ${
                currentActive === 'bills'
                  ? 'bg-[#f8f3e6] border border-[#e2d5be] !text-[#6b0f1a] font-bold shadow-md'
                  : 'bg-black/25 border border-transparent hover:border-[#e2d5be]/30 text-[#f8f3e6] hover:bg-[#f8f3e6]/10 font-medium'
              }`}
            >
              <span className="text-base">🧾</span>
              <span className={currentActive === 'bills' ? '!text-[#6b0f1a] font-bold' : 'text-[#f8f3e6]'}>Bills & Ledger</span>
            </button>

            {/* 4. KOTs */}
            <button
              id="manager-tab-kots"
              type="button"
              onClick={() => handleTabClick('kot')}
              className={`rounded-xl px-4 py-2 flex items-center gap-2 text-xs md:text-sm whitespace-nowrap cursor-pointer transition-all ${
                currentActive === 'kot' || currentActive === 'kots'
                  ? 'bg-[#f8f3e6] border border-[#e2d5be] !text-[#6b0f1a] font-bold shadow-md'
                  : 'bg-black/25 border border-transparent hover:border-[#e2d5be]/30 text-[#f8f3e6] hover:bg-[#f8f3e6]/10 font-medium'
              }`}
            >
              <span className="text-base">📋</span>
              <span className={currentActive === 'kot' || currentActive === 'kots' ? '!text-[#6b0f1a] font-bold' : 'text-[#f8f3e6]'}>KOTs</span>
              {activeKotsCount > 0 && (
                <span className={`min-w-4 h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center font-mono ml-0.5 ${
                  currentActive === 'kot' || currentActive === 'kots'
                    ? 'bg-[#6b0f1a] text-[#f8f3e6]'
                    : 'bg-amber-500 text-black'
                }`}>
                  {activeKotsCount}
                </span>
              )}
            </button>

            {/* 5. Z-Report */}
            <button
              id="manager-tab-zreport"
              type="button"
              onClick={() => handleTabClick('zreport')}
              className={`rounded-xl px-4 py-2 flex items-center gap-2 text-xs md:text-sm whitespace-nowrap cursor-pointer transition-all ${
                currentActive === 'zreport'
                  ? 'bg-[#f8f3e6] border border-[#e2d5be] !text-[#6b0f1a] font-bold shadow-md'
                  : 'bg-black/25 border border-transparent hover:border-[#e2d5be]/30 text-[#f8f3e6] hover:bg-[#f8f3e6]/10 font-medium'
              }`}
            >
              <span className="text-base">📊</span>
              <span className={currentActive === 'zreport' ? '!text-[#6b0f1a] font-bold' : 'text-[#f8f3e6]'}>Z-Report</span>
            </button>

            {/* 6. Manager Reports / Sales Analytics (Manager-exclusive) */}
            <button
              id="manager-tab-reports"
              type="button"
              onClick={() => handleTabClick('reports')}
              className={`rounded-xl px-4 py-2 flex items-center gap-2 text-xs md:text-sm whitespace-nowrap cursor-pointer transition-all ${
                currentActive === 'reports'
                  ? 'bg-[#f8f3e6] border border-[#e2d5be] !text-[#6b0f1a] font-bold shadow-md'
                  : 'bg-black/25 border border-transparent hover:border-[#e2d5be]/30 text-[#f8f3e6] hover:bg-[#f8f3e6]/10 font-medium'
              }`}
            >
              <span className="text-base">📈</span>
              <span className={currentActive === 'reports' ? '!text-[#6b0f1a] font-bold' : 'text-[#f8f3e6]'}>Manager Reports</span>
            </button>

            {/* 7. Store Settings (Manager-exclusive) */}
            <button
              id="manager-tab-settings"
              type="button"
              onClick={() => handleTabClick('settings')}
              className={`rounded-xl px-4 py-2 flex items-center gap-2 text-xs md:text-sm whitespace-nowrap cursor-pointer transition-all ${
                currentActive === 'settings'
                  ? 'bg-[#f8f3e6] border border-[#e2d5be] !text-[#6b0f1a] font-bold shadow-md'
                  : 'bg-black/25 border border-transparent hover:border-[#e2d5be]/30 text-[#f8f3e6] hover:bg-[#f8f3e6]/10 font-medium'
              }`}
            >
              <span className="text-base">⚙️</span>
              <span className={currentActive === 'settings' ? '!text-[#6b0f1a] font-bold' : 'text-[#f8f3e6]'}>Store Settings</span>
            </button>
          </div>
        </div>

        {/* Right-Side Actions: Pinned right container */}
        <div className="shrink-0 flex items-center gap-2 text-xs">
          {/* 1. Thermal Printer status indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-400">
            <Printer className="w-4 h-4 text-emerald-400" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium">Printer Ready</span>
          </div>

          {/* Global Light / Dark Theme Toggle */}
          <ThemeToggle />

          {/* 2. Comprehensive Manager Notification Bell */}
          <div className="relative" ref={notificationRef}>
            <button
              id="manager-notification-bell-btn"
              type="button"
              onClick={() => setIsNotificationOpen(prev => !prev)}
              className="relative p-2.5 rounded-xl bg-[#161B26] border border-white/10 text-gray-200 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title={unreadCount > 0 ? `${unreadCount} operational alerts (Dine-in, Takeaway & Voids)` : 'Operational Alerts'}
            >
              <span className="text-lg">🔔</span>
              {/* Notification Badge */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-[#0D111A] animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Floating Popover Dropdown */}
            {isNotificationOpen && (
              <div 
                id="manager-ready-alerts-dropdown"
                className="absolute right-0 mt-2 w-88 sm:w-[440px] bg-[#161B26] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden text-slate-200 backdrop-blur-md"
              >
                {/* Header: Title + Clear All button */}
                <div className="px-3.5 py-2.5 bg-[#0D111A] border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🔔</span>
                    <span className="text-xs font-bold text-white tracking-wider font-mono">
                      Manager Alerts &amp; Activities
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-black font-extrabold font-mono">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleClearAllAlerts}
                    disabled={unreadCount === 0}
                    className="text-xs font-medium text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer px-2 py-0.5 rounded hover:bg-white/10"
                  >
                    Clear All
                  </button>
                </div>

                {/* Filter Pills (All / Dine-In / Takeaway / Voids) */}
                <div className="px-3 py-2 bg-[#121620] border-b border-white/10 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNotificationCategory('all')}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                      notificationCategory === 'all'
                        ? 'bg-white/15 text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    All ({unreadCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotificationCategory('dine_in')}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                      notificationCategory === 'dine_in'
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    🍽️ Dine-In ({dineInReadyOrders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotificationCategory('takeaway')}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                      notificationCategory === 'takeaway'
                        ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    📦 Takeaway ({takeawayReadyOrders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotificationCategory('voids')}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                      notificationCategory === 'voids'
                        ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    ⚠️ Voids ({activeVoidAlerts.length})
                  </button>
                </div>

                {/* Items Container */}
                <div className="max-h-[440px] overflow-y-auto p-2.5 space-y-2">
                  {unreadCount === 0 ? (
                    <div className="py-8 px-4 text-center">
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-emerald-400 flex items-center justify-center mx-auto mb-2 text-sm font-bold">
                        ✓
                      </div>
                      <div className="text-xs font-semibold text-white">All Clear</div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        No pending kitchen dispatches or void authorization alerts.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Voids & Cancellations Section */}
                      {(notificationCategory === 'all' || notificationCategory === 'voids') && (
                        activeVoidAlerts.map(alert => (
                          <div
                            key={alert.id}
                            className="bg-rose-950/30 border border-rose-800/40 rounded-xl p-3 space-y-2 text-xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                <span>VOID AUDIT ALERT</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">{alert.time}</span>
                            </div>

                            <div className="text-white font-medium">
                              <strong>{alert.itemName}</strong> on KOT #{alert.kotNumber}
                              {alert.tableNumber && ` (${alert.tableNumber})`}
                            </div>

                            {alert.reason && (
                              <div className="text-[11px] text-rose-300/90 italic bg-rose-950/50 px-2 py-1 rounded border border-rose-900/50">
                                Reason: {alert.reason}
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-1 border-t border-rose-800/30 text-[10px] text-slate-400">
                              <span>Action by: <strong className="text-slate-200">{alert.voidedBy}</strong></span>
                              <button
                                type="button"
                                onClick={() => dismissKDSAlert(alert.id)}
                                className="px-2 py-0.5 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-200 font-semibold cursor-pointer transition-colors"
                              >
                                Acknowledge
                              </button>
                            </div>
                          </div>
                        ))
                      )}

                      {/* Dine-In Ready Section */}
                      {(notificationCategory === 'all' || notificationCategory === 'dine_in') && (
                        dineInReadyOrders.map(order => (
                          <div
                            key={order.id}
                            className="bg-[#121620] border border-white/10 rounded-xl p-3 space-y-2 text-xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                                  <Utensils className="w-3.5 h-3.5" />
                                  <span>Dine-In Ready: Table {order.tableNumber || 'Floor'}</span>
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                                  <span className="font-mono text-emerald-300 font-semibold">{order.kotNumber}</span>
                                  <span>•</span>
                                  <span>Ready at {order.readyAt || order.timeFormatted || 'Now'}</span>
                                  <span>•</span>
                                  <span className="text-white font-bold font-mono">₹{order.totalAmount.toFixed(0)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {order.items.map((item, idx) => (
                                <span 
                                  key={idx}
                                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 text-[11px] font-medium"
                                >
                                  <span className={item.isVeg ? "w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" : "w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0"} />
                                  <span>{item.name}</span>
                                  <span className="text-emerald-400 font-bold font-mono">×{item.quantity}</span>
                                </span>
                              ))}
                            </div>

                            <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                              <button
                                type="button"
                                onClick={() => handleMarkDineInServed(order)}
                                className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Mark Served to Table</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenOrderInPOS(order)}
                                className="py-1.5 px-2.5 bg-white/5 hover:bg-white/10 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer border border-white/10"
                              >
                                <ReceiptText className="w-3 h-3 text-slate-400" />
                                <span>Open Table</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )}

                      {/* Takeaway Ready Section */}
                      {(notificationCategory === 'all' || notificationCategory === 'takeaway') && (
                        takeawayReadyOrders.map(order => {
                          const rawId = order.takeawayId || (order.kotNumber ? `TK-${order.kotNumber.replace(/\D/g, '').slice(-3)}` : '101');
                          const displayId = rawId.startsWith('#') ? rawId : `#${rawId}`;

                          return (
                            <div
                              key={order.id}
                              className="bg-[#121620] border border-white/10 rounded-xl p-3 space-y-2 text-xs"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                                    <span>📦 Takeaway {displayId}: Ready for Handover</span>
                                  </div>
                                  <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                                    <span className="font-mono text-blue-300 font-semibold">{order.kotNumber}</span>
                                    <span>•</span>
                                    <span>Ready at {order.readyAt || order.timeFormatted || 'Now'}</span>
                                    <span>•</span>
                                    <span className="text-white font-bold font-mono">₹{order.totalAmount.toFixed(0)}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {order.items.map((item, idx) => (
                                  <span 
                                    key={idx}
                                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 text-[11px] font-medium"
                                  >
                                    <span className={item.isVeg ? "w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" : "w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0"} />
                                    <span>{item.name}</span>
                                    <span className="text-emerald-400 font-bold font-mono">×{item.quantity}</span>
                                  </span>
                                ))}
                              </div>

                              <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                                <button
                                  type="button"
                                  onClick={() => handleMarkTakeawayHandedOver(order)}
                                  className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                                >
                                  <span>📦 Mark Handed Over</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenOrderInPOS(order)}
                                  className="py-1.5 px-2.5 bg-white/5 hover:bg-white/10 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer border border-white/10"
                                >
                                  <ReceiptText className="w-3 h-3 text-slate-400" />
                                  <span>Open in POS</span>
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Badge (Vikram Sharma) */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white border border-indigo-400 flex items-center justify-center font-bold text-xs shadow-sm">
              VS
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-200 leading-tight">
                {currentUser?.name || 'Vikram Sharma (Manager)'}
              </div>
              <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                SUPERVISOR • BRANCH 1
              </div>
            </div>
          </div>

          {/* Logout Icon Button */}
          <button
            onClick={logout}
            title="Sign Out"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/10"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>
    </>
  );
};
