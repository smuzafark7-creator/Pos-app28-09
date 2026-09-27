import React, { useState } from 'react';
import { OwnerHeader } from './OwnerHeader';
import { OwnerSidebar } from './OwnerSidebar';
import { BillDetailsModal } from '../../components/BillDetailsModal';
import { ThermalReceiptModal } from '../../components/ThermalReceiptModal';
import { ToastContainer } from '../../components/ToastContainer';
import { BrandWatermark } from '../../components/BrandWatermark';

interface OwnerLayoutProps {
  children: React.ReactNode;
  activeTabOverride?: string;
  onNavigate?: (tab: string) => void;
}

export const OwnerLayout: React.FC<OwnerLayoutProps> = ({ 
  children,
  activeTabOverride,
  onNavigate 
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div 
      className="h-screen w-full max-w-[100vw] flex flex-col overflow-hidden overflow-x-hidden bg-[#0a0f1d] font-sans antialiased text-slate-100 relative"
      style={{ backgroundColor: '#0a0f1d' }}
    >
      <OwnerHeader 
        className="sticky top-0 z-50 flex-shrink-0"
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)} 
      />
      <div className="flex flex-1 overflow-hidden w-full max-w-[100vw] relative">
        {/* Fixed Left Sidebar strictly for Owner */}
        <OwnerSidebar 
          className="w-64 flex-shrink-0 h-full overflow-y-auto"
          isOpenMobile={isMobileSidebarOpen} 
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          activeTabOverride={activeTabOverride}
          onNavigate={onNavigate}
        />
        {/* Scrollable Owner Management Content */}
        <main 
          className={`flex-1 h-full min-w-0 relative z-10 ${
            activeTabOverride === 'pos' 
              ? 'p-0 bg-[#0a0f1d] overflow-y-auto' 
              : activeTabOverride === 'kitchen' 
                ? 'p-0 bg-[#0a0f1d] flex flex-col min-h-0' 
                : activeTabOverride === 'dashboard' 
                  ? 'px-4 sm:px-6 pt-2 sm:pt-3 pb-6 bg-[#0a0f1d] overflow-y-auto' 
                  : 'p-6 bg-[#0a0f1d] overflow-y-auto'
          }`}
          style={{ backgroundColor: '#0a0f1d' }}
        >
          <BrandWatermark opacity={0.09} />
          <div className="relative z-10 h-full w-full">
            {children}
          </div>
        </main>
      </div>

      <BillDetailsModal />
      <ThermalReceiptModal />
      <ToastContainer />
    </div>
  );
};
