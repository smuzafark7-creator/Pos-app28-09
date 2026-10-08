import React from 'react';
import { CashierPOSView } from '../cashier/CashierPOSView';

/**
 * WaiterPOSView
 * Architectural Sync: Delegates directly to the unified CashierPOSView with userRole="waiter".
 * Shares exact 3-column layout: Categories sidebar, food card grid, and 470px cart drawer.
 */
export const WaiterPOSView: React.FC = () => {
  return <CashierPOSView userRole="waiter" />;
};

export default WaiterPOSView;
