import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { BranchId, Bill } from '../types';
import { 
  Building2, 
  Clock, 
  User, 
  LogOut, 
  Bell, 
  ChevronDown,
  UtensilsCrossed,
  Menu as MenuIcon,
  Plus,
  Search,
  X,
  Receipt,
  Grid3X3,
  ReceiptText,
  Users,
  LayoutDashboard,
  ChefHat,
  FileText,
  Utensils,
  BarChart3,
  Settings
} from 'lucide-react';
import { NewOrderModal } from '../components/NewOrderModal';
import { ThemeToggle } from '../components/ThemeToggle';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
  variant?: 'management' | 'cashier' | 'waiter' | 'kds';
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu, variant = 'cashier' }) => {
  const { 
    currentUser, 
    currentBranch, 
    setBranch, 
    branches, 
    logout, 
    kots,
    bills,
    cart,
    cartPaidBill,
    resetCartOrder,
    activeTab,
    setActiveTab,
    tables,
    pendingBillRequests,
    openBillDetailsModal,
    showToast,
    restaurantSettings
  } = useApp();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [showBranchDropdown, setShowBranchDropdown] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showMoreDropdown, setShowMoreDropdown] = useState<boolean>(false);

  // Quick Action States
  const [billSearchQuery, setBillSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState<boolean>(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const moreDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close search and more popovers on outside click or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(e.target as Node)) {
        setShowMoreDropdown(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setShowMoreDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Filter bills instantly based on user input
  const matchingBills = useMemo(() => {
    const q = billSearchQuery.trim().toLowerCase();
    if (!q) return [];
    const cleanQ = q.replace(/^#/, '');

    return bills.filter(b => {
      const billNum = (b.billNumber || '').toLowerCase();
      const kotNum = (b.kotNumber || '').toLowerCase();
      const custName = (b.customerName || '').toLowerCase();
      const custMobile = (b.customerMobile || '').toLowerCase();
      const tblNum = (b.tableNumber || '').toLowerCase();

      return (
        billNum.includes(cleanQ) ||
        kotNum.includes(cleanQ) ||
        custName.includes(cleanQ) ||
        custMobile.includes(cleanQ) ||
        tblNum.includes(cleanQ)
      );
    }).slice(0, 6);
  }, [bills, billSearchQuery]);

  const handleSelectBill = (bill: Bill) => {
    openBillDetailsModal(bill);
    setBillSearchQuery('');
    setIsSearchOpen(false);
  };

  const handleNewOrderClick = () => {
    // If cashier has active unsent cart items, prompt confirmation modal
    const hasUnsentItems = cart.length > 0 && !cartPaidBill;
    if (hasUnsentItems) {
      setIsNewOrderModalOpen(true);
    } else {
      resetCartOrder();
      setActiveTab('pos');
      showToast('New Order Started', 'Ready for next order on Table 1', 'info');
    }
  };

  const pendingKotsCount = kots.filter(
    k => (currentBranch === 'all' || k.branchId === currentBranch) && (k.status === 'new' || k.status === 'preparing')
  ).length;

  const currentBranchLabel = currentBranch === 'all' 
    ? 'All Branches (Consolidated)' 
    : (branches || []).find(b => b.id === currentBranch)?.name || 'Main Branch';

  const occupiedTablesCount = useMemo(() => {
    return tables.filter(
      t => (currentBranch === 'all' || t.branchId === currentBranch) && (t.status === 'occupied' || t.status === 'billing' || t.status === 'ready')
    ).length;
  }, [tables, currentBranch]);

  const tablesBadge = pendingBillRequests.length > 0 
    ? pendingBillRequests.length 
    : (occupiedTablesCount > 0 ? occupiedTablesCount : undefined);

  const userRole = currentUser?.role || 'cashier';
  const canAccessBilling = userRole === 'owner' || userRole === 'manager' || userRole === 'cashier';
  const canTakeOrders = userRole === 'owner' || userRole === 'manager' || userRole === 'cashier' || userRole === 'waiter';

  const mainNavItems = userRole === 'kitchen' ? [
    {
      id: 'kitchen',
      label: 'Kitchen KDS',
      icon: ChefHat,
      badge: pendingKotsCount > 0 ? pendingKotsCount : undefined,
      allowedRoles: ['kitchen']
    },
    {
      id: 'kot',
      label: 'KOTs',
      icon: FileText,
      badge: pendingKotsCount > 0 ? pendingKotsCount : undefined,
      allowedRoles: ['kitchen']
    }
  ] : [
    {
      id: 'tables',
      label: 'Tables',
      icon: Grid3X3,
      badge: tablesBadge,
      allowedRoles: ['owner', 'manager', 'cashier', 'waiter']
    },
    {
      id: 'pos',
      label: 'POS',
      icon: ReceiptText,
      allowedRoles: ['owner', 'manager', 'cashier', 'waiter']
    },
    {
      id: 'bills',
      label: 'Bills History',
      icon: Receipt,
      allowedRoles: ['owner', 'manager', 'cashier']
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
      allowedRoles: ['owner', 'manager', 'cashier']
    }
  ];

  const secondaryNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, allowedRoles: ['owner', 'manager', 'waiter'] },
    { id: 'kot', label: 'KOTs', icon: FileText, allowedRoles: ['owner', 'manager', 'kitchen', 'waiter'], badge: pendingKotsCount > 0 ? pendingKotsCount : undefined },
    { id: 'kitchen', label: 'Kitchen KDS', icon: ChefHat, allowedRoles: ['owner', 'manager', 'kitchen', 'waiter'], badge: pendingKotsCount > 0 ? pendingKotsCount : undefined },
    { id: 'menu', label: 'Menu', icon: Utensils, allowedRoles: ['owner'] },
    { id: 'reports', label: 'Reports', icon: BarChart3, allowedRoles: ['owner', 'manager'] },
    { id: 'settings', label: 'Settings', icon: Settings, allowedRoles: ['owner'] }
  ];

  const visibleSecondaryItems = secondaryNavItems.filter(item => item.allowedRoles.includes(userRole));

  return (
    <header className="h-16 bg-white text-slate-900 px-4 lg:px-6 flex items-center justify-between border-b border-slate-200 z-30 select-none shadow-xs">
      {/* Brand & Branch Info */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Mobile menu toggle */}
        {onToggleMobileMenu && (
          <button 
            onClick={onToggleMobileMenu}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 md:hidden transition-colors"
            title="Toggle Menu"
          >
            <MenuIcon className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-xs font-bold">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight uppercase text-white leading-none">
              {restaurantSettings?.brandName || 'Bilaal Restaurant & Bar'}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] tracking-wider text-emerald-700 font-semibold">RESTAURANT POS</span>
            </div>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* Branch Selector (Interactive for Owner, fixed indicator for Branch staff) */}
        {currentUser?.role === 'owner' ? (
          <div className="relative">
            <button
              onClick={() => setShowBranchDropdown(prev => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              <span className="text-slate-800 font-semibold">{currentBranchLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showBranchDropdown && (
              <div 
                className="absolute left-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95"
                onMouseLeave={() => setShowBranchDropdown(false)}
              >
                <div className="px-3 py-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  Select Branch (Owner View)
                </div>
                <button
                  onClick={() => { setBranch('all'); setShowBranchDropdown(false); }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    currentBranch === 'all' ? 'text-teal-700 font-semibold bg-slate-50' : 'text-slate-700'
                  }`}
                >
                  <span>All Branches (Consolidated)</span>
                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200">Total</span>
                </button>
                {branches.map(b => (
                  <button
                    key={b.id}
                    onClick={() => { setBranch(b.id as BranchId); setShowBranchDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      currentBranch === b.id ? 'text-teal-700 font-semibold bg-slate-50' : 'text-slate-700'
                    }`}
                  >
                    <span>{b.name}</span>
                    <span className="text-[10px] text-slate-400">{b.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{currentBranchLabel}</span>
          </div>
        )}

        {/* Quick Actions: New Order & Bill No Search */}
        {canTakeOrders && (
          <>
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* New Order Quick Action */}
              <button
                id="header-new-order-btn"
                type="button"
                onClick={handleNewOrderClick}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 active:scale-98 text-white text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap"
                title="Start a completely fresh order (clears current draft)"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">New Order</span>
                <span className="sm:hidden">New</span>
              </button>

              {/* Bill No Quick Search (Restricted to Cashier/Manager/Owner) */}
              {canAccessBilling && (
                <div className="relative" ref={searchContainerRef}>
                <div className="relative flex items-center">
                  <Search className="absolute left-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    id="header-bill-search-input"
                    ref={searchInputRef}
                    type="text"
                    value={billSearchQuery}
                    onChange={e => {
                      setBillSearchQuery(e.target.value);
                      setIsSearchOpen(true);
                    }}
                    onFocus={() => setIsSearchOpen(true)}
                    onKeyDown={e => {
                      if (e.key === 'Escape') {
                        setIsSearchOpen(false);
                      }
                    }}
                    placeholder="Search Bill No..."
                    className="pl-8 pr-7 py-1.5 rounded-lg bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-teal-500 text-xs text-slate-900 placeholder-slate-400 w-28 sm:w-36 md:w-44 lg:w-48 transition-all focus:outline-hidden shadow-2xs"
                  />
                  {billSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setBillSearchQuery('');
                        searchInputRef.current?.focus();
                      }}
                      className="absolute right-2 p-0.5 text-slate-400 hover:text-white transition-colors"
                      title="Clear search"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Instant Dropdown Popover */}
                {isSearchOpen && billSearchQuery.trim().length > 0 && (
                  <div 
                    className="absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-72 sm:w-80 bg-white border border-slate-200 rounded-xl shadow-2xl p-2 z-50 text-xs font-mono animate-in fade-in zoom-in-95 text-slate-900"
                  >
                    <div className="px-2 py-1 flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5 mb-1.5">
                      <span>
                        {matchingBills.length > 0 ? `Matching Bills (${matchingBills.length})` : 'Search Result'}
                      </span>
                      <span className="text-[9px] text-slate-400">ESC to close</span>
                    </div>

                    {matchingBills.length > 0 ? (
                      <div className="space-y-1.5 max-h-64 overflow-y-auto divide-y divide-slate-800/60">
                        {matchingBills.map(bill => (
                          <button
                            key={bill.id}
                            type="button"
                            onClick={() => handleSelectBill(bill)}
                            className="w-full text-left p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 hover:border-emerald-500/60 transition-all cursor-pointer group pt-2 first:pt-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-white group-hover:text-emerald-400 flex items-center gap-1.5">
                                <span>{bill.billNumber}</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                                  PAID
                                </span>
                              </span>
                              <span className="font-extrabold text-emerald-400 font-mono">
                                ₹{bill.grandTotal.toFixed(2)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-300 mt-1">
                              <span className="text-slate-200 font-medium">
                                {bill.orderType === 'dine_in' && bill.tableNumber ? bill.tableNumber : bill.orderType.replace('_', ' ').toUpperCase()}
                              </span>
                              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                                {bill.paymentMethod}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 pt-1 border-t border-slate-800/60">
                              <span>{bill.date} • {bill.time}</span>
                              <span className="truncate max-w-[120px] text-slate-400">{bill.customerName || bill.branchName}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-slate-400 space-y-1">
                        <Receipt className="w-6 h-6 mx-auto text-slate-500 mb-1" />
                        <p className="font-semibold text-slate-300 text-xs">No bill found</p>
                        <p className="text-[10px] text-slate-500">
                          No bill matching "{billSearchQuery}"
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

        {/* Divider before navigation */}
        <div className="h-6 w-px bg-slate-800 hidden md:block shrink-0" />

        {/* VARIANT-BASED NAVIGATION */}
        {variant === 'management' ? (
          /* MANAGEMENT SHELL: The left sidebar handles all navigation. No duplicate nav pills in header! */
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs font-mono">
            <span className="text-emerald-400 font-bold uppercase tracking-wider">Management Console</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-200 font-semibold capitalize">{activeTab.replace('_', ' ')}</span>
          </div>
        ) : variant === 'kds' ? (
          /* KITCHEN KDS SHELL: Dedicated kitchen status & optional exit button */
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/50 text-amber-300 font-mono text-xs font-bold flex items-center gap-1.5">
              <ChefHat className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">KITCHEN DISPLAY MODE</span>
              <span className="sm:hidden">KDS</span>
            </div>
            {userRole !== 'kitchen' && (
              <button
                type="button"
                onClick={() => setActiveTab(userRole === 'waiter' ? 'tables' : 'pos')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 hover:text-white font-mono font-semibold transition-colors border border-slate-700 cursor-pointer"
                title="Exit KDS View"
              >
                <span>Exit KDS</span>
              </button>
            )}
          </div>
        ) : variant === 'waiter' ? (
          /* WAITER TABLET SHELL: Compact touch-friendly navigation for Tables, POS/Order, KOT, and Bill Requests */
          <nav className="flex items-center gap-1 sm:gap-1.5 shrink-0 font-sans">
            <button
              id="waiter-nav-tables"
              type="button"
              onClick={() => setActiveTab('tables')}
              style={activeTab === 'tables' ? {
                backgroundColor: '#F7EECA',
                borderColor: '#EADBBA',
                borderRadius: '9999px',
                height: '38px',
                padding: '6px 18px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: '#0f172a',
                fontWeight: 600,
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
              } : {
                borderRadius: '9999px',
                height: '38px',
                padding: '6px 18px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                border: '1px solid transparent',
                color: '#cbd5e1',
                fontWeight: 600,
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
              }}
              className={`text-xs md:text-sm whitespace-nowrap cursor-pointer transition-all ${
                activeTab === 'tables'
                  ? 'header-tab-tables-active header-tab-pill-active rounded-full bg-[#F7EECA] border border-[#EADBBA] text-[#0f172a] font-semibold shadow-xs'
                  : 'header-tab-pill-inactive rounded-full bg-transparent border border-transparent hover:bg-black/20 text-[#cbd5e1] font-semibold'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5 shrink-0" style={activeTab === 'tables' ? { color: '#0f172a', stroke: '#0f172a' } : undefined} />
              <span style={activeTab === 'tables' ? { color: '#0f172a', fontWeight: 600 } : { color: '#cbd5e1', fontWeight: 600 }}>Tables</span>
              {tablesBadge !== undefined && tablesBadge > 0 && (
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-mono font-semibold ${
                  activeTab === 'tables' ? 'bg-[#0f172a] text-[#ffffff]' : 'bg-amber-500 text-slate-950'
                }`}
                style={activeTab === 'tables' ? {
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '11px',
                  padding: '2px 7px',
                  borderRadius: '9999px'
                } : undefined}>
                  {tablesBadge}
                </span>
              )}
            </button>

            <button
              id="waiter-nav-pos"
              type="button"
              onClick={() => setActiveTab('pos')}
              style={activeTab === 'pos' ? {
                backgroundColor: '#F7EECA',
                borderColor: '#EADBBA',
                borderRadius: '9999px',
                height: '38px',
                padding: '6px 18px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: '#0f172a',
                fontWeight: 600,
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
              } : {
                borderRadius: '9999px',
                height: '38px',
                padding: '6px 18px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                border: '1px solid transparent',
                color: '#cbd5e1',
                fontWeight: 600,
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
              }}
              className={`text-xs md:text-sm whitespace-nowrap cursor-pointer transition-all ${
                activeTab === 'pos'
                  ? 'header-tab-pos-active header-tab-pill-active rounded-full bg-[#F7EECA] border border-[#EADBBA] text-[#0f172a] font-semibold shadow-xs'
                  : 'header-tab-pill-inactive rounded-full bg-transparent border border-transparent hover:bg-black/20 text-[#cbd5e1] font-semibold'
              }`}
            >
              <ReceiptText className="w-3.5 h-3.5 shrink-0" style={activeTab === 'pos' ? { color: '#0f172a', stroke: '#0f172a' } : undefined} />
              <span style={activeTab === 'pos' ? { color: '#0f172a', fontWeight: 600 } : { color: '#cbd5e1', fontWeight: 600 }}>POS / Order</span>
            </button>

            <button
              id="waiter-nav-kot"
              type="button"
              onClick={() => setActiveTab('kot')}
              style={activeTab === 'kot' ? {
                backgroundColor: '#F7EECA',
                borderColor: '#EADBBA',
                borderRadius: '9999px',
                height: '38px',
                padding: '6px 18px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: '#0f172a',
                fontWeight: 600,
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
              } : {
                borderRadius: '9999px',
                height: '38px',
                padding: '6px 18px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                border: '1px solid transparent',
                color: '#cbd5e1',
                fontWeight: 600,
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
              }}
              className={`text-xs md:text-sm whitespace-nowrap cursor-pointer transition-all ${
                activeTab === 'kot'
                  ? 'header-tab-kots-active header-tab-pill-active rounded-full bg-[#F7EECA] border border-[#EADBBA] text-[#0f172a] font-semibold shadow-xs'
                  : 'header-tab-pill-inactive rounded-full bg-transparent border border-transparent hover:bg-black/20 text-[#cbd5e1] font-semibold'
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" style={activeTab === 'kot' ? { color: '#0f172a', stroke: '#0f172a' } : undefined} />
              <span style={activeTab === 'kot' ? { color: '#0f172a', fontWeight: 600 } : { color: '#cbd5e1', fontWeight: 600 }}>Live KOT</span>
              {pendingKotsCount > 0 && (
                <span className={`min-w-4 h-4 px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center font-mono ml-0.5 ${
                  activeTab === 'kot' ? 'bg-[#0f172a] text-[#ffffff]' : 'bg-amber-500 text-slate-950'
                }`}
                style={activeTab === 'kot' ? {
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '11px',
                  padding: '2px 7px',
                  borderRadius: '9999px'
                } : undefined}>
                  {pendingKotsCount}
                </span>
              )}
            </button>

            {pendingBillRequests.length > 0 && (
              <button
                id="waiter-nav-bill-requests"
                type="button"
                onClick={() => setActiveTab('tables')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all cursor-pointer whitespace-nowrap"
                title="Tables requesting bill"
              >
                <Receipt className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span>Bill Requests</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-amber-500 text-slate-950 animate-pulse">
                  {pendingBillRequests.length}
                </span>
              </button>
            )}
          </nav>
        ) : (
          /* CASHIER POS SHELL: Compact top navigation for operational screens with NO sidebar */
          <nav className="flex items-center gap-1 sm:gap-1.5 shrink-0 font-mono">
            {/* If Owner / Manager is operating POS / Tables, provide direct Dashboard link */}
            {(userRole === 'owner' || userRole === 'manager') && (
              <button
                id="header-nav-dashboard"
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer whitespace-nowrap"
                title="Return to Management Dashboard"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            )}

            {mainNavItems.filter(item => item.allowedRoles.includes(userRole)).map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`header-nav-${item.id}`}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title={`Open ${item.label}`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isActive ? 'bg-emerald-950 text-emerald-200 border border-emerald-800' : 'bg-amber-500 text-slate-950'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* More modules dropdown for Owner / Manager / Kitchen */}
            {visibleSecondaryItems.length > 0 && (
              <div className="relative shrink-0" ref={moreDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowMoreDropdown(prev => !prev)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    visibleSecondaryItems.some(it => it.id === activeTab)
                      ? 'bg-teal-600 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Additional Management Modules"
                >
                  <span>More</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {showMoreDropdown && (
                  <div 
                    className="absolute left-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-2xl p-1.5 z-50 text-xs font-mono animate-in fade-in zoom-in-95 text-slate-900"
                    onMouseLeave={() => setShowMoreDropdown(false)}
                  >
                    <div className="px-2.5 py-1 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1 font-bold">
                      Other Modules
                    </div>
                    {visibleSecondaryItems.map(it => {
                      const SecIcon = it.icon;
                      const isSecActive = activeTab === it.id;
                      return (
                        <button
                          key={it.id}
                          type="button"
                          onClick={() => {
                            setActiveTab(it.id);
                            setShowMoreDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors text-left ${
                            isSecActive
                              ? 'bg-teal-600 text-white font-bold'
                              : 'text-slate-700 hover:text-slate-950 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <SecIcon className="w-3.5 h-3.5" />
                            <span>{it.label}</span>
                          </div>
                          {it.badge !== undefined && it.badge > 0 && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500 text-white font-bold">
                              {it.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </nav>
        )}
      </div>

      {/* Center Live Date/Time Clock */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600">
        <Clock className="w-3.5 h-3.5 text-teal-600" />
        <span>{currentDate}</span>
        <span className="text-slate-300">•</span>
        <span className="font-semibold text-slate-900 tracking-wider">{currentTime}</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Global Light / Dark Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <div className="relative">
          <button
            id="global-header-notification-bell"
            onClick={() => setShowNotifications(prev => !prev)}
            style={{
              backgroundColor: '#F7EECA',
              borderColor: '#EADBBA',
              color: '#0f172a',
            }}
            className="notification-bell-butter-cream p-2 rounded-lg border transition-colors relative hover:bg-[#efe5c0] cursor-pointer"
            title="Kitchen Orders Notifications"
          >
            <Bell className="w-4 h-4" style={{ color: '#0f172a', stroke: '#0f172a' }} />
            {pendingKotsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center font-mono animate-pulse">
                {pendingKotsCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div 
              className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl p-3 z-50 text-xs text-slate-900"
              onMouseLeave={() => setShowNotifications(false)}
            >
              <div className="font-semibold text-slate-900 pb-2 border-b border-slate-100 flex justify-between items-center">
                <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500">Kitchen Activity</span>
                <span className="text-[10px] text-teal-700 font-mono font-semibold">{pendingKotsCount} active KOTs</span>
              </div>
              <div className="py-2 space-y-2 max-h-56 overflow-y-auto divide-y divide-slate-100">
                {kots.slice(0, 4).map(k => (
                  <div key={k.id} className="pt-2 first:pt-0 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-slate-900 font-mono text-[11px]">{k.kotNumber} • {k.tableNumber || 'Takeaway'}</div>
                      <div className="text-[10px] text-slate-400">{k.branchName} • {k.timeFormatted}</div>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold uppercase ${
                      k.status === 'ready' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {k.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Current User Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 font-bold text-xs font-mono">
            {currentUser?.name ? currentUser.name.charAt(0) : <User className="w-4 h-4" />}
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-slate-800 leading-tight">
              {currentUser?.name ? currentUser.name.split(' ')[0] : 'User'}
            </div>
            <div className="text-[10px] text-teal-700 font-mono font-semibold uppercase tracking-wider">
              {currentUser?.role}
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          title="Sign Out"
          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* New Order Confirmation Modal */}
      <NewOrderModal 
        isOpen={isNewOrderModalOpen} 
        onClose={() => setIsNewOrderModalOpen(false)} 
      />
    </header>
  );
};
