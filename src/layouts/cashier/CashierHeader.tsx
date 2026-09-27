import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { KOT } from '../../types';
import { ThemeToggle } from '../../components/ThemeToggle';
import { 
  ReceiptText, 
  Printer, 
  LogOut, 
  User, 
  Clock
} from 'lucide-react';

interface CashierHeaderProps {
  printerStatus?: 'online' | 'offline';
  activeTabOverride?: string;
  onNavigate?: (tab: string) => void;
}

export const CashierHeader: React.FC<CashierHeaderProps> = ({ 
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
    currentBranch,
    selectTakeawayOrder,
    setCartOrderType,
    updateKOTStatus
  } = useApp();

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [clearedAlertIds, setClearedAlertIds] = useState<string[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);

  const currentActive = activeTabOverride || activeTab;

  const handleTabClick = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    } else {
      setActiveTab(tab);
    }
  };

  // Active unbilled KOTs that have reached 'ready' status (Takeaway & Delivery for Cashier Counter)
  const readyOrders = useMemo(() => {
    const list = filteredKots || kots || [];
    return list.filter(k => 
      k.status === 'ready' && 
      !k.isBilled && 
      (currentBranch === 'all' || k.branchId === currentBranch) &&
      (k.orderType === 'takeaway' || k.orderType === 'delivery' || k.orderType === 'parcel')
    );
  }, [filteredKots, kots, currentBranch]);

  // Active alerts not cleared by cashier
  const activeAlerts = useMemo(() => {
    return readyOrders.filter(o => !clearedAlertIds.includes(o.id));
  }, [readyOrders, clearedAlertIds]);

  const unreadCount = activeAlerts.length;

  // Active KOTs count (tickets in active queue: new, preparing, ready)
  const activeTickets = filteredKots || kots || [];
  const activeKotsCount = activeTickets.filter(
    k => k.status === 'new' || k.status === 'preparing' || k.status === 'ready'
  ).length;

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setClearedAlertIds(readyOrders.map(o => o.id));
    showToast('Alerts Cleared', 'Kitchen ready alerts cleared.', 'info');
  };

  const handleMarkHandedOver = (order: KOT) => {
    updateKOTStatus(order.id, 'served');
    const rawId = order.takeawayId || (order.kotNumber ? `TK-${order.kotNumber.replace(/\D/g, '').slice(-3)}` : '101');
    const displayId = rawId.startsWith('#') ? rawId : `#${rawId}`;
    showToast(
      'Order Handed Over',
      `Takeaway ${displayId} marked as handed over / packed!`,
      'success'
    );
  };

  const handleAlertClick = (order: KOT) => {
    const takeawayLabel = order.takeawayId || (order.kotNumber ? `TK-${order.kotNumber.replace(/\D/g, '').slice(-3)}` : 'TK-101');
    selectTakeawayOrder(takeawayLabel);
    setCartOrderType('takeaway');
    handleTabClick('pos');
    setIsNotificationOpen(false);
    showToast('Order Loaded', `Opened Takeaway ${takeawayLabel} in POS.`);
  };

  const getOrderTitle = (order: KOT) => {
    const rawId = order.takeawayId || (order.kotNumber ? `TK-${order.kotNumber.replace(/\D/g, '').slice(-3)}` : '101');
    const displayId = rawId.startsWith('#') ? rawId : `#${rawId}`;
    const typeLabel = order.orderType === 'delivery' ? 'Delivery' : order.orderType === 'parcel' ? 'Parcel' : 'Takeaway';
    return `${typeLabel} ${displayId}: Ready for Handover/Packing`;
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
      <header
        id="cashier-global-header"
        className="w-full flex items-center justify-between h-16 min-w-0 bg-[#5c0b16] border-b border-[#3d060e] select-none flex-shrink-0 shadow-xs font-sans z-30"
      >
        {/* Left: Cashier Terminal branding (anchored on the left matching sidebar width) */}
        <div className="w-48 sm:w-52 xl:w-56 shrink-0 flex items-center gap-2 px-3 sm:px-4">
          <div className="w-8 h-8 rounded-lg bg-black/30 border border-white/10 flex items-center justify-center text-slate-200 font-bold shadow-xs shrink-0">
            <ReceiptText className="w-4 h-4 text-rose-300" />
          </div>
          <div className="hidden xl:block">
            <div className="header-brand-title text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap">
              CASHIER TERMINAL
            </div>
            <div className="header-brand-sub text-xs text-rose-200/80 font-medium whitespace-nowrap">Counter #01</div>
          </div>
          <div className="xl:hidden hidden sm:block">
            <div className="header-brand-title text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap">
              CASHIER
            </div>
            <div className="header-brand-sub text-xs text-rose-200/80 font-medium whitespace-nowrap">Counter #01</div>
          </div>
        </div>

        {/* Middle: Terminal Navigation Tabs (Horizontally centered to the middle menu panel) */}
        <div className="flex-1 flex items-center justify-center min-w-0 px-2">
          <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto no-scrollbar max-w-full bg-black/25 p-1.5 rounded-2xl border border-[#e2d5be]/40 shadow-inner">
            {/* 1. Tables */}
            <button
              id="cashier-tab-tables"
              type="button"
              onClick={() => handleTabClick('tables')}
              className={`rounded-xl px-4 py-2 flex items-center gap-2 text-xs md:text-sm whitespace-nowrap cursor-pointer transition-all ${
                currentActive === 'tables'
                  ? 'bg-[#f8f3e6] border border-[#e2d5be] !text-[#6b0f1a] font-bold shadow-md'
                  : 'bg-black/25 border border-transparent hover:border-[#e2d5be]/30 text-[#f8f3e6] hover:bg-[#f8f3e6]/10 font-medium'
              }`}
            >
              <span className="text-base">🪑</span>
              <span className={currentActive === 'tables' ? '!text-[#6b0f1a] font-bold' : 'text-[#f8f3e6]'}>Tables</span>
            </button>

            {/* 2. POS */}
            <button
              id="cashier-tab-pos"
              type="button"
              onClick={() => handleTabClick('pos')}
              className={`rounded-xl px-4 py-2 flex items-center gap-2 text-xs md:text-sm whitespace-nowrap cursor-pointer transition-all ${
                currentActive === 'pos'
                  ? 'bg-[#f8f3e6] border border-[#e2d5be] !text-[#6b0f1a] font-bold shadow-md'
                  : 'bg-black/25 border border-transparent hover:border-[#e2d5be]/30 text-[#f8f3e6] hover:bg-[#f8f3e6]/10 font-medium'
              }`}
            >
              <span className="text-base">🖥️</span>
              <span className={currentActive === 'pos' ? '!text-[#6b0f1a] font-bold' : 'text-[#f8f3e6]'}>POS</span>
            </button>

            {/* 3. Bills */}
            <button
              id="cashier-tab-bills"
              type="button"
              onClick={() => handleTabClick('bills')}
              className={`rounded-xl px-4 py-2 flex items-center gap-2 text-xs md:text-sm whitespace-nowrap cursor-pointer transition-all ${
                currentActive === 'bills'
                  ? 'bg-[#f8f3e6] border border-[#e2d5be] !text-[#6b0f1a] font-bold shadow-md'
                  : 'bg-black/25 border border-transparent hover:border-[#e2d5be]/30 text-[#f8f3e6] hover:bg-[#f8f3e6]/10 font-medium'
              }`}
            >
              <span className="text-base">🧾</span>
              <span className={currentActive === 'bills' ? '!text-[#6b0f1a] font-bold' : 'text-[#f8f3e6]'}>Bills</span>
            </button>

            {/* 4. KOTs (with dynamic badge counter) */}
            <button
              id="cashier-tab-kots"
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
              id="cashier-tab-zreport"
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
          </div>
        </div>

        {/* Right-Side Actions Alignment: Pinned right container matching cart width */}
        <div className="shrink-0 flex items-center justify-end gap-2 text-xs lg:w-[460px] xl:w-[480px] px-3 sm:px-4">
          {/* 1. Thermal Printer status indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-400">
            <Printer className="w-4 h-4 text-emerald-400" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-medium">Printer Ready</span>
          </div>

          {/* Global Light / Dark Theme Toggle */}
          <ThemeToggle />

          {/* 2. Kitchen Ready Notification Bell with Floating Popover */}
          <div className="relative" ref={notificationRef}>
            <button
              id="cashier-notification-bell-btn"
              type="button"
              onClick={() => setIsNotificationOpen(prev => !prev)}
              className="relative p-2.5 rounded-xl bg-[#161B26] border border-white/10 text-gray-200 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title={unreadCount > 0 ? `${unreadCount} kitchen ready order(s)` : 'Kitchen Ready Alerts'}
            >
              <span className="text-lg">🔔</span>
              {/* Notification Badge */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-500 text-black text-[10px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-[#0D111A] animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Floating Popover Dropdown */}
            {isNotificationOpen && (
              <div 
                id="cashier-ready-alerts-dropdown"
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#161B26] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden text-slate-200 backdrop-blur-md"
              >
                {/* Header: "Kitchen Ready Alerts" with a "Clear All" button */}
                <div className="px-3.5 py-2.5 bg-[#0D111A] border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🔔</span>
                    <span className="text-xs font-bold text-white tracking-wider font-mono">
                      Kitchen Ready Alerts
                    </span>
                    {activeAlerts.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-black font-extrabold font-mono">
                        {activeAlerts.length}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    disabled={activeAlerts.length === 0}
                    className="text-xs font-medium text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer px-2 py-0.5 rounded hover:bg-white/10"
                  >
                    Clear All
                  </button>
                </div>

                {/* Items: Display active orders that reached READY status */}
                <div className="max-h-[420px] overflow-y-auto p-2.5 space-y-2.5">
                  {activeAlerts.length === 0 ? (
                    <div className="py-7 px-4 text-center">
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-emerald-400 flex items-center justify-center mx-auto mb-2 text-sm font-bold">
                        ✓
                      </div>
                      <div className="text-xs font-semibold text-white">No Ready Takeaways</div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        All takeaway & delivery packets have been handed over or packed.
                      </p>
                    </div>
                  ) : (
                    activeAlerts.map(order => (
                      <div
                        key={order.id}
                        className="bg-[#121620] border border-white/10 rounded-xl p-3 space-y-2 shadow-md transition-all"
                      >
                        {/* Header: Bold Emerald Order Title with timestamp & total */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 flex-wrap">
                              <span>{getOrderTitle(order)}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                              <span className="font-mono text-emerald-300 font-semibold">{order.kotNumber}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-500" />
                                {order.readyAt ? `Ready at ${order.readyAt}` : (order.timeFormatted || 'Just now')}
                              </span>
                              <span>•</span>
                              <span className="text-white font-semibold font-mono">₹{order.totalAmount.toFixed(0)}</span>
                              {order.customerName && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-300 truncate max-w-[130px]">{order.customerName}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Items List: Compact gray pills showing dishes ready */}
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {order.items.map((item, idx) => (
                            <span 
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 text-[11px] font-medium"
                            >
                              <span className={item.isVeg ? "w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" : "w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0"} />
                              <span className="truncate max-w-[160px]">{item.name}</span>
                              <span className="text-emerald-400 font-bold font-mono">×{item.quantity}</span>
                            </span>
                          ))}
                        </div>

                        {/* Action Buttons at bottom of card */}
                        <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                          {/* Primary Green Button: [📦 Mark Handed Over / Packed] */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkHandedOver(order);
                            }}
                            className="flex-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm border border-emerald-400/40"
                          >
                            <span className="text-sm">📦</span>
                            <span>Mark Handed Over / Packed</span>
                          </button>

                          {/* Secondary Outline Button: [Open Bill / POS] */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAlertClick(order);
                            }}
                            className="py-1.5 px-3 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-white/10 shrink-0"
                          >
                            <ReceiptText className="w-3.5 h-3.5 text-slate-400" />
                            <span>Open Bill / POS</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Cashier Profile (Anita Deshmukh) */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/15">
            <div className="w-8 h-8 rounded-lg bg-black/30 text-white border border-white/10 flex items-center justify-center font-bold text-xs shrink-0">
              {currentUser?.name?.charAt(0) || <User className="w-4 h-4 text-white" />}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="header-user-name text-xs sm:text-sm font-semibold text-white whitespace-nowrap leading-tight">
                {currentUser?.name ? currentUser.name.replace(/\s*\(Cashier\)$/i, '') : 'Anita Deshmukh'}
              </span>
              <span className="header-user-sub text-xs text-rose-200/80 font-medium whitespace-nowrap leading-tight">
                (Cashier)
              </span>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            title="Sign Out"
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/10"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>
    </>
  );
};
