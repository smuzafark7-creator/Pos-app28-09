import React from 'react';
import { useApp } from '../context/AppContext';
import { ManagementShell } from './ManagementShell';
import { CashierShell } from './CashierShell';
import { WaiterShell } from './WaiterShell';
import { KdsShell } from './KdsShell';
import { BillDetailsModal } from '../components/BillDetailsModal';
import { ThermalReceiptModal } from '../components/ThermalReceiptModal';
import { ToastContainer } from '../components/ToastContainer';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { currentUser, activeTab } = useApp();

  const renderContentWithModals = (
    <>
      {children}
      <BillDetailsModal />
      <ThermalReceiptModal />
      <ToastContainer />
    </>
  );

  // 1. KITCHEN KDS SHELL: Full-screen kitchen interface (activeTab === 'kitchen' or role === 'kitchen')
  if (activeTab === 'kitchen' || currentUser?.role === 'kitchen') {
    return (
      <KdsShell>
        {renderContentWithModals}
      </KdsShell>
    );
  }

  // 2. WAITER TABLET SHELL: Compact tablet header & full-width ordering workspace
  if (currentUser?.role === 'waiter') {
    return (
      <WaiterShell>
        {renderContentWithModals}
      </WaiterShell>
    );
  }

  // 3. CASHIER POS SHELL:
  // - Cashier role on desktop POS terminal
  // - Owner / Manager when accessing operational screens ('pos' or 'tables')
  // Full-width workspace with NO permanent sidebar eating horizontal space
  if (currentUser?.role === 'cashier' || activeTab === 'pos' || activeTab === 'tables') {
    return (
      <CashierShell>
        {renderContentWithModals}
      </CashierShell>
    );
  }

  // 4. MANAGEMENT SHELL:
  // For Owner / Manager on management screens: Dashboard, Menu, Reports, Settings, Customers, Bills History, Live KOTs
  // Header + Left Sidebar + Main Content (no duplicate navigation in top header)
  return (
    <ManagementShell>
      {renderContentWithModals}
    </ManagementShell>
  );
};
