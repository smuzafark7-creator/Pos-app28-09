import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  style?: React.CSSProperties;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false, style }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      id="global-theme-toggle-btn"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Current: ${isDark ? 'Dark Theme' : 'Light Theme'} (Click to switch)`}
      style={style}
      className={`relative inline-flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-200 active:scale-95 border select-none group ${
        isDark
          ? 'bg-[#111c2e] hover:bg-slate-800/90 text-amber-300 hover:text-amber-200 border-slate-800/80 hover:border-slate-700 shadow-2xs'
          : 'bg-white hover:bg-slate-100 text-amber-500 hover:text-amber-600 border-slate-200 shadow-2xs'
      } ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center transition-transform duration-300 group-hover:rotate-12">
        {isDark ? (
          <Moon className="w-4 h-4 text-amber-300 fill-amber-300/20" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500 fill-amber-500/20" />
        )}
      </div>

      {showLabel && (
        <span className="hidden sm:inline font-medium text-[11px]">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
};
