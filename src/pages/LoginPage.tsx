import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { BrandWatermark } from '../components/BrandWatermark';
import { 
  UtensilsCrossed, 
  KeyRound, 
  Mail, 
  ArrowRight, 
  ShieldAlert, 
  Eye, 
  EyeOff,
  UserCheck,
  ShieldCheck,
  Lock
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, loginWithPin } = useApp();
  const [usernameOrEmail, setUsernameOrEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Dedicated Admin Login Modal / Popover state
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState<boolean>(false);
  const [adminPinInput, setAdminPinInput] = useState<string>('');
  const [adminEmailInput, setAdminEmailInput] = useState<string>('admin@backoffice.com');
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('admin123');
  const [adminAuthMode, setAdminAuthMode] = useState<'pin' | 'password'>('pin');
  const [adminError, setAdminError] = useState<string>('');

  // Failsafe: Ensure body/html allows vertical scrolling when on the login screen
  useEffect(() => {
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    document.documentElement.style.height = 'auto';
    document.body.style.height = 'auto';
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = login(usernameOrEmail, password);
    if (!result.success) {
      setError(result.error || 'Invalid email or password');
      setIsSubmitting(false);
    }
  };

  const handleSelectDemo = (userIdentifier: string, pass: string) => {
    setUsernameOrEmail(userIdentifier);
    setPassword(pass);
    setError('');
  };

  const handleDirectLogin = (userIdentifier: string, pass: string) => {
    setUsernameOrEmail(userIdentifier);
    setPassword(pass);
    setError('');
    login(userIdentifier, pass);
  };

  const handleAdminPinLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    if (!adminPinInput.trim()) {
      setAdminError('Please enter the 4-digit Admin PIN');
      return;
    }
    const res = loginWithPin(adminPinInput.trim());
    if (!res.success) {
      setAdminError(res.error || 'Invalid Admin PIN (Demo: 9999)');
    }
  };

  const handleAdminCredsLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    const res = login(adminEmailInput.trim(), adminPasswordInput.trim());
    if (!res.success) {
      setAdminError(res.error || 'Invalid Admin Credentials');
    }
  };

  return (
    <div 
      className="w-full min-h-screen pt-4 pb-16 flex flex-col items-center justify-start px-4 bg-[#0a0f1d] text-slate-100 select-none relative font-sans overflow-y-auto"
      style={{ minHeight: '100vh', maxHeight: 'none', overflowY: 'auto', backgroundColor: '#0a0f1d' }}
    >
      {/* Subtle background texture */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b25_1px,transparent_1px),linear-gradient(to_bottom,#1e293b25_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

      {/* Bilaal Restaurant Crest Watermark */}
      <BrandWatermark opacity={0.11} />

      {/* Top Floating Theme Switcher */}
      <div className="w-full max-w-md flex justify-end mb-1 z-20">
        <ThemeToggle showLabel />
      </div>

      <div className="max-w-md w-full z-10">
        {/* Restaurant Brand Header */}
        <div className="text-center mt-1 mb-2">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-600 text-white mb-1.5 shadow-md border border-emerald-500">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white uppercase leading-tight">
            BILAAL RESTAURANT
          </h1>
          <p className="text-[11px] font-semibold tracking-widest text-emerald-400 mt-0.5 uppercase">
            RESTAURANT POS
          </p>
          <p className="text-[11px] text-slate-400">
            Cloud POS &amp; Dining Room Management
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0f172a] border border-slate-800/90 rounded-2xl shadow-2xl p-5">
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white">Welcome back</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Please enter your credentials to sign in</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Online" />
          </div>

          {/* Error Banner */}
          {error && (
            <div id="login-error-alert" className="mb-4 p-2.5 rounded-lg bg-rose-950/70 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Quick Dedicated Admin Login Option Banner */}
          <div className="mb-3.5 p-2.5 rounded-xl bg-[#111c2e] border border-emerald-500/30 flex items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Admin Backoffice</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    EXCLUSIVE
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Menu &amp; Staff Management Portal
                </div>
              </div>
            </div>
            <button
              id="open-admin-login-modal-btn"
              type="button"
              onClick={() => {
                setAdminError('');
                setIsAdminLoginModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-sm transition-all cursor-pointer shrink-0 flex items-center gap-1"
            >
              <Lock className="w-3 h-3" />
              <span>Admin Login</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="username-email" className="block text-[11px] font-semibold text-slate-300 mb-1">
                Username / Email
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="username-email"
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={e => {
                    setUsernameOrEmail(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full pl-8.5 pr-3 py-2 bg-[#111c2e] hover:bg-slate-800/80 focus:bg-[#111c2e] border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  placeholder="admin@restaurant.com"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-[11px] font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full pl-8.5 pr-9 py-2 bg-[#111c2e] hover:bg-slate-800/80 focus:bg-[#111c2e] border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-0.5 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-1.5 py-2 px-4 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>SIGN IN TO POS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Demo Login Section */}
          <div className="mt-4 pt-3.5 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                Demo Credentials
              </span>
              <span className="text-[10px] text-slate-500">Click to fill &amp; enter</span>
            </div>

            <div className="space-y-1.5">
              {/* Dedicated Admin Backoffice Login */}
              <div 
                id="demo-admin-login-row"
                onClick={() => handleSelectDemo('admin@backoffice.com', 'admin123')}
                className="py-2.5 px-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-500/40 hover:border-emerald-400 cursor-pointer transition-all flex items-center justify-between group shadow-2xs"
                title="Click to populate Admin Backoffice credentials"
              >
                <div>
                  <div className="text-xs font-bold text-emerald-300 group-hover:text-emerald-200 flex items-center gap-1.5 leading-tight">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Dedicated Admin Login:</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ADMIN
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-300/70 font-mono mt-0.5">
                    admin@backoffice.com • PIN: 9999 • pass: admin123
                  </div>
                </div>
                <button
                  type="button"
                  id="direct-admin-signin-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDirectLogin('admin@backoffice.com', 'admin123');
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs cursor-pointer shrink-0 ml-2"
                >
                  Admin Sign in
                </button>
              </div>

              {/* Owner */}
              <div 
                onClick={() => handleSelectDemo('admin@restaurant.com', 'admin123')}
                className="py-2 px-3 rounded-xl bg-[#111c2e] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between group shadow-2xs"
                title="Click to populate credentials"
              >
                <div>
                  <div className="text-xs font-bold text-slate-100 group-hover:text-emerald-400 flex items-center gap-1.5 leading-tight">
                    <span>Owner / Super Admin:</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-950/60 text-amber-400 border border-amber-800/60">
                      OWNER
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    admin@restaurant.com • admin123
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDirectLogin('admin@restaurant.com', 'admin123');
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 border border-slate-700 text-slate-200 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-colors shadow-2xs cursor-pointer shrink-0 ml-2"
                >
                  Sign in
                </button>
              </div>

              {/* Branch Manager */}
              <div 
                onClick={() => handleSelectDemo('manager@restaurant.com', 'manager123')}
                className="py-2 px-3 rounded-xl bg-[#111c2e] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between group shadow-2xs"
                title="Click to populate credentials"
              >
                <div>
                  <div className="text-xs font-bold text-slate-100 group-hover:text-emerald-400 flex items-center gap-1.5 leading-tight">
                    <span>Branch Manager (Branch 1):</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-indigo-950/60 text-indigo-400 border border-indigo-800/60">
                      SUPERVISOR
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    manager@restaurant.com • manager123
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDirectLogin('manager@restaurant.com', 'manager123');
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 border border-slate-700 text-slate-200 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-colors shadow-2xs cursor-pointer shrink-0 ml-2"
                >
                  Sign in
                </button>
              </div>

              {/* Cashier */}
              <div 
                onClick={() => handleSelectDemo('cashier@restaurant.com', 'cashier123')}
                className="py-2 px-3 rounded-xl bg-[#111c2e] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between group shadow-2xs"
                title="Click to populate credentials"
              >
                <div>
                  <div className="text-xs font-bold text-slate-100 group-hover:text-emerald-400 flex items-center gap-1.5 leading-tight">
                    <span>Cashier (Toast Counter):</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-blue-950/60 text-blue-400 border border-blue-800/60">
                      CASHIER
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    cashier@restaurant.com • cashier123
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDirectLogin('cashier@restaurant.com', 'cashier123');
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 border border-slate-700 text-slate-200 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-colors shadow-2xs cursor-pointer shrink-0 ml-2"
                >
                  Sign in
                </button>
              </div>

              {/* Waiter */}
              <div 
                onClick={() => handleSelectDemo('waiter@restaurant.com', 'waiter123')}
                className="py-2 px-3 rounded-xl bg-[#111c2e] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between group shadow-2xs"
                title="Click to populate credentials"
              >
                <div>
                  <div className="text-xs font-bold text-slate-100 group-hover:text-emerald-400 flex items-center gap-1.5 leading-tight">
                    <span>Floor Waiter (Touch Handheld):</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-teal-950/60 text-teal-400 border border-teal-800/60">
                      WAITER
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    waiter@restaurant.com • waiter123
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDirectLogin('waiter@restaurant.com', 'waiter123');
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 border border-slate-700 text-slate-200 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-colors shadow-2xs cursor-pointer shrink-0 ml-2"
                >
                  Sign in
                </button>
              </div>

              {/* Kitchen */}
              <div 
                onClick={() => handleSelectDemo('kitchen@restaurant.com', 'kitchen123')}
                className="py-2 px-3 rounded-xl bg-[#111c2e] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between group shadow-2xs"
                title="Click to populate credentials"
              >
                <div>
                  <div className="text-xs font-bold text-slate-100 group-hover:text-emerald-400 flex items-center gap-1.5 leading-tight">
                    <span>Kitchen Display (KDS):</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-purple-950/60 text-purple-400 border border-purple-800/60">
                      KITCHEN
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    kitchen@restaurant.com • kitchen123
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDirectLogin('kitchen@restaurant.com', 'kitchen123');
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 border border-slate-700 text-slate-200 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-colors shadow-2xs cursor-pointer shrink-0 ml-2"
                >
                  Sign in
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-3 text-center text-[11px] text-slate-400">
          Zaffran Flavours • Multi-Branch Restaurant Point of Sale System
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DEDICATED ADMIN LOGIN MODAL */}
      {/* ========================================================================= */}
      {isAdminLoginModalOpen && (
        <div 
          id="admin-login-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="bg-[#0f172a] border border-emerald-500/40 rounded-2xl shadow-2xl max-w-sm w-full p-5 text-white animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md border border-emerald-500/40">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                    Admin Backoffice Login
                  </h3>
                  <p className="text-[10px] text-emerald-400 font-medium">
                    Menu &amp; Staff Management Only
                  </p>
                </div>
              </div>
              <button
                id="close-admin-login-modal-btn"
                type="button"
                onClick={() => setIsAdminLoginModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Error Banner */}
            {adminError && (
              <div className="mt-3 p-2 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{adminError}</span>
              </div>
            )}

            {/* Method Toggle: PIN vs Password */}
            <div className="mt-4 grid grid-cols-2 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  setAdminAuthMode('pin');
                  setAdminError('');
                }}
                className={`py-1.5 rounded-lg font-bold transition-all ${
                  adminAuthMode === 'pin'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                4-Digit PIN
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdminAuthMode('password');
                  setAdminError('');
                }}
                className={`py-1.5 rounded-lg font-bold transition-all ${
                  adminAuthMode === 'password'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Email &amp; Password
              </button>
            </div>

            {/* PIN FORM */}
            {adminAuthMode === 'pin' && (
              <form onSubmit={handleAdminPinLogin} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-center">
                    Enter Admin Security PIN
                  </label>
                  <div className="flex justify-center">
                    <input
                      id="admin-pin-input"
                      type="password"
                      maxLength={4}
                      pattern="[0-9]{4}"
                      autoFocus
                      required
                      value={adminPinInput}
                      onChange={e => setAdminPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="••••"
                      className="w-40 text-center tracking-[0.5em] text-2xl font-mono py-2 rounded-xl bg-slate-900 border border-emerald-500/50 text-emerald-400 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 text-center mt-1.5">
                    Default Master PIN: <strong className="text-emerald-400 font-mono">9999</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setAdminPinInput('9999')}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    Fill PIN 9999
                  </button>
                  <button
                    id="submit-admin-pin-btn"
                    type="submit"
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
                  >
                    Open Dashboard
                  </button>
                </div>
              </form>
            )}

            {/* EMAIL/PASSWORD FORM */}
            {adminAuthMode === 'password' && (
              <form onSubmit={handleAdminCredsLogin} className="mt-4 space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmailInput}
                    onChange={e => setAdminEmailInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={adminPasswordInput}
                    onChange={e => setAdminPasswordInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  id="submit-admin-creds-btn"
                  type="submit"
                  className="w-full mt-2 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
                >
                  Sign In as Admin
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
