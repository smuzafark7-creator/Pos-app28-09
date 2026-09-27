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
    tableSearchTerm, 
    setTableSearchTerm,
    tableFloorFilter,
    selectTableForPOS,
    updateKOTStatus,
    showToast,
    restaurantSettings
  } = useApp();

  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
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

  // Floor calculation matching table matrix rules (1-4: Ground Floor, 5-8: First Floor, 9-10: Outdoor / Terrace)
  const getTableFloor = (tableNumber: number): string => {
    if (tableNumber <= 4) return 'Ground Floor';
    if (tableNumber <= 8) return 'First Floor';
    return 'Outdoor / Terrace';
  };

  // Dynamic floor tables count
  const floorTablesCount = useMemo(() => {
    if (tableFloorFilter === 'All') return filteredTables.length;
    return filteredTables.filter(t => getTableFloor(t.number) === tableFloorFilter).length;
  }, [filteredTables, tableFloorFilter]);

  // Dynamic floor badge label (e.g., "All Floors • 10 Tables", "Ground Floor • 4 Tables")
  const floorBadgeLabel = useMemo(() => {
    if (tableFloorFilter === 'All') {
      return `All Floors • ${floorTablesCount} Tables`;
    }
    return `${tableFloorFilter} • ${floorTablesCount} Tables`;
  }, [tableFloorFilter, floorTablesCount]);

  // Click outside listener for table search and notifications popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
      if (notificationContainerRef.current && !notificationContainerRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered matching tables for quick jump popover
  const matchingTables = useMemo(() => {
    if (!tableSearchTerm || !tableSearchTerm.trim()) return [];
    const term = tableSearchTerm.trim().toLowerCase();
    const numOnly = term.replace(/^t\s*/, '');
    return filteredTables.filter(tbl => {
      const numStr = String(tbl.number);
      const nameStr = tbl.name.toLowerCase();
      return numStr === numOnly || 
             nameStr.includes(term) || 
             `t${tbl.number}`.includes(term) ||
             nameStr.includes(numOnly);
    }).slice(0, 6);
  }, [filteredTables, tableSearchTerm]);

  const handleSelectTable = (tbl: RestaurantTable) => {
    selectTableForPOS(tbl.name);
    setTableSearchTerm(tbl.name);
    setIsSearchDropdownOpen(false);
    showToast(`Table Selected`, `Switched to ${tbl.name} (${tbl.status.toUpperCase()})`, 'info');
  };

  const waiterName = currentUser?.name?.replace(/\s*\(Waiter\)$/i, '').trim() || 'Ramesh Patel';

  return (
    <header 
      id="waiter-global-header"
      className="h-16 text-slate-200 flex justify-between items-center w-full px-4 z-30 select-none shrink-0 shadow-md font-sans"
      style={{
        backgroundColor: '#6b0716',
        borderBottom: '1px solid rgba(0, 0, 0, 0.4)'
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

      {/* 2. Center Section: [Search Table Input] -> [Active Floor / Filter State] -> [Active Tables: 5] */}
      <div className="flex items-center justify-center gap-2 md:gap-3 flex-1 max-w-2xl mx-2 sm:mx-4">
        {/* Fast Table Search/Filter Input */}
        <div className="relative flex-1 max-w-xs sm:max-w-sm" ref={searchContainerRef}>
          <div 
            id="waiter-table-search-wrapper"
            className="waiter-header-search-wrapper relative flex items-center rounded-lg shadow-xs"
            style={{
              backgroundColor: 'rgba(11, 17, 32, 0.6)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px'
            }}
          >
            <Search 
              className="absolute left-2.5 w-3.5 h-3.5 pointer-events-none" 
              style={{ color: '#94a3b8' }}
            />
            <input
              id="waiter-table-search-input"
              ref={searchInputRef}
              type="text"
              value={tableSearchTerm}
              onChange={(e) => {
                setTableSearchTerm(e.target.value);
                setIsSearchDropdownOpen(true);
              }}
              onFocus={() => {
                if (tableSearchTerm.trim().length > 0) {
                  setIsSearchDropdownOpen(true);
                }
              }}
              placeholder="Search Table No. (e.g. T1, T5)..."
              style={{
                backgroundColor: 'transparent',
                color: '#ffffff',
                fontWeight: 600,
                border: 'none',
              }}
              className="waiter-header-search-input w-full pl-8 pr-7 py-1.5 rounded-lg text-xs sm:text-sm placeholder-slate-400 focus:outline-none transition-colors"
            />
            {tableSearchTerm && (
              <button
                type="button"
                onClick={() => {
                  setTableSearchTerm('');
                  setIsSearchDropdownOpen(false);
                  if (searchInputRef.current) searchInputRef.current.focus();
                }}
                className="absolute right-2 cursor-pointer"
                title="Clear filter"
              >
                <X className="w-3.5 h-3.5" style={{ color: '#94a3b8' }} />
              </button>
            )}
          </div>

          {/* Quick Table Search Dropdown Results */}
          {isSearchDropdownOpen && matchingTables.length > 0 && (
            <div className="absolute left-0 right-0 mt-1.5 bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95 font-sans">
              <div className="px-2 py-1 flex items-center justify-between text-[10px] text-slate-400 uppercase font-semibold border-b border-slate-800 mb-1">
                <span>Matching Tables ({matchingTables.length})</span>
                <span className="text-[9px]">Click to jump</span>
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {matchingTables.map(tbl => (
                  <button
                    key={tbl.id}
                    type="button"
                    onClick={() => handleSelectTable(tbl)}
                    className="w-full text-left p-2 rounded-lg bg-[#080d1a] hover:bg-slate-800/80 border border-slate-800/80 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-xs">{tbl.name} (T{tbl.number})</span>
                      <span className="text-[10px] text-slate-400">• {tbl.capacity} Seats</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {tbl.status === 'occupied' ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-800/40 font-medium">
                          OCCUPIED {tbl.currentAmount ? `₹${tbl.currentAmount}` : ''}
                        </span>
                      ) : tbl.status === 'billing' ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/40 text-purple-400 border border-purple-800/40 font-medium">
                          BILLING
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 font-medium">
                          AVAILABLE
                        </span>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Active Floor / Filter State (Dark Slate Container) */}
        <div 
          id="waiter-header-floor-badge"
          style={{
            backgroundColor: '#0b1120',
            border: '1px solid #1e293b',
            color: '#e2e8f0',
            fontWeight: 700,
          }}
          className="waiter-header-floor-badge hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shrink-0 shadow-2xs cursor-default"
        >
          <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: '#94a3b8' }} />
          <span 
            className="text-[11px] lg:text-xs font-bold whitespace-nowrap"
            style={{ color: '#e2e8f0', fontWeight: 700 }}
          >
            {floorBadgeLabel}
          </span>
        </div>

        {/* Active Tables Metric Badge (Dark Slate Container) */}
        <div 
          id="waiter-header-active-tables-badge"
          style={{
            backgroundColor: '#0b1120',
            border: '1px solid #1e293b',
            color: '#e2e8f0',
            fontWeight: 700,
          }}
          className="waiter-header-active-tables-badge hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shrink-0 text-[11px] lg:text-xs shadow-2xs cursor-default"
        >
          <Layers className="w-3.5 h-3.5 shrink-0" style={{ color: '#94a3b8' }} />
          <span className="whitespace-nowrap font-bold" style={{ color: '#e2e8f0', fontWeight: 700 }}>Active Tables:</span>
          <span className="font-extrabold" style={{ color: '#34d399', fontWeight: 800 }}>{occupiedCount}</span>
        </div>
      </div>

      {/* 3. Right Section: Theme Toggle -> Ready Notifications Bell -> Waiter Profile ("Ramesh Patel") -> Shift Logout */}
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

        {/* Kitchen Ready Notification Bell (Dark Slate Container) */}
        <div className="relative" ref={notificationContainerRef}>
          <button
            id="waiter-ready-notifications-bell"
            type="button"
            onClick={() => setIsNotificationOpen(prev => !prev)}
            style={{
              backgroundColor: '#0b1120',
              border: '1px solid #1e293b',
              color: '#f1f5f9',
            }}
            className="waiter-header-bell-btn relative p-2 rounded-lg border transition-all cursor-pointer select-none flex items-center justify-center hover:bg-[#151f33] shadow-2xs"
            title={readyCount > 0 ? `${readyCount} order(s) READY for pickup from kitchen` : 'Kitchen notifications'}
          >
            <Bell className="w-4 h-4 shrink-0" style={{ color: '#f1f5f9' }} />
            
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
