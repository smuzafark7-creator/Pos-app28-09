import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { CategoryBadgeMode } from '../../types';
import { Layers } from 'lucide-react';

export interface WaiterCategorySidebarProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts: Record<string, number>;
  totalItems: number;
}

export const WaiterCategorySidebar: React.FC<WaiterCategorySidebarProps> = ({
  categories = [],
  selectedCategory,
  onSelectCategory,
  categoryCounts = {},
  totalItems = 0,
}) => {
  const { categoryIcons = {} } = useApp();
  const { isDark } = useTheme();
  const safeCategories = Array.isArray(categories) ? categories : [];

  // Allow switching between Option A (Alternating Crimson & Navy) and Option B (Active Crimson, Inactive Navy)
  const [badgeMode, setBadgeMode] = useState<CategoryBadgeMode>(() => {
    const saved = localStorage.getItem('zaffran_category_badge_style');
    return saved === 'active-crimson' ? 'active-crimson' : 'alternating';
  });

  const handleToggleMode = (mode: CategoryBadgeMode) => {
    setBadgeMode(mode);
    localStorage.setItem('zaffran_category_badge_style', mode);
  };

  return (
    <aside
      id="waiter-menu-categories-sidebar"
      className="waiter-menu-categories-sidebar w-[215px] min-w-[215px] max-w-[215px] flex-[0_0_215px] flex flex-col justify-between shrink-0 select-none h-full sticky top-0 overflow-hidden font-sans z-10 transition-colors bg-[#090e18] text-slate-200 border-r border-slate-800 shadow-lg"
      style={{
        width: '215px',
        minWidth: '215px',
        maxWidth: '215px',
        flex: '0 0 215px',
        boxSizing: 'border-box',
      }}
    >
      {/* Category Header with Mode Switcher */}
      <div className="p-2 shrink-0 transition-colors border-b border-slate-800 bg-[#090e18]">
        <div className="flex items-center justify-between mb-1.5">
          <span 
            id="waiter-categories-title"
            className="waiter-categories-title tracking-wider uppercase font-bold text-[10px]"
            style={{
              color: '#cbd5e1',
              fontWeight: 800,
              fontSize: '10px',
              letterSpacing: '0.05em'
            }}
          >
            Categories
          </span>
          <span
            id="waiter-categories-items-pill"
            className="waiter-categories-items-pill px-1.5 py-0.5 rounded text-[10px]"
            style={{
              backgroundColor: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
              fontWeight: 700,
              fontSize: '10px'
            }}
          >
            {totalItems}
          </span>
        </div>

        {/* Option A vs Option B Mode Switcher */}
        <div className="flex items-center gap-0.5 p-0.5 bg-black/20 rounded-md border border-white/10 text-[9px] font-medium">
          <button
            type="button"
            onClick={() => handleToggleMode('alternating')}
            className={`flex-1 py-0.5 px-1 rounded text-center transition-all cursor-pointer flex items-center justify-center gap-0.5 ${
              badgeMode === 'alternating'
                ? 'bg-[#7a0c1a] text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Option A: Alternating Maroon & Navy Blue badges"
          >
            <Layers className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">Alt</span>
          </button>
          <button
            type="button"
            onClick={() => handleToggleMode('active-crimson')}
            className={`flex-1 py-0.5 px-1 rounded text-center transition-all cursor-pointer flex items-center justify-center gap-0.5 ${
              badgeMode === 'active-crimson'
                ? 'bg-[#0b1e3b] text-white font-bold shadow-xs border border-sky-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Option B: Active Maroon, Inactive Navy Slate"
          >
            <span className="truncate">Navy/Red</span>
          </button>
        </div>
      </div>

      {/* Category List with Maroon & Navy Blue Badge Combination */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5 sidebar-scrollbar min-h-0 transition-colors bg-[#090e18]">
        {safeCategories.map((cat, index) => {
          const isSelected = selectedCategory === cat;
          const count = cat === 'All' ? totalItems : (categoryCounts[cat] || 0);
          const icon = cat !== 'All' ? categoryIcons[cat] : null;

          // Option A: Alternating colors (Even: Maroon, Odd: Navy)
          const isEven = index % 2 === 0;

          let badgeClasses = 'category-badge-btn ';

          if (badgeMode === 'alternating') {
            // Option A: Alternating
            if (isEven) {
              // Maroon
              if (isSelected) {
                badgeClasses += 'category-active-crimson bg-[#7a0c1a] text-white font-bold border-2 border-rose-300 ring-2 ring-rose-900/60 shadow-[0_4px_18px_rgba(122,12,26,0.55)]';
              } else {
                badgeClasses += 'category-crimson bg-[#580510] hover:bg-[#7a0c1a] text-white font-semibold border border-[#7a0c1a]/60 shadow-xs';
              }
            } else {
              // Navy Blue
              if (isSelected) {
                badgeClasses += 'category-active-navy bg-[#1e3a8a] text-white font-bold border-2 border-sky-300 ring-2 ring-sky-400/60 shadow-[0_4px_18px_rgba(30,58,138,0.55)]';
              } else {
                badgeClasses += 'category-navy bg-[#0b1e3b] hover:bg-[#152a4e] text-white font-semibold border border-[#1e3a8a]/50 shadow-xs';
              }
            }
          } else {
            // Option B: Active vs Inactive State
            if (isSelected) {
              badgeClasses += 'category-active-crimson bg-[#7a0c1a] text-white font-bold border-2 border-rose-400 ring-2 ring-rose-900/40 shadow-[0_4px_16px_rgba(122,12,26,0.5)]';
            } else {
              badgeClasses += 'category-navy bg-[#0b1e3b] hover:bg-[#152a4e] text-white/95 font-semibold border border-[#1e3a8a]/40 shadow-xs hover:text-white';
            }
          }

          return (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`group w-full relative flex items-center justify-between rounded-xl transition-colors duration-150 cursor-pointer text-left tracking-wide uppercase ${badgeClasses}`}
              style={{
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                marginLeft: 0,
                marginRight: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                transform: 'none',
                overflow: 'hidden',
              }}
            >
              {/* Left: Icon */}
              <span className="category-icon shrink-0 text-xs w-4 flex items-center justify-center">
                {icon || (cat === 'All' ? '🍽️' : '')}
              </span>

              {/* Center: Full text */}
              <span 
                className="category-name-text"
                style={{ 
                  color: '#ffffff',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  textAlign: 'left',
                  flex: 1,
                  marginLeft: '6px',
                  minWidth: 0,
                  overflow: 'visible',
                }}
              >
                <span
                  className="category-label-text"
                  style={{
                    fontSize: '13.5px',
                    fontWeight: 700,
                    letterSpacing: '0.3px',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    overflow: 'visible',
                  }}
                >
                  {cat}
                </span>
              </span>

              {/* Right: Count badge */}
              <span
                className="category-counter-bubble"
                style={{
                  flexShrink: 0,
                  marginRight: 0,
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 shrink-0 text-[10px] text-center transition-colors border-t border-slate-800 bg-[#090e18] text-slate-400">
        <span className="text-rose-400 font-semibold">● Order Taking Mode</span>
      </div>
    </aside>
  );
};
