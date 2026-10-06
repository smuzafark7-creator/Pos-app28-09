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
      className="w-48 sm:w-52 xl:w-56 flex flex-col justify-between shrink-0 select-none h-full sticky top-0 overflow-hidden font-sans z-10 transition-colors bg-[#090e18] text-slate-200 border-r border-slate-800 shadow-lg"
    >
      {/* Category Header with Mode Switcher */}
      <div className="p-3 shrink-0 transition-colors border-b border-slate-800 bg-[#090e18]">
        <div className="flex items-center justify-between mb-2">
          <span 
            id="waiter-categories-title"
            className="waiter-categories-title tracking-wider uppercase font-bold"
            style={{
              color: '#cbd5e1',
              fontWeight: 800,
              fontSize: '11px',
              letterSpacing: '0.05em'
            }}
          >
            Categories
          </span>
          <span
            id="waiter-categories-items-pill"
            className="waiter-categories-items-pill px-2.5 py-0.5 rounded-md"
            style={{
              backgroundColor: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
              fontWeight: 700,
              fontSize: '11px'
            }}
          >
            {totalItems} Items
          </span>
        </div>

        {/* Option A vs Option B Mode Switcher */}
        <div className="flex items-center gap-1 p-0.5 bg-black/20 rounded-lg border border-white/10 text-[10px] font-medium">
          <button
            type="button"
            onClick={() => handleToggleMode('alternating')}
            className={`flex-1 py-1 px-1.5 rounded-md text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
              badgeMode === 'alternating'
                ? 'bg-[#7a0c1a] text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Option A: Alternating Maroon & Navy Blue badges"
          >
            <Layers className="w-2.5 h-2.5" />
            <span>Alternating</span>
          </button>
          <button
            type="button"
            onClick={() => handleToggleMode('active-crimson')}
            className={`flex-1 py-1 px-1.5 rounded-md text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
              badgeMode === 'active-crimson'
                ? 'bg-[#0b1e3b] text-white font-bold shadow-xs border border-sky-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Option B: Active Maroon, Inactive Navy Slate"
          >
            <span>Navy / Red</span>
          </button>
        </div>
      </div>

      {/* Category List with Maroon & Navy Blue Badge Combination */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 sidebar-scrollbar min-h-0 transition-colors bg-[#090e18]">
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
                badgeClasses += 'category-active-crimson bg-[#7a0c1a] text-white font-bold border-2 border-rose-300 ring-2 ring-rose-900/60 shadow-[0_4px_18px_rgba(122,12,26,0.55)] scale-[1.02] translate-x-1';
              } else {
                badgeClasses += 'category-crimson bg-[#580510] hover:bg-[#7a0c1a] text-white font-semibold border border-[#7a0c1a]/60 shadow-xs hover:translate-x-0.5';
              }
            } else {
              // Navy Blue
              if (isSelected) {
                badgeClasses += 'category-active-navy bg-[#1e3a8a] text-white font-bold border-2 border-sky-300 ring-2 ring-sky-400/60 shadow-[0_4px_18px_rgba(30,58,138,0.55)] scale-[1.02] translate-x-1';
              } else {
                badgeClasses += 'category-navy bg-[#0b1e3b] hover:bg-[#152a4e] text-white font-semibold border border-[#1e3a8a]/50 shadow-xs hover:translate-x-0.5';
              }
            }
          } else {
            // Option B: Active vs Inactive State
            if (isSelected) {
              badgeClasses += 'category-active-crimson bg-[#7a0c1a] text-white font-bold border-2 border-rose-400 ring-2 ring-rose-900/40 shadow-[0_4px_16px_rgba(122,12,26,0.5)] scale-[1.02] translate-x-1';
            } else {
              badgeClasses += 'category-navy bg-[#0b1e3b] hover:bg-[#152a4e] text-white/95 font-semibold border border-[#1e3a8a]/40 shadow-xs hover:text-white hover:translate-x-0.5';
            }
          }

          return (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`group w-full relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-[180ms] ease-in-out cursor-pointer text-left tracking-wide uppercase ${badgeClasses}`}
            >
              <span 
                className="category-name-text truncate flex items-center gap-2 font-semibold tracking-wide"
                style={{ color: '#ffffff' }}
              >
                {icon && <span className="text-sm shrink-0">{icon}</span>}
                <span className="truncate">{cat}</span>
              </span>
              <span
                className="category-counter-bubble text-[11px] px-2 py-0.5 rounded-full font-extrabold shrink-0 shadow-inner"
                style={{
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '11px',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.25)'
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
