import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ClipboardList, 
  Utensils, 
  BarChart3, 
  History 
} from 'lucide-react';

export const KitchenSidebar: React.FC = () => {
  const { 
    activeKitchenTab, 
    setActiveKitchenTab,
    setIsKitchenDrawerOpen,
    kots,
    currentBranch
  } = useApp();

  const activeKotsCount = kots.filter(
    k => (currentBranch === 'all' || k.branchId === currentBranch) && (k.status === 'new' || k.status === 'preparing')
  ).length;

  const navItems = [
    {
      id: 'live' as const,
      label: 'Live KOTs',
      icon: ClipboardList,
      count: activeKotsCount,
      tooltip: 'Live Kitchen Display (Active Orders)'
    },
    {
      id: 'stock86' as const,
      label: 'Stock 86',
      icon: Utensils,
      tooltip: 'Item Stock & 86 Inventory Manager'
    },
    {
      id: 'dispatched' as const,
      label: 'Summary',
      icon: BarChart3,
      tooltip: 'Shift Dispatched Analytics'
    },
    {
      id: 'history' as const,
      label: 'History',
      icon: History,
      tooltip: 'Order History & Recall Archive'
    },
  ];

  const handleTabClick = (tab: 'live' | 'stock86' | 'dispatched' | 'history') => {
    setActiveKitchenTab(tab);
    setIsKitchenDrawerOpen(false);
  };

  return (
    <aside 
      id="kds-vertical-sidebar"
      className="w-20 bg-[#0a0f18] border-r border-slate-800/80 flex flex-col justify-between py-3 shrink-0 select-none z-30"
      aria-label="KDS Navigation Sidebar"
    >
      {/* Navigation Buttons Stack */}
      <div className="flex flex-col items-center w-full">
        {navItems.map((item) => {
          const isActive = activeKitchenTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleTabClick(item.id)}
              title={item.tooltip}
              className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center gap-1 mx-auto my-1.5 transition-all relative cursor-pointer select-none ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold border border-amber-400 shadow-md shadow-amber-500/30'
                  : 'bg-[#151e2e] border border-slate-700/60 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white'
              }`}
            >
              {/* Top: Centered Icon */}
              <Icon 
                className={`w-5 h-5 shrink-0 transition-transform ${
                  isActive ? 'text-slate-950 scale-105' : 'text-slate-300'
                }`} 
              />

              {/* Bottom: Compact Sharp Mini Label */}
              <span 
                className={`text-[10px] font-bold leading-none tracking-tight text-center whitespace-nowrap px-0.5 ${
                  isActive ? 'text-slate-950 font-black' : 'text-slate-300'
                }`}
              >
                {item.label}
              </span>

              {/* Top-Right Corner Active Count Badge */}
              {item.count !== undefined && item.count > 0 && (
                <span
                  className={`absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black flex items-center justify-center shadow-md border ${
                    isActive
                      ? 'bg-slate-950 text-amber-400 border-amber-400'
                      : 'bg-amber-500 text-slate-950 border-amber-300'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer Live Status Indicator */}
      <div className="flex flex-col items-center justify-center gap-1 text-slate-500 pt-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-xs shadow-emerald-500/50" title="KDS Live Station Online" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
          LIVE
        </span>
      </div>
    </aside>
  );
};
