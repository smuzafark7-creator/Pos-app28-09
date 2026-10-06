import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  UtensilsCrossed, 
  User, 
  LogOut, 
  MapPin, 
  Layers,
  Search,
  X,
  ChevronRight,
  Bell,
  Utensils,
  Package,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { RestaurantTable } from '../../types';
import { ThemeToggle } from '../../components/ThemeToggle';

export const WaiterHeader: React.FC = () => {
  const { 
    currentUser, 
    logout, 
    filteredTables, 
    filteredKots,
    kots,
    selectTableForPOS,
    updateKOTStatus,
    showToast,
    restaurantSettings
  } = useApp();

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationContainerRef = useRef<HTMLDivElement>(null);

  // Kitchen KOTs ready for pickup from kitchen (Strictly DINE-IN only for Waiter)
  const readyKots = useMemo(() => {
    const list = filteredKots || kots || [];
    return list.filter(k => 
      k.status === 'ready' && 
      !k.isBilled && 
      (k.orderType?.toLowerCase() === 'dine_in')
    );
  }, [filteredKots, kots]);

  // Picked up KOTs en route to tables (Strictly DINE-IN only for Waiter)
  const pickedUpKots = useMemo(() => {
    const list = filteredKots || kots || [];
    return list.filter(k => 
      k.status === 'picked_up' && 
      !k.isBilled && 
      (k.orderType?.toLowerCase() === 'dine_in')
    );
  }, [filteredKots, kots]);

  const readyCount = readyKots.length;

  // Active occupied/billing tables count
  const occupiedCount = useMemo(() => {
    return filteredTables.filter(t => t.status === 'occupied' || t.status === 'billing').length;
  }, [filteredTables]);

  // Click outside listener for notifications popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationContainerRef.current && !notificationContainerRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const waiterName = currentUser?.name?.replace(/\s*\(Waiter\)$/i, '').trim() || 'Ramesh Patel';

  return (
    <header 
      id="waiter-global-header"
      className="h-16 text-slate-200 flex justify-between items-center w-full px-4 z-30 select-none shrink-0 shadow-md font-sans"
      style={{
        background: 'linear-gradient(180deg, #5c0612 0%, #4a030c 100%)',
        backgroundColor: '#580510',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* 1. Left Section: Logo badge & Restaurant/Terminal Title & Subtitle */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <div 
          id="waiter-utensils-icon-container"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-bold shadow-2xs shrink-0"
          style={{
            backgroundColor: '#1e293b',
            color: '#fbbf24',
            border: '1px solid #334155'
          }}
        >
          <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
        </div>
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <span 
              id="waiter-header-brand-title"
              className="waiter-header-title tracking-tight uppercase whitespace-nowrap"
              style={{
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '16px',
                WebkitTextFillColor: '#ffffff'
              }}
            >
              {restaurantSettings?.name && restaurantSettings.name !== 'Bilaal Restaurant' 
                ? `${restaurantSettings.name} Order Pad` 
                : 'ZAFFRAN FLAVOURS ORDER PAD'}
            </span>
            <span 
              id="waiter-header-role-badge"
              className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold whitespace-nowrap tracking-wider"
            >
              WAITER
            </span>
            <span 
              id="waiter-header-role-subtitle"
              className="waiter-header-subtitle whitespace-nowrap hidden sm:inline"
              style={{
                color: '#cbd5e1',
                fontWeight: 600,
                fontSize: '12px',
                WebkitTextFillColor: '#cbd5e1'
              }}
            >
              • Dine-In Service
            </span>
          </div>
          <div 
            className="waiter-header-subtitle flex items-center gap-1.5 whitespace-nowrap mt-0.5"
            style={{
              color: '#cbd5e1',
              fontWeight: 600,
              fontSize: '12px',
              WebkitTextFillColor: '#cbd5e1'
            }}
          >
            <span>Dine-In Terminal</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 font-semibold">{occupiedCount} Tables Active</span>
          </div>
        </div>
      </div>

      {/* 2. Right Section: Theme Toggle -> Ready Notifications Bell -> Waiter Profile ("Ramesh Patel") -> Shift Logout */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Global Light / Dark Theme Toggle (Dark Slate Container) */}
        <div className="waiter-header-theme-toggle-wrapper">
          <ThemeToggle 
            className="waiter-header-theme-toggle-btn"
            style={{
              backgroundColor: '#0b1120',
              border: '1px solid #1e293b',
              color: '#f1f5f9',
              borderRadius: '8px',
            }}
          />
        </div>

        {/* Kitchen Ready Notification Bell (Butter Cream Container) */}
        <div className="relative" ref={notificationContainerRef}>
          <button
            id="waiter-ready-notifications-bell"
            type="button"
            onClick={() => setIsNotificationOpen(prev => !prev)}
            style={{
              backgroundColor: '#F7EECA',
              border: '1px solid #EADBBA',
              color: '#0f172a',
            }}
            className="waiter-header-bell-btn notification-bell-butter-cream relative p-2 rounded-lg border transition-all cursor-pointer select-none flex items-center justify-center hover:bg-[#efe5c0] shadow-2xs"
            title={readyCount > 0 ? `${readyCount} order(s) READY for pickup from kitchen` : 'Kitchen notifications'}
          >
            <Bell className="w-4 h-4 shrink-0" style={{ color: '#0f172a', stroke: '#0f172a' }} />
            
            {readyCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-[9px] font-black text-white items-center justify-center shadow-md font-mono">
                  {readyCount}
                </span>
              </span>
            )}
          </button>

          {/* Compact Popover Dropdown */}
          {isNotificationOpen && (
            <div 
              id="waiter-notifications-dropdown"
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden text-slate-200"
            >
              {/* Header */}
              <div className="px-3.5 py-2.5 bg-[#080d1a] border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${readyCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Kitchen Alerts
                  </span>
                  {readyCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold font-mono">
                      {readyCount} Ready
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsNotificationOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Popover Body */}
              <div className="max-h-[380px] overflow-y-auto p-2.5 space-y-2">
                {readyKots.length === 0 && pickedUpKots.length === 0 ? (
                  <div className="py-8 px-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-2.5 text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-semibold text-white">No Ready Orders</div>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-[220px] mx-auto">
                      All kitchen orders are currently cooking or served. New ready orders will alert here immediately.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Ready KOTs section */}
                    {readyKots.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider px-1 flex items-center gap-1.5">
                          <span>🔔 Ready for Pickup ({readyKots.length})</span>
                        </div>

                        {readyKots.map(k => (
                          <div 
                            key={k.id} 
                            className="p-3 rounded-lg bg-[#080d1a] border border-emerald-500/40 hover:border-emerald-400 shadow-md shadow-emerald-950/20 transition-all"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                                  <span className="text-emerald-400 font-extrabold text-sm">
                                    {k.tableNumber || (k.orderType === 'takeaway' ? 'Takeaway' : 'Order')}:
                                  </span>
                                  <span className="text-white">Order READY for pickup from kitchen</span>
                                </div>
                                
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                                  <span className="font-mono text-emerald-300 font-semibold">{k.kotNumber}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-500" />
                                    {k.readyAt ? `Ready at ${k.readyAt}` : (k.timeFormatted || 'Just now')}
                                  </span>
                                  <span>•</span>
                                  <span className="text-slate-300 font-medium">₹{k.totalAmount.toFixed(0)}</span>
                                </div>

                                <div className="text-[11px] text-slate-300 mt-1.5 line-clamp-1 bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
                                  {k.items.map(i => `${i.name} × ${i.quantity}`).join(', ')}
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-slate-800/80">
                              <button
                                type="button"
                                onClick={() => {
                                  updateKOTStatus(k.id, 'served');
                                  showToast('Order Served', `${k.tableNumber || 'Order'} marked as served to guests!`, 'success');
                                }}
                                className="flex-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm border border-emerald-400/40"
                              >
                                <Utensils className="w-3.5 h-3.5 text-emerald-100" />
                                <span>Mark Served</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  updateKOTStatus(k.id, 'picked_up');
                                  showToast('Food Picked Up', `${k.kotNumber} picked up — en route to ${k.tableNumber || 'Table'}!`, 'info');
                                }}
                                className="py-1.5 px-2.5 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 rounded-md text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                              >
                                <Package className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Pick Up</span>
                              </button>

                              {k.tableNumber && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    selectTableForPOS(k.tableNumber!);
                                    setIsNotificationOpen(false);
                                  }}
                                  className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer border border-slate-700"
                                >
                                  <span>View Table</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Picked Up KOTs section (En Route) */}
                    {pickedUpKots.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider px-1 flex items-center gap-1.5">
                          <span>🚶 Picked Up / En Route to Table ({pickedUpKots.length})</span>
                        </div>

                        {pickedUpKots.map(k => (
                          <div 
                            key={k.id} 
                            className="p-3 rounded-lg bg-[#080d1a] border border-cyan-500/30 hover:border-cyan-400 transition-all"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                  <span className="text-cyan-400 font-extrabold text-sm">
                                    {k.tableNumber || 'Table'}:
                                  </span>
                                  <span className="text-slate-200">En route to table</span>
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  {k.kotNumber} • {k.items.map(i => `${i.name} × ${i.quantity}`).join(', ')}
                                </div>
                              </div>
                            </div>

                            <div className="mt-2 pt-2 border-t border-slate-800/80">
                              <button
                                type="button"
                                onClick={() => {
                                  updateKOTStatus(k.id, 'served');
                                  showToast('Order Served', `${k.tableNumber || 'Order'} marked as served to guests!`, 'success');
                                }}
                                className="w-full py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm border border-emerald-400/40"
                              >
                                <Utensils className="w-3.5 h-3.5 text-emerald-100" />
                                <span>Mark Served to Table</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Waiter Profile Chip (Dark slate pill) */}
        <div 
          id="waiter-header-user-profile"
          className="waiter-header-user-profile flex items-center gap-2 px-2.5 py-1.5 rounded-lg border shadow-2xs"
          style={{
            backgroundColor: '#0b1120',
            border: '1px solid #1e293b',
            color: '#ffffff',
          }}
        >
          <div 
            className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0"
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
            }}
          >
            <User className="w-3.5 h-3.5" style={{ color: '#34d399' }} />
          </div>
          <span 
            className="text-xs sm:text-sm whitespace-nowrap hidden sm:inline font-bold"
            style={{
              color: '#ffffff',
              fontWeight: 700,
            }}
          >
            {waiterName}
          </span>
        </div>

        {/* Logout Icon Button */}
        <button
          id="waiter-logout-btn"
          type="button"
          onClick={logout}
          title="Sign Out"
          style={{
            backgroundColor: 'rgba(11, 17, 32, 0.7)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
          className="p-2 rounded-lg transition-colors cursor-pointer hover:bg-rose-950/40"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
