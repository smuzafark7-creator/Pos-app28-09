import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { BranchId } from '../../types';
import { ThemeToggle } from '../../components/ThemeToggle';
import { 
  Building2, 
  Clock, 
  User, 
  LogOut, 
  Bell, 
  ChevronDown,
  UtensilsCrossed
} from 'lucide-react';

export interface OwnerHeaderProps {
  onToggleMobileSidebar?: () => void;
  className?: string;
}

export const OwnerHeader: React.FC<OwnerHeaderProps> = ({ onToggleMobileSidebar, className }) => {
  const { 
    currentUser, 
    currentBranch, 
    setBranch, 
    branches, 
    logout, 
    kots
  } = useApp();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [showBranchDropdown, setShowBranchDropdown] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const pendingKotsCount = kots.filter(
    k => (currentBranch === 'all' || k.branchId === currentBranch) && (k.status === 'new' || k.status === 'preparing')
  ).length;

  const currentBranchLabel = currentBranch === 'all' 
    ? 'All Branches (Consolidated)' 
    : (branches || []).find(b => b.id === currentBranch)?.name || 'Main Branch';

  return (
    <header className={`h-16 bg-[#0f172a]/90 backdrop-blur-md text-slate-100 px-4 lg:px-6 flex items-center justify-between border-b border-slate-800/80 sticky top-0 z-50 flex-shrink-0 select-none shadow-xs font-sans ${className || ''}`}>
      {/* Brand & Multi-Branch Selector */}
      <div className="flex items-center gap-3 md:gap-4">
        {onToggleMobileSidebar && (
          <button 
            onClick={onToggleMobileSidebar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 md:hidden transition-colors cursor-pointer"
            title="Toggle Menu"
          >
            <span className="sr-only">Toggle navigation</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs font-bold">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight uppercase text-white leading-none">
              Zaffran Flavours
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] tracking-wider text-emerald-400 font-semibold">EXECUTIVE MANAGEMENT</span>
            </div>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-800 hidden sm:block" />

        {/* Multi-Branch Selector */}
        <div className="relative">
          <button
            id="owner-branch-selector-btn"
            onClick={() => setShowBranchDropdown(prev => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111c2e] hover:bg-slate-800/80 border border-slate-700/80 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-100 font-semibold">{currentBranchLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showBranchDropdown && (
            <div 
              className="absolute left-0 mt-1.5 w-64 bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95"
              onMouseLeave={() => setShowBranchDropdown(false)}
            >
              <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Select Branch Scope
              </div>
              <button
                onClick={() => { setBranch('all'); setShowBranchDropdown(false); }}
                className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-800/70 transition-colors cursor-pointer ${
                  currentBranch === 'all' ? 'text-emerald-400 font-bold bg-emerald-950/40' : 'text-slate-300'
                }`}
              >
                <span>All Branches (Consolidated)</span>
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700/60">Total</span>
              </button>
              {branches.map(b => (
                <button
                  key={b.id}
                  onClick={() => { setBranch(b.id as BranchId); setShowBranchDropdown(false); }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-800/70 transition-colors cursor-pointer ${
                    currentBranch === b.id ? 'text-emerald-400 font-bold bg-emerald-950/40' : 'text-slate-300'
                  }`}
                >
                  <span>{b.name}</span>
                  <span className="text-[10px] text-slate-500">{b.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Controls: Global Clock, Reset Demo, Theme Toggle, Notifications, Profile & Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Date/Time */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-md bg-[#111c2e] border border-slate-800/80 text-xs text-slate-300">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>{currentDate}</span>
          <span className="text-slate-600">•</span>
          <span className="font-semibold text-white tracking-wider">{currentTime}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
        </div>

        {/* Global Light / Dark Theme Toggle Switch */}
        <ThemeToggle />

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(prev => !prev)}
            className="p-2 rounded-lg bg-[#111c2e] hover:bg-slate-800 border border-slate-800/80 text-slate-300 hover:text-white transition-colors relative cursor-pointer"
            title="Kitchen Orders Notifications"
          >
            <Bell className="w-4 h-4" />
            {pendingKotsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                {pendingKotsCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div 
              className="absolute right-0 mt-2 w-72 bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl p-3 z-50 text-xs"
              onMouseLeave={() => setShowNotifications(false)}
            >
              <div className="font-semibold text-slate-200 pb-2 border-b border-slate-800 flex justify-between items-center">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Kitchen Activity</span>
                <span className="text-[10px] text-emerald-400 font-semibold">{pendingKotsCount} active KOTs</span>
              </div>
              <div className="py-2 space-y-2 max-h-56 overflow-y-auto divide-y divide-slate-800/80">
                {kots.slice(0, 4).map(k => (
                  <div key={k.id} className="pt-2 first:pt-0 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-slate-200 text-[11px]">{k.kotNumber} • {k.tableNumber || 'Takeaway'}</div>
                      <div className="text-[10px] text-slate-400">{k.branchName} • {k.timeFormatted}</div>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                      k.status === 'ready' 
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60' 
                        : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                    }`}>
                      {k.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 flex items-center justify-center font-bold text-xs">
            {currentUser?.name ? currentUser.name.charAt(0) : <User className="w-4 h-4" />}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-slate-100 leading-tight">
              {currentUser?.name || 'Owner'}
            </div>
            <div className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
              {currentUser?.role || 'owner'}
            </div>
          </div>
        </div>

        {/* Logout Icon Button */}
        <button
          onClick={logout}
          title="Sign Out"
          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
