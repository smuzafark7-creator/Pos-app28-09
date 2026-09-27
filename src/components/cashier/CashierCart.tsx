import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { KOT, PaymentMethod, OrderType, ServeType, ItemServeType, SavedActiveOrder } from '../../types';
import { 
  Send, 
  Trash2, 
  Percent, 
  Split, 
  Gift, 
  Printer, 
  CreditCard, 
  QrCode, 
  Banknote, 
  Clock,
  Phone,
  ShieldCheck,
  ShieldAlert,
  BadgePercent,
  Tag,
  X,
  Save,
  Smartphone,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';
import { KOTCancelModal } from '../KOTCancelModal';
import { KOTModifyModal } from '../KOTModifyModal';
import { BillModal } from '../BillModal';

export interface CashierCartProps {
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  tableNumber: string;
  setTableNumber: (table: string) => void;
  activeSessionKots: KOT[];
}

export const CashierCart: React.FC<CashierCartProps> = ({
  orderType,
  setOrderType,
  tableNumber,
  setTableNumber,
  activeSessionKots,
}) => {
  const {
    cart,
    updateCartQuantity,
    updateCartItemServeType,
    removeFromCart,
    clearCart,
    cartCustomerName,
    setCartCustomerName,
    cartCustomerMobile,
    setCartCustomerMobile,
    cartSpecialNotes,
    setCartSpecialNotes,
    cartDiscountPercent,
    setCartDiscountPercent,
    cartCustomDiscount,
    setCartCustomDiscount,
    currentUser,
    sendKOT,
    holdOrder,
    savedActiveOrders,
    saveActiveOrder,
    isCurrentOrderSaved,
    isOrderSettled,
    isBillPrinted,
    setIsBillPrinted,
    generateBill,
    openReceiptModal,
    openKOTModal,
    branchTables,
    voidKOTItem,
    updateKOTStatus,
    showToast,
    addToCart,
    menuItems,
    cartTakeawayId,
    startNewTakeawayOrder,
    selectTakeawayOrder,
    kots,
    currentBranch,
    restaurantSettings,
  } = useApp();

  const [cartPaymentMethod, setCartPaymentMethod] = useState<PaymentMethod>('cash');
  const [cartIsComplimentary, setCartIsComplimentary] = useState<boolean>(false);
  const [cartBogoActive, setCartBogoActive] = useState<boolean>(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState<boolean>(false);
  const [tempDiscountPercent, setTempDiscountPercent] = useState<number>(cartDiscountPercent);
  const [tempDiscountAmount, setTempDiscountAmount] = useState<number>(cartCustomDiscount);
  const [tempDiscountReason, setTempDiscountReason] = useState<string>('Manager Discretion');
  const [supervisorPin, setSupervisorPin] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

  // Group active unbilled takeaway tickets and saved active drafts for quick switching
  const allTakeawayTickets = useMemo(() => {
    if (orderType === 'dine_in') return [];
    const effectiveBranch = currentBranch === 'all' ? 'main' : currentBranch;
    const unbilledTakeaways = kots.filter(
      k =>
        k.branchId === effectiveBranch &&
        (k.orderType === 'takeaway' || k.orderType === 'parcel' || k.orderType === 'delivery') &&
        !k.isBilled &&
        k.status !== 'cancelled'
    );
    const map = new Map<string, { id: string; customerName?: string; customerMobile?: string; kotCount: number; totalAmount: number; isDraft?: boolean }>();
    
    // 1. Unbilled KOTs
    unbilledTakeaways.forEach(k => {
      const id = k.takeawayId || (k.kotNumber ? `TK-${k.kotNumber.replace(/\D/g, '').slice(-3)}` : 'TK-101');
      const existing = map.get(id);
      if (existing) {
        existing.kotCount += 1;
        existing.totalAmount += k.totalAmount;
        if (!existing.customerName && k.customerName) existing.customerName = k.customerName;
        if (!existing.customerMobile && k.customerMobile) existing.customerMobile = k.customerMobile;
      } else {
        map.set(id, {
          id,
          customerName: k.customerName,
          customerMobile: k.customerMobile,
          kotCount: 1,
          totalAmount: k.totalAmount,
          isDraft: false,
        });
      }
    });

    // 2. Saved active drafts (held orders without KOT or with additional drafts)
    (Object.values(savedActiveOrders || {}) as SavedActiveOrder[]).forEach(saved => {
      if (saved.orderType !== 'dine_in' && saved.takeawayId) {
        const id = saved.takeawayId;
        const existing = map.get(id);
        if (existing) {
          existing.totalAmount += saved.subtotal;
          if (!existing.customerName && saved.customerName) existing.customerName = saved.customerName;
          if (!existing.customerMobile && saved.customerMobile) existing.customerMobile = saved.customerMobile;
        } else {
          map.set(id, {
            id,
            customerName: saved.customerName,
            customerMobile: saved.customerMobile,
            kotCount: 0,
            totalAmount: saved.subtotal,
            isDraft: true,
          });
        }
      }
    });

    // Ensure the current active ticket is included ONLY IF it is an active draft with items, or settled, or saved
    const currentId = cartTakeawayId || 'TK-101';
    const orderKey = `takeaway:${currentId}`;
    const isSaved = !!savedActiveOrders[orderKey];
    const isOccupied = cart.length > 0 || isOrderSettled || isSaved;
    if (isOccupied && !map.has(currentId)) {
      map.set(currentId, {
        id: currentId,
        customerName: cartCustomerName || undefined,
        customerMobile: cartCustomerMobile || undefined,
        kotCount: 0,
        totalAmount: cart.reduce((acc, i) => acc + i.item.price * i.quantity, 0),
        isDraft: true,
      });
    }
    return Array.from(map.values());
  }, [kots, savedActiveOrders, currentBranch, orderType, cartTakeawayId, cartCustomerName, cartCustomerMobile, cart, isOrderSettled]);

  const cartDiscountAmount = cartCustomDiscount;

  const [isSendingKot, setIsSendingKot] = useState<boolean>(false);
  const [isSettling, setIsSettling] = useState<boolean>(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState<boolean>(false);

  // Save & E-Bill State
  const [isEBillModalOpen, setIsEBillModalOpen] = useState<boolean>(false);
  const [eBillPhone, setEBillPhone] = useState<string>('');
  const [eBillChannel, setEBillChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [isSendingEBill, setIsSendingEBill] = useState<boolean>(false);

  // Modals
  const [cancelModalTarget, setCancelModalTarget] = useState<{ kot: KOT; itemIndex?: number } | null>(null);
  const [modifyModalTarget, setModifyModalTarget] = useState<{ kot: KOT; itemIndex: number } | null>(null);

  const safeBranchTables = Array.isArray(branchTables) ? branchTables : [];
  const selectedTable = safeBranchTables.find(t => t?.name?.toLowerCase() === tableNumber?.toLowerCase());

  const cartItems = cart || [];
  const hasUnsavedItems = cartItems.length > 0 && cartItems.some(item => item.isNew || !item.isSaved);
  const allItemsSaved = cartItems.length > 0 && !hasUnsavedItems;

  // Running amounts
  const runningKotsTotal = activeSessionKots.reduce((acc, k) => acc + k.totalAmount, 0);
  const newCartTotal = cart.reduce((acc, i) => acc + i.item.price * i.quantity, 0);
  const rawSubtotal = runningKotsTotal + newCartTotal;

  // BOGO calculation
  const bogoDiscount = useMemo(() => {
    if (!cartBogoActive) return 0;
    if (cart.length > 0) {
      const minPriceItem = [...cart].sort((a, b) => a.item.price - b.item.price)[0];
      return minPriceItem ? minPriceItem.item.price : 0;
    }
    return 0;
  }, [cartBogoActive, cart]);

  // Discount computation
  const totalDiscount = useMemo(() => {
    if (cartIsComplimentary) return rawSubtotal;
    let disc = 0;
    if (cartDiscountPercent > 0) {
      disc += (rawSubtotal * cartDiscountPercent) / 100;
    }
    if (cartDiscountAmount > 0) {
      disc += cartDiscountAmount;
    }
    disc += bogoDiscount;
    return Math.min(rawSubtotal, disc);
  }, [rawSubtotal, cartDiscountPercent, cartDiscountAmount, bogoDiscount, cartIsComplimentary]);

  const discountedSubtotal = Math.max(0, rawSubtotal - totalDiscount);
  const cgstPercent = restaurantSettings?.cgstPercent ?? 5.0;
  const sgstPercent = restaurantSettings?.sgstPercent ?? 5.0;
  const cgstAmount = cartIsComplimentary ? 0 : (discountedSubtotal * (cgstPercent / 100));
  const sgstAmount = cartIsComplimentary ? 0 : (discountedSubtotal * (sgstPercent / 100));
  const taxAmount = cgstAmount + sgstAmount;
  const finalTotal = Math.round(discountedSubtotal + taxAmount);

  const settleBill = () => {
    return generateBill(cartPaymentMethod, undefined, totalDiscount);
  };

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
    if (hasUnsavedItems || !isOrderSettled) return; // Strictly blocked until order is settled and no unsaved items
    if (orderType === 'dine_in' && !tableNumber) {
      showToast('Select Table', 'Please assign a table before sending KOT.', 'warning');
      return;
    }
    if (cart.length === 0 && !isOrderSettled) {
      return;
    }

    setIsSendingKot(true);
    setTimeout(() => {
      const kot = sendKOT(orderType === 'dine_in' ? tableNumber : undefined);
      setIsSendingKot(false);
      if (kot) {
        showToast('KOT Dispatched', `${kot.kotNumber.startsWith('KOT-') ? kot.kotNumber : `KOT #${kot.kotNumber}`} sent to kitchen.`, 'success');
      }
    }, 250);
  };

  const handleSaveRunningOrder = () => {
    if (!hasUnsavedItems || isOrderSettled) return; // Clicking does nothing if no unsaved items or already settled
    if (cart.length === 0 && rawSubtotal <= 0) return;

    if (orderType === 'dine_in' && !tableNumber) {
      showToast('Select Table', 'Please assign a table before saving order.', 'warning');
      return;
    }

    // Saves current order state to "Active Orders" (Draft/Held state).
    // DO NOT create or send KOT to Kitchen/KDS.
    // Retains active cart and ticket in view.
    saveActiveOrder(false);
  };

  const handleSettle = () => {
    if (hasUnsavedItems || !allItemsSaved || isOrderSettled || isSettling) return; // Strictly blocked if unsaved items exist
    if (rawSubtotal <= 0 && cart.length === 0) return;

    setIsSettling(true);
    setTimeout(() => {
      // Marks order as Paid & Settled, keeps cart and ticket in view, opens Paid Tax Invoice
      const bill = settleBill();
      setIsSettling(false);
      if (bill) {
        openReceiptModal(bill);
      }
    }, 250);
  };

  const handleSaveAndPrint = () => {
    if (isOrderSettled || isSettling) return; // Locked once settled or currently processing
    if (cart.length === 0 && rawSubtotal <= 0) return;
    if (isBillPrinted && !hasUnsavedItems) return; // One-time print only: locked after clicking until cart modified

    if (orderType === 'dine_in' && !tableNumber) {
      showToast('Select Table', 'Please assign a table before saving order.', 'warning');
      return;
    }

    setIsSettling(true);
    setTimeout(() => {
      // Saves order to "Active Orders" (or triggers print for already saved order) and opens thermal estimate/bill print preview.
      // DO NOT create or send KOT to Kitchen/KDS.
      // Keep order active on screen ready for payment.
      const estimateBill = saveActiveOrder(true);
      setIsBillPrinted(true);
      setIsSettling(false);
      if (estimateBill) {
        openReceiptModal(estimateBill);
      }
    }, 200);
  };

  const handleOpenEBillModal = () => {
    if (rawSubtotal <= 0) {
      showToast('No Order', 'There are no items to settle.', 'warning');
      return;
    }
    setEBillPhone(cartCustomerMobile || '');
    setIsEBillModalOpen(true);
  };

  const handleConfirmEBill = () => {
    const cleanPhone = eBillPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      showToast('Invalid Mobile', 'Please enter a valid 10-digit mobile number.', 'warning');
      return;
    }

    setIsSendingEBill(true);
    setCartCustomerMobile(cleanPhone);

    setTimeout(() => {
      const bill = settleBill();
      setIsSendingEBill(false);
      setIsEBillModalOpen(false);

      if (bill) {
        const channelName = eBillChannel === 'whatsapp' ? 'WhatsApp' : 'SMS';
        showToast(
          'E-Bill Dispatched',
          `Bill #${bill.billNumber} (₹${bill.total.toFixed(2)}) sent to +91 ${cleanPhone} via ${channelName}.`,
          'success'
        );
      }
    }, 250);
  };

  return (
    <div id="cashier-billing-panel" className="w-full lg:w-[460px] xl:w-[480px] shrink-0 overflow-hidden bg-[#070b12] border-l border-[#8b0000]/60 h-full flex flex-col shadow-lg z-10 text-slate-100 select-none font-sans">
      {/* Top Section: Order Type, Table Selector, Customer Details */}
      <div className="p-2 pt-1 border-b border-slate-800/60 space-y-1.5 flex-shrink-0 bg-[#070b12]">
        
        {/* Order Type Switcher: All 3 Buttons Permanently Colored (Crimson, Navy, Amber) */}
        <div id="cashier-order-type-switcher" className="flex w-full items-center gap-2 bg-transparent p-0 border-0">
          {/* 1. Dine In */}
          <button
            id="order-type-dine-in"
            type="button"
            onClick={() => setOrderType('dine_in')}
            className={`flex-1 py-2 text-center rounded-lg text-sm transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer ${
              orderType === 'dine_in'
                ? 'bg-[#8b0000] text-white font-bold ring-2 ring-white shadow-lg scale-[1.02] border border-red-400 z-10'
                : 'bg-[#700000] text-white/90 font-semibold hover:bg-[#800000] hover:text-white border border-red-900/50'
            }`}
          >
            <span>Dine In</span>
          </button>

          {/* 2. Takeaway */}
          <button
            id="order-type-takeaway"
            type="button"
            onClick={() => setOrderType('takeaway')}
            className={`flex-1 py-2 text-center rounded-lg text-sm transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer ${
              orderType === 'takeaway'
                ? 'bg-[#1e3a8a] text-white font-bold ring-2 ring-white shadow-lg scale-[1.02] border border-blue-400 z-10'
                : 'bg-[#0b1e3b] text-white/90 font-semibold hover:bg-[#12284e] hover:text-white border border-blue-900/50'
            }`}
          >
            <span>Takeaway</span>
          </button>

          {/* 3. Delivery */}
          <button
            id="order-type-delivery"
            type="button"
            onClick={() => setOrderType('delivery')}
            className={`flex-1 py-2 text-center rounded-lg text-sm transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer ${
              orderType === 'delivery'
                ? 'bg-[#b45309] text-white font-bold ring-2 ring-white shadow-lg scale-[1.02] border border-amber-400 z-10'
                : 'bg-[#92400e] text-white/90 font-semibold hover:bg-[#a34810] hover:text-white border border-amber-900/50'
            }`}
          >
            <span>Delivery</span>
          </button>
        </div>

        {/* Table Selector (for Dine In) */}
        {orderType === 'dine_in' ? (
          <div className="space-y-1">
            <div className="relative">
              <select
                value={tableNumber}
                onChange={e => setTableNumber(e.target.value)}
                className="w-full pl-2.5 pr-7 py-1.5 bg-[#0e1624] border border-slate-800/60 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-slate-700 shadow-xs cursor-pointer"
              >
                {(branchTables || []).map(tbl => {
                  const normStatus = (tbl.status === 'ready' || tbl.status === 'waiting') ? 'occupied' : tbl.status;
                  return (
                    <option key={tbl.id} value={tbl.name} className="bg-[#0f172a] text-white">
                      {tbl.name} • ({tbl.capacity} Seats) • {normStatus.toUpperCase()}
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedTable && (
              <div id="cashier-table-info-summary" className="flex items-center justify-between px-2.5 py-1.5 bg-[#0e1624] border border-slate-800/60 rounded-lg text-sm">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="table-name text-white font-bold text-sm" style={{ color: '#ffffff' }}>
                    {selectedTable.name}
                  </span>
                  <span className="table-seats text-slate-400 text-sm" style={{ color: '#94a3b8' }}>
                    • {selectedTable.capacity} Seats
                  </span>
                  {selectedTable.assignedWaiterName && (
                    <span className="table-waiter text-emerald-400 font-semibold text-sm" style={{ color: '#34d399' }}>
                      • {selectedTable.assignedWaiterName}
                    </span>
                  )}
                </div>
                <span className="font-bold text-emerald-400 shrink-0 text-sm" style={{ color: '#34d399' }}>
                  ₹{rawSubtotal.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Split Top Order Row: Left "+ New Order" & Right Takeaway Badge */}
            <div className="flex items-center justify-between gap-2 w-full mb-2">
              {/* Left Element: + New Order Button with Saved / Settled Validation */}
              {(() => {
                const isNewOrderEnabled = isCurrentOrderSaved || isOrderSettled;
                return (
                  <button
                    id="cashier-new-order-btn"
                    type="button"
                    onClick={() => {
                      if (!isNewOrderEnabled) {
                        showToast(
                          'Save Order First',
                          cart.length > 0
                            ? 'Please save or settle current order before starting a new order.'
                            : 'Save current order or settle bill to start a new order.',
                          'warning'
                        );
                        return;
                      }
                      startNewTakeawayOrder();
                    }}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all shrink-0 bg-slate-800 text-emerald-400 border border-emerald-500/50 hover:bg-slate-700 ${
                      !isNewOrderEnabled
                        ? 'opacity-60 cursor-not-allowed select-none'
                        : 'cursor-pointer active:scale-98 shadow-xs'
                    }`}
                    title={
                      !isNewOrderEnabled
                        ? cart.length > 0
                          ? 'Unsaved changes in active cart. Save or settle to start a new order.'
                          : 'Save current order or settle bill to start a new order'
                        : 'Start fresh takeaway order ticket'
                    }
                  >
                    + New Order
                  </button>
                );
              })()}

              {/* Right Element: Expanded Takeaway Badge & Price */}
              <div className="flex-1 min-w-[240px] flex items-center justify-between gap-4 px-3 py-1.5 bg-[#0e1624] border border-slate-800/60 rounded-xl shadow-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    id="cashier-takeaway-id-badge"
                    className="cashier-takeaway-solid-badge px-2.5 py-1 rounded-md text-white font-bold text-xs tracking-wide shrink-0 shadow-sm"
                    style={{
                      backgroundColor: '#1e3a8a',
                      background: '#1e3a8a',
                      color: '#ffffff',
                      borderColor: '#3b82f6',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                    }}
                  >
                    {orderType === 'delivery' ? 'DELIVERY' : 'TAKEAWAY'} #{cartTakeawayId || 'TK-102'}
                  </span>
                  {cartCustomerName ? (
                    <span className="text-white font-medium truncate text-[11px]">
                      {cartCustomerName}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px] truncate whitespace-nowrap">Direct Counter</span>
                  )}
                </div>
                <span className="text-emerald-400 font-bold text-sm tracking-wide shrink-0 ml-auto pl-2 whitespace-nowrap">
                  ₹{rawSubtotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Active Takeaway Ticket Tokens List */}
            {allTakeawayTickets.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 text-xs no-scrollbar">
                <span className="text-slate-400 font-semibold text-xs shrink-0">Active:</span>
                {allTakeawayTickets.map(t => {
                  const isActive = t.id === cartTakeawayId;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => selectTakeawayOrder(t.id)}
                      className={`takeaway-ticket-chip shrink-0 cursor-pointer flex items-center gap-1 ${
                        isActive
                          ? 'takeaway-ticket-active bg-[#1e3a8a] text-white border border-blue-500 font-bold hover:bg-[#1d4ed8] active:bg-[#1e3a8a]'
                          : 'takeaway-ticket-inactive bg-slate-800/60 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white px-2 py-0.5 rounded-md text-xs font-medium'
                      }`}
                      style={
                        isActive
                          ? {
                              backgroundColor: '#1e3a8a',
                              background: '#1e3a8a',
                              border: '1px solid #3b82f6',
                              color: '#ffffff',
                              fontWeight: 700,
                              fontSize: '12px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              outline: 'none',
                              boxShadow: 'none',
                            }
                          : undefined
                      }
                    >
                      <span
                        className="takeaway-chip-text"
                        style={isActive ? { color: '#ffffff', fontWeight: 700 } : undefined}
                      >
                        #{t.id}{t.customerName ? ` (${t.customerName})` : ''} {t.totalAmount > 0 ? `• ₹${t.totalAmount}` : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Customer Name & Phone */}
        <div className="w-full grid grid-cols-2 gap-1.5">
          {/* Optional Guest Name */}
          <div className="w-full min-w-0">
            <input
              type="text"
              value={cartCustomerName}
              onChange={e => setCartCustomerName(e.target.value)}
              placeholder="Guest Name (Optional)"
              className="px-2.5 py-1 h-[30px] w-full text-xs text-white bg-[#0e1624] border border-slate-700/60 rounded-md focus:border-emerald-500 focus:outline-none transition-colors placeholder-slate-400"
            />
          </div>

          {/* Customer Mobile / Phone */}
          <div className="relative w-full min-w-0">
            <Phone className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="tel"
              value={cartCustomerMobile}
              onChange={e => setCartCustomerMobile(e.target.value.slice(0, 12))}
              placeholder="Phone (Optional)"
              maxLength={12}
              className="pl-7 pr-2 py-1 h-[30px] w-full text-xs text-white bg-[#0e1624] border border-slate-700/60 rounded-md focus:border-emerald-500 focus:outline-none transition-colors placeholder-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Cart Table Header */}
      <div className="px-3 py-1.5 flex items-center justify-between border-b border-slate-800/60 bg-[#070b12] shrink-0 select-none text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <span className="flex-1 min-w-0 text-left pl-1">ITEMS</span>
        <span className="w-20 text-center shrink-0">QTY</span>
        <span className="w-20 text-left shrink-0">PRICE</span>
      </div>

      {/* Middle Scrollable: Order Items & KOTs */}
      <div className="flex-1 overflow-y-auto flex flex-col bg-[#070b12] min-h-0">
        
        {/* Order Items List */}
        <div className="py-1 space-y-1.5 flex-1">
          {(activeSessionKots || []).map(kot => {
            return (
              <div key={kot.id} className="space-y-0.5">
                {/* Thin KOT Ribbon Header */}
                <div className="py-1 px-3 bg-[#0a0f18] border-y border-slate-800/60 flex items-center justify-between font-semibold uppercase tracking-wider rounded-xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className="kot-badge-ribbon waiter-cart-kot-header-badge px-2 py-0.5 rounded font-mono font-extrabold"
                      style={{
                        color: '#f8fafc',
                        fontWeight: 850,
                        fontSize: '13px'
                      }}
                    >
                      {kot.kotNumber.startsWith('KOT') ? kot.kotNumber : `KOT #${kot.kotNumber}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => openKOTModal(kot)}
                      className="waiter-cart-kot-print-btn text-white bg-slate-800 hover:bg-slate-700 border border-[#334155] px-1.5 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                      style={{ border: '1px solid #334155', backgroundColor: '#1e293b' }}
                      title="Print KOT Slip"
                      aria-label={`Print KOT ${kot.kotNumber}`}
                    >
                      <Printer className="w-3 h-3 text-white" />
                    </button>
                    <span 
                      className="waiter-cart-kot-status-badge text-slate-200 bg-slate-800 border border-[#334155] px-1.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider"
                      style={{ border: '1px solid #334155' }}
                    >
                      {kot.status === 'picked_up' ? 'Picked Up' : (kot.status || 'NEW')}
                    </span>
                  </div>
                  <span className="w-20 text-left text-emerald-400 font-bold shrink-0 text-sm" style={{ color: '#34d399' }}>
                    ₹{kot.totalAmount.toFixed(2)}
                  </span>
                </div>

                <div className="divide-y divide-slate-800/40">
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
                        className={`px-3 py-1 hover:bg-white/[0.03] transition-colors rounded-xs text-xs ${
                          isVoided ? 'opacity-60 bg-rose-950/10' : ''
                        }`}
                      >
                        <div className="min-h-[28px] flex items-center justify-between gap-1.5">
                          {/* Left side: Delete/Void icon + Dish Name (variant inline) + Unit Price */}
                          <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden pr-1 pl-1">
                            {!isVoided ? (
                              <button
                                type="button"
                                onClick={() => setCancelModalTarget({ kot, itemIndex: idx })}
                                className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                                title="Void / Cancel Item"
                                aria-label={`Void ${itName}`}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-400/70 hover:text-rose-400" />
                              </button>
                            ) : (
                              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                <span className="text-[10px] text-rose-500 font-bold">✕</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1 min-w-0 flex-1 truncate">
                              <span 
                                className={`waiter-cart-item-title font-medium truncate leading-tight ${isVoided ? 'line-through text-slate-500' : 'text-slate-100'}`}
                                style={{ color: isVoided ? '#94a3b8' : '#ffffff' }}
                              >
                                {baseName}
                              </span>
                              {variationName && (
                                <span className="text-amber-400 text-[11px] font-normal shrink-0">
                                  ({variationName})
                                </span>
                              )}
                              <span className={`text-xs font-medium ml-2 shrink-0 ${isVoided ? 'line-through text-slate-600' : 'text-slate-400'}`}>
                                • ₹{itRate.toFixed(2)}
                              </span>
                            </div>
                            {it.serveType === 'PARCEL' && (
                              <span className="text-[9px] font-bold text-amber-400 px-1 py-0.2 rounded bg-amber-950/60 border border-amber-800/40 shrink-0 uppercase">
                                P
                              </span>
                            )}
                            {isVoided && (
                              <span className="text-[9px] font-bold text-rose-400 px-1 py-0.2 rounded bg-rose-950/60 border border-rose-800/40 shrink-0">
                                VOID
                              </span>
                            )}
                          </div>

                          {/* Center: Slim quantity badge aligned with center QTY header */}
                          <div className="flex items-center justify-center shrink-0 w-16">
                            <span
                              className={`cart-saved-qty-badge font-extrabold text-[13px] text-center shrink-0 shadow-xs ${
                                isVoided ? 'line-through opacity-60' : ''
                              }`}
                              style={{
                                backgroundColor: isVoided ? '#334155' : '#ffffff',
                                background: isVoided ? '#334155' : '#ffffff',
                                color: isVoided ? '#94a3b8' : '#0f172a',
                                fontWeight: 800,
                                fontSize: '13px',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                minWidth: '28px',
                                textAlign: 'center',
                                display: 'inline-block',
                              }}
                            >
                              ×{it.quantity}
                            </span>
                          </div>

                          {/* Right side: Item total price left-aligned with fixed anchor expanding right */}
                          <div className={`w-20 text-left font-bold text-xs whitespace-nowrap shrink-0 ${isVoided ? 'line-through text-slate-500' : 'text-emerald-400'}`}>
                            ₹{(itRate * it.quantity).toFixed(2)}
                          </div>
                        </div>

                        {/* Attached note directly underneath item */}
                        {it.notes && (
                          <div className="pl-6 pr-2 pt-0.5 pb-0.5 flex items-center">
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-300/90 bg-amber-950/40 border border-amber-800/30 px-1.5 py-0.5 rounded font-normal">
                              <span className="text-amber-400/90 font-medium">Note:</span> {it.notes}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Cart Items */}
          {(cart || []).length > 0 && (
            <div className="space-y-0.5">
              {/* Thin Items Ribbon Header */}
              <div
                className={`py-1 px-3 flex items-center justify-between uppercase tracking-wider rounded-xs border-b border-slate-800/80 ${
                  hasUnsavedItems
                    ? 'bg-[#0a0f18] text-amber-400 font-semibold text-[10px]'
                    : 'cart-saved-items-ribbon bg-transparent text-slate-200 font-bold text-xs'
                }`}
                style={!hasUnsavedItems ? { backgroundColor: 'transparent' } : undefined}
              >
                <span className={!hasUnsavedItems ? 'saved-items-title text-slate-200 font-bold text-xs uppercase tracking-wider' : ''}>
                  {hasUnsavedItems
                    ? `NEW PUNCH ITEMS (${(cart || []).filter(c => c.isNew || !c.isSaved).length})`
                    : `SAVED ITEMS (${(cart || []).length})`}
                </span>
                <button
                  type="button"
                  onClick={clearCart}
                  className="clear-cart-btn text-red-400 hover:text-red-300 text-xs font-semibold flex items-center gap-1 cursor-pointer uppercase pr-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3 text-red-400" />
                  Clear
                </button>
              </div>

              <div className="divide-y divide-slate-800/40">
                {(cart || []).map(cartItem => {
                  const match = cartItem.item.name.match(/^(.*?)\s*\((.*?)\)$/);
                  const baseName = match ? match[1].trim() : cartItem.item.name;
                  const variationName = match ? match[2].trim() : undefined;
                  const isItemUnsaved = cartItem.isNew || !cartItem.isSaved;

                  return (
                    <div
                      key={cartItem.item.id}
                      className="px-3 py-1 hover:bg-white/[0.03] transition-colors rounded-xs text-xs"
                    >
                      <div className="min-h-[28px] flex items-center justify-between gap-1.5">
                        {/* Left: [🗑️] delete icon + Dish Name (with variant tag inline) + Unit Price + Status Badge */}
                        <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden pr-1 pl-1">
                          <button
                            type="button"
                            onClick={() => removeFromCart(cartItem.item.id)}
                            className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                            title="Delete item"
                            aria-label={`Delete ${cartItem.item.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400/70 hover:text-rose-400" />
                          </button>
                          <div className="flex items-center gap-1 min-w-0 flex-1 truncate">
                            <span 
                              className="waiter-cart-item-title font-medium text-slate-100 truncate leading-tight"
                              style={{ color: '#ffffff' }}
                            >
                              {baseName}
                            </span>
                            {variationName && (
                              <span className="text-amber-400 text-[11px] font-normal shrink-0">
                                ({variationName})
                              </span>
                            )}
                            <span className="text-xs text-slate-400 font-medium ml-2 shrink-0">
                              • ₹{cartItem.item.price.toFixed(2)}
                            </span>
                          </div>
                          {cartItem.serveType === 'PARCEL' && (
                            <span className="text-[9px] font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/40 shrink-0 uppercase">
                              PARCEL
                            </span>
                          )}
                        </div>

                        {/* Center: Interactive high-contrast quantity stepper [-] [ Qty ] [+] */}
                        <div className="flex items-center justify-center shrink-0 w-20">
                          <div
                            className="cart-stepper-borderless flex items-center gap-1.5"
                            style={{
                              background: 'transparent',
                              backgroundColor: 'transparent',
                              border: 'none',
                              boxShadow: 'none',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(cartItem.item.id, -1)}
                              className="cart-qty-btn-minus w-6 h-6 flex items-center justify-center rounded bg-slate-800 text-white hover:bg-slate-700 active:scale-95 font-bold text-sm cursor-pointer select-none transition-colors border-0"
                              title="Decrease quantity"
                              aria-label="Decrease quantity"
                            >
                              -
                            </button>
                            <span
                              className="cart-item-stepper-qty text-white font-extrabold text-sm min-w-[18px] text-center select-none"
                              style={{ color: '#ffffff' }}
                            >
                              {cartItem.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(cartItem.item.id, 1)}
                              className="cart-qty-btn-plus w-6 h-6 flex items-center justify-center rounded bg-[#1e3a8a] text-white hover:bg-[#2563eb] active:scale-95 font-bold text-sm cursor-pointer select-none transition-colors border-0"
                              title="Increase quantity"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Right: Item Total Price left-aligned with fixed anchor expanding right */}
                        <div className="w-20 text-left font-bold text-xs text-emerald-400 whitespace-nowrap shrink-0">
                          ₹{(cartItem.item.price * cartItem.quantity).toFixed(2)}
                        </div>
                      </div>

                      {/* Attached note directly underneath item */}
                      {cartItem.notes && (
                        <div className="pl-6 pr-2 pt-0.5 pb-0.5 flex items-center">
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-300/90 bg-amber-950/40 border border-amber-800/30 px-1.5 py-0.5 rounded font-normal">
                            <span className="text-amber-400/90 font-medium">Note:</span> {cartItem.notes}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeSessionKots.length === 0 && cart.length === 0 && (
            <div className="p-8 text-center text-slate-400 border border-dashed border-slate-800/60 rounded-xl bg-[#0a0f18]/60">
              <p className="text-xs font-semibold text-slate-200">Cart is currently empty.</p>
              <p className="text-[11px] mt-1 text-slate-500">
                {orderType === 'dine_in'
                  ? `Select dishes from the menu to build bill for ${tableNumber || 'selected table'}.`
                  : `Select dishes from the menu to build takeaway order #${cartTakeawayId || 'TK-102'}.`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Billing Computations & Checkout Controls */}
      <div className="px-2 py-1.5 bg-[#070b12] border-t border-slate-800/60 space-y-1 flex-shrink-0">
        {/* Quick Kitchen Instruction */}
        <div className="w-full">
          <input
            id="cashier-cart-kitchen-note"
            type="text"
            value={cartSpecialNotes}
            onChange={e => setCartSpecialNotes(e.target.value)}
            placeholder="Kitchen note (e.g. Less spicy)"
            className="w-full px-2.5 py-1 bg-[#0e1624] border border-slate-700/60 rounded-md text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* 1. Combined Offers & Total Row */}
        <div className="w-full flex items-center justify-between gap-1.5 px-3 py-1">
          {/* Left: Compact Offer Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {/* BOGO Offer */}
            <button
              id="cashier-cart-btn-bogo"
              type="button"
              onClick={() => setCartBogoActive(!cartBogoActive)}
              className={`px-2 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                cartBogoActive
                  ? 'bg-amber-600 text-white border-amber-500 shadow-xs font-semibold'
                  : 'bg-[#0e1624] text-slate-300 border-slate-700/60 hover:bg-slate-800'
              }`}
              title="Buy One Get One Free"
            >
              <Percent className="w-3 h-3 shrink-0" />
              <span>BOGO</span>
            </button>

            {/* Complimentary */}
            <button
              id="cashier-cart-btn-comp"
              type="button"
              onClick={() => setCartIsComplimentary(!cartIsComplimentary)}
              className={`px-2 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                cartIsComplimentary
                  ? 'bg-purple-600 text-white border-purple-500 shadow-xs font-semibold'
                  : 'bg-[#0e1624] text-slate-300 border-slate-700/60 hover:bg-slate-800'
              }`}
              title="Complimentary Order (100% off)"
            >
              <Gift className="w-3 h-3 shrink-0" />
              <span>Comp</span>
            </button>

            {/* Supervisor Discount / Custom Waiver */}
            <button
              id="cashier-cart-btn-discount"
              type="button"
              onClick={() => {
                setTempDiscountPercent(cartDiscountPercent);
                setTempDiscountAmount(cartCustomDiscount);
                setSupervisorPin('');
                setPinError(false);
                setIsDiscountModalOpen(true);
              }}
              className={`px-2 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                (cartDiscountPercent > 0 || cartCustomDiscount > 0)
                  ? 'bg-rose-950/80 text-rose-300 border-rose-700 shadow-xs font-semibold'
                  : 'bg-[#0e1624] text-slate-300 border-slate-700/60 hover:bg-slate-800'
              }`}
              title="Supervisor Discount & Waiver"
            >
              <BadgePercent className="w-3 h-3 text-rose-400 shrink-0" />
              <span>
                {cartDiscountPercent > 0 
                  ? `${cartDiscountPercent}%` 
                  : cartCustomDiscount > 0 
                    ? `₹${cartCustomDiscount}` 
                    : 'Discount'}
              </span>
            </button>
          </div>

          {/* Right: Dynamic Total Badge */}
          <div className="flex items-center font-bold text-emerald-400 text-base whitespace-nowrap shrink-0 pr-2">
            <span className="text-xs font-semibold text-slate-300 mr-2">Total:</span>
            {totalDiscount > 0 && (
              <span className="text-xs text-rose-400 font-medium line-through mr-1.5">
                ₹{rawSubtotal.toFixed(2)}
              </span>
            )}
            <span className="inline-block text-left min-w-[70px]">₹{finalTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Strict Order Lifecycle Rules:
            1. PRESERVE ORIGINAL VISUAL STYLES:
               - [Send KOT] (Bright Green)
               - [Save] (Dark Slate/Teal)
               - [Settle ₹...] (Bright Orange/Amber)
               - [Save & Print] (Bright Orange)
               - [Save & E-Bill] (Bright Blue/Cyan)
               - NEVER reduce opacity (no opacity-50, no faded grey styling).
               - Buttons look visually crisp, fully colored, and active at all times.
            2. PREVENT CLICK LOGIC (FUNCTIONAL LOCK INSTEAD OF VISUAL DISABLE):
               - No standard CSS disabled grey attributes or opacity drop.
               - `cursor-not-allowed` on hover when action is locked, `cursor-pointer` when allowed.
               - In onClick handler, if state is locked, simply `return;` (do nothing).
            3. WORKFLOW RULES:
               - When items are not saved yet:
                 * [Send KOT] is visually full green, but clicking does nothing.
                 * [Save] and [Save & Print] are clickable.
                 * [Settle ₹...] retains full bright color, but clicking does nothing.
                 * [Save & E-Bill] retains full bright blue, but clicking does nothing.
               - After "Save" / "Save & Print" is clicked:
                 * Keep active ticket in view.
                 * [Save] and [Save & Print] retain bright orange/teal colors, but clicking does nothing.
                 * Only [Settle ₹...] performs the payment action.
                 * [Send KOT] retains full bright green color, but clicking does nothing.
               - After Bill is Settled (PAID):
                 * [Send KOT] is now fully clickable to dispatch the order to KDS.
                 * Once [Send KOT] is clicked, clear ticket from top "Active:" row and reset the cart.
        */}
        {(() => {
          // Workflow functional permissions:
          // 1. Unsaved items present in cart:
          //    Force stage to UNSAVED. [Save] and [Save & Print] are ENABLED & HIGHLIGHTED (ring-2 ring-white/80 animate-pulse).
          //    [Settle] and [Send KOT] are LOCKED (pointer-events-none cursor-not-allowed).
          // 2. All items saved (SAVED state):
          //    - If NOT printed yet (!effectiveIsBillPrinted):
          //      * [Save] shows 'Saved' and is LOCKED (pointer-events-none cursor-not-allowed).
          //      * [Save & Print] is CLICKABLE to allow one-time receipt print.
          //      * [Settle] is UNLOCKED & HIGHLIGHTED (ring-2 ring-amber-400 animate-pulse) for payment collection.
          //    - Once printed (effectiveIsBillPrinted === true):
          //      * [Save & Print] is LOCKED (one-time print only, pointer-events-none cursor-not-allowed).
          //      * [Save] / [Saved] is LOCKED.
          //      * [Save & E-Bill] is LOCKED.
          //      * [Send KOT] is strictly LOCKED.
          //      * ONLY [Settle ₹...] is CLICKABLE (pointer-events-auto) & pulsating with amber highlight ring.
          // 3. Settled / Paid:
          //    [Settle] shows 'PAID (Settled)' and is LOCKED.
          //    [Save & Print] and [Save] are LOCKED.
          //    [Send KOT] is UNLOCKED & HIGHLIGHTED (ring-2 ring-emerald-400 animate-pulse).
          const effectiveIsBillPrinted = isBillPrinted && !hasUnsavedItems;
          const hasItems = cartItems.length > 0 || rawSubtotal > 0;
          const canClickSave = hasUnsavedItems && !isOrderSettled;
          const canClickSavePrint = hasItems && !isOrderSettled && !isSettling && !effectiveIsBillPrinted;
          const canClickSettle = allItemsSaved && !isOrderSettled && !isSettling;
          const canClickSendKot = isOrderSettled && !isSendingKot && !hasUnsavedItems;
          const canClickSaveEBill = false; // Only Settle performs payment action

          return (
            <>
              {/* 3. Payment Method Selector: [CASH] [UPI] [CARD] [SPLIT] [DUE] */}
              <div id="cashier-payment-methods-selector" className="grid grid-cols-5 gap-1">
                {/* CASH */}
                <button
                  type="button"
                  onClick={() => {
                    if (isOrderSettled) return;
                    setCartPaymentMethod('cash');
                  }}
                  className={`py-1.5 px-1 rounded-md text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1 shadow-xs ${
                    isOrderSettled ? 'cursor-not-allowed' : 'cursor-pointer active:scale-95'
                  } ${
                    cartPaymentMethod === 'cash'
                      ? 'payment-method-active bg-white text-slate-900 border border-white shadow-sm'
                      : 'payment-method-inactive bg-[#131f33] text-white border border-slate-700/80 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5 shrink-0" />
                  <span>CASH</span>
                </button>

                {/* UPI */}
                <button
                  type="button"
                  onClick={() => {
                    if (isOrderSettled) return;
                    setCartPaymentMethod('upi');
                  }}
                  className={`py-1.5 px-1 rounded-md text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1 shadow-xs ${
                    isOrderSettled ? 'cursor-not-allowed' : 'cursor-pointer active:scale-95'
                  } ${
                    cartPaymentMethod === 'upi'
                      ? 'payment-method-active bg-white text-slate-900 border border-white shadow-sm'
                      : 'payment-method-inactive bg-[#131f33] text-white border border-slate-700/80 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 shrink-0" />
                  <span>UPI</span>
                </button>

                {/* CARD */}
                <button
                  type="button"
                  onClick={() => {
                    if (isOrderSettled) return;
                    setCartPaymentMethod('card');
                  }}
                  className={`py-1.5 px-1 rounded-md text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1 shadow-xs ${
                    isOrderSettled ? 'cursor-not-allowed' : 'cursor-pointer active:scale-95'
                  } ${
                    cartPaymentMethod === 'card'
                      ? 'payment-method-active bg-white text-slate-900 border border-white shadow-sm'
                      : 'payment-method-inactive bg-[#131f33] text-white border border-slate-700/80 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 shrink-0" />
                  <span>CARD</span>
                </button>

                {/* SPLIT */}
                <button
                  id="cashier-cart-btn-split-payment"
                  type="button"
                  onClick={() => {
                    if (isOrderSettled) return;
                    setIsSplitModalOpen(true);
                  }}
                  className={`py-1.5 px-1 rounded-md text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1 shadow-xs ${
                    isOrderSettled ? 'cursor-not-allowed' : 'cursor-pointer active:scale-95'
                  } ${
                    cartPaymentMethod === 'split'
                      ? 'payment-method-active bg-white text-slate-900 border border-white shadow-sm'
                      : 'payment-method-inactive bg-[#131f33] text-white border border-slate-700/80 hover:bg-slate-700 hover:text-white'
                  }`}
                  title="Split Bill / Payment Modes"
                >
                  <Split className="w-3.5 h-3.5 shrink-0" />
                  <span>SPLIT</span>
                </button>

                {/* DUE */}
                <button
                  type="button"
                  onClick={() => {
                    if (isOrderSettled) return;
                    setCartPaymentMethod('due');
                  }}
                  className={`py-1.5 px-1 rounded-md text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1 shadow-xs ${
                    isOrderSettled ? 'cursor-not-allowed' : 'cursor-pointer active:scale-95'
                  } ${
                    cartPaymentMethod === 'due'
                      ? 'payment-method-active bg-white text-slate-900 border border-white shadow-sm'
                      : 'payment-method-inactive bg-[#131f33] text-white border border-slate-700/80 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>DUE</span>
                </button>
              </div>

              {/* 4. Action Row 1 (Operations): Send KOT, Save, Settle */}
              <div className="grid grid-cols-3 gap-1 pt-0.5">
                {/* Send KOT: Deep Crimson Red matching [ALL] badge - NEVER reduced opacity, visually crisp and full color */}
                <button
                  id="cashier-cart-btn-send-kot"
                  type="button"
                  onClick={() => {
                    if (!canClickSendKot) return;
                    handleSendKOT();
                  }}
                  className={`bg-[#8b0000] text-white font-bold py-2 px-1.5 rounded-lg shadow-xs text-xs flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                    canClickSendKot
                      ? 'pointer-events-auto cursor-pointer ring-2 ring-red-400 animate-pulse hover:bg-[#730000] active:scale-98 shadow-[0_0_16px_rgba(139,0,0,0.5)]'
                      : 'pointer-events-none cursor-not-allowed hover:bg-[#730000]'
                  }`}
                  title={
                    isOrderSettled
                      ? 'Order is settled (PAID). Click to dispatch KOT to kitchen KDS and complete ticket.'
                      : 'Send KOT: Save order and settle bill first before sending KOT.'
                  }
                >
                  <Send className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {isSendingKot
                      ? 'Sending...'
                      : 'Send KOT'}
                  </span>
                </button>

                {/* Save: Dark Slate/Teal - NEVER reduced opacity, visually crisp and full color */}
                <button
                  id="cashier-cart-btn-save"
                  type="button"
                  onClick={() => {
                    if (!canClickSave) return;
                    handleSaveRunningOrder();
                  }}
                  className={`bg-slate-700 text-white font-semibold py-2 px-1.5 rounded-lg shadow-xs text-xs flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                    canClickSave
                      ? 'pointer-events-auto cursor-pointer ring-2 ring-white/80 animate-pulse hover:bg-slate-600 active:scale-98'
                      : 'pointer-events-none cursor-not-allowed'
                  }`}
                  title={
                    allItemsSaved
                      ? 'Order already saved to Active Orders.'
                      : isOrderSettled
                      ? 'Order is already settled.'
                      : 'Save current order to Active Orders (KOT not sent).'
                  }
                >
                  <Save className="w-3.5 h-3.5 shrink-0" />
                  <span>{hasUnsavedItems ? 'Save' : allItemsSaved ? 'Saved' : 'Save'}</span>
                </button>

                {/* Settle: Deep Crimson Red matching [ALL] badge - NEVER reduced opacity, visually crisp and full color */}
                <button
                  id="cashier-cart-btn-settle"
                  type="button"
                  onClick={() => {
                    if (!canClickSettle) return;
                    handleSettle();
                  }}
                  className={`bg-[#8b0000] text-white font-bold py-2 px-1.5 rounded-lg shadow-xs text-xs flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                    canClickSettle
                      ? 'pointer-events-auto cursor-pointer ring-2 ring-red-400 animate-pulse hover:bg-[#730000] active:scale-98 shadow-[0_0_14px_rgba(139,0,0,0.45)]'
                      : 'pointer-events-none cursor-not-allowed hover:bg-[#730000]'
                  }`}
                  title={
                    isOrderSettled
                      ? 'Order is settled and paid. Next step: Click Send KOT to dispatch to kitchen.'
                      : allItemsSaved
                      ? 'Click to collect payment and mark order as Paid.'
                      : 'Save order first before settling payment.'
                  }
                >
                  {isSettling ? (
                    'Settling...'
                  ) : isOrderSettled ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>PAID (Settled)</span>
                    </span>
                  ) : (
                    <span>Settle ₹{Math.round(finalTotal)}</span>
                  )}
                </button>
              </div>

              {/* 5. Action Row 2 (Quick Checkout & Print): Save & Print, Save & E-Bill */}
              <div className="flex items-center gap-1">
                {/* Save & Print: Deep Navy Blue matching [BIRYANI] badge - NEVER reduced opacity, visually crisp and full color */}
                <button
                  id="cashier-cart-btn-save-print"
                  type="button"
                  onClick={() => {
                    if (!canClickSavePrint) return;
                    handleSaveAndPrint();
                  }}
                  className={`bg-[#0b1e3b] text-white font-bold py-2 px-2.5 rounded-lg text-xs flex-1 flex items-center justify-center gap-1.5 whitespace-nowrap ${
                    canClickSavePrint
                      ? hasUnsavedItems
                        ? 'pointer-events-auto cursor-pointer ring-2 ring-blue-300 animate-pulse hover:bg-[#162e56] active:scale-98 shadow-xs transition-colors'
                        : 'pointer-events-auto cursor-pointer hover:bg-[#162e56] active:scale-98 shadow-xs transition-colors'
                      : 'pointer-events-none cursor-not-allowed shadow-none hover:bg-[#162e56]'
                  }`}
                  title={
                    isOrderSettled
                      ? 'Order is already settled.'
                      : effectiveIsBillPrinted
                      ? 'Bill already printed (one-time print only). Proceed to Settle to collect payment.'
                      : allItemsSaved
                      ? 'Print customer bill receipt prior to payment.'
                      : 'Save order to Active Orders and open thermal estimate print preview.'
                  }
                >
                  <Printer className="w-3.5 h-3.5 shrink-0" />
                  <span>{isSettling ? (hasUnsavedItems ? 'Saving...' : 'Printing...') : 'Save & Print'}</span>
                </button>

                {/* Save & E-Bill: Bright Blue/Cyan - NEVER reduced opacity, visually crisp and full color */}
                <button
                  id="cashier-cart-btn-save-ebill"
                  type="button"
                  onClick={() => {
                    if (!canClickSaveEBill) return;
                    handleOpenEBillModal();
                  }}
                  className="bg-sky-600 text-white font-semibold py-2.5 px-3 rounded-lg shadow-xs text-xs flex-1 flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap pointer-events-none cursor-not-allowed"
                  title="Only Settle performs payment action."
                >
                  <Smartphone className="w-3.5 h-3.5 shrink-0" />
                  <span>Save & E-Bill</span>
                </button>
              </div>
            </>
          );
        })()}
      </div>

      {/* Split Bill Modal */}
      {isSplitModalOpen && (
        <BillModal
          isOpen={isSplitModalOpen}
          onClose={() => setIsSplitModalOpen(false)}
          tableNumber={tableNumber}
          totalAmount={finalTotal}
          orderItems={cart.map(c => ({
            name: c.item.name,
            quantity: c.quantity,
            price: c.item.price * c.quantity,
          }))}
        />
      )}

      {/* Cancel / Modify Item Modals */}
      {cancelModalTarget && (
        <KOTCancelModal
          isOpen={Boolean(cancelModalTarget)}
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

      {/* Supervisor Discount / Custom Waiver Modal */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#0f172a] rounded-2xl shadow-2xl max-w-md w-full border border-slate-800 overflow-hidden text-slate-200 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <BadgePercent className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Supervisor Discount & Waiver</h3>
                  <p className="text-[11px] text-slate-400">Subtotal Eligible: ₹{rawSubtotal.toFixed(2)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDiscountModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Privilege status banner */}
            <div className="p-4 space-y-4">
              {currentUser?.role === 'manager' || currentUser?.role === 'owner' ? (
                <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-bold text-emerald-200">Direct Manager Permission Active</div>
                    <div className="text-[11px] text-emerald-300/80 mt-0.5">
                      Logged in as <strong>{currentUser?.name || 'Vikram Sharma (Manager)'}</strong>. Custom discounts, owner concessions, and goodwill waivers apply directly without authorization popups.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-300 flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-bold text-amber-200">Supervisor Authorization Required</div>
                    <div className="text-[11px] text-amber-300/80 mt-0.5">
                      Cashier initiated discount requires Branch Manager (Vikram Sharma) authorization.
                    </div>
                  </div>
                </div>
              )}

              {/* Presets */}
              <div>
                <label className="text-xs text-slate-400 block mb-1.5 font-medium">Quick Presets:</label>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {[
                    { label: '5% Reg', pct: 5, amt: 0, reason: 'Regular Customer' },
                    { label: '10% Staff', pct: 10, amt: 0, reason: 'Staff Concession' },
                    { label: '15% VIP', pct: 15, amt: 0, reason: 'VIP Guest' },
                    { label: '20% Delay', pct: 20, amt: 0, reason: 'Goodwill - Kitchen Delay' },
                    { label: '₹100 Flat', pct: 0, amt: 100, reason: 'Manager Discretion' },
                    { label: '₹200 Flat', pct: 0, amt: 200, reason: 'Goodwill Settlement' },
                    { label: '50% Comp', pct: 50, amt: 0, reason: 'Special Promotion' },
                    { label: '100% Free', pct: 100, amt: 0, reason: 'Owner / VIP Full Waiver' },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setTempDiscountPercent(preset.pct);
                        setTempDiscountAmount(preset.amt);
                        setTempDiscountReason(preset.reason);
                      }}
                      className={`px-2 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition-colors ${
                        (preset.pct > 0 && tempDiscountPercent === preset.pct) || (preset.amt > 0 && tempDiscountAmount === preset.amt)
                          ? 'bg-rose-600 text-white border-rose-500'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Discount %</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={tempDiscountPercent || ''}
                      onChange={e => {
                        const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                        setTempDiscountPercent(val);
                        if (val > 0) setTempDiscountAmount(0);
                      }}
                      placeholder="0"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-rose-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">%</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Or Flat ₹ Discount</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      value={tempDiscountAmount || ''}
                      onChange={e => {
                        const val = Math.max(0, Number(e.target.value) || 0);
                        setTempDiscountAmount(val);
                        if (val > 0) setTempDiscountPercent(0);
                      }}
                      placeholder="₹0"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-rose-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">₹</span>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Reason / Notes</label>
                <input
                  type="text"
                  value={tempDiscountReason}
                  onChange={e => setTempDiscountReason(e.target.value)}
                  placeholder="e.g., Goodwill, Food Delay, Owner Discount"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* PIN input if cashier */}
              {currentUser?.role !== 'manager' && currentUser?.role !== 'owner' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-slate-300 font-semibold">Supervisor PIN (Vikram Sharma):</label>
                    <button
                      type="button"
                      onClick={() => setSupervisorPin('1234')}
                      className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                    >
                      Fill Demo PIN (1234)
                    </button>
                  </div>
                  <input
                    type="password"
                    maxLength={6}
                    value={supervisorPin}
                    onChange={e => { setSupervisorPin(e.target.value); setPinError(false); }}
                    placeholder="Enter 4-digit PIN (1234)"
                    className={`w-full px-3 py-1.5 bg-slate-950 border rounded-lg text-white font-mono text-xs ${pinError ? 'border-rose-500' : 'border-slate-700'}`}
                  />
                  {pinError && <p className="text-[10px] text-rose-400 mt-1">Invalid supervisor PIN. Manager PIN is 1234.</p>}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setCartDiscountPercent(0);
                  setCartCustomDiscount(0);
                  setIsDiscountModalOpen(false);
                  showToast('Discount Cleared', 'Order returned to standard pricing.', 'info');
                }}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Clear Discount
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDiscountModalOpen(false)}
                  className="px-3 py-2 rounded-lg text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const isManager = currentUser?.role === 'manager' || currentUser?.role === 'owner';
                    if (!isManager && (tempDiscountPercent > 10 || tempDiscountAmount > 100)) {
                      if (supervisorPin.trim() !== '1234') {
                        setPinError(true);
                        showToast('Authorization Required', 'Please enter supervisor PIN 1234 to apply this discount.', 'error');
                        return;
                      }
                    }
                    setCartDiscountPercent(tempDiscountPercent);
                    setCartCustomDiscount(tempDiscountAmount);
                    setIsDiscountModalOpen(false);
                    showToast('Discount Applied', `${tempDiscountPercent > 0 ? `${tempDiscountPercent}%` : `₹${tempDiscountAmount}`} discount authorized.`, 'success');
                  }}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Apply Discount</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Save & E-Bill Modal */}
      {isEBillModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-sans">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Save & Send E-Bill</h3>
                  <p className="text-xs text-slate-400">Digital receipt via WhatsApp / SMS</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEBillModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              {/* Order Info & Payable Total */}
              <div className="flex items-center justify-between p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                <div>
                  <div className="text-[11px] text-slate-400 uppercase font-medium">Order Target</div>
                  <div className="text-sm font-bold text-white">
                    {orderType === 'dine_in' ? `Table ${tableNumber || 'N/A'}` : `Takeaway #${cartTakeawayId || 'TK-102'}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400 uppercase font-medium">
                    Total ({cartPaymentMethod.toUpperCase()})
                  </div>
                  <div className="text-base font-bold text-emerald-400">
                    ₹{finalTotal.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Delivery Channel Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Delivery Channel
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEBillChannel('whatsapp')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      eBillChannel === 'whatsapp'
                        ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 shadow-xs'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEBillChannel('sms')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      eBillChannel === 'sms'
                        ? 'bg-sky-950/70 border-sky-500 text-sky-300 shadow-xs'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-sky-400" />
                    <span>SMS Receipt</span>
                  </button>
                </div>
              </div>

              {/* Mobile Number Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Customer Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-slate-400 pointer-events-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={eBillPhone}
                    onChange={e => setEBillPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="98765 43210"
                    autoFocus
                    className="w-full bg-[#080d1a] border border-slate-700 rounded-xl pl-12 pr-3 py-2.5 text-sm font-semibold text-white placeholder-slate-600 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Tax invoice & payment confirmation link will be delivered instantly.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEBillModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEBill}
                disabled={isSendingEBill}
                className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingEBill ? 'Dispatching...' : 'Settle & Send E-Bill'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
