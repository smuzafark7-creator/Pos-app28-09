import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Lock, X, Delete, ArrowRight, KeyRound } from 'lucide-react';

export const AdminPinModal: React.FC = () => {
  const { 
    isAdminPinModalOpen, 
    closeAdminPinModal, 
    verifyAdminPin, 
    switchRoleToAdmin,
    currentUser,
    users
  } = useApp();

  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  useEffect(() => {
    if (isAdminPinModalOpen) {
      setPin('');
      setError(null);
      setIsShaking(false);
    }
  }, [isAdminPinModalOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isAdminPinModalOpen) return;

      if (e.key === 'Escape') {
        closeAdminPinModal();
      } else if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        if (pin.length === 4) {
          validateAndSubmit(pin);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdminPinModalOpen, pin]);

  if (!isAdminPinModalOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError(null);

    if (newPin.length === 4) {
      validateAndSubmit(newPin);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  const validateAndSubmit = (pinToTest: string) => {
    const isValid = verifyAdminPin(pinToTest);
    if (isValid) {
      switchRoleToAdmin();
      closeAdminPinModal();
    } else {
      setIsShaking(true);
      setError('Invalid PIN code. Please verify credentials.');
      setTimeout(() => {
        setIsShaking(false);
        setPin('');
      }, 500);
    }
  };

  const fillQuickPin = (demoPin: string) => {
    setPin(demoPin);
    validateAndSubmit(demoPin);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none font-sans"
      onClick={closeAdminPinModal}
    >
      <div 
        className={`bg-[#0b1320] border-2 border-emerald-500/80 rounded-3xl w-full max-w-sm text-white shadow-[0_0_30px_rgba(16,185,129,0.25)] overflow-hidden transition-all ${
          isShaking ? 'animate-shake' : ''
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#080e18] border-b border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-950/70 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5 font-mono">
                Admin Authentication
              </h3>
              <p className="text-[11px] text-slate-400">
                Security clearance required
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeAdminPinModal}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/5"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
            <KeyRound className="w-6 h-6" />
          </div>

          <p className="text-xs text-slate-300 text-center mb-4 max-w-[260px]">
            Enter your <span className="text-emerald-400 font-semibold">4-digit PIN</span> to switch to Admin mode with full menu & settings control.
          </p>

          {/* 4-digit PIN Indicator Display */}
          <div className="flex items-center justify-center gap-4 my-2">
            {[0, 1, 2, 3].map(idx => {
              const filled = idx < pin.length;
              return (
                <div 
                  key={idx} 
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                    filled 
                      ? 'bg-emerald-400 border-emerald-400 scale-110 shadow-[0_0_8px_rgba(16,185,129,0.7)]' 
                      : error 
                        ? 'border-rose-500 bg-rose-500/20' 
                        : 'border-slate-600 bg-slate-800/40'
                  }`} 
                />
              );
            })}
          </div>

          {/* Error Message */}
          <div className="h-5 my-1 flex items-center justify-center text-center">
            {error ? (
              <span className="text-[11px] font-semibold text-rose-400 animate-in fade-in">
                {error}
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 font-mono">
                {currentUser?.role ? `Current Role: ${currentUser.role.toUpperCase()}` : ''}
              </span>
            )}
          </div>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2.5 w-full mt-2 max-w-[260px]">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => handleDigit(num)}
                className="h-12 rounded-xl bg-white/[0.04] hover:bg-emerald-950/40 active:bg-emerald-600 text-white font-mono font-bold text-lg border border-white/10 hover:border-emerald-500/50 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              onClick={handleClear}
              className="h-12 rounded-xl bg-white/[0.02] hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 font-mono text-xs font-bold border border-white/10 hover:border-rose-500/40 flex items-center justify-center transition-all cursor-pointer active:scale-95 uppercase"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="h-12 rounded-xl bg-white/[0.04] hover:bg-emerald-950/40 active:bg-emerald-600 text-white font-mono font-bold text-lg border border-white/10 hover:border-emerald-500/50 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleBackspace}
              className="h-12 rounded-xl bg-white/[0.02] hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 flex items-center justify-center transition-all cursor-pointer active:scale-95"
              aria-label="Backspace"
            >
              <Delete className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Demo Assist */}
          <div className="mt-4 pt-3 border-t border-white/10 w-full text-center">
            <div className="text-[10px] text-slate-400 font-mono mb-1.5">
              Quick Switch Demo Accounts:
            </div>
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => fillQuickPin('1234')}
                className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-[10px] text-emerald-300 font-mono font-semibold transition-colors cursor-pointer"
              >
                Admin (1234)
              </button>
              <button
                type="button"
                onClick={() => fillQuickPin('2222')}
                className="px-2.5 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-500/40 text-[10px] text-indigo-300 font-mono font-semibold transition-colors cursor-pointer"
              >
                Manager (2222)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
