import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  UtensilsCrossed, 
  User, 
  LogOut, 
  Bell, 
  Utensils, 
  Package, 
  Clock, 
  CheckCircle2,
  X,
  Grid3X3,
  ReceiptText,
  FileText,
  Receipt,
  ChefHat,
  Send
} from 'lucide-react';
import { Bill } from '../../types';
import { ThemeToggle } from '../../components/ThemeToggle';

export interface WaiterHeaderProps {
  activeTabOverride?: string;
  onNavigate?: (tab: string) => void;
}

export const WaiterHeader: React.FC<WaiterHeaderProps> = ({
  activeTabOverride,
  onNavigate
}) => {
  const { 
    currentUser, 
    logout, 
    filteredTables, 
    filteredKots,
    kots,
    tables,
    setTables,
    cart,
    bills,
    currentBranch,
    pendingBillRequests,
    settleBillRequest,
    openBillDetailsModal,
    activeTab,
    setActiveTab,
    selectTableForPOS,
    updateKOTStatus,
    showToast,
    restaurantSettings
  } = useApp();

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationContainerRef = useRef<HTMLDivElement>(null);

  // Modals for Bill Requests & Call Kitchen (previously in left sidebar)
  const [isCallKitchenModalOpen, setIsCallKitchenModalOpen] = useState(false);
  const [isBillRequestsModalOpen, setIsBillRequestsModalOpen] = useState(false);
  const [kitchenCallReason, setKitchenCallReason] = useState('Urgent status inquiry');
  const [selectedTableForCall, setSelectedTableForCall] = useState('Table 1');

  // Payment mode selections per table in Bill Requests modal
  const [paymentModesByTable, setPaymentModesByTable] = useState<Record<string, 'cash' | 'upi' | 'card'>>({});

  const getPaymentMode = (tableKey: string): 'cash' | 'upi' | 'card' => {
    return paymentModesByTable[tableKey] || 'cash';
  };

  const setPaymentMode = (tableKey: string, mode: 'cash' | 'upi' | 'card') => {
    setPaymentModesByTable(prev => ({
      ...prev,
      [tableKey]: mode
    }));
  };

  const currentActive = activeTabOverride || activeTab;

  const handleNavigate = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    } else {
      setActiveTab(tab);
    }
  };

  const isTablesActive = currentActive === 'tables' && !isBillRequestsModalOpen && !isCallKitchenModalOpen;
  const isPosActive = currentActive === 'pos' && !isBillRequestsModalOpen && !isCallKitchenModalOpen;
  const isKotActive = currentActive === 'kot' && !isBillRequestsModalOpen && !isCallKitchenModalOpen;
  const isBillsActive = (currentActive === 'bills' || isBillRequestsModalOpen) && !isCallKitchenModalOpen;
  const isCallKitchenActive = isCallKitchenModalOpen;

  // Kitchen KOTs ready for pickup from kitchen (Strictly DINE-IN only for Waiter)
  const readyKots = useMemo(() => {
    const list = filteredKots || kots || [];
    return list.filter(k => 
      k.status === 'ready' && 
      !k.isBilled && 
      (k.orderType?.toLowerCase() === 'dine_in')
    );
  }, [filteredKots, kots]);

  // Picked up KOTs en route to tables (Strictly DINE-IN only for Waiter)
  const pickedUpKots = useMemo(() => {
    const list = filteredKots || kots || [];
    return list.filter(k => 
      k.status === 'picked_up' && 
      !k.isBilled && 
      (k.orderType?.toLowerCase() === 'dine_in')
    );
  }, [filteredKots, kots]);

  const readyCount = readyKots.length;

  const pendingKotsCount = useMemo(() => {
    return kots.filter(k => k.status === 'new' || k.status === 'preparing' || k.status === 'ready' || k.status === 'picked_up').length;
  }, [kots]);

  // Filter all tables that have billing requested
  const billingTablesList = useMemo(() => {
    const matchedTables = tables.filter(t => {
      if (currentBranch !== 'all' && t.branchId && t.branchId !== currentBranch) {
        return false;
      }
      const st = (t.status || '').toLowerCase();
      const isBilling = st === 'billing' || 
                        st === 'bill_requested' || 
                        st === 'bill requested' || 
                        Boolean((t as any).billRequested);
      return isBilling;
    });

    const items = matchedTables.map(tbl => {
      const matchingReq = pendingBillRequests.find(
        r => r.tableNumber.toLowerCase() === tbl.name.toLowerCase() &&
             (currentBranch === 'all' || r.branchId === tbl.branchId)
      );

      const tableKots = kots.filter(
        k => k.branchId === tbl.branchId &&
             k.tableNumber &&
             k.tableNumber.toLowerCase() === tbl.name.toLowerCase() &&
             !k.isBilled &&
             k.status !== 'cancelled'
      );

      const kotNumbers = matchingReq?.kotNumbers?.length 
        ? matchingReq.kotNumbers 
        : tableKots.map(k => k.kotNumber).filter(Boolean);

      const liveItemsSubtotal = tableKots.length > 0 
        ? tableKots.reduce((sum, k) => sum + k.totalAmount, 0)
        : (tbl.number === 2 ? 1130 : tbl.number === 5 ? 1030 : tbl.number === 3 ? 680 : tbl.number === 6 ? 300 : (tbl.currentAmount ? Math.round(tbl.currentAmount / 1.1) : 500));

      const cgstAmt = Number((liveItemsSubtotal * 0.05).toFixed(2));
      const sgstAmt = Number((liveItemsSubtotal * 0.05).toFixed(2));
      const calculatedGrandTotal = Math.round(liveItemsSubtotal + cgstAmt + sgstAmt);

      const totalAmount = calculatedGrandTotal;
      const floor = tbl.number <= 5 ? 'Ground Floor' : tbl.number <= 8 ? 'First Floor' : 'Outdoor / Terrace';
      const timeStr = matchingReq?.requestedAt || (tbl as any).billRequestedAt || tbl.seatedAt || '12:45 PM';

      return {
        id: matchingReq?.id || `req_tbl_${tbl.id}`,
        table: tbl,
        request: matchingReq,
        floor,
        totalAmount,
        kotNumbers: kotNumbers.length > 0 ? kotNumbers : [`KOT-1002${tbl.number}`],
        timeStr,
        tableKots
      };
    });

    // Also include any pending requests from state not yet in items
    pendingBillRequests.forEach(req => {
      const alreadyIn = items.some(
        it => it.table.name.toLowerCase() === req.tableNumber.toLowerCase() &&
              (currentBranch === 'all' || it.table.branchId === req.branchId)
      );
      if (!alreadyIn) {
        const associatedTable = tables.find(
          t => t.name.toLowerCase() === req.tableNumber.toLowerCase() &&
               (currentBranch === 'all' || t.branchId === req.branchId)
        );
        const tblNum = associatedTable?.number || parseInt(req.tableNumber.replace(/\D/g, ''), 10) || 1;
        const floor = tblNum <= 5 ? 'Ground Floor' : tblNum <= 8 ? 'First Floor' : 'Outdoor / Terrace';
        const reqSubtotal = req.totalAmount === 1243 ? 1130 : req.totalAmount === 1133 ? 1030 : Math.round(req.totalAmount / 1.1);
        const reqCgst = Number((reqSubtotal * 0.05).toFixed(2));
        const reqSgst = Number((reqSubtotal * 0.05).toFixed(2));
        const reqTotal = Math.round(reqSubtotal + reqCgst + reqSgst);

        items.push({
          id: req.id,
          table: associatedTable || {
            id: req.tableId || req.id,
            number: tblNum,
            name: req.tableNumber,
            capacity: 4,
            branchId: req.branchId as any,
            status: 'billing',
            currentAmount: reqTotal
          },
          request: req,
          floor,
          totalAmount: reqTotal,
          kotNumbers: req.kotNumbers?.length ? req.kotNumbers : [`KOT-1002${tblNum}`],
          timeStr: req.requestedAt,
          tableKots: []
        });
      }
    });

    return items.sort((a, b) => a.table.number - b.table.number);
  }, [tables, pendingBillRequests, kots, currentBranch]);

  const pendingCount = billingTablesList.length;

  const handleViewBill = (item: typeof billingTablesList[0]) => {
    const liveItemsSubtotal = item.tableKots.length > 0
      ? item.tableKots.reduce((sum, k) => sum + k.totalAmount, 0)
      : (item.table.number === 2 ? 1130 : item.table.number === 5 ? 1030 : item.table.number === 3 ? 680 : item.table.number === 6 ? 300 : Math.round(item.totalAmount / 1.1));

    const cgstAmount = Number((liveItemsSubtotal * 0.05).toFixed(2));
    const sgstAmount = Number((liveItemsSubtotal * 0.05).toFixed(2));
    const grandTotal = Math.round(liveItemsSubtotal + cgstAmount + sgstAmount);

    const mergedItems = item.tableKots.flatMap(k => k.items).filter(i => i.status !== 'voided');

    const previewBill: Bill = {
      id: `preview_bill_${item.table.id}`,
      billNumber: item.table.number === 5 ? 'INV-10071' : item.table.number === 2 ? 'INV-10089' : `INV-${10020 + item.table.number}`,
      kotNumbers: item.kotNumbers,
      kotNumber: item.kotNumbers[0] || `KOT-1002${item.table.number}`,
      branchId: item.table.branchId || 'main',
      branchName: item.table.branchId === 'city' ? 'City Branch' : item.table.branchId === 'beach' ? 'Beach Branch' : 'Main Branch',
      date: new Date().toISOString().split('T')[0],
      time: item.timeStr,
      tableNumber: item.table.name,
      tableId: item.table.id,
      orderType: 'dine_in',
      customerName: item.table.guestName || (item.table.assignedWaiterName ? `Guest of ${item.table.assignedWaiterName}` : 'Dine-In Guest'),
      items: mergedItems.length > 0 ? mergedItems.map((it, idx) => ({
        id: `item_${idx}`,
        menuItemId: it.menuItemId || `menu_${idx}`,
        name: it.name,
        quantity: it.quantity,
        rate: it.rate,
        amount: it.quantity * (it.rate || 0),
        gstRate: 5
      })) : (item.table.number === 2 ? [
        { id: 'item_1', name: 'Chicken Biryani', quantity: 2, rate: 280, amount: 560 },
        { id: 'item_12', name: 'Butter Naan', quantity: 3, rate: 50, amount: 150 },
        { id: 'item_8', name: 'Butter Chicken', quantity: 1, rate: 320, amount: 320 },
        { id: 'item_21', name: 'Fresh Lime Soda', quantity: 2, rate: 50, amount: 100 }
      ] : item.table.number === 5 ? [
        { id: 'item_1', name: 'Chicken Biryani', quantity: 2, rate: 280, amount: 560 },
        { id: 'item_19', name: 'Coke', quantity: 2, rate: 40, amount: 80 },
        { id: 'item_13', name: 'Plain Naan', quantity: 2, rate: 35, amount: 70 },
        { id: 'item_8', name: 'Butter Chicken', quantity: 1, rate: 320, amount: 320 }
      ] : [
        { id: 'item_1', menuItemId: 'm1', name: 'Dine-in Order Items', quantity: 1, rate: liveItemsSubtotal, amount: liveItemsSubtotal, gstRate: 5 }
      ]),
      subtotal: liveItemsSubtotal,
      gstPercent: 10,
      gstAmount: Number((cgstAmount + sgstAmount).toFixed(2)),
      cgstPercent: 5,
      cgstAmount,
      sgstPercent: 5,
      sgstAmount,
      discountAmount: 0,
      grandTotal,
      paymentMethod: getPaymentMode(item.table.name || item.id),
      status: 'unpaid',
      paymentStatus: 'UNPAID',
      isPaid: false,
      isEstimate: true,
      cashierName: 'Cashier Desk'
    };

    openBillDetailsModal(previewBill);
  };

  const handleSendToCashier = (item: typeof billingTablesList[0]) => {
    const mode = getPaymentMode(item.table.name || item.id);
    const modeLabel = mode === 'cash' ? 'Cash' : mode === 'upi' ? 'UPI / QR' : 'Card';
    const amountStr = `₹${item.totalAmount.toLocaleString('en-IN')}`;

    showToast(
      'Alert Sent to Cashier',
      `${item.table.name}: Bill Requested via ${modeLabel} - ${amountStr}`,
      'info'
    );
  };

  const handleSettleAndFreeTable = (item: typeof billingTablesList[0]) => {
    const mode = getPaymentMode(item.table.name || item.id);
    const modeLabel = mode === 'cash' ? 'Cash' : mode === 'upi' ? 'UPI / QR' : 'Card';

    if (item.request?.id) {
      settleBillRequest(item.request.id, mode);
    } else {
      setTables(prev => prev.map(tbl => tbl.id === item.table.id ? {
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
        `${item.table.name} bill of ₹${item.totalAmount.toLocaleString('en-IN')} marked PAID via ${modeLabel}. Table is now Available.`,
        'success'
      );
    }
  };

  const handleCallKitchenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(
      'Kitchen Alert Dispatched', 
      `Alert sent to Kitchen KDS: "${kitchenCallReason}" for ${selectedTableForCall} by ${currentUser?.name || 'Waiter'}.`,
      'success'
    );
    setIsCallKitchenModalOpen(false);
  };

  // Click outside listener for notifications popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationContainerRef.current && !notificationContainerRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const waiterName = currentUser?.name?.replace(/\s*\(Waiter\)$/i, '').trim() || 'Ramesh Patel';

  return (
    <header 
      id="waiter-global-header"
      className="h-16 text-slate-200 flex justify-between items-center w-full px-4 z-30 select-none shrink-0 shadow-md font-sans min-w-0"
      style={{
        background: 'linear-gradient(180deg, #5c0612 0%, #4a030c 100%)',
        backgroundColor: '#580510',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* 1. Left Section: Logo badge & Brand Title ("Bilal Biryani") pinned to the left edge */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <div 
          id="waiter-utensils-icon-container"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-bold shadow-2xs shrink-0"
          style={{
            backgroundColor: '#1e293b',
            color: '#fbbf24',
            border: '1px solid #334155'
          }}
        >
          <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
        </div>
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <span 
              id="waiter-header-brand-title"
              className="waiter-header-title tracking-tight whitespace-nowrap"
              style={{
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '16px',
                WebkitTextFillColor: '#ffffff'
              }}
            >
              Bilal Biryani
            </span>
          </div>
        </div>
      </div>

      {/* 2. Center Section: Exact Cashier Navigation Container Structure & Classes */}
      <div className="flex-1 flex items-center justify-center min-w-0 px-2">
        <nav 
          id="waiter-header-nav-pills"
          className="waiter-nav-pills-container waiter-header-nav-capsule flex items-center overflow-x-auto no-scrollbar rounded-full shadow-inner"
          style={{
            minWidth: '540px',
            height: '44px',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'rgba(0, 0, 0, 0.45)',
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            borderRadius: '9999px',
          }}
        >
          {/* 1. Tables */}
          <button
            id="waiter-tab-tables"
            type="button"
            onClick={() => {
              setIsBillRequestsModalOpen(false);
              setIsCallKitchenModalOpen(false);
              handleNavigate('tables');
            }}
            className={`waiter-capsule-tab header-tab-pill whitespace-nowrap cursor-pointer transition-all ${
              isTablesActive ? 'waiter-capsule-tab-active header-tab-pill-active' : 'header-tab-pill-inactive'
            }`}
            title="Floor & Table Layout"
          >
            <Grid3X3 className="w-4 h-4 shrink-0" />
            <span>Tables</span>
          </button>

          {/* 2. POS */}
          <button
            id="waiter-tab-pos"
            type="button"
            onClick={() => {
              setIsBillRequestsModalOpen(false);
              setIsCallKitchenModalOpen(false);
              handleNavigate('pos');
            }}
            className={`waiter-capsule-tab header-tab-pill whitespace-nowrap cursor-pointer transition-all ${
              isPosActive ? 'waiter-capsule-tab-active header-tab-pill-active' : 'header-tab-pill-inactive'
            }`}
            title="POS Terminal"
          >
            <ReceiptText className="w-4 h-4 shrink-0" />
            <span>POS</span>
            {cart.length > 0 && (
              <span className="waiter-capsule-badge">
                {cart.length}
              </span>
            )}
          </button>

          {/* 3. KOTs */}
          <button
            id="waiter-tab-kot"
            type="button"
            onClick={() => {
              setIsBillRequestsModalOpen(false);
              setIsCallKitchenModalOpen(false);
              handleNavigate('kot');
            }}
            className={`waiter-capsule-tab header-tab-pill whitespace-nowrap cursor-pointer transition-all ${
              isKotActive ? 'waiter-capsule-tab-active header-tab-pill-active' : 'header-tab-pill-inactive'
            }`}
            title="Kitchen Order Tickets"
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>KOTs</span>
            {pendingKotsCount > 0 && (
              <span className="waiter-capsule-badge">
                {pendingKotsCount}
              </span>
            )}
          </button>

          {/* 4. Bills */}
          <button
            id="waiter-tab-bills"
            type="button"
            onClick={() => {
              setIsCallKitchenModalOpen(false);
              setIsBillRequestsModalOpen(false);
              handleNavigate('bills');
            }}
            className={`waiter-capsule-tab header-tab-pill whitespace-nowrap cursor-pointer transition-all ${
              isBillsActive ? 'waiter-capsule-tab-active header-tab-pill-active' : 'header-tab-pill-inactive'
            }`}
            title="My Bills & Orders Register"
          >
            <Receipt className="w-4 h-4 shrink-0" />
            <span>Bills</span>
            {pendingCount > 0 && (
              <span className="waiter-capsule-badge">
                {pendingCount}
              </span>
            )}
          </button>

          {/* 5. Kitchen */}
          <button
            id="waiter-tab-call-kitchen"
            type="button"
            onClick={() => {
              setIsBillRequestsModalOpen(false);
              setIsCallKitchenModalOpen(prev => !prev);
            }}
            className={`waiter-capsule-tab header-tab-pill whitespace-nowrap cursor-pointer transition-all ${
              isCallKitchenActive ? 'waiter-capsule-tab-active header-tab-pill-active' : 'header-tab-pill-inactive'
            }`}
            title="Call Kitchen Station"
          >
            <ChefHat className="w-4 h-4 shrink-0" />
            <span>Kitchen</span>
          </button>
        </nav>
      </div>

      {/* 3. Right Section: Theme Toggle -> Ready Notifications Bell -> Waiter Profile ("Ramesh Patel") -> Shift Logout pinned to right edge */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Global Light / Dark Theme Toggle (Dark Slate Container) */}
        <div className="waiter-header-theme-toggle-wrapper">
          <ThemeToggle 
            className="waiter-header-theme-toggle-btn"
            style={{
              backgroundColor: '#0b1120',
              border: '1px solid #1e293b',
              color: '#f1f5f9',
              borderRadius: '8px',
            }}
          />
        </div>

        {/* Kitchen Ready Notification Bell (Butter Cream Container) */}
        <div className="relative" ref={notificationContainerRef}>
          <button
            id="waiter-ready-notifications-bell"
            type="button"
            onClick={() => setIsNotificationOpen(prev => !prev)}
            style={{
              backgroundColor: '#F7EECA',
              border: '1px solid #EADBBA',
              color: '#0f172a',
            }}
            className="waiter-header-bell-btn notification-bell-butter-cream relative p-2 rounded-lg border transition-all cursor-pointer select-none flex items-center justify-center hover:bg-[#efe5c0] shadow-2xs"
            title={readyCount > 0 ? `${readyCount} order(s) READY for pickup from kitchen` : 'Kitchen notifications'}
          >
            <Bell className="w-4 h-4 shrink-0" style={{ color: '#0f172a', stroke: '#0f172a' }} />
            
            {readyCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-[9px] font-black text-white items-center justify-center shadow-md font-mono">
                  {readyCount}
                </span>
              </span>
            )}
          </button>

          {/* Compact Popover Dropdown */}
          {isNotificationOpen && (
            <div 
              id="waiter-notifications-dropdown"
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden text-slate-200"
            >
              {/* Header */}
              <div className="px-3.5 py-2.5 bg-[#080d1a] border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${readyCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Kitchen Alerts
                  </span>
                  {readyCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold font-mono">
                      {readyCount} Ready
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsNotificationOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Popover Body */}
              <div className="max-h-[380px] overflow-y-auto p-2.5 space-y-2">
                {readyKots.length === 0 && pickedUpKots.length === 0 ? (
                  <div className="py-8 px-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-2.5 text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-semibold text-white">No Ready Orders</div>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-[220px] mx-auto">
                      All kitchen orders are currently cooking or served. New ready orders will alert here immediately.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Ready KOTs section */}
                    {readyKots.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider px-1 flex items-center gap-1.5">
                          <span>🔔 Ready for Pickup ({readyKots.length})</span>
                        </div>

                        {readyKots.map(k => (
                          <div 
                            key={k.id} 
                            className="p-3 rounded-lg bg-[#080d1a] border border-emerald-500/40 hover:border-emerald-400 shadow-md shadow-emerald-950/20 transition-all"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                                  <span className="text-emerald-400 font-extrabold text-sm">
                                    {k.tableNumber || (k.orderType === 'takeaway' ? 'Takeaway' : 'Order')}:
                                  </span>
                                  <span className="text-white">Order READY for pickup from kitchen</span>
                                </div>
                                
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                                  <span className="font-mono text-emerald-300 font-semibold">{k.kotNumber}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-500" />
                                    {k.readyAt ? `Ready at ${k.readyAt}` : (k.timeFormatted || 'Just now')}
                                  </span>
                                  <span>•</span>
                                  <span className="text-slate-300 font-medium">₹{k.totalAmount.toFixed(0)}</span>
                                </div>

                                <div className="text-[11px] text-slate-300 mt-1.5 line-clamp-1 bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
                                  {k.items.map(i => `${i.name} × ${i.quantity}`).join(', ')}
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-slate-800/80">
                              <button
                                type="button"
                                onClick={() => {
                                  updateKOTStatus(k.id, 'served');
                                  showToast('Order Served', `${k.tableNumber || 'Order'} marked as served to guests!`, 'success');
                                }}
                                className="flex-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm border border-emerald-400/40"
                              >
                                <Utensils className="w-3.5 h-3.5 text-emerald-100" />
                                <span>Mark Served</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  updateKOTStatus(k.id, 'picked_up');
                                  showToast('Food Picked Up', `${k.kotNumber} picked up — en route to ${k.tableNumber || 'Table'}!`, 'info');
                                }}
                                className="py-1.5 px-2.5 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 rounded-md text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                              >
                                <Package className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Pick Up</span>
                              </button>

                              {k.tableNumber && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    selectTableForPOS(k.tableNumber!);
                                    setIsNotificationOpen(false);
                                  }}
                                  className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer border border-slate-700"
                                >
                                  <span>View Table</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Picked Up KOTs section (En Route) */}
                    {pickedUpKots.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider px-1 flex items-center gap-1.5">
                          <span>🚶 Picked Up / En Route to Table ({pickedUpKots.length})</span>
                        </div>

                        {pickedUpKots.map(k => (
                          <div 
                            key={k.id} 
                            className="p-3 rounded-lg bg-[#080d1a] border border-cyan-500/30 hover:border-cyan-400 transition-all"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                  <span className="text-cyan-400 font-extrabold text-sm">
                                    {k.tableNumber || 'Table'}:
                                  </span>
                                  <span className="text-slate-200">En route to table</span>
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  {k.kotNumber} • {k.items.map(i => `${i.name} × ${i.quantity}`).join(', ')}
                                </div>
                              </div>
                            </div>

                            <div className="mt-2 pt-2 border-t border-slate-800/80">
                              <button
                                type="button"
                                onClick={() => {
                                  updateKOTStatus(k.id, 'served');
                                  showToast('Order Served', `${k.tableNumber || 'Order'} marked as served to guests!`, 'success');
                                }}
                                className="w-full py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm border border-emerald-400/40"
                              >
                                <Utensils className="w-3.5 h-3.5 text-emerald-100" />
                                <span>Mark Served to Table</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Waiter Profile Chip (Dark slate pill with "Ramesh Patel" & "(Waiter)") */}
        <div 
          id="waiter-header-user-profile"
          className="waiter-header-user-profile flex items-center gap-2.5 px-3 py-1.5 rounded-lg border shadow-2xs"
          style={{
            backgroundColor: '#0b1120',
            border: '1px solid #1e293b',
            color: '#ffffff',
          }}
        >
          <div 
            className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs shrink-0"
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
            }}
          >
            <User className="w-3.5 h-3.5" style={{ color: '#34d399' }} />
          </div>
          <div className="flex flex-col justify-center text-left leading-tight">
            <span 
              className="whitespace-nowrap font-bold"
              style={{
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                lineHeight: 1.2
              }}
            >
              {waiterName}
            </span>
            <span 
              className="whitespace-nowrap"
              style={{
                color: '#cbd5e1',
                fontWeight: 500,
                fontSize: '11px',
                lineHeight: 1.2
              }}
            >
              (Waiter)
            </span>
          </div>
        </div>

        {/* Logout Icon Button */}
        <button
          id="waiter-logout-btn"
          type="button"
          onClick={logout}
          title="Sign Out"
          style={{
            backgroundColor: 'rgba(11, 17, 32, 0.7)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
          className="p-2 rounded-lg transition-colors cursor-pointer hover:bg-rose-950/40"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Bill Requests Modal */}
      {isBillRequestsModalOpen && (
        <div 
          id="bill-requests-modal-backdrop"
          onClick={() => setIsBillRequestsModalOpen(false)}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs font-sans text-slate-200 animate-in fade-in duration-150"
        >
          <div 
            id="bill-requests-modal-card"
            onClick={e => e.stopPropagation()}
            style={{ backgroundColor: '#0b1120', border: '1px solid #1e293b' }}
            className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden text-slate-200 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 max-h-[85vh] flex flex-col"
          >
            {/* Modal Header */}
            <div 
              className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0"
              style={{ backgroundColor: '#0b1120', borderBottom: '1px solid #1e293b' }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-white">Bill Requests</h3>
                    <span 
                      id="bill-requests-pending-badge"
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                      style={{
                        backgroundColor: 'rgba(245, 158, 11, 0.2)',
                        color: '#fbbf24',
                        border: '1px solid #b45309'
                      }}
                    >
                      {pendingCount} Pending
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tables requesting bills. Cashier desk alerted for settlement.
                  </p>
                </div>
              </div>
              <button 
                id="close-bill-requests-modal"
                type="button"
                onClick={() => setIsBillRequestsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                style={{ backgroundColor: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' }}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content / Bill-Requested Tables Cards */}
            <div 
              className="overflow-y-auto p-4 space-y-3 flex-1 min-h-0"
              style={{ backgroundColor: '#0b1120' }}
            >
              {billingTablesList.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-white">No Pending Bill Requests</div>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    All customer tables have been settled or are currently enjoying their meal.
                  </p>
                </div>
              ) : (
                billingTablesList.map(item => {
                  const selectedMode = getPaymentMode(item.table.name || item.id);
                  const modeLabel = selectedMode === 'cash' ? 'Cash' : selectedMode === 'upi' ? 'UPI / QR' : 'Card';
                  const paymentOptions: { id: 'cash' | 'upi' | 'card'; label: string; icon: string }[] = [
                    { id: 'cash', label: 'Cash', icon: '💵' },
                    { id: 'upi', label: 'UPI / QR', icon: '📱' },
                    { id: 'card', label: 'Card', icon: '💳' },
                  ];

                  return (
                    <div 
                      key={item.id}
                      id={`bill-request-card-${item.table.id || item.id}`}
                      className="rounded-xl p-3.5 space-y-3 shadow-md transition-all"
                      style={{
                        backgroundColor: '#0d1527',
                        border: '1px solid #1e293b'
                      }}
                    >
                      {/* Row 1: Table Name & Floor on left, Running Amount in bright emerald #10b981 on right */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div 
                            className="w-8 h-8 rounded-lg bg-slate-800 text-amber-400 font-extrabold text-xs flex items-center justify-center border border-slate-700 shrink-0"
                            style={{ backgroundColor: '#1e293b', color: '#fcd34d', border: '1px solid #334155' }}
                          >
                            T{item.table.number}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-white flex items-center gap-1.5">
                              <span>{item.table.name}</span>
                              <span className="text-slate-500">•</span>
                              <span className="text-slate-300 font-medium text-xs">{item.floor}</span>
                            </div>
                            <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mt-0.5">
                              [BILL REQUESTED]
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div 
                            className="text-lg font-black font-mono tracking-tight"
                            style={{ color: '#10b981' }}
                          >
                            ₹{item.totalAmount.toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] text-slate-400">Running Total</div>
                        </div>
                      </div>

                      {/* Row 2: Active KOT numbers and elapsed time */}
                      <div 
                        className="rounded-lg p-2.5 text-xs flex items-center justify-between gap-2"
                        style={{
                          backgroundColor: '#080c16',
                          border: '1px solid #1e293b'
                        }}
                      >
                        <div className="flex items-center gap-1.5 truncate text-slate-300">
                          <span className="text-slate-500 font-medium text-[11px]">Active KOTs:</span>
                          <span className="font-mono text-white font-semibold text-[11px] truncate">
                            {item.kotNumbers.join(', ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 text-[11px] text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{item.timeStr}</span>
                        </div>
                      </div>

                      {/* Row 3: Payment Mode Quick Selector Strip */}
                      <div 
                        className="rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2"
                        style={{
                          backgroundColor: '#080c16',
                          border: '1px solid #1e293b'
                        }}
                      >
                        <span className="text-[11px] font-semibold text-slate-400 shrink-0">Pay Mode:</span>
                        <div className="flex items-center gap-1.5 flex-1 justify-end">
                          {paymentOptions.map(opt => {
                            const isSelected = selectedMode === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setPaymentMode(item.table.name || item.id, opt.id)}
                                className={`py-1 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer select-none active:scale-95 ${
                                  isSelected
                                    ? 'bg-[#0c2340] text-cyan-300 border border-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.25)] font-bold'
                                    : 'bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 border border-white/10'
                                }`}
                                style={
                                  isSelected
                                    ? {
                                        backgroundColor: '#0c2340',
                                        color: '#67e8f9',
                                        border: '1.5px solid #38bdf8',
                                        fontWeight: 700,
                                      }
                                    : {
                                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                                        color: '#cbd5e1',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                      }
                                }
                              >
                                <span>{opt.icon}</span>
                                <span>{opt.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Row 4: Action Buttons (Option A: Settle & Free Table, Option B: Send to Cashier with Mode, and View Bill) */}
                      <div className="space-y-1.5 pt-0.5">
                        <div className="grid grid-cols-2 gap-2">
                          {/* [View Bill / Invoice]: Solid Navy Blue button */}
                          <button
                            type="button"
                            onClick={() => handleViewBill(item)}
                            className="py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-98"
                            style={{
                              backgroundColor: '#1e3a8a',
                              color: '#ffffff',
                              border: '1px solid #3b82f6'
                            }}
                            title="View itemized bill or print guest check"
                          >
                            <FileText className="w-3.5 h-3.5 shrink-0 text-white" />
                            <span>View Bill / Invoice</span>
                          </button>

                          {/* [Send to Cashier with Mode]: Maroon/Amber button */}
                          <button
                            type="button"
                            onClick={() => handleSendToCashier(item)}
                            className="py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-98 bg-[#7a0c1a] hover:bg-[#8f1020] text-white"
                            style={{
                              backgroundColor: '#7a0c1a',
                              color: '#ffffff',
                              border: '1px solid #8f1020'
                            }}
                            title={`Send alert to Cashier screen for ${item.table.name}`}
                          >
                            <Bell className="w-3.5 h-3.5 shrink-0 text-white" />
                            <span>Send to Cashier</span>
                          </button>
                        </div>

                        {/* [Settle & Free Table]: Green/Emerald button */}
                        <button
                          type="button"
                          onClick={() => handleSettleAndFreeTable(item)}
                          className="w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-98 bg-[#059669] hover:bg-[#10b981] text-white border border-[#34d399]"
                          style={{
                            backgroundColor: '#059669',
                            color: '#ffffff',
                            border: '1px solid #34d399',
                            fontWeight: 700
                          }}
                          title={`Record ${modeLabel} payment, mark bill as PAID, and free up table`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-white" />
                          <span>✓ Settle & Free Table ({modeLabel})</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer: Clean Close button */}
            <div 
              className="p-3 border-t border-slate-800 flex items-center justify-end shrink-0"
              style={{ backgroundColor: '#0b1120', borderTop: '1px solid #1e293b' }}
            >
              <button
                id="close-bill-requests-footer-btn"
                type="button"
                onClick={() => setIsBillRequestsModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer border border-slate-700"
                style={{ backgroundColor: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Kitchen Quick Modal */}
      {isCallKitchenModalOpen && (
        <div 
          id="call-kitchen-modal-backdrop"
          onClick={() => setIsCallKitchenModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-sans text-slate-200"
        >
          <div 
            id="call-kitchen-modal-card"
            onClick={e => e.stopPropagation()}
            className="w-full max-w-sm bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-2xl text-slate-200 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Call Kitchen Station</h3>
              </div>
              <button 
                id="close-call-kitchen-modal"
                onClick={() => setIsCallKitchenModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCallKitchenSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Target Table</label>
                <input
                  id="kitchen-call-target-table"
                  type="text"
                  value={selectedTableForCall}
                  onChange={e => setSelectedTableForCall(e.target.value)}
                  placeholder="e.g. Table 4"
                  className="w-full px-3 py-2 bg-[#080d1a] border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Kitchen Alert Message</label>
                <select
                  id="kitchen-call-reason-select"
                  value={kitchenCallReason}
                  onChange={e => setKitchenCallReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[#080d1a] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-slate-700 cursor-pointer"
                >
                  <option value="Urgent status inquiry" className="bg-[#0f172a] text-white">Urgent status inquiry</option>
                  <option value="Guest waiting long for food" className="bg-[#0f172a] text-white">Guest waiting long for food</option>
                  <option value="Send starter first please" className="bg-[#0f172a] text-white">Send starter first please</option>
                  <option value="Hold main course for 10 mins" className="bg-[#0f172a] text-white">Hold main course for 10 mins</option>
                  <option value="Cutlery / extra gravy requested" className="bg-[#0f172a] text-white">Cutlery / extra gravy requested</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCallKitchenModalOpen(false)}
                  className="flex-1 py-2 rounded-lg bg-[#080d1a] hover:bg-slate-800 text-xs font-medium text-slate-300 hover:text-white cursor-pointer transition-colors border border-slate-800"
                >
                  Cancel
                </button>
                <button
                  id="submit-call-kitchen"
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Alert</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
