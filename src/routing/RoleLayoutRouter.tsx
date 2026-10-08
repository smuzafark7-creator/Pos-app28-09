import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { 
  OwnerLayout, 
  WaiterLayout, 
  KitchenLayout, 
  CashierLayout,
  ManagerLayout
} from '../layouts';
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
  DedicatedAdminDashboard,
} from '../pages';
import { WaiterPOSView } from '../components/waiter/WaiterPOSView';
import { CashierPOSView } from '../components/cashier/CashierPOSView';
import { WaiterBillsPage } from '../pages/WaiterBillsPage';

// Helper to map pathnames to tab IDs and vice versa per role
interface RolePathConfig {
  basePrefix: string;
  defaultTab: string;
  defaultPath: string;
  allowedTabs: string[];
  tabToPath: Record<string, string>;
  pathToTab: Record<string, string>;
}

const ROLE_ROUTING: Record<UserRole, RolePathConfig> = {
  owner: {
    basePrefix: '/owner',
    defaultTab: 'dashboard',
    defaultPath: '/owner/dashboard',
    allowedTabs: ['dashboard', 'tables', 'pos', 'kitchen', 'bills', 'customers', 'menu', 'reports', 'settings'],
    tabToPath: {
      dashboard: '/owner/dashboard',
      tables: '/owner/tables',
      pos: '/owner/pos',
      kot: '/owner/kitchen',
      'kot-status': '/owner/kitchen',
      kitchen: '/owner/kitchen',
      'kitchen-kds': '/owner/kitchen',
      bills: '/owner/bills',
      customers: '/owner/customers',
      menu: '/owner/menu',
      reports: '/owner/reports',
      settings: '/owner/settings',
    },
    pathToTab: {
      '/owner': 'dashboard',
      '/owner/': 'dashboard',
      '/owner/dashboard': 'dashboard',
      '/owner/tables': 'tables',
      '/owner/pos': 'pos',
      '/owner/kot': 'kitchen',
      '/owner/kot-status': 'kitchen',
      '/owner/kitchen': 'kitchen',
      '/owner/kitchen-kds': 'kitchen',
      '/owner/bills': 'bills',
      '/owner/customers': 'customers',
      '/owner/menu': 'menu',
      '/owner/reports': 'reports',
      '/owner/settings': 'settings',
    },
  },
  manager: {
    basePrefix: '/manager',
    defaultTab: 'pos',
    defaultPath: '/manager/pos',
    allowedTabs: ['pos', 'tables', 'bills', 'kot', 'zreport', 'menu', 'reports', 'settings'],
    tabToPath: {
      pos: '/manager/pos',
      tables: '/manager/tables',
      bills: '/manager/bills',
      kot: '/manager/kot',
      zreport: '/manager/zreport',
      menu: '/manager/menu',
      reports: '/manager/reports',
      settings: '/manager/settings',
    },
    pathToTab: {
      '/manager': 'pos',
      '/manager/': 'pos',
      '/manager/pos': 'pos',
      '/manager/billing': 'pos',
      '/manager/tables': 'tables',
      '/manager/bills': 'bills',
      '/manager/kot': 'kot',
      '/manager/zreport': 'zreport',
      '/manager/menu': 'menu',
      '/manager/reports': 'reports',
      '/manager/settings': 'settings',
    },
  },
  waiter: {
    basePrefix: '/waiter',
    defaultTab: 'tables',
    defaultPath: '/waiter/tables',
    allowedTabs: ['tables', 'pos', 'kot'],
    tabToPath: {
      tables: '/waiter/tables',
      pos: '/waiter/pos',
      kot: '/waiter/kot',
    },
    pathToTab: {
      '/waiter': 'tables',
      '/waiter/': 'tables',
      '/waiter/tables': 'tables',
      '/waiter/pos': 'pos',
      '/waiter/kot': 'kot',
    },
  },
  kitchen: {
    basePrefix: '/kitchen',
    defaultTab: 'kitchen',
    defaultPath: '/kitchen/kds',
    allowedTabs: ['kitchen'],
    tabToPath: {
      kitchen: '/kitchen/kds',
    },
    pathToTab: {
      '/kitchen': 'kitchen',
      '/kitchen/': 'kitchen',
      '/kitchen/kds': 'kitchen',
      '/kitchen/display': 'kitchen',
      '/kitchen/kitchen': 'kitchen',
    },
  },
  cashier: {
    basePrefix: '/pos',
    defaultTab: 'pos',
    defaultPath: '/pos/billing',
    allowedTabs: ['pos', 'tables', 'bills', 'kot', 'zreport'],
    tabToPath: {
      pos: '/pos/billing',
      tables: '/pos/tables',
      bills: '/pos/bills',
      kot: '/pos/kot',
      zreport: '/pos/zreport',
    },
    pathToTab: {
      '/pos': 'pos',
      '/pos/': 'pos',
      '/pos/billing': 'pos',
      '/pos/pos': 'pos',
      '/pos/tables': 'tables',
      '/pos/bills': 'bills',
      '/pos/kot': 'kot',
      '/pos/zreport': 'zreport',
      '/cashier': 'pos',
      '/cashier/': 'pos',
      '/cashier/billing': 'pos',
      '/cashier/tables': 'tables',
      '/cashier/bills': 'bills',
      '/cashier/kot': 'kot',
      '/cashier/zreport': 'zreport',
    },
  },
  admin: {
    basePrefix: '/admin',
    defaultTab: 'menu',
    defaultPath: '/admin',
    allowedTabs: ['menu', 'users', 'staff'],
    tabToPath: {
      menu: '/admin/menu',
      users: '/admin/staff',
      staff: '/admin/staff',
    },
    pathToTab: {
      '/admin': 'menu',
      '/admin/': 'menu',
      '/admin/menu': 'menu',
      '/admin/staff': 'staff',
      '/admin/users': 'staff',
    },
  },
};

export const RoleLayoutRouter: React.FC = () => {
  const { currentUser, activeTab, setActiveTab } = useApp();

  // Get current role's configuration
  const roleConfig = useMemo(() => {
    if (!currentUser) return null;
    return ROLE_ROUTING[currentUser.role] || ROLE_ROUTING.owner;
  }, [currentUser]);

  // Determine initial active tab based on role and URL path
  const resolveTabFromLocation = useCallback((config: RolePathConfig): string => {
    try {
      if (typeof window === 'undefined' || !window.location) return config.defaultTab;
      const currentPath = window.location.pathname.toLowerCase();

      // Check direct matching in pathToTab
      if (config.pathToTab[currentPath]) {
        return config.pathToTab[currentPath];
      }

      // Check if path starts with basePrefix
      if (currentPath.startsWith(config.basePrefix)) {
        const subPath = currentPath.slice(config.basePrefix.length).replace(/^\//, '');
        if (config.allowedTabs.includes(subPath)) {
          return subPath;
        }
      }
    } catch {
      // Ignore location access restrictions in iframe
    }

    return config.defaultTab;
  }, []);

  // Sync state & URL
  useEffect(() => {
    if (!roleConfig) return;

    // Check if current activeTab is allowed for this role
    let effectiveTab = activeTab;
    if (!roleConfig.allowedTabs.includes(effectiveTab)) {
      // If activeTab is forbidden, try resolving from location or fallback to default
      const resolved = resolveTabFromLocation(roleConfig);
      effectiveTab = resolved;
      setActiveTab(resolved);
    }

    // Synchronize browser URL safely (handles iframe sandbox restrictions)
    try {
      const targetPath = roleConfig.tabToPath[effectiveTab] || roleConfig.defaultPath;
      if (typeof window !== 'undefined' && window.location && window.location.pathname !== targetPath) {
        window.history.replaceState(null, '', targetPath);
      }
    } catch {
      // In sandboxed iframes, replaceState might throw SecurityError; silently ignore
    }
  }, [roleConfig, activeTab, resolveTabFromLocation, setActiveTab]);

  // Listen to browser popstate (back/forward navigation)
  useEffect(() => {
    if (!roleConfig) return;

    const handlePopState = () => {
      try {
        const resolved = resolveTabFromLocation(roleConfig);
        setActiveTab(resolved);
      } catch {
        // Safe fallback
      }
    };

    try {
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    } catch {
      // Ignore
    }
  }, [roleConfig, resolveTabFromLocation, setActiveTab]);

  // Navigate handler for sidebar/nav clicks
  const handleNavigate = useCallback((tabToNavigate: string) => {
    if (!roleConfig) return;

    let newTab = tabToNavigate;
    if (currentUser?.role === 'owner' && (newTab === 'kot' || newTab === 'kot-status')) {
      newTab = 'kitchen';
    }

    if (!roleConfig.allowedTabs.includes(newTab)) {
      console.warn(`Tab "${newTab}" is not authorized for role "${currentUser?.role}"`);
      return;
    }

    setActiveTab(newTab);
    try {
      const newPath = roleConfig.tabToPath[newTab] || roleConfig.defaultPath;
      if (typeof window !== 'undefined' && window.location && window.location.pathname !== newPath) {
        window.history.pushState(null, '', newPath);
      }
    } catch {
      // In sandboxed iframes, pushState might throw SecurityError; silently ignore
    }
  }, [roleConfig, currentUser, setActiveTab]);

  if (!currentUser || !roleConfig) return null;

  // Determine current effective tab
  const currentTab = roleConfig.allowedTabs.includes(activeTab) ? activeTab : roleConfig.defaultTab;

  // Render the appropriate page component
  const renderPageComponent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'tables':
        return <TablesPage />;
      case 'pos':
        if (currentUser.role === 'waiter') {
          return <CashierPOSView userRole="waiter" />;
        }
        if (currentUser.role === 'cashier' || currentUser.role === 'manager') {
          return <CashierPOSView />;
        }
        return <POSPage />;
      case 'kot':
        return <KOTPage />;
      case 'kitchen':
        return <KitchenPage />;
      case 'bills':
        if (currentUser.role === 'waiter') {
          return <WaiterBillsPage />;
        }
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

  // Render the strictly role-isolated layout wrapper:
  // 0. ADMIN: <DedicatedAdminDashboard> (Exclusive Menu & Staff Backoffice Management)
  if (currentUser.role === 'admin') {
    return <DedicatedAdminDashboard />;
  }

  // 1. OWNER: <OwnerLayout> (Header + fixed Sidebar + content)
  if (currentUser.role === 'owner') {
    return (
      <OwnerLayout activeTabOverride={currentTab} onNavigate={handleNavigate}>
        {renderPageComponent()}
      </OwnerLayout>
    );
  }

  // 2. MANAGER: <ManagerLayout> (Manager Console Header + Horizontal Navigation Tabs + Terminal Workspace)
  if (currentUser.role === 'manager') {
    return (
      <ManagerLayout activeTabOverride={currentTab} onNavigate={handleNavigate}>
        {renderPageComponent()}
      </ManagerLayout>
    );
  }

  // 2. WAITER: <WaiterLayout> (Minimal Header + content + touch-optimized Bottom Nav)
  if (currentUser.role === 'waiter') {
    return (
      <WaiterLayout activeTabOverride={currentTab} onNavigate={handleNavigate}>
        {renderPageComponent()}
      </WaiterLayout>
    );
  }

  // 3. KITCHEN: <KitchenLayout> (Full-width KDS + Minimal Header + Collapsible Drawer)
  if (currentUser.role === 'kitchen') {
    return (
      <KitchenLayout>
        <KitchenPage />
      </KitchenLayout>
    );
  }

  // 4. CASHIER: <CashierLayout> (Cashier Header + Compact Vertical Strip + Billing content)
  if (currentUser.role === 'cashier') {
    return (
      <CashierLayout activeTabOverride={currentTab} onNavigate={handleNavigate}>
        {renderPageComponent()}
      </CashierLayout>
    );
  }

  // Fallback (safe default to OwnerLayout)
  return (
    <OwnerLayout activeTabOverride={currentTab} onNavigate={handleNavigate}>
      {renderPageComponent()}
    </OwnerLayout>
  );
};
