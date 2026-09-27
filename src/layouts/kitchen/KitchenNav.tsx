import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  FileText, 
  Utensils, 
  BarChart3, 
  History 
} from 'lucide-react';

export interface KitchenNavProps {
  activeTab: 'live' | 'stock86' | 'dispatched' | 'history';
  onSelectTab: (tab: 'live' | 'stock86' | 'dispatched' | 'history') => void;
}

export const KitchenNav: React.FC<KitchenNavProps> = ({
  activeTab,
  onSelectTab
}) => {
  const { kots, currentBranch, setActiveKitchenTab, setIsKitchenDrawerOpen } = useApp();

  const activeKotsCount = kots.filter(
    k => (currentBranch === 'all' || k.branchId === currentBranch) && (k.status === 'new' || k.status === 'preparing')
  ).length;

  const handleTabClick = (tab: 'live' | 'stock86' | 'dispatched' | 'history') => {
    onSelectTab(tab);
    setActiveKitchenTab(tab);
    setIsKitchenDrawerOpen(false);
  };

  return (
    <footer 
      id="kitchen-bottom-navigation"
      className="w-full h-16 bg-[#161B26] border-t border-white/10 grid grid-cols-4 items-stretch px-2 select-none shrink-0 z-40 shadow-2xl"
    >
      {/* Tab 1: Live KOTs */}
      <button
        type="button"
        onClick={() => handleTabClick('live')}
        className={`flex flex-col items-center justify-center h-full py-1 transition-colors relative cursor-pointer ${
          activeTab === 'live'
            ? 'text-amber-400 font-bold'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <div className="relative flex items-center justify-center">
          <FileText className="w-5 h-5" />
          {activeKotsCount > 0 && (
            <span className="absolute -top-1.5 -right-3 min-w-4 h-4 px-1 bg-amber-500 text-slate-950 rounded-full text-[10px] font-black flex items-center justify-center shadow-xs">
              {activeKotsCount}
            </span>
          )}
        </div>
        <span className="text-xs mt-1 tracking-tight truncate">Live KOTs</span>
        {activeTab === 'live' && (
          <span className="w-10 h-1 bg-amber-500 rounded-full mt-0.5" />
        )}
      </button>

      {/* Tab 2: Item Stock & 86 */}
      <button
        type="button"
        onClick={() => handleTabClick('stock86')}
        className={`flex flex-col items-center justify-center h-full py-1 transition-colors relative cursor-pointer ${
          activeTab === 'stock86'
            ? 'text-amber-400 font-bold'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <div className="relative flex items-center justify-center">
          <Utensils className="w-5 h-5" />
        </div>
        <span className="text-xs mt-1 tracking-tight truncate">Item Stock & 86</span>
        {activeTab === 'stock86' && (
          <span className="w-10 h-1 bg-amber-500 rounded-full mt-0.5" />
        )}
      </button>

      {/* Tab 3: Dispatched Summary */}
      <button
        type="button"
        onClick={() => handleTabClick('dispatched')}
        className={`flex flex-col items-center justify-center h-full py-1 transition-colors relative cursor-pointer ${
          activeTab === 'dispatched'
            ? 'text-emerald-400 font-bold'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <div className="relative flex items-center justify-center">
          <BarChart3 className="w-5 h-5" />
        </div>
        <span className="text-xs mt-1 tracking-tight truncate">Dispatched Summary</span>
        {activeTab === 'dispatched' && (
          <span className="w-10 h-1 bg-emerald-500 rounded-full mt-0.5" />
        )}
      </button>

      {/* Tab 4: Order History / Recall */}
      <button
        type="button"
        onClick={() => handleTabClick('history')}
        className={`flex flex-col items-center justify-center h-full py-1 transition-colors relative cursor-pointer ${
          activeTab === 'history'
            ? 'text-sky-400 font-bold'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <div className="relative flex items-center justify-center">
          <History className="w-5 h-5" />
        </div>
        <span className="text-xs mt-1 tracking-tight truncate">Order History / Recall</span>
        {activeTab === 'history' && (
          <span className="w-10 h-1 bg-sky-500 rounded-full mt-0.5" />
        )}
      </button>
    </footer>
  );
};
