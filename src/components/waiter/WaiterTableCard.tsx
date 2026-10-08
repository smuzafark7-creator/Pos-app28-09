import React from 'react';
import { RestaurantTable, TableStatus, KOT } from '../../types';
import { Users, Clock, Receipt, UtensilsCrossed, CheckCircle2 } from 'lucide-react';

export interface WaiterTableCardProps {
  table: RestaurantTable;
  runningAmount: number;
  unbilledKots: KOT[];
  isMyTable: boolean;
  onSelect: (tableName: string) => void;
  onRequestBill: (tableName: string) => void;
  isBillPending: boolean;
}

export const WaiterTableCard: React.FC<WaiterTableCardProps> = ({
  table,
  runningAmount,
  unbilledKots,
  isMyTable,
  onSelect,
  onRequestBill,
  isBillPending,
}) => {
  const getStatusBadge = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return <span className="bg-emerald-950/70 text-emerald-400 border border-emerald-600/50 font-bold text-xs rounded-full px-2.5 py-0.5">AVAILABLE</span>;
      case 'occupied':
      case 'ready':
      case 'waiting':
        return <span className="bg-amber-950/70 text-amber-400 border border-amber-600/50 font-bold text-xs rounded-full px-2.5 py-0.5">OCCUPIED</span>;
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
        return <span className="bg-slate-800 text-slate-400 border border-slate-700 font-bold text-xs rounded-full px-2.5 py-0.5">CLEANING</span>;
      default:
        return <span className="bg-slate-800 text-slate-400 border border-slate-700 font-bold text-xs rounded-full px-2.5 py-0.5">{status}</span>;
    }
  };

  return (
    <div
      onClick={() => onSelect(table.name)}
      style={{
        backgroundColor: '#0d1527',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
      }}
      className="table-card p-3.5 rounded-2xl border transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:border-blue-500/40 hover:shadow-2xl cursor-pointer flex flex-col justify-between min-h-[185px] relative group select-none"
    >
      {/* Top Row: Table badge + Waiter assigned tag & Status */}
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
              T{table.number}
            </div>
            {table.assignedWaiterName && (
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
                title={`Assigned Waiter: ${table.assignedWaiterName}`}
              >
                {isMyTable ? '● Mine' : table.assignedWaiterName}
              </span>
            )}
          </div>
          {getStatusBadge(table.status)}
        </div>

        {/* Table Name & Capacity */}
        <div className="flex items-baseline justify-between">
          <span 
            className="table-name"
            style={{ color: '#ffffff', fontWeight: 800, fontSize: '16px' }}
          >
            {table.name}
          </span>
          <span className="table-seats-count text-xs flex items-center gap-1" style={{ color: '#cbd5e1', fontWeight: 600 }}>
            <Users className="w-3.5 h-3.5" style={{ color: '#cbd5e1' }} />
            {table.capacity} Seats
          </span>
        </div>

        {/* Running Amount & KOT Count */}
        <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-[10px] uppercase font-semibold text-slate-400">Running Total</span>
          <span className="table-running-total font-extrabold text-emerald-400" style={{ color: '#34d399', fontWeight: 800 }}>
            Running: ₹{runningAmount.toFixed(2)}
          </span>
        </div>

        {unbilledKots.length > 0 && (
          <div className="table-time-kot flex items-center justify-between text-[11px] mt-1" style={{ color: '#cbd5e1' }}>
            <span 
              className="px-1.5 py-0.2 rounded text-[9px] font-bold"
              style={{
                backgroundColor: 'rgba(69, 26, 3, 0.8)',
                color: '#fcd34d',
                border: '1px solid rgba(217, 119, 6, 0.5)',
              }}
            >
              {unbilledKots.length} KOT{unbilledKots.length > 1 ? 's' : ''}
            </span>
            <span className="truncate max-w-[110px] font-semibold text-[10px]" style={{ color: '#cbd5e1' }}>
              {(unbilledKots[unbilledKots.length - 1]?.items || []).map(i => i?.name || (i as any)?.menuItem?.name || 'Item').slice(0, 2).join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Action Area */}
      <div className="mt-3 pt-2 border-t border-slate-800 flex items-center gap-1.5">
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onSelect(table.name);
          }}
          style={{
            backgroundColor: '#7a0c1a',
            color: '#ffffff',
            border: '1px solid #8f1020',
            fontWeight: 700,
          }}
          className="btn-table-pos flex-1 py-2 rounded-lg text-xs font-bold text-center transition-all bg-[#7a0c1a] hover:bg-[#8f1020] active:bg-[#4a030c] text-white border border-[#8f1020] cursor-pointer shadow-xs"
        >
          {table.status === 'available' ? '+ Open POS' : 'POS'}
        </button>

        {table.status === 'occupied' && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onRequestBill(table.name);
            }}
            style={!isBillPending ? { backgroundColor: '#1e3a8a', color: '#ffffff', fontWeight: 700 } : undefined}
            className={`px-2.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isBillPending
                ? 'bg-purple-950/80 text-purple-300 border border-purple-800 cursor-not-allowed'
                : 'bg-[#1e3a8a] hover:bg-[#2563eb] text-white shadow-2xs'
            }`}
            title="Request final bill from cashier"
          >
            {isBillPending ? 'Req\'d' : 'Bill'}
          </button>
        )}
      </div>
    </div>
  );
};
