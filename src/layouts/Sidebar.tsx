import React from 'react';
import { useApp } from '../context/AppContext';
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
  Settings
} from 'lucide-react';
import { UserRole } from '../types';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  allowedRoles: UserRole[];
  badge?: number;
}

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile, onCloseMobile }) => {
  const { activeTab, setActiveTab, currentUser, kots, tables, currentBranch, pendingBillRequests } = useApp();

  const pendingKotsCount = kots.filter(
    k => (currentBranch === 'all' || k.branchId === currentBranch) && (k.status === 'new' || k.status === 'preparing')
  ).length;

  const occupiedTablesCount = tables.filter(
    t => (currentBranch === 'all' || t.branchId === currentBranch) && (t.status === 'occupied' || t.status === 'billing' || t.status === 'ready')
  ).length;

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      allowedRoles: ['owner', 'manager', 'waiter']
    },
    {
      id: 'tables',
      label: 'Tables',
      icon: <Grid3X3 className="w-4 h-4" />,
      allowedRoles: ['owner', 'manager', 'cashier', 'waiter'],
      badge: pendingBillRequests.length > 0 ? pendingBillRequests.length : (occupiedTablesCount > 0 ? occupiedTablesCount : undefined)
    },
    {
      id: 'pos',
      label: 'POS',
      icon: <ReceiptText className="w-4 h-4" />,
      allowedRoles: ['owner', 'manager', 'cashier', 'waiter']
    },
    {
      id: 'kot',
      label: 'KOT',
      icon: <FileText className="w-4 h-4" />,
      allowedRoles: ['manager', 'kitchen', 'waiter'],
      badge: pendingKotsCount > 0 ? pendingKotsCount : undefined
    },
    {
      id: 'kitchen',
      label: 'Kitchen KDS',
      icon: <ChefHat className="w-4 h-4" />,
      allowedRoles: ['owner', 'manager', 'kitchen', 'waiter'],
      badge: pendingKotsCount > 0 ? pendingKotsCount : undefined
    },
    {
      id: 'bills',
      label: 'Bills History',
      icon: <Receipt className="w-4 h-4" />,
      allowedRoles: ['owner', 'manager', 'cashier']
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: <Users className="w-4 h-4" />,
      allowedRoles: ['owner', 'manager', 'cashier']
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: <Utensils className="w-4 h-4" />,
      allowedRoles: ['owner']
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <BarChart3 className="w-4 h-4" />,
      allowedRoles: ['owner', 'manager']
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
      allowedRoles: ['owner']
    }
  ];

  const userRole = currentUser?.role || 'cashier';
  const visibleItems = navItems.filter(item => item.allowedRoles.includes(userRole));

  const content = (
    <aside className="w-56 bg-white text-slate-700 flex flex-col justify-between border-r border-slate-200 shrink-0 select-none h-full">
      {/* Navigation Links */}
      <div className="py-3 px-2.5 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
          System Navigation
        </div>
        {visibleItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-emerald-700' : 'text-slate-400 group-hover:text-emerald-700'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                  isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Role Notice Card */}
      <div className="p-3 m-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
        <div className="text-slate-500 font-medium">Logged Role:</div>
        <div className="text-emerald-700 font-bold uppercase tracking-wider font-mono mt-0.5">
          {currentUser?.role}
        </div>
        <div className="text-[10px] text-slate-500 mt-1">
          {currentUser?.role === 'owner' && 'Full multi-branch access enabled'}
          {currentUser?.role === 'manager' && 'Branch management & analytics'}
          {currentUser?.role === 'cashier' && 'Optimized for fast order entry'}
          {currentUser?.role === 'kitchen' && 'Real-time kitchen order queue'}
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar for Management Shell */}
      <div className="hidden md:flex h-full shrink-0">
        {content}
      </div>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs" 
            onClick={onCloseMobile} 
          />
          <div className="relative z-10 w-56 h-full">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
