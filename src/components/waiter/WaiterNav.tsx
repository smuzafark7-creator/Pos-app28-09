import React from 'react';

export interface WaiterNavProps {
  activeTabOverride?: string;
  onNavigate?: (tab: string) => void;
}

/**
 * WaiterNav - Vertical left-side toolbar is completely removed per user request:
 * Navigation buttons have been relocated to the top header navbar as horizontal pills.
 */
export const WaiterNav: React.FC<WaiterNavProps> = () => {
  return (
    <nav 
      id="waiter-bottom-navigation-comp" 
      aria-hidden="true"
      style={{ display: 'none' }}
      className="hidden pointer-events-none" 
    />
  );
};
