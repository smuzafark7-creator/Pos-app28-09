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

  // Standardized Brand Primary Button Color: Deep Maroon Accent (#7a0c1a)
  const buttonColorClass = 'pos-card-btn-crimson bg-[#7a0c1a] hover:bg-[#8f1020] active:bg-[#4a030c] border border-[#580510]/50';

  // Card Container Styling: Dark navy slate matching Tables screen cards, locked compact height 128px, padding 8px 12px, border-box, justify-between
  let containerClasses = 'pos-food-card relative select-none transition-all duration-150 ease-in-out ';
  if (isSoldOut) {
    containerClasses += 'pos-food-card-sold-out opacity-60 pointer-events-none cursor-not-allowed shadow-sm';
  } else if (inCartQty > 0) {
    containerClasses += 'cursor-pointer hover:-translate-y-0.5 hover:border-red-400/80';
  } else {
    containerClasses += 'cursor-pointer hover:-translate-y-0.5 hover:border-blue-400/50';
  }

  return (
    <div
      onClick={() => {
        if (!isSoldOut) onAdd(item);
      }}
      style={{
        height: '128px',
        minHeight: '128px',
        maxHeight: '128px',
        padding: '8px 12px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: isSoldOut ? '#e2d8b5' : '#F7EECA',
        border: inCartQty > 0 ? '1.5px solid rgba(220, 38, 38, 0.7)' : '1px solid rgba(255, 255, 255, 0.14)',
        borderRadius: '12px',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.45)',
        position: 'relative',
        zIndex: 2,
      }}
      className={containerClasses}
    >
      <div>
        {/* Header (Veg/Non-Veg icon + Dish Name) */}
        <div className="flex items-start gap-2">
          <span
            className={`w-3.5 h-3.5 rounded-[3px] flex items-center justify-center shrink-0 mt-0.5 ${
              item.isVeg
                ? 'border border-emerald-500 bg-emerald-950/70 text-emerald-400'
                : 'border border-red-500 bg-red-950/70 text-red-400'
            }`}
            title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
          >
            {item.isVeg ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-[2px] bg-red-400" />
            )}
          </span>

          <span
            style={{
              color: isSoldOut ? '#64748b' : '#f8fafc',
              fontWeight: 700,
              fontSize: '15px',
              lineHeight: 1.25,
              margin: 0,
            }}
            className={`line-clamp-2 transition-colors ${
              isSoldOut
                ? 'text-slate-500 line-through'
                : 'text-[#f8fafc] hover:text-white'
            }`}
          >
            {item.name}
          </span>
        </div>

        {/* Price Row: Exact deep rich Navy Blue (#112240) */}
        <div
          style={{
            color: isSoldOut ? '#64748b' : '#112240',
            fontWeight: 800,
            fontSize: '16px',
            lineHeight: 1.2,
            marginTop: '10px',
            marginBottom: '8px',
            marginLeft: '12px',
          }}
          className={isSoldOut ? 'text-slate-500' : 'text-[#112240]'}
        >
          ₹{item.price.toFixed(2)}
        </div>
      </div>

      {/* Action Row: '+ Add' Button / Stepper */}
      <div style={{ marginTop: 'auto' }}>
        {isSoldOut ? (
          <button
            type="button"
            disabled
            style={{
              height: '30px',
              minHeight: '30px',
              maxHeight: '30px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
            }}
            className="w-full px-2 text-xs flex items-center justify-center gap-1.5 cursor-not-allowed select-none bg-red-950/40 border border-red-800/40 text-red-400"
            title="Item marked sold out by kitchen"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Sold Out</span>
          </button>
        ) : inCartQty > 0 ? (
          <div
            onClick={e => e.stopPropagation()}
            style={{
              height: '30px',
              minHeight: '30px',
              maxHeight: '30px',
            }}
            className="flex items-center gap-1.5"
          >
            <button
              type="button"
              onClick={() => onDecrement(item.id)}
              style={{
                height: '30px',
                borderRadius: '6px',
              }}
              className="flex-1 px-2 font-bold text-center transition-colors border cursor-pointer flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600/60"
              title="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5 text-slate-200" />
            </button>
            <span
              style={{
                height: '30px',
                borderRadius: '6px',
                fontSize: '13px',
              }}
              className="px-2 border flex items-center justify-center min-w-7 text-center font-bold bg-slate-900 border-slate-700 text-slate-100 shadow-2xs"
            >
              {inCartQty}
            </span>
            <button
              type="button"
              onClick={() => onIncrement(item.id)}
              style={{
                height: '30px',
                borderRadius: '6px',
                color: '#ffffff',
              }}
              className={`pos-card-btn ${buttonColorClass} flex-1 px-2 font-bold !text-white text-[#ffffff] text-center transition-colors cursor-pointer flex items-center justify-center shadow-sm active:scale-95`}
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
            style={{
              height: '30px',
              minHeight: '30px',
              maxHeight: '30px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#ffffff',
            }}
            className={`pos-card-btn w-full ${buttonColorClass} !text-white text-[#ffffff] shadow-sm active:scale-95 transition-all flex items-center justify-center cursor-pointer select-none`}
            title="Add item to bill"
          >
            <span
              style={{
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
              }}
              className="!text-white text-[#ffffff] tracking-wide leading-none select-none"
            >
              + Add
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
