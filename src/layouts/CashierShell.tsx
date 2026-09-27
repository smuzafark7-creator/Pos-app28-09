import React from 'react';
import { Header } from './Header';

interface ShellProps {
  children: React.ReactNode;
}

export const CashierShell: React.FC<ShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans antialiased text-slate-900">
      <Header variant="cashier" />
      <div className="flex-1 flex overflow-hidden">
        {/* Full-width operational workspace - NO permanent sidebar */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};
