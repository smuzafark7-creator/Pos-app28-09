import React, { useState, useEffect } from 'react';
import { KOT } from '../types';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

export interface KOTCancelModalProps {
  isOpen?: boolean;
  onClose: () => void;
  kot: KOT | null;
  itemIndex?: number;
  onConfirmCancel?: (reason: string, qty: number) => void;
  onConfirm?: (reason: string, qty: number) => void;
}

const COMMON_REASONS = [
  'Customer Changed Mind',
  'Ordered by Mistake',
  'Kitchen Delayed',
  'Item Quality / Wrong Item',
  'Out of Stock / Unavailable',
];

export const KOTCancelModal: React.FC<KOTCancelModalProps> = ({
  isOpen,
  onClose,
  kot,
  itemIndex,
  onConfirmCancel,
  onConfirm,
}) => {
  const shouldShow = isOpen !== undefined ? isOpen : Boolean(kot);

  const targetItem =
    kot && typeof itemIndex === 'number' && itemIndex >= 0 && kot.items
      ? kot.items[itemIndex]
      : null;

  const [selectedReason, setSelectedReason] = useState<string>('Customer Changed Mind');
  const [customNote, setCustomNote] = useState<string>('');
  const [qty, setQty] = useState<number>(1);

  useEffect(() => {
    if (shouldShow) {
      setSelectedReason('Customer Changed Mind');
      setCustomNote('');
      setQty(targetItem ? targetItem.quantity : 1);
    }
  }, [shouldShow, targetItem]);

  if (!shouldShow || !kot) return null;

  const maxQty = targetItem ? targetItem.quantity : 1;
  const itemRate = targetItem ? (targetItem.rate || 0) : 0;
  const refundAmount = itemRate * qty;

  const handleConfirmAction = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = customNote.trim()
      ? `${selectedReason}: ${customNote.trim()}`
      : selectedReason;

    if (onConfirmCancel) {
      onConfirmCancel(finalReason, qty);
    } else if (onConfirm) {
      onConfirm(finalReason, qty);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 font-sans select-none animate-in fade-in duration-150">
      <div className="bg-[#161B26] border border-white/10 rounded-xl w-full max-w-md p-5 text-white shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <div className="text-white font-bold leading-none">Void / Cancel Sent Item</div>
              <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                KOT #{kot.kotNumber} • {kot.tableNumber ? `Table ${kot.tableNumber}` : 'Takeaway Ticket'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/5"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Item Details Card */}
        {targetItem && (
          <div className="bg-[#0e131f] p-3.5 rounded-xl border border-white/10 flex items-center justify-between text-xs">
            <div className="min-w-0 pr-2">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Item to void</div>
              <div className="font-bold text-white text-sm truncate mt-0.5">{targetItem.name}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Unit Price: <span className="text-emerald-400 font-semibold">₹{itemRate.toFixed(2)}</span>
              </div>
            </div>

            {/* Qty Stepper if quantity > 1 */}
            <div className="flex flex-col items-end shrink-0">
              <span className="text-[10px] text-slate-400 mb-1 font-medium">Qty to void:</span>
              {targetItem.quantity > 1 ? (
                <div className="flex items-center gap-1.5 bg-[#161B26] border border-white/15 px-2 py-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                  >
                    -
                  </button>
                  <span className="font-bold text-white min-w-5 text-center text-xs">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(Math.min(maxQty, qty + 1))}
                    className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                  >
                    +
                  </button>
                </div>
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-white font-bold text-xs">
                  ×1
                </span>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleConfirmAction} className="space-y-3.5 text-xs">
          {/* Quick Selectable Reason Chips */}
          <div>
            <label className="block text-slate-300 mb-1.5 font-semibold text-[11px]">
              Cancellation Reason <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {COMMON_REASONS.map(r => {
                const isSelected = selectedReason === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedReason(r)}
                    className={`px-2.5 py-2 rounded-lg text-left text-[11px] font-medium border transition-colors cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-semibold shadow-xs'
                        : 'bg-[#0e131f] border-white/10 text-slate-300 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <span className="truncate">{r}</span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 ml-1.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Custom Cancellation Note */}
          <div>
            <label className="block text-slate-400 mb-1 text-[11px] font-medium">
              Additional Details (Optional)
            </label>
            <input
              type="text"
              value={customNote}
              onChange={e => setCustomNote(e.target.value)}
              placeholder="Custom cancellation note..."
              className="w-full px-3 py-2 bg-[#0e131f] border border-white/10 focus:border-rose-500 rounded-lg text-white placeholder-slate-500 focus:outline-none text-xs transition-colors"
            />
          </div>

          {/* Total Reduction Banner */}
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Total reduction from bill:</span>
            <span className="font-bold text-rose-400 text-sm">
              -₹{refundAmount.toFixed(2)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-medium rounded-xl text-xs cursor-pointer transition-colors"
            >
              Keep Item
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Confirm Void / Delete</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
