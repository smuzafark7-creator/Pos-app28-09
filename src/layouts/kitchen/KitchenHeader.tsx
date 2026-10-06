import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ThemeToggle } from '../../components/ThemeToggle';
import { 
  ChefHat, 
  Volume2, 
  VolumeX, 
  Clock, 
  LogOut,
  Search,
  X
} from 'lucide-react';

interface KitchenHeaderProps {
  selectedStation?: string;
  onSelectStation?: (station: string) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const KitchenHeader: React.FC<KitchenHeaderProps> = ({
  isMuted,
  onToggleMute
}) => {
  const { logout, kdsSearchQuery, setKdsSearchQuery, restaurantSettings } = useApp();
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header 
      id="kds-global-header"
      className="h-16 text-white px-4 sm:px-6 flex items-center justify-between z-30 select-none shrink-0 shadow-md gap-3"
      style={{
        background: 'linear-gradient(180deg, #5c0612 0%, #4a030c 100%)',
        backgroundColor: '#580510',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Left: Logo + KDS badge & Visible Title / Subtitle */}
      <div className="flex items-center gap-3 shrink-0">
        <div 
          id="kds-chef-hat-icon-container"
          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold shadow-xs shrink-0"
          style={{
            backgroundColor: '#1e293b',
            color: '#fbbf24',
            border: '1px solid #334155'
          }}
        >
          <ChefHat className="w-5 h-5" style={{ color: '#fbbf24' }} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span 
            className="kds-header-title uppercase tracking-wider whitespace-nowrap"
            style={{
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '15px',
              WebkitTextFillColor: '#ffffff'
            }}
          >
            {restaurantSettings?.name ? `${restaurantSettings.name} KDS` : 'Bilaal KDS'}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold tracking-wider">
            LIVE
          </span>
          <span 
            className="kds-header-subtitle whitespace-nowrap hidden sm:inline"
            style={{
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '15px',
              WebkitTextFillColor: '#ffffff'
            }}
          >
            • Kitchen Display System
          </span>
        </div>
      </div>

      {/* Center: Search input field for KOTs */}
      <div className="flex-1 max-w-xs sm:max-w-sm md:w-72 lg:w-80 mx-2 sm:mx-4">
        <div 
          id="kds-search-bar"
          className="px-3 py-1.5 flex items-center gap-2 transition-all focus-within:ring-1 focus-within:ring-amber-500/30"
          style={{
            backgroundColor: 'rgba(11, 17, 32, 0.6)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px'
          }}
        >
          <Search className="w-4 h-4 shrink-0" style={{ color: '#94a3b8' }} />
          <input
            type="text"
            value={kdsSearchQuery}
            onChange={(e) => setKdsSearchQuery(e.target.value)}
            placeholder="Search KOT #, Table, Dish..."
            className="text-xs bg-transparent outline-none w-full placeholder:text-[#94a3b8]"
            style={{
              color: '#ffffff',
              WebkitTextFillColor: '#ffffff'
            }}
          />
          {kdsSearchQuery.trim() !== '' && (
            <button
              type="button"
              onClick={() => setKdsSearchQuery('')}
              className="p-0.5 rounded hover:bg-slate-700/60 cursor-pointer shrink-0 transition-colors"
              style={{ color: '#94a3b8' }}
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Live clock + Audio toggle + Exit KDS */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Live clock */}
        <div 
          id="kds-clock-badge"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold tracking-wider"
          style={{
            backgroundColor: '#0b1120',
            color: '#34d399',
            border: '1px solid #1e293b'
          }}
        >
          <Clock className="w-4 h-4" style={{ color: '#34d399' }} />
          <span style={{ color: '#34d399' }}>{currentTime || '00:00:00'}</span>
        </div>

        {/* Global Light / Dark Theme Toggle */}
        <div id="kds-theme-toggle-wrapper">
          <ThemeToggle 
            className="kds-theme-toggle-btn"
            style={{
              backgroundColor: '#0b1120',
              color: '#f1f5f9',
              border: '1px solid #1e293b'
            }}
          />
        </div>

        {/* Audio toggle */}
        <button
          type="button"
          onClick={onToggleMute}
          id="kds-audio-btn"
          className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          style={{
            backgroundColor: '#0b1120',
            color: '#f1f5f9',
            border: '1px solid #1e293b'
          }}
          title={isMuted ? 'Sound Alert Muted - Click to Unmute' : 'Sound Alert Active - Click to Mute'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-rose-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          )}
          <span className="hidden md:inline">{isMuted ? 'Muted' : 'Audio On'}</span>
        </button>

        {/* Exit KDS */}
        <button
          type="button"
          onClick={logout}
          title="Sign Out Kitchen Terminal"
          id="kds-exit-btn"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          style={{
            backgroundColor: 'rgba(11, 17, 32, 0.7)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}
        >
          <LogOut className="w-4 h-4" style={{ color: '#f87171' }} />
          <span className="hidden sm:inline">Exit KDS</span>
        </button>
      </div>
    </header>
  );
};
