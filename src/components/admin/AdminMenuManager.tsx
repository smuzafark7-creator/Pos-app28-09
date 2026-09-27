import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  X, 
  Edit2, 
  Trash2, 
  Tag, 
  Check, 
  FolderTree, 
  Layers, 
  UtensilsCrossed, 
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MenuItem, MenuCategory, ItemVariation } from '../../types';

interface VariationRow {
  id: string;
  name: string;
  price: number;
}

export const AdminMenuManager: React.FC = () => {
  const {
    menuItems = [],
    categories = [],
    categoryIcons = {},
    addCategory,
    updateCategory,
    deleteCategory,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleMenuItemAvailability,
    showToast,
  } = useApp();

  // ==========================================
  // FILTER & SEARCH STATE
  // ==========================================
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<'all' | 'available' | 'sold_out'>('all');

  // ==========================================
  // CATEGORY MODALS & EDIT STATE
  // ==========================================
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);
  const [categoryNameInput, setCategoryNameInput] = useState<string>('');
  const [categoryIconInput, setCategoryIconInput] = useState<string>('🍲');

  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // ==========================================
  // DISH MODAL & FORM STATE
  // ==========================================
  const [isDishModalOpen, setIsDishModalOpen] = useState<boolean>(false);
  const [editingDish, setEditingDish] = useState<MenuItem | null>(null);
  const [dishToDelete, setDishToDelete] = useState<MenuItem | null>(null);

  const [dishName, setDishName] = useState<string>('');
  const [dishCategory, setDishCategory] = useState<string>('Biryani');
  const [dishPrice, setDishPrice] = useState<number>(280);
  const [dishGstRate, setDishGstRate] = useState<number>(5);
  const [dishIsVeg, setDishIsVeg] = useState<boolean>(false);
  const [dishDescription, setDishDescription] = useState<string>('');
  const [hasVariations, setHasVariations] = useState<boolean>(false);
  const [variationsList, setVariationsList] = useState<VariationRow[]>([]);
  const [newVarName, setNewVarName] = useState<string>('');
  const [newVarPrice, setNewVarPrice] = useState<number>(150);

  // Quick Emoji options for categories
  const quickEmojis = ['🍛', '🍢', '🍲', '🫓', '🍚', '🍹', '🍨', '🥢', '🥗', '🍕', '🍔', '🥟', '🥪', '🍰', '☕', '🥤'];

  // ==========================================
  // COMPUTED METRICS & COUNTS
  // ==========================================
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (menuItems || []).forEach(item => {
      const cat = item.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [menuItems]);

  const stockCounts = useMemo(() => {
    let available = 0;
    let soldOut = 0;
    (menuItems || []).forEach(i => {
      if (i.available) available++;
      else soldOut++;
    });
    return {
      all: menuItems.length,
      available,
      soldOut,
    };
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return (menuItems || []).filter(item => {
      // Category filter
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;

      // Search filter
      const matchesSearch = !q ||
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q));

      // Stock filter
      const matchesStock = 
        stockFilter === 'all' ||
        (stockFilter === 'available' && item.available) ||
        (stockFilter === 'sold_out' && !item.available);

      return matchesCategory && matchesSearch && matchesStock;
    });
  }, [menuItems, selectedCategory, searchQuery, stockFilter]);

  // ==========================================
  // CATEGORY ACTIONS
  // ==========================================
  const handleOpenAddCategory = () => {
    setEditingCategoryName(null);
    setCategoryNameInput('');
    setCategoryIconInput('🍲');
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategoryName(cat);
    setCategoryNameInput(cat);
    setCategoryIconInput(categoryIcons[cat] || '🍲');
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = categoryNameInput.trim();
    if (!trimmed) {
      showToast('Validation Error', 'Category name cannot be empty', 'error');
      return;
    }

    if (editingCategoryName) {
      if (updateCategory) {
        const success = updateCategory(editingCategoryName, trimmed, categoryIconInput.trim());
        if (success) {
          if (selectedCategory === editingCategoryName) {
            setSelectedCategory(trimmed);
          }
          setIsCategoryModalOpen(false);
        }
      } else {
        showToast('Updated', `Category ${trimmed} updated`);
        setIsCategoryModalOpen(false);
      }
    } else {
      const success = addCategory(trimmed, categoryIconInput.trim());
      if (success) {
        setSelectedCategory(trimmed);
        setIsCategoryModalOpen(false);
      }
    }
  };

  const confirmDeleteCategory = (cat: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCategoryToDelete(cat);
  };

  const executeDeleteCategory = () => {
    if (!categoryToDelete) return;
    if (deleteCategory) {
      deleteCategory(categoryToDelete);
    }
    if (selectedCategory === categoryToDelete) {
      setSelectedCategory('All');
    }
    setCategoryToDelete(null);
  };

  // ==========================================
  // DISH ACTIONS
  // ==========================================
  const handleOpenAddDish = () => {
    setEditingDish(null);
    setDishName('');
    setDishCategory(selectedCategory !== 'All' ? selectedCategory : (categories[1] || 'Biryani'));
    setDishPrice(280);
    setDishGstRate(5);
    setDishIsVeg(false);
    setDishDescription('');
    setHasVariations(false);
    setVariationsList([]);
    setNewVarName('');
    setNewVarPrice(150);
    setIsDishModalOpen(true);
  };

  const handleOpenEditDish = (dish: MenuItem) => {
    setEditingDish(dish);
    setDishName(dish.name);
    setDishCategory(dish.category);
    setDishPrice(dish.price);
    setDishGstRate(dish.gstRate ?? 5);
    setDishIsVeg(dish.isVeg);
    setDishDescription(dish.description || '');

    if (dish.variations && dish.variations.length > 0) {
      setHasVariations(true);
      setVariationsList(dish.variations.map(v => ({ id: v.id, name: v.name, price: v.price })));
    } else {
      setHasVariations(false);
      setVariationsList([]);
    }
    setNewVarName('');
    setNewVarPrice(150);
    setIsDishModalOpen(true);
  };

  const handleAddVariationRow = () => {
    if (!newVarName.trim()) {
      showToast('Validation Error', 'Portion name required (e.g. Half, Full)', 'warning');
      return;
    }
    const newRow: VariationRow = {
      id: `var_${Date.now()}`,
      name: newVarName.trim(),
      price: newVarPrice > 0 ? newVarPrice : dishPrice,
    };
    setVariationsList(prev => [...prev, newRow]);
    setNewVarName('');
    setNewVarPrice(150);
  };

  const handleRemoveVariationRow = (id: string) => {
    setVariationsList(prev => prev.filter(v => v.id !== id));
  };

  const handleSaveDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim()) {
      showToast('Validation Error', 'Please enter a dish name', 'error');
      return;
    }

    const cleanedVariations: ItemVariation[] | undefined = hasVariations && variationsList.length > 0
      ? variationsList.map(v => ({ id: v.id, name: v.name, price: v.price }))
      : undefined;

    if (editingDish) {
      const updated: MenuItem = {
        ...editingDish,
        name: dishName.trim(),
        category: dishCategory as MenuCategory,
        price: dishPrice,
        gstRate: dishGstRate,
        isVeg: dishIsVeg,
        description: dishDescription.trim() || undefined,
        variations: cleanedVariations,
      };
      updateMenuItem(updated);
    } else {
      addMenuItem({
        name: dishName.trim(),
        category: dishCategory as MenuCategory,
        price: dishPrice,
        gstRate: dishGstRate,
        isVeg: dishIsVeg,
        description: dishDescription.trim() || undefined,
        available: true,
        variations: cleanedVariations,
      });
    }

    setIsDishModalOpen(false);
  };

  const confirmDeleteDish = (dish: MenuItem) => {
    setDishToDelete(dish);
  };

  const executeDeleteDish = () => {
    if (!dishToDelete) return;
    deleteMenuItem(dishToDelete.id);
    setDishToDelete(null);
  };

  return (
    <div id="admin-menu-manager-container" className="space-y-4">
      {/* TWO-COLUMN BACKOFFICE DATA-PANEL */}
      <div className="bg-[#0b1320] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col lg:flex-row min-h-[680px]">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: CATEGORIES MANAGER (25% WIDTH) */}
        {/* ========================================================================= */}
        <div 
          id="categories-manager-column"
          className="w-full lg:w-1/4 lg:max-w-[280px] shrink-0 bg-[#090f19] border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col"
        >
          {/* Header & Pinned Add Category Button */}
          <div className="p-3.5 border-b border-slate-800/80 space-y-3 bg-[#090f19]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-950/70 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <FolderTree className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Categories
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {categories.filter(c => c !== 'All').length} Active Groups
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-800/40">
                {menuItems.length} Dishes
              </span>
            </div>

            {/* Pinned Add Category Button */}
            <button
              id="pinned-add-category-btn"
              onClick={handleOpenAddCategory}
              className="w-full py-2 px-3 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/40 hover:border-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
              title="Add a new menu category"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Category</span>
            </button>
          </div>

          {/* Vertical Scrollable Category List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[600px] scrollbar-thin scrollbar-thumb-slate-800">
            {/* All Dishes Category */}
            <div
              id="category-item-all"
              onClick={() => setSelectedCategory('All')}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                selectedCategory === 'All'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Layers className={`w-3.5 h-3.5 shrink-0 ${selectedCategory === 'All' ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="truncate">All Dishes</span>
              </div>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md font-bold shrink-0 ${
                selectedCategory === 'All'
                  ? 'bg-emerald-500/30 text-emerald-200'
                  : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
              }`}>
                {menuItems.length}
              </span>
            </div>

            {/* Individual Categories */}
            {categories.filter(cat => cat !== 'All').map(cat => {
              const isSelected = selectedCategory === cat;
              const count = categoryCounts[cat] || 0;
              const icon = categoryIcons[cat] || '🍽️';

              return (
                <div
                  key={cat}
                  id={`category-item-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => setSelectedCategory(cat)}
                  className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-emerald-500/15 text-emerald-300 font-bold border-emerald-500/40 shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-1">
                    <span className="text-sm shrink-0 leading-none">{icon}</span>
                    <span className="truncate">{cat}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Hover Quick Actions */}
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <button
                        type="button"
                        onClick={e => handleOpenEditCategory(cat, e)}
                        className="p-1 rounded-md text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                        title={`Edit "${cat}"`}
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={e => confirmDeleteCategory(cat, e)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                        title={`Delete "${cat}"`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Dish Count Badge */}
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md font-bold ${
                      isSelected
                        ? 'bg-emerald-500/30 text-emerald-200'
                        : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                    }`}>
                      {count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Left Column Footer note */}
          <div className="p-2.5 border-t border-slate-800/80 bg-[#070c14] text-[10px] text-slate-500 flex items-center justify-between">
            <span>Filter Active:</span>
            <span className="text-emerald-400 font-semibold truncate max-w-[120px]">{selectedCategory}</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: DISHES & VARIATIONS TABLE (75% WIDTH) */}
        {/* ========================================================================= */}
        <div 
          id="dishes-table-column"
          className="flex-1 flex flex-col bg-[#0b1320] min-w-0"
        >
          {/* Top Bar: Search, Stock Filter, Add New Dish */}
          <div className="p-3.5 border-b border-slate-800 bg-[#0c1424] flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                id="admin-menu-search-input"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search dishes by name, code, description..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Right Controls: Stock Filters & Add Dish */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              {/* Stock Filter Pills */}
              <div className="inline-flex rounded-xl bg-slate-900 p-0.5 border border-slate-700/80 text-xs">
                <button
                  id="filter-stock-all"
                  onClick={() => setStockFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    stockFilter === 'all'
                      ? 'bg-slate-700 text-white shadow-2xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({stockCounts.all})
                </button>
                <button
                  id="filter-stock-available"
                  onClick={() => setStockFilter('available')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    stockFilter === 'available'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>In Stock ({stockCounts.available})</span>
                </button>
                <button
                  id="filter-stock-sold-out"
                  onClick={() => setStockFilter('sold_out')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    stockFilter === 'sold_out'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                  <span>Sold Out ({stockCounts.soldOut})</span>
                </button>
              </div>

              {/* Add New Dish Button */}
              <button
                id="add-dish-btn"
                onClick={handleOpenAddDish}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add New Dish</span>
              </button>
            </div>
          </div>

          {/* Current Filter Bar / Status Summary */}
          <div className="px-4 py-2 bg-[#090f19] border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span>Showing:</span>
              <span className="font-bold text-emerald-400">
                {selectedCategory}
              </span>
              {stockFilter !== 'all' && (
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                  {stockFilter === 'available' ? '• In Stock Only' : '• Sold Out Only'}
                </span>
              )}
              {searchQuery && (
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                  Keyword: "{searchQuery}"
                </span>
              )}
            </div>
            <div className="font-mono text-[11px] text-slate-400">
              <strong className="text-white">{filteredItems.length}</strong> items displayed
            </div>
          </div>

          {/* Sleek, Compact Admin Data Table */}
          <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[620px] scrollbar-thin scrollbar-thumb-slate-800">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="sticky top-0 z-10 bg-[#090f19] text-[11px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 w-[28%]">Item Name & Food Type</th>
                  <th className="py-2.5 px-3 w-[15%]">Category</th>
                  <th className="py-2.5 px-3 w-[29%]">Portions & Prices</th>
                  <th className="py-2.5 px-3 w-[16%]">Status</th>
                  <th className="py-2.5 px-4 w-[12%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredItems.map(item => {
                  const hasVars = item.variations && item.variations.length > 0;
                  const catIcon = categoryIcons[item.category] || '🍽️';

                  return (
                    <tr 
                      key={item.id}
                      className={`transition-colors ${
                        item.available 
                          ? 'hover:bg-slate-800/40 bg-transparent' 
                          : 'bg-rose-950/10 hover:bg-rose-950/20 opacity-90'
                      }`}
                    >
                      {/* 1. Item Name & Food Type (Veg/Non-Veg icon) */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-start gap-2.5">
                          {/* FSSAI Standard Veg/Non-Veg indicator */}
                          <div className="pt-0.5 shrink-0">
                            {item.isVeg ? (
                              <span 
                                className="w-4 h-4 rounded-xs border border-emerald-500 flex items-center justify-center bg-emerald-950/40"
                                title="Vegetarian (Green Dot)"
                              >
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              </span>
                            ) : (
                              <span 
                                className="w-4 h-4 rounded-xs border border-rose-500 flex items-center justify-center bg-rose-950/40"
                                title="Non-Vegetarian (Red Triangle)"
                              >
                                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                              </span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-white text-xs leading-tight">
                                {item.name}
                              </span>
                              {!item.available && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  86
                                </span>
                              )}
                            </div>
                            {item.description ? (
                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 leading-normal">
                                {item.description}
                              </p>
                            ) : (
                              <span className="text-[10px] text-slate-500">
                                GST: {item.gstRate ?? 5}%
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Category */}
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-200 border border-slate-700/60 text-xs font-medium">
                          <span className="text-xs">{catIcon}</span>
                          <span className="truncate max-w-[110px]">{item.category}</span>
                        </span>
                      </td>

                      {/* 3. Portions & Prices (e.g. Half: ₹140 | Full: ₹220) */}
                      <td className="py-2.5 px-3">
                        {hasVars ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {item.variations!.map((v, idx) => (
                              <span 
                                key={v.id || idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700/70 text-[11px] font-medium"
                              >
                                <span className="text-slate-300">{v.name}:</span>
                                <span className="font-mono font-bold text-emerald-400">₹{v.price}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-emerald-400 text-sm">
                              ₹{item.price}
                            </span>
                            <span className="text-[10px] text-slate-500 px-1.5 py-0.5 rounded bg-slate-800/70 border border-slate-700/50">
                              Standard
                            </span>
                          </div>
                        )}
                      </td>

                      {/* 4. Status (Smooth active toggle switch: In Stock vs Sold Out) */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          {/* Smooth iOS-style Toggle Button */}
                          <button
                            id={`toggle-item-status-${item.id}`}
                            type="button"
                            role="switch"
                            aria-checked={item.available}
                            onClick={() => toggleMenuItemAvailability(item.id)}
                            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-inner shrink-0 ${
                              item.available 
                                ? 'bg-emerald-600' 
                                : 'bg-slate-700'
                            }`}
                            title={item.available ? 'Click to mark as Sold Out' : 'Click to mark as In Stock'}
                          >
                            <span
                              className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                                item.available ? 'translate-x-5.5' : 'translate-x-0.5'
                              }`}
                            />
                          </button>

                          {/* Status Label */}
                          <span className={`text-[11px] font-bold tracking-tight select-none ${
                            item.available 
                              ? 'text-emerald-400' 
                              : 'text-rose-400'
                          }`}>
                            {item.available ? 'In Stock' : 'Sold Out'}
                          </span>
                        </div>
                      </td>

                      {/* 5. Actions (Edit button, Delete button) */}
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Dish Button */}
                          <button
                            id={`edit-dish-${item.id}`}
                            type="button"
                            onClick={() => handleOpenEditDish(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 border border-slate-700/80 transition-colors cursor-pointer"
                            title="Edit dish and portions"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Dish Button */}
                          <button
                            id={`delete-dish-${item.id}`}
                            type="button"
                            onClick={() => confirmDeleteDish(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700/80 hover:border-rose-800/60 transition-colors cursor-pointer"
                            title="Delete dish from catalog"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Empty State */}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-14 text-center">
                      <div className="max-w-sm mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-500 mx-auto">
                          <UtensilsCrossed className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-300">
                          No dishes found
                        </h4>
                        <p className="text-xs text-slate-500">
                          {searchQuery
                            ? `No dishes matched "${searchQuery}" in ${selectedCategory}.`
                            : `There are no dishes listed in the "${selectedCategory}" category.`}
                        </p>
                        <div className="flex items-center justify-center gap-2 pt-1">
                          {selectedCategory !== 'All' && (
                            <button
                              onClick={() => setSelectedCategory('All')}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                            >
                              Show All Categories
                            </button>
                          )}
                          <button
                            onClick={handleOpenAddDish}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Dish to {selectedCategory}</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Summary bar */}
          <div className="p-3 bg-[#090f19] border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{stockCounts.available} Available</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>{stockCounts.soldOut} Sold Out</span>
              </span>
            </div>

            <span className="text-[11px] text-slate-500">
              Auto-syncs live with Kitchen KDS and Waiter/Cashier POS
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CATEGORY MODAL (ADD & EDIT) */}
      {/* ========================================================================= */}
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
                  <h3 className="font-bold text-sm text-white">
                    {editingCategoryName ? `Edit Category: ${editingCategoryName}` : 'Add New Category'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingCategoryName 
                      ? 'Renaming will automatically update all dishes under this category'
                      : 'Creates a new menu filter across Admin Console and POS terminals'}
                  </p>
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
                  Icon / Emoji
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
                    Type an emoji or pick from common restaurant icons:
                  </span>
                </div>

                {/* Quick Emoji Picker */}
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  {quickEmojis.map(emoji => (
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
                <span className="text-xs text-slate-400 font-medium">Preview in sidebar:</span>
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
                  <span>{editingCategoryName ? 'Update Category' : 'Save Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CATEGORY CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 text-white animate-in zoom-in-95 duration-100">
            <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/40 flex items-center justify-center text-rose-400 mb-3">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white mb-1">
              Delete Category "{categoryToDelete}"?
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              This will remove the category filter. Existing dishes in this category will remain in the menu and can be reassigned.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteCategory}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-950/40 cursor-pointer transition-all"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE DISH CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {dishToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 text-white animate-in zoom-in-95 duration-100">
            <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/40 flex items-center justify-center text-rose-400 mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white mb-1">
              Delete "{dishToDelete.name}"?
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Are you sure you want to permanently remove this dish from the catalog? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDishToDelete(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteDish}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-950/40 cursor-pointer transition-all"
              >
                Yes, Delete Dish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT DISH MODAL */}
      {/* ========================================================================= */}
      {isDishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full p-5 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
                <span>{editingDish ? 'Edit Dish & Portions' : 'Add New Dish to Catalog'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsDishModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDish} className="space-y-3.5 mt-4">
              {/* Dish Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dish Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={dishName}
                  onChange={e => setDishName(e.target.value)}
                  placeholder="e.g. Chicken Dum Biryani, Paneer Tikka"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Category & Base Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={dishCategory}
                    onChange={e => setDishCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Base Price (₹) <span className="text-rose-400">*</span>
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
                    Food Type
                  </label>
                  <button
                    type="button"
                    onClick={() => setDishIsVeg(!dishIsVeg)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border cursor-pointer ${
                      dishIsVeg
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-700'
                        : 'bg-rose-950/60 text-rose-400 border-rose-700'
                    }`}
                  >
                    {dishIsVeg ? (
                      <span className="w-3.5 h-3.5 rounded-xs border border-emerald-500 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      </span>
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-xs border border-rose-500 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      </span>
                    )}
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
                  placeholder="Ingredients, spice level, preparation style..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Variations Toggle & Config */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Multi-Portion Variations
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Configure Half, Full, Family Pack portions with custom prices
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !hasVariations;
                      setHasVariations(next);
                      if (next && variationsList.length === 0) {
                        setVariationsList([
                          { id: 'v1', name: 'Half', price: Math.round(dishPrice * 0.6) },
                          { id: 'v2', name: 'Full', price: dishPrice },
                        ]);
                      }
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      hasVariations ? 'bg-emerald-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                        hasVariations ? 'translate-x-5.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Variations Editor */}
                {hasVariations && (
                  <div className="space-y-2 mt-2 p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                    <div className="space-y-1.5">
                      {variationsList.map((varItem) => (
                        <div
                          key={varItem.id}
                          className="flex items-center justify-between gap-2 p-2 bg-slate-800/80 rounded-lg border border-slate-700/60 text-xs"
                        >
                          <span className="font-semibold text-white">{varItem.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-emerald-400">
                              ₹{varItem.price}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveVariationRow(varItem.id)}
                              className="text-slate-400 hover:text-rose-400 p-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add variation row */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                      <input
                        type="text"
                        placeholder="Portion (e.g. Single, Family Pack)"
                        value={newVarName}
                        onChange={e => setNewVarName(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={newVarPrice}
                        onChange={e => setNewVarPrice(Number(e.target.value))}
                        className="w-20 px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddVariationRow}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
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
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingDish ? 'Save Changes' : 'Create Dish'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
