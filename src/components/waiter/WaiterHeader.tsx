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
    selectTableForPOS,
    showToast,
    restaurantSettings
  } = useApp();

  const safeFilteredTables = Array.isArray(filteredTables) ? filteredTables : [];

  const occupiedCount = useMemo(() => {
    return safeFilteredTables.filter(t => t.status === 'occupied' || t.status === 'billing').length;
  }, [safeFilteredTables]);

  const waiterName = currentUser?.name?.replace(/\s*\(Waiter\)$/i, '').trim() || 'Ramesh Patel';

  return (
    <header 
      id="waiter-global-header-secondary"
      className="h-16 text-slate-200 flex justify-between items-center w-full px-4 z-30 select-none shrink-0 shadow-md font-sans"
      style={{
        background: 'linear-gradient(180deg, #5c0612 0%, #4a030c 100%)',
        backgroundColor: '#580510',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
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

      {/* 2. Right Section: Waiter profile and Sign out */}
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
