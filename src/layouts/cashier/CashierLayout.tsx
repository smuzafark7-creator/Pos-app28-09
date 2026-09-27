import React from 'react';
import { CashierHeader } from './CashierHeader';
import { BillDetailsModal } from '../../components/BillDetailsModal';
import { ThermalReceiptModal } from '../../components/ThermalReceiptModal';
import { ToastContainer } from '../../components/ToastContainer';
import { BrandWatermark } from '../../components/BrandWatermark';

interface CashierLayoutProps {
  children: React.ReactNode;
  activeTabOverride?: string;
  onNavigate?: (tab: string) => void;
}

export const CashierLayout: React.FC<CashierLayoutProps> = ({ 
  children,
  activeTabOverride,
  onNavigate 
}) => {
  return (
    <div
      id="cashier-workspace-root"
      className="h-screen max-h-screen w-full flex flex-col overflow-hidden bg-[#0a0f1d] font-sans antialiased text-slate-200 select-none relative"
      style={{ backgroundColor: '#0a0f1d' }}
    >
      {/* High-speed Cashier Counter Header with Horizontal Navigation Tabs */}
      <div className="shrink-0 z-30">
        <CashierHeader activeTabOverride={activeTabOverride} onNavigate={onNavigate} />
      </div>

      {/* Operational Billing Terminal Workspace - Full 100% Width */}
      <main
        id="cashier-workspace"
        className={`flex-1 min-h-0 ${activeTabOverride === 'pos' ? 'overflow-hidden' : 'overflow-y-auto'} min-w-0 w-full overflow-x-hidden bg-[#0a0f1d] relative z-10`}
        style={{ backgroundColor: '#0a0f1d' }}
      >
        <BrandWatermark opacity={0.09} />
        <div className="relative z-10 h-full w-full">
          {children}
        </div>
      </main>

      <BillDetailsModal />
      <ThermalReceiptModal />
      <ToastContainer />
    </div>
  );
};
