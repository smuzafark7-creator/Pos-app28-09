import React from 'react';
import { useApp } from '../context/AppContext';
import { AlertCircle, Plus, X, ShoppingBag, Utensils } from 'lucide-react';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({ isOpen, onClose }) => {
  const { 
    cart, 
    cartOrderType, 
    cartTableNumber, 
    resetCartOrder, 
    setActiveTab, 
    showToast 
  } = useApp();

  if (!isOpen) return null;

  const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + item.item.price * item.quantity, 0);

  const handleConfirm = () => {
    resetCartOrder();
    setActiveTab('pos');
    onClose();
    showToast('New Order Started', 'Current draft cleared. Ready for next order.', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 font-mono"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">New Order</h3>
              <p className="text-[10px] text-slate-400">Start a fresh order?</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-bold text-slate-900">
                Current order has unsent items.
              </div>
              <div className="text-slate-600">
                Start a new order and clear this draft?
              </div>
            </div>
          </div>

          {/* Draft Order Summary Badge */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-500 text-[11px]">
              <span className="flex items-center gap-1 uppercase font-semibold">
                {cartOrderType === 'dine_in' ? (
                  <>
                    <Utensils className="w-3 h-3 text-slate-400" />
                    <span>Dine-In • {cartTableNumber}</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3 h-3 text-slate-400" />
                    <span className="uppercase">{cartOrderType}</span>
                  </>
                )}
              </span>
              <span className="font-bold text-slate-900">
                {totalUnits} {totalUnits === 1 ? 'item' : 'items'}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1 border-t border-slate-200/80">
              <span className="text-slate-600 font-semibold">Draft Total:</span>
              <span className="text-base font-extrabold text-slate-900">
                ₹{totalAmount.toFixed(2)}
              </span>
            </div>

            <div className="text-[10px] text-slate-500 italic pt-0.5">
              * Existing KOTs, paid bills, customer records, and ledger history will remain completely untouched.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-5 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Start New Order</span>
          </button>
        </div>
      </div>
    </div>
  );
};
