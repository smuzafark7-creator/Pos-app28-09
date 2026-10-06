import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { KdsCard } from '../components/kitchen/KdsCard';
import { 
  KDS_STATUS_OPTIONS, 
  KDS_ORDER_TYPE_OPTIONS, 
  KdsOrderType,
  matchesKdsStatus, 
  matchesKdsOrderType, 
  getKdsStatusCounts, 
  getKdsTypeCounts 
} from '../components/kitchen/kdsFilters';
import { 
  Columns3, 
  LayoutGrid, 
  UtensilsCrossed, 
  RotateCcw, 
  Check, 
  Flame, 
  CheckCircle,
  Search,
  X,
  ChevronDown,
  Layers,
  ShoppingBag,
  Bike
} from 'lucide-react';
import { BrandWatermark } from '../components/BrandWatermark';

// Rich icon and chromatic badge config for each Order Type
const ORDER_TYPE_CONFIG: Record<
  KdsOrderType,
  {
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    iconColor: string;
    badgeStyle: React.CSSProperties;
    hoverStyle: {
      backgroundColor: string;
      borderLeft: string;
    };
  }
> = {
  'All Types': {
    icon: Layers,
    iconColor: '#cbd5e1',
    badgeStyle: {
      backgroundColor: '#1e293b',
      color: '#f8fafc',
      border: '1px solid rgba(255, 255, 255, 0.15)',
    },
    hoverStyle: {
      backgroundColor: 'rgba(30, 41, 59, 0.6)',
      borderLeft: '4px solid rgba(255, 255, 255, 0.3)',
    },
  },
  'Dine In': {
    icon: UtensilsCrossed,
    iconColor: '#60a5fa',
    badgeStyle: {
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      color: '#93c5fd',
      border: '1px solid rgba(96, 165, 250, 0.4)',
    },
    hoverStyle: {
      backgroundColor: 'rgba(30, 58, 138, 0.3)',
      borderLeft: '4px solid #60a5fa',
    },
  },
  'Takeaway': {
    icon: ShoppingBag,
    iconColor: '#fbbf24',
    badgeStyle: {
      backgroundColor: 'rgba(245, 158, 11, 0.2)',
      color: '#fcd34d',
      border: '1px solid rgba(245, 158, 11, 0.4)',
    },
    hoverStyle: {
      backgroundColor: 'rgba(180, 83, 9, 0.25)',
      borderLeft: '4px solid #f59e0b',
    },
  },
  'Delivery': {
    icon: Bike,
    iconColor: '#34d399',
    badgeStyle: {
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      color: '#6ee7b7',
      border: '1px solid rgba(16, 185, 129, 0.4)',
    },
    hoverStyle: {
      backgroundColor: 'rgba(6, 78, 59, 0.3)',
      borderLeft: '4px solid #10b981',
    },
  },
};

export const KOTPage: React.FC = () => {
  const { filteredKots, menuItems, updateKOTStatus, bills } = useApp();
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<KdsOrderType>('All Types');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isOrderTypeOpen, setIsOrderTypeOpen] = useState<boolean>(false);
  const orderTypeDropdownRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'columns' | 'grid'>('columns');
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (orderTypeDropdownRef.current && !orderTypeDropdownRef.current.contains(e.target as Node)) {
        setIsOrderTypeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-refresh timer for elapsed times every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Live status counts computed across tickets matching current order type
  const counts = useMemo(() => {
    return getKdsStatusCounts(filteredKots, 'All Stations', menuItems, typeFilter);
  }, [filteredKots, menuItems, typeFilter]);

  // Live order type counts computed for active tickets (New, Preparing, Ready)
  const typeCounts = useMemo(() => {
    return getKdsTypeCounts(filteredKots, 'All Stations', menuItems);
  }, [filteredKots, menuItems]);

  // All valid tickets (excluding completely voided/cancelled tickets)
  const validKots = useMemo(() => {
    return filteredKots.filter(k => k.status !== 'cancelled');
  }, [filteredKots]);

  // KOTs filtered by selected Order Type
  const typeFilteredKots = useMemo(() => {
    return validKots.filter(k => matchesKdsOrderType(k, typeFilter));
  }, [validKots, typeFilter]);

  // KOTs live filtered by Search Query (KOT #, Bill #, Table, Dish name)
  const searchFilteredKots = useMemo(() => {
    if (!searchQuery.trim()) return typeFilteredKots;
    const q = searchQuery.toLowerCase().trim();
    return typeFilteredKots.filter(k => {
      if (k.kotNumber && k.kotNumber.toLowerCase().includes(q)) return true;
      if (k.tableNumber && k.tableNumber.toLowerCase().includes(q)) return true;
      if (k.customerName && k.customerName.toLowerCase().includes(q)) return true;
      if (k.items && k.items.some(item => (item.name || '').toLowerCase().includes(q))) return true;
      // Also match linked bill number if present
      const linkedBill = bills?.find(b => 
        (b.kotNumber === k.kotNumber) || 
        (b.kotNumbers && b.kotNumbers.includes(k.kotNumber)) ||
        (b.tableNumber && k.tableNumber && b.tableNumber.toLowerCase() === k.tableNumber.toLowerCase() && b.status !== 'cancelled')
      );
      if (linkedBill && linkedBill.billNumber?.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [typeFilteredKots, searchQuery, bills]);

  // Active tickets (non-served, non-cancelled) for 3-Column board
  const activeKots = useMemo(() => {
    return searchFilteredKots
      .filter(k => k.status !== 'served')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [searchFilteredKots]);

  const newKots = useMemo(() => activeKots.filter(k => k.status === 'new'), [activeKots]);
  const preparingKots = useMemo(() => activeKots.filter(k => k.status === 'preparing'), [activeKots]);
  const readyKots = useMemo(() => activeKots.filter(k => k.status === 'ready' || k.status === 'picked_up'), [activeKots]);

  // Final displayed KOTs when in grid view or status-filtered
  const displayedKots = useMemo(() => {
    if (statusFilter === 'All') {
      return [...searchFilteredKots].sort((a, b) => {
        // Active tickets first, served tickets last (newest served first)
        if (a.status === 'served' && b.status !== 'served') return 1;
        if (a.status !== 'served' && b.status === 'served') return -1;
        if (a.status === 'served' && b.status === 'served') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    }
    if (statusFilter === 'New') {
      return searchFilteredKots
        .filter(k => k.status === 'new')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    if (statusFilter === 'Preparing') {
      return searchFilteredKots
        .filter(k => k.status === 'preparing')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    if (statusFilter === 'Ready') {
      return searchFilteredKots
        .filter(k => k.status === 'ready')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    if (statusFilter === 'Picked Up') {
      return searchFilteredKots
        .filter(k => k.status === 'picked_up')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    if (statusFilter === 'Served' || statusFilter === 'Served / Completed') {
      return searchFilteredKots
        .filter(k => k.status === 'served')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return searchFilteredKots.filter(k => matchesKdsStatus(k, statusFilter));
  }, [searchFilteredKots, statusFilter]);

  return (
    <div 
      className="kot-main-wrapper flex-1 min-h-screen flex flex-col text-slate-100 font-sans relative z-2 bg-transparent"
      style={{ backgroundColor: 'transparent', position: 'relative', zIndex: 2 }}
    >
      {/* Bilaal Restaurant Crest Watermark (Fixed to Viewport Center) */}
      <BrandWatermark opacity={0.18} />

      {/* 1. POS-THEMED SUB-HEADER FILTER BAR */}
      <div 
        className="kot-filter-bar shrink-0 w-full px-4 py-2.5 border-b flex items-center justify-between gap-3 sm:gap-4 shadow-xs select-none sticky top-0 z-50 backdrop-blur-md overflow-visible"
        style={{ backgroundColor: '#0a0f18', borderColor: '#1e293b', overflow: 'visible' }}
      >
        {/* Left Section: Status Filter Pills + Search Input */}
        <div className="flex items-center min-w-0 flex-1 overflow-x-auto py-1 ml-1 sm:ml-2">
          <div className="flex items-center gap-1.5 shrink-0">
            {KDS_STATUS_OPTIONS.map(opt => {
            const count = counts[opt.key] ?? counts[opt.label] ?? 0;
            const isActive = statusFilter === opt.key || (opt.key === 'Served' && statusFilter === 'Served / Completed');

            // Vibrant chromatic identity for each status
            const theme = (() => {
              switch (opt.key) {
                case 'New':
                  return {
                    pill: isActive
                      ? {
                          backgroundColor: '#e11d48',
                          color: '#ffffff',
                          fontWeight: 800,
                          border: '1px solid #fb7185',
                          boxShadow: '0 2px 10px rgba(225, 29, 72, 0.45)',
                        }
                      : {
                          backgroundColor: 'rgba(76, 5, 25, 0.6)',
                          color: '#fda4af',
                          fontWeight: 700,
                          border: '1px solid rgba(244, 63, 94, 0.5)',
                        },
                    badge: isActive
                      ? { backgroundColor: 'rgba(0, 0, 0, 0.35)', color: '#ffffff', fontWeight: 800 }
                      : { backgroundColor: 'rgba(244, 63, 94, 0.25)', color: '#fda4af', fontWeight: 800 },
                  };
                case 'Preparing':
                  return {
                    pill: isActive
                      ? {
                          backgroundColor: '#f59e0b',
                          color: '#0f172a',
                          fontWeight: 900,
                          border: '1px solid #fde68a',
                          boxShadow: '0 2px 10px rgba(245, 158, 11, 0.45)',
                        }
                      : {
                          backgroundColor: 'rgba(69, 26, 3, 0.6)',
                          color: '#fcd34d',
                          fontWeight: 700,
                          border: '1px solid rgba(245, 158, 11, 0.5)',
                        },
                    badge: isActive
                      ? { backgroundColor: 'rgba(15, 23, 42, 0.25)', color: '#0f172a', fontWeight: 900 }
                      : { backgroundColor: 'rgba(245, 158, 11, 0.25)', color: '#fcd34d', fontWeight: 800 },
                  };
                case 'Ready':
                  return {
                    pill: isActive
                      ? {
                          backgroundColor: '#059669',
                          color: '#ffffff',
                          fontWeight: 800,
                          border: '1px solid #6ee7b7',
                          boxShadow: '0 2px 10px rgba(5, 150, 105, 0.45)',
                        }
                      : {
                          backgroundColor: 'rgba(6, 78, 59, 0.6)',
                          color: '#6ee7b7',
                          fontWeight: 700,
                          border: '1px solid rgba(16, 185, 129, 0.5)',
                        },
                    badge: isActive
                      ? { backgroundColor: 'rgba(0, 0, 0, 0.35)', color: '#ffffff', fontWeight: 800 }
                      : { backgroundColor: 'rgba(16, 185, 129, 0.25)', color: '#6ee7b7', fontWeight: 800 },
                  };
                case 'Picked Up':
                  return {
                    pill: isActive
                      ? {
                          backgroundColor: '#06b6d4',
                          color: '#0f172a',
                          fontWeight: 900,
                          border: '1px solid #a5f3fc',
                          boxShadow: '0 2px 10px rgba(6, 182, 212, 0.45)',
                        }
                      : {
                          backgroundColor: 'rgba(22, 78, 99, 0.6)',
                          color: '#67e8f9',
                          fontWeight: 700,
                          border: '1px solid rgba(6, 182, 212, 0.5)',
                        },
                    badge: isActive
                      ? { backgroundColor: 'rgba(15, 23, 42, 0.25)', color: '#0f172a', fontWeight: 900 }
                      : { backgroundColor: 'rgba(6, 182, 212, 0.25)', color: '#67e8f9', fontWeight: 800 },
                  };
                case 'Served':
                  return {
                    pill: isActive
                      ? {
                          backgroundColor: '#9333ea',
                          color: '#ffffff',
                          fontWeight: 800,
                          border: '1px solid #d8b4fe',
                          boxShadow: '0 2px 10px rgba(147, 51, 234, 0.45)',
                        }
                      : {
                          backgroundColor: 'rgba(59, 7, 100, 0.6)',
                          color: '#d8b4fe',
                          fontWeight: 700,
                          border: '1px solid rgba(168, 85, 247, 0.5)',
                        },
                    badge: isActive
                      ? { backgroundColor: 'rgba(0, 0, 0, 0.35)', color: '#ffffff', fontWeight: 800 }
                      : { backgroundColor: 'rgba(168, 85, 247, 0.25)', color: '#d8b4fe', fontWeight: 800 },
                  };
                case 'All':
                default:
                  return {
                    pill: isActive
                      ? {
                          backgroundColor: '#b91c1c',
                          color: '#ffffff',
                          fontWeight: 800,
                          border: '1px solid #f87171',
                          boxShadow: '0 2px 10px rgba(185, 28, 28, 0.45)',
                        }
                      : {
                          backgroundColor: 'rgba(30, 41, 59, 0.8)',
                          color: '#e2e8f0',
                          fontWeight: 700,
                          border: '1px solid rgba(71, 85, 105, 0.6)',
                        },
                    badge: isActive
                      ? { backgroundColor: 'rgba(0, 0, 0, 0.35)', color: '#ffffff', fontWeight: 800 }
                      : { backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#e2e8f0', fontWeight: 800 },
                  };
              }
            })();

            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setStatusFilter(opt.key)}
                className="kot-filter-pill px-3 py-1.5 text-xs whitespace-nowrap cursor-pointer flex items-center gap-1.5 rounded-lg font-bold"
                style={theme.pill}
              >
                <span className="kot-pill-label">
                  {opt.label}
                </span>
                <span 
                  className="kot-count-badge px-1.5 py-0.2 rounded-full text-[11px]"
                  style={theme.badge}
                >
                  {count}
                </span>
              </button>
            );
          })}
          </div>

          {/* Search Box placed immediately next to Status Pills (beside Served) */}
          <div 
            className="relative flex items-center min-w-[240px] sm:min-w-[280px] max-w-[340px] shrink-0"
            style={{ marginLeft: '14px' }}
          >
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search KOT #, Table, Dish..."
              className="kot-search-input w-full placeholder:text-slate-400 focus:outline-none"
              style={{
                backgroundColor: 'rgba(11, 17, 32, 0.7)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: '9999px',
                padding: '6px 16px 6px 36px',
                fontSize: '13px',
                minWidth: '240px',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Center / Right Section: Order Type Dropdown + Reset + View Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 ml-auto">
          {/* Custom Floating Pill Order-Type Dropdown */}
          <div 
            className="relative inline-block shrink-0" 
            style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}
            ref={orderTypeDropdownRef}
          >
            <button
              type="button"
              onClick={() => setIsOrderTypeOpen(prev => !prev)}
              className="kot-order-type-trigger inline-flex items-center gap-2 cursor-pointer transition-all select-none shrink-0"
              style={{
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '9999px',
                padding: '6px 14px',
                height: '38px',
                width: 'auto',
                minWidth: 'fit-content',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                flexShrink: 0,
              }}
              aria-haspopup="listbox"
              aria-expanded={isOrderTypeOpen}
              title="Filter by Order Type"
            >
              {(() => {
                const ActiveIcon = ORDER_TYPE_CONFIG[typeFilter]?.icon || Layers;
                const iconColor = typeFilter === 'All Types' ? '#f8fafc' : ORDER_TYPE_CONFIG[typeFilter]?.iconColor;
                return <ActiveIcon className="w-4 h-4 shrink-0" style={{ stroke: iconColor, color: iconColor }} />;
              })()}
              <span className="whitespace-nowrap font-bold text-[#f8fafc]">
                {typeFilter}
              </span>
              <span 
                className="kot-order-type-badge shrink-0 inline-flex items-center justify-center"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '24px',
                  width: 'auto',
                  height: '20px',
                  padding: '0 6px',
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  fontSize: '11px',
                  fontWeight: 700,
                  lineHeight: 1,
                  borderRadius: '9999px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  flexShrink: 0,
                  boxSizing: 'border-box',
                }}
              >
                {typeCounts[typeFilter] ?? 0}
              </span>
              <ChevronDown 
                className={`w-4 h-4 text-[#f8fafc] transition-transform duration-200 shrink-0 ${isOrderTypeOpen ? 'rotate-180' : ''}`} 
                style={{ stroke: '#f8fafc', color: '#f8fafc' }}
              />
            </button>

            {/* Floating Menu (Open State) */}
            {isOrderTypeOpen && (
              <div
                className="kot-order-type-menu absolute right-0"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  minWidth: '240px',
                  zIndex: 9999,
                  background: 'rgba(11, 17, 32, 0.95)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '16px',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.7), 0 0 1px rgba(255, 255, 255, 0.2)',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
                role="listbox"
              >
                {KDS_ORDER_TYPE_OPTIONS.map(opt => {
                  const count = typeCounts[opt.key] ?? 0;
                  const isSelected = typeFilter === opt.key;
                  const itemCfg = ORDER_TYPE_CONFIG[opt.key];
                  const Icon = itemCfg.icon;

                  // Active & normal styling per option
                  const activeBg = opt.key === 'All Types' 
                    ? 'rgba(255, 255, 255, 0.08)' 
                    : itemCfg.hoverStyle.backgroundColor;
                  const activeBorder = opt.key === 'All Types'
                    ? '1px solid rgba(255, 255, 255, 0.2)'
                    : `1px solid ${itemCfg.iconColor}55`;
                  const activeBorderLeft = opt.key === 'All Types'
                    ? '4px solid #cbd5e1'
                    : itemCfg.hoverStyle.borderLeft;

                  return (
                    <button
                      key={opt.key}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        setTypeFilter(opt.key);
                        setIsOrderTypeOpen(false);
                      }}
                      className={`kot-order-type-item w-full flex items-center justify-between text-left cursor-pointer ${
                        opt.key === 'All Types' ? 'kot-order-type-item-all' : ''
                      } ${
                        isSelected ? (opt.key === 'All Types' ? 'kot-order-type-item-active kot-order-type-item-all-active' : 'kot-order-type-item-active') : ''
                      }`}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 700,
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        border: isSelected ? activeBorder : '1px solid transparent',
                        borderLeft: isSelected ? activeBorderLeft : '4px solid transparent',
                        backgroundColor: isSelected ? activeBg : 'transparent',
                        color: '#ffffff',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = opt.key === 'All Types' ? 'rgba(30, 41, 59, 0.6)' : itemCfg.hoverStyle.backgroundColor;
                          e.currentTarget.style.borderLeft = itemCfg.hoverStyle.borderLeft;
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.borderLeft = '4px solid transparent';
                        }
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon 
                          className="w-4 h-4 shrink-0 transition-colors" 
                          style={{ 
                            color: opt.key === 'All Types' ? (isSelected ? '#ffffff' : '#cbd5e1') : itemCfg.iconColor,
                            stroke: opt.key === 'All Types' ? (isSelected ? '#ffffff' : '#cbd5e1') : itemCfg.iconColor 
                          }} 
                        />
                        <span className="truncate">{opt.label}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full font-bold ml-2 shrink-0 shadow-xs ${
                          opt.key === 'All Types' ? 'kot-order-type-badge-all' : ''
                        }`}
                        style={
                          opt.key === 'All Types'
                            ? {
                                backgroundColor: '#1e293b',
                                color: '#f8fafc',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                fontSize: '11px',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                              }
                            : itemCfg.badgeStyle
                        }
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Reset Button if filters or search active */}
          {(statusFilter !== 'All' || typeFilter !== 'All Types' || searchQuery.trim() !== '') && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('All');
                setTypeFilter('All Types');
                setSearchQuery('');
              }}
              className="kot-btn-reset flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
              style={{
                backgroundColor: '#0f172a',
                color: '#cbd5e1',
                border: '1px solid #334155'
              }}
              title="Reset all filters and search"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>Reset</span>
            </button>
          )}

          {/* Far Right Section: View Toggle Controls (Columns / All Grid) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('columns')}
              className={`kot-btn-columns px-3 py-1.5 text-xs flex items-center gap-1.5 rounded-lg transition-colors cursor-pointer font-bold ${
                viewMode === 'columns' ? 'kot-btn-columns-active' : ''
              }`}
              style={
                viewMode === 'columns'
                  ? {
                      backgroundColor: '#1e3a8a',
                      color: '#ffffff',
                      border: '1px solid rgba(59, 130, 246, 0.5)'
                    }
                  : {
                      backgroundColor: '#0f172a',
                      color: '#cbd5e1',
                      border: '1px solid #334155'
                    }
              }
              title="3-Column Workflow (New Orders | Preparing | Ready to Serve)"
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Columns</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`kot-btn-grid px-3 py-1.5 text-xs flex items-center gap-1.5 rounded-lg transition-colors cursor-pointer font-bold ${
                viewMode === 'grid' ? 'kot-btn-grid-active' : ''
              }`}
              style={
                viewMode === 'grid'
                  ? {
                      backgroundColor: '#1e3a8a',
                      color: '#ffffff',
                      border: '1px solid rgba(59, 130, 246, 0.5)'
                    }
                  : {
                      backgroundColor: '#0f172a',
                      color: '#cbd5e1',
                      border: '1px solid #334155'
                    }
              }
              title="Unified Auto-Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>All Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. KOT VIEWPORT: 3-Column Workflow Board OR Full-Width Grid */}
      {statusFilter === 'All' && viewMode === 'columns' ? (
        <div 
          className="kot-scroll-view flex-1 min-h-0 w-full px-4 pt-3 pb-1 flex flex-col overflow-hidden relative z-2 bg-transparent"
          style={{ position: 'relative', zIndex: 2, backgroundColor: 'transparent', height: 'calc(100vh - 120px)', boxSizing: 'border-box' }}
        >
          <div 
            className="kot-columns-grid-wrapper grid grid-cols-1 md:grid-cols-3 gap-4 w-full relative z-2"
            style={{ 
              position: 'relative', 
              zIndex: 2,
              height: 'calc(100vh - 120px)',
              paddingBottom: '12px',
              boxSizing: 'border-box',
              alignItems: 'stretch'
            }}
          >
            {/* 1. NEW ORDERS COLUMN */}
            <div 
              className="kot-column-box flex flex-col min-w-0 p-3 rounded-2xl border"
              style={{ 
                backgroundColor: '#0b1120', 
                borderColor: 'rgba(244, 63, 94, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                height: '100%',
                boxSizing: 'border-box'
              }}
            >
              <div 
                onClick={() => setStatusFilter('New')}
                className="kot-col-header kot-col-header-new shrink-0 mb-3 cursor-pointer transition-all sticky top-0 z-20"
                style={{
                  background: 'rgba(159, 18, 57, 0.25)',
                  backgroundColor: 'rgba(159, 18, 57, 0.25)',
                  border: '1px solid rgba(244, 63, 94, 0.45)',
                  borderRadius: '12px',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 14px',
                  flexShrink: 0,
                  marginBottom: '12px',
                  position: 'sticky',
                  top: 0,
                  zIndex: 20,
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)'
                }}
                title="Click to filter to New Orders only"
              >
                <div className="flex items-center gap-2">
                  <span className="kot-col-dot w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-sm shadow-rose-500" />
                  <span 
                    className="kot-col-title text-xs uppercase tracking-wider font-extrabold"
                    style={{ color: '#fda4af', fontWeight: 800 }}
                  >
                    1. NEW ORDERS
                  </span>
                </div>
                <span 
                  className="kot-col-badge kot-col-badge-new px-2.5 py-0.5 rounded-full text-xs font-black shadow-sm"
                  style={{ backgroundColor: '#e11d48', color: '#ffffff' }}
                >
                  {newKots.length}
                </span>
              </div>
              <div 
                className="kot-col-cards-body"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  overflowY: 'auto',
                  flex: '1 1 auto',
                  minHeight: 0,
                  paddingRight: '6px',
                  scrollbarWidth: 'thin'
                }}
              >
                {newKots.length === 0 ? (
                  <div 
                    className="h-48 sm:h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs rounded-xl border border-dashed shrink-0"
                    style={{ backgroundColor: '#0d1527', borderColor: '#1e293b' }}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 mb-2">
                      <Check className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-slate-300">No new orders waiting</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Incoming KOTs will show here</span>
                  </div>
                ) : (
                  newKots.map(kot => (
                    <KdsCard
                      key={kot.id}
                      kot={kot}
                      currentTime={currentTime}
                      onUpdateStatus={updateKOTStatus}
                      mode="cashier"
                    />
                  ))
                )}
              </div>
            </div>

            {/* 2. PREPARING COLUMN */}
            <div 
              className="kot-column-box flex flex-col min-w-0 p-3 rounded-2xl border"
              style={{ 
                backgroundColor: '#0b1120', 
                borderColor: 'rgba(245, 158, 11, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                height: '100%',
                boxSizing: 'border-box'
              }}
            >
              <div 
                onClick={() => setStatusFilter('Preparing')}
                className="kot-col-header kot-col-header-prep shrink-0 mb-3 cursor-pointer transition-all sticky top-0 z-20"
                style={{
                  background: 'rgba(180, 83, 9, 0.25)',
                  backgroundColor: 'rgba(180, 83, 9, 0.25)',
                  border: '1px solid rgba(245, 158, 11, 0.45)',
                  borderRadius: '12px',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 14px',
                  flexShrink: 0,
                  marginBottom: '12px',
                  position: 'sticky',
                  top: 0,
                  zIndex: 20,
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)'
                }}
                title="Click to filter to Preparing orders only"
              >
                <div className="flex items-center gap-2">
                  <span className="kot-col-dot w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400 animate-pulse" />
                  <span 
                    className="kot-col-title text-xs uppercase tracking-wider font-extrabold"
                    style={{ color: '#fde68a', fontWeight: 800 }}
                  >
                    2. PREPARING
                  </span>
                </div>
                <span 
                  className="kot-col-badge kot-col-badge-prep px-2.5 py-0.5 rounded-full text-xs font-black shadow-sm"
                  style={{ backgroundColor: '#d97706', color: '#000000' }}
                >
                  {preparingKots.length}
                </span>
              </div>
              <div 
                className="kot-col-cards-body"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  overflowY: 'auto',
                  flex: '1 1 auto',
                  minHeight: 0,
                  paddingRight: '6px',
                  scrollbarWidth: 'thin'
                }}
              >
                {preparingKots.length === 0 ? (
                  <div 
                    className="h-48 sm:h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs rounded-xl border border-dashed shrink-0"
                    style={{ backgroundColor: '#0d1527', borderColor: '#1e293b' }}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 mb-2">
                      <Flame className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-slate-300">No orders in preparation</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Orders in prep will show here</span>
                  </div>
                ) : (
                  preparingKots.map(kot => (
                    <KdsCard
                      key={kot.id}
                      kot={kot}
                      currentTime={currentTime}
                      onUpdateStatus={updateKOTStatus}
                      mode="cashier"
                    />
                  ))
                )}
              </div>
            </div>

            {/* 3. READY TO SERVE / DISPATCH COLUMN */}
            <div 
              className="kot-column-box flex flex-col min-w-0 p-3 rounded-2xl border"
              style={{ 
                backgroundColor: '#0b1120', 
                borderColor: 'rgba(16, 185, 129, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                height: '100%',
                boxSizing: 'border-box'
              }}
            >
              <div 
                onClick={() => setStatusFilter('Ready')}
                className="kot-col-header kot-col-header-ready shrink-0 mb-3 cursor-pointer transition-all sticky top-0 z-20"
                style={{
                  background: 'rgba(6, 95, 70, 0.25)',
                  backgroundColor: 'rgba(6, 95, 70, 0.25)',
                  border: '1px solid rgba(16, 185, 129, 0.45)',
                  borderRadius: '12px',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 14px',
                  flexShrink: 0,
                  marginBottom: '12px',
                  position: 'sticky',
                  top: 0,
                  zIndex: 20,
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)'
                }}
                title="Click to filter to Ready orders only"
              >
                <div className="flex items-center gap-2">
                  <span className="kot-col-dot w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                  <span 
                    className="kot-col-title text-xs uppercase tracking-wider font-extrabold"
                    style={{ color: '#6ee7b7', fontWeight: 800 }}
                  >
                    3. READY / DISPATCH
                  </span>
                </div>
                <span 
                  className="kot-col-badge kot-col-badge-ready px-2.5 py-0.5 rounded-full text-xs font-black shadow-sm"
                  style={{ backgroundColor: '#059669', color: '#ffffff' }}
                >
                  {readyKots.length}
                </span>
              </div>
              <div 
                className="kot-col-cards-body"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  overflowY: 'auto',
                  flex: '1 1 auto',
                  minHeight: 0,
                  paddingRight: '6px',
                  scrollbarWidth: 'thin'
                }}
              >
                {readyKots.length === 0 ? (
                  <div 
                    className="h-48 sm:h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs rounded-xl border border-dashed shrink-0"
                    style={{ backgroundColor: '#0d1527', borderColor: '#1e293b' }}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 mb-2">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-slate-300">No orders ready to serve</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Ready orders will show here</span>
                  </div>
                ) : (
                  readyKots.map(kot => (
                    <KdsCard
                      key={kot.id}
                      kot={kot}
                      currentTime={currentTime}
                      onUpdateStatus={updateKOTStatus}
                      mode="cashier"
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Full-Width Grid View - When in All Grid mode or filtering by a specific status */
        <div 
          className="kot-scroll-view flex-1 overflow-y-auto min-h-0 w-full px-4 py-3 relative z-2 bg-transparent"
          style={{ position: 'relative', zIndex: 2, backgroundColor: 'transparent' }}
        >
          <div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full relative z-2"
            style={{ position: 'relative', zIndex: 2 }}
          >
            {displayedKots.map(kot => (
              <KdsCard
                key={kot.id}
                kot={kot}
                currentTime={currentTime}
                onUpdateStatus={updateKOTStatus}
                mode="cashier"
              />
            ))}
          </div>

          {/* Empty State */}
          {displayedKots.length === 0 && (
            <div className="p-12 text-center text-xs rounded-2xl border border-slate-800/80 text-gray-400 bg-slate-900/60 shadow-lg flex flex-col items-center justify-center max-w-lg mx-auto mt-8">
              <UtensilsCrossed className="w-10 h-10 text-slate-600 mb-3" />
              <h3 className="text-base font-bold text-slate-200 mb-1">No Matching KOT Tickets</h3>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                There are currently no tickets matching {searchQuery ? `"${searchQuery}"` : ''} {typeFilter !== 'All Types' ? `"${typeFilter}"` : ''} {statusFilter !== 'All' ? `"${statusFilter}" status` : ''}.
              </p>
              {(statusFilter !== 'All' || typeFilter !== 'All Types' || searchQuery.trim() !== '') && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('All');
                    setTypeFilter('All Types');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#1e3a8a] hover:bg-[#162e56] text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Clear Filters & Search
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KOTPage;

