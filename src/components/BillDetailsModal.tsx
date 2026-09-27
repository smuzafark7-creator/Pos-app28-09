import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Receipt, 
  Printer, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Utensils, 
  User, 
  Phone,
  CreditCard,
  Percent,
  Calendar,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Ban,
  Send
} from 'lucide-react';
import { BRANCHES } from '../data/mockData';

const isBillKotSent = (b: { kotSent?: boolean; kotNumber?: string; kotNumbers?: string[]; kotStatus?: string; kotId?: string }) => {
  if (b.kotStatus === 'KOT Sent' || b.kotStatus === 'DISPATCHED') return true;
  if (b.kotSent === true) return true;
  return Boolean(b.kotNumber || (b.kotNumbers && b.kotNumbers.length > 0) || b.kotId);
};

export const BillDetailsModal: React.FC = () => {
  const { 
    activeDetailsBill, 
    isBillDetailsModalOpen, 
    closeBillDetailsModal, 
    openReceiptModal,
    voidBill,
    sendKotForBill,
    currentUser,
    showToast,
    restaurantSettings
  } = useApp();

  const [showVoidDialog, setShowVoidDialog] = useState(false);
  const [voidReason, setVoidReason] = useState('Customer Request');
  const [supervisorPin, setSupervisorPin] = useState('');
  const [pinError, setPinError] = useState(false);

  if (!isBillDetailsModalOpen || !activeDetailsBill) return null;

  const isManagerOrOwner = currentUser?.role === 'manager' || currentUser?.role === 'owner';
  const isVoided = activeDetailsBill.status === 'cancelled';
  const branchObj = BRANCHES.find(b => b.id === activeDetailsBill.branchId) || BRANCHES[0];
  const cgstPercent = activeDetailsBill.cgstPercent ?? (restaurantSettings?.cgstPercent ?? 5.0);
  const sgstPercent = activeDetailsBill.sgstPercent ?? (restaurantSettings?.sgstPercent ?? 5.0);
  const cgst = (activeDetailsBill.cgstAmount !== undefined 
    ? activeDetailsBill.cgstAmount 
    : (activeDetailsBill.subtotal * (cgstPercent / 100))).toFixed(2);
  const sgst = (activeDetailsBill.sgstAmount !== undefined 
    ? activeDetailsBill.sgstAmount 
    : (activeDetailsBill.subtotal * (sgstPercent / 100))).toFixed(2);

  const handleViewBill = () => {
    const billToView = activeDetailsBill;
    closeBillDetailsModal();
    openReceiptModal(billToView);
  };

  const handleReprint = () => {
    const billToPrint = activeDetailsBill;
    closeBillDetailsModal();
    openReceiptModal(billToPrint);
    // Small delay to allow thermal modal to mount before print dialog opens
    setTimeout(() => {
      try {
        window.print();
      } catch {
        // Safe fallback
      }
    }, 250);
    showToast('Printing Receipt', `Thermal receipt triggered for Bill #${billToPrint.billNumber}`, 'info');
  };

  const handleConfirmVoid = () => {
    if (!isManagerOrOwner) {
      if (supervisorPin.trim() !== '1234') {
        setPinError(true);
        showToast('Invalid PIN', 'Supervisor authorization PIN is incorrect (Hint: 1234).', 'error');
        return;
      }
    }

    const authorizedName = isManagerOrOwner ? (currentUser?.name || 'Vikram Sharma (Manager)') : 'Vikram Sharma (Manager Authorizer)';
    voidBill(activeDetailsBill, voidReason, authorizedName);
    setShowVoidDialog(false);
    setSupervisorPin('');
    setPinError(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div 
        className="tax-invoice-modal-box max-w-xl w-full overflow-hidden rounded-2xl border shadow-2xl animate-in zoom-in-95 duration-200 text-slate-200"
        style={{ 
          backgroundColor: '#0b1120', 
          borderColor: '#1e293b', 
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div 
          className="tax-invoice-header px-5 py-4 flex items-center justify-between border-b"
          style={{ backgroundColor: '#0b1120', borderColor: '#1e293b' }}
        >
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold shadow-xs ${isVoided ? 'bg-rose-600' : 'bg-emerald-600'}`}>
              {isVoided ? <Ban className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span 
                  className="tax-invoice-title font-mono tracking-tight"
                  style={{ color: '#ffffff', fontWeight: 800, fontSize: '18px' }}
                >
                  {activeDetailsBill.billNumber}
                </span>
                <span 
                  className={`tax-invoice-status-paid px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wide ${
                    isVoided 
                      ? 'bg-rose-950/80 text-rose-400 border border-rose-800' 
                      : ''
                  }`}
                  style={!isVoided ? {
                    backgroundColor: 'rgba(6, 78, 59, 0.5)',
                    color: '#34d399',
                    border: '1px solid #059669',
                    fontWeight: 800,
                    fontSize: '10px'
                  } : undefined}
                >
                  {isVoided ? 'VOIDED / CANCELLED' : (activeDetailsBill.status === 'paid' ? 'SETTLED & PAID' : activeDetailsBill.status.toUpperCase())}
                </span>
              </div>
              <p 
                className="tax-invoice-subtitle text-[11px] font-mono mt-0.5"
                style={{ color: '#94a3b8', fontSize: '11px' }}
              >
                Tax Invoice Details • Bilaal Restaurant
              </p>
            </div>
          </div>

          <button
            onClick={closeBillDetailsModal}
            className="tax-invoice-close-btn p-1.5 rounded-lg transition-colors cursor-pointer"
            style={{ color: '#94a3b8' }}
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto font-mono text-xs">
          
          {/* Voided Notification Banner */}
          {isVoided && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 flex items-start gap-3">
              <Ban className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-extrabold text-sm text-rose-200">INVOICE VOIDED / CANCELLED</div>
                <div className="text-[11px] text-rose-300/90 mt-0.5">
                  Cancelled By: <strong className="text-white">{activeDetailsBill.cancelledBy || 'Supervisor'}</strong> • Reason: <span className="italic">{activeDetailsBill.cancelReason || 'Supervisor void'}</span>
                </div>
                {activeDetailsBill.voidedAt && (
                  <div className="text-[10px] text-rose-400 mt-0.5 font-mono">
                    Void timestamp: {activeDetailsBill.voidedAt}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Supervisor Void Action Dialog */}
          {showVoidDialog && (
            <div 
              className="p-4 rounded-xl text-slate-200 space-y-3"
              style={{ backgroundColor: '#0d1527', border: '1px solid #991b1b' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  <span className="font-bold text-white text-sm">Void Invoice #{activeDetailsBill.billNumber}</span>
                </div>
                {isManagerOrOwner ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-700">
                    MANAGER DIRECT PERMISSION
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700">
                    SUPERVISOR PIN REQUIRED
                  </span>
                )}
              </div>

              {isManagerOrOwner ? (
                <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-950/40 p-2 rounded-lg border border-emerald-800/40">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Logged in as <strong>{currentUser?.name || 'Vikram Sharma (Manager)'}</strong>. You have direct supervisor authorization to void bills without a PIN.</span>
                </div>
              ) : (
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1 font-semibold">
                    Supervisor Authorization PIN (Branch Manager: Vikram Sharma):
                  </label>
                  <input 
                    type="password"
                    maxLength={6}
                    value={supervisorPin}
                    onChange={e => { setSupervisorPin(e.target.value); setPinError(false); }}
                    placeholder="Enter 4-digit PIN (Hint: 1234)"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-lg text-white font-mono text-xs ${pinError ? 'border-rose-500' : 'border-slate-700'}`}
                  />
                  {pinError && <p className="text-[10px] text-rose-400 mt-1 font-sans">Incorrect PIN. Branch Manager PIN is 1234.</p>}
                </div>
              )}

              <div>
                <label className="text-[11px] text-slate-300 block mb-1 font-semibold">Reason for Cancellation:</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['Customer Dispute', 'Wrong Order Punched', 'Accidental Duplicate', 'Quality/Delay Issue', 'Goodwill / Manager Override'].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setVoidReason(r)}
                      className={`px-2 py-1 rounded text-[10px] font-semibold border cursor-pointer transition-colors ${voidReason === r ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <input 
                  type="text"
                  value={voidReason}
                  onChange={e => setVoidReason(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                  placeholder="Custom cancellation notes..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowVoidDialog(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmVoid}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Confirm Void & Notify KDS</span>
                </button>
              </div>
            </div>
          )}
          
          {/* Metadata Grid (Date, Branch, Order Type, Table, Guest) */}
          <div 
            className="tax-invoice-info-box grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl border"
            style={{ backgroundColor: '#0d1527', borderColor: '#1e293b' }}
          >
            <div>
              <span 
                className="tax-invoice-field-label uppercase block flex items-center gap-1"
                style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 700 }}
              >
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Date & Time</span>
              </span>
              <div 
                className="tax-invoice-field-val mt-0.5 truncate"
                style={{ color: '#ffffff', fontWeight: 600, fontSize: '12px' }}
              >
                {activeDetailsBill.date}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '10px' }}>
                {activeDetailsBill.time}
              </div>
            </div>

            <div>
              <span 
                className="tax-invoice-field-label uppercase block flex items-center gap-1"
                style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 700 }}
              >
                <Building2 className="w-3 h-3 text-slate-400" />
                <span>Branch</span>
              </span>
              <div 
                className="tax-invoice-field-val mt-0.5 truncate"
                title={branchObj.name}
                style={{ color: '#ffffff', fontWeight: 600, fontSize: '12px' }}
              >
                {branchObj.name}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '10px' }}>
                GSTIN: {branchObj.gstin}
              </div>
            </div>

            <div>
              <span 
                className="tax-invoice-field-label uppercase block flex items-center gap-1"
                style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 700 }}
              >
                <Utensils className="w-3 h-3 text-slate-400" />
                <span>Order Type</span>
              </span>
              <div 
                className="tax-invoice-field-val mt-0.5 uppercase truncate"
                style={{ color: '#ffffff', fontWeight: 600, fontSize: '12px' }}
              >
                {activeDetailsBill.orderType.replace('_', ' ')}
              </div>
              {activeDetailsBill.orderType === 'dine_in' && activeDetailsBill.tableNumber && (
                <div style={{ color: '#34d399', fontWeight: 700, fontSize: '10px' }}>
                  {activeDetailsBill.tableNumber}
                </div>
              )}
            </div>

            <div>
              <span 
                className="tax-invoice-field-label uppercase block flex items-center gap-1"
                style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 700 }}
              >
                <User className="w-3 h-3 text-slate-400" />
                <span>Customer</span>
              </span>
              <div 
                className="tax-invoice-field-val mt-0.5 truncate"
                style={{ color: '#ffffff', fontWeight: 600, fontSize: '12px' }}
              >
                {activeDetailsBill.customerName || 'Walk-in Guest'}
              </div>
              {activeDetailsBill.customerMobile && (
                <div style={{ color: '#94a3b8', fontSize: '10px' }}>
                  {activeDetailsBill.customerMobile}
                </div>
              )}
            </div>
          </div>

          {/* Associated KOT Numbers & Status Banner (Kitchen Tickets Strip) */}
          {isBillKotSent(activeDetailsBill) ? (
            <div 
              className="tax-invoice-kot-strip flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-[11px]"
              style={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#cbd5e1' }}
            >
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-700/80 font-bold text-[10px] uppercase">
                  ✓ KOT Sent
                </span>
                <span style={{ color: '#cbd5e1' }}>
                  Kitchen Tickets: <strong style={{ color: '#ffffff' }}>{activeDetailsBill.kotNumbers ? activeDetailsBill.kotNumbers.join(', ') : (activeDetailsBill.kotNumber || 'KOT-10076')}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => sendKotForBill(activeDetailsBill)}
                className="text-[10px] text-emerald-400 hover:text-white underline cursor-pointer font-bold"
                title="Send duplicate / updated ticket to Kitchen KDS"
              >
                Re-send KOT
              </button>
            </div>
          ) : (
            <div 
              className="tax-invoice-kot-strip flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-[11px]"
              style={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#cbd5e1' }}
            >
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-200 border border-amber-600 font-extrabold text-[10px] uppercase animate-pulse">
                  ⚠️ KOT Not Sent
                </span>
                <span style={{ color: '#cbd5e1' }} className="text-xs">
                  Order was settled without food preparation ticket to kitchen.
                </span>
              </div>
              <button
                type="button"
                onClick={() => sendKotForBill(activeDetailsBill)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] transition-colors cursor-pointer shadow-xs"
              >
                <Send className="w-3 h-3" />
                <span>Send KOT Now</span>
              </button>
            </div>
          )}

          {/* Items Breakdown Table */}
          <div 
            className="tax-invoice-items-container border rounded-xl overflow-hidden shadow-2xs"
            style={{ backgroundColor: '#0d1527', borderColor: '#1e293b' }}
          >
            <div 
              className="tax-invoice-items-header px-3 py-2.5 uppercase grid grid-cols-12 border-b"
              style={{ 
                backgroundColor: '#0d1527', 
                borderColor: '#1e293b', 
                color: '#94a3b8', 
                fontWeight: 700, 
                fontSize: '12px' 
              }}
            >
              <span className="col-span-6">Item Description</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-2 text-right">Price</span>
              <span className="col-span-2 text-right">Total</span>
            </div>
            <div className="divide-y" style={{ borderColor: '#1e293b', backgroundColor: '#0d1527' }}>
              {activeDetailsBill.items.map((it, idx) => (
                <div key={idx} className="tax-invoice-item-row px-3 py-2.5 grid grid-cols-12 items-center" style={{ borderColor: '#1e293b' }}>
                  <div className="col-span-6 flex items-center gap-2 min-w-0 pr-1">
                    <span 
                      className="tax-invoice-item-name font-bold truncate"
                      style={{ color: '#ffffff', fontWeight: 700, fontSize: '13px' }}
                    >
                      {it.name}
                    </span>
                    <span 
                      className="tax-invoice-item-badge px-1.5 py-0.5 rounded shrink-0 uppercase tracking-tight"
                      style={{ 
                        backgroundColor: '#1e293b', 
                        color: '#cbd5e1', 
                        border: '1px solid #334155', 
                        fontSize: '10px',
                        fontWeight: 600
                      }}
                    >
                      {it.serveType === 'PARCEL' ? 'PARCEL' : 'DINE-IN'}
                    </span>
                  </div>
                  <span 
                    className="col-span-2 text-center"
                    style={{ color: '#cbd5e1', fontWeight: 600, fontSize: '12px' }}
                  >
                    ×{it.quantity}
                  </span>
                  <span 
                    className="col-span-2 text-right"
                    style={{ color: '#cbd5e1', fontWeight: 600, fontSize: '12px' }}
                  >
                    ₹{it.rate.toFixed(2)}
                  </span>
                  <span 
                    className="col-span-2 text-right"
                    style={{ color: '#34d399', fontWeight: 700, fontSize: '12px' }}
                  >
                    ₹{it.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bill Totals & Tax Calculation Breakdown */}
          <div 
            className="tax-invoice-totals-box p-3.5 rounded-xl border space-y-1.5"
            style={{ backgroundColor: '#0d1527', borderColor: '#1e293b' }}
          >
            <div className="tax-invoice-totals-row flex justify-between" style={{ color: '#e2e8f0', fontSize: '12px' }}>
              <span>Subtotal</span>
              <span style={{ color: '#e2e8f0', fontWeight: 600 }}>₹{activeDetailsBill.subtotal.toFixed(2)}</span>
            </div>

            {activeDetailsBill.discountAmount > 0 && (
              <div className="flex justify-between text-amber-400 text-xs">
                <span className="flex items-center gap-1">
                  <Percent className="w-3 h-3" />
                  <span>Discount {activeDetailsBill.discountPercent ? `(${activeDetailsBill.discountPercent}%)` : ''}</span>
                </span>
                <span className="font-bold">- ₹{activeDetailsBill.discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="tax-invoice-totals-row flex justify-between text-[11px]" style={{ color: '#e2e8f0' }}>
              <span>CGST ({cgstPercent}%)</span>
              <span style={{ color: '#e2e8f0' }}>₹{cgst}</span>
            </div>
            <div className="tax-invoice-totals-row flex justify-between text-[11px]" style={{ color: '#e2e8f0' }}>
              <span>SGST ({sgstPercent}%)</span>
              <span style={{ color: '#e2e8f0' }}>₹{sgst}</span>
            </div>

            <div 
              className="pt-2 border-t flex justify-between items-baseline"
              style={{ borderColor: '#1e293b' }}
            >
              <span 
                className="tax-invoice-grand-label uppercase tracking-wider"
                style={{ color: '#ffffff', fontWeight: 800, fontSize: '15px' }}
              >
                GRAND TOTAL
              </span>
              <span 
                className="tax-invoice-grand-val"
                style={{ color: '#10b981', fontWeight: 900, fontSize: '18px' }}
              >
                ₹{activeDetailsBill.grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Method & Settlement Details Strip */}
          <div 
            className="tax-invoice-payment-strip p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
          >
            <div>
              <span 
                className="text-[10px] font-bold uppercase block"
                style={{ color: '#94a3b8' }}
              >
                Payment Method & Details
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                <span 
                  className="font-extrabold text-xs uppercase"
                  style={{ color: '#cbd5e1' }}
                >
                  {activeDetailsBill.paymentMethod}
                </span>
              </div>

              {activeDetailsBill.paymentMethod === 'split' && activeDetailsBill.splitDetails && (
                <div className="text-[11px] mt-1 flex flex-wrap gap-2 font-mono" style={{ color: '#cbd5e1' }}>
                  {activeDetailsBill.splitDetails.cash > 0 && <span>Cash: ₹{activeDetailsBill.splitDetails.cash}</span>}
                  {activeDetailsBill.splitDetails.upi > 0 && <span>UPI: ₹{activeDetailsBill.splitDetails.upi}</span>}
                  {activeDetailsBill.splitDetails.card > 0 && <span>Card: ₹{activeDetailsBill.splitDetails.card}</span>}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-[11px]" style={{ color: '#cbd5e1' }}>
                Cashier: <strong style={{ color: '#ffffff' }}>{activeDetailsBill.cashierName || 'Counter'}</strong>
              </span>
              <div 
                className="px-2.5 py-0.5 rounded font-black text-[10px] uppercase tracking-wider shadow-2xs"
                style={{ 
                  backgroundColor: 'rgba(6, 78, 59, 0.6)', 
                  color: '#34d399', 
                  border: '1px solid #059669' 
                }}
              >
                PAID
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons: [ Close ] [ Void Bill ] [ Re-send KOT ] [ View Bill ] [ Reprint Receipt ] */}
        <div 
          className="p-4 border-t flex flex-wrap items-center justify-between gap-2 font-mono"
          style={{ backgroundColor: '#0b1120', borderColor: '#1e293b' }}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={closeBillDetailsModal}
              className="tax-invoice-btn-close px-4 py-2 rounded-lg font-bold text-xs transition-colors cursor-pointer"
              style={{ 
                backgroundColor: 'rgba(30, 41, 59, 0.8)', 
                color: '#cbd5e1', 
                border: '1px solid #334155' 
              }}
            >
              Close
            </button>

            {!isVoided && !showVoidDialog && (
              <button
                type="button"
                onClick={() => setShowVoidDialog(true)}
                className="tax-invoice-btn-void flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                style={{ 
                  backgroundColor: 'rgba(69, 10, 10, 0.4)', 
                  color: '#f87171', 
                  border: '1px solid #991b1b' 
                }}
                title="Supervisor Void / Cancel Invoice"
              >
                <Ban className="w-3.5 h-3.5 text-rose-400" />
                <span>Void Bill</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => sendKotForBill(activeDetailsBill)}
              className="tax-invoice-btn-secondary flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs transition-colors cursor-pointer"
              style={{ 
                backgroundColor: '#1e293b', 
                color: '#e2e8f0', 
                border: '1px solid #334155' 
              }}
              title={isBillKotSent(activeDetailsBill) ? 'Push ticket copy to Kitchen KDS' : 'Send food preparation ticket to Kitchen KDS'}
            >
              {isBillKotSent(activeDetailsBill) ? (
                <>
                  <Utensils className="w-3.5 h-3.5 text-slate-400" />
                  <span>Re-send KOT</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-white" />
                  <span>Send KOT to Kitchen</span>
                </>
              )}
            </button>

            <button
              onClick={handleViewBill}
              className="tax-invoice-btn-secondary flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs transition-colors cursor-pointer"
              style={{ 
                backgroundColor: '#1e293b', 
                color: '#e2e8f0', 
                border: '1px solid #334155' 
              }}
              title="Open full 80mm thermal receipt preview"
            >
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>View Bill</span>
            </button>

            <button
              onClick={handleReprint}
              className="tax-invoice-btn-reprint flex items-center gap-1.5 px-5 py-2 rounded-lg font-extrabold text-xs transition-colors cursor-pointer text-white shadow-sm"
              style={{ 
                backgroundColor: '#8b0000', 
                border: '1px solid #dc2626',
                color: '#ffffff'
              }}
              title="Reprint thermal receipt slip"
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              <span>Reprint Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
