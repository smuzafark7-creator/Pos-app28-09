import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { AdminMenuManager } from '../components/admin/AdminMenuManager';
import { BrandWatermark } from '../components/BrandWatermark';
import { 
  MenuItem, 
  MenuCategory, 
  User, 
  UserRole, 
  RestaurantSettings 
} from '../types';
import { 
  ShieldCheck, 
  Utensils, 
  Users, 
  Printer, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Search, 
  Eye, 
  EyeOff, 
  Lock, 
  FileText, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  Phone, 
  Receipt, 
  Percent,
  Sliders,
  ChevronRight,
  UserCheck,
  Shield,
  Clock,
  PrinterCheck
} from 'lucide-react';

type AdminTab = 'menu' | 'users' | 'settings';

export const AdminDashboard: React.FC = () => {
  const { 
    currentUser, 
    menuItems, 
    addMenuItem, 
    updateMenuItem, 
    deleteMenuItem, 
    toggleMenuItemAvailability,
    users, 
    addUser, 
    updateUser, 
    deleteUser,
    restaurantSettings, 
    updateRestaurantSettings,
    openReceiptModal,
    showToast,
    openAdminPinModal
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('menu');

  // ==========================================
  // 1. MENU & VARIATION MANAGER STATE
  // ==========================================
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [menuSearchQuery, setMenuSearchQuery] = useState<string>('');
  const [isDishModalOpen, setIsDishModalOpen] = useState<boolean>(false);
  const [editingDish, setEditingDish] = useState<MenuItem | null>(null);

  // Dish Form state
  const [dishName, setDishName] = useState<string>('');
  const [dishCategory, setDishCategory] = useState<MenuCategory>('Biryani');
  const [dishBasePrice, setDishBasePrice] = useState<number>(280);
  const [dishGstRate, setDishGstRate] = useState<number>(5);
  const [dishIsVeg, setDishIsVeg] = useState<boolean>(false);
  const [dishDescription, setDishDescription] = useState<string>('');
  const [dishHasVariations, setDishHasVariations] = useState<boolean>(true);
  
  // Variations config
  interface VariationRow {
    id: string;
    name: string;
    price: number;
  }
  const [variationsList, setVariationsList] = useState<VariationRow[]>([
    { id: 'v1', name: 'Half', price: 180 },
    { id: 'v2', name: 'Full', price: 320 },
    { id: 'v3', name: 'Family Pack', price: 750 }
  ]);

  const categories: string[] = [
    'All',
    'Biryani',
    'Starters',
    'Main Course',
    'Breads',
    'Rice',
    'Beverages',
    'Desserts'
  ];

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchSearch = item.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(menuSearchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [menuItems, selectedCategory, menuSearchQuery]);

  const handleOpenAddDish = () => {
    setEditingDish(null);
    setDishName('');
    setDishCategory('Biryani');
    setDishBasePrice(280);
    setDishGstRate(5);
    setDishIsVeg(false);
    setDishDescription('');
    setDishHasVariations(true);
    setVariationsList([
      { id: 'v1', name: 'Half', price: 180 },
      { id: 'v2', name: 'Full', price: 320 },
      { id: 'v3', name: 'Family Pack', price: 750 }
    ]);
    setIsDishModalOpen(true);
  };

  const handleOpenEditDish = (dish: MenuItem) => {
    setEditingDish(dish);
    setDishName(dish.name);
    setDishCategory(dish.category);
    setDishBasePrice(dish.price);
    setDishGstRate(dish.gstRate);
    setDishIsVeg(dish.isVeg);
    setDishDescription(dish.description || '');

    if (dish.variations && dish.variations.length > 0) {
      setDishHasVariations(true);
      setVariationsList(dish.variations.map((v, i) => ({
        id: v.id || `v_${i}`,
        name: v.name,
        price: v.price
      })));
    } else {
      setDishHasVariations(false);
      setVariationsList([
        { id: 'v1', name: 'Half', price: Math.round(dish.price * 0.65) },
        { id: 'v2', name: 'Full', price: dish.price },
        { id: 'v3', name: 'Family Pack', price: Math.round(dish.price * 2.3) }
      ]);
    }
    setIsDishModalOpen(true);
  };

  const handleAddVariationRow = () => {
    setVariationsList(prev => [
      ...prev,
      { id: 'v_' + Date.now(), name: 'Special Portion', price: dishBasePrice }
    ]);
  };

  const handleRemoveVariationRow = (id: string) => {
    setVariationsList(prev => prev.filter(v => v.id !== id));
  };

  const handleSaveDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim()) {
      showToast('Validation Error', 'Dish name cannot be empty', 'error');
      return;
    }

    const compiledVariations = dishHasVariations 
      ? variationsList.filter(v => v.name.trim() && v.price > 0).map(v => ({
          id: v.id,
          name: v.name.trim(),
          price: Number(v.price)
        }))
      : undefined;

    if (editingDish) {
      updateMenuItem({
        ...editingDish,
        name: dishName.trim(),
        category: dishCategory,
        price: dishBasePrice,
        gstRate: dishGstRate,
        isVeg: dishIsVeg,
        description: dishDescription.trim() || undefined,
        variations: compiledVariations
      });
    } else {
      addMenuItem({
        name: dishName.trim(),
        category: dishCategory,
        price: dishBasePrice,
        gstRate: dishGstRate,
        isVeg: dishIsVeg,
        available: true,
        description: dishDescription.trim() || undefined,
        variations: compiledVariations
      });
    }

    setIsDishModalOpen(false);
  };

  const handleDeleteDishConfirm = (dish: MenuItem) => {
    if (window.confirm(`Are you sure you want to delete "${dish.name}" from the menu catalog? This cannot be undone.`)) {
      deleteMenuItem(dish.id);
    }
  };

  // ==========================================
  // 2. STAFF & RBAC STATE
  // ==========================================
  const [isStaffModalOpen, setIsStaffModalOpen] = useState<boolean>(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [staffName, setStaffName] = useState<string>('');
  const [staffRole, setStaffRole] = useState<UserRole>('waiter');
  const [staffPin, setStaffPin] = useState<string>('1234');
  const [staffPhone, setStaffPhone] = useState<string>('+91 98765 43210');
  const [staffStatus, setStaffStatus] = useState<'active' | 'inactive'>('active');
  const [showPinsMap, setShowPinsMap] = useState<Record<string, boolean>>({});

  const toggleShowPin = (userId: string) => {
    setShowPinsMap(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleOpenAddStaff = () => {
    setEditingStaff(null);
    setStaffName('');
    setStaffRole('waiter');
    setStaffPin('1234');
    setStaffPhone('+91 98765 00000');
    setStaffStatus('active');
    setIsStaffModalOpen(true);
  };

  const handleOpenEditStaff = (user: User) => {
    setEditingStaff(user);
    setStaffName(user.name);
    setStaffRole(user.role);
    setStaffPin(user.pin || '1234');
    setStaffPhone(user.phone || '+91 98765 00000');
    setStaffStatus(user.status || 'active');
    setIsStaffModalOpen(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) {
      showToast('Validation Error', 'Staff name is required', 'error');
      return;
    }
    if (!/^\d{4}$/.test(staffPin.trim())) {
      showToast('Invalid PIN', 'PIN must be exactly 4 numeric digits', 'error');
      return;
    }

    if (editingStaff) {
      updateUser({
        ...editingStaff,
        name: staffName.trim(),
        role: staffRole,
        pin: staffPin.trim(),
        phone: staffPhone.trim(),
        status: staffStatus
      });
    } else {
      addUser({
        name: staffName.trim(),
        role: staffRole,
        pin: staffPin.trim(),
        phone: staffPhone.trim(),
        status: staffStatus
      });
    }
    setIsStaffModalOpen(false);
  };

  const handleDeleteStaffConfirm = (user: User) => {
    if (window.confirm(`Are you sure you want to revoke access and remove ${user.name} (${user.role.toUpperCase()})?`)) {
      deleteUser(user.id);
    }
  };

  // ==========================================
  // 3. RESTAURANT SETTINGS & PRINTER PROFILE STATE
  // ==========================================
  const [settingsForm, setSettingsForm] = useState<RestaurantSettings>(() => restaurantSettings);

  const handleSettingsChange = (field: keyof RestaurantSettings, value: any) => {
    setSettingsForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveRestaurantSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const cgstVal = settingsForm.cgstPercent ?? 5;
    const sgstVal = settingsForm.sgstPercent ?? 5;
    const totalTax = Number((cgstVal + sgstVal).toFixed(2));
    updateRestaurantSettings({
      ...settingsForm,
      cgstPercent: cgstVal,
      sgstPercent: sgstVal,
      defaultTaxPercent: totalTax
    });
    showToast('Settings Saved', `Restaurant settings updated. Total GST Applied: ${totalTax}% (${cgstVal}% CGST + ${sgstVal}% SGST)`, 'success');
  };

  const handleTestPrint = () => {
    // Generate a quick sample receipt payload
    const dummyBill = {
      id: 'test_print_bill',
      billNumber: 'INV-TEST-001',
      kotId: 'kot_test',
      tableId: 'T1',
      tableName: 'Table 01',
      branchId: 'main',
      waiterName: 'Anita (Cashier)',
      stewardName: 'Captain Ramesh',
      orderType: 'dine_in' as const,
      paymentMethod: 'cash' as const,
      status: 'paid' as const,
      subtotal: 580,
      tax: 29,
      discountPercent: 0,
      discountAmount: 0,
      roundOff: 1,
      grandTotal: 610,
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
      fssaiLicNo: settingsForm.fssai || '11223334000128',
      items: [
        { id: 'i1', name: 'Chicken Dum Biryani (Full)', quantity: 1, rate: 320, amount: 320 },
        { id: 'i2', name: 'Chicken 65', quantity: 1, rate: 260, amount: 260 }
      ]
    };
    openReceiptModal(dummyBill);
    showToast('Test Receipt Ready', 'Thermal test invoice preview generated.', 'success');
  };

  const isOwner = currentUser?.role === 'owner' || currentUser?.role === 'manager';

  return (
    <div 
      className="flex-1 bg-[#0a0f1d] text-slate-100 min-h-screen p-4 sm:p-6 overflow-y-auto font-sans relative"
      style={{ backgroundColor: '#0a0f1d' }}
    >
      {/* Bilaal Restaurant Crest Watermark */}
      <BrandWatermark opacity={0.10} />

      {/* Top Banner & Header */}
      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        
        {/* Admin Backoffice Header */}
        <div className="bg-[#0b1320] border border-emerald-500/40 rounded-3xl p-5 shadow-[0_0_20px_rgba(16,185,129,0.12)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-500/10">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-wide">
                  Admin Backoffice & Control Center
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
                  Live RBAC
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage dynamic portion pricing, staff authentication credentials, and thermal printer profiles.
              </p>
            </div>
          </div>

          {/* Current Clearance Indicator */}
          <div className="flex items-center gap-3">
            <div className="bg-[#080e18] border border-slate-700/80 rounded-2xl px-4 py-2 flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <div className="text-left">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Session</div>
                <div className="text-xs font-bold text-white flex items-center gap-1">
                  <span>{currentUser?.name || 'Administrator'}</span>
                  <span className="text-emerald-400 uppercase text-[10px]">({currentUser?.role})</span>
                </div>
              </div>
            </div>

            {!isOwner && (
              <button
                type="button"
                onClick={() => openAdminPinModal()}
                className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold transition-all cursor-pointer"
              >
                Elevate to Owner
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation (Emerald Pill Style) */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveAdminTab('menu')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
              activeAdminTab === 'menu'
                ? 'bg-[#0d4a3e] border border-emerald-500/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Utensils className="w-4 h-4 text-emerald-400" />
            <span>Menu & Variation Manager</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 text-[10px] font-mono">
              {menuItems.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('users')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
              activeAdminTab === 'users'
                ? 'bg-[#0d4a3e] border border-emerald-500/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Staff & RBAC Credentials</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 text-[10px] font-mono">
              {users.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('settings')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
              activeAdminTab === 'settings'
                ? 'bg-[#0d4a3e] border border-emerald-500/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Restaurant Profile & Thermal Printer</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: MENU & VARIATION MANAGER (TWO-COLUMN DATA-PANEL)   */}
        {/* ======================================================== */}
        {activeAdminTab === 'menu' && (
          <div className="animate-in fade-in duration-200">
            <AdminMenuManager />
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: STAFF & RBAC (USER MANAGEMENT)                     */}
        {/* ======================================================== */}
        {activeAdminTab === 'users' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* RBAC Overview Matrix Card */}
            <div className="bg-[#0b1320] border border-emerald-500/30 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
                  Role-Based Access Control (RBAC) Architecture
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#060b17] border border-emerald-500/30">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Admin / Owner (Full Access)</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Full catalog control, portion price modifications, user CRUD, PIN management, thermal printer configuration, and consolidated financial reports.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#060b17] border border-indigo-500/30">
                  <div className="font-bold text-indigo-300 flex items-center gap-1.5 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    <span>Cashier (Billing & Settlement)</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Order punching, bill generation, discount application, split payments, and receipt printing. <span className="text-rose-300 font-semibold">Cannot edit menu prices or delete dishes.</span>
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#060b17] border border-amber-500/30">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Waiter / Captain (Floor Ops)</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Table occupancy view, floor ordering, guest kitchen notes, and instant KOT ticket generation. Restrained from revenue registers and settings.
                  </p>
                </div>
              </div>
            </div>

            {/* Staff Directory Card */}
            <div className="bg-[#0b1320] border border-[#1e293b] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Staff Member Directory</h3>
                  <p className="text-xs text-slate-400">Configure login PINs, phone contacts, and assigned roles.</p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddStaff}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add Staff Member</span>
                </button>
              </div>

              {/* Staff Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-700/80 text-slate-400 font-semibold">
                    <tr>
                      <th className="pb-3 px-3">Staff Name</th>
                      <th className="pb-3 px-3">Role & Clearance</th>
                      <th className="pb-3 px-3">Phone</th>
                      <th className="pb-3 px-3">Login PIN</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {users.map(u => {
                      const isPinVisible = showPinsMap[u.id];
                      return (
                        <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-3 font-sans font-bold text-white">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-center text-xs">
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <span>{u.name}</span>
                                {currentUser?.id === u.id && (
                                  <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                                    YOU
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              u.role === 'owner' 
                                ? 'bg-emerald-900/60 border border-emerald-500/50 text-emerald-300' 
                                : u.role === 'manager'
                                ? 'bg-indigo-900/60 border border-indigo-500/50 text-indigo-300'
                                : u.role === 'cashier'
                                ? 'bg-amber-900/60 border border-amber-500/50 text-amber-300'
                                : 'bg-slate-800 border border-slate-600 text-slate-300'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-300">
                            {u.phone || '+91 98765 00000'}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold tracking-widest text-emerald-400">
                                {isPinVisible ? (u.pin || '1234') : '••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleShowPin(u.id)}
                                className="text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
                                title={isPinVisible ? 'Hide PIN' : 'Reveal PIN'}
                              >
                                {isPinVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              (u.status || 'active') === 'active' 
                                ? 'bg-emerald-500/10 text-emerald-400' 
                                : 'bg-rose-500/10 text-rose-400'
                            }`}>
                              {u.status || 'active'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditStaff(u)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                                title="Edit Staff Member"
                              >
                                <Edit className="w-3.5 h-3.5 text-emerald-400" />
                              </button>
                              {currentUser?.id !== u.id && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStaffConfirm(u)}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-white/10 hover:border-rose-500/40 transition-colors cursor-pointer"
                                  title="Delete Staff"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: RESTAURANT PROFILE & THERMAL PRINTER PROFILE       */}
        {/* ======================================================== */}
        {activeAdminTab === 'settings' && (
          <form onSubmit={handleSaveRestaurantSettings} className="space-y-6 animate-in fade-in duration-200">
            {/* Restaurant Legal & Contact Profile */}
            <div className="bg-[#0b1320] border border-[#1e293b] rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Restaurant Business Profile</h3>
                  <p className="text-xs text-slate-400">These details print directly onto customer tax invoices & receipts.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Restaurant Name</label>
                  <input
                    type="text"
                    value={settingsForm.name}
                    onChange={e => handleSettingsChange('name', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#060b17] border border-slate-700/80 text-white text-xs focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Zaffran Flavours"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Contact Phone</label>
                  <input
                    type="text"
                    value={settingsForm.phone}
                    onChange={e => handleSettingsChange('phone', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#060b17] border border-slate-700/80 text-white text-xs focus:outline-none focus:border-emerald-500"
                    placeholder="+91 80 2345 6789"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Address (Printed on Bill)</label>
                  <textarea
                    rows={2}
                    value={settingsForm.address}
                    onChange={e => handleSettingsChange('address', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#060b17] border border-slate-700/80 text-white text-xs focus:outline-none focus:border-emerald-500"
                    placeholder="Street, locality, city, postal code"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">GSTIN Number</label>
                  <input
                    type="text"
                    value={settingsForm.gstin}
                    onChange={e => handleSettingsChange('gstin', e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl bg-[#060b17] border border-slate-700/80 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="29AAAAA0000A1Z5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">FSSAI License Number</label>
                  <input
                    type="text"
                    value={settingsForm.fssai}
                    onChange={e => handleSettingsChange('fssai', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#060b17] border border-slate-700/80 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="11223334000128"
                  />
                </div>

                {/* Tax Configuration: Split CGST & SGST */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        CGST % <span className="text-slate-400 font-normal text-[11px]">(Default: 5%)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="50"
                          value={settingsForm.cgstPercent ?? 5}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            handleSettingsChange('cgstPercent', val);
                            handleSettingsChange('defaultTaxPercent', val + (settingsForm.sgstPercent ?? 5));
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-[#060b17] border border-slate-700/80 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                          placeholder="5.0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">%</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        SGST % <span className="text-slate-400 font-normal text-[11px]">(Default: 5%)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="50"
                          value={settingsForm.sgstPercent ?? 5}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            handleSettingsChange('sgstPercent', val);
                            handleSettingsChange('defaultTaxPercent', (settingsForm.cgstPercent ?? 5) + val);
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-[#060b17] border border-slate-700/80 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                          placeholder="5.0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic calculation helper */}
                  <div className="mt-2.5 px-3 py-2 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-300">
                      Total GST Applied: <span className="font-mono font-bold text-emerald-400">
                        {((settingsForm.cgstPercent ?? 5) + (settingsForm.sgstPercent ?? 5)).toFixed(1)}%
                      </span>
                    </span>
                    <span className="text-[11px] text-emerald-400/80">
                      ({settingsForm.cgstPercent ?? 5}% CGST + {settingsForm.sgstPercent ?? 5}% SGST)
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Receipt Footer Message</label>
                  <input
                    type="text"
                    value={settingsForm.footerMessage}
                    onChange={e => handleSettingsChange('footerMessage', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#060b17] border border-slate-700/80 text-white text-xs focus:outline-none focus:border-emerald-500"
                    placeholder="Thank you for dining with us! Please visit again."
                  />
                </div>
              </div>
            </div>

            {/* Thermal Printer Profile & Hardware Settings */}
            <div className="bg-[#0b1320] border border-[#1e293b] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Thermal Printer Profile</h3>
                    <p className="text-xs text-slate-400">Configure paper roll width, auto-cut cutter, and print copies.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTestPrint}
                  className="px-3 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <PrinterCheck className="w-4 h-4" />
                  <span>Instant Test Print</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Paper Width Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Paper Roll Width</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSettingsChange('printerPaperWidth', '80mm')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        settingsForm.printerPaperWidth === '80mm'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                          : 'bg-[#060b17] text-slate-300 border-slate-700/80 hover:border-slate-500'
                      }`}
                    >
                      80mm (Standard POS)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSettingsChange('printerPaperWidth', '58mm')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        settingsForm.printerPaperWidth === '58mm'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                          : 'bg-[#060b17] text-slate-300 border-slate-700/80 hover:border-slate-500'
                      }`}
                    >
                      58mm (Compact Mobile)
                    </button>
                  </div>
                </div>

                {/* Auto-Cut Option */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Auto-Cut Paper</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSettingsChange('printerAutoCut', true)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        settingsForm.printerAutoCut
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                          : 'bg-[#060b17] text-slate-300 border-slate-700/80 hover:border-slate-500'
                      }`}
                    >
                      Enabled
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSettingsChange('printerAutoCut', false)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        !settingsForm.printerAutoCut
                          ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                          : 'bg-[#060b17] text-slate-300 border-slate-700/80 hover:border-slate-500'
                      }`}
                    >
                      Disabled
                    </button>
                  </div>
                </div>

                {/* Print Copies */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Print Copies</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleSettingsChange('printCopies', num)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          settingsForm.printCopies === num
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                            : 'bg-[#060b17] text-slate-300 border-slate-700/80 hover:border-slate-500'
                        }`}
                      >
                        {num} {num === 1 ? 'Copy' : 'Copies'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Save Restaurant & Printer Settings</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT DISH WITH PORTIONS CONFIGURATOR        */}
      {/* ======================================================== */}
      {isDishModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setIsDishModalOpen(false)}
        >
          <div 
            className="bg-[#0b1320] border-2 border-emerald-500/80 rounded-3xl w-full max-w-xl text-white shadow-[0_0_30px_rgba(16,185,129,0.25)] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 bg-[#080e18] border-b border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-950/70 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide font-mono">
                    {editingDish ? 'Edit Dish Details & Variations' : 'Add New Dish to Catalog'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Configure prices, GST, and multiple portion sizes.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDishModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveDish} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Dish Name</label>
                  <input
                    type="text"
                    value={dishName}
                    onChange={e => setDishName(e.target.value)}
                    placeholder="e.g. Mutton Rogan Josh"
                    className="w-full px-3 py-2 rounded-xl bg-[#060b17] border border-slate-700/80 text-white text-xs focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={dishCategory}
                    onChange={e => setDishCategory(e.target.value as MenuCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-[#060b17] border border-slate-700/80 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    {categories.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat} className="bg-[#060b17] text-white">{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Base Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={dishBasePrice}
                    onChange={e => setDishBasePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#060b17] border border-slate-700/80 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Dietary Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDishIsVeg(true)}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        dishIsVeg ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-[#060b17] text-slate-400 border-slate-700'
                      }`}
                    >
                      Veg
                    </button>
                    <button
                      type="button"
                      onClick={() => setDishIsVeg(false)}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        !dishIsVeg ? 'bg-rose-600 text-white border-rose-500' : 'bg-[#060b17] text-slate-400 border-slate-700'
                      }`}
                    >
                      Non-Veg
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">GST Rate (%)</label>
                  <select
                    value={dishGstRate}
                    onChange={e => setDishGstRate(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#060b17] border border-slate-700/80 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  >
                    <option value={0}>0% (Tax Exempt)</option>
                    <option value={5}>5% (Restaurant Standard)</option>
                    <option value={12}>12%</option>
                    <option value={18}>18% (Alcohol / Premium)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={dishDescription}
                  onChange={e => setDishDescription(e.target.value)}
                  placeholder="Ingredients or allergen notes..."
                  className="w-full px-3 py-2 rounded-xl bg-[#060b17] border border-slate-700/80 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Dynamic Portions & Variations Section */}
              <div className="pt-3 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Multiple Portion Sizes (Half / Full / Family)</span>
                    </span>
                    <p className="text-[10px] text-slate-400">These will appear in the Variation Modal on the POS.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDishHasVariations(prev => !prev)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      dishHasVariations
                        ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-slate-400'
                    }`}
                  >
                    {dishHasVariations ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                {dishHasVariations && (
                  <div className="space-y-2 mt-2 bg-[#060b17] p-3 rounded-2xl border border-slate-800">
                    {variationsList.map((varRow, index) => (
                      <div key={varRow.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={varRow.name}
                          onChange={e => {
                            const val = e.target.value;
                            setVariationsList(prev => prev.map(item => item.id === varRow.id ? { ...item, name: val } : item));
                          }}
                          placeholder="e.g. Half / Full"
                          className="flex-1 px-3 py-1.5 rounded-xl bg-[#0b1320] border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                          required
                        />

                        <div className="relative w-28">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">₹</span>
                          <input
                            type="number"
                            min="1"
                            value={varRow.price}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setVariationsList(prev => prev.map(item => item.id === varRow.id ? { ...item, price: val } : item));
                            }}
                            className="w-full pl-6 pr-2 py-1.5 rounded-xl bg-[#0b1320] border border-slate-700 text-xs text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-500"
                            required
                          />
                        </div>

                        {variationsList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVariationRow(varRow.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                            title="Remove portion"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddVariationRow}
                      className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer py-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Another Portion (e.g. Jumbo / Family)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDishModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-xs text-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  {editingDish ? 'Update Dish' : 'Add Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT STAFF MEMBER & PIN                     */}
      {/* ======================================================== */}
      {isStaffModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setIsStaffModalOpen(false)}
        >
          <div 
            className="bg-[#0b1320] border-2 border-emerald-500/80 rounded-3xl w-full max-w-md text-white shadow-[0_0_30px_rgba(16,185,129,0.25)] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 bg-[#080e18] border-b border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-950/70 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide font-mono">
                    {editingStaff ? 'Edit Staff Profile & PIN' : 'Add New Staff Member'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Assign role and 4-digit security PIN.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsStaffModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveStaff} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={staffName}
                  onChange={e => setStaffName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 rounded-xl bg-[#060b17] border border-slate-700/80 text-white text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Role / Access Clearance</label>
                <select
                  value={staffRole}
                  onChange={e => setStaffRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl bg-[#060b17] border border-slate-700/80 text-white text-xs focus:outline-none focus:border-emerald-500 uppercase font-mono"
                >
                  <option value="owner">Owner (Full Admin Access)</option>
                  <option value="manager">Manager (Supervisor)</option>
                  <option value="cashier">Cashier (Billing & Settlements)</option>
                  <option value="waiter">Waiter / Captain (Floor Ordering)</option>
                  <option value="kitchen">Kitchen / Chef (KDS Only)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">4-Digit Login PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  value={staffPin}
                  onChange={e => setStaffPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="4 digits (e.g. 1234)"
                  className="w-full px-3 py-2 rounded-xl bg-[#060b17] border border-slate-700/80 text-emerald-300 text-sm font-mono tracking-widest focus:outline-none focus:border-emerald-500"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">Used to unlock the terminal and authenticate in the PIN modal.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={staffPhone}
                  onChange={e => setStaffPhone(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="w-full px-3 py-2 rounded-xl bg-[#060b17] border border-slate-700/80 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStaffStatus('active')}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      staffStatus === 'active' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-[#060b17] text-slate-400 border-slate-700'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setStaffStatus('inactive')}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      staffStatus === 'inactive' ? 'bg-rose-600 text-white border-rose-500' : 'bg-[#060b17] text-slate-400 border-slate-700'
                    }`}
                  >
                    Inactive / On Leave
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-xs text-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  {editingStaff ? 'Save Changes' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
