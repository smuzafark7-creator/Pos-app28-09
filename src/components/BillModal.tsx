import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PaymentMethod, SplitPaymentDetail, ItemServeType } from '../types';
import { 
  X, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Split, 
  Receipt, 
  Check, 
  Percent,
  Building2,
  Calendar,
  Clock,
  UtensilsCrossed,
  ArrowRight,
  AlertCircle,
  Coins,
  Gift,
  Tag
} from 'lucide-react';
import { BRANCHES } from '../data/mockData';

interface BillModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDiscountPercent?: number;
  initialCustomDiscount?: number;
}

export const BillModal: React.FC<BillModalProps> = ({ 
  isOpen, 
  onClose,
  initialDiscountPercent = 0,
  initialCustomDiscount = 0
}) => {
  const { 
    cart, 
    cartTableNumber, 
    cartOrderType, 
    cartCustomerName, 
    cartCustomerMobile,
    currentBranch, 
    kots, 
    getActiveUnbilledKots,
    generateBill,
    billSequence,
    setTableStatusByNumber,
    currentUser,
    requestBill,
    restaurantSettings
  } = useApp();

  const isWaiter = currentUser?.role === 'waiter';

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [discountPercent, setDiscountPercent] = useState<number>(initialDiscountPercent);
  const [customDiscount, setCustomDiscount] = useState<number>(initialCustomDiscount);
  const [isBogoActive, setIsBogoActive] = useState<boolean>(false);
  const [isComplimentary, setIsComplimentary] = useState<boolean>(false);
  const [isCustomDiscountOpen, setIsCustomDiscountOpen] = useState<boolean>(false);
  const [customDiscountType, setCustomDiscountType] = useState<'percent' | 'flat'>('percent');
  const [customDiscountInput, setCustomDiscountInput] = useState<string>('');

  // Cash payment state
  const [cashReceived, setCashReceived] = useState<number>(0);
  
  // Split payment state
  const [splitDetails, setSplitDetails] = useState<SplitPaymentDetail>({
    cash: 0,
    upi: 0,
    card: 0
  });

  const effectiveBranch = currentBranch === 'all' ? 'main' : currentBranch;
  const branchObj = BRANCHES.find(b => b.id === effectiveBranch) || BRANCHES[0];

  // Retrieve all active unbilled KOTs for the selected dining session / order
  const activeSessionKots = useMemo(() => {
    return getActiveUnbilledKots(cartTableNumber, cartOrderType, cartCustomerMobile);
  }, [getActiveUnbilledKots, cartTableNumber, cartOrderType, cartCustomerMobile]);

  // Combine items from ALL active unbilled KOTs belonging to this session + any cart items
  const billItems = useMemo(() => {
    const itemsList: { id: string; name: string; quantity: number; rate: number; amount: number; serveType: ItemServeType }[] = [];

    const addOrMerge = (id: string, name: string, quantity: number, rate: number, serveType: ItemServeType) => {
      const existing = itemsList.find(
        i => i.name.toLowerCase() === name.toLowerCase() && i.rate === rate && i.serveType === serveType
      );
      if (existing) {
        existing.quantity += quantity;
        existing.amount = existing.quantity * existing.rate;
      } else {
        itemsList.push({
          id,
          name,
          quantity,
          rate,
          amount: rate * quantity,
          serveType
        });
      }
    };

    // 1. Gather all items from active unbilled KOTs
    if (activeSessionKots.length > 0) {
      activeSessionKots.forEach((kot) => {
        kot.items.forEach((it, idx) => {
          if (it.status === 'voided') return; // Exclude voided items from bill
          addOrMerge(
            it.menuItemId || `${kot.id}_item_${idx}`,
            it.name,
            it.quantity,
            it.rate,
            it.serveType || 'DINE_IN'
          );
        });
      });

      // Also append any unsent items currently in the cart
      if (cart.length > 0) {
        cart.forEach((c) => {
          addOrMerge(
            c.item.id,
            c.item.name,
            c.quantity,
            c.item.price,
            c.serveType || 'DINE_IN'
          );
        });
      }

      return itemsList;
    }

    // 2. If no active unbilled KOTs exist, fallback to current cart
    if (cart.length > 0) {
      cart.forEach(c => {
        addOrMerge(
          c.item.id,
          c.item.name,
          c.quantity,
          c.item.price,
          c.serveType || 'DINE_IN'
        );
      });
      return itemsList;
    }

    return [];
  }, [activeSessionKots, cart]);

  const subtotal = useMemo(() => {
    return billItems.reduce((sum, item) => sum + item.amount, 0);
  }, [billItems]);

  // BOGO calculation: free 1 qty of lowest price item
  const bogoDiscount = useMemo(() => {
    if (!isBogoActive || billItems.length === 0) return 0;
    const minPriceItem = [...billItems].sort((a, b) => a.rate - b.rate)[0];
    return minPriceItem ? minPriceItem.rate : 0;
  }, [isBogoActive, billItems]);

  const calculatedDiscount = useMemo(() => {
    if (isComplimentary) return subtotal;
    let disc = 0;
    if (discountPercent > 0) {
      disc += Math.round((subtotal * discountPercent) / 100);
    }
    if (customDiscount > 0) {
      disc += customDiscount;
    }
    disc += bogoDiscount;
    return Math.min(subtotal, disc);
  }, [isComplimentary, subtotal, discountPercent, customDiscount, bogoDiscount]);

  const discountedSubtotal = Math.max(0, subtotal - calculatedDiscount);
  const cgstPercent = restaurantSettings?.cgstPercent ?? 5.0;
  const sgstPercent = restaurantSettings?.sgstPercent ?? 5.0;
  const cgstAmount = isComplimentary ? 0 : Number(((discountedSubtotal * (cgstPercent / 100))).toFixed(2));
  const sgstAmount = isComplimentary ? 0 : Number(((discountedSubtotal * (sgstPercent / 100))).toFixed(2));
  const gstAmount = Number((cgstAmount + sgstAmount).toFixed(2));
  const grandTotal = isComplimentary ? 0 : Math.max(0, Number((discountedSubtotal + cgstAmount + sgstAmount).toFixed(2)));

  // When modal opens, initialize cash received to grandTotal and mark table as billing
  useEffect(() => {
    if (isOpen) {
      if (initialDiscountPercent !== undefined) setDiscountPercent(initialDiscountPercent);
      if (initialCustomDiscount !== undefined) setCustomDiscount(initialCustomDiscount);
      setCashReceived(grandTotal);
      if (cartOrderType === 'dine_in' && cartTableNumber) {
        setTableStatusByNumber(cartTableNumber, 'billing');
      }
    }
    // Only run when the modal is opened
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Synchronize cashReceived whenever grandTotal updates so balance/change recalculate in real-time
  useEffect(() => {
    if (isOpen) {
      setCashReceived(grandTotal);
    }
  }, [grandTotal, isOpen]);

  // Cash change calculation
  const cashChange = Math.max(0, cashReceived - grandTotal);
  const isCashSufficient = isComplimentary || grandTotal === 0 || cashReceived >= grandTotal;

  // Split calculation
  const totalPaidInSplit = (splitDetails.cash || 0) + (splitDetails.upi || 0) + (splitDetails.card || 0);
  const remainingInSplit = Math.max(0, grandTotal - totalPaidInSplit);
  const isSplitValid = paymentMethod === 'split' ? remainingInSplit === 0 && totalPaidInSplit === grandTotal : true;

  // Initialize split values when switching to split
  const handleSelectPaymentMethod = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === 'split') {
      const half = Math.floor(grandTotal / 2);
      setSplitDetails({
        cash: half,
        upi: grandTotal - half,
        card: 0
      });
    } else if (method === 'cash') {
      if (cashReceived < grandTotal) {
        setCashReceived(grandTotal);
      }
    }
  };

  const handleConfirmPayment = () => {
    if (paymentMethod === 'cash' && !isCashSufficient) {
      return;
    }
    if (paymentMethod === 'split' && !isSplitValid) {
      return;
    }
    const createdBill = generateBill(paymentMethod, splitDetails, calculatedDiscount);
    if (createdBill) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const currentDate = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const invoiceNumber = `INV-${billSequence}`;

  return (
    <div className="fixed inset-0 z-50 font-mono select-none text-slate-200 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Dialog */}
      <div 
        className="bill-modal relative w-[580px] max-w-[94vw] max-h-[90vh] flex flex-col overflow-y-auto rounded-2xl border bg-[#0b1120] shadow-2xl z-50 scrollbar-thin"
        style={{
          backgroundColor: '#0b1120',
          borderColor: 'rgba(59, 130, 246, 0.18)',
          maxHeight: '90vh',
        }}
      >
        {/* 1. PINNED TOP HEADER */}
        <div className="flex-shrink-0 border-b" style={{ borderColor: 'rgba(59, 130, 246, 0.18)' }}>
          {/* Restaurant & Branch Header */}
          <div 
            className="px-4 py-3 text-white flex items-center justify-between border-b"
            style={{ backgroundColor: '#0a0f1d', borderColor: 'rgba(59, 130, 246, 0.18)' }}
          >
            <div className="flex items-center gap-2.5">
              <div 
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center font-bold shadow-xs shrink-0"
                style={{
                  backgroundColor: '#1e293b',
                  borderColor: '#334155',
                  color: '#e2e8f0',
                }}
              >
                <Receipt className="w-4 h-4 text-slate-200" style={{ color: '#e2e8f0' }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 
                    className="bill-header-title text-white tracking-tight uppercase leading-none"
                    style={{
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '15px'
                    }}
                  >
                    BILAAL RESTAURANT
                  </h3>
                  <span 
                    className="bill-tax-invoice-badge bg-slate-800 text-slate-300 border border-slate-600 font-bold text-[11px] px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: '#1e293b',
                      color: '#cbd5e1',
                      border: '1px solid #475569',
                      fontWeight: 700,
                      fontSize: '11px',
                    }}
                  >
                    TAX INVOICE
                  </span>
                </div>
                <p 
                  className="bill-header-subtitle mt-0.5 text-[11px]"
                  style={{
                    color: '#94a3b8',
                    fontWeight: 500
                  }}
                >
                  {branchObj.name} • Phone: {branchObj.phone}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-slate-300 hover:text-white" />
            </button>
          </div>

          {/* Invoice Metadata Strip */}
          <div 
            className="px-4 py-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border-b"
            style={{ backgroundColor: '#0b1120', borderColor: 'rgba(59, 130, 246, 0.15)' }}
          >
            <div>
              <span className="text-[10px] uppercase font-semibold block" style={{ color: '#94a3b8' }}>Invoice</span>
              <span className="font-semibold" style={{ color: '#f1f5f9' }}>{invoiceNumber}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold block" style={{ color: '#94a3b8' }}>Date & Time</span>
              <span className="font-semibold" style={{ color: '#f1f5f9' }}>{currentDate} {currentTime}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold block" style={{ color: '#94a3b8' }}>Order Type</span>
              <span className="font-semibold uppercase" style={{ color: '#f1f5f9' }}>
                {cartOrderType.replace('_', '-')}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold block" style={{ color: '#94a3b8' }}>Destination</span>
              <span className="font-bold truncate block" style={{ color: '#f1f5f9' }}>
                {cartOrderType === 'dine_in' ? (cartTableNumber || 'Table 5') : 'Takeaway Counter'}
              </span>
            </div>
          </div>

          {/* Combined KOTs Strip or Advance Payment Strip */}
          {activeSessionKots.length > 0 ? (
            <div 
              className="bill-combined-kots-strip px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs border-t"
              style={{
                backgroundColor: '#0d1527',
                borderColor: 'rgba(59, 130, 246, 0.15)',
                color: '#94a3b8'
              }}
            >
              <div className="flex items-center gap-1.5 font-medium" style={{ color: '#94a3b8' }}>
                <span className="font-bold" style={{ color: '#cbd5e1' }}>Combined KOTs ({activeSessionKots.length}):</span>
                <span className="font-bold font-mono" style={{ color: '#94a3b8' }}>
                  {activeSessionKots.map(k => k.kotNumber).join(', ')}
                </span>
              </div>
              <span 
                className="bill-kot-badge text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                style={{
                  backgroundColor: '#1e293b',
                  color: '#cbd5e1',
                  border: '1px solid #334155'
                }}
              >
                {billItems.length} Total Items
              </span>
            </div>
          ) : (cartOrderType === 'takeaway' || cartOrderType === 'parcel') ? (
            <div 
              className="px-4 py-1.5 flex items-center justify-between gap-2 text-xs border-t"
              style={{
                backgroundColor: '#0d1527',
                borderColor: 'rgba(59, 130, 246, 0.15)'
              }}
            >
              <div className="flex items-center gap-1.5" style={{ color: '#7dd3fc' }}>
                <span className="font-bold uppercase tracking-wide">Advance Payment:</span>
                <span style={{ color: '#cbd5e1' }}>Invoice paid first; order is PAID - READY TO SEND</span>
              </div>
              <span 
                className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                style={{
                  backgroundColor: 'rgba(8, 47, 73, 0.7)',
                  color: '#7dd3fc',
                  border: '1px solid #0369a1'
                }}
              >
                Express Takeaway
              </span>
            </div>
          ) : null}
        </div>

        {/* 2. MIDDLE BODY (Items Table + Subtotal + Discount + GST + Grand Total) */}
        <div className="px-3 pt-3 pb-0.5 flex flex-col gap-2 text-xs">
          {/* Customer info if provided */}
          {(cartCustomerName || cartCustomerMobile || activeSessionKots.some(k => k.customerName || k.customerMobile)) && (
            <div 
              className="p-2 rounded-lg flex justify-between items-center text-[11px]"
              style={{ backgroundColor: '#0d1527', border: '1px solid rgba(59, 130, 246, 0.18)' }}
            >
              <span className="font-medium" style={{ color: '#cbd5e1' }}>
                Guest: <strong style={{ color: '#ffffff', fontWeight: 700 }}>{cartCustomerName || activeSessionKots.find(k => k.customerName)?.customerName || 'Walk-in'}</strong>
              </span>
              <span style={{ color: '#94a3b8' }}>
                Contact: {cartCustomerMobile || activeSessionKots.find(k => k.customerMobile)?.customerMobile || 'N/A'}
              </span>
            </div>
          )}

          {/* ITEM DATA GRID */}
          <div 
            className="bill-items-table border rounded-xl overflow-hidden"
            style={{
              backgroundColor: '#0d1527',
              borderColor: 'rgba(59, 130, 246, 0.18)'
            }}
          >
            <div 
              className="bill-items-thead grid grid-cols-12 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: '#090e1a',
                borderBottom: '1px solid rgba(59, 130, 246, 0.15)',
                color: '#94a3b8'
              }}
            >
              <span className="col-span-6">ITEM</span>
              <span className="col-span-2 text-center">QTY</span>
              <span className="col-span-2 text-right">RATE</span>
              <span className="col-span-2 text-right">AMOUNT</span>
            </div>
            <div className="bill-items-tbody divide-y max-h-[160px] overflow-y-auto scrollbar-thin" style={{ borderColor: 'rgba(59, 130, 246, 0.12)' }}>
              {billItems.map((item, idx) => (
                <div 
                  key={idx} 
                  className="bill-item-row grid grid-cols-12 px-3 py-1.5 text-xs items-center"
                  style={{
                    borderBottom: '1px solid rgba(59, 130, 246, 0.12)',
                    backgroundColor: 'transparent'
                  }}
                >
                  <div className="col-span-6 flex items-center gap-2 min-w-0 pr-1">
                    <span 
                      className="bill-item-name flex-1 min-w-0 truncate"
                      style={{
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '13px'
                      }}
                      title={item.name}
                    >
                      {item.name}
                    </span>
                    <span 
                      className="bill-serve-badge text-[9px] font-extrabold px-1.5 py-0.5 rounded shrink-0 uppercase tracking-tight"
                      style={
                        item.serveType === 'PARCEL'
                          ? {
                              backgroundColor: 'rgba(69, 26, 3, 0.7)',
                              color: '#fcd34d',
                              border: '1px solid #92400e'
                            }
                          : {
                              backgroundColor: '#1e293b',
                              color: '#cbd5e1',
                              border: '1px solid #475569'
                            }
                      }
                    >
                      {item.serveType === 'PARCEL' ? 'PARCEL' : 'DINE-IN'}
                    </span>
                  </div>
                  <span className="bill-item-qty col-span-2 text-center font-bold" style={{ color: '#f1f5f9', fontSize: '13px' }}>
                    {item.quantity}
                  </span>
                  <span className="bill-item-rate col-span-2 text-right font-mono" style={{ color: '#cbd5e1', fontSize: '12px' }}>
                    ₹{item.rate}
                  </span>
                  <span className="bill-item-amount col-span-2 text-right font-bold font-mono" style={{ color: '#ffffff', fontWeight: 700, fontSize: '13px' }}>
                    ₹{item.amount}
                  </span>
                </div>
              ))}
              {billItems.length === 0 && (
                <div className="p-3 text-center" style={{ color: '#64748b' }}>No items selected</div>
              )}
            </div>
          </div>

          {/* TOTALS & DISCOUNTS CALCULATION BLOCK (DARK SLATE THEME) */}
          <div 
            className="bill-totals-container py-2 px-3 space-y-1.5"
            style={{
              backgroundColor: '#0d1527',
              border: '1px solid rgba(59, 130, 246, 0.18)',
              borderRadius: '12px',
              marginBottom: '2px'
            }}
          >
            <div className="flex justify-between items-center text-xs">
              <span className="bill-calc-label font-medium" style={{ color: '#cbd5e1' }}>
                Subtotal ({billItems.length} items)
              </span>
              <span className="bill-calc-val font-mono font-semibold" style={{ color: '#f8fafc' }}>
                ₹{subtotal.toFixed(2)}
              </span>
            </div>

            {/* Discount Applied Deduction (only displayed when a discount is active) */}
            {calculatedDiscount > 0 && (
              <div className="flex justify-between items-center text-xs">
                <span className="bill-calc-label font-medium flex items-center gap-1.5" style={{ color: '#cbd5e1' }}>
                  <span>Discount Applied:</span>
                  <span className="text-[10px] text-amber-300 font-semibold">
                    {isComplimentary ? 'Comp (100% OFF)' : [
                      isBogoActive ? 'BOGO' : null,
                      discountPercent > 0 ? `${discountPercent}%` : null,
                      customDiscount > 0 ? `₹${customDiscount}` : null
                    ].filter(Boolean).join(' + ')}
                  </span>
                </span>
                <span className="bill-calc-val font-mono font-semibold" style={{ color: '#fbbf24' }}>
                  -₹{calculatedDiscount.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center text-xs">
              <span className="bill-calc-label font-medium" style={{ color: '#cbd5e1' }}>
                CGST ({cgstPercent}%)
              </span>
              <span className="bill-calc-val font-mono font-semibold" style={{ color: '#f8fafc' }}>
                ₹{cgstAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="bill-calc-label font-medium" style={{ color: '#cbd5e1' }}>
                SGST ({sgstPercent}%)
              </span>
              <span className="bill-calc-val font-mono font-semibold" style={{ color: '#f8fafc' }}>
                ₹{sgstAmount.toFixed(2)}
              </span>
            </div>

            {/* GRAND TOTAL ROW */}
            <div 
              className="pt-1.5 flex justify-between items-baseline"
              style={{ borderTop: '1px solid rgba(59, 130, 246, 0.15)' }}
            >
              <span 
                className="bill-grand-total-label uppercase tracking-wider"
                style={{
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '15px'
                }}
              >
                GRAND TOTAL
              </span>
              <span 
                className="bill-grand-total-value font-mono"
                style={{
                  color: '#10b981',
                  fontWeight: 800,
                  fontSize: '17px'
                }}
              >
                ₹{grandTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* 3. PAYMENT METHODS & TENDER INPUT */}
        <div 
          className="flex-shrink-0 border-t px-4 pt-0.5 pb-2.5 space-y-2"
          style={{ backgroundColor: '#0b1120', borderColor: 'rgba(59, 130, 246, 0.18)' }}
        >
          {/* Action Buttons: [% BOGO], [Comp], [Discount] directly above payment modes */}
          <div 
            className="bill-discount-controls-row flex items-center gap-1.5"
            style={{ marginTop: '2px', marginBottom: '4px', paddingTop: '0px' }}
          >
            {/* 1. [% BOGO] */}
            <button
              id="settlement-btn-bogo"
              type="button"
              onClick={() => {
                const next = !isBogoActive;
                setIsBogoActive(next);
                if (next) setIsComplimentary(false);
              }}
              style={
                isBogoActive
                  ? {
                      backgroundColor: '#d97706',
                      borderColor: '#f59e0b',
                      border: '1px solid #f59e0b',
                      color: '#ffffff',
                      fontWeight: 700,
                      padding: '4px 10px',
                      fontSize: '11px',
                      borderRadius: '6px'
                    }
                  : {
                      backgroundColor: '#1e293b',
                      borderColor: '#334155',
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      fontWeight: 700,
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: '6px'
                    }
              }
              className={`bill-discount-action-btn ${isBogoActive ? 'active-bogo !bg-amber-600 !text-white !border-amber-500' : ''} text-[11px] font-bold py-1 px-3 rounded-md shadow-xs transition-all cursor-pointer flex items-center gap-1.5 leading-none hover:bg-slate-700 hover:border-slate-500`}
              title="Buy One Get One (Free item of lowest price)"
            >
              <Percent className="w-3 h-3 shrink-0" style={{ color: isBogoActive ? '#ffffff' : '#f8fafc' }} />
              <span style={{ color: isBogoActive ? '#ffffff' : '#f8fafc', fontWeight: 700 }}>% BOGO</span>
            </button>

            {/* 2. [Comp] */}
            <button
              id="settlement-btn-comp"
              type="button"
              onClick={() => {
                const next = !isComplimentary;
                setIsComplimentary(next);
                if (next) {
                  setIsBogoActive(false);
                  setDiscountPercent(0);
                  setCustomDiscount(0);
                }
              }}
              style={
                isComplimentary
                  ? {
                      backgroundColor: '#9333ea',
                      borderColor: '#a855f7',
                      border: '1px solid #a855f7',
                      color: '#ffffff',
                      fontWeight: 700,
                      padding: '4px 10px',
                      fontSize: '11px',
                      borderRadius: '6px'
                    }
                  : {
                      backgroundColor: '#1e293b',
                      borderColor: '#334155',
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      fontWeight: 700,
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: '6px'
                    }
              }
              className={`bill-discount-action-btn ${isComplimentary ? 'active-comp !bg-purple-600 !text-white !border-purple-500' : ''} text-[11px] font-bold py-1 px-3 rounded-md shadow-xs transition-all cursor-pointer flex items-center gap-1.5 leading-none hover:bg-slate-700 hover:border-slate-500`}
              title="Complimentary Order (100% off)"
            >
              <Gift className="w-3 h-3 shrink-0" style={{ color: isComplimentary ? '#ffffff' : '#f8fafc' }} />
              <span style={{ color: isComplimentary ? '#ffffff' : '#f8fafc', fontWeight: 700 }}>Comp</span>
            </button>

            {/* 3. [Discount] */}
            <button
              id="settlement-btn-discount"
              type="button"
              onClick={() => setIsCustomDiscountOpen(!isCustomDiscountOpen)}
              style={
                isCustomDiscountOpen || customDiscount > 0
                  ? {
                      backgroundColor: 'rgba(76, 5, 25, 0.9)',
                      borderColor: '#be123c',
                      border: '1px solid #be123c',
                      color: '#f43f5e',
                      fontWeight: 700,
                      padding: '4px 10px',
                      fontSize: '11px',
                      borderRadius: '6px'
                    }
                  : {
                      backgroundColor: '#1e293b',
                      borderColor: '#334155',
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      fontWeight: 700,
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: '6px'
                    }
              }
              className={`bill-discount-action-btn ${isCustomDiscountOpen || customDiscount > 0 ? 'active-discount !bg-rose-950/80 !text-rose-300 !border-rose-700' : ''} text-[11px] font-bold py-1 px-3 rounded-md shadow-xs transition-all cursor-pointer flex items-center gap-1.5 leading-none hover:bg-slate-700 hover:border-slate-500`}
              title="Custom discount"
            >
              <Tag className="w-3 h-3 shrink-0" style={{ color: (isCustomDiscountOpen || customDiscount > 0) ? '#f43f5e' : '#f8fafc' }} />
              <span style={{ color: (isCustomDiscountOpen || customDiscount > 0) ? '#f43f5e' : '#f8fafc', fontWeight: 700 }}>
                {customDiscount > 0 ? `₹${customDiscount} Off` : 'Discount'}
              </span>
            </button>
          </div>

          {/* Inline Custom Discount Input Strip */}
          {isCustomDiscountOpen && (
            <div 
              className="flex items-center gap-1.5 p-1.5 mb-2.5 rounded-lg border text-xs"
              style={{ backgroundColor: '#0b1120', borderColor: '#334155' }}
            >
              <div className="flex rounded overflow-hidden border border-slate-700">
                <button
                  type="button"
                  onClick={() => setCustomDiscountType('percent')}
                  className={`px-2 py-0.5 text-[11px] font-bold ${customDiscountType === 'percent' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => setCustomDiscountType('flat')}
                  className={`px-2 py-0.5 text-[11px] font-bold ${customDiscountType === 'flat' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                >
                  ₹
                </button>
              </div>
              <input
                type="number"
                min="0"
                placeholder={customDiscountType === 'percent' ? 'Enter % (e.g. 20)' : 'Enter ₹ (e.g. 50)'}
                value={customDiscountInput}
                onChange={e => setCustomDiscountInput(e.target.value)}
                className="flex-1 px-2 py-0.5 bg-slate-800 border border-slate-600 rounded text-xs text-white focus:outline-blue-500 font-mono"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  const val = Number(customDiscountInput) || 0;
                  if (val > 0) {
                    setIsComplimentary(false);
                    if (customDiscountType === 'percent') {
                      setDiscountPercent(Math.min(100, val));
                      setCustomDiscount(0);
                    } else {
                      setDiscountPercent(0);
                      setCustomDiscount(val);
                    }
                  }
                  setIsCustomDiscountOpen(false);
                  setCustomDiscountInput('');
                }}
                className="px-2.5 py-0.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-[11px] cursor-pointer"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCustomDiscountOpen(false);
                  setCustomDiscountInput('');
                }}
                className="px-1.5 py-0.5 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Payment Method Tabs */}
          <div 
            className="bill-payment-tabs-container !mt-0"
            style={{ marginTop: '0px' }}
          >
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'cash', label: 'CASH', icon: Banknote },
                { id: 'upi', label: 'UPI', icon: QrCode },
                { id: 'card', label: 'CARD', icon: CreditCard },
                { id: 'split', label: 'SPLIT', icon: Split }
              ].map(({ id, label, icon: Icon }) => {
                const isActive = paymentMethod === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSelectPaymentMethod(id as PaymentMethod)}
                    className={`bill-payment-btn ${isActive ? 'bill-payment-btn-active bg-[#1e3a8a] text-white border-blue-500 font-bold' : 'bill-payment-btn-inactive bg-slate-800 text-slate-300 border border-slate-700 font-semibold'} flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-center transition-all cursor-pointer`}
                    style={
                      isActive
                        ? {
                            backgroundColor: '#1e3a8a',
                            color: '#ffffff',
                            border: '1px solid #3b82f6',
                            fontWeight: 700,
                            boxShadow: '0 2px 8px rgba(30, 58, 138, 0.4)'
                          }
                        : {
                            backgroundColor: '#1e293b',
                            color: '#cbd5e1',
                            border: '1px solid #334155',
                            fontWeight: 600
                          }
                    }
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: isActive ? '#ffffff' : '#94a3b8' }} />
                    <span 
                      className="text-xs font-bold" 
                      style={{ 
                        color: isActive ? '#ffffff' : '#cbd5e1', 
                        fontWeight: isActive ? 700 : 600 
                      }}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Method-Specific Panel */}

          {/* A. CASH PAYMENT CONTROLS */}
          {paymentMethod === 'cash' && (
            <div className="space-y-1.5 pt-0.5 animate-in fade-in duration-100">
              {/* Single Sleek Inline Row: Cash Input + Quick Buttons */}
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <span 
                    className="bill-currency-symbol absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: '#94a3b8', fontWeight: 700, fontSize: '14px' }}
                  >
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={cashReceived || ''}
                    onChange={e => setCashReceived(Number(e.target.value) || 0)}
                    className="bill-cash-input w-full pl-7 pr-2 py-1.5 rounded-lg focus:outline-emerald-500 font-mono"
                    style={{ 
                      backgroundColor: '#0f172a', 
                      border: '1px solid #334155', 
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '15px',
                      opacity: 1
                    }}
                    placeholder="Enter cash received"
                  />
                </div>

                {/* Quick Preset Buttons */}
                <button
                  type="button"
                  onClick={() => setCashReceived(grandTotal)}
                  style={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#e2e8f0' }}
                  className="px-2.5 py-1.5 hover:bg-slate-700 rounded-lg text-[11px] font-bold cursor-pointer whitespace-nowrap transition-colors"
                >
                  Exact (₹{grandTotal})
                </button>
                <button
                  type="button"
                  onClick={() => setCashReceived(Math.ceil(grandTotal / 500) * 500 || 500)}
                  style={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#e2e8f0' }}
                  className="px-2.5 py-1.5 hover:bg-slate-700 rounded-lg text-[11px] font-bold cursor-pointer whitespace-nowrap transition-colors"
                >
                  ₹{Math.ceil(grandTotal / 500) * 500 || 500}
                </button>
              </div>

              {/* Single Inline Summary Strip (No nested dark card background, clean text with subtle dividers) */}
              <div className="flex items-center justify-between px-1 py-0.5 text-xs font-mono">
                <span style={{ color: '#cbd5e1' }}>
                  Amount: <strong style={{ color: '#ffffff', fontWeight: 700 }}>₹{cashReceived}</strong>
                </span>
                <span style={{ color: '#475569' }}>|</span>
                <span style={{ color: '#cbd5e1' }}>
                  Total: <strong style={{ color: '#ffffff', fontWeight: 700 }}>₹{grandTotal}</strong>
                </span>
                <span style={{ color: '#475569' }}>|</span>
                <span style={{ color: '#cbd5e1' }}>
                  Change: <strong style={{ color: isCashSufficient ? '#10b981' : '#f87171', fontWeight: 800 }}>₹{cashChange}</strong>
                </span>
              </div>

              {!isCashSufficient && (
                <div 
                  className="px-2 py-0.5 rounded text-[10px] flex items-center gap-1"
                  style={{ color: '#fca5a5' }}
                >
                  <AlertCircle className="w-3 h-3 shrink-0 text-rose-400" />
                  <span>Amount received is short by ₹{grandTotal - cashReceived}.</span>
                </div>
              )}
            </div>
          )}

          {/* B. UPI PAYMENT DETAILS */}
          {paymentMethod === 'upi' && (
            <div className="flex items-center gap-2.5 py-1 px-1 animate-in fade-in duration-100">
              <div 
                className="w-10 h-10 p-1 rounded-lg shrink-0 flex items-center justify-center"
                style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
              >
                <QrCode className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color: '#ffffff' }}>Scan & Pay ₹{grandTotal.toFixed(2)}</span>
                  <span className="text-[10px] font-mono" style={{ color: '#93c5fd' }}>bilaal.billing@icici</span>
                </div>
                <p className="text-[10px]" style={{ color: '#94a3b8' }}>Customer UPI QR code ready for instant settlement</p>
              </div>
            </div>
          )}

          {/* C. CARD PAYMENT DETAILS */}
          {paymentMethod === 'card' && (
            <div className="flex items-center justify-between py-1 px-1 animate-in fade-in duration-100 text-xs">
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#38bdf8' }}
                >
                  <CreditCard className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-xs" style={{ color: '#ffffff' }}>PAX POS Terminal #02</div>
                  <div className="text-[10px]" style={{ color: '#94a3b8' }}>Tap / Chip / Swipe</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold font-mono" style={{ color: '#10b981' }}>Charge: ₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* D. SPLIT PAYMENT DETAILS */}
          {paymentMethod === 'split' && (
            <div className="space-y-1.5 pt-0.5 animate-in fade-in duration-100">
              <div className="grid grid-cols-3 gap-2">
                {/* Cash */}
                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <label className="text-[9px] font-bold uppercase" style={{ color: '#94a3b8' }}>Cash</label>
                    <button
                      type="button"
                      onClick={() => setSplitDetails(prev => ({ ...prev, cash: (prev.cash || 0) + remainingInSplit }))}
                      className="text-[9px] font-bold hover:underline cursor-pointer"
                      style={{ color: '#38bdf8' }}
                    >
                      +Fill
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#94a3b8' }}>₹</span>
                    <input
                      type="number"
                      min="0"
                      max={grandTotal}
                      value={splitDetails.cash || ''}
                      onChange={e =>
                        setSplitDetails(prev => ({ ...prev, cash: Number(e.target.value) || 0 }))
                      }
                      className="w-full pl-5 pr-1 py-1 rounded text-xs font-bold focus:outline-emerald-500"
                      style={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#ffffff' }}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* UPI */}
                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <label className="text-[9px] font-bold uppercase" style={{ color: '#94a3b8' }}>UPI</label>
                    <button
                      type="button"
                      onClick={() => setSplitDetails(prev => ({ ...prev, upi: (prev.upi || 0) + remainingInSplit }))}
                      className="text-[9px] font-bold hover:underline cursor-pointer"
                      style={{ color: '#38bdf8' }}
                    >
                      +Fill
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#94a3b8' }}>₹</span>
                    <input
                      type="number"
                      min="0"
                      max={grandTotal}
                      value={splitDetails.upi || ''}
                      onChange={e =>
                        setSplitDetails(prev => ({ ...prev, upi: Number(e.target.value) || 0 }))
                      }
                      className="w-full pl-5 pr-1 py-1 rounded text-xs font-bold focus:outline-emerald-500"
                      style={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#ffffff' }}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Card */}
                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <label className="text-[9px] font-bold uppercase" style={{ color: '#94a3b8' }}>Card</label>
                    <button
                      type="button"
                      onClick={() => setSplitDetails(prev => ({ ...prev, card: (prev.card || 0) + remainingInSplit }))}
                      className="text-[9px] font-bold hover:underline cursor-pointer"
                      style={{ color: '#38bdf8' }}
                    >
                      +Fill
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#94a3b8' }}>₹</span>
                    <input
                      type="number"
                      min="0"
                      max={grandTotal}
                      value={splitDetails.card || ''}
                      onChange={e =>
                        setSplitDetails(prev => ({ ...prev, card: Number(e.target.value) || 0 }))
                      }
                      className="w-full pl-5 pr-1 py-1 rounded text-xs font-bold focus:outline-emerald-500"
                      style={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#ffffff' }}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Split Summary Bar */}
              <div className="flex items-center justify-between text-xs px-1 font-mono">
                <span style={{ color: '#cbd5e1' }}>
                  Allocated: <strong style={{ color: '#ffffff' }}>₹{totalPaidInSplit}</strong> / ₹{grandTotal}
                </span>
                <span className="font-bold" style={{ color: isSplitValid ? '#10b981' : '#fbbf24' }}>
                  {isSplitValid ? '✓ Split Balanced' : `Remaining: ₹${remainingInSplit}`}
                </span>
              </div>

              {!isSplitValid && (
                <div 
                  className="text-[10px] px-2 py-0.5 rounded-lg"
                  style={{ backgroundColor: 'rgba(120, 53, 15, 0.4)', border: '1px solid #b45309', color: '#fde68a' }}
                >
                  The combined amount must equal ₹{grandTotal}.
                </div>
              )}
            </div>
          )}

          {/* Bottom Action Row */}
          <div className="flex items-center justify-between gap-3 mt-3 pt-2 border-t border-slate-800">
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#1e293b',
                color: '#cbd5e1',
                border: '1px solid #334155',
                fontWeight: 600
              }}
              className="px-5 py-2.5 rounded-xl hover:bg-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            
            {isWaiter ? (
              <button
                onClick={() => {
                  requestBill(cartTableNumber);
                  onClose();
                }}
                style={{
                  backgroundColor: '#d97706',
                  color: '#ffffff',
                  fontWeight: 800
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-extrabold text-xs shadow-md transition-all uppercase tracking-wider bg-amber-600 hover:bg-amber-500 text-white active:scale-98 cursor-pointer"
              >
                <Check className="w-4 h-4 text-white font-bold" />
                <span style={{ color: '#ffffff', fontWeight: 800 }}>REQUEST BILL FROM CASHIER</span>
              </button>
            ) : (
              <button
                onClick={handleConfirmPayment}
                disabled={
                  (paymentMethod === 'cash' && !isCashSufficient) ||
                  (paymentMethod === 'split' && !isSplitValid)
                }
                style={
                  (paymentMethod === 'cash' && !isCashSufficient) ||
                  (paymentMethod === 'split' && !isSplitValid)
                    ? {
                        backgroundColor: '#1e293b',
                        color: '#64748b',
                        border: '1px solid #334155',
                        fontWeight: 800
                      }
                    : {
                        backgroundColor: '#8b0000',
                        color: '#ffffff',
                        border: '1px solid #b91c1c',
                        fontWeight: 800
                      }
                }
                className={`bill-btn-mark-paid flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-extrabold text-xs shadow-lg transition-all uppercase tracking-wider cursor-pointer ${
                  (paymentMethod === 'cash' && !isCashSufficient) ||
                  (paymentMethod === 'split' && !isSplitValid)
                    ? 'cursor-not-allowed opacity-50'
                    : 'bg-[#8b0000] hover:bg-[#a10000] text-white active:scale-98'
                }`}
              >
                <Check className="w-4 h-4 text-white font-bold" />
                <span style={{ color: '#ffffff', fontWeight: 800 }}>
                  MARK AS PAID (₹{grandTotal.toFixed(2)})
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
