import React, { useState, useEffect } from 'react';
import { MenuItem, PortionSelection } from '../types';
import { X, Plus, Minus, RotateCcw, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export interface ItemVariationModalProps {
  isOpen: boolean;
  item: MenuItem | null;
  onClose: () => void;
  onSave: (item: MenuItem, portions: PortionSelection[], note?: string) => void;
}

/**
 * Item Variation Selection Modal
 * Modern Touch-Friendly POS UI:
 * 1. Modern Card Elevation & Contrast with distinct glass cards & active emerald border/ring
 * 2. Touch-Friendly High-Contrast Stepper with solid pill counter, slate [-] and vibrant emerald [+]
 * 3. Dynamic Pricing Visibility with portion title, unit price, and bold total pill next to stepper
 * 4. Polished Modal Header & Footer with Veg/Non-Veg dot, Clear button, and active emerald Add to Cart button
 */
export const ItemVariationModal: React.FC<ItemVariationModalProps> = ({
  isOpen,
  item,
  onClose,
  onSave,
}) => {
  const { showToast } = useApp();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [inputStrings, setInputStrings] = useState<Record<string, string>>({});
  const [kitchenNote, setKitchenNote] = useState('');
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Reset portion quantities and note when modal opens or item changes
  useEffect(() => {
    if (item && item.variations && item.variations.length > 0) {
      const initial: Record<string, number> = {};
      const initialStrings: Record<string, string> = {};
      item.variations.forEach(v => {
        initial[v.id] = 0;
        initialStrings[v.id] = '0';
      });
      setQuantities(initial);
      setInputStrings(initialStrings);
      setKitchenNote('');
      setWarningMessage(null);
    } else {
      setQuantities({});
      setInputStrings({});
      setKitchenNote('');
      setWarningMessage(null);
    }
  }, [item, isOpen]);

  if (!isOpen || !item || !item.variations || item.variations.length === 0) {
    return null;
  }

  // Update quantity for a specific portion
  const updateQuantity = (variationId: string, delta: number) => {
    if (warningMessage) setWarningMessage(null);
    setQuantities(prev => {
      const current = prev[variationId] || 0;
      const next = Math.min(99, Math.max(0, current + delta));
      setInputStrings(s => ({ ...s, [variationId]: String(next) }));
      return {
        ...prev,
        [variationId]: next,
      };
    });
  };

  // Directly set quantity via numeric input (clamped 0-99)
  const handleDirectQuantityChange = (variationId: string, rawValue: string) => {
    if (warningMessage) setWarningMessage(null);
    setInputStrings(prev => ({
      ...prev,
      [variationId]: rawValue,
    }));

    if (rawValue.trim() === '') {
      setQuantities(prev => ({
        ...prev,
        [variationId]: 0,
      }));
      return;
    }
    const parsed = parseInt(rawValue, 10);
    if (!isNaN(parsed)) {
      const clamped = Math.min(99, Math.max(0, parsed));
      setQuantities(prev => ({
        ...prev,
        [variationId]: clamped,
      }));
    }
  };

  const handleInputBlur = (variationId: string) => {
    const qty = quantities[variationId] || 0;
    setInputStrings(prev => ({
      ...prev,
      [variationId]: String(qty),
    }));
  };

  // Reset all portions to 0
  const handleClearAll = () => {
    if (!item || !item.variations) return;
    const resetQty: Record<string, number> = {};
    const resetStrings: Record<string, string> = {};
    item.variations.forEach(v => {
      resetQty[v.id] = 0;
      resetStrings[v.id] = '0';
    });
    setQuantities(resetQty);
    setInputStrings(resetStrings);
    setWarningMessage(null);
  };

  // Calculate total price across all selected portions
  const totalSum = item.variations.reduce((sum, v) => {
    const qty = quantities[v.id] || 0;
    return sum + v.price * qty;
  }, 0);

  // Total quantity count across all portions
  const totalQty = item.variations.reduce((sum, v) => {
    return sum + (quantities[v.id] || 0);
  }, 0);

  const handleSave = () => {
    const selectedPortions: PortionSelection[] = item.variations
      .filter(v => (quantities[v.id] || 0) > 0)
      .map(v => ({
        variation: v,
        quantity: quantities[v.id] || 0,
      }));

    // If total quantity is 0 when clicked: do not close modal, show warning
    if (selectedPortions.length === 0 || totalQty === 0) {
      showToast('Notice', 'No item selected. Please add at least 1 portion.', 'warning');
      setWarningMessage('No item selected. Please add at least 1 portion.');
      return;
    }

    setWarningMessage(null);
    onSave(item, selectedPortions, kitchenNote.trim() || undefined);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="item-variation-modal"
        className="w-full max-w-lg bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl text-white p-5 md:p-6 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Veg / Non-Veg dot indicator */}
              <span
                className={`w-4 h-4 rounded-[3px] border flex items-center justify-center shrink-0 ${
                  item.isVeg ? 'border-emerald-600/70 bg-emerald-950/40' : 'border-red-600/80 bg-red-950/40'
                }`}
                title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
              >
                {item.isVeg ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                ) : (
                  <span className="w-2 h-2 rounded-[2px] bg-red-500" />
                )}
              </span>

              <h2
                id="item-variation-modal-title"
                className="text-white font-bold text-lg md:text-xl tracking-tight truncate"
                style={{ color: '#ffffff' }}
              >
                {item.name}
              </h2>

              {totalQty > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-red-500/20 text-red-300 border border-red-500/30 shrink-0">
                  {totalQty} {totalQty === 1 ? 'portion' : 'portions'}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Close"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Portion Selection Area */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Select Portion / Variation</span>
              <span className="text-[11px] text-slate-500 font-normal">Set quantities for each portion</span>
            </div>

            <div className="space-y-3 my-2">
              {item.variations.map(variation => {
                const qty = quantities[variation.id] || 0;
                const isSelected = qty > 0;
                const portionTotal = variation.price * qty;

                return (
                  <div
                    key={variation.id}
                    onClick={() => {
                      // Clicking card when 0 sets to 1 for fast touch selection
                      if (qty === 0) {
                        updateQuantity(variation.id, 1);
                      }
                    }}
                    className={`p-3 rounded-xl flex items-center justify-between relative select-none transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-white border-2 border-[#8b0000] shadow-md'
                        : 'bg-[#fbf8f2] border border-slate-300 hover:bg-white hover:border-slate-400 shadow-xs'
                    }`}
                  >
                    {/* Left: Portion name on top, Price underneath */}
                    <div className="flex flex-col min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="item-variation-portion-name text-slate-900 font-bold text-base leading-tight truncate"
                          style={{ color: '#0f172a' }}
                        >
                          {variation.name}
                        </span>
                        {qty > 0 && (
                          <span className="bg-red-100 text-[#8b0000] border border-red-200 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                            {qty}x
                          </span>
                        )}
                      </div>
                      <span className="text-emerald-700 font-extrabold text-base mt-1">
                        ₹{variation.price}
                      </span>
                    </div>

                    {/* Right: Calculated Total Pill + Stepper */}
                    <div
                      className="flex items-center shrink-0"
                      onClick={e => e.stopPropagation()}
                    >
                      {/* Dynamic calculated total pill shown next to stepper */}
                      {qty > 0 && (
                        <span className="text-emerald-700 font-extrabold text-base mr-3 tabular-nums">
                          ₹{portionTotal.toLocaleString('en-IN')}
                        </span>
                      )}

                      {/* Touch-Friendly High-Contrast Stepper */}
                      <div className="bg-slate-100 border border-slate-300 rounded-xl px-2 py-1 flex items-center gap-2">
                        {/* Minus (-) button: Deep Navy Blue matching left menu badge */}
                        <button
                          type="button"
                          onClick={() => updateQuantity(variation.id, -1)}
                          disabled={qty === 0}
                          className={`w-8 h-8 rounded-lg bg-[#0b1e3b] text-white font-black text-base flex items-center justify-center transition-all shadow-xs ${
                            qty > 0
                              ? 'cursor-pointer hover:bg-[#162e56] active:scale-95'
                              : 'opacity-40 cursor-not-allowed'
                          }`}
                          title="Decrease quantity"
                        >
                          <Minus className="w-4 h-4 stroke-[3]" />
                        </button>

                        {/* Count display: Bold dark number centered between - and + buttons */}
                        <input
                          type="number"
                          min="0"
                          max="99"
                          value={inputStrings[variation.id] !== undefined ? inputStrings[variation.id] : qty}
                          onChange={e => handleDirectQuantityChange(variation.id, e.target.value)}
                          onBlur={() => handleInputBlur(variation.id)}
                          onFocus={e => e.target.select()}
                          onClick={e => e.stopPropagation()}
                          className="w-10 h-8 text-center text-slate-900 font-bold text-base bg-white border border-slate-300 rounded-md px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-red-600 appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none tabular-nums shadow-xs"
                          aria-label={`${variation.name} quantity`}
                        />

                        {/* Plus (+) button: Deep Crimson Red matching theme */}
                        <button
                          type="button"
                          onClick={() => updateQuantity(variation.id, 1)}
                          className="bg-[#8b0000] hover:bg-[#a10d0d] text-white font-black text-base w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs"
                          title="Increase quantity"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Kitchen Instruction Input Field */}
            <div className="relative mt-2.5">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none select-none">
                ✎
              </span>
              <input
                type="text"
                value={kitchenNote}
                onChange={e => setKitchenNote(e.target.value)}
                placeholder="Add kitchen note / cooking instructions (e.g., Less spicy, Extra raita)..."
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs md:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500/60"
              />
            </div>

            {/* Validation Notice Banner if 0 items selected when clicking Add to Cart */}
            {warningMessage && (
              <div className="mt-2.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{warningMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action Footer: Clear (Left) ----- Cancel + Add to Cart (Right) */}
        <div className="flex items-center justify-between gap-2.5 mt-3.5">
          {/* Left: Clear button */}
          <button
            type="button"
            onClick={handleClearAll}
            className="text-red-400 hover:text-red-300 text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-red-500/10"
            title="Reset all portion quantities to 0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          {/* Right: Cancel and Always-Active Add to Cart button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-slate-600 text-slate-300 hover:bg-slate-800 rounded-xl px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="bg-[#8b0000] hover:bg-[#700000] text-white font-bold px-5 py-2.5 rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer text-sm"
              title="Add selected portions to cart"
            >
              <span>
                {totalQty > 0
                  ? `✓ Add to Cart • ₹${totalSum.toLocaleString('en-IN')}`
                  : '✓ Add to Cart'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemVariationModal;
