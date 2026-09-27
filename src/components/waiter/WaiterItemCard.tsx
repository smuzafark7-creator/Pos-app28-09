import React from 'react';
import { MenuItem } from '../../types';
import { Plus, Minus, Ban } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export interface WaiterItemCardProps {
  item: MenuItem;
  inCartQty: number;
  index?: number;
  onAdd: (item: MenuItem) => void;
  onIncrement: (itemId: string) => void;
  onDecrement: (itemId: string) => void;
}

export const WaiterItemCard: React.FC<WaiterItemCardProps> = ({
  item,
  inCartQty,
  index = 0,
  onAdd,
  onIncrement,
  onDecrement,
}) => {
  const isSoldOut = !item.available || item.stockStatus === 'sold_out' || (item.stockStatus === 'few_left' && (item.stockCount ?? 0) <= 0);

  // Strict index-based alternating pattern (Checkerboard):
  // Card 0, 2, 4... -> Deep Crimson Red (#8b0000)
  // Card 1, 3, 5... -> Deep Navy Blue (#0b1e3b)
  const isCrimson = index % 2 === 0;

  const buttonColorClass = isCrimson
    ? 'pos-card-btn-crimson bg-[#8b0000] hover:bg-[#730000] active:bg-[#580000] border border-[#700000]/50'
    : 'pos-card-btn-navy bg-[#0b1e3b] hover:bg-[#162e56] active:bg-[#061224] border border-[#1e3a8a]/50';

  // Card Container Styling: Warm creamy biscuit surface bg-[#f8f3e6], clean subtle border, soft shadow, rounded-2xl p-4
  let containerClasses = 'p-4 rounded-2xl flex flex-col justify-between relative select-none transition-all duration-150 ease-in-out bg-[#f8f3e6] ';
  if (isSoldOut) {
    containerClasses += 'pos-food-card-sold-out border border-red-200 bg-[#f1ebe0] opacity-65 pointer-events-none cursor-not-allowed shadow-sm';
  } else if (inCartQty > 0) {
    containerClasses += isCrimson
      ? 'cursor-pointer border border-[#8b0000]/60 shadow-[0_0_12px_rgba(139,0,0,0.15)] hover:-translate-y-0.5 hover:shadow-md'
      : 'cursor-pointer border border-[#1e3a8a]/60 shadow-[0_0_12px_rgba(30,58,138,0.15)] hover:-translate-y-0.5 hover:shadow-md';
  } else {
    containerClasses += 'cursor-pointer border border-[#e2d5be] hover:border-amber-600/40 shadow-sm hover:shadow-md hover:-translate-y-0.5';
  }

  return (
    <div
      onClick={() => {
        if (!isSoldOut) onAdd(item);
      }}
      className={`pos-food-card ${containerClasses}`}
    >
      <div>
        {/* Dish Title with standard Veg / Non-Veg dot indicator */}
        <div className="flex items-start gap-2.5">
          <span
            className={`w-4 h-4 rounded-[3px] flex items-center justify-center shrink-0 mt-0.5 ${
              item.isVeg
                ? 'border border-emerald-600 bg-emerald-50 text-emerald-600'
                : 'border border-red-600 bg-red-50 text-red-600'
            }`}
            title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
          >
            {item.isVeg ? (
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
            ) : (
              <span className="w-2 h-2 rounded-[2px] bg-red-600" />
            )}
          </span>

          <span
            className={`text-slate-900 font-bold text-sm leading-snug line-clamp-2 transition-colors ${
              isSoldOut
                ? 'text-slate-400 line-through'
                : 'hover:text-black'
            }`}
          >
            {item.name}
          </span>
        </div>

        {/* Price Label: Rich emerald green text-emerald-700 font-extrabold text-base */}
        <div className="mt-2.5 flex items-center justify-between">
          <div
            className={`font-extrabold text-base ${
              isSoldOut
                ? 'text-slate-400'
                : 'text-emerald-700'
            }`}
          >
            ₹{item.price.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Internal Divider: Soft biscuit divider line */}
      <div className="border-b border-[#e5d9c5] my-2" />

      {/* Action Row: '+ Add' Button / Stepper */}
      <div>
        {isSoldOut ? (
          <button
            type="button"
            disabled
            className="w-full py-2 px-3 text-xs rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-not-allowed select-none bg-red-100 border border-red-200 text-red-600"
            title="Item marked sold out by kitchen"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Sold Out</span>
          </button>
        ) : inCartQty > 0 ? (
          <div
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1.5"
          >
            <button
              type="button"
              onClick={() => onDecrement(item.id)}
              className="flex-1 py-1.5 px-2 rounded-lg font-bold text-center transition-colors border cursor-pointer flex items-center justify-center bg-[#ede4d3] hover:bg-[#e2d6c1] text-[#2b1810] border-[#d8c8af]"
              title="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-2.5 py-1.5 rounded-lg border text-xs min-w-7 text-center font-bold bg-white border-[#e2d5be] text-[#2b1810] shadow-2xs">
              {inCartQty}
            </span>
            <button
              type="button"
              onClick={() => onIncrement(item.id)}
              style={{ color: '#ffffff' }}
              className={`pos-card-btn ${buttonColorClass} flex-1 py-1.5 px-2 rounded-lg font-bold !text-white text-[#ffffff] text-center transition-colors cursor-pointer flex items-center justify-center shadow-sm active:scale-95`}
              title="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5 !text-white text-[#ffffff]" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onAdd(item);
            }}
            style={{ color: '#ffffff' }}
            className={`pos-card-btn w-full ${buttonColorClass} !text-white text-[#ffffff] font-bold text-sm tracking-wide py-2 px-4 rounded-xl shadow-sm active:scale-95 transition-all flex items-center justify-center cursor-pointer select-none`}
            title="Add item to bill"
          >
            <span
              style={{ color: '#ffffff' }}
              className="!text-white text-[#ffffff] font-bold text-sm tracking-wide leading-none select-none"
            >
              + Add
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
