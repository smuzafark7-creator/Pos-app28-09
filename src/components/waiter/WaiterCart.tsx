import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { KOT, ItemServeType, ServeType, CartItem, SavedActiveOrder, OrderType } from '../../types';
import { 
  Phone, 
  Send, 
  Receipt, 
  Trash2, 
  Edit3,
  Printer,
  ChevronDown,
  Utensils,
  ShoppingBag,
  Bike
} from 'lucide-react';
import { KOTCancelModal } from '../KOTCancelModal';
import { KOTModifyModal } from '../KOTModifyModal';

export interface WaiterCartProps {
  orderType?: OrderType;
  setOrderType?: (type: OrderType) => void;
  tableNumber: string;
  onTableChange?: (tableName: string) => void;
  activeSessionKots?: KOT[];
}

const normalizeTable = (t?: string): string => {
  if (!t) return '';
  return t.trim().toLowerCase().replace(/^t\s*/, 'table ');
};

const getTableDigits = (t?: string): string => {
  if (!t) return '';
  return t.replace(/[^0-9]/g, '');
};

const isTableMatch = (kotTable?: string, selectedTable?: string): boolean => {
  if (!kotTable || !selectedTable) return false;
  const kNorm = normalizeTable(kotTable);
  const sNorm = normalizeTable(selectedTable);
  if (kNorm === sNorm) return true;
  const kDigits = getTableDigits(kotTable);
  const sDigits = getTableDigits(selectedTable);
  return Boolean(kDigits && sDigits && kDigits === sDigits);
};

export const WaiterCart: React.FC<WaiterCartProps> = ({
  orderType: propOrderType,
  setOrderType: setPropOrderType,
  tableNumber: propTableNumber,
  onTableChange,
}) => {
  const {
    cart,
    setCartItems,
    updateCartQuantity,
    updateCartItemServeType,
    updateCartItemNotes,
    removeFromCart,
    clearCart,
    cartCustomerName,
    setCartCustomerName,
    cartCustomerMobile,
    setCartCustomerMobile,
    cartSpecialNotes,
    setCartSpecialNotes,
    cartOrderType,
    setCartOrderType,
    currentUser,
    sendKOT,
    requestBill,
    pendingBillRequests,
    branchTables,
    voidKOTItem,
    updateKOTStatus,
    showToast,
    kots,
    currentBranch,
    cartTableNumber,
    setCartTableNumber,
    openKOTModal,
    savedActiveOrders,
    setSavedActiveOrders,
  } = useApp();

  const currentTable = propTableNumber || cartTableNumber || 'Table 1';
  const orderType = propOrderType || cartOrderType || 'dine_in';

  const [isSendingKot, setIsSendingKot] = useState<boolean>(false);
  const [isTableDropdownOpen, setIsTableDropdownOpen] = useState<boolean>(false);
  const tableDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside listener for table dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (tableDropdownRef.current && !tableDropdownRef.current.contains(e.target as Node)) {
        setIsTableDropdownOpen(false);
      }
    };
    if (isTableDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isTableDropdownOpen]);

  // KOT item modify/cancel modals
  const [cancelModalTarget, setCancelModalTarget] = useState<{ kot: KOT; itemIndex?: number } | null>(null);
  const [modifyModalTarget, setModifyModalTarget] = useState<{ kot: KOT; itemIndex: number } | null>(null);

  const safeBranchTables = Array.isArray(branchTables) ? branchTables : [];
  const effectiveBranch = currentBranch === 'all' ? 'main' : currentBranch;
  const filteredBranchTables = safeBranchTables.filter(
    t => !t.branchId || t.branchId === effectiveBranch
  );

  const selectedTable = safeBranchTables.find(t => isTableMatch(t.name, currentTable));

  // Table draft carts storage to preserve un-sent items per table
  const tableDraftsRef = useRef<Record<string, CartItem[]>>((() => {
    try {
      const saved = sessionStorage.getItem('zaffran_waiter_table_drafts');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  })());

  const prevTableRef = useRef<string>(currentTable);

  const handleOrderTypeChange = (type: OrderType) => {
    if (setPropOrderType) {
      setPropOrderType(type);
    }
    setCartOrderType(type);
  };

  // Synchronize draft cart when changing tables
  const handleTableChange = (newTable: string) => {
    if (newTable === currentTable) return;

    // 1. Auto-save previous table's un-sent punch items
    if (prevTableRef.current && cart.length > 0) {
      tableDraftsRef.current[prevTableRef.current] = [...cart];
      try {
        sessionStorage.setItem('zaffran_waiter_table_drafts', JSON.stringify(tableDraftsRef.current));
      } catch {
        // ignore
      }

      // Also persist to AppContext savedActiveOrders
      const prevNorm = prevTableRef.current.toLowerCase().trim();
      const prevOrderKey = `dine_in:${prevNorm}`;
      const subtotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
      const updatedCart = cart.map(c => ({ ...c, isSaved: true, isNew: false }));
      const now = new Date();
      setSavedActiveOrders(prev => ({
        ...prev,
        [prevOrderKey]: {
          id: prevTableRef.current,
          key: prevOrderKey,
          orderType: 'dine_in',
          branchId: currentBranch === 'all' ? 'main' : currentBranch,
          tableNumber: prevTableRef.current,
          cart: updatedCart,
          customerName: cartCustomerName || undefined,
          customerMobile: cartCustomerMobile || undefined,
          specialNotes: cartSpecialNotes || undefined,
          savedAt: now.toISOString(),
          subtotal,
        }
      }));
    }

    // 2. Notify parent and AppContext
    if (onTableChange) {
      onTableChange(newTable);
    }
    setCartTableNumber(newTable);

    // 3. Restore newly selected table's draft cart
    const norm = newTable.toLowerCase().trim();
    const digits = newTable.replace(/[^0-9]/g, '');
    const orderKey = `dine_in:${norm}`;
    const altKey = digits ? `dine_in:table ${digits}` : orderKey;
    const shortKey = digits ? `dine_in:t${digits}` : orderKey;

    const existingDraft = tableDraftsRef.current[newTable] || 
      tableDraftsRef.current[`Table ${digits}`] ||
      tableDraftsRef.current[`T${digits}`] ||
      savedActiveOrders?.[orderKey]?.cart ||
      savedActiveOrders?.[altKey]?.cart ||
      savedActiveOrders?.[shortKey]?.cart ||
      [];

    setCartItems(existingDraft);
    prevTableRef.current = newTable;
  };

  // Check if current table has an active draft held
  const isDraftHeld = useMemo(() => {
    const norm = currentTable.toLowerCase().trim();
    const digits = currentTable.replace(/[^0-9]/g, '');
    const orderKey = `dine_in:${norm}`;
    const altKey = digits ? `dine_in:table ${digits}` : orderKey;
    const shortKey = digits ? `dine_in:t${digits}` : orderKey;
    return Boolean(
      (tableDraftsRef.current[currentTable] && tableDraftsRef.current[currentTable].length > 0) ||
      savedActiveOrders?.[orderKey] ||
      savedActiveOrders?.[altKey] ||
      savedActiveOrders?.[shortKey]
    );
  }, [currentTable, savedActiveOrders]);

  // Handle Save / Hold draft button explicitly
  const handleSaveHoldOrder = () => {
    if (cart.length === 0) {
      showToast('No Items', 'Add items before saving a draft.', 'warning');
      return;
    }

    tableDraftsRef.current[currentTable] = [...cart];
    try {
      sessionStorage.setItem('zaffran_waiter_table_drafts', JSON.stringify(tableDraftsRef.current));
    } catch {
      // ignore
    }

    const norm = currentTable.toLowerCase().trim();
    const digits = currentTable.replace(/[^0-9]/g, '');
    const orderKey = `dine_in:${norm}`;
    const altKey = digits ? `dine_in:table ${digits}` : orderKey;
    const subtotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
    const updatedCart = cart.map(c => ({ ...c, isSaved: true, isNew: false }));
    const now = new Date();

    const savedDraft: SavedActiveOrder = {
      id: currentTable,
      key: orderKey,
      orderType: 'dine_in',
      branchId: currentBranch === 'all' ? 'main' : currentBranch,
      tableNumber: currentTable,
      cart: updatedCart,
      customerName: cartCustomerName || undefined,
      customerMobile: cartCustomerMobile || undefined,
      specialNotes: cartSpecialNotes || undefined,
      savedAt: now.toISOString(),
      subtotal,
    };

    setSavedActiveOrders(prev => ({
      ...prev,
      [orderKey]: savedDraft,
      ...(digits ? { [altKey]: savedDraft } : {})
    }));

    showToast(
      'Draft Saved / Held',
      `Order for ${currentTable} held (${cart.length} item${cart.length > 1 ? 's' : ''}). You can safely switch tables.`,
      'success'
    );
  };

  // Active unbilled KOTs strictly for the currently selected table
  const tableActiveKots = useMemo(() => {
    return (kots || [])
      .filter(k => {
        if (k.branchId !== effectiveBranch) return false;
        if (orderType === 'dine_in') {
          if (k.orderType !== 'dine_in') return false;
          if (k.isBilled) return false;
          if (k.status === 'cancelled') return false;
          return isTableMatch(k.tableNumber, currentTable);
        } else {
          if (k.orderType !== orderType) return false;
          if (k.isBilled) return false;
          if (k.status === 'cancelled') return false;
          return true;
        }
      })
      .sort((a, b) => {
        const timeDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (timeDiff !== 0) return timeDiff;
        return (a.kotNumber || '').localeCompare(b.kotNumber || '');
      });
  }, [kots, effectiveBranch, currentTable, orderType]);

  const safePendingBillRequests = Array.isArray(pendingBillRequests) ? pendingBillRequests : [];
  const pendingBillRequestForCurrentTable = safePendingBillRequests.find(
    r => isTableMatch(r?.tableNumber, currentTable)
  );

  // Running amounts for current table
  const runningKOTsTotal = tableActiveKots.reduce((acc, kot) => acc + (kot.totalAmount || 0), 0);
  const newCartTotal = cart.reduce((acc, item) => acc + item.item.price * item.quantity, 0);
  const totalTableAmount = runningKOTsTotal + newCartTotal;

  const handleConfirmCancel = (reason: string, qty: number) => {
    if (!cancelModalTarget) return;
    if (typeof cancelModalTarget.itemIndex === 'number') {
      voidKOTItem(cancelModalTarget.kot.id, cancelModalTarget.itemIndex, qty, reason);
      showToast('Item Voided', 'Item cancellation sent to kitchen.', 'info');
    } else {
      updateKOTStatus(cancelModalTarget.kot.id, 'cancelled');
      showToast('KOT Cancelled', 'Kitchen order cancelled.', 'info');
    }
    setCancelModalTarget(null);
  };

  const handleConfirmModify = (updates: { notes?: string; serveType?: ServeType }) => {
    if (!modifyModalTarget) return;
    showToast('Item Updated', `Instructions noted: ${updates.notes || updates.serveType || 'Updated'}`, 'success');
    setModifyModalTarget(null);
  };

  const handleSendKOT = () => {
    if (isSendingKot) return;
    if (orderType === 'dine_in' && !currentTable) {
      showToast('Select Table', 'Please assign a table before sending KOT.', 'warning');
      return;
    }
    if (cart.length === 0) {
      showToast('Cart Empty', 'Add items to order before sending KOT.', 'warning');
      return;
    }

    setIsSendingKot(true);
    setTimeout(() => {
      const kot = sendKOT(orderType === 'dine_in' ? currentTable : undefined, orderType);
      setIsSendingKot(false);
      if (kot) {
        // Clear saved draft for this table
        delete tableDraftsRef.current[currentTable];
        try {
          sessionStorage.setItem('zaffran_waiter_table_drafts', JSON.stringify(tableDraftsRef.current));
        } catch {
          // ignore
        }
        const norm = currentTable.toLowerCase().trim();
        const digits = currentTable.replace(/[^0-9]/g, '');
        const orderKey = `dine_in:${norm}`;
        const altKey = digits ? `dine_in:table ${digits}` : orderKey;
        const shortKey = digits ? `dine_in:t${digits}` : orderKey;
        setSavedActiveOrders(prev => {
          const next = { ...prev };
          delete next[orderKey];
          delete next[altKey];
          delete next[shortKey];
          return next;
        });
        showToast('KOT Dispatched', `${kot.kotNumber} sent to Kitchen for ${orderType === 'dine_in' ? currentTable : orderType.toUpperCase()}.`, 'success');
      }
    }, 200);
  };

  const handleClearCart = () => {
    clearCart();
    delete tableDraftsRef.current[currentTable];
    try {
      sessionStorage.setItem('zaffran_waiter_table_drafts', JSON.stringify(tableDraftsRef.current));
    } catch {
      // ignore
    }
    const norm = currentTable.toLowerCase().trim();
    const digits = currentTable.replace(/[^0-9]/g, '');
    const orderKey = `dine_in:${norm}`;
    const altKey = digits ? `dine_in:table ${digits}` : orderKey;
    const shortKey = digits ? `dine_in:t${digits}` : orderKey;
    setSavedActiveOrders(prev => {
      const next = { ...prev };
      delete next[orderKey];
      delete next[altKey];
      delete next[shortKey];
      return next;
    });
  };

  const handleRequestBill = () => {
    if (orderType === 'dine_in' && !currentTable) {
      showToast('Select Table', 'Please select a table to request bill.', 'warning');
      return;
    }
    if (cart.length === 0 && tableActiveKots.length === 0) {
      showToast('No Active Orders', `Table ${currentTable} has no active orders to bill.`, 'warning');
      return;
    }
    const noteParts: string[] = [];
    if (cartCustomerName) noteParts.push(`Guest: ${cartCustomerName}`);
    if (cartCustomerMobile) noteParts.push(`Phone: ${cartCustomerMobile}`);
    requestBill(currentTable, noteParts.length > 0 ? noteParts.join(', ') : undefined);
    showToast('Bill Requested', `Cashier desk notified for ${currentTable}.`, 'info');
  };

  const assignedWaiterName = selectedTable?.assignedWaiterName || currentUser?.name?.replace(/\s*\(Waiter\)$/i, '').trim() || 'Ramesh Patel';
  const guestNameDisplay = selectedTable?.guestName || cartCustomerName || 'Guest';

  return (
    <div 
      id="waiter-cart-panel"
      className="waiter-billing-panel w-[470px] min-w-[470px] max-w-[470px] bg-[#0b1120] border-l border-[#8b0000]/60 flex flex-col justify-between shrink-0 shadow-lg z-10 text-slate-200 select-none font-sans overflow-x-hidden"
      style={{
        width: '470px',
        minWidth: '470px',
        maxWidth: '470px',
        flex: '0 0 470px',
        backgroundColor: '#0b1120',
        overflowX: 'hidden',
      }}
    >
      
      {/* Top Section: Cashier Clean Dual-Bar & Customer Inputs */}
      <div 
        id="waiter-cart-top-section"
        className="p-3 border-b border-slate-800 space-y-2 shrink-0 bg-[#0b1120]"
        style={{ backgroundColor: '#0b1120' }}
      >
        {/* Bar 1 (Top segmented tabs): [🍽 Dine In] (Active deep maroon #580510) | [🛍 Takeaway] | [🛵 Delivery] */}
        <div id="waiter-order-type-switcher" className="flex w-full items-center gap-2 bg-transparent p-0 border-0">
          {/* 1. Dine In */}
          <button
            id="order-type-dine-in"
            type="button"
            onClick={() => handleOrderTypeChange('dine_in')}
            style={
              orderType === 'dine_in'
                ? {
                    backgroundColor: '#7a0c1a',
                    border: '2px solid #ffffff',
                  }
                : {
                    backgroundColor: '#580510',
                    border: '1px solid transparent',
                  }
            }
            className={`flex-1 py-1.5 text-center rounded-lg text-xs transition-all duration-150 inline-flex items-center justify-center gap-1.5 cursor-pointer ${
              orderType === 'dine_in'
                ? 'bg-[#7a0c1a] text-white font-bold ring-2 ring-white shadow-lg scale-[1.02] border-2 border-white z-10'
                : 'bg-[#580510] text-white/90 font-semibold hover:bg-[#6b0816] hover:text-white border border-transparent'
            }`}
          >
            <Utensils className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" size={14} />
            <span>Dine In</span>
          </button>

          {/* 2. Takeaway */}
          <button
            id="order-type-takeaway"
            type="button"
            onClick={() => handleOrderTypeChange('takeaway')}
            style={
              orderType === 'takeaway'
                ? {
                    backgroundColor: '#1e3a8a',
                    border: '2px solid #ffffff',
                  }
                : {
                    backgroundColor: '#0b1e3b',
                    border: '1px solid transparent',
                  }
            }
            className={`flex-1 py-1.5 text-center rounded-lg text-xs transition-all duration-150 inline-flex items-center justify-center gap-1.5 cursor-pointer ${
              orderType === 'takeaway'
                ? 'bg-[#1e3a8a] text-white font-bold ring-2 ring-white shadow-lg scale-[1.02] border-2 border-white z-10'
                : 'bg-[#0b1e3b] text-white/90 font-semibold hover:bg-[#12284e] hover:text-white border border-transparent'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" size={14} />
            <span>Takeaway</span>
          </button>

          {/* 3. Delivery */}
          <button
            id="order-type-delivery"
            type="button"
            onClick={() => handleOrderTypeChange('delivery')}
            style={
              orderType === 'delivery'
                ? {
                    backgroundColor: '#b45309',
                    border: '2px solid #ffffff',
                  }
                : {
                    backgroundColor: '#92400e',
                    border: '1px solid transparent',
                  }
            }
            className={`flex-1 py-1.5 text-center rounded-lg text-xs transition-all duration-150 inline-flex items-center justify-center gap-1.5 cursor-pointer ${
              orderType === 'delivery'
                ? 'bg-[#b45309] text-white font-bold ring-2 ring-white shadow-lg scale-[1.02] border-2 border-white z-10'
                : 'bg-[#92400e] text-white/90 font-semibold hover:bg-[#a34810] hover:text-white border border-transparent'
            }`}
          >
            <Bike className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" size={14} />
            <span>Delivery</span>
          </button>
        </div>

        {/* Bar 2 (Table info bar): Table 5 • 4 Seats • Ramesh Patel • Guest ∨ | Subtotal ₹2320.00 */}
        {orderType === 'dine_in' ? (
          <div className="relative w-full" ref={tableDropdownRef}>
            <div
              id="waiter-table-info-summary"
              onClick={() => setIsTableDropdownOpen(prev => !prev)}
              className="pos-table-selector-trigger flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer select-none transition-all shadow-xs"
              style={{
                backgroundColor: '#0b1120',
                border: '1px solid rgba(234, 219, 186, 0.4)',
              }}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsTableDropdownOpen(prev => !prev);
                }
              }}
              title="Click to select table"
            >
              <div className="table-info-text waiter-table-server-info flex items-center gap-1.5 truncate text-[13px] text-slate-100 font-semibold min-w-0 pr-2" style={{ color: '#f8fafc', fontSize: '13px', fontWeight: 600 }}>
                <span className="font-bold text-white truncate">{selectedTable?.name || currentTable}</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold shrink-0">{selectedTable?.capacity || 4} Seats</span>
                <span>•</span>
                <span className="text-slate-200 font-semibold truncate">{assignedWaiterName}</span>
                <span>•</span>
                <span className="text-slate-200 truncate">{guestNameDisplay}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ml-0.5 ${isTableDropdownOpen ? 'rotate-180' : ''}`} style={{ stroke: 'rgba(234, 219, 186, 0.9)' }} />
              </div>

              <span 
                className="table-total-price waiter-table-subtotal-price font-extrabold text-[14px] shrink-0 ml-2"
                style={{ color: '#10b981', fontWeight: 800, fontSize: '14px' }}
              >
                ₹{totalTableAmount.toFixed(2)}
              </span>
            </div>

            {/* Floating Table Selector Dropdown */}
            {isTableDropdownOpen && (
              <div
                id="waiter-table-selector-menu"
                className="pos-table-selector-menu absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-64 overflow-y-auto p-1.5 flex flex-col gap-1 shadow-2xl"
                style={{
                  backgroundColor: '#0b1120',
                  border: '1px solid #EADBBA',
                  borderRadius: '10px',
                }}
                role="listbox"
              >
                {(filteredBranchTables.length > 0 ? filteredBranchTables : safeBranchTables).map(tbl => {
                  const isSelected = isTableMatch(tbl.name, currentTable);
                  const normStatus = (tbl.status === 'ready' || tbl.status === 'waiting') ? 'occupied' : tbl.status;
                  const upperStatus = normStatus.toUpperCase();
                  const isMint = upperStatus === 'CLEANING' || upperStatus === 'AVAILABLE';

                  return (
                    <button
                      key={tbl.id}
                      type="button"
                      onClick={() => {
                        handleTableChange(tbl.name);
                        setIsTableDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#F7EECA] text-[#0f172a] font-bold shadow-xs'
                          : 'text-slate-200 hover:bg-slate-800/80 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-bold text-sm" style={{ color: isSelected ? '#0f172a' : '#ffffff' }}>
                          {tbl.name}
                        </span>
                        <span style={{ color: isSelected ? '#047857' : '#10b981', fontSize: '11px', fontWeight: 600 }}>
                          • {tbl.capacity} Seats
                        </span>
                        {tbl.assignedWaiterName && (
                          <span style={{ color: isSelected ? '#047857' : '#10b981', fontSize: '11px', fontWeight: 600 }}>
                            • {tbl.assignedWaiterName}
                          </span>
                        )}
                        {tbl.guestName && (
                          <span style={{ color: isSelected ? '#0369a1' : '#38bdf8', fontSize: '11px', fontWeight: 600 }}>
                            • {tbl.guestName}
                          </span>
                        )}
                      </div>
                      <span
                        className="px-2 py-0.5 rounded-md text-[11px] uppercase tracking-wide shrink-0 ml-2 font-bold"
                        style={{
                          color: isSelected ? '#0f172a' : isMint ? '#34d399' : '#fbbf24',
                          backgroundColor: isSelected ? 'rgba(15, 23, 42, 0.12)' : isMint ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 191, 36, 0.12)',
                          border: isSelected ? '1px solid rgba(15, 23, 42, 0.25)' : isMint ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(251, 191, 36, 0.3)',
                        }}
                      >
                        {upperStatus}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div
            className="flex items-center justify-between px-3 py-2 rounded-xl shadow-xs"
            style={{
              backgroundColor: '#0b1120',
              border: '1px solid rgba(234, 219, 186, 0.4)',
            }}
          >
            <div className="table-info-text waiter-table-server-info flex items-center gap-1.5 truncate text-[13px] text-slate-100 font-semibold min-w-0 pr-2" style={{ color: '#f8fafc', fontSize: '13px', fontWeight: 600 }}>
              <span className="font-bold text-white capitalize">{orderType} Order</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">{assignedWaiterName}</span>
              <span>•</span>
              <span className="text-slate-200 truncate">{guestNameDisplay}</span>
            </div>
            <span 
              className="table-total-price waiter-table-subtotal-price font-extrabold text-[14px] shrink-0 ml-2"
              style={{ color: '#10b981', fontWeight: 800, fontSize: '14px' }}
            >
              ₹{totalTableAmount.toFixed(2)}
            </span>
          </div>
        )}

        {/* Bar 3 (Optional fields): Compact dual inputs for [Phone (Optional)] and [Guest Name (Optional)] */}
        <div className="w-full grid grid-cols-2 gap-2">
          {/* Customer Mobile / Phone */}
          <div className="relative w-full min-w-0">
            <Phone className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              id="waiter-customer-mobile-input"
              type="tel"
              value={cartCustomerMobile || ''}
              onChange={e => setCartCustomerMobile(e.target.value.slice(0, 12))}
              placeholder="Phone (Optional)"
              maxLength={12}
              style={{
                backgroundColor: '#080c16',
                color: '#ffffff',
                border: '1px solid #1e293b'
              }}
              className="waiter-cart-input pl-8 pr-2 py-1.5 h-[34px] w-full text-xs text-white bg-[#080c16] border border-[#1e293b] rounded-md focus:border-emerald-500 focus:outline-none transition-colors placeholder-slate-500"
            />
          </div>

          {/* Optional Guest Name */}
          <div className="w-full min-w-0">
            <input
              id="waiter-customer-name-input"
              type="text"
              value={cartCustomerName || ''}
              onChange={e => setCartCustomerName(e.target.value)}
              placeholder="Guest Name (Optional)"
              style={{
                backgroundColor: '#080c16',
                color: '#ffffff',
                border: '1px solid #1e293b'
              }}
              className="waiter-cart-input px-2.5 py-1.5 h-[34px] w-full text-xs text-white bg-[#080c16] border border-[#1e293b] rounded-md focus:border-emerald-500 focus:outline-none transition-colors placeholder-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Middle Scrollable: Order Items List (Full-Width Cashier Style) */}
      <div 
        id="waiter-cart-middle-section"
        className="flex-1 overflow-y-auto flex flex-col bg-[#0b1120] min-h-0"
        style={{ backgroundColor: '#0b1120' }}
      >
        <div className="p-3 space-y-4 flex-1">
          
          {/* Active Sent KOTs for Currently Selected Table */}
          {(tableActiveKots || []).map(kot => {
            const kotDisplayNumber = kot.kotNumber.startsWith('KOT') ? kot.kotNumber : `KOT #${kot.kotNumber}`;
            return (
              <div key={kot.id} className="space-y-1">
                {/* Compact KOT Header Row */}
                <div className="flex items-center justify-between px-2 text-[11px] font-semibold text-slate-400 pb-1 border-b border-slate-800/60">
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="waiter-cart-kot-header-badge font-mono tracking-tight"
                      style={{
                        color: '#f8fafc',
                        fontWeight: 850,
                        fontSize: '13px'
                      }}
                    >
                      {kotDisplayNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => openKOTModal(kot)}
                      className="waiter-cart-kot-print-btn p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer border border-[#334155] flex items-center justify-center shrink-0 ml-1"
                      style={{
                        backgroundColor: '#1e293b',
                        color: '#f1f5f9',
                        border: '1px solid #334155'
                      }}
                      title="Print KOT Slip"
                      aria-label={`Print KOT ${kot.kotNumber}`}
                    >
                      <Printer className="w-3 h-3 text-slate-200" style={{ color: '#e2e8f0' }} />
                    </button>
                  </div>
                  <span className="text-emerald-400 font-bold">₹{kot.totalAmount.toFixed(2)}</span>
                </div>

                {/* Compact Item Rows (Line Item Compact Full-Width Spread) */}
                <div className="divide-y divide-slate-800/60">
                  {(kot.items || []).map((it, idx) => {
                    const itName = it.name || (it as any)?.menuItem?.name || 'Item';
                    const match = itName.match(/^(.*?)\s*\((.*?)\)$/);
                    const baseName = match ? match[1].trim() : itName;
                    const variationName = match ? match[2].trim() : undefined;
                    const itRate = (it.rate ?? (it as any)?.menuItem?.price) || 0;
                    const isVoided = it.status === 'voided';

                    return (
                      <div 
                        key={idx} 
                        className={`waiter-cart-line-item-row flex items-center justify-between text-xs w-full transition-colors ${
                          isVoided ? 'opacity-60 bg-rose-950/10' : 'hover:bg-slate-800/30'
                        }`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          width: '100%',
                        }}
                      >
                        {/* Left Column: Dish Name + Yellow Portion tag + Rate */}
                        <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-2 truncate">
                          <span 
                            className={`waiter-cart-item-title font-semibold text-white text-[13px] truncate ${isVoided ? 'line-through text-slate-400' : ''}`}
                            style={{ color: isVoided ? '#94a3b8' : '#ffffff', fontWeight: 650, fontSize: '13px' }}
                            title={baseName}
                          >
                            {baseName}
                          </span>
                          {variationName && (
                            <span 
                              className="waiter-cart-portion-tag font-bold text-[11px] text-amber-400 shrink-0"
                              style={{ color: '#fbbf24', fontWeight: 700, fontSize: '11px' }}
                            >
                              ({variationName})
                            </span>
                          )}
                          <span className="text-slate-500 shrink-0">•</span>
                          <span 
                            className="waiter-cart-rate-tag font-medium text-slate-400 text-xs shrink-0"
                            style={{ color: '#94a3b8', fontSize: '12px' }}
                          >
                            ₹{itRate.toFixed(2)}
                          </span>
                          {it.notes && (
                            <span className="text-[11px] text-amber-300/80 italic truncate max-w-[90px]" title={it.notes}>
                              • {it.notes}
                            </span>
                          )}
                          {isVoided && (
                            <span className="text-[10px] text-rose-400 font-bold uppercase shrink-0">
                              [VOID]
                            </span>
                          )}
                        </div>

                        {/* Center/Action Column: Compact quantity box x1 */}
                        <div className="flex items-center justify-center shrink-0 mx-2">
                          <span 
                            className={`px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-bold text-xs text-center min-w-[28px] ${
                              isVoided ? 'line-through text-slate-500' : 'text-slate-200'
                            }`}
                            style={{
                              backgroundColor: '#1e293b',
                              border: '1px solid #334155',
                              borderRadius: '6px',
                              padding: '2px 8px',
                              fontWeight: 700,
                              fontSize: '12px',
                              color: '#e2e8f0',
                            }}
                          >
                            x{it.quantity}
                          </span>
                        </div>

                        {/* Right Column: Crisp Emerald Green price aligned to far right edge + subtle trash icon */}
                        <div className="flex items-center justify-end gap-1.5 shrink-0 min-w-[80px]">
                          <span 
                            className={`font-bold text-[13px] text-right whitespace-nowrap ${
                              isVoided ? 'line-through text-slate-500' : 'text-emerald-400'
                            }`}
                            style={{
                              color: isVoided ? '#64748b' : '#34d399',
                              fontWeight: 800,
                              fontSize: '13px',
                            }}
                          >
                            ₹{(itRate * it.quantity).toFixed(2)}
                          </span>
                          {!isVoided ? (
                            <button
                              type="button"
                              onClick={() => setCancelModalTarget({ kot, itemIndex: idx })}
                              className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0 ml-1"
                              title="Void item"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-400/70 hover:text-rose-400" />
                            </button>
                          ) : (
                            <div className="w-6 h-6 shrink-0 ml-1" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* New Cart / Punch Items for Currently Selected Table */}
          {(cart || []).length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 pb-1 text-[11px] font-semibold text-amber-400 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span 
                    id="waiter-cart-new-punch-badge"
                    className="waiter-new-punch-badge inline-flex items-center shadow-xs"
                    style={{
                      background: '#fef08a',
                      color: '#854d0e',
                      fontWeight: 800,
                      fontSize: '11px',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      letterSpacing: '0.05em',
                    }}
                  >
                    NEW
                  </span>
                  <span className="text-slate-300 font-semibold text-xs uppercase tracking-wider">
                    ITEMS ({cart.length})
                  </span>
                  {isDraftHeld && (
                    <span 
                      className="inline-flex items-center gap-1 font-bold text-[10px]"
                      style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        color: '#93c5fd',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        borderRadius: '6px',
                        padding: '2px 6px'
                      }}
                      title="This order is held as draft"
                    >
                      <span>💾</span> Held Draft
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleClearCart}
                  className="text-rose-400 hover:text-rose-300 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              </div>

              {/* Line Item Compact Full-Width Spread for Punch Items */}
              <div className="divide-y divide-slate-800/60">
                {(cart || []).map(cartItem => {
                  const match = cartItem.item.name.match(/^(.*?)\s*\((.*?)\)$/);
                  const baseName = match ? match[1].trim() : cartItem.item.name;
                  const variationName = match ? match[2].trim() : undefined;

                  return (
                    <div 
                      key={cartItem.item.id}
                      className="waiter-cart-line-item-row flex items-center justify-between text-xs w-full hover:bg-slate-800/30 transition-colors"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        width: '100%',
                      }}
                    >
                      {/* Left Column: Dish Name + Yellow Portion tag + Rate */}
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-2 truncate">
                        <span 
                          className="waiter-cart-item-title font-semibold text-white text-[13px] truncate"
                          style={{ color: '#ffffff', fontWeight: 650, fontSize: '13px' }}
                          title={baseName}
                        >
                          {baseName}
                        </span>
                        {variationName && (
                          <span 
                            className="waiter-cart-portion-tag font-bold text-[11px] text-amber-400 shrink-0"
                            style={{ color: '#fbbf24', fontWeight: 700, fontSize: '11px' }}
                          >
                            ({variationName})
                          </span>
                        )}
                        <span className="text-slate-500 shrink-0">•</span>
                        <span 
                          className="waiter-cart-rate-tag font-medium text-slate-400 text-xs shrink-0"
                          style={{ color: '#94a3b8', fontSize: '12px' }}
                        >
                          ₹{cartItem.item.price.toFixed(2)}
                        </span>
                        {cartItem.serveType === 'PARCEL' && (
                          <span className="text-[10px] bg-amber-950/60 text-amber-400 border border-amber-600/40 px-1 py-0.2 rounded shrink-0 font-semibold">
                            Parcel
                          </span>
                        )}
                        {cartItem.notes && (
                          <span className="text-[11px] text-amber-300/80 italic truncate max-w-[90px]" title={cartItem.notes}>
                            • {cartItem.notes}
                          </span>
                        )}
                      </div>

                      {/* Center/Action Column: Small blue [- 1 +] pill */}
                      <div 
                        className="flex items-center gap-1 shrink-0 mx-2"
                        style={{
                          backgroundColor: '#1e293b',
                          border: '1px solid rgba(59, 130, 246, 0.5)',
                          borderRadius: '8px',
                          padding: '2px 4px',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(cartItem.item.id, -1)}
                          className="w-5 h-5 rounded flex items-center justify-center font-bold text-xs text-blue-300 hover:text-white hover:bg-blue-600/40 cursor-pointer transition-colors active:scale-95"
                          title="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="w-5 text-center font-bold text-white text-xs">
                          {cartItem.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(cartItem.item.id, 1)}
                          className="w-5 h-5 rounded flex items-center justify-center font-bold text-xs text-blue-300 hover:text-white hover:bg-blue-600/40 cursor-pointer transition-colors active:scale-95"
                          title="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      {/* Right Column: Crisp Emerald Green price aligned to far right edge + subtle trash icon */}
                      <div className="flex items-center justify-end gap-1.5 shrink-0 min-w-[80px]">
                        <span 
                          className="font-bold text-[13px] text-emerald-400 text-right whitespace-nowrap"
                          style={{
                            color: '#34d399',
                            fontWeight: 800,
                            fontSize: '13px',
                          }}
                        >
                          ₹{(cartItem.item.price * cartItem.quantity).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFromCart(cartItem.item.id)}
                          className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0 ml-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400/70 hover:text-rose-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State when no KOTs and no items */}
          {tableActiveKots.length === 0 && cart.length === 0 && (
            <div 
              id="waiter-cart-empty-box"
              style={{
                backgroundColor: '#080c16',
                border: '1px dashed #1e293b',
                color: '#64748b'
              }}
              className="waiter-cart-empty-box p-6 text-center text-slate-400 border border-dashed border-[#1e293b] rounded-xl bg-[#080c16]"
            >
              <p className="text-xs font-medium text-slate-300">No active orders or items for {orderType === 'dine_in' ? currentTable : orderType.toUpperCase()}.</p>
              <p className="text-[11px] mt-1 text-slate-500">Tap items on the menu grid to add.</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Pinned Controls: Kitchen Note & Dispatched Actions */}
      <div 
        id="waiter-cart-bottom-section"
        className="p-3 bg-[#0b1120] border-t border-slate-800 space-y-2 shrink-0"
        style={{ backgroundColor: '#0b1120' }}
      >
        <input
          id="waiter-cart-kitchen-note-input"
          type="text"
          value={cartSpecialNotes}
          onChange={e => setCartSpecialNotes(e.target.value)}
          placeholder="Special kitchen instruction..."
          style={{
            backgroundColor: '#080c16',
            color: '#ffffff',
            border: '1px solid #1e293b'
          }}
          className="waiter-cart-input w-full px-3 py-1.5 bg-[#080c16] border border-[#1e293b] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 transition-colors"
        />

        {/* Primary Action Buttons: [Save / Hold], [Request Bill], and [Send KOT] */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {/* Save Draft / Hold Button */}
            <button
              id="waiter-save-hold-btn"
              type="button"
              onClick={handleSaveHoldOrder}
              disabled={cart.length === 0}
              style={{
                backgroundColor: '#1e293b',
                color: '#f1f5f9',
                fontWeight: 700,
                fontSize: '13px',
                border: '1px solid #3b82f6',
                borderRadius: '8px',
                padding: '10px 14px',
                cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
              className="waiter-hold-btn hover:bg-blue-900/60 hover:text-white flex items-center justify-center gap-1.5 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs select-none"
              title="Save / Hold this table's cart draft to attend to another table"
            >
              <span>💾</span>
              <span>Save / Hold</span>
            </button>

            {/* Request Bill Button */}
            <button
              type="button"
              onClick={handleRequestBill}
              disabled={!currentTable || (cart.length === 0 && tableActiveKots.length === 0)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-98 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>
                {pendingBillRequestForCurrentTable ? 'Bill Pending' : 'Request Bill'}
              </span>
            </button>
          </div>

          {/* Send KOT Button (Deep Maroon Accent) */}
          <button
            type="button"
            onClick={handleSendKOT}
            disabled={cart.length === 0 || isSendingKot}
            style={{
              backgroundColor: '#7a0c1a',
              background: '#7a0c1a',
            }}
            className="w-full bg-[#7a0c1a] hover:bg-[#8f1020] active:bg-[#4a030c] text-white font-bold py-2.5 px-3 rounded-xl shadow-xs text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSendingKot ? 'Sending...' : 'Send KOT'}</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      {cancelModalTarget && (
        <KOTCancelModal
          isOpen={!!cancelModalTarget}
          kot={cancelModalTarget.kot}
          itemIndex={cancelModalTarget.itemIndex}
          onConfirmCancel={handleConfirmCancel}
          onClose={() => setCancelModalTarget(null)}
        />
      )}

      {modifyModalTarget && (
        <KOTModifyModal
          kot={modifyModalTarget.kot}
          itemIndex={modifyModalTarget.itemIndex}
          onConfirm={handleConfirmModify}
          onClose={() => setModifyModalTarget(null)}
        />
      )}
    </div>
  );
};
