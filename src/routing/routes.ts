import React from 'react';
import { UserRole } from '../types';
import { 
  LayoutDashboard, 
  Grid3X3, 
  ReceiptText, 
  FileText, 
  ChefHat, 
  Receipt, 
  Users, 
  Utensils, 
  BarChart3, 
  Settings,
  FileSpreadsheet 
} from 'lucide-react';

export type AppRouteId = 
  | 'dashboard'
  | 'tables'
  | 'pos'
  | 'kot'
  | 'kitchen'
  | 'bills'
  | 'customers'
  | 'menu'
  | 'reports'
  | 'settings'
  | 'zreport';

export interface RouteConfig {
  id: AppRouteId;
  label: string;
  allowedRoles: UserRole[];
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

export const APP_ROUTES: RouteConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    allowedRoles: ['owner', 'manager', 'waiter'],
    icon: LayoutDashboard,
    description: 'Overview of revenue, active orders, and restaurant health'
  },
  {
    id: 'tables',
    label: 'Tables',
    allowedRoles: ['owner', 'manager', 'cashier', 'waiter'],
    icon: Grid3X3,
    description: 'Interactive floor plan and table status management'
  },
  {
    id: 'pos',
    label: 'POS Billing',
    allowedRoles: ['owner', 'manager', 'cashier', 'waiter'],
    icon: ReceiptText,
    description: 'High-speed order taking and point-of-sale terminal'
  },
  {
    id: 'kot',
    label: 'Live KOTs',
    allowedRoles: ['manager', 'cashier', 'kitchen', 'waiter'],
    icon: FileText,
    description: 'Real-time kitchen order tickets tracking'
  },
  {
    id: 'kitchen',
    label: 'Kitchen KDS',
    allowedRoles: ['owner', 'manager', 'kitchen', 'waiter'],
    icon: ChefHat,
    description: 'Kitchen display system for cooks and chefs'
  },
  {
    id: 'bills',
    label: 'Bill History',
    allowedRoles: ['owner', 'manager', 'cashier'],
    icon: Receipt,
    description: 'Settled invoices, payment methods, and reprint records'
  },
  {
    id: 'customers',
    label: 'Customers',
    allowedRoles: ['owner', 'manager', 'cashier'],
    icon: Users,
    description: 'Guest directory, visit frequency, and spending loyalty'
  },
  {
    id: 'menu',
    label: 'Menu Items',
    allowedRoles: ['owner', 'manager'],
    icon: Utensils,
    description: 'Price list, categories, GST rates, and item availability'
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    allowedRoles: ['owner', 'manager'],
    icon: BarChart3,
    description: 'Financial breakdowns, payment channels, and sales metrics'
  },
  {
    id: 'settings',
    label: 'Settings',
    allowedRoles: ['owner', 'manager'],
    icon: Settings,
    description: 'Multi-branch settings, GSTIN configuration, and printers'
  },
  {
    id: 'zreport',
    label: 'Day-End Z-Report',
    allowedRoles: ['owner', 'manager', 'cashier'],
    icon: FileSpreadsheet,
    description: 'Day-End Z-Report shift close audit and drawer settlement'
  }
];

export const canUserAccessRoute = (role: UserRole, routeId: string): boolean => {
  const route = APP_ROUTES.find(r => r.id === routeId);
  if (!route) return false;
  return route.allowedRoles.includes(role);
};

export const getDefaultRouteForRole = (role: UserRole): AppRouteId => {
  switch (role) {
    case 'waiter':
      return 'tables';
    case 'kitchen':
      return 'kitchen';
    case 'cashier':
      return 'pos';
    case 'manager':
    case 'owner':
    default:
      return 'dashboard';
  }
};
