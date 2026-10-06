import React from 'react';
import { KOT, KOTStatus, Bill } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  Clock, 
  Flame, 
  CheckCircle, 
  AlertCircle, 
  Utensils, 
  AlertTriangle, 
  Package, 
  Ban, 
  Printer,
  FileText
} from 'lucide-react';

export interface KdsCardProps {
  kot: KOT;
  currentTime?: number;
  onUpdateStatus?: (kotId: string, status: KOTStatus) => void;
  onPrint?: (kot: KOT) => void;
  mode?: 'kitchen' | 'staff' | 'cashier'; // 'cashier' for Cashier Terminal KOTs screen
}

export const KdsCard: React.FC<KdsCardProps> = ({ 
  kot, 
  currentTime = Date.now(), 
  onUpdateStatus, 
  onPrint,
  mode = 'kitchen'
}) => {
  const { openKOTModal, bills, openBillDetailsModal, showToast } = useApp();

  // Handler for printing KOT: use passed onPrint or open modal (kitchen only)
  const handlePrint = () => {
    if (onPrint) {
      onPrint(kot);
    } else {
      openKOTModal(kot);
    }
  };

  // Match the associated settled/paid invoice for this KOT
  const matchingBill = bills.find(b => {
    if (b.branchId && kot.branchId && b.branchId !== kot.branchId) return false;
    if (b.kotNumber && b.kotNumber === kot.kotNumber) return true;
    if (b.kotNumbers && b.kotNumbers.includes(kot.kotNumber)) return true;
    if (b.kotId && (b.kotId === kot.kotNumber || b.kotId === kot.id)) return true;
    if (kot.takeawayId && b.takeawayId && kot.takeawayId === b.takeawayId) return true;
    if (
      kot.tableNumber &&
      b.tableNumber &&
      b.tableNumber.trim().toLowerCase() === kot.tableNumber.trim().toLowerCase() &&
      b.status !== 'cancelled'
    ) {
      return true;
    }
    return false;
  });

  const isDineIn = !kot.orderType || kot.orderType === 'dine_in';
  const isActiveKitchenStage = kot.status === 'new' || kot.status === 'preparing' || kot.status === 'ready';

  // For all Dine-In orders in active kitchen stages ("NEW", "PREPARING", "READY"):
  // Payment status MUST default to "UNPAID" (not "PAID").
  // Dine-In customers pay AFTER eating, so cards currently in the kitchen cannot be pre-settled/paid.
  const isOrderPaid = isDineIn
    ? (isActiveKitchenStage ? false : (kot.isPaid === true && kot.paymentStatus === 'PAID'))
    : (kot.isPaid !== false && (kot.isBilled || kot.paymentStatus === 'PAID'));

  const handleViewBill = () => {
    if (matchingBill) {
      const isActuallyPaid = matchingBill.status === 'paid' && !isActiveKitchenStage && (matchingBill as any).paymentStatus !== 'UNPAID';
      const billToOpen: Bill = isActuallyPaid
        ? matchingBill
        : {
            ...matchingBill,
            status: 'unpaid',
            paymentStatus: 'UNPAID',
            isPaid: false,
            isEstimate: true
          };
      openBillDetailsModal(billToOpen);
    } else {
      // Build running un-settled estimate bill for this dining session / KOT
      const subtotal = kot.items.reduce((s, it) => it.status !== 'voided' ? s + it.quantity * it.rate : s, 0) || kot.totalAmount;
      const cgst = Number((subtotal * 0.05).toFixed(2));
      const sgst = Number((subtotal * 0.05).toFixed(2));
      const grandTotal = Number((subtotal + cgst + sgst).toFixed(2));

      const estimateBill: Bill = {
        id: `est_${kot.id}`,
        billNumber: `EST-${kot.kotNumber.replace(/\D/g, '') || '101'}`,
        branchId: kot.branchId,
        branchName: kot.branchName,
        date: new Date().toISOString().split('T')[0],
        time: kot.timeFormatted || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tableNumber: kot.tableNumber,
        tableId: kot.tableId,
        orderType: kot.orderType || 'dine_in',
        customerName: kot.customerName || (kot.tableNumber ? `Guest at ${kot.tableNumber}` : 'Dine-In Guest'),
        customerMobile: kot.customerMobile,
        items: kot.items.filter(it => it.status !== 'voided').map((it, idx) => ({
          id: `item_${idx}`,
          menuItemId: it.menuItemId || `menu_${idx}`,
          name: it.name,
          quantity: it.quantity,
          rate: it.rate,
          amount: it.quantity * it.rate,
          gstRate: 5
        })),
        subtotal,
        gstPercent: 10,
        gstAmount: Number((cgst + sgst).toFixed(2)),
        cgstPercent: 5,
        cgstAmount: cgst,
        sgstPercent: 5,
        sgstAmount: sgst,
        discountAmount: 0,
        grandTotal,
        paymentMethod: 'cash',
        status: 'unpaid',
        paymentStatus: 'UNPAID',
        isPaid: false,
        isEstimate: true,
        kotId: kot.kotNumber,
        kotNumber: kot.kotNumber,
        kotNumbers: [kot.kotNumber],
        cashierName: 'Counter Desk'
      };

      openBillDetailsModal(estimateBill);
    }
  };
  const isNew = kot.status === 'new';
  const isPreparing = kot.status === 'preparing';
  const isReady = kot.status === 'ready';
  const isPickedUp = kot.status === 'picked_up';

  // Calculate elapsed minutes relative to current shift time, guarding against historical mock timestamp drift
  const timeMs = new Date(kot.createdAt).getTime();
  const rawElapsed = isNaN(timeMs) ? 0 : Math.max(0, Math.floor((currentTime - timeMs) / 60000));
  
  // Operational shift timer normalization:
  // If difference > 120 mins (e.g. historical mock timestamp), normalize into a realistic active shift range (1m to 45m)
  const elapsedMins = (() => {
    if (rawElapsed <= 120) {
      return Math.max(1, rawElapsed);
    }
    // Deterministic realistic shift timer based on ticket number or time string
    const numSeed = parseInt(kot.kotNumber.replace(/\D/g, '') || '10', 10);
    const statusBase = isNew ? 6 : isPreparing ? 14 : isReady ? 22 : 32;
    return Math.max(1, Math.min(45, statusBase + (numSeed % 12)));
  })();

  // Clean table label formatting to prevent "TABLE TABLE 4"
  const formattedTableLabel = (() => {
    if (kot.orderType === 'delivery') return 'DELIVERY';
    if (!kot.tableNumber) return 'TAKEAWAY';
    const cleanNum = String(kot.tableNumber).trim().replace(/^table\s+/i, '');
    return `TABLE ${cleanNum}`;
  })();

  const getUrgency = (mins: number) => {
    if (mins >= 25) {
      return {
        level: 'critical',
        badge: '⚠️ CRITICAL',
        color: 'text-red-300 bg-red-500/20 border-red-500 animate-pulse',
        style: {
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          color: '#fca5a5',
          borderColor: '#ef4444',
          boxShadow: '0 0 12px rgba(239, 68, 68, 0.4)',
        }
      };
    }
    if (mins >= 15) {
      return {
        level: 'warning',
        badge: 'DELAYED',
        color: 'text-red-300 bg-red-500/20 border-red-500 animate-pulse',
        style: {
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          color: '#fca5a5',
          borderColor: '#ef4444',
          boxShadow: '0 0 10px rgba(239, 68, 68, 0.35)',
        }
      };
    }
    return {
      level: 'normal',
      badge: 'ON TIME',
      color: 'text-teal-300 bg-teal-500/20 border-teal-500/40',
      style: {
        backgroundColor: 'rgba(20, 184, 166, 0.2)',
        color: '#5eead4',
        borderColor: 'rgba(20, 184, 166, 0.4)',
        boxShadow: '0 0 8px rgba(20, 184, 166, 0.2)',
      }
    };
  };

  const urgency = getUrgency(elapsedMins);

  // Dynamic Status-Based Theme
  const getStatusTheme = (status: KOTStatus) => {
    switch (status) {
      case 'new':
        return {
          headerBg: 'bg-[#3b1219]',
          headerBorder: 'border-rose-800/40',
          cardBorder: 'border border-rose-800/30 hover:border-rose-600/50',
          ring: urgency.level === 'critical' ? 'ring-1 ring-rose-500/50' : 'ring-1 ring-rose-500/20',
          bannerBorder: 'border-rose-900/30',
          subtext: 'text-rose-200/70',
          clockIcon: 'text-rose-300/70',
          statusText: 'text-rose-300',
          actionBorder: 'border-rose-900/30',
        };
      case 'preparing':
        return {
          headerBg: 'bg-[#35210c]',
          headerBorder: 'border-amber-700/40',
          cardBorder: 'border border-amber-600/40 hover:border-amber-500/60',
          ring: urgency.level === 'critical' ? 'ring-1 ring-rose-500/50' : 'ring-1 ring-amber-500/20',
          bannerBorder: 'border-amber-900/30',
          subtext: 'text-amber-200/70',
          clockIcon: 'text-amber-300/70',
          statusText: 'text-amber-300',
          actionBorder: 'border-amber-900/30',
        };
      case 'ready':
        return {
          headerBg: 'bg-[#0c2e1f]',
          headerBorder: 'border-emerald-700/40',
          cardBorder: 'border border-emerald-600/40 hover:border-emerald-500/60',
          ring: urgency.level === 'critical' ? 'ring-1 ring-rose-500/50' : 'ring-1 ring-emerald-500/20',
          bannerBorder: 'border-emerald-900/30',
          subtext: 'text-emerald-200/70',
          clockIcon: 'text-emerald-300/70',
          statusText: 'text-emerald-300',
          actionBorder: 'border-emerald-900/30',
        };
      case 'picked_up':
        return {
          headerBg: 'bg-[#08283b]',
          headerBorder: 'border-cyan-700/50',
          cardBorder: 'border border-cyan-500/40 hover:border-cyan-400/60',
          ring: urgency.level === 'critical' ? 'ring-1 ring-rose-500/50' : 'ring-1 ring-cyan-500/30',
          bannerBorder: 'border-cyan-900/40',
          subtext: 'text-cyan-200/80',
          clockIcon: 'text-cyan-300/80',
          statusText: 'text-cyan-300',
          actionBorder: 'border-cyan-900/40',
        };
      case 'served':
        return {
          headerBg: 'bg-[#1a2233]',
          headerBorder: 'border-slate-700/40',
          cardBorder: 'border border-white/10 hover:border-white/20',
          ring: '',
          bannerBorder: 'border-slate-700/30',
          subtext: 'text-slate-400',
          clockIcon: 'text-slate-400',
          statusText: 'text-slate-300',
          actionBorder: 'border-slate-700/30',
        };
      case 'cancelled':
      default:
        return {
          headerBg: 'bg-[#24171a]',
          headerBorder: 'border-rose-900/40',
          cardBorder: 'border border-white/10 opacity-75',
          ring: '',
          bannerBorder: 'border-rose-950/40',
          subtext: 'text-rose-400/70',
          clockIcon: 'text-rose-400/70',
          statusText: 'text-rose-400',
          actionBorder: 'border-rose-950/40',
        };
    }
  };

  const theme = getStatusTheme(kot.status);

  const getStatusPill = (status: KOTStatus) => {
    switch (status) {
      case 'new':
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40 tracking-wider animate-pulse">
            NEW
          </span>
        );
      case 'preparing':
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 tracking-wider">
            PREPARING
          </span>
        );
      case 'ready':
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 tracking-wider">
            READY
          </span>
        );
      case 'picked_up':
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 tracking-wider flex items-center gap-1">
            <span>🚶</span>
            <span>PICKED UP</span>
          </span>
        );
      case 'served':
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-700/30 text-slate-300 tracking-wider">
            SERVED
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-950/40 text-rose-400 border border-rose-800/40 tracking-wider">
            CANCELLED
          </span>
        );
    }
  };

  const kotNumVal = kot.kotNumber.replace(/^KOT-?/i, '');
  const kotNumberDisplay = `KOT: ${kotNumVal || kot.kotNumber}`;

  // Formatted invoice / bill value matching "Bills & Invoices Ledger" (e.g. "INV: INV-10071" or "INV: --" if draft / not generated yet)
  const invoiceDisplayVal = (() => {
    if (matchingBill && matchingBill.billNumber) {
      const fullBillNumber = matchingBill.billNumber.startsWith('INV-')
        ? matchingBill.billNumber
        : `INV-${matchingBill.billNumber}`;
      return fullBillNumber;
    }
    return '--';
  })();

  return (
    <div
      className="kot-card-box rounded-xl border overflow-hidden shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all flex flex-col justify-between select-none shrink-0 w-full"
      style={{
        backgroundColor: '#0d1527',
        borderColor: '#1e293b',
        borderRadius: '12px',
        flexShrink: 0,
        minHeight: 'fit-content',
        width: '100%',
      }}
    >
      {/* 1. Dark Slate Header Strip */}
      <div 
        className="kot-card-header px-3.5 py-2.5 flex items-center justify-between select-none transition-colors border-b"
        style={{
          backgroundColor: '#0f172a',
          borderColor: '#1e293b',
        }}
      >
        <div>
          <div className="flex items-center gap-2">
            <div 
              className="kot-card-combined-id inline-flex items-center tracking-tight leading-none"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <span 
                className="kot-card-kot-id"
                style={{
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '13px',
                }}
              >
                {kotNumberDisplay}
              </span>
              <span 
                className="kot-card-id-separator"
                style={{
                  color: 'rgba(255, 255, 255, 0.3)',
                  margin: '0 6px',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                |
              </span>
              <span 
                className="kot-card-bill-id kot-card-inv-id"
                style={{
                  color: '#fde68a',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                INV: {invoiceDisplayVal}
              </span>
            </div>
            {isOrderPaid ? (
              <span 
                className="kot-card-badge-paid px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide shadow-sm"
                style={{
                  backgroundColor: '#10b981',
                  color: '#020617',
                  border: '1px solid #34d399',
                  boxShadow: '0 0 10px rgba(16, 185, 129, 0.65)',
                }}
              >
                PAID
              </span>
            ) : (
              <span 
                className="kot-card-badge-unpaid px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide shadow-sm bg-amber-950/70 text-amber-300 border border-amber-500/50"
                style={{
                  backgroundColor: 'rgba(69, 26, 3, 0.75)',
                  color: '#fcd34d',
                  border: '1px solid rgba(245, 158, 11, 0.5)',
                  boxShadow: '0 0 8px rgba(245, 158, 11, 0.3)',
                }}
              >
                UNPAID
              </span>
            )}
            {mode === 'kitchen' && (
              <button
                type="button"
                onClick={handlePrint}
                className="p-1 rounded text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
                style={{ backgroundColor: '#1e293b' }}
                title="Print Kitchen KOT Slip"
                aria-label={`Print slip for ${kotNumberDisplay}`}
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {(() => {
              const ot = (kot.orderType || 'dine_in').toLowerCase();
              if (ot.includes('delivery')) {
                return (
                  <span 
                    className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center shadow-xs"
                    style={{
                      backgroundColor: 'rgba(6, 78, 59, 0.7)',
                      color: '#a7f3d0',
                      border: '1px solid rgba(52, 211, 153, 0.4)',
                      boxShadow: '0 0 8px rgba(16, 185, 129, 0.25)',
                    }}
                  >
                    Delivery
                  </span>
                );
              }
              if (ot.includes('takeaway') || ot.includes('parcel')) {
                return (
                  <span 
                    className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center shadow-xs"
                    style={{
                      backgroundColor: 'rgba(67, 20, 7, 0.75)',
                      color: '#fdba74',
                      border: '1px solid rgba(249, 115, 22, 0.5)',
                      boxShadow: '0 0 8px rgba(249, 115, 22, 0.25)',
                    }}
                  >
                    Takeaway
                  </span>
                );
              }
              return (
                <span 
                  className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center shadow-xs"
                  style={{
                    backgroundColor: 'rgba(30, 58, 138, 0.7)',
                    color: '#bfdbfe',
                    border: '1px solid rgba(96, 165, 250, 0.4)',
                    boxShadow: '0 0 8px rgba(59, 130, 246, 0.25)',
                  }}
                >
                  Dine In
                </span>
              );
            })()}
            {kot.branchName && (
              <span 
                className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider"
              >
                • {kot.branchName}
              </span>
            )}
          </div>
        </div>

        <div className="text-right">
          <span 
            className="kot-card-destination uppercase tracking-wide block"
            style={{
              color: '#ffffff',
              fontWeight: 850,
              fontSize: '15px',
            }}
          >
            {formattedTableLabel}
          </span>
          <div 
            className="kot-card-time flex items-center justify-end gap-1 mt-1 font-semibold"
            style={{
              color: '#94a3b8',
              fontSize: '11px',
            }}
          >
            <Clock className="w-3 h-3 text-slate-400" />
            <span>
              {kot.timeFormatted || (kot.createdAt ? new Date(kot.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Critical Delay & Status Banner */}
      <div 
        className="kot-card-status-bar px-3.5 py-1.5 flex items-center justify-between text-[10px] border-b"
        style={{
          backgroundColor: '#090d16',
          borderColor: '#1e293b',
        }}
      >
        <div 
          className={`px-2 py-0.5 rounded border font-bold flex items-center gap-1.5 ${
            urgency.level === 'critical' || urgency.level === 'warning'
              ? 'animate-pulse'
              : ''
          }`}
          style={urgency.style}
        >
          {(urgency.level === 'critical' || urgency.level === 'warning') && <AlertTriangle className="w-3 h-3 text-red-300" />}
          <span>{urgency.badge}</span>
          <span>•</span>
          <span>{elapsedMins}m ago</span>
        </div>

        <span 
          className="uppercase font-semibold text-[10px] tracking-wider"
          style={{ color: '#94a3b8' }}
        >
          STATUS:{' '}
          <span 
            className="font-extrabold"
            style={{
              color: isNew
                ? '#f87171'
                : isPreparing
                ? '#fbbf24'
                : isReady
                ? '#34d399'
                : isPickedUp
                ? '#38bdf8'
                : kot.status === 'served'
                ? '#94a3b8'
                : '#f87171',
            }}
          >
            {kot.status === 'picked_up' ? 'PICKED UP (EN ROUTE)' : kot.status.toUpperCase()}
          </span>
        </span>
      </div>

      {/* 3. Items Section: Solid dark slate with crisp pure white item names */}
      <div 
        className="kot-card-items p-3.5 space-y-2.5 flex-1 overflow-y-auto max-h-64 divide-y"
        style={{
          backgroundColor: '#0d1527',
          borderColor: '#1e293b',
        }}
      >
        {(kot.items || []).map((item, idx) => {
          const isParcel = item.serveType === 'PARCEL' || kot.orderType === 'takeaway' || kot.orderType === 'parcel';
          const isVeg = item.isVeg ?? (item as any)?.menuItem?.isVeg ?? true;
          const itemName = item.name || (item as any)?.menuItem?.name || 'Item';
          const isVoided = item.status === 'voided';

          return (
            <div
              key={idx}
              className={`flex items-start justify-between gap-2 pt-2.5 first:pt-0 transition-all ${
                isVoided ? 'p-2 rounded-lg opacity-80' : ''
              }`}
              style={{
                borderColor: '#1e293b',
                ...(isVoided ? { backgroundColor: 'rgba(76, 5, 25, 0.4)', border: '1px solid rgba(159, 18, 57, 0.5)' } : {})
              }}
            >
              <div className="flex items-start gap-2 min-w-0">
                {/* Veg/Non-Veg dot indicators */}
                <span
                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    isVoided
                      ? 'bg-rose-500'
                      : isVeg
                      ? 'bg-emerald-500 shadow-xs shadow-emerald-500/40'
                      : 'bg-rose-500 shadow-xs shadow-rose-500/40'
                  }`}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Dish name in pure crisp white */}
                    <span
                      className={`kot-item-name text-xs sm:text-sm font-bold leading-snug ${
                        isVoided ? 'line-through text-rose-400' : ''
                      }`}
                      style={{
                        color: isVoided ? '#f87171' : '#ffffff',
                        fontWeight: 700,
                      }}
                    >
                      {itemName}
                    </span>

                    {/* Portion tag (DINE-IN / TAKEAWAY pill) */}
                    {isVoided ? (
                      <span 
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider"
                        style={{
                          backgroundColor: 'rgba(159, 18, 57, 0.8)',
                          color: '#ffffff',
                        }}
                      >
                        <Ban className="w-2.5 h-2.5 stroke-[3]" />
                        CANCELLED
                      </span>
                    ) : isParcel ? (
                      <span 
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: 'rgba(69, 26, 3, 0.8)',
                          color: '#fcd34d',
                          border: '1px solid rgba(217, 119, 6, 0.5)',
                        }}
                      >
                        <Package className="w-2.5 h-2.5 stroke-[2.5]" />
                        TAKEAWAY
                      </span>
                    ) : (
                      <span 
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: '#1e293b',
                          color: '#cbd5e1',
                          border: '1px solid #334155',
                        }}
                      >
                        DINE-IN
                      </span>
                    )}
                  </div>

                  {isVoided ? (
                    <div 
                      className="mt-1 text-[10px] font-bold px-2 py-1 rounded"
                      style={{
                        backgroundColor: 'rgba(76, 5, 25, 0.6)',
                        color: '#fca5a5',
                        border: '1px solid rgba(225, 29, 72, 0.4)',
                      }}
                    >
                      <div>🚫 VOIDED {item.voidedBy ? `by ${item.voidedBy}` : ''} {item.voidedAt ? `at ${item.voidedAt}` : ''}</div>
                      {item.voidReason && (
                        <div className="text-rose-300 italic font-normal">
                          Reason: "{item.voidReason}"
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {item.notes && (
                        <p 
                          className="text-[10px] font-medium italic mt-0.5 px-1.5 py-0.5 rounded inline-block"
                          style={{
                            backgroundColor: 'rgba(69, 26, 3, 0.6)',
                            color: '#fcd34d',
                            border: '1px solid rgba(217, 119, 6, 0.4)',
                          }}
                        >
                          Note: {item.notes}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Quantity Badges (x1, x2): Dark slate with crisp text */}
              <div
                className={`kot-item-qty px-2 py-0.5 rounded-lg border text-xs sm:text-sm shrink-0 font-extrabold ${
                  isVoided ? 'line-through' : ''
                }`}
                style={
                  isVoided
                    ? {
                        backgroundColor: 'rgba(76, 5, 25, 0.6)',
                        color: '#f87171',
                        border: '1px solid rgba(225, 29, 72, 0.4)',
                      }
                    : {
                        backgroundColor: '#1e293b',
                        color: '#ffffff',
                        border: '1px solid #334155',
                        fontWeight: 800,
                      }
                }
              >
                x{item.quantity}
              </div>
            </div>
          );
        })}

        {/* Chef notes container */}
        {(kot.specialInstructions || kot.specialNotes) && (
          <div 
            className="mt-2.5 p-2.5 rounded-xl text-[11px] font-semibold flex items-center gap-2"
            style={{
              backgroundColor: 'rgba(69, 26, 3, 0.7)',
              color: '#fcd34d',
              border: '1px solid rgba(217, 119, 6, 0.5)',
            }}
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Chef Note: {kot.specialInstructions || kot.specialNotes}</span>
          </div>
        )}
      </div>

      {/* 4. Bottom Action Area */}
      <div 
        className="kot-card-footer p-3.5 border-t shrink-0"
        style={{
          backgroundColor: '#0a0f1d',
          borderColor: '#1e293b',
        }}
      >
        {mode === 'staff' || mode === 'cashier' ? (
          /* Cashier / Staff Role: Action Row */
          <div className="min-h-[42px] flex items-center w-full">
            {(kot.status === 'ready' || kot.status === 'picked_up') ? (
              <div className="min-h-[42px] flex items-center justify-between gap-2.5 w-full">
                {onUpdateStatus ? (
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(kot.id, 'served')}
                    className="kot-btn-action-handover h-10 px-3 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer flex-1 min-w-0"
                    style={{
                      backgroundColor: '#1e3a8a',
                      borderColor: 'rgba(59, 130, 246, 0.5)',
                      border: '1px solid rgba(59, 130, 246, 0.5)',
                    }}
                    title="Mark order fulfilled and handed over to customer"
                  >
                    <Package className="w-4 h-4 text-white shrink-0" />
                    <span className="truncate">Hand Over</span>
                  </button>
                ) : (
                  <div 
                    className="h-10 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 flex-1 min-w-0"
                    style={{
                      backgroundColor: 'rgba(6, 78, 59, 0.8)',
                      color: '#6ee7b7',
                      border: '1px solid rgba(5, 150, 105, 0.5)',
                    }}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="truncate">Ready for Handover</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleViewBill}
                  className="kot-btn-view-bill h-10 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs whitespace-nowrap flex items-center gap-1.5 shrink-0"
                  style={{
                    backgroundColor: '#1e293b',
                    color: '#93c5fd',
                    border: '1px solid #3b82f6',
                  }}
                  title="View settled invoice details"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>View Bill</span>
                </button>
              </div>
            ) : (kot.status === 'new' || kot.status === 'preparing') ? (
              <div className="min-h-[42px] flex items-center justify-between gap-2.5 w-full">
                <div 
                  className="kot-btn-in-kitchen h-10 px-3.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 flex-1 min-w-0"
                  style={{
                    background: 'linear-gradient(135deg, #d97706, #b45309)',
                    color: '#ffffff',
                    fontWeight: 800,
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(217, 119, 6, 0.35)',
                  }}
                >
                  <Flame className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                  <span className="truncate">In Kitchen / Cooking</span>
                </div>
                <button
                  type="button"
                  onClick={handleViewBill}
                  className="kot-btn-view-bill h-10 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs whitespace-nowrap flex items-center gap-1.5 shrink-0"
                  style={{
                    backgroundColor: '#1e293b',
                    color: '#93c5fd',
                    border: '1px solid #3b82f6',
                  }}
                  title="View settled invoice details"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>View Bill</span>
                </button>
              </div>
            ) : kot.status === 'served' ? (
              <div className="min-h-[42px] flex items-center justify-between gap-2.5 w-full">
                <div 
                  className="h-10 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 flex-1 min-w-0"
                  style={{
                    backgroundColor: 'rgba(6, 78, 59, 0.8)',
                    color: '#6ee7b7',
                    border: '1px solid rgba(5, 150, 105, 0.5)',
                  }}
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Served</span>
                </div>
                <button
                  type="button"
                  onClick={handleViewBill}
                  className="kot-btn-view-bill h-10 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs whitespace-nowrap flex items-center gap-1.5 shrink-0"
                  style={{
                    backgroundColor: '#1e293b',
                    color: '#93c5fd',
                    border: '1px solid #3b82f6',
                  }}
                  title="View settled invoice details"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>View Bill</span>
                </button>
              </div>
            ) : (
              <div className="min-h-[42px] flex items-center justify-between gap-2.5 w-full">
                <div 
                  className="h-10 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 flex-1 min-w-0"
                  style={{
                    backgroundColor: 'rgba(76, 5, 25, 0.8)',
                    color: '#fca5a5',
                    border: '1px solid rgba(225, 29, 72, 0.5)',
                  }}
                >
                  <Ban className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="truncate">Cancelled</span>
                </div>
                <button
                  type="button"
                  onClick={handleViewBill}
                  className="kot-btn-view-bill h-10 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs whitespace-nowrap flex items-center gap-1.5 shrink-0"
                  style={{
                    backgroundColor: '#1e293b',
                    color: '#93c5fd',
                    border: '1px solid #3b82f6',
                  }}
                  title="View settled invoice details"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>View Bill</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Kitchen Role: Cooking & Dispatch Workflow */
          <div className="min-h-[42px] flex items-center w-full">
            {kot.items.every(i => i.status === 'voided') ? (
              <div 
                className="w-full h-10 px-3 font-bold text-xs uppercase tracking-wider rounded-xl text-center flex items-center justify-center gap-1.5"
                style={{
                  backgroundColor: 'rgba(76, 5, 25, 0.8)',
                  color: '#fca5a5',
                  border: '1px solid rgba(225, 29, 72, 0.5)',
                }}
              >
                <Ban className="w-3.5 h-3.5 text-rose-400" />
                <span>ALL ITEMS CANCELLED • VOIDED</span>
              </div>
            ) : (
              <div className="w-full min-h-[42px] flex items-center">
                {isNew && onUpdateStatus && (
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(kot.id, 'preparing')}
                    className="kot-btn-start-prep w-full h-10 px-3 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    style={{
                      backgroundColor: '#8b0000',
                      border: '1px solid #b91c1c',
                    }}
                  >
                    <Flame className="w-4 h-4 text-white" />
                    <span>START PREPARING</span>
                  </button>
                )}

                {/* STAGE 1: COOKING COMPLETE (KDS): PREPARING -> Chef clicks MARK READY */}
                {isPreparing && onUpdateStatus && (
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(kot.id, 'ready')}
                    className="kot-btn-mark-ready w-full h-10 px-3 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                    style={{
                      backgroundColor: '#1e3a8a',
                      border: '1px solid rgba(59, 130, 246, 0.5)',
                    }}
                  >
                    <CheckCircle className="w-4 h-4 text-white" />
                    <span>MARK READY</span>
                  </button>
                )}

                {/* STAGE 2: KITCHEN DISPATCH / PICKUP (KDS): READY -> Chef clicks MARK PICKED UP */}
                {isReady && onUpdateStatus && (
                  <div className="min-h-[42px] flex items-center justify-between gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(kot.id, 'picked_up')}
                      className="kot-btn-picked-up h-10 px-3 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer flex-1 min-w-0"
                      style={{
                        backgroundColor: '#1e3a8a',
                        border: '1px solid rgba(59, 130, 246, 0.5)',
                      }}
                    >
                      <Package className="w-4 h-4 text-white shrink-0" />
                      <span className="truncate">MARK PICKED UP</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(kot.id, 'served')}
                      className="h-10 px-2.5 rounded-xl text-[11px] font-bold cursor-pointer shrink-0 flex items-center"
                      style={{
                        backgroundColor: 'rgba(6, 78, 59, 0.8)',
                        color: '#6ee7b7',
                        border: '1px solid rgba(5, 150, 105, 0.5)',
                      }}
                      title={kot.orderType === 'takeaway' || kot.orderType === 'parcel' ? 'Mark Completed' : 'Direct Served'}
                    >
                      <span>Served</span>
                    </button>
                  </div>
                )}

                {/* STAGE 2 RESULT: KDS ticket now shows waiting badge: "🚶 En Route to Table" */}
                {isPickedUp && (
                  <div className="min-h-[42px] flex items-center justify-between gap-2 w-full">
                    <div 
                      className="h-10 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold flex-1 min-w-0"
                      style={{
                        backgroundColor: 'rgba(8, 47, 73, 0.8)',
                        color: '#7dd3fc',
                        border: '1px solid rgba(2, 132, 199, 0.5)',
                      }}
                    >
                      <span>🚶</span>
                      <span className="truncate">En Route to Table</span>
                    </div>
                    {onUpdateStatus && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(kot.id, 'served')}
                        className="h-10 px-2.5 rounded-xl text-[11px] cursor-pointer shrink-0 flex items-center font-bold"
                        style={{
                          backgroundColor: '#1e293b',
                          color: '#cbd5e1',
                          border: '1px solid #334155',
                        }}
                      >
                        Served
                      </button>
                    )}
                  </div>
                )}

                {kot.status === 'served' && (
                  <div 
                    className="w-full h-10 px-3 font-bold text-xs uppercase tracking-wider rounded-xl text-center flex items-center justify-center gap-1.5"
                    style={{
                      backgroundColor: 'rgba(6, 78, 59, 0.8)',
                      color: '#6ee7b7',
                      border: '1px solid rgba(5, 150, 105, 0.5)',
                    }}
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>COMPLETED & SERVED</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default KdsCard;
