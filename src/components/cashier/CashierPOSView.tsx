import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { MenuItem, ItemVariation, PortionSelection } from '../../types';
import { CashierCategorySidebar } from './CashierCategorySidebar';
import { CashierItemCard } from './CashierItemCard';
import { CashierCart } from './CashierCart';
import { ItemVariationModal } from '../ItemVariationModal';
import { POSOrderTypeWatermark } from './POSOrderTypeWatermark';
import { POSBilaalWatermark } from './POSBilaalWatermark';
import { Search, X } from 'lucide-react';

export const CashierPOSView: React.FC = () => {
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
    cartTakeawayId,
    cartCustomerMobile,
    kots,
    currentBranch,
  } = useApp();

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
    if (cartOrderType === 'dine_in') {
      if (!cartTableNumber) return [];
      return kots.filter(
        k =>
          k.branchId === effectiveBranch &&
          k.orderType === 'dine_in' &&
          k.tableNumber?.toLowerCase() === cartTableNumber.toLowerCase() &&
          !k.isBilled &&
          k.status !== 'cancelled'
      );
    } else {
      // Takeaway, delivery, or parcel
      return kots.filter(
        k => {
          if (k.branchId !== effectiveBranch) return false;
          if (k.isBilled || k.status === 'cancelled') return false;
          const isTakeawayType = k.orderType === 'takeaway' || k.orderType === 'parcel' || k.orderType === 'delivery';
          if (!isTakeawayType) return false;

          const kotTakeawayId = k.takeawayId || (k.kotNumber ? `TK-${k.kotNumber.replace(/\D/g, '').slice(-3)}` : undefined);
          if (cartTakeawayId && kotTakeawayId) {
            return kotTakeawayId.toLowerCase() === cartTakeawayId.toLowerCase();
          }
          if (cartCustomerMobile && k.customerMobile) {
            return k.customerMobile === cartCustomerMobile;
          }
          if (cartTakeawayId && !kotTakeawayId && !k.customerMobile) {
            return true;
          }
          return false;
        }
      );
    }
  }, [kots, currentBranch, cartOrderType, cartTableNumber, cartTakeawayId, cartCustomerMobile]);

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

  const { isDark } = useTheme();

  return (
    <div 
      className="h-full w-full flex flex-row overflow-hidden select-none font-sans bg-[#070b14]"
      style={{ backgroundColor: '#070b14', background: '#070b14' }}
    >
      {/* 1. Category Sidebar (Left) - Column 2 */}
      <CashierCategorySidebar
        categories={safeCategories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categoryCounts={categoryCounts}
        totalItems={(menuItems || []).length}
      />

      {/* 2. Menu Items & Fast Search (Middle) - Touches top edge */}
      <div 
        id="cashier-middle-dish-panel"
        className="flex-1 flex flex-col overflow-hidden min-w-0 border-r border-[#8b0000]/60 pos-middle-panel relative bg-transparent"
        style={{ backgroundColor: 'transparent', background: 'transparent' }}
      >
        {/* Sticky Item Search & Filters - Touches top edge */}
        <div 
          id="cashier-search-filter-bar" 
          className="px-3.5 py-3 shrink-0 bg-transparent border-b border-[#8b0000]/30 z-20"
          style={{ backgroundColor: 'transparent', background: 'transparent' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Search Input Wrapper */}
            <div
              id="cashier-search-wrapper"
              className="relative flex-1 rounded-xl shadow-inner bg-[#070b14]/75 border border-slate-700/60 focus-within:border-emerald-500/80 transition-colors"
              style={{ backgroundColor: 'rgba(7, 11, 20, 0.75)' }}
            >
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="cashier-dish-search-input"
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
              id="cashier-dietary-pills"
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

        {/* Fixed Non-Scrolling Watermark Layer - Exact Bilaal Restaurant Emblem Matching Tables Screen */}
        <POSBilaalWatermark orderType={cartOrderType} opacity={0.20} />

        {/* Cards Grid Container - The ONLY scrolling area in the middle */}
        <div 
          id="cashier-dish-grid-container"
          className="relative flex-1 overflow-y-auto p-3.5 pos-center-grid-scroll z-10"
          style={{
            position: 'relative',
            zIndex: 1,
            backgroundColor: 'transparent',
            background: 'transparent',
          }}
        >
          <div className="relative z-10 grid grid-cols-4 gap-3 pos-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {filteredItems.map((item, index) => {
              const matchingCartItems = (cart || []).filter(
                c => c.item.id === item.id || c.item.id.startsWith(`${item.id}_`)
              );
              const inCartQty = matchingCartItems.reduce((acc, c) => acc + c.quantity, 0);

              return (
                <CashierItemCard
                  key={item.id}
                  item={item}
                  index={index}
                  inCartQty={inCartQty}
                  onAdd={() => handleItemClick(item)}
                  onIncrement={() => {
                    if (item.variations && item.variations.length > 0) {
                      handleItemClick(item);
                    } else {
                      updateCartQuantity(item.id, 1);
                    }
                  }}
                  onDecrement={() => {
                    if (item.variations && item.variations.length > 0) {
                      if (matchingCartItems.length > 0) {
                        updateCartQuantity(matchingCartItems[matchingCartItems.length - 1].item.id, -1);
                      }
                    } else {
                      updateCartQuantity(item.id, -1);
                    }
                  }}
                />
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <div className="relative z-10 flex flex-col items-center justify-center p-12 text-slate-400">
              <p className="text-sm">No items found matching criteria.</p>
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
      </div>

      {/* 3. Cashier Order, Audit & Settlement Panel (Right) */}
      <CashierCart
        orderType={cartOrderType}
        setOrderType={setCartOrderType}
        tableNumber={cartTableNumber}
        setTableNumber={setCartTableNumber}
        activeSessionKots={activeSessionKots}
      />

      {/* Petpooja Item Variation Modal */}
      <ItemVariationModal
        isOpen={!!variationModalItem}
        item={variationModalItem}
        onClose={() => setVariationModalItem(null)}
        onSave={handleSaveVariations}
      />
    </div>
  );
};
