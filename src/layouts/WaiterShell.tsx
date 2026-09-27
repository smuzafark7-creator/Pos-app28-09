import React from 'react';
import { Header } from './Header';

interface ShellProps {
  children: React.ReactNode;
}

export const WaiterShell: React.FC<ShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans antialiased text-slate-900">
      <Header variant="waiter" />
      <div className="flex-1 flex overflow-hidden">
        {/* Full-width tablet touch workspace - NO desktop sidebar */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};
