import React from 'react';
import { WaiterHeader } from './WaiterHeader';
import { WaiterNav } from './WaiterNav';
import { BillDetailsModal } from '../../components/BillDetailsModal';
import { ThermalReceiptModal } from '../../components/ThermalReceiptModal';
import { ToastContainer } from '../../components/ToastContainer';
import { BrandWatermark } from '../../components/BrandWatermark';

interface WaiterLayoutProps {
  children: React.ReactNode;
  activeTabOverride?: string;
  onNavigate?: (tab: string) => void;
}

export const WaiterLayout: React.FC<WaiterLayoutProps> = ({ 
  children,
  activeTabOverride,
  onNavigate 
}) => {
  return (
    <div 
      className="h-screen max-h-screen w-full flex flex-col overflow-hidden bg-[#0a0f1d] font-sans antialiased text-slate-200 select-none relative"
      style={{ backgroundColor: '#0a0f1d' }}
    >
      {/* 1. PERSISTENT MASTER TOP HEADER - pinned at the top */}
      <div className="shrink-0 z-30">
        <WaiterHeader />
      </div>

      {/* 2. REPOSITIONED SLIM LEFT VERTICAL SIDEBAR NAVIGATION */}
      <WaiterNav 
        activeTabOverride={activeTabOverride}
        onNavigate={onNavigate}
      />
      
      {/* 3. MAIN VIEWPORT ARCHITECTURE - offset by 84px left margin for sidebar */}
      <main 
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-[#0a0f1d] relative z-10 ml-[84px]"
        style={{ backgroundColor: '#0a0f1d', marginLeft: '84px' }}
      >
        {activeTabOverride !== 'pos' && <BrandWatermark opacity={0.09} />}
        <div className="relative z-10 h-full w-full">
          {children}
        </div>
      </main>

      {/* Modals & Toasts */}
      <BillDetailsModal />
      <ThermalReceiptModal />
      <ToastContainer />
    </div>
  );
};
