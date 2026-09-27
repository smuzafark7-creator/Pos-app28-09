import React from 'react';
import { useApp } from '../context/AppContext';
import { canUserAccessRoute, getDefaultRouteForRole } from './routes';
import {
  DashboardPage,
  POSPage,
  TablesPage,
  KOTPage,
  KitchenPage,
  BillsPage,
  CustomersPage,
  MenuManagementPage,
  ReportsPage,
  SettingsPage,
  ZReportPage,
} from '../pages';

export const AppRouter: React.FC = () => {
  const { currentUser, activeTab, setActiveTab } = useApp();

  if (!currentUser) return null;

  // Role-based route authorization guard
  const hasAccess = canUserAccessRoute(currentUser.role, activeTab);

  if (!hasAccess) {
    const fallbackTab = getDefaultRouteForRole(currentUser.role);
    // Render the permitted default view for this role
    switch (fallbackTab) {
      case 'tables':
        return <TablesPage />;
      case 'kitchen':
        return <KitchenPage />;
      case 'pos':
        return <POSPage />;
      default:
        return <DashboardPage />;
    }
  }

  // Active view routing
  switch (activeTab) {
    case 'dashboard':
      return <DashboardPage />;
    case 'pos':
      return <POSPage />;
    case 'tables':
      return <TablesPage />;
    case 'kot':
      return <KOTPage />;
    case 'kitchen':
      return <KitchenPage />;
    case 'bills':
      return <BillsPage />;
    case 'customers':
      return <CustomersPage />;
    case 'menu':
      return <MenuManagementPage />;
    case 'reports':
      return <ReportsPage />;
    case 'settings':
      return <SettingsPage />;
    case 'zreport':
      return <ZReportPage />;
    default:
      return <DashboardPage />;
  }
};
