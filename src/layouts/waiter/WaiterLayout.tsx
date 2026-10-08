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
      {/* 1. PERSISTENT MASTER TOP HEADER - Top navbar with relocated horizontal navigation pills */}
      <div className="shrink-0 z-30">
        <WaiterHeader 
          activeTabOverride={activeTabOverride}
          onNavigate={onNavigate}
        />
      </div>

      {/* 2. LEFT VERTICAL SIDEBAR COMPLETELY REMOVED */}
      <WaiterNav 
        activeTabOverride={activeTabOverride}
        onNavigate={onNavigate}
      />
      
      {/* 3. MAIN VIEWPORT ARCHITECTURE - Expands to occupy full 100% available horizontal screen width */}
      <main 
        className={`flex-1 min-h-0 ${activeTabOverride === 'pos' ? 'overflow-hidden' : 'overflow-y-auto'} overflow-x-hidden bg-[#0a0f1d] relative z-10 w-full ml-0`}
        style={{ backgroundColor: '#0a0f1d', marginLeft: '0px', width: '100%' }}
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
