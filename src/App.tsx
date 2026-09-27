/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { AppProvider, useApp, ThemeProvider } from './context';
import { LoginPage, DedicatedAdminDashboard } from './pages';
import { RoleLayoutRouter } from './routing';
import { ToastContainer } from './components';
import { AdminPinModal } from './components/AdminPinModal';

const AppContent: React.FC = () => {
  const { currentUser } = useApp();

  // Dynamically manage body & html overflow to prevent lock when unauthenticated or in Admin Console
  useEffect(() => {
    if (!currentUser || currentUser.role === 'admin') {
      document.documentElement.classList.remove('pos-locked');
      document.body.classList.remove('pos-locked');
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
      document.documentElement.style.height = 'auto';
      document.body.style.height = 'auto';
    } else {
      document.documentElement.classList.add('pos-locked');
      document.body.classList.add('pos-locked');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.documentElement.style.height = '';
      document.body.style.height = '';
    }
  }, [currentUser]);

  // Unauthenticated user -> render login screen in an unrestricted scrollable root wrapper
  if (!currentUser) {
    return (
      <div
        id="login-root-wrapper"
        className="min-h-screen w-full overflow-y-auto bg-[#0a0f1d] flex flex-col justify-start"
        style={{ minHeight: '100vh', maxHeight: 'none', overflowY: 'auto', backgroundColor: '#0a0f1d' }}
      >
        <LoginPage />
        <ToastContainer />
      </div>
    );
  }

  // Dedicated Admin role -> render exclusive Admin Dashboard with full vertical scrolling
  if (currentUser.role === 'admin') {
    return (
      <div
        id="admin-root-wrapper"
        className="min-h-screen h-full overflow-y-auto w-full pb-16 bg-[#0a0f1d] flex flex-col"
        style={{ minHeight: '100vh', maxHeight: 'none', overflowY: 'auto', backgroundColor: '#0a0f1d' }}
      >
        <DedicatedAdminDashboard />
        <ToastContainer />
      </div>
    );
  }

  // Authenticated staff user (Owner, Cashier, Waiter, Manager, Kitchen) -> render via existing role-isolated Layout Router
  return (
    <div 
      className="overflow-x-hidden w-full max-w-[100vw] h-full flex flex-col bg-[#0a0f1d]"
      style={{ backgroundColor: '#0a0f1d' }}
    >
      <RoleLayoutRouter />
      <AdminPinModal />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
}
