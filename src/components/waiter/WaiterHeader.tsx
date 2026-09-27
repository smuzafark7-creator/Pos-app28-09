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
  ChevronRight
} from 'lucide-react';
import { RestaurantTable } from '../../types';

export const WaiterHeader: React.FC = () => {
  const { 
    currentUser, 
    logout, 
    filteredTables, 
    tableSearchTerm, 
    setTableSearchTerm,
    tableFloorFilter,
    selectTableForPOS,
    showToast,
    restaurantSettings
  } = useApp();

  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const safeFilteredTables = Array.isArray(filteredTables) ? filteredTables : [];

  const occupiedCount = useMemo(() => {
    return safeFilteredTables.filter(t => t.status === 'occupied' || t.status === 'billing').length;
  }, [safeFilteredTables]);

  const getTableFloor = (tableNumber: number): string => {
    if (tableNumber <= 4) return 'Ground Floor';
    if (tableNumber <= 8) return 'First Floor';
    return 'Outdoor / Terrace';
  };

  const floorTablesCount = useMemo(() => {
    if (tableFloorFilter === 'All') return safeFilteredTables.length;
    return safeFilteredTables.filter(t => getTableFloor(t.number) === tableFloorFilter).length;
  }, [safeFilteredTables, tableFloorFilter]);

  const floorBadgeLabel = useMemo(() => {
    if (tableFloorFilter === 'All') {
      return `All Floors • ${floorTablesCount} Tables`;
    }
    return `${tableFloorFilter} • ${floorTablesCount} Tables`;
  }, [tableFloorFilter, floorTablesCount]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const matchingTables = useMemo(() => {
    if (!tableSearchTerm || !tableSearchTerm.trim()) return [];
    const term = tableSearchTerm.trim().toLowerCase();
    const numOnly = term.replace(/^t\s*/, '');
    return safeFilteredTables.filter(tbl => {
      const numStr = String(tbl.number);
      const nameStr = tbl.name.toLowerCase();
      return numStr === numOnly || 
             nameStr.includes(term) || 
             `t${tbl.number}`.includes(term) ||
             nameStr.includes(numOnly);
    }).slice(0, 6);
  }, [safeFilteredTables, tableSearchTerm]);

  const handleSelectTable = (tbl: RestaurantTable) => {
    selectTableForPOS(tbl.name);
    setTableSearchTerm(tbl.name);
    setIsSearchDropdownOpen(false);
    showToast(`Table Selected`, `Switched to ${tbl.name} (${tbl.status.toUpperCase()})`, 'info');
  };

  const waiterName = currentUser?.name?.replace(/\s*\(Waiter\)$/i, '').trim() || 'Ramesh Patel';

  return (
    <header 
      id="waiter-global-header-secondary"
      className="h-16 text-slate-200 flex justify-between items-center w-full px-4 z-30 select-none shrink-0 shadow-md font-sans"
      style={{
        backgroundColor: '#6b0716',
        borderBottom: '1px solid rgba(0, 0, 0, 0.4)'
      }}
    >
      {/* 1. Left Section: Logo badge */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <div 
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
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 whitespace-nowrap tracking-wider">
              WAITER
            </span>
            <span 
              className="waiter-header-subtitle whitespace-nowrap hidden sm:inline"
              style={{
                color: '#cbd5e1',
                fontWeight: 600,
                fontSize: '12px',
                WebkitTextFillColor: '#cbd5e1'
              }}
            >
              • Main Dining Floor
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
            <span className="text-emerald-400 font-semibold">{occupiedCount} Active Tables</span>
          </div>
        </div>
      </div>

      {/* 2. Middle Section: Search & Floor Pill */}
      <div className="hidden md:flex items-center gap-2 max-w-md w-full mx-4">
        <div ref={searchContainerRef} className="relative flex-1">
          <div 
            className="relative flex items-center rounded-lg shadow-xs"
            style={{
              backgroundColor: 'rgba(11, 17, 32, 0.6)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px'
            }}
          >
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94a3b8' }} />
            <input
              ref={searchInputRef}
              type="text"
              value={tableSearchTerm}
              onChange={e => {
                setTableSearchTerm(e.target.value);
                setIsSearchDropdownOpen(true);
              }}
              onFocus={() => setIsSearchDropdownOpen(true)}
              placeholder="Search Table No. (e.g. 4, T2)..."
              style={{
                backgroundColor: 'transparent',
                color: '#ffffff',
                fontWeight: 600,
                border: 'none',
              }}
              className="w-full pl-8 pr-7 py-1.5 rounded-lg text-xs placeholder-slate-400 focus:outline-none transition-colors"
            />
            {tableSearchTerm && (
              <button
                type="button"
                onClick={() => {
                  setTableSearchTerm('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                <X className="w-3 h-3" style={{ color: '#94a3b8' }} />
              </button>
            )}
          </div>

          {isSearchDropdownOpen && matchingTables.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 text-xs max-h-56 overflow-y-auto">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                Select Table
              </div>
              {matchingTables.map(tbl => (
                <button
                  key={tbl.id}
                  type="button"
                  onClick={() => handleSelectTable(tbl)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-slate-200 bg-[#080d1a] hover:bg-slate-800/80 border border-slate-800/80 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">T{tbl.number}</span>
                    <span className="text-[11px] text-slate-400">{tbl.name}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">
                    {tbl.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div 
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shrink-0 shadow-2xs"
          style={{
            backgroundColor: '#0b1120',
            border: '1px solid #1e293b',
            color: '#e2e8f0',
            fontWeight: 700,
          }}
        >
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span style={{ color: '#e2e8f0' }}>{floorBadgeLabel}</span>
        </div>
      </div>

      {/* 3. Right Section: Waiter profile and Sign out */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div 
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border shadow-2xs text-xs"
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
            <User className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-white font-bold text-[11px] leading-tight">{waiterName}</span>
            <span className="text-emerald-400 text-[9px] font-bold leading-tight">ACTIVE SHIFT</span>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          style={{
            backgroundColor: 'rgba(11, 17, 32, 0.7)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
          className="p-2 rounded-lg transition-colors cursor-pointer hover:bg-rose-950/40"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
