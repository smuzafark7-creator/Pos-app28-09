import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { 
  X, 
  ShieldCheck, 
  Crown, 
  Receipt, 
  UtensilsCrossed, 
  ChefHat, 
  Check, 
  ArrowRight 
} from 'lucide-react';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RoleOption {
  role: UserRole;
  title: string;
  name: string;
  branch: string;
  email: string;
  badge: string;
  badgeColor: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const ROLES: RoleOption[] = [
  {
    role: 'owner',
    title: 'Owner / Super Admin',
    name: 'Vikramaditya Rao (Owner)',
    branch: 'Consolidated • All Branches',
    email: 'admin@restaurant.com',
    badge: 'OWNER',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    icon: Crown,
    description: 'Complete cross-branch visibility, financial audits, franchise governance & analytics.'
  },
  {
    role: 'manager',
    title: 'Branch Manager (Supervisor)',
    name: 'Vikram Sharma (Manager)',
    branch: 'Branch 1 • Main Branch',
    email: 'manager@restaurant.com',
    badge: 'SUPERVISOR',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    icon: ShieldCheck,
    description: 'Elevated supervisor controls, direct bill void & discounts, Z-Report audits & store management.'
  },
  {
    role: 'cashier',
    title: 'Cashier (Counter Billing)',
    name: 'Anita Deshmukh (Cashier)',
    branch: 'Branch 1 • Main Branch',
    email: 'cashier@restaurant.com',
    badge: 'CASHIER',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    icon: Receipt,
    description: 'High-speed touch counter POS, takeaway packet dispatch, bill settlement & cash drawer.'
  },
  {
    role: 'waiter',
    title: 'Floor Waiter (Table Service)',
    name: 'Ramesh Patel (Waiter)',
    branch: 'Branch 1 • Main Branch',
    email: 'waiter@restaurant.com',
    badge: 'WAITER',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    icon: UtensilsCrossed,
    description: 'Floor tables map, table assignment, digital ordering notepad & bill request triggers.'
  },
  {
    role: 'kitchen',
    title: 'Kitchen Display (KDS)',
    name: 'Chef Rajesh Kumar (Kitchen)',
    branch: 'Branch 1 • Main Branch',
    email: 'kitchen@restaurant.com',
    badge: 'KITCHEN',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    icon: ChefHat,
    description: 'Live order board, preparation timers, mark ready dispatches & 86 stock management.'
  }
];

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, switchRole } = useApp();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectRole = (role: UserRole) => {
    switchRole(role);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150 font-sans"
      onClick={onClose}
    >
      <div 
        className="bg-[#121722] border border-white/10 rounded-2xl w-full max-w-xl text-white shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#0D111A] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Switch System Role / Profile</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10 font-mono">
                  Multi-Role
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Switch role instantaneously to view interface permissions
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/5"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Roles List */}
        <div className="p-4 space-y-2.5 max-h-[70vh] overflow-y-auto">
          {ROLES.map(item => {
            const isActive = currentUser?.role === item.role;
            const Icon = item.icon;

            return (
              <div
                key={item.role}
                onClick={() => handleSelectRole(item.role)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                  isActive
                    ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                    : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                    isActive 
                      ? 'bg-emerald-600 text-white border-emerald-400' 
                      : 'bg-white/5 text-slate-300 border-white/10 group-hover:text-white group-hover:border-white/20'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold leading-tight ${isActive ? 'text-emerald-300' : 'text-white'}`}>
                        {item.title}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase border ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-200 mt-0.5">
                      {item.name}
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span className="text-emerald-400 font-medium">{item.branch}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-500">{item.email}</span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center">
                  {isActive ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                      <Check className="w-3.5 h-3.5" />
                      Active
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectRole(item.role);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/5 hover:bg-emerald-600 text-slate-300 hover:text-white border border-white/10 hover:border-emerald-500 transition-all flex items-center gap-1 shadow-2xs group-hover:bg-emerald-600 group-hover:text-white cursor-pointer"
                    >
                      <span>Switch</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-[#0D111A] border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Current Role: <strong className="text-white uppercase">{currentUser?.role || 'None'}</strong></span>
          <span className="text-[11px] font-mono text-slate-500">Zaffran Flavours POS</span>
        </div>
      </div>
    </div>
  );
};
