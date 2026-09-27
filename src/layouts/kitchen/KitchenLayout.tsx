import React, { useState } from 'react';
import { KitchenHeader } from './KitchenHeader';
import { KitchenSidebar } from './KitchenSidebar';
import { KitchenStockView } from './views/KitchenStockView';
import { KitchenDispatchedView } from './views/KitchenDispatchedView';
import { KitchenHistoryView } from './views/KitchenHistoryView';
import { ToastContainer } from '../../components/ToastContainer';
import { ThermalReceiptModal } from '../../components/ThermalReceiptModal';
import { BrandWatermark } from '../../components/BrandWatermark';
import { useApp } from '../../context/AppContext';

interface KitchenLayoutProps {
  children: React.ReactNode;
}

export const KitchenLayout: React.FC<KitchenLayoutProps> = ({ children }) => {
  const { 
    activeKitchenTab, 
    kdsSelectedStation,
    setKdsSelectedStation
  } = useApp();
  const [isMuted, setIsMuted] = useState(false);

  return (
    <div 
      className="h-screen max-h-screen w-full flex flex-col overflow-hidden bg-[#0a0f1d] font-sans antialiased text-slate-100 select-none relative"
      style={{ backgroundColor: '#0a0f1d' }}
    >
      {/* 1. PERSISTENT MASTER TOPBAR - Logo/Title on left, Clock/Audio/Exit on right */}
      <div className="shrink-0 z-30">
        <KitchenHeader 
          selectedStation={kdsSelectedStation}
          onSelectStation={setKdsSelectedStation}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted(prev => !prev)}
        />
      </div>

      {/* 2. MAIN HORIZONTAL BODY: Collapsible Left Sidebar + Full-Screen Viewport */}
      <div className="flex-1 min-h-0 flex flex-row relative overflow-hidden bg-[#0a0f1d]">
        {/* Sleek Collapsible Left Vertical Sidebar */}
        <KitchenSidebar />

        {/* Main Viewport */}
        <main 
          className="flex-1 min-h-0 bg-[#0a0f1d] flex flex-col relative overflow-hidden z-10"
          style={{ backgroundColor: '#0a0f1d' }}
        >
          <BrandWatermark opacity={0.09} />
          <div className="relative z-10 h-full w-full flex flex-col min-h-0">
            {activeKitchenTab === 'live' && children}
            {activeKitchenTab === 'stock86' && <KitchenStockView />}
            {activeKitchenTab === 'dispatched' && <KitchenDispatchedView />}
            {activeKitchenTab === 'history' && <KitchenHistoryView />}
          </div>
        </main>
      </div>

      <ThermalReceiptModal />
      <ToastContainer />
    </div>
  );
};
