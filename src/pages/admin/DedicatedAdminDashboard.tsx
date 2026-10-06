import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminMenuManager } from '../../components/admin/AdminMenuManager';
import { ThemeToggle } from '../../components/ThemeToggle';
import { BrandWatermark } from '../../components/BrandWatermark';
import { 
  MenuItem, 
  MenuCategory, 
  User, 
  UserRole,
  BranchId
} from '../../types';
import { 
  UtensilsCrossed, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Search, 
  Eye, 
  EyeOff, 
  Lock, 
  LogOut, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Tag, 
  Phone, 
  Mail, 
  Building2, 
  KeyRound,
  Leaf,
  Flame,
  Layers,
  ArrowUpDown,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';

interface VariationRow {
  id: string;
  name: string;
  price: number;
}

export const DedicatedAdminDashboard: React.FC = () => {
  const { 
    currentUser, 
    logout, 
    menuItems, 
    categories,
    categoryIcons,
    addCategory,
    addMenuItem, 
    updateMenuItem, 
    deleteMenuItem, 
    toggleMenuItemAvailability,
    users, 
    addUser, 
    updateUser, 
    deleteUser,
    branches,
    showToast 
  } = useApp();

  // Active Admin Section: 'menu' or 'staff'
  const [activeSection, setActiveSection] = useState<'menu' | 'staff'>('menu');

  // Ensure document and body allow unconstrained vertical scrolling in Admin Console
  useEffect(() => {
    document.documentElement.classList.remove('pos-locked');
    document.body.classList.remove('pos-locked');
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    document.documentElement.style.height = 'auto';
    document.body.style.height = 'auto';
  }, []);

  // ==========================================
  // MENU MANAGEMENT STATE
  // ==========================================
  const [menuSearch, setMenuSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'available' | 'sold_out'>('all');
  
  // Dish Modal State
  const [isDishModalOpen, setIsDishModalOpen] = useState<boolean>(false);
  const [editingDish, setEditingDish] = useState<MenuItem | null>(null);
  const [dishName, setDishName] = useState<string>('');
  const [dishCategory, setDishCategory] = useState<MenuCategory>('Biryani');
  const [dishPrice, setDishPrice] = useState<number>(280);
  const [dishGstRate, setDishGstRate] = useState<number>(5);
  const [dishIsVeg, setDishIsVeg] = useState<boolean>(false);
  const [dishDescription, setDishDescription] = useState<string>('');
  const [hasVariations, setHasVariations] = useState<boolean>(false);
  const [variationsList, setVariationsList] = useState<VariationRow[]>([]);
  const [newVarName, setNewVarName] = useState<string>('');
  const [newVarPrice, setNewVarPrice] = useState<number>(150);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [categoryNameInput, setCategoryNameInput] = useState<string>('');
  const [categoryIconInput, setCategoryIconInput] = useState<string>('🍲');

  const handleOpenAddCategory = () => {
    setCategoryNameInput('');
    setCategoryIconInput('🍲');
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryNameInput.trim()) {
      showToast('Validation Error', 'Please enter a category name', 'error');
      return;
    }
    const success = addCategory(categoryNameInput.trim(), categoryIconInput.trim());
    if (success) {
      setSelectedCategory(categoryNameInput.trim());
      setDishCategory(categoryNameInput.trim());
      setIsCategoryModalOpen(false);
      setCategoryNameInput('');
    }
  };

  // Filtered Menu Items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
        item.category.toLowerCase().includes(menuSearch.toLowerCase());
      const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesStock = 
        stockFilter === 'all' || 
        (stockFilter === 'available' && item.available) || 
        (stockFilter === 'sold_out' && !item.available);
      return matchesSearch && matchesCat && matchesStock;
    });
  }, [menuItems, menuSearch, selectedCategory, stockFilter]);

  // Menu Stats
  const menuStats = useMemo(() => {
    const total = menuItems.length;
    const available = menuItems.filter(m => m.available).length;
    const soldOut = total - available;
    const vegCount = menuItems.filter(m => m.isVeg).length;
    return { total, available, soldOut, vegCount };
  }, [menuItems]);

  // Open Dish Modal for Creating
  const handleOpenAddDish = () => {
    setEditingDish(null);
    setDishName('');
    setDishCategory('Biryani');
    setDishPrice(280);
    setDishGstRate(5);
    setDishIsVeg(false);
    setDishDescription('');
    setHasVariations(false);
    setVariationsList([
      { id: 'v1', name: 'Half', price: 180 },
      { id: 'v2', name: 'Full', price: 280 }
    ]);
    setIsDishModalOpen(true);
  };

  // Open Dish Modal for Editing
  const handleOpenEditDish = (item: MenuItem) => {
    setEditingDish(item);
    setDishName(item.name);
    setDishCategory(item.category);
    setDishPrice(item.price);
    setDishGstRate(item.gstRate || 5);
    setDishIsVeg(item.isVeg);
    setDishDescription(item.description || '');
    if (item.variations && item.variations.length > 0) {
      setHasVariations(true);
      setVariationsList(item.variations.map(v => ({ id: v.id, name: v.name, price: v.price })));
    } else {
      setHasVariations(false);
      setVariationsList([
        { id: 'v1', name: 'Half', price: Math.round(item.price * 0.65) },
        { id: 'v2', name: 'Full', price: item.price }
      ]);
    }
    setIsDishModalOpen(true);
  };

  // Add variation row
  const handleAddVariationRow = () => {
    if (!newVarName.trim() || newVarPrice <= 0) return;
    setVariationsList(prev => [
      ...prev,
      { id: 'var_' + Date.now(), name: newVarName.trim(), price: Number(newVarPrice) }
    ]);
    setNewVarName('');
    setNewVarPrice(150);
  };

  const handleRemoveVariationRow = (varId: string) => {
    setVariationsList(prev => prev.filter(v => v.id !== varId));
  };

  // Save Dish (Add or Update)
  const handleSaveDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim()) {
      showToast('Validation Error', 'Dish name cannot be empty', 'error');
      return;
    }
    if (dishPrice <= 0) {
      showToast('Validation Error', 'Dish base price must be greater than 0', 'error');
      return;
    }

    const cleanedVariations = hasVariations && variationsList.length > 0
      ? variationsList.map(v => ({ id: v.id, name: v.name, price: Number(v.price) }))
      : undefined;

    if (editingDish) {
      updateMenuItem({
        ...editingDish,
        name: dishName.trim(),
        category: dishCategory,
        price: Number(dishPrice),
        gstRate: Number(dishGstRate),
        isVeg: dishIsVeg,
        description: dishDescription.trim() || undefined,
        variations: cleanedVariations
      });
    } else {
      addMenuItem({
        name: dishName.trim(),
        category: dishCategory,
        price: Number(dishPrice),
        gstRate: Number(dishGstRate),
        isVeg: dishIsVeg,
        available: true,
        stockStatus: 'available',
        description: dishDescription.trim() || undefined,
        variations: cleanedVariations
      });
    }

    setIsDishModalOpen(false);
  };

  const handleDeleteDish = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from the menu catalog?`)) {
      deleteMenuItem(id);
    }
  };

  // ==========================================
  // STAFF MANAGEMENT STATE
  // ==========================================
  const [staffSearch, setStaffSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});

  // Staff Modal State
  const [isStaffModalOpen, setIsStaffModalOpen] = useState<boolean>(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [staffName, setStaffName] = useState<string>('');
  const [staffEmail, setStaffEmail] = useState<string>('');
  const [staffPhone, setStaffPhone] = useState<string>('');
  const [staffRole, setStaffRole] = useState<UserRole>('cashier');
  const [staffPin, setStaffPin] = useState<string>('3333');
  const [staffBranchId, setStaffBranchId] = useState<BranchId>('main');
  const [staffStatus, setStaffStatus] = useState<'active' | 'inactive'>('active');

  // Filtered Staff list
  const filteredStaff = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(staffSearch.toLowerCase()) ||
        (user.phone && user.phone.includes(staffSearch)) ||
        (user.pin && user.pin.includes(staffSearch));
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, staffSearch, roleFilter]);

  // Staff Stats
  const staffStats = useMemo(() => {
    const total = users.length;
    const cashiers = users.filter(u => u.role === 'cashier').length;
    const waiters = users.filter(u => u.role === 'waiter').length;
    const managers = users.filter(u => u.role === 'manager').length;
    return { total, cashiers, waiters, managers };
  }, [users]);

  // Open Staff Modal for Creating
  const handleOpenAddStaff = () => {
    setEditingStaff(null);
    setStaffName('');
    setStaffEmail('');
    setStaffPhone('+91 98860 ');
    setStaffRole('cashier');
    setStaffPin(Math.floor(1000 + Math.random() * 9000).toString());
    setStaffBranchId('main');
    setStaffStatus('active');
    setIsStaffModalOpen(true);
  };

  // Open Staff Modal for Editing
  const handleOpenEditStaff = (user: User) => {
    setEditingStaff(user);
    setStaffName(user.name);
    setStaffEmail(user.email);
    setStaffPhone(user.phone || '');
    setStaffRole(user.role);
    setStaffPin(user.pin || '1234');
    setStaffBranchId(user.branchId || 'main');
    setStaffStatus(user.status || 'active');
    setIsStaffModalOpen(true);
  };

  // Save Staff (Add or Update)
  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) {
      showToast('Validation Error', 'Staff name is required', 'error');
      return;
    }
    if (!staffEmail.trim() || !staffEmail.includes('@')) {
      showToast('Validation Error', 'Valid staff email is required', 'error');
      return;
    }
    if (!staffPin || !/^\d{4}$/.test(staffPin.trim())) {
      showToast('Validation Error', 'Login PIN must be exactly 4 digits', 'error');
      return;
    }

    const branchName = branches.find(b => b.id === staffBranchId)?.name || 'All Branches';

    if (editingStaff) {
      updateUser({
        ...editingStaff,
        name: staffName.trim(),
        email: staffEmail.trim().toLowerCase(),
        phone: staffPhone.trim(),
        role: staffRole,
        pin: staffPin.trim(),
        branchId: staffBranchId,
        branchName: branchName,
        status: staffStatus
      });
    } else {
      addUser({
        name: staffName.trim(),
        email: staffEmail.trim().toLowerCase(),
        phone: staffPhone.trim(),
        role: staffRole,
        pin: staffPin.trim(),
        branchId: staffBranchId,
        branchName: branchName,
        status: staffStatus
      });
    }

    setIsStaffModalOpen(false);
  };

  const handleDeleteStaff = (user: User) => {
    if (user.id === currentUser?.id) {
      showToast('Action Denied', 'You cannot delete the active administrator account.', 'error');
      return;
    }
    if (window.confirm(`Are you sure you want to remove staff member "${user.name}" (${user.role.toUpperCase()})? Their login PIN will be revoked.`)) {
      deleteUser(user.id);
    }
  };

  const togglePinVisibility = (userId: string) => {
    setShowPins(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'manager':
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
      case 'cashier':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'waiter':
        return 'bg-teal-500/15 text-teal-400 border-teal-500/30';
      case 'admin':
      case 'owner':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'kitchen':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div 
      className="min-h-screen h-full overflow-y-auto w-full pb-16 bg-[#0a0f1d] text-slate-100 flex flex-col font-sans select-none relative"
      style={{ minHeight: '100vh', overflowY: 'auto', backgroundColor: '#0a0f1d' }}
    >
      {/* Bilaal Restaurant Crest Watermark */}
      <BrandWatermark opacity={0.10} />

      {/* ========================================================================= */}
      {/* 1. TOP EXECUTIVE HEADER */}
      {/* ========================================================================= */}
      <header 
        style={{
          background: 'linear-gradient(180deg, #5c0612 0%, #4a030c 100%)',
          backgroundColor: '#580510',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
        }}
        className="sticky top-0 z-40 px-4 py-3 sm:px-6"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Brand & Admin Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-950/40 border border-emerald-400/30 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
                  BILAAL RESTAURANT
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  ADMIN CONSOLE
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Exclusive Backoffice: Menu Catalog &amp; Staff RBAC Management
              </p>
            </div>
          </div>

          {/* Admin Profile & Logout */}
          <div className="flex items-center gap-3">
            {/* Global Light / Dark Theme Toggle */}
            <ThemeToggle />

            <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[11px]">
                A
              </div>
              <div className="text-left">
                <div className="font-bold text-slate-200 leading-tight">
                  {currentUser?.name || 'Administrator'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  PIN: {currentUser?.pin || '9999'} • {currentUser?.email}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              id="admin-logout-btn"
              onClick={logout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 hover:border-rose-600 text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
              title="Sign out of Admin Dashboard and return to login screen"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-3 pt-2 border-t border-slate-800/80 flex items-center gap-2">
          <button
            id="tab-menu-management"
            onClick={() => setActiveSection('menu')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'menu'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 border border-emerald-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Menu Management</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeSection === 'menu' ? 'bg-emerald-800 text-white' : 'bg-slate-800 text-slate-300'
            }`}>
              {menuItems.length}
            </span>
          </button>

          <button
            id="tab-staff-management"
            onClick={() => setActiveSection('staff')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'staff'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 border border-emerald-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff Management</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeSection === 'staff' ? 'bg-emerald-800 text-white' : 'bg-slate-800 text-slate-300'
            }`}>
              {users.length}
            </span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT AREA */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-20 overflow-visible h-auto">
        {/* ======================================================================= */}
        {/* SECTION A: MENU MANAGEMENT (TWO-COLUMN BACKOFFICE DATA-PANEL) */}
        {/* ======================================================================= */}
        {activeSection === 'menu' && (
          <div className="animate-in fade-in duration-150">
            <AdminMenuManager />
          </div>
        )}

        {/* ======================================================================= */}
        {/* SECTION B: STAFF MANAGEMENT */}
        {/* ======================================================================= */}
        {activeSection === 'staff' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Total Staff
                </span>
                <span className="text-xl sm:text-2xl font-black text-white mt-1 block">
                  {staffStats.total}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Configured accounts</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
                <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider block">
                  Cashiers
                </span>
                <span className="text-xl sm:text-2xl font-black text-blue-400 mt-1 block">
                  {staffStats.cashiers}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Counter Billing</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
                <span className="text-[11px] font-semibold text-teal-400 uppercase tracking-wider block">
                  Waiters
                </span>
                <span className="text-xl sm:text-2xl font-black text-teal-400 mt-1 block">
                  {staffStats.waiters}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Floor Service</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
                <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider block">
                  Managers
                </span>
                <span className="text-xl sm:text-2xl font-black text-indigo-400 mt-1 block">
                  {staffStats.managers}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Branch Supervisors</span>
              </div>
            </div>

            {/* Action Bar & Role Filters */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={staffSearch}
                  onChange={e => setStaffSearch(e.target.value)}
                  placeholder="Search staff by name, email, phone, or PIN..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
                {staffSearch && (
                  <button
                    onClick={() => setStaffSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Role filter & Add staff button */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="inline-flex rounded-xl bg-slate-800/80 p-0.5 border border-slate-700/80 text-xs">
                  {['all', 'cashier', 'waiter', 'manager'].map(role => (
                    <button
                      key={role}
                      onClick={() => setRoleFilter(role)}
                      className={`px-2.5 py-1 rounded-lg font-semibold uppercase tracking-wider text-[10px] transition-colors ${
                        roleFilter === role ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>

                <button
                  id="add-staff-btn"
                  onClick={handleOpenAddStaff}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Staff User</span>
                </button>
              </div>
            </div>

            {/* Staff Members List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 h-auto overflow-visible pb-12">
              {filteredStaff.map(user => {
                const isCurrent = user.id === currentUser?.id;
                const isPinVisible = !!showPins[user.id];

                return (
                  <div
                    key={user.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header: Avatar + Role Badge */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-black text-white shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-sm font-bold text-white leading-tight">
                                {user.name}
                              </h3>
                              {isCurrent && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                  YOU
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block">
                              {user.branchName || 'Main Branch'}
                            </span>
                          </div>
                        </div>

                        {/* Role Tag */}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getRoleBadgeStyle(user.role)}`}>
                          {user.role}
                        </span>
                      </div>

                      {/* Credentials Block */}
                      <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                            <Mail className="w-3 h-3" /> Email
                          </span>
                          <span className="font-mono text-[11px] truncate max-w-[180px]">
                            {user.email}
                          </span>
                        </div>

                        {user.phone && (
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                              <Phone className="w-3 h-3" /> Phone
                            </span>
                            <span className="font-mono text-[11px]">
                              {user.phone}
                            </span>
                          </div>
                        )}

                        {/* 4-Digit Login PIN row */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-slate-300">
                          <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                            <KeyRound className="w-3 h-3" /> Login PIN
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold tracking-widest text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                              {isPinVisible ? (user.pin || '1234') : '••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePinVisibility(user.id)}
                              className="text-slate-400 hover:text-slate-200 transition-colors p-0.5"
                              title={isPinVisible ? 'Hide PIN' : 'Reveal PIN'}
                            >
                              {isPinVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${user.status !== 'inactive' ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                        <span className="text-[11px] text-slate-400 capitalize">
                          {user.status || 'active'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Edit Staff */}
                        <button
                          id={`edit-staff-${user.id}`}
                          onClick={() => handleOpenEditStaff(user)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                          title="Edit role, details, or PIN"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        {/* Delete Staff */}
                        {!isCurrent && (
                          <button
                            id={`delete-staff-${user.id}`}
                            onClick={() => handleDeleteStaff(user)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white border border-slate-700 hover:border-rose-600 transition-colors cursor-pointer"
                            title="Delete staff account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredStaff.length === 0 && (
              <div className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-2xl">
                <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-300">No staff members found</h3>
                <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or role filter</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 3. ADD / EDIT DISH MODAL */}
      {/* ========================================================================= */}
      {isDishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
                <span>{editingDish ? 'Edit Dish & Variations' : 'Add New Dish to Catalog'}</span>
              </h2>
              <button
                onClick={() => setIsDishModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDish} className="space-y-3.5 mt-4">
              {/* Dish Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dish Name *
                </label>
                <input
                  type="text"
                  required
                  value={dishName}
                  onChange={e => setDishName(e.target.value)}
                  placeholder="e.g. Chicken Dum Biryani"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Category & Base Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={dishCategory}
                    onChange={e => setDishCategory(e.target.value as MenuCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Base Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={dishPrice}
                    onChange={e => setDishPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* GST Rate & Dietary */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    GST Rate (%)
                  </label>
                  <select
                    value={dishGstRate}
                    onChange={e => setDishGstRate(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5% (Restaurant Regular)</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Dietary Type
                  </label>
                  <button
                    type="button"
                    onClick={() => setDishIsVeg(!dishIsVeg)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border ${
                      dishIsVeg
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-700'
                        : 'bg-rose-950/60 text-rose-400 border-rose-700'
                    }`}
                  >
                    {dishIsVeg ? <Leaf className="w-3.5 h-3.5" /> : <Flame className="w-3.5 h-3.5" />}
                    <span>{dishIsVeg ? 'Vegetarian' : 'Non-Vegetarian'}</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={dishDescription}
                  onChange={e => setDishDescription(e.target.value)}
                  placeholder="Ingredients, preparation notes, serving style..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Variations Toggle */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Multi-Portion Variations
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Configure Half, Full, Family Pack portions with specific rates
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHasVariations(!hasVariations)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                      hasVariations
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {hasVariations ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                {hasVariations && (
                  <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800 mt-2">
                    {/* Existing Variations */}
                    {variationsList.map((v, idx) => (
                      <div key={v.id} className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 w-5 font-mono">{idx + 1}.</span>
                        <input
                          type="text"
                          value={v.name}
                          onChange={e => {
                            const val = e.target.value;
                            setVariationsList(prev => prev.map(item => item.id === v.id ? { ...item, name: val } : item));
                          }}
                          placeholder="Portion name (e.g. Half)"
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                        />
                        <div className="relative w-24">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                          <input
                            type="number"
                            min={1}
                            value={v.price}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setVariationsList(prev => prev.map(item => item.id === v.id ? { ...item, price: val } : item));
                            }}
                            className="w-full pl-5 pr-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariationRow(v.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                          title="Remove variation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {/* Add new variation row */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                      <input
                        type="text"
                        value={newVarName}
                        onChange={e => setNewVarName(e.target.value)}
                        placeholder="Add portion (e.g. Family Pack)"
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700 text-xs text-white placeholder-slate-500"
                      />
                      <div className="relative w-24">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                        <input
                          type="number"
                          min={1}
                          value={newVarPrice}
                          onChange={e => setNewVarPrice(Number(e.target.value))}
                          className="w-full pl-5 pr-2 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700 text-xs text-white font-mono"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddVariationRow}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white border border-slate-700 hover:border-emerald-600 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDishModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40"
                >
                  {editingDish ? 'Update Dish' : 'Save New Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ADD / EDIT STAFF MODAL */}
      {/* ========================================================================= */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>{editingStaff ? 'Edit Staff Member & PIN' : 'Add New Staff Member'}</span>
              </h2>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-3.5 mt-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={e => setStaffName(e.target.value)}
                  placeholder="e.g. Anita Deshmukh"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={staffEmail}
                    onChange={e => setStaffEmail(e.target.value)}
                    placeholder="user@restaurant.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={staffPhone}
                    onChange={e => setStaffPhone(e.target.value)}
                    placeholder="+91 98860 12345"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Role Assignment & 4-Digit Login PIN */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Assigned Role *
                  </label>
                  <select
                    value={staffRole}
                    onChange={e => setStaffRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                  >
                    <option value="cashier">Cashier (Billing &amp; Settlement)</option>
                    <option value="waiter">Waiter (Floor &amp; Ordering)</option>
                    <option value="manager">Manager (Branch Supervisor)</option>
                    <option value="kitchen">Kitchen (KDS Chef)</option>
                    <option value="owner">Owner (Full POS &amp; Reports)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    4-Digit Login PIN *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength={4}
                      pattern="[0-9]{4}"
                      value={staffPin}
                      onChange={e => setStaffPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="e.g. 3333"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-emerald-400 font-mono tracking-widest font-bold focus:outline-none focus:border-emerald-500"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">
                      4 Digits
                    </span>
                  </div>
                </div>
              </div>

              {/* Branch & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Assigned Branch
                  </label>
                  <select
                    value={staffBranchId}
                    onChange={e => setStaffBranchId(e.target.value as BranchId)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="main">Main Branch</option>
                    <option value="city">City Branch</option>
                    <option value="beach">Beach Road Branch</option>
                    <option value="all">All Branches</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Account Status
                  </label>
                  <select
                    value={staffStatus}
                    onChange={e => setStaffStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="active">Active (Permitted to log in)</option>
                    <option value="inactive">Inactive / On Leave (Access Revoked)</option>
                  </select>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40"
                >
                  {editingStaff ? 'Save Changes' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ADD CATEGORY MODAL */}
      {/* ========================================== */}
      {isCategoryModalOpen && (
        <div 
          id="category-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div 
            id="category-modal-card"
            className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-5 text-white animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Add New Category</h3>
                  <p className="text-[11px] text-slate-400">Creates a new menu filter across Admin and POS</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 pt-4">
              {/* Category Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Category Name <span className="text-rose-400">*</span>
                </label>
                <input
                  id="category-name-input"
                  type="text"
                  required
                  autoFocus
                  value={categoryNameInput}
                  onChange={e => setCategoryNameInput(e.target.value)}
                  placeholder="e.g. Soups, Chinese, Rolls, Desserts"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>

              {/* Icon / Emoji Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Optional Icon / Emoji
                </label>
                <div className="flex items-center gap-2 mb-2.5">
                  <input
                    id="category-icon-input"
                    type="text"
                    maxLength={4}
                    value={categoryIconInput}
                    onChange={e => setCategoryIconInput(e.target.value)}
                    placeholder="🍲"
                    className="w-16 px-3 py-2 text-center text-lg rounded-xl bg-slate-800/90 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-xs text-slate-400">
                    Type an emoji or click one from the quick list below:
                  </span>
                </div>

                {/* Quick Emoji Picker */}
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  {['🍲', '🥢', '🥗', '🍕', '🍔', '🍛', '🍢', '🥪', '🍰', '🍦', '🍹', '☕', '🥤', '🥟', '🍣', '🥞'].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setCategoryIconInput(emoji)}
                      className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer ${
                        categoryIconInput === emoji 
                          ? 'bg-emerald-600/30 border border-emerald-500 scale-110 shadow-xs' 
                          : 'bg-slate-800 hover:bg-slate-700 border border-slate-700/60'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview */}
              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Preview in menu filter:</span>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 text-xs font-bold shadow-2xs">
                  {categoryIconInput && <span>{categoryIconInput}</span>}
                  <span>{categoryNameInput.trim() || 'New Category'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="save-category-btn"
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
