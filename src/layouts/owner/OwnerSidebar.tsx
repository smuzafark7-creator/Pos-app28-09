import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  ReceiptText, 
  Grid3X3, 
  FileText, 
  ChefHat, 
  Receipt, 
  Users, 
  Utensils, 
  BarChart3, 
  Settings,
  ShieldCheck
} from 'lucide-react';

export interface OwnerSidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  activeTabOverride?: string;
  onNavigate?: (tab: string) => void;
  className?: string;
}

export const OwnerSidebar: React.FC<OwnerSidebarProps> = ({ 
  isOpenMobile, 
  onCloseMobile,
  activeTabOverride,
  onNavigate,
  className
}) => {
  const { activeTab, setActiveTab, kots, tables, currentBranch, pendingBillRequests } = useApp();

  const rawActive = activeTabOverride || activeTab;
  const currentActive = (rawActive === 'kot' || rawActive === 'kot-status') ? 'kitchen' : rawActive;

  const handleSelectTab = (tab: string) => {
    const targetTab = (tab === 'kot' || tab === 'kot-status') ? 'kitchen' : tab;
    if (onNavigate) {
      onNavigate(targetTab);
    } else {
      setActiveTab(targetTab);
    }
    if (onCloseMobile) onCloseMobile();
  };

  const pendingKotsCount = kots.filter(
    k => (currentBranch === 'all' || k.branchId === currentBranch) && (k.status === 'new' || k.status === 'preparing')
  ).length;

  const occupiedTablesCount = tables.filter(
    t => (currentBranch === 'all' || t.branchId === currentBranch) && (t.status === 'occupied' || t.status === 'billing' || t.status === 'ready')
  ).length;

  const ownerNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'tables',
      label: 'Tables Map',
      icon: <Grid3X3 className="w-4 h-4" />,
      badge: pendingBillRequests.length > 0 ? pendingBillRequests.length : (occupiedTablesCount > 0 ? occupiedTablesCount : undefined)
    },
    {
      id: 'pos',
      label: 'POS Terminal',
      icon: <ReceiptText className="w-4 h-4" />,
    },
    {
      id: 'kitchen',
      label: 'Kitchen KDS',
      icon: <ChefHat className="w-4 h-4" />,
      badge: pendingKotsCount > 0 ? pendingKotsCount : undefined
    },
    {
      id: 'bills',
      label: 'Bills History',
      icon: <Receipt className="w-4 h-4" />,
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'menu',
      label: 'Menu Management',
      icon: <Utensils className="w-4 h-4" />,
    },
    {
      id: 'reports',
      label: 'Reports & GST',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
    }
  ];

  const sidebarContent = (
    <aside className={`w-64 bg-[#0d1522] text-slate-300 flex flex-col justify-between border-r border-slate-800/80 flex-shrink-0 select-none h-full overflow-y-auto shadow-xs font-sans ${className || ''}`}>
      <div className="py-4 px-3 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span>Executive Console</span>
          <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700/60 font-semibold">OWNER</span>
        </div>

        {ownerNavItems.map(item => {
          const isActive = currentActive === item.id;
          return (
            <button
              key={item.id}
              id={`owner-sidebar-${item.id}`}
              type="button"
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-slate-200 transition-colors'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                  isActive ? 'bg-slate-950/25 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 border border-slate-700/60'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Multi-Branch Status Footer */}
      <div className="p-3 m-3 rounded-xl bg-[#111c2e] border border-slate-800/80 text-[11px] shrink-0">
        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Full Enterprise Access</span>
        </div>
        <div className="text-[10px] text-slate-400 mt-1">
          3 Branches Consolidated • Live Sync
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <div className={`hidden md:flex w-64 flex-shrink-0 h-full overflow-y-auto ${className || ''}`}>
        {sidebarContent}
      </div>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs" 
            onClick={onCloseMobile} 
          />
          <div className="relative z-10 w-64 h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
