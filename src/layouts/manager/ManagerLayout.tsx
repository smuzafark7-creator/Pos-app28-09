import React from 'react';
import { ManagerHeader } from './ManagerHeader';
import { BillDetailsModal } from '../../components/BillDetailsModal';
import { ThermalReceiptModal } from '../../components/ThermalReceiptModal';
import { ToastContainer } from '../../components/ToastContainer';
import { BrandWatermark } from '../../components/BrandWatermark';

interface ManagerLayoutProps {
  children: React.ReactNode;
  activeTabOverride?: string;
  onNavigate?: (tab: string) => void;
}

export const ManagerLayout: React.FC<ManagerLayoutProps> = ({ 
  children,
  activeTabOverride,
  onNavigate 
}) => {
  return (
    <div 
      className="h-screen max-h-screen w-full flex flex-col overflow-hidden bg-[#0a0f1d] font-sans antialiased text-slate-200 select-none relative"
      style={{ backgroundColor: '#0a0f1d' }}
    >
      {/* High-speed Manager Console Header with Horizontal Navigation Tabs */}
      <div className="shrink-0 z-30">
        <ManagerHeader activeTabOverride={activeTabOverride} onNavigate={onNavigate} />
      </div>

      {/* Manager Console Terminal Workspace - Full Width */}
      <main 
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
