import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface ShellProps {
  children: React.ReactNode;
}

export const ManagementShell: React.FC<ShellProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50 font-sans antialiased text-slate-900">
      <Header 
        variant="management" 
        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)} 
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isOpenMobile={isMobileMenuOpen} 
          onCloseMobile={() => setIsMobileMenuOpen(false)} 
        />
        <main className="flex-1 h-full overflow-y-auto bg-slate-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
