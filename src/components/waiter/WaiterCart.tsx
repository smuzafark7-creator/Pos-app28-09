import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { KOT, ItemServeType, ServeType, CartItem } from '../../types';
import { 
  Phone, 
  Send, 
  Receipt, 
  Trash2, 
  Edit3,
  Printer
} from 'lucide-react';
import { KOTCancelModal } from '../KOTCancelModal';
import { KOTModifyModal } from '../KOTModifyModal';

export interface WaiterCartProps {
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
  } = useApp();

  const currentTable = propTableNumber || cartTableNumber || 'Table 1';

  const [isSendingKot, setIsSendingKot] = useState<boolean>(false);
  const [editingNoteItemId, setEditingNoteItemId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState<string>('');

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
  const tableDraftsRef = useRef<Record<string, CartItem[]>>(() => {
    try {
      const saved = sessionStorage.getItem('zaffran_waiter_table_drafts');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const prevTableRef = useRef<string>(currentTable);

  // Synchronize draft cart when changing tables
  const handleTableChange = (newTable: string) => {
    if (newTable === currentTable) return;

    // 1. Save previous table's current punch items
    if (prevTableRef.current) {
      tableDraftsRef.current[prevTableRef.current] = [...cart];
      try {
        sessionStorage.setItem('zaffran_waiter_table_drafts', JSON.stringify(tableDraftsRef.current));
      } catch {
        // ignore
      }
    }

    // 2. Notify parent and AppContext
    if (onTableChange) {
      onTableChange(newTable);
    }
    setCartTableNumber(newTable);

    // 3. Restore newly selected table's draft cart
    const targetDraft = tableDraftsRef.current[newTable] || [];
    if (setCartItems) {
      setCartItems(targetDraft);
    }
    prevTableRef.current = newTable;
  };

  // Watch for external table changes (e.g. from header search or tables floor plan)
  useEffect(() => {
    if (currentTable && currentTable !== prevTableRef.current) {
      if (prevTableRef.current) {
        tableDraftsRef.current[prevTableRef.current] = [...cart];
        try {
          sessionStorage.setItem('zaffran_waiter_table_drafts', JSON.stringify(tableDraftsRef.current));
        } catch {
          // ignore
        }
      }
      const targetDraft = tableDraftsRef.current[currentTable] || [];
      if (setCartItems) {
        setCartItems(targetDraft);
      }
      prevTableRef.current = currentTable;
    }
  }, [currentTable, setCartItems]);

  // Continuously persist current cart changes for current table
  useEffect(() => {
    if (currentTable) {
      tableDraftsRef.current[currentTable] = cart;
    }
  }, [cart, currentTable]);

  // Active unbilled KOTs strictly for the currently selected table
  const tableActiveKots = useMemo(() => {
    return (kots || [])
      .filter(k => {
        if (k.branchId !== effectiveBranch) return false;
        if (k.orderType !== 'dine_in') return false;
        if (k.isBilled) return false;
        if (k.status === 'cancelled') return false;
        return isTableMatch(k.tableNumber, currentTable);
      })
      .sort((a, b) => {
        const timeDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (timeDiff !== 0) return timeDiff;
        return (a.kotNumber || '').localeCompare(b.kotNumber || '');
      });
  }, [kots, effectiveBranch, currentTable]);

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
    if (!currentTable) {
      showToast('Select Table', 'Please assign a table before sending KOT.', 'warning');
      return;
    }
    if (cart.length === 0) {
      showToast('Cart Empty', 'Add items to order before sending KOT.', 'warning');
      return;
    }

    setIsSendingKot(true);
    setTimeout(() => {
      const kot = sendKOT(currentTable);
      setIsSendingKot(false);
      if (kot) {
        // Clear saved draft for this table
        delete tableDraftsRef.current[currentTable];
        try {
          sessionStorage.setItem('zaffran_waiter_table_drafts', JSON.stringify(tableDraftsRef.current));
        } catch {
          // ignore
        }
        showToast('KOT Dispatched', `${kot.kotNumber} sent to Kitchen for ${currentTable}.`, 'success');
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
  };

  const handleRequestBill = () => {
    if (!currentTable) {
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

  return (
    <div 
      id="waiter-cart-panel"
      className="waiter-billing-panel w-full lg:w-[420px] bg-[#0b1120] border-l border-[#8b0000]/60 flex flex-col justify-between shrink-0 shadow-lg z-10 text-slate-200 select-none font-sans"
      style={{ backgroundColor: '#0b1120' }}
    >
      
      {/* Top Section: Table Selector, Selected Table Header & Running Total */}
      <div 
        id="waiter-cart-top-section"
        className="p-3.5 border-b border-slate-800 space-y-2.5 shrink-0 bg-[#0b1120]"
        style={{ backgroundColor: '#0b1120' }}
      >
        {/* Table Selector Dropdown */}
        <div className="space-y-1.5">
          <div className="relative">
            <select
              id="waiter-table-selector"
              value={currentTable}
              onChange={e => handleTableChange(e.target.value)}
              style={{ backgroundColor: '#080c16', border: '1px solid #1e293b', color: '#ffffff' }}
              className="w-full pl-3 pr-8 py-2 bg-[#080c16] border border-slate-800 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-slate-700 shadow-xs cursor-pointer"
            >
              {(filteredBranchTables.length > 0 ? filteredBranchTables : safeBranchTables).map(tbl => {
                const normStatus = (tbl.status === 'ready' || tbl.status === 'waiting') ? 'occupied' : tbl.status;
                return (
                  <option key={tbl.id} value={tbl.name} className="bg-[#0b1120] text-white">
                    {tbl.name} • ({tbl.capacity} Seats) • {normStatus.toUpperCase()}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Selected Table Sub-Header & Running Total */}
          <div 
            id="waiter-table-info-bar"
            className="waiter-table-info-bar flex items-center justify-between px-2.5 py-1.5 bg-[#0d1527] border-[1.5px] border-[rgba(255,255,255,0.12)] hover:border-[#10B981] transition-all duration-200 rounded-lg text-[11px]"
            style={{ backgroundColor: '#0d1527' }}
          >
            <div className="flex items-center gap-1.5 text-slate-400 truncate">
              <span className="font-semibold text-white">{selectedTable?.name || currentTable}</span>
              <span>•</span>
              <span>{selectedTable?.capacity || 4} Seats</span>
              {selectedTable?.assignedWaiterName && (
                <>
                  <span>•</span>
                  <span className="text-emerald-400 font-medium">{selectedTable.assignedWaiterName}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] text-slate-400">Total:</span>
              <span className="font-bold text-emerald-400 text-xs">
                ₹{totalTableAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Customer / Guest Information */}
        <div className="w-full grid grid-cols-2 gap-2">
          {/* Customer Mobile / Phone */}
          <div className="relative w-full min-w-0">
            <Phone className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              id="waiter-customer-mobile-input"
              type="tel"
              value={cartCustomerMobile}
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
              value={cartCustomerName}
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

      {/* Middle Scrollable: Order Items List (Flat Cashier-Style) */}
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
                <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-slate-400 pb-1 border-b border-slate-800/60">
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
                      className="waiter-cart-kot-print-btn p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer border border-[#334155] flex items-center justify-center shrink-0"
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
                    <span 
                      className={`waiter-cart-kot-status-badge px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border border-[#334155] ${
                        kot.status === 'ready' 
                          ? 'bg-emerald-950/60 text-emerald-400' 
                          : kot.status === 'picked_up'
                          ? 'bg-cyan-950/60 text-cyan-300'
                          : kot.status === 'preparing'
                          ? 'bg-amber-950/60 text-amber-400'
                          : 'bg-slate-800 text-slate-200'
                      }`}
                      style={{ border: '1px solid #334155' }}
                    >
                      {kot.status === 'picked_up' ? 'Picked Up' : (kot.status || 'NEW')}
                    </span>
                  </div>
                  <span className="text-emerald-400 font-bold">₹{kot.totalAmount.toFixed(2)}</span>
                </div>

                {/* Compact Item Rows with horizontal dividers */}
                <div className="divide-y divide-slate-800/60">
                  {(kot.items || []).map((it, idx) => {
                    const itName = it.name || (it as any)?.menuItem?.name || 'Item';
                    const match = itName.match(/^(.*?)\s*\((.*?)\)$/);
                    const baseName = match ? match[1].trim() : itName;
                    const variationName = match ? match[2].trim() : undefined;
                    const itRate = (it.rate ?? (it as any)?.menuItem?.price) || 0;
                    const isVoided = it.status === 'voided';

                    return (
                      <div key={idx} className={`flex items-center justify-between gap-2 py-2 px-1 text-xs ${isVoided ? 'opacity-60 bg-rose-950/10' : ''}`}>
                        {/* Left side: Item name with variation & rate below it */}
                        <div className="flex-1 min-w-0 pr-2">
                          <div 
                            className={`waiter-cart-item-title font-semibold truncate leading-tight ${isVoided ? 'line-through text-slate-400' : ''}`}
                            style={{
                              color: isVoided ? '#94a3b8' : '#ffffff',
                              fontWeight: 750,
                              fontSize: '13px',
                              lineHeight: '1.3'
                            }}
                          >
                            {baseName}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium truncate mt-0.5">
                            {variationName && (
                              <span 
                                className="waiter-cart-portion-tag font-bold"
                                style={{
                                  color: '#fbbf24',
                                  fontWeight: 700,
                                  fontSize: '11px'
                                }}
                              >
                                {variationName}
                              </span>
                            )}
                            {variationName && <span className="text-slate-600">•</span>}
                            <span 
                              className="waiter-cart-rate-tag font-bold"
                              style={{
                                color: '#10b981',
                                fontWeight: 800,
                                fontSize: '13px'
                              }}
                            >
                              ₹{itRate.toFixed(2)}
                            </span>
                            {it.serveType === 'PARCEL' && (
                              <>
                                <span className="text-slate-600">•</span>
                                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                                  [PARCEL]
                                </span>
                              </>
                            )}
                            {isVoided && (
                              <>
                                <span className="text-slate-600">•</span>
                                <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">
                                  [CANCELLED]
                                </span>
                              </>
                            )}
                            {it.notes && (
                              <>
                                <span className="text-slate-600">•</span>
                                <span className="text-amber-400 font-medium">
                                  Note: {it.notes}
                                </span>
                              </>
                            )}
                            {isVoided && it.voidReason && (
                              <>
                                <span className="text-slate-600">•</span>
                                <span className="text-rose-400/80 italic">
                                  Voided: {it.voidReason}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Right side: Qty badge, Total Price, and Void action */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-bold text-xs min-w-7 text-center ${isVoided ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                            ×{it.quantity}
                          </span>
                          <div className={`w-16 text-right font-bold text-xs whitespace-nowrap ${isVoided ? 'line-through text-slate-500' : 'text-emerald-400'}`}>
                            ₹{(itRate * it.quantity).toFixed(2)}
                          </div>
                          {!isVoided ? (
                            <button
                              type="button"
                              onClick={() => setCancelModalTarget({ kot, itemIndex: idx })}
                              className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-800/40 transition-colors cursor-pointer shrink-0"
                              title="Void item"
                              aria-label={`Void ${itName}`}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-400/70 hover:text-rose-400" />
                            </button>
                          ) : (
                            <div className="w-6 h-6 shrink-0" />
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
              <div className="flex items-center justify-between px-1 pb-1 text-[11px] font-semibold text-amber-400 border-b border-slate-800/60">
                <span 
                  id="waiter-cart-new-punch-badge"
                  className="waiter-new-punch-badge inline-flex items-center"
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    color: '#fbbf24',
                    fontWeight: 800,
                    fontSize: '11px',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '6px',
                    padding: '2px 8px'
                  }}
                >
                  NEW PUNCH ITEMS ({cart.length})
                </span>
                <button
                  type="button"
                  onClick={handleClearCart}
                  className="text-rose-400 hover:text-rose-300 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              </div>

              <div className="divide-y divide-slate-800/60">
                {(cart || []).map(cartItem => {
                  const match = cartItem.item.name.match(/^(.*?)\s*\((.*?)\)$/);
                  const baseName = match ? match[1].trim() : cartItem.item.name;
                  const variationName = match ? match[2].trim() : undefined;

                  return (
                    <div key={cartItem.item.id} className="py-2 px-1 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        {/* Left side: Item name (bold/clear) with variation & rate below it */}
                        <div className="flex-1 min-w-0 pr-2">
                          <div 
                            className="waiter-cart-item-title font-semibold truncate leading-tight"
                            style={{
                              color: '#ffffff',
                              fontWeight: 750,
                              fontSize: '13px',
                              lineHeight: '1.3'
                            }}
                          >
                            {baseName}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium truncate mt-0.5">
                            {variationName && (
                              <span 
                                className="waiter-cart-portion-tag font-bold"
                                style={{
                                  color: '#fbbf24',
                                  fontWeight: 700,
                                  fontSize: '11px'
                                }}
                              >
                                {variationName}
                              </span>
                            )}
                            {variationName && <span className="text-slate-600">•</span>}
                            <span 
                              className="waiter-cart-rate-tag font-bold"
                              style={{
                                color: '#10b981',
                                fontWeight: 800,
                                fontSize: '13px'
                              }}
                            >
                              ₹{cartItem.item.price.toFixed(2)}
                            </span>
                            {cartItem.serveType === 'PARCEL' && (
                              <>
                                <span className="text-slate-600">•</span>
                                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                                  [PARCEL]
                                </span>
                              </>
                            )}
                            {cartItem.notes && (
                              <>
                                <span className="text-slate-600">•</span>
                                <span className="text-amber-400 font-medium">
                                  Note: {cartItem.notes}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Right side: Stepper [- Qty +], Item Total Price, and red Trash button */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Stepper [- Qty +] */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(cartItem.item.id, -1)}
                              className="waiter-cart-qty-btn-minus w-5 h-5 rounded flex items-center justify-center font-bold text-xs cursor-pointer active:scale-95 transition-colors hover:bg-slate-700"
                              style={{
                                backgroundColor: '#1e293b',
                                color: '#ffffff',
                                border: '1px solid #334155',
                                borderRadius: '6px'
                              }}
                              title="Decrease quantity"
                              aria-label="Decrease quantity"
                            >
                              -
                            </button>
                            <span className="w-5 text-center font-bold text-white text-xs">
                              {cartItem.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(cartItem.item.id, 1)}
                              className="w-5 h-5 rounded bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center font-bold text-xs cursor-pointer active:scale-95"
                            >
                              +
                            </button>
                          </div>

                          {/* Line Total */}
                          <div className="w-16 text-right font-bold text-xs text-emerald-400 whitespace-nowrap">
                            ₹{(cartItem.item.price * cartItem.quantity).toFixed(2)}
                          </div>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => removeFromCart(cartItem.item.id)}
                            className="w-6 h-6 rounded flex items-center justify-center text-rose-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-800/40 transition-colors cursor-pointer shrink-0"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Sub-row: Dine-In vs Parcel Toggle & Note */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-500 font-medium">Order:</span>
                          <select
                            id={`waiter-cart-order-select-${cartItem.item.id}`}
                            value={cartItem.serveType || 'DINE_IN'}
                            onChange={e => updateCartItemServeType(cartItem.item.id, e.target.value as ItemServeType)}
                            className="waiter-cart-order-select cursor-pointer transition-colors"
                            style={{
                              backgroundColor: '#0f172a',
                              color: '#f1f5f9',
                              fontWeight: 600,
                              fontSize: '12px',
                              border: '1px solid #334155',
                              borderRadius: '6px',
                              padding: '2px 8px',
                              outline: 'none'
                            }}
                          >
                            <option value="DINE_IN" style={{ backgroundColor: '#0f172a', color: '#ffffff' }} className="bg-[#0f172a] text-white">Dine-In</option>
                            <option value="PARCEL" style={{ backgroundColor: '#0f172a', color: '#ffffff' }} className="bg-[#0f172a] text-amber-400 font-semibold">Parcel</option>
                          </select>
                        </div>

                        {editingNoteItemId === cartItem.item.id ? (
                          <div className="flex items-center gap-1 flex-1 max-w-[180px]">
                            <input
                              type="text"
                              value={tempNoteText}
                              onChange={e => setTempNoteText(e.target.value)}
                              placeholder="e.g. Less spicy"
                              className="w-full text-[11px] bg-[#080d1a] border border-slate-700 rounded px-1.5 py-0.5 text-white placeholder-slate-500"
                              autoFocus
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  updateCartItemNotes(cartItem.item.id, tempNoteText);
                                  setEditingNoteItemId(null);
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                updateCartItemNotes(cartItem.item.id, tempNoteText);
                                setEditingNoteItemId(null);
                              }}
                              className="text-[10px] px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium cursor-pointer"
                            >
                              OK
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNoteItemId(cartItem.item.id);
                              setTempNoteText(cartItem.notes || '');
                            }}
                            className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 truncate max-w-[160px] cursor-pointer"
                          >
                            <Edit3 className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{cartItem.notes || '+ Note'}</span>
                          </button>
                        )}
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
              <p className="text-xs font-medium text-slate-300">No active orders or items for {currentTable}.</p>
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

        {/* Primary Action Buttons: Solid Emerald for KOT, Orange/Amber for Request Bill */}
        <div className="grid grid-cols-2 gap-2">
          {/* Send KOT Button */}
          <button
            type="button"
            onClick={handleSendKOT}
            disabled={cart.length === 0 || isSendingKot}
            className="bg-[#8b0000] hover:bg-[#730000] text-white font-bold py-2.5 rounded-xl shadow-xs text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSendingKot ? 'Sending...' : 'Send KOT'}</span>
          </button>

          {/* Request Bill Button */}
          <button
            type="button"
            onClick={handleRequestBill}
            disabled={!currentTable || (cart.length === 0 && tableActiveKots.length === 0)}
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-98 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>
              {pendingBillRequestForCurrentTable ? 'Bill Pending' : 'Request Bill'}
            </span>
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
