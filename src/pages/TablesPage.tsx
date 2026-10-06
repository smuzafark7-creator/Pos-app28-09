import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { RestaurantTable, TableStatus } from '../types';
import { 
  Users, 
  Clock, 
  Receipt, 
  CheckCircle2, 
  Plus, 
  Utensils, 
  Sparkles, 
  CreditCard,
  ChefHat,
  Eye,
  Layers,
  Bell,
  Search,
  X
} from 'lucide-react';
import { BillModal } from '../components/BillModal';
import { TableKOTPreviewModal } from '../components/TableKOTPreviewModal';
import { BrandWatermark } from '../components/BrandWatermark';

export const TablesPage: React.FC = () => {
  const { 
    filteredTables, 
    selectTableForPOS, 
    updateTableStatus, 
    kots,
    setActiveTab,
    setCartTableNumber,
    setCartOrderType,
    currentUser,
    requestBill,
    billRequests,
    pendingBillRequests,
    tableSearchTerm,
    setTableSearchTerm,
    tableFloorFilter: floorFilter,
    setTableFloorFilter: setFloorFilter,
    savedActiveOrders,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [assignedFilter, setAssignedFilter] = useState<'all' | 'mine'>('all');
  const [billingTable, setBillingTable] = useState<string | null>(null);
  const [viewingTableKots, setViewingTableKots] = useState<RestaurantTable | null>(null);

  const isWaiter = currentUser?.role === 'waiter';
  const isOwner = currentUser?.role === 'owner';

  const myAssignedTablesCount = useMemo(() => {
    return filteredTables.filter(
      t => t.assignedWaiterName === currentUser?.name || t.assignedWaiterId === currentUser?.id
    ).length;
  }, [filteredTables, currentUser]);

  const getTableFloor = (tableNumber: number): string => {
    if (tableNumber <= 4) return 'Ground Floor';
    if (tableNumber <= 8) return 'First Floor';
    return 'Outdoor / Terrace';
  };

  const displayedTables = useMemo(() => {
    return filteredTables.filter(tbl => {
      const matchStatus = statusFilter === 'All' || tbl.status === statusFilter.toLowerCase();
      const floor = getTableFloor(tbl.number);
      const matchFloor = floorFilter === 'All' || floor === floorFilter;
      const matchAssigned = assignedFilter === 'all' || 
        (tbl.assignedWaiterName === currentUser?.name || tbl.assignedWaiterId === currentUser?.id);
      
      let matchSearch = true;
      if (tableSearchTerm && tableSearchTerm.trim()) {
        const term = tableSearchTerm.trim().toLowerCase();
        const numOnly = term.replace(/^t\s*/, '');
        const numStr = String(tbl.number);
        const nameStr = tbl.name.toLowerCase();
        matchSearch = numStr === numOnly || 
                      nameStr.includes(term) || 
                      `t${tbl.number}`.includes(term) ||
                      nameStr.includes(numOnly);
      }

      return matchStatus && matchFloor && matchAssigned && matchSearch;
    });
  }, [filteredTables, statusFilter, floorFilter, assignedFilter, currentUser, tableSearchTerm]);

  const getStatusBadge = (status: TableStatus, hasDraft = false) => {
    if (hasDraft && (status === 'available' || status === 'waiting')) {
      return (
        <span 
          className="table-badge-draft inline-flex items-center gap-1 font-bold text-xs"
          style={{ 
            backgroundColor: 'rgba(120, 53, 15, 0.5)', 
            border: '1px solid #f59e0b', 
            color: '#fbbf24', 
            fontWeight: 800, 
            fontSize: '11px', 
            letterSpacing: '0.5px',
            padding: '2px 10px',
            borderRadius: '9999px',
          }}
          title="Un-sent draft items pending on this table"
        >
          <span>💾</span> DRAFT / ORDERING
        </span>
      );
    }

    switch (status) {
      case 'available':
        return (
          <span 
            className="table-badge-available bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 font-bold text-xs px-2.5 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(6, 78, 59, 0.8)', color: '#6ee7b7', border: '1px solid rgba(5, 150, 105, 0.5)' }}
          >
            AVAILABLE
          </span>
        );
      case 'occupied':
        return (
          <span 
            className="table-badge-occupied bg-amber-950/80 text-amber-300 border border-amber-600/50 font-bold text-xs px-2.5 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(69, 26, 3, 0.8)', color: '#fcd34d', border: '1px solid rgba(217, 119, 6, 0.5)' }}
          >
            OCCUPIED
          </span>
        );
      case 'ready':
        return (
          <span 
            className="table-badge-available bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 font-bold text-xs px-2.5 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(6, 78, 59, 0.8)', color: '#6ee7b7', border: '1px solid rgba(5, 150, 105, 0.5)' }}
          >
            FOOD READY
          </span>
        );
      case 'waiting':
        return (
          <span 
            className="table-badge-cleaning bg-sky-950/80 text-sky-300 border border-sky-600/50 font-bold text-xs px-2.5 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(8, 47, 73, 0.8)', color: '#7dd3fc', border: '1px solid rgba(2, 132, 199, 0.5)' }}
          >
            WAITING
          </span>
        );
      case 'billing':
        return (
          <span 
            className="table-badge-billing inline-flex items-center font-bold text-xs"
            style={{ 
              backgroundColor: 'rgba(30, 58, 138, 0.4)', 
              border: '1px solid #3b82f6', 
              color: '#93c5fd', 
              fontWeight: 800, 
              fontSize: '11px', 
              letterSpacing: '0.5px',
              padding: '2px 10px',
              borderRadius: '9999px',
            }}
          >
            BILL REQUESTED
          </span>
        );
      case 'cleaning':
        return (
          <span 
            className="table-badge-cleaning bg-sky-950/80 text-sky-300 border border-sky-600/50 font-bold text-xs px-2.5 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(8, 47, 73, 0.8)', color: '#7dd3fc', border: '1px solid rgba(2, 132, 199, 0.5)' }}
          >
            CLEANING
          </span>
        );
    }
  };

  const handleOpenBillModal = (tableNum: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCartTableNumber(tableNum);
    setCartOrderType('dine_in');
    setBillingTable(tableNum);
  };

  const handleViewKot = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveTab('kot');
  };

  return (
    <div 
      className="tables-main-wrapper relative z-2 min-h-full w-full p-3 sm:p-4 bg-transparent select-none text-slate-200 font-sans overflow-x-hidden"
      style={{ backgroundColor: 'transparent', position: 'relative', zIndex: 2 }}
    >
      {/* Subtle Low-Opacity Background Watermark */}
      <BrandWatermark opacity={0.18} />

      {/* Unified Top Status & Floor Navigation Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 px-3 sm:px-4 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl mb-4 text-slate-200">
        {/* Left Side: Floor Areas (No Left Icon) */}
        <div className="flex items-center overflow-x-auto scrollbar-none py-0.5">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {['All', 'Ground Floor', 'First Floor', 'Outdoor / Terrace'].map(fl => {
              const count = fl === 'All' 
                ? filteredTables.length 
                : filteredTables.filter(t => getTableFloor(t.number) === fl).length;
              const isSelected = floorFilter === fl;
              return (
                <button
                  key={fl}
                  type="button"
                  onClick={() => setFloorFilter(fl)}
                  style={isSelected ? {
                    backgroundColor: '#1e3a8a',
                    border: '1px solid #3b82f6',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '12px'
                  } : {
                    backgroundColor: '#F7EECA',
                    color: '#0f172a',
                    border: '1.5px solid #d4c5a0',
                    fontWeight: 800,
                    fontSize: '12px'
                  }}
                  className={`floor-area-pill px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? 'floor-pill-active bg-[#1e3a8a] text-white border border-[#3b82f6] shadow-xs'
                      : 'floor-pill-inactive bg-[#F7EECA] text-[#0f172a] border border-[#d4c5a0] hover:bg-[#efe5c0] hover:border-[#c4b38a]'
                  }`}
                >
                  <span style={isSelected ? { color: '#ffffff', fontWeight: 700, fontSize: '12px' } : { color: '#0f172a', fontWeight: 800, fontSize: '12px' }}>{fl}</span>
                  {isSelected ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-blue-900/80 text-white">
                      {count}
                    </span>
                  ) : (
                    <span 
                      className="floor-inactive-badge text-[11px] font-extrabold shadow-2xs"
                      style={{
                        backgroundColor: '#1e293b',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        border: '1px solid rgba(255, 255, 255, 0.15)'
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Waiter specific assigned tables filter */}
          {isWaiter && (
            <div className="flex items-center gap-1 shrink-0 ml-1 border-l border-slate-700/80 pl-2">
              <button
                type="button"
                onClick={() => setAssignedFilter(prev => prev === 'mine' ? 'all' : 'mine')}
                style={assignedFilter === 'mine' ? {
                  backgroundColor: '#1e3a8a',
                  border: '1px solid #3b82f6',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '12px'
                } : {
                  backgroundColor: '#F7EECA',
                  color: '#0f172a',
                  border: '1.5px solid #d4c5a0',
                  fontWeight: 800,
                  fontSize: '12px'
                }}
                className={`floor-area-pill px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  assignedFilter === 'mine'
                    ? 'floor-pill-active bg-[#1e3a8a] text-white border border-[#3b82f6] shadow-xs'
                    : 'floor-pill-inactive bg-[#F7EECA] text-[#0f172a] border border-[#d4c5a0] hover:bg-[#efe5c0] hover:border-[#c4b38a]'
                }`}
              >
                <span style={assignedFilter === 'mine' ? { color: '#ffffff', fontWeight: 700, fontSize: '12px' } : { color: '#0f172a', fontWeight: 800, fontSize: '12px' }}>My Tables</span>
                {assignedFilter === 'mine' ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-blue-900/80 text-white">
                    {myAssignedTablesCount}
                  </span>
                ) : (
                  <span 
                    className="floor-inactive-badge text-[11px] font-extrabold shadow-2xs"
                    style={{
                      backgroundColor: '#1e293b',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      border: '1px solid rgba(255, 255, 255, 0.15)'
                    }}
                  >
                    {myAssignedTablesCount}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Center: Relocated "Search Table No." Input (Directly between My Tables and All) */}
        <div 
          className="floor-toolbar-search-container relative flex items-center shrink-0 my-1 lg:my-0"
          style={{ width: '210px' }}
        >
          <Search 
            className="w-3.5 h-3.5 pointer-events-none" 
            style={{ 
              color: '#94a3b8',
              position: 'absolute',
              left: '11px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 2,
            }}
          />
          <input
            id="toolbar-table-search-input"
            type="text"
            value={tableSearchTerm}
            onChange={(e) => setTableSearchTerm(e.target.value)}
            placeholder="Search Table No. (e.g. T1, T5)..."
            style={{
              height: '32px',
              width: '210px',
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '9999px',
              padding: '0 28px 0 32px',
              fontSize: '12px',
              color: '#ffffff',
              outline: 'none',
            }}
            className="floor-toolbar-search-input text-xs placeholder:text-slate-400 focus:border-white/30 transition-all font-sans"
          />
          {tableSearchTerm && (
            <button
              type="button"
              onClick={() => setTableSearchTerm('')}
              className="cursor-pointer text-slate-400 hover:text-white transition-colors"
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Side: Status Filter Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-0.5 sm:pb-0 text-xs shrink-0">
          {['All', 'Available', 'Occupied', 'Ready', 'Billing'].map(status => {
            const count = status === 'All' 
              ? filteredTables.length 
              : filteredTables.filter(t => t.status === status.toLowerCase()).length;
            const isSelected = statusFilter === status;
            
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                style={isSelected ? {
                  backgroundColor: '#7a0c1a',
                  border: '1px solid #8f1020',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '12px'
                } : {
                  backgroundColor: '#F7EECA',
                  color: '#0f172a',
                  border: '1.5px solid #d4c5a0',
                  fontWeight: 800,
                  fontSize: '12px'
                }}
                className={`status-filter-pill px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'status-pill-active bg-[#7a0c1a] text-white border border-[#8f1020] shadow-xs'
                    : 'status-pill-inactive bg-[#F7EECA] hover:bg-[#efe5c0] hover:border-[#c4b38a] text-[#0f172a] border border-[#d4c5a0]'
                }`}
              >
                <span style={isSelected ? { color: '#ffffff', fontWeight: 700, fontSize: '12px' } : { color: '#0f172a', fontWeight: 800, fontSize: '12px' }}>{status}</span>
                {isSelected ? (
                  <span className="font-bold text-white text-xs">({count})</span>
                ) : (
                  <span 
                    className="status-inactive-badge text-[11px] font-extrabold shadow-2xs"
                    style={{
                      backgroundColor: '#1e293b',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      border: '1px solid rgba(255, 255, 255, 0.15)'
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tables Grid (Spanning 100% Available Viewport Width) */}
      <div 
        className="tables-scroll-view relative z-2 bg-transparent grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 sm:gap-3 w-full"
        style={{ backgroundColor: 'transparent', position: 'relative', zIndex: 2 }}
      >
        {displayedTables.map(tbl => {
          // Find all unbilled KOTs for this table
          const tableKots = kots.filter(
            k => k.branchId === tbl.branchId &&
                 k.orderType === 'dine_in' &&
                 k.tableNumber?.toLowerCase() === tbl.name.toLowerCase() &&
                 !k.isBilled &&
                 k.status !== 'cancelled'
          );
          const tableKot = tableKots[0] || null;
          const tableRunningAmount = tableKots.length > 0
            ? tableKots.reduce((sum, k) => sum + k.totalAmount, 0)
            : (tbl.currentAmount || 0);

          // Check if this table has an active un-sent draft held
          const norm = tbl.name.toLowerCase().trim();
          const digits = String(tbl.number);
          const orderKey = `dine_in:${norm}`;
          const altKey = `dine_in:table ${digits}`;
          const shortKey = `dine_in:t${digits}`;
          const tableDraftOrder = savedActiveOrders[orderKey] || savedActiveOrders[altKey] || savedActiveOrders[shortKey];
          const hasDraft = (tableDraftOrder?.cart?.length || 0) > 0;
          const draftAmount = hasDraft ? (tableDraftOrder?.subtotal || tableDraftOrder?.cart?.reduce((s, c) => s + c.item.price * c.quantity, 0) || 0) : 0;

          const isOccupiedOrBilling = tbl.status === 'occupied' || tbl.status === 'billing' || tbl.status === 'waiting' || tbl.status === 'ready' || hasDraft;

          const handleCardClick = () => {
            if (isOwner) {
              if (isOccupiedOrBilling || tableKots.length > 0 || tableRunningAmount > 0) {
                setViewingTableKots(tbl);
              }
            } else {
              selectTableForPOS(tbl.name);
            }
          };

          return (
            <div
              key={tbl.id}
              onClick={handleCardClick}
              style={{
                backgroundColor: '#0d1527',
                border: hasDraft ? '1px solid rgba(245, 158, 11, 0.75)' : '1px solid #EADBBA',
                boxShadow: hasDraft ? '0 10px 25px -5px rgba(245, 158, 11, 0.15)' : '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
              }}
              className={`table-card p-3.5 rounded-2xl border transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:shadow-2xl ${
                isOwner && tbl.status === 'available' && !hasDraft ? 'cursor-default' : 'cursor-pointer'
              } flex flex-col justify-between min-h-[185px] relative group select-none`}
            >
              {/* Top Row: Table Number & Status */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div 
                      className="table-tag-t bg-slate-800 text-amber-300 border border-slate-700 font-bold px-2 py-0.5 rounded-md text-xs shrink-0 flex items-center justify-center"
                      style={{
                        backgroundColor: '#1e293b',
                        color: '#fcd34d',
                        border: '1px solid #334155',
                        fontWeight: 700,
                      }}
                    >
                      T{tbl.number}
                    </div>
                    {tbl.assignedWaiterName && (
                      <span 
                        className="table-staff-pill truncate max-w-[95px]" 
                        style={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #475569',
                          color: '#e2e8f0',
                          fontWeight: 600,
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                        }}
                        title={`Assigned Waiter: ${tbl.assignedWaiterName}`}
                      >
                        {tbl.assignedWaiterName === currentUser?.name || tbl.assignedWaiterId === currentUser?.id ? '★ You' : tbl.assignedWaiterName}
                      </span>
                    )}
                  </div>
                  {getStatusBadge(tbl.status, hasDraft)}
                </div>

                <div className="flex items-baseline justify-between">
                  <span 
                    className="table-name"
                    style={{ color: '#ffffff', fontWeight: 800, fontSize: '16px' }}
                  >
                    {tbl.name}
                  </span>
                  <span 
                    className="table-floor-label text-xs" 
                    style={{ color: '#94a3b8', fontWeight: 500 }}
                  >
                    {getTableFloor(tbl.number)}
                  </span>
                </div>

                <div 
                  className="table-seats-count flex items-center gap-1.5 text-xs mt-1"
                  style={{ color: '#cbd5e1', fontWeight: 600 }}
                >
                  <Users className="w-3.5 h-3.5" style={{ color: '#cbd5e1' }} />
                  <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{tbl.capacity} Seats</span>
                  {tbl.guestCount && <span style={{ color: '#94a3b8', fontWeight: 500 }}>• {tbl.guestCount} Guests</span>}
                </div>

                {/* Seated Info & Prominent Running Total */}
                {isOccupiedOrBilling && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800 text-xs space-y-1.5">
                    {tbl.seatedAt && (
                      <div className="table-time-kot flex items-center gap-1 text-[11px]" style={{ color: '#cbd5e1' }}>
                        <Clock className="w-3 h-3" style={{ color: '#94a3b8' }} />
                        <span style={{ color: '#cbd5e1' }}>Seated at {tbl.seatedAt}</span>
                      </div>
                    )}
                    {tableKots.length > 0 && (
                      <div className="table-time-kot flex items-center justify-between text-[11px]" style={{ color: '#cbd5e1' }}>
                        <span className="font-semibold truncate" style={{ color: '#cbd5e1' }}>
                          {tableKots.map(k => k.kotNumber).join(', ')}
                        </span>
                        <span 
                          className="px-1.5 py-0.2 rounded text-[9px] font-bold"
                          style={{
                            backgroundColor: 'rgba(69, 26, 3, 0.8)',
                            color: '#fcd34d',
                            border: '1px solid rgba(217, 119, 6, 0.5)',
                          }}
                        >
                          {tableKots.length} KOT{tableKots.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                    {tableRunningAmount > 0 && (
                      <div className="text-xs sm:text-sm font-extrabold pt-0.5 text-emerald-400 font-mono flex items-center justify-between">
                        <span className="text-[10px] uppercase font-semibold text-slate-400">Running Total</span>
                        <span className="table-running-total text-emerald-400 font-extrabold" style={{ color: '#34d399', fontWeight: 800 }}>Running: ₹{tableRunningAmount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {hasDraft && tableKots.length === 0 && (
                      <div className="table-time-kot flex items-center justify-between text-[11px] pt-1" style={{ color: '#cbd5e1' }}>
                        <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                          <span>💾</span> Draft Items: {tableDraftOrder?.cart?.length}
                        </span>
                        <span className="font-extrabold text-amber-400 font-mono">
                          ₹{draftAmount.toFixed(0)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Quick Action Buttons */}
              {isOwner ? (
                /* Owner Role: Oversight Monitor (No operational buttons for Available/Cleaning, View KOTs for Occupied) */
                isOccupiedOrBilling || tableKots.length > 0 || tableRunningAmount > 0 ? (
                  <div className="mt-3 pt-2 border-t border-slate-800">
                    <button
                      id={`btn-view-kots-${tbl.id}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingTableKots(tbl);
                      }}
                      style={{
                        backgroundColor: '#1e293b',
                        color: '#e2e8f0',
                        border: '1px solid #334155',
                      }}
                      className="btn-table-dark w-full py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer shadow-2xs"
                      title="View active KOT tickets and order details"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>View KOTs</span>
                    </button>
                  </div>
                ) : null
              ) : (
                /* Operational Staff (Cashier, Waiter, Admin): Full Operational Button Controls */
                <div className="mt-3 pt-2 border-t border-slate-800">
                  {tbl.status === 'cleaning' ? (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); updateTableStatus(tbl.id, 'available'); }}
                      style={{
                        backgroundColor: '#059669',
                        border: '1px solid #10b981',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '13px',
                      }}
                      className="btn-mark-available w-full py-2 rounded-lg font-bold shadow-md cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 bg-[#059669] hover:bg-[#10b981]"
                    >
                      <CheckCircle2 className="w-4 h-4 text-white font-bold mr-1.5 shrink-0" style={{ color: '#ffffff' }} />
                      <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '13px' }}>Mark Available</span>
                    </button>
                  ) : tbl.status === 'available' ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => selectTableForPOS(tbl.name)}
                        style={{ color: '#ffffff', fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.2)', backgroundColor: '#7a0c1a' }}
                        className="flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors bg-[#7a0c1a] hover:bg-[#8f1020] active:bg-[#4a030c] !text-white text-white cursor-pointer shadow-xs border border-[#580510]/60"
                      >
                        <Plus className="w-3.5 h-3.5 !text-white shrink-0" style={{ color: '#ffffff' }} />
                        <span style={{ color: '#ffffff', fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>Open POS</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); updateTableStatus(tbl.id, 'cleaning'); }}
                        style={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          color: '#f1f5f9',
                          fontWeight: 600,
                        }}
                        className="btn-table-clean px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors hover:brightness-110"
                        title="Mark table as being cleaned"
                      >
                        Clean
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); selectTableForPOS(tbl.name); }}
                        style={{
                          backgroundColor: '#7a0c1a',
                          color: '#ffffff',
                          fontWeight: 700,
                          opacity: 1,
                          border: '1px solid #8f1020',
                        }}
                        className="flex-1 py-2 rounded-lg text-white font-bold text-xs text-center transition-colors shadow-2xs cursor-pointer bg-[#7a0c1a] hover:bg-[#8f1020] active:bg-[#4a030c] border border-[#8f1020]"
                        title="Add more items in POS"
                      >
                        POS
                      </button>
                      {tableKot && (
                        <button
                          onClick={handleViewKot}
                          style={{
                            backgroundColor: '#1e293b',
                            color: '#e2e8f0',
                            border: '1px solid #334155',
                          }}
                          className="btn-table-dark py-2 px-2.5 rounded-lg font-bold text-xs text-center transition-colors bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                          title="View KOT tickets"
                        >
                          KOT
                        </button>
                      )}
                      {isWaiter ? (
                        tbl.status === 'billing' || billRequests.some(r => r.tableNumber.toLowerCase() === tbl.name.toLowerCase() && r.status === 'pending') ? (
                          <button
                            type="button"
                            id={`btn-table-reqd-${tbl.id}`}
                            style={{
                              backgroundColor: '#1e3a8a',
                              border: '1px solid #3b82f6',
                              color: '#ffffff',
                              fontWeight: 700,
                              fontSize: '11px',
                            }}
                            className="btn-table-reqd flex-1 py-2 rounded-lg text-center font-bold transition-all shadow-2xs hover:bg-blue-700 hover:border-blue-400 cursor-pointer"
                            title="Cashier notified • Bill Requested"
                          >
                            <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '11px' }}>
                              Req'd
                            </span>
                          </button>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); requestBill(tbl.name); }}
                            className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-center transition-colors shadow-2xs text-xs cursor-pointer"
                            title="Request Cashier to generate customer bill"
                          >
                            Req Bill
                          </button>
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleOpenBillModal(tbl.name, e)}
                          style={{
                            backgroundColor: '#1e3a8a',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '12px',
                            opacity: 1,
                            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                          }}
                          className="btn-table-bill flex-1 py-2 rounded-lg font-bold text-xs text-center transition-colors shadow-2xs cursor-pointer bg-[#1e3a8a] hover:bg-[#2563eb]"
                          title={tbl.status === 'billing' ? 'Settle requested bill' : 'Generate and settle bill'}
                        >
                          <span
                            style={{
                              color: '#ffffff',
                              fontWeight: 700,
                              fontSize: '12px',
                              opacity: 1,
                              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                            }}
                          >
                            {tbl.status === 'billing' ? 'Settle' : 'Bill'}
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {displayedTables.length === 0 && (
        <div className="relative z-10 p-12 text-center text-xs rounded-xl border border-slate-800 font-sans text-slate-400 bg-[#0f172a] shadow-2xs">
          No tables found matching filter criteria.
        </div>
      )}

      {/* Direct Bill Modal if launched from Tables screen */}
      {billingTable && (
        <BillModal
          isOpen={!!billingTable}
          onClose={() => setBillingTable(null)}
        />
      )}

      {/* Read-Only Executive KOT Preview Modal for Owner */}
      {viewingTableKots && (
        <TableKOTPreviewModal
          table={viewingTableKots}
          kots={kots}
          onClose={() => setViewingTableKots(null)}
        />
      )}
    </div>
  );
};
