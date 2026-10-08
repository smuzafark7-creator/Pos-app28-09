import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { MenuItem, PortionSelection } from '../../types';
import { CashierCategorySidebar } from '../cashier/CashierCategorySidebar';
import { CashierItemCard } from '../cashier/CashierItemCard';
import { CashierCart } from '../cashier/CashierCart';
import { ItemVariationModal } from '../ItemVariationModal';
import { POSOrderTypeWatermark } from '../cashier/POSOrderTypeWatermark';
import { POSBilaalWatermark } from '../cashier/POSBilaalWatermark';
import { Search, X } from 'lucide-react';

export interface SharedPosScreenProps {
  role?: 'cashier' | 'waiter' | 'manager' | 'admin';
}

export const SharedPosScreen: React.FC<SharedPosScreenProps> = ({ role = 'cashier' }) => {
  const {
    menuItems,
    categories,
    cart,
    addToCart,
    updateCartQuantity,
    cartOrderType,
    setCartOrderType,
    cartTableNumber,
    setCartTableNumber,
    kots,
    currentBranch,
    currentUser,
  } = useApp();

  const effectiveRole = role || (currentUser?.role === 'waiter' ? 'waiter' : 'cashier');

  // Ensure default order type is dine_in if none is selected
  useEffect(() => {
    if (!cartOrderType) {
      setCartOrderType('dine_in');
    }
  }, [cartOrderType, setCartOrderType]);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [variationModalItem, setVariationModalItem] = useState<MenuItem | null>(null);

  // Safe category list
  const safeCategories = useMemo<string[]>(() => {
    if (categories && Array.isArray(categories) && categories.length > 0) {
      return categories;
    }
    const dynamic = Array.from(new Set((menuItems || []).map(i => i.category).filter(Boolean)));
    return ['All', ...dynamic];
  }, [categories, menuItems]);

  // Category item counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (menuItems || []).forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [menuItems]);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchDiet =
        dietaryFilter === 'all' ||
        (dietaryFilter === 'veg' && item.isVeg) ||
        (dietaryFilter === 'non-veg' && !item.isVeg);
      const matchSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchDiet && matchSearch;
    });
  }, [menuItems, selectedCategory, dietaryFilter, searchQuery]);

  // Active unbilled KOTs for current table or takeaway ticket
  const activeSessionKots = useMemo(() => {
    const effectiveBranch = currentBranch === 'all' ? 'main' : currentBranch;
    const norm = (s?: string) => (s || '').trim().toLowerCase().replace(/^t\s*/, 'table ');
    const cartNorm = norm(cartTableNumber);
    const cartDigits = (cartTableNumber || '').replace(/[^0-9]/g, '');

    if (cartOrderType === 'dine_in') {
      if (!cartTableNumber) return [];
      return kots.filter(
        k => {
          if (k.branchId !== effectiveBranch) return false;
          if (k.orderType !== 'dine_in') return false;
          if (k.isBilled || k.status === 'cancelled') return false;
          if (!k.tableNumber) return false;
          const kNorm = norm(k.tableNumber);
          const kDigits = k.tableNumber.replace(/[^0-9]/g, '');
          return kNorm === cartNorm || (Boolean(cartDigits) && kDigits === cartDigits);
        }
      ).sort((a, b) => {
        const timeDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (timeDiff !== 0) return timeDiff;
        return (a.kotNumber || '').localeCompare(b.kotNumber || '');
      });
    }

    // Takeaway & delivery tickets
    return kots.filter(
      k =>
        k.branchId === effectiveBranch &&
        (k.orderType === 'takeaway' || k.orderType === 'parcel' || k.orderType === 'delivery') &&
        !k.isBilled &&
        k.status !== 'cancelled'
    );
  }, [cartOrderType, cartTableNumber, currentBranch, kots]);

  const handleItemClick = (item: MenuItem) => {
    if (item.variations && item.variations.length > 0) {
      setVariationModalItem(item);
    } else {
      addToCart(item, 1);
    }
  };

  const handleSaveVariations = (baseItem: MenuItem, portions: PortionSelection[], note?: string) => {
    portions.forEach(({ variation, quantity, notes, orderType, serveType }) => {
      if (quantity <= 0) return;
      const variantItem: MenuItem = {
        ...baseItem,
        id: `${baseItem.id}_${variation.id}`,
        name: `${baseItem.name} (${variation.name})`,
        price: variation.price,
      };
      const effectiveServeType = serveType || (orderType === 'delivery' ? 'DELIVERY' : orderType === 'takeaway' || orderType === 'parcel' ? 'PARCEL' : 'DINE_IN');
      addToCart(variantItem, quantity, notes?.trim() || note, effectiveServeType, orderType);
    });
  };

  return (
    <div
      id="shared-pos-screen"
      className="shared-pos-screen select-none font-sans bg-[#070b14]"
      style={{
        display: 'flex',
        flexDirection: 'row',
        width: '100vw',
        height: 'calc(100vh - 56px)',
        overflow: 'hidden',
        backgroundColor: '#070b14',
      }}
    >
      {/* 1. Left Category Sidebar: Hard-locked to 175px */}
      <div
        id="shared-pos-category-sidebar-wrapper"
        className="shrink-0"
        style={{
          width: '175px',
          minWidth: '175px',
          maxWidth: '175px',
          flex: '0 0 175px',
          height: '100%',
        }}
      >
        <CashierCategorySidebar
          categories={safeCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          categoryCounts={categoryCounts}
          totalItems={(menuItems || []).length}
        />
      </div>

      {/* 2. Middle Food Grid: Hard-locked flex: 1 1 0%, min-width: 0, overflow-y: auto */}
      <div
        id="shared-pos-middle-panel"
        className="shared-pos-middle-panel pos-middle-panel flex flex-col relative bg-transparent border-r border-[#8b0000]/60 min-w-0"
        style={{
          flex: '1 1 0%',
          minWidth: 0,
          overflowY: 'auto',
          backgroundColor: 'transparent',
          position: 'relative',
        }}
      >
        {/* Search & Dietary Filters Bar at Top */}
        <div
          id="shared-pos-search-filter-bar"
          className="px-3.5 py-3 shrink-0 bg-transparent border-b border-[#8b0000]/30 z-20"
          style={{ backgroundColor: 'transparent' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Search Input Wrapper */}
            <div
              className="relative flex-1 rounded-xl shadow-inner bg-[#070b14]/75 border border-slate-700/60 focus-within:border-emerald-500/80 transition-colors"
              style={{ backgroundColor: 'rgba(7, 11, 20, 0.75)' }}
            >
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="shared-pos-search-input"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search dish or PLU code..."
                className="w-full pl-9 pr-8 py-2 rounded-xl text-sm transition-colors focus:outline-none bg-transparent text-white placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Veg / Non-Veg Filter Pills Container */}
            <div
              className="flex items-center gap-1 p-1 rounded-xl shrink-0 text-xs bg-[#070b14]/75 border border-slate-700/60"
              style={{ backgroundColor: 'rgba(7, 11, 20, 0.75)' }}
            >
              <button
                type="button"
                onClick={() => setDietaryFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  dietaryFilter === 'all'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setDietaryFilter('veg')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  dietaryFilter === 'veg'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-400 hover:bg-emerald-950/40'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Veg
              </button>
              <button
                type="button"
                onClick={() => setDietaryFilter('non-veg')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  dietaryFilter === 'non-veg'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-rose-400 hover:bg-rose-950/40'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                Non-Veg
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Watermark Background */}
        <POSOrderTypeWatermark orderType={cartOrderType || 'dine_in'} />
        <POSBilaalWatermark />

        {/* 4-Column Grid: Hard-locked repeat(4, minmax(130px, 1fr)) gap 10px padding 10px */}
        <div
          id="shared-pos-food-grid"
          className="shared-pos-food-grid relative z-10 flex-1 overflow-y-auto"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(130px, 1fr))',
            gap: '10px',
            padding: '10px',
          }}
        >
          {filteredItems.map((item, idx) => {
            const inCartItem = cart.find(c => c.item.id === item.id);
            const inCartQty = inCartItem ? inCartItem.quantity : 0;
            return (
              <CashierItemCard
                key={item.id}
                item={item}
                inCartQty={inCartQty}
                index={idx}
                onAdd={handleItemClick}
                onIncrement={(itemId) => updateCartQuantity(itemId, 1)}
                onDecrement={(itemId) => updateCartQuantity(itemId, -1)}
              />
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="relative z-10 flex flex-col items-center justify-center p-12 text-slate-400">
            <p className="text-sm">No dishes found matching selection.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setDietaryFilter('all');
              }}
              className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* 3. Right Cart Drawer: Hard-locked to 420px */}
      <CashierCart
        role={effectiveRole === 'waiter' ? 'waiter' : 'cashier'}
        orderType={cartOrderType || 'dine_in'}
        setOrderType={setCartOrderType}
        tableNumber={cartTableNumber}
        setTableNumber={setCartTableNumber}
        activeSessionKots={activeSessionKots}
      />

      {/* Variation Selection Modal */}
      <ItemVariationModal
        isOpen={Boolean(variationModalItem)}
        item={variationModalItem}
        onClose={() => setVariationModalItem(null)}
        onSave={handleSaveVariations}
      />
    </div>
  );
};

export default SharedPosScreen;
