import React, { useState, useEffect } from 'react';
import { MenuItem, PortionSelection, OrderType } from '../types';
import { X, Plus, Minus, RotateCcw, AlertCircle, Pencil, ChevronDown } from 'lucide-react';
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
  const { showToast, cartOrderType } = useApp();
  const defaultOrderType: OrderType =
    cartOrderType === 'delivery'
      ? 'delivery'
      : cartOrderType === 'takeaway' || cartOrderType === 'parcel'
      ? 'takeaway'
      : 'dine_in';

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [inputStrings, setInputStrings] = useState<Record<string, string>>({});
  const [portionNotes, setPortionNotes] = useState<Record<string, string>>({});
  const [openNoteInputs, setOpenNoteInputs] = useState<Record<string, boolean>>({});
  const [portionOrderTypes, setPortionOrderTypes] = useState<Record<string, OrderType>>({});
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Reset portion quantities when modal opens or item changes
  useEffect(() => {
    if (item && item.variations && item.variations.length > 0) {
      const initial: Record<string, number> = {};
      const initialStrings: Record<string, string> = {};
      const initialOrderTypes: Record<string, OrderType> = {};
      item.variations.forEach(v => {
        initial[v.id] = 0;
        initialStrings[v.id] = '0';
        initialOrderTypes[v.id] = defaultOrderType;
      });
      setQuantities(initial);
      setInputStrings(initialStrings);
      setPortionOrderTypes(initialOrderTypes);
      setPortionNotes({});
      setOpenNoteInputs({});
      setWarningMessage(null);
    } else {
      setQuantities({});
      setInputStrings({});
      setPortionOrderTypes({});
      setPortionNotes({});
      setOpenNoteInputs({});
      setWarningMessage(null);
    }
  }, [item, isOpen, defaultOrderType]);

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
    const resetOrderTypes: Record<string, OrderType> = {};
    item.variations.forEach(v => {
      resetQty[v.id] = 0;
      resetStrings[v.id] = '0';
      resetOrderTypes[v.id] = defaultOrderType;
    });
    setQuantities(resetQty);
    setInputStrings(resetStrings);
    setPortionOrderTypes(resetOrderTypes);
    setPortionNotes({});
    setOpenNoteInputs({});
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
      .map(v => {
        const oType = portionOrderTypes[v.id] || defaultOrderType;
        return {
          variation: v,
          quantity: quantities[v.id] || 0,
          notes: portionNotes[v.id]?.trim() ? portionNotes[v.id].trim() : undefined,
          orderType: oType,
          serveType: oType === 'delivery' ? 'DELIVERY' : oType === 'takeaway' || oType === 'parcel' ? 'PARCEL' : 'DINE_IN',
        };
      });

    // If total quantity is 0 when clicked: do not close modal, show warning
    if (selectedPortions.length === 0 || totalQty === 0) {
      showToast('Notice', 'No item selected. Please add at least 1 portion.', 'warning');
      setWarningMessage('No item selected. Please add at least 1 portion.');
      return;
    }

    setWarningMessage(null);
    onSave(item, selectedPortions);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="item-variation-modal"
        className="w-full bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl text-white p-4 sm:p-5 flex flex-col"
        style={{
          width: '440px',
          maxWidth: '95vw',
          boxSizing: 'border-box',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2.5">
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
            <div className="space-y-2.5 my-1">
              {item.variations.map(variation => {
                const qty = quantities[variation.id] || 0;
                const isSelected = qty > 0;
                const portionTotal = variation.price * qty;
                const currentNote = portionNotes[variation.id] || '';
                const isInputVisible = qty >= 1 || openNoteInputs[variation.id] || currentNote.trim().length > 0;

                return (
                  <div
                    key={variation.id}
                    onClick={() => {
                      // Clicking card when 0 sets to 1 for fast touch selection
                      if (qty === 0) {
                        updateQuantity(variation.id, 1);
                      }
                    }}
                    className={`rounded-xl flex flex-col justify-between relative select-none transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-white border-2 border-[#8b0000] shadow-md'
                        : 'bg-[#fbf8f2] border border-slate-300 hover:bg-white hover:border-slate-400 shadow-xs'
                    }`}
                    style={{
                      padding: '12px 14px',
                      overflow: 'hidden',
                      boxSizing: 'border-box',
                    }}
                  >
                    {/* Top Row: Left portion info + Right Controls (Order Type Selector + Stepper) */}
                    <div
                      className="portion-card-main-row w-full flex items-center justify-between"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                    >
                      {/* 1. Left: Portion Name & Unit Price */}
                      <div
                        className="flex flex-col shrink-0 min-w-0 mr-2"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          flexShrink: 0,
                          marginRight: '8px',
                        }}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="item-variation-portion-name text-slate-900 font-bold text-sm sm:text-base leading-tight truncate"
                            style={{ color: '#0f172a', fontWeight: 700 }}
                          >
                            {variation.name}
                          </span>
                          {qty > 0 && (
                            <span className="bg-red-100 text-[#8b0000] border border-red-200 text-[11px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                              {qty}x
                            </span>
                          )}
                        </div>
                        <span className="text-emerald-700 font-extrabold text-sm mt-0.5">
                          ₹{variation.price}
                        </span>
                      </div>

                      {/* 2. Right: Controls Container (Dropdown + Stepper docked with margin-left: auto) */}
                      <div
                        className="flex items-center gap-2 shrink-0 ml-auto"
                        onClick={e => e.stopPropagation()}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginLeft: 'auto',
                          flexShrink: 0,
                        }}
                      >
                        {/* Order Type Dropdown */}
                        <div
                          className="portion-order-type-select-wrapper relative shrink-0 flex items-center"
                          style={{
                            position: 'relative',
                            display: 'inline-flex',
                            alignItems: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <select
                            value={portionOrderTypes[variation.id] || defaultOrderType}
                            onChange={e => {
                              const val = e.target.value as OrderType;
                              setPortionOrderTypes(prev => ({
                                ...prev,
                                [variation.id]: val,
                              }));
                            }}
                            className="portion-order-type-select cursor-pointer select-none outline-none appearance-none transition-all shadow-2xs"
                            style={{
                              minWidth: '95px',
                              width: '95px',
                              height: '28px',
                              padding: '2px 20px 2px 6px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: '#ffffff',
                              backgroundColor: '#ffffff',
                              color: '#0f172a',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              cursor: 'pointer',
                              colorScheme: 'light',
                              lineHeight: '22px',
                              boxSizing: 'border-box',
                            }}
                            title="Select Order Mode for this portion"
                            aria-label={`${variation.name} order type`}
                          >
                            <option value="dine_in" style={{ backgroundColor: '#ffffff', color: '#0f172a', fontSize: '11px', fontWeight: 600 }}>🍽️ Dine In</option>
                            <option value="takeaway" style={{ backgroundColor: '#ffffff', color: '#0f172a', fontSize: '11px', fontWeight: 600 }}>🛍️ Takeaway</option>
                            <option value="delivery" style={{ backgroundColor: '#ffffff', color: '#0f172a', fontSize: '11px', fontWeight: 600 }}>🛵 Delivery</option>
                          </select>
                          <ChevronDown
                            className="w-3 h-3 pointer-events-none absolute right-1.5 shrink-0"
                            style={{ color: '#475569' }}
                            aria-hidden="true"
                          />
                        </div>

                        {/* Stepper Controls (- / qty / +) */}
                        <div 
                          className="portion-stepper-container bg-slate-100 border border-slate-300 rounded-lg p-0.5 flex items-center shrink-0"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            flexShrink: 0,
                            padding: '2px',
                            borderRadius: '8px',
                            boxSizing: 'border-box',
                          }}
                        >
                          {/* Minus (-) button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (qty > 0) {
                                updateQuantity(variation.id, -1);
                              }
                            }}
                            disabled={qty === 0}
                            style={{
                              width: '26px',
                              height: '26px',
                              minWidth: '26px',
                              minHeight: '26px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#0f172a',
                              background: '#0f172a',
                              color: '#ffffff',
                              borderRadius: '6px',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              boxSizing: 'border-box',
                            }}
                            className={`portion-stepper-btn-minus rounded-md font-black text-sm flex items-center justify-center transition-all shadow-2xs ${
                              qty > 0
                                ? 'cursor-pointer hover:bg-[#1e293b] active:scale-95'
                                : 'cursor-not-allowed opacity-90'
                            }`}
                            title="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5 stroke-[3] text-white" style={{ color: '#ffffff' }} />
                          </button>

                          {/* Count display */}
                          <input
                            type="number"
                            min="0"
                            max="99"
                            value={inputStrings[variation.id] !== undefined ? inputStrings[variation.id] : qty}
                            onChange={e => handleDirectQuantityChange(variation.id, e.target.value)}
                            onBlur={() => handleInputBlur(variation.id)}
                            onFocus={e => e.target.select()}
                            onClick={e => e.stopPropagation()}
                            style={{
                              width: '28px',
                              minWidth: '24px',
                              height: '26px',
                              textAlign: 'center',
                              fontWeight: 700,
                              fontSize: '13px',
                              boxSizing: 'border-box',
                            }}
                            className="portion-stepper-qty-input text-center text-slate-900 font-bold bg-white border border-slate-300 rounded px-0.5 focus:outline-none focus:ring-1 focus:ring-red-600 appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none tabular-nums shadow-2xs"
                            aria-label={`${variation.name} quantity`}
                          />

                          {/* Plus (+) button */}
                          <button
                            type="button"
                            onClick={() => updateQuantity(variation.id, 1)}
                            style={{
                              width: '26px',
                              height: '26px',
                              minWidth: '26px',
                              minHeight: '26px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#7a0c1a',
                              background: '#7a0c1a',
                              color: '#ffffff',
                              borderRadius: '6px',
                              boxSizing: 'border-box',
                            }}
                            className="portion-stepper-btn-plus bg-[#7a0c1a] hover:bg-[#8f1020] active:bg-[#4a030c] text-white font-black text-sm rounded-md flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-2xs"
                            title="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[3] text-white" style={{ color: '#ffffff' }} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Underneath: Clean, compact cooking note field */}
                    <div 
                      className="w-full mt-2 pt-1.5 border-t border-slate-200/70"
                      onClick={e => e.stopPropagation()}
                    >
                      {isInputVisible ? (
                        <div className="relative flex items-center w-full">
                          <Pencil className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none shrink-0" />
                          <input
                            type="text"
                            value={currentNote}
                            onChange={e => {
                              const val = e.target.value;
                              setPortionNotes(prev => ({
                                ...prev,
                                [variation.id]: val,
                              }));
                            }}
                            placeholder="Note: e.g., Extra crispy, less salt, less spicy..."
                            className="w-full pl-8 pr-7 text-xs outline-none transition-all placeholder:text-slate-400 focus:border-solid focus:border-red-700/60 focus:bg-white"
                            style={{
                              height: '30px',
                              background: 'rgba(15, 23, 42, 0.05)',
                              border: '1px dashed rgba(0, 0, 0, 0.25)',
                              fontSize: '12px',
                              color: '#334155',
                              borderRadius: '6px',
                            }}
                          />
                          {currentNote ? (
                            <button
                              type="button"
                              onClick={() => {
                                setPortionNotes(prev => ({ ...prev, [variation.id]: '' }));
                              }}
                              className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                              title="Clear note"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          ) : null}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (qty === 0) {
                              updateQuantity(variation.id, 1);
                            }
                            setOpenNoteInputs(prev => ({ ...prev, [variation.id]: true }));
                          }}
                          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-[11px] font-medium transition-colors cursor-pointer py-0.5"
                          title="Add kitchen note for this portion"
                        >
                          <Pencil className="w-3 h-3 text-slate-400" />
                          <span>+ Add kitchen note</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
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
              style={{
                backgroundColor: '#7a0c1a',
                background: '#7a0c1a',
              }}
              className="bg-[#7a0c1a] hover:bg-[#8f1020] active:bg-[#4a030c] text-white font-bold px-5 py-2.5 rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer text-sm"
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
