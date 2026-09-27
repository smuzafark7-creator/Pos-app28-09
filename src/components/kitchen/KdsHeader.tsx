import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ChefHat, Volume2, VolumeX, AlertTriangle, Clock, LogOut } from 'lucide-react';

export interface KdsHeaderProps {
  selectedStation: string;
  onSelectStation: (station: string) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const KdsHeader: React.FC<KdsHeaderProps> = ({
  selectedStation,
  onSelectStation,
  isMuted,
  onToggleMute,
}) => {
  const { kots, currentBranch, logout } = useApp();
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

  const activeTickets = kots.filter(
    k => (currentBranch === 'all' || k.branchId === currentBranch) && (k.status === 'new' || k.status === 'preparing')
  );

  const delayedCount = activeTickets.filter(k => {
    const createdMs = new Date(k.createdAt).getTime();
    if (isNaN(createdMs)) return false;
    return (Date.now() - createdMs) > 15 * 60 * 1000;
  }).length;

  const stations = ['All Stations', 'Tandoor & Grill', 'Main Curry', 'Chinese & Wok', 'Breads & Rice'];

  return (
    <header 
      className="h-16 text-white px-3 sm:px-6 flex items-center justify-between z-30 select-none shrink-0 shadow-xs"
      style={{
        backgroundColor: '#6b0716',
        borderBottom: '1px solid rgba(0, 0, 0, 0.4)'
      }}
    >
      {/* Left: KDS Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-xl flex items-center justify-center font-bold shadow-xs"
            style={{
              backgroundColor: '#1e293b',
              color: '#fbbf24',
              border: '1px solid #334155'
            }}
          >
            <ChefHat className="w-5 h-5" style={{ color: '#fbbf24' }} />
          </div>
          <div>
            <div className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <span>ZAFFRAN KDS</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold tracking-wider">LIVE</span>
            </div>
          </div>
        </div>

        {/* Live Active Tickets Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <span className="text-slate-500">Queue:</span>
          <span className="font-bold text-amber-700">{activeTickets.length} Orders</span>
        </div>

        {delayedCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{delayedCount} Delayed (&gt;15m)</span>
          </div>
        )}
      </div>

      {/* Middle: Station Filter Pills */}
      <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
        {stations.map(station => (
          <button
            key={station}
            type="button"
            onClick={() => onSelectStation(station)}
            className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
              selectedStation === station
                ? 'bg-amber-500 text-white font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            {station}
          </button>
        ))}
      </div>

      {/* Right: Clock, Sound Toggle, Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
          style={{
            backgroundColor: '#0b1120',
            color: '#34d399',
            border: '1px solid #1e293b'
          }}
        >
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>{currentTime}</span>
        </div>

        <button
          type="button"
          onClick={onToggleMute}
          className="p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          style={{
            backgroundColor: '#0b1120',
            color: '#f1f5f9',
            border: '1px solid #1e293b'
          }}
          title={isMuted ? 'Unmute KDS Alerts' : 'Mute KDS Alerts'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          style={{
            backgroundColor: 'rgba(11, 17, 32, 0.7)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}
          title="Sign Out Kitchen"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span className="hidden sm:inline">Exit KDS</span>
        </button>
      </div>
    </header>
  );
};
