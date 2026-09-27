import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Grid3X3, 
  ReceiptText, 
  FileSpreadsheet, 
  Printer, 
  Receipt,
  FileText,
  X
} from 'lucide-react';

interface CashierSidebarProps {
  activeTabOverride?: string;
  onNavigate?: (tab: string) => void;
}

export const CashierSidebar: React.FC<CashierSidebarProps> = ({ activeTabOverride, onNavigate }) => {
  const { 
    activeTab, 
    setActiveTab, 
    cart, 
    pendingBillRequests, 
    tables, 
    bills, 
    kots,
    filteredKots,
    showToast,
    openReceiptModal,
    currentUser
  } = useApp();

  const [isZReportOpen, setIsZReportOpen] = useState(false);

  const currentActive = activeTabOverride || activeTab;

  const handleNavigate = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    } else {
      setActiveTab(tab);
    }
  };

  // Unsettled / unpaid bills
  const unsettledCount = bills.filter(b => b.status === 'unpaid').length;

  // Active KOTs count (tickets in active queue: new, preparing, ready)
  const activeTickets = filteredKots || kots || [];
  const activeKotsCount = activeTickets.filter(
    k => k.status === 'new' || k.status === 'preparing' || k.status === 'ready'
  ).length;

  // Day-End Z-Report calculations
  const totalSales = bills.reduce((sum, b) => sum + b.grandTotal, 0);
  const totalGst = bills.reduce((sum, b) => sum + b.gstAmount, 0);
  const cashSales = bills.filter(b => b.paymentMethod === 'cash').reduce((s, b) => s + b.grandTotal, 0);
  const upiSales = bills.filter(b => b.paymentMethod === 'upi').reduce((s, b) => s + b.grandTotal, 0);
  const cardSales = bills.filter(b => b.paymentMethod === 'card').reduce((s, b) => s + b.grandTotal, 0);

  const handlePrintTest = () => {
    showToast('Test Receipt Sent', 'Thermal printer test job dispatched to Counter EPSON TM-T88VI (58mm).', 'success');
    if (bills.length > 0) {
      openReceiptModal(bills[0]);
    }
  };

  return (
    <>
      {/* Compact vertical strip strictly for Cashier Terminal */}
      <aside className="w-18 sm:w-20 bg-[#0f172a] border-r border-slate-800 h-full flex flex-col justify-between flex-shrink-0 overflow-hidden py-3 select-none shadow-xs font-sans">
        {/* Navigation Items */}
        <div className="flex flex-col items-center space-y-2">
          {/* 1. Live Tables */}
          <button
            id="cashier-sidebar-tables"
            type="button"
            onClick={() => handleNavigate('tables')}
            className={`w-14 sm:w-16 h-16 rounded-xl flex flex-col items-center justify-center p-1.5 transition-all relative cursor-pointer ${
              currentActive === 'tables'
                ? 'bg-slate-800 text-white border border-slate-700 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Live Tables Floor View"
          >
            <div className="relative">
              <Grid3X3 className="w-5 h-5" />
              {pendingBillRequests.length > 0 && (
                <span className="absolute -top-1.5 -right-2 px-1 rounded-full bg-amber-500 text-white text-[9px] font-bold animate-pulse">
                  {pendingBillRequests.length}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 text-center leading-tight">Tables</span>
          </button>

          {/* 2. Quick POS Punch */}
          <button
            id="cashier-sidebar-pos"
            type="button"
            onClick={() => handleNavigate('pos')}
            className={`w-14 sm:w-16 h-16 rounded-xl flex flex-col items-center justify-center p-1.5 transition-all relative cursor-pointer ${
              currentActive === 'pos'
                ? 'bg-slate-800 text-white border border-slate-700 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="High-speed POS Terminal"
          >
            <div className="relative">
              <ReceiptText className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-2 px-1 rounded-full bg-emerald-600 text-white text-[9px] font-bold">
                  {cart.length}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 text-center leading-tight">POS</span>
          </button>

          {/* 3. Unsettled Bills / Pending Payments */}
          <button
            id="cashier-sidebar-bills"
            type="button"
            onClick={() => handleNavigate('bills')}
            className={`w-14 sm:w-16 h-16 rounded-xl flex flex-col items-center justify-center p-1.5 transition-all relative cursor-pointer ${
              currentActive === 'bills'
                ? 'bg-slate-800 text-white border border-slate-700 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Settled & Unsettled Bills"
          >
            <div className="relative">
              <Receipt className="w-5 h-5" />
              {unsettledCount > 0 && (
                <span className="absolute -top-1.5 -right-2 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold">
                  {unsettledCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 text-center leading-tight">Bills</span>
          </button>

          {/* 4. Active KOTs */}
          <button
            id="cashier-sidebar-kot"
            type="button"
            onClick={() => handleNavigate('kot')}
            className={`w-14 sm:w-16 h-16 rounded-xl flex flex-col items-center justify-center p-1.5 transition-all relative cursor-pointer ${
              currentActive === 'kot'
                ? 'bg-slate-800 text-white border border-slate-700 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Active Kitchen Order Tickets (KOT)"
          >
            <div className="relative">
              <FileText className="w-5 h-5" />
              {activeKotsCount > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                  {activeKotsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 text-center leading-tight">KOTs</span>
          </button>
        </div>

        {/* Operational Terminal Actions: Day-End Z-Report & Print Test */}
        <div className="flex flex-col items-center space-y-2 pt-2 border-t border-slate-800 mt-auto flex-shrink-0">
          {/* 4. Day-End (Z-Report) */}
          <button
            id="cashier-sidebar-zreport"
            type="button"
            onClick={() => setIsZReportOpen(true)}
            className="w-14 sm:w-16 h-15 rounded-xl flex flex-col items-center justify-center p-1 text-amber-400 hover:text-amber-300 hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="Generate Day-End Z-Report"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="text-[9px] mt-1 text-center leading-tight font-medium">Z-Report</span>
          </button>
        </div>
      </aside>

      {/* Day-End Z-Report Modal */}
      {isZReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
          <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-2xl text-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm text-white">DAY-END Z-REPORT</h3>
                  <div className="text-[10px] text-slate-400">Terminal Register #01 • {new Date().toLocaleDateString('en-IN')}</div>
                </div>
              </div>
              <button 
                onClick={() => setIsZReportOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Summary Breakdown */}
            <div className="space-y-2 text-xs bg-[#080d1a] p-3.5 rounded-xl border border-slate-800 divide-y divide-slate-800">
              <div className="flex justify-between pb-1.5">
                <span className="text-slate-400">Cashier on Duty:</span>
                <span className="font-semibold text-white">{currentUser?.name || 'Cashier'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Total Invoices Settled:</span>
                <span className="font-semibold text-white">{bills.length}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Gross Sales:</span>
                <span className="font-bold text-emerald-400">₹{totalSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">GST Collected (5%):</span>
                <span className="font-semibold text-white">₹{totalGst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 text-emerald-400">
                <span>Cash Drawer Total:</span>
                <span className="font-bold">₹{(5000 + cashSales).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 text-sky-400">
                <span>UPI / QR Digital:</span>
                <span className="font-bold">₹{upiSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1.5 text-purple-400">
                <span>Card Terminal:</span>
                <span className="font-bold">₹{cardSales.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsZReportOpen(false)}
                className="flex-1 py-2 rounded-lg bg-[#080d1a] hover:bg-slate-800 text-xs font-medium text-slate-300 hover:text-white cursor-pointer transition-colors border border-slate-800"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast('Z-Report Printed', 'Day-End Z-Report summary printed to thermal register.', 'success');
                  setIsZReportOpen(false);
                }}
                className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Z-Report</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
