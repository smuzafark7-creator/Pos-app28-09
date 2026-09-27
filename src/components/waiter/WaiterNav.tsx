import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Grid3X3, 
  ReceiptText, 
  FileText, 
  Receipt,
  ChefHat,
  X,
  Send,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Bill } from '../../types';

export interface WaiterNavProps {
  activeTabOverride?: string;
  onNavigate?: (tab: string) => void;
}

export const WaiterNav: React.FC<WaiterNavProps> = ({ activeTabOverride, onNavigate }) => {
  const { 
    activeTab, 
    setActiveTab, 
    cart, 
    kots, 
    tables,
    setTables,
    bills,
    currentBranch,
    pendingBillRequests, 
    settleBillRequest,
    openBillDetailsModal,
    showToast,
    currentUser 
  } = useApp();

  const [isCallKitchenModalOpen, setIsCallKitchenModalOpen] = useState(false);
  const [isBillRequestsModalOpen, setIsBillRequestsModalOpen] = useState(false);
  const [kitchenCallReason, setKitchenCallReason] = useState('Urgent status inquiry');
  const [selectedTableForCall, setSelectedTableForCall] = useState('Table 1');

  const currentActive = activeTabOverride || activeTab;

  const handleNavigate = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    } else {
      setActiveTab(tab);
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

  const pendingKotsCount = kots.filter(k => k.status === 'new' || k.status === 'preparing' || k.status === 'ready' || k.status === 'picked_up').length;

  // Filter all tables that have billing requested: checks string variants & billRequested flag without waiter-specific exclusion
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

      const totalAmount = matchingReq?.totalAmount || (
        tableKots.length > 0 
          ? tableKots.reduce((sum, k) => sum + k.totalAmount, 0)
          : (tbl.currentAmount || (tbl.number === 2 ? 1130 : tbl.number === 3 ? 680 : tbl.number === 6 ? 300 : 500))
      );

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
        items.push({
          id: req.id,
          table: associatedTable || {
            id: req.tableId || req.id,
            number: tblNum,
            name: req.tableNumber,
            capacity: 4,
            branchId: req.branchId as any,
            status: 'billing',
            currentAmount: req.totalAmount
          },
          request: req,
          floor,
          totalAmount: req.totalAmount,
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
    const existingBill = bills.find(
      b => b.tableNumber?.toLowerCase() === item.table.name.toLowerCase() &&
           (currentBranch === 'all' || b.branchId === item.table.branchId)
    );

    if (existingBill) {
      openBillDetailsModal(existingBill);
      return;
    }

    const mergedItems = item.tableKots.flatMap(k => k.items).filter(i => i.status !== 'voided');
    const subtotal = Math.round(item.totalAmount / 1.05);
    const gstAmount = item.totalAmount - subtotal;
    const cgst = Math.round(gstAmount / 2);
    const sgst = gstAmount - cgst;

    const previewBill: Bill = {
      id: `preview_bill_${item.table.id}`,
      billNumber: `INV-${10020 + item.table.number}`,
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
      })) : [
        { id: 'item_1', menuItemId: 'm1', name: 'Dine-in Order Items', quantity: 1, rate: subtotal, amount: subtotal, gstRate: 5 }
      ],
      subtotal,
      gstPercent: 5,
      gstAmount,
      cgstPercent: 2.5,
      cgstAmount: cgst,
      sgstPercent: 2.5,
      sgstAmount: sgst,
      discountAmount: 0,
      grandTotal: item.totalAmount,
      paymentMethod: 'cash',
      status: 'paid',
      cashierName: 'Cashier Desk'
    };

    openBillDetailsModal(previewBill);
  };

  const handleNotifyOrSettle = (item: typeof billingTablesList[0]) => {
    if (item.request?.id) {
      settleBillRequest(item.request.id, 'cash');
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
        'Cashier Notified & Table Settled',
        `${item.table.name} bill of ₹${item.totalAmount.toLocaleString('en-IN')} marked settled. Table is now Available.`,
        'success'
      );
    }
  };

  return (
    <>
      {/* Slim Left Vertical Sidebar Navigation strictly for Waiter role */}
      <nav 
        id="waiter-bottom-navigation-comp"
        className="fixed z-40 select-none font-sans overflow-y-auto no-scrollbar"
        style={{
          left: 0,
          top: '64px',
          bottom: 0,
          width: '84px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: '16px',
          padding: '20px 8px',
          zIndex: 40,
          backgroundColor: '#0b1120',
          borderRight: '1px solid #1e293b'
        }}
      >
        {/* 1. Floor / Tables (Active Tab - Deep Navy) */}
        <button
          id="waiter-comp-nav-tables"
          type="button"
          onClick={() => handleNavigate('tables')}
          className="waiter-nav-navy-btn group cursor-pointer"
          style={{
            backgroundColor: '#1e3a8a',
            border: '1px solid #3b82f6',
            color: '#ffffff',
            fontWeight: 800,
            borderRadius: '12px',
            marginBottom: '8px',
            width: '100%',
            padding: '8px 4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <div className="relative flex items-center justify-center mb-1">
            <Grid3X3 
              className="w-5 h-5 shrink-0" 
              style={{ color: '#ffffff', stroke: '#ffffff' }} 
            />
          </div>
          <span 
            className="tracking-tight text-center leading-tight"
            style={{
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '11px',
              WebkitTextFillColor: '#ffffff'
            }}
          >
            Floor / Tables
          </span>
        </button>

        {/* 2. Quick Punch (Deep Crimson Red Pill) */}
        <button
          id="waiter-comp-nav-pos"
          type="button"
          onClick={() => handleNavigate('pos')}
          className="waiter-nav-crimson-btn group cursor-pointer"
          style={{
            backgroundColor: '#8b0000',
            border: '1px solid #dc2626',
            color: '#ffffff',
            fontWeight: 700,
            borderRadius: '12px',
            marginBottom: '8px',
            width: '100%',
            padding: '8px 4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <div className="relative flex items-center justify-center mb-1">
            <ReceiptText 
              className="w-5 h-5 shrink-0" 
              style={{ color: '#ffffff', stroke: '#ffffff' }} 
            />
            {cart.length > 0 && (
              <span className="badge-counter absolute -top-2 -right-2.5 min-w-4 h-4 px-1.5 bg-amber-500 text-black font-extrabold rounded-full flex items-center justify-center text-[10px] shadow-xs">
                {cart.length}
              </span>
            )}
          </div>
          <span 
            className="tracking-tight text-center leading-tight"
            style={{
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '11px',
              WebkitTextFillColor: '#ffffff'
            }}
          >
            Quick Punch
          </span>
        </button>

        {/* 3. KOTs (Deep Navy Blue Pill) */}
        <button
          id="waiter-comp-nav-kot"
          type="button"
          onClick={() => handleNavigate('kot')}
          className="waiter-nav-navy-btn group cursor-pointer"
          style={{
            backgroundColor: '#1e3a8a',
            border: '1px solid #3b82f6',
            color: '#ffffff',
            fontWeight: 700,
            borderRadius: '12px',
            marginBottom: '8px',
            width: '100%',
            padding: '8px 4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <div className="relative flex items-center justify-center mb-1">
            <FileText 
              className="w-5 h-5 shrink-0" 
              style={{ color: '#ffffff', stroke: '#ffffff' }} 
            />
            {pendingKotsCount > 0 && (
              <span className="badge-counter absolute -top-2 -right-3 min-w-4 h-4 px-1.5 bg-amber-500 text-black font-extrabold rounded-full flex items-center justify-center text-[10px] shadow-xs">
                {pendingKotsCount}
              </span>
            )}
          </div>
          <span 
            className="tracking-tight text-center leading-tight"
            style={{
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '11px',
              WebkitTextFillColor: '#ffffff'
            }}
          >
            KOTs
          </span>
        </button>

        {/* 4. Bill Requests (Deep Crimson Red Pill) */}
        <button
          id="waiter-comp-nav-bill-requests"
          type="button"
          onClick={() => setIsBillRequestsModalOpen(true)}
          className="waiter-nav-crimson-btn group cursor-pointer"
          style={{
            backgroundColor: '#8b0000',
            border: '1px solid #dc2626',
            color: '#ffffff',
            fontWeight: 700,
            borderRadius: '12px',
            marginBottom: '8px',
            width: '100%',
            padding: '8px 4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <div className="relative flex items-center justify-center mb-1">
            <Receipt 
              className="w-5 h-5 shrink-0" 
              style={{ color: '#ffffff', stroke: '#ffffff' }} 
            />
            {pendingCount > 0 && (
              <span className="badge-counter absolute -top-2 -right-2.5 min-w-4 h-4 px-1 bg-amber-500 text-black font-extrabold rounded-full flex items-center justify-center text-[10px] animate-pulse shadow-xs">
                {pendingCount}
              </span>
            )}
          </div>
          <span 
            className="tracking-tight text-center leading-tight"
            style={{
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '11px',
              WebkitTextFillColor: '#ffffff'
            }}
          >
            Bill Requests
          </span>
        </button>

        {/* 5. Call Kitchen (Deep Navy Blue Pill) */}
        <button
          id="waiter-comp-nav-call-kitchen"
          type="button"
          onClick={() => setIsCallKitchenModalOpen(true)}
          className="waiter-nav-navy-btn group cursor-pointer"
          style={{
            backgroundColor: '#1e3a8a',
            border: '1px solid #3b82f6',
            color: '#ffffff',
            fontWeight: 700,
            borderRadius: '12px',
            marginBottom: '8px',
            width: '100%',
            padding: '8px 4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <div className="relative flex items-center justify-center mb-1">
            <ChefHat 
              className="w-5 h-5 shrink-0" 
              style={{ color: '#ffffff', stroke: '#ffffff' }} 
            />
          </div>
          <span 
            className="tracking-tight text-center leading-tight"
            style={{
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '11px',
              WebkitTextFillColor: '#ffffff'
            }}
          >
            Call Kitchen
          </span>
        </button>
      </nav>

      {/* Bill Requests Drawer / Modal */}
      {isBillRequestsModalOpen && (
        <div 
          id="bill-requests-comp-modal-backdrop"
          onClick={() => setIsBillRequestsModalOpen(false)}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs font-sans text-slate-200 animate-in fade-in duration-150"
        >
          <div 
            id="bill-requests-comp-modal-card"
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
                id="close-bill-requests-comp-modal"
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
                billingTablesList.map(item => (
                  <div 
                    key={item.id}
                    id={`bill-request-comp-card-${item.table.id || item.id}`}
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

                    {/* Row 3: Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      {/* [View Bill / Invoice]: Solid Navy Blue button bg-[#1e3a8a] text-white */}
                      <button
                        type="button"
                        onClick={() => handleViewBill(item)}
                        className="py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-98"
                        style={{
                          backgroundColor: '#1e3a8a',
                          color: '#ffffff',
                          border: '1px solid #3b82f6'
                        }}
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0 text-white" />
                        <span>View Bill / Invoice</span>
                      </button>

                      {/* [Notify Cashier] / [Settle]: Solid Crimson Red button bg-[#8b0000] text-white */}
                      <button
                        type="button"
                        onClick={() => handleNotifyOrSettle(item)}
                        className="py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-98"
                        style={{
                          backgroundColor: '#8b0000',
                          color: '#ffffff',
                          border: '1px solid #dc2626'
                        }}
                      >
                        <Receipt className="w-3.5 h-3.5 shrink-0 text-white" />
                        <span>Notify Cashier / Settle</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer: Clean Close button */}
            <div 
              className="p-3 border-t border-slate-800 flex items-center justify-end shrink-0"
              style={{ backgroundColor: '#0b1120', borderTop: '1px solid #1e293b' }}
            >
              <button
                id="close-bill-requests-comp-footer-btn"
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
          id="call-kitchen-comp-modal-backdrop"
          onClick={() => setIsCallKitchenModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-sans text-slate-200"
        >
          <div 
            id="call-kitchen-comp-modal-card"
            onClick={e => e.stopPropagation()}
            className="w-full max-w-sm bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-2xl text-slate-200 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Call Kitchen Station</h3>
              </div>
              <button 
                id="close-call-kitchen-comp-modal"
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
                  id="kitchen-call-comp-target-table"
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
                  id="kitchen-call-comp-reason-select"
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
                  id="submit-call-kitchen-comp"
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
    </>
  );
};
