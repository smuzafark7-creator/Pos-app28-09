import React from 'react';
import { 
  X, 
  Clock, 
  Receipt, 
  Users, 
  ChefHat, 
  FileText, 
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { RestaurantTable, KOT } from '../types';

interface TableKOTPreviewModalProps {
  table: RestaurantTable | null;
  kots: KOT[];
  onClose: () => void;
}

export const TableKOTPreviewModal: React.FC<TableKOTPreviewModalProps> = ({
  table,
  kots,
  onClose
}) => {
  if (!table) return null;

  // Find all active unbilled, non-cancelled KOT tickets for this table
  const tableKots = kots.filter(
    k => (k.branchId === table.branchId) &&
         k.orderType === 'dine_in' &&
         (
           (k.tableNumber && (
             k.tableNumber.toLowerCase() === table.name.toLowerCase() ||
             k.tableNumber.toLowerCase() === `table ${table.number}`.toLowerCase() ||
             k.tableNumber.toLowerCase() === `t${table.number}`.toLowerCase()
           )) ||
           (k.tableId && k.tableId === table.id)
         ) &&
         !k.isBilled &&
         k.status !== 'cancelled'
  );

  // Compute duration from seatedAt if available
  const getSeatedDuration = (seatedAt?: string) => {
    if (!seatedAt) return null;
    try {
      const match = seatedAt.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return null;
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const meridiem = match[3].toUpperCase();
      if (meridiem === 'PM' && hours < 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;

      const now = new Date();
      const seatedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
      let diffMs = now.getTime() - seatedDate.getTime();
      if (diffMs < 0) {
        diffMs += 24 * 60 * 60 * 1000;
      }
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''}`;
      const diffHours = Math.floor(diffMins / 60);
      const remMins = diffMins % 60;
      return `${diffHours}h ${remMins}m`;
    } catch {
      return null;
    }
  };

  const duration = getSeatedDuration(table.seatedAt);

  // Calculate items subtotal and tax across active KOTs
  const allActiveItems = tableKots.flatMap(k => 
    (k.items || []).filter(item => item.status !== 'voided')
  );

  const itemsSubtotal = allActiveItems.reduce((acc, item) => acc + (item.rate * item.quantity), 0);
  // Standard restaurant GST is 5% (2.5% CGST + 2.5% SGST)
  const cgstAmount = Math.round(itemsSubtotal * 0.025);
  const sgstAmount = Math.round(itemsSubtotal * 0.025);
  const totalTax = cgstAmount + sgstAmount;
  
  // Grand total fallback to table.currentAmount if no items
  const computedGrandTotal = itemsSubtotal > 0 
    ? (itemsSubtotal + totalTax) 
    : (table.currentAmount || 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'occupied':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/70 text-amber-300 border border-amber-800">OCCUPIED</span>;
      case 'billing':
        return (
          <span 
            className="table-badge-billing inline-flex items-center font-bold"
            style={{
              backgroundColor: 'rgba(30, 58, 138, 0.4)',
              border: '1px solid #3b82f6',
              color: '#93c5fd',
              fontWeight: 800,
              fontSize: '10px',
              letterSpacing: '0.5px',
              padding: '2px 8px',
              borderRadius: '9999px',
            }}
          >
            BILL REQUESTED
          </span>
        );
      case 'ready':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-800">FOOD READY</span>;
      case 'waiting':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-950/70 text-sky-300 border border-sky-800">WAITING</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">{status.toUpperCase()}</span>;
    }
  };

  const getKotStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700">IN QUEUE</span>;
      case 'preparing':
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-950/80 text-blue-300 border border-blue-700">PREPARING</span>;
      case 'ready':
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700">READY</span>;
      case 'served':
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300 border border-slate-700">SERVED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300">{status.toUpperCase()}</span>;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs font-sans text-slate-200"
      onClick={onClose}
    >
      <div 
        id="modal-table-kot-preview"
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#161f38]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-extrabold text-sm shadow-xs">
              T{table.number}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {table.name}
                </h3>
                {getStatusBadge(table.status)}
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                  Executive Monitor
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{table.capacity} Seats</span>
                  {table.guestCount ? ` (${table.guestCount} Guests)` : ''}
                </span>
                {table.seatedAt && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1 text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Seated {table.seatedAt}</span>
                      {duration && <span className="text-amber-400/90 font-medium">({duration})</span>}
                    </span>
                  </>
                )}
                {table.assignedWaiterName && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-300">
                      Waiter: <strong className="text-white">{table.assignedWaiterName}</strong>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            id="btn-close-table-kot-preview-x"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Active KOTs Count Indicator */}
          <div className="flex items-center justify-between bg-slate-900/80 px-3.5 py-2.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-xs">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-slate-200">
                Active Kitchen Tickets ({tableKots.length})
              </span>
            </div>
            <div className="text-xs">
              <span className="text-slate-400">Current Running Bill: </span>
              <span className="font-bold text-emerald-400 font-mono text-sm">
                ₹{computedGrandTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* KOT Tickets List */}
          {tableKots.length > 0 ? (
            <div className="space-y-3.5">
              {tableKots.map((kot, index) => {
                const activeKotItems = (kot.items || []).filter(i => i.status !== 'voided');
                const kotSubtotal = activeKotItems.reduce((sum, item) => sum + (item.rate * item.quantity), 0);

                return (
                  <div 
                    key={kot.id || index}
                    className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-xs"
                  >
                    {/* KOT Ticket Header */}
                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          {kot.kotNumber}
                        </span>
                        {getKotStatusBadge(kot.status)}
                        {kot.timeFormatted && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {kot.timeFormatted}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {kot.waiterName || kot.serverName ? (
                          <span>Server: <strong className="text-slate-200">{kot.waiterName || kot.serverName}</strong></span>
                        ) : null}
                      </div>
                    </div>

                    {/* KOT Items Table */}
                    <div className="divide-y divide-slate-800/50">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-900/40 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800/60">
                            <th className="px-3.5 py-2 font-semibold">Item</th>
                            <th className="px-2 py-2 text-center font-semibold w-16">Qty</th>
                            <th className="px-3 py-2 text-right font-semibold w-24">Rate</th>
                            <th className="px-3.5 py-2 text-right font-semibold w-24">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40 text-slate-300">
                          {activeKotItems.map((item, idx) => {
                            const lineTotal = item.rate * item.quantity;
                            return (
                              <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-3.5 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <span 
                                      className={`w-2 h-2 rounded-full shrink-0 ${
                                        item.isVeg ? 'bg-emerald-400' : 'bg-rose-400'
                                      }`}
                                      title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                                    />
                                    <span className="font-medium text-slate-200">{item.name}</span>
                                  </div>
                                  {item.notes && (
                                    <p className="text-[10px] text-amber-300/80 italic mt-0.5 ml-4">
                                      Note: {item.notes}
                                    </p>
                                  )}
                                </td>
                                <td className="px-2 py-2.5 text-center font-mono font-bold text-white">
                                  {item.quantity}
                                </td>
                                <td className="px-3 py-2.5 text-right font-mono text-slate-400">
                                  ₹{item.rate}
                                </td>
                                <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-100">
                                  ₹{lineTotal}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* KOT Ticket Subtotal Bar */}
                    <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/60 border-t border-slate-800 text-xs">
                      <span className="text-slate-400 text-[11px]">
                        Ticket Items: {activeKotItems.reduce((acc, i) => acc + i.quantity, 0)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-[11px]">Ticket Subtotal:</span>
                        <span className="font-mono font-bold text-white">₹{kotSubtotal}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 text-center space-y-2">
              <Info className="w-6 h-6 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-300 font-medium">
                No active kitchen tickets currently pending for this table.
              </p>
              <p className="text-[11px] text-slate-500">
                The table has a running billing session active at{' '}
                <strong className="text-emerald-400">₹{computedGrandTotal.toLocaleString('en-IN')}</strong>.
              </p>
            </div>
          )}

          {/* Running Bill & Financial Breakdown */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bill Breakdown & Tax Summary</span>
            </h4>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Items Subtotal</span>
                <span className="font-mono text-slate-200">
                  ₹{itemsSubtotal > 0 ? itemsSubtotal.toLocaleString('en-IN') : computedGrandTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>CGST (2.5%)</span>
                <span className="font-mono text-slate-200">₹{cgstAmount}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>SGST (2.5%)</span>
                <span className="font-mono text-slate-200">₹{sgstAmount}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-bold text-white">Current Running Bill</span>
                  <p className="text-[10px] text-slate-400">Inclusive of all active KOT orders & taxes</p>
                </div>
                <span className="text-lg font-extrabold text-emerald-400 font-mono">
                  ₹{computedGrandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer (Strictly Read-Only: No settlement or cancel controls) */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-800 bg-[#161f38]">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Read-Only Executive Monitor • No billing mutations</span>
          </span>
          <button
            id="btn-close-table-kot-preview"
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
