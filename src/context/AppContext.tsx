import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  User, 
  UserRole, 
  BranchId, 
  MenuItem, 
  RestaurantTable, 
  KOT, 
  KOTItem,
  Bill, 
  BillItem,
  BillStatus,
  Customer, 
  CartItem, 
  OrderType, 
  KOTStatus, 
  PaymentMethod, 
  SplitPaymentDetail, 
  ToastMessage,
  Branch,
  BillRequest,
  ItemServeType,
  KDSAlert,
  ItemStockStatus,
  DispatchedItemStats,
  RestaurantSettings,
  SavedActiveOrder
} from '../types';
import { 
  BRANCHES, 
  DEMO_USERS, 
  INITIAL_MENU_ITEMS, 
  generateInitialTables, 
  INITIAL_KOTS, 
  INITIAL_BILLS, 
  INITIAL_CUSTOMERS, 
  BENCHMARK_STATS,
  INITIAL_BILL_REQUESTS,
  DEFAULT_RESTAURANT_SETTINGS
} from '../data/mockData';

interface AppContextType {
  currentUser: User | null;
  currentBranch: BranchId;
  branches: Branch[];
  activeTab: string;
  menuItems: MenuItem[];
  categories: string[];
  categoryIcons: Record<string, string>;
  addCategory: (name: string, icon?: string) => boolean;
  updateCategory?: (oldName: string, newName: string, icon?: string) => boolean;
  deleteCategory?: (name: string) => void;
  tables: RestaurantTable[];
  branchTables: RestaurantTable[];
  kots: KOT[];
  bills: Bill[];
  customers: Customer[];
  
  // Cart state
  cart: CartItem[];
  cartOrderType: OrderType;
  cartTableNumber: string;
  cartTakeawayId: string;
  setCartTakeawayId: (id: string) => void;
  takeawaySequence: number;
  cartCustomerName: string;
  cartCustomerMobile: string;
  cartSpecialNotes: string;
  cartPaidBill: Bill | null;
  cartSentKotId: string | null;
  cartDiscountPercent: number;
  setCartDiscountPercent: (p: number) => void;
  cartCustomDiscount: number;
  setCartCustomDiscount: (d: number) => void;
  
  // Modals & previews
  activeReceiptBill: Bill | null;
  isReceiptModalOpen: boolean;
  activeReceiptKOT: KOT | null;
  isKOTModalOpen: boolean;
  openKOTModal: (kot: KOT) => void;
  closeKOTModal: () => void;
  activeDetailsBill: Bill | null;
  isBillDetailsModalOpen: boolean;
  openBillDetailsModal: (bill: Bill) => void;
  closeBillDetailsModal: () => void;
  toasts: ToastMessage[];
  billSequence: number;

  // Actions
  login: (emailOrUsername: string, password?: string) => { success: boolean; error?: string };
  loginWithPin: (pin: string) => { success: boolean; error?: string };
  logout: () => void;
  switchRole: (role: UserRole) => void;
  setBranch: (branchId: BranchId) => void;
  setActiveTab: (tab: string) => void;
  
  // Cart actions
  addToCart: (item: MenuItem, qty?: number, notes?: string, serveType?: ItemServeType, orderType?: OrderType) => void;
  updateCartQuantity: (itemId: string, delta: number) => void;
  updateCartItemNotes: (itemId: string, notes: string) => void;
  updateCartItemServeType: (itemId: string, serveType: ItemServeType) => void;
  removeFromCart: (itemId: string) => void;
  setCartItems: (items: CartItem[]) => void;
  clearCart: () => void;
  resetCartOrder: () => void;
  setCartPaidBill: (bill: Bill | null) => void;
  setCartSentKotId: (kotId: string | null) => void;
  setCartOrderType: (type: OrderType) => void;
  setCartTableNumber: (tableNum: string) => void;
  setCartCustomerName: (name: string) => void;
  setCartCustomerMobile: (mobile: string) => void;
  setCartSpecialNotes: (notes: string) => void;
  isCurrentTakeawayEmpty: () => boolean;
  startNewTakeawayOrder: () => void;
  selectTakeawayOrder: (takeawayId: string) => void;
  holdOrder: () => void;
  savedActiveOrders: Record<string, SavedActiveOrder>;
  setSavedActiveOrders: React.Dispatch<React.SetStateAction<Record<string, SavedActiveOrder>>>;
  saveActiveOrder: (isEstimate?: boolean) => Bill | null;
  isCurrentOrderSaved: boolean;
  isOrderSettled: boolean;
  setIsOrderSettled: (val: boolean) => void;
  isBillPrinted: boolean;
  setIsBillPrinted: (val: boolean) => void;
  
  // Flow actions
  sendKOT: (overrideTableNumber?: string, overrideOrderType?: OrderType, overrideInstructions?: string) => KOT | null;
  updateKOTStatus: (kotId: string, status: KOTStatus) => void;
  voidKOTItem: (kotId: string, itemIndex: number, voidQty?: number, reason?: string) => boolean;
  kdsAlerts: KDSAlert[];
  dismissKDSAlert: (alertId: string) => void;
  getActiveUnbilledKots: (tableNumber?: string, orderType?: OrderType, customerMobile?: string, takeawayId?: string) => KOT[];
  generateBill: (paymentMethod: PaymentMethod, splitDetails?: SplitPaymentDetail, discountAmount?: number) => Bill | null;
  sendKotForBill: (bill: Bill) => KOT | null;
  voidBill: (billId: string, reason: string) => boolean;
  openReceiptModal: (bill: Bill) => void;
  closeReceiptModal: () => void;
  
  // Bill Request actions (Waiter / Cashier flow)
  billRequests: BillRequest[];
  pendingBillRequests: BillRequest[];
  requestBill: (tableNumber?: string, notes?: string) => BillRequest | null;
  cancelBillRequest: (requestId: string) => void;
  settleBillRequest: (requestId: string, paymentMethod?: PaymentMethod) => void;

  // Table actions
  tableSearchTerm: string;
  setTableSearchTerm: (term: string) => void;
  tableFloorFilter: string;
  setTableFloorFilter: (floor: string) => void;
  selectTableForPOS: (tableNumber: string) => void;
  updateTableStatus: (tableId: string, status: RestaurantTable['status']) => void;
  setTableStatusByNumber: (tableNumber: string, status: RestaurantTable['status']) => void;

  // Management actions
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (item: MenuItem) => void;
  deleteMenuItem: (id: string) => void;
  toggleMenuItemAvailability: (id: string) => void;
  updateMenuItemStock: (id: string, stockStatus: ItemStockStatus, stockCount?: number) => void;
  dispatchedItemStats: DispatchedItemStats[];
  activeKitchenTab: 'live' | 'stock86' | 'dispatched' | 'history';
  setActiveKitchenTab: (tab: 'live' | 'stock86' | 'dispatched' | 'history') => void;
  isKitchenDrawerOpen: boolean;
  setIsKitchenDrawerOpen: (open: boolean) => void;
  kitchenDrawerTab: 'active' | 'completed' | 'stock86' | 'dispatched' | 'settings';
  setKitchenDrawerTab: (tab: 'active' | 'completed' | 'stock86' | 'dispatched' | 'settings') => void;
  openKitchenDrawer: (tab?: 'active' | 'completed' | 'stock86' | 'dispatched' | 'settings') => void;
  kdsViewMode: 'columns' | 'grid';
  setKdsViewMode: (mode: 'columns' | 'grid') => void;
  kdsStatusFilter: string;
  setKdsStatusFilter: (filter: string) => void;
  kdsSelectedStation: string;
  setKdsSelectedStation: (station: string) => void;
  kdsSearchQuery: string;
  setKdsSearchQuery: (query: string) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'lastVisit'>) => void;
  updateCustomer: (customer: Customer) => void;

  // Staff & RBAC User Management
  users: User[];
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;

  // Restaurant Settings & Thermal Printer
  restaurantSettings: RestaurantSettings;
  updateRestaurantSettings: (settings: Partial<RestaurantSettings>) => void;

  // Admin PIN Protection & Mode
  isAdminPinModalOpen: boolean;
  openAdminPinModal: (onSuccess?: () => void) => void;
  closeAdminPinModal: () => void;
  verifyAdminPin: (pin: string) => boolean;
  switchRoleToAdmin: () => void;
  
  // Toast & reset
  showToast: (title: string, message: string, type?: ToastMessage['type']) => void;
  dismissToast: (id: string) => void;
  resetDemoData: () => void;
  
  // Computed stats
  computedStats: {
    todaySales: number;
    totalOrders: number;
    dineInOrders: number;
    takeawayOrders: number;
    pendingKOTs: number;
    activeCookingKOTs: number;
    readyKOTs: number;
    paidBills: number;
    paymentBreakdown: { cash: number; upi: number; card: number };
    branchPerformance: { main: number; city: number; beach: number };
  };
  
  // Filtered views
  currentBranchInfo: Branch | null;
  filteredTables: RestaurantTable[];
  filteredKots: KOT[];
  filteredBills: Bill[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const LOCAL_STORAGE_KEY = 'zaffran_pos_storage_v1';
export const AUTH_STORAGE_KEY = 'zaffran_pos_auth_user';

// Helper to retrieve active authentication session from localStorage
const getInitialAuthUser = (): User | null => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.email && parsed.role) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to parse auth user from storage:', err);
  }
  // The app must ALWAYS start on Login screen when not authenticated
  return null;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial or stored state
  const loadStored = () => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return null;
  };

  const storedData = loadStored();

  // Primary Authentication State - Strictly loaded from AUTH_STORAGE_KEY (null if not logged in)
  const [currentUser, setCurrentUser] = useState<User | null>(() => getInitialAuthUser());
  
  const [currentBranch, setCurrentBranch] = useState<BranchId>(
    storedData?.currentBranch ?? 'main'
  );
  
  const [activeTab, setActiveTab] = useState<string>(
    storedData?.activeTab ?? 'dashboard'
  );

  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    if (storedData?.menuItems && Array.isArray(storedData.menuItems)) {
      const storedMap = new Map<string, MenuItem>(storedData.menuItems.map((m: MenuItem) => [m.id, m]));
      const merged = INITIAL_MENU_ITEMS.map(initItem => {
        const existing = storedMap.get(initItem.id);
        if (existing) {
          return {
            ...existing,
            name: initItem.name || existing.name,
            variations: initItem.variations || existing.variations,
            stockStatus: existing.stockStatus || initItem.stockStatus || 'available',
            stockCount: existing.stockCount !== undefined ? existing.stockCount : initItem.stockCount,
            available: existing.stockStatus === 'sold_out' ? false : (existing.available ?? initItem.available ?? true),
          };
        }
        return initItem;
      });
      // Include any custom items created by the user
      storedData.menuItems.forEach((m: MenuItem) => {
        if (!merged.some(item => item.id === m.id)) {
          merged.push(m);
        }
      });
      return merged;
    }
    return INITIAL_MENU_ITEMS;
  });

  // Kitchen Full-Page Routing & Tools state
  const [activeKitchenTab, setActiveKitchenTab] = useState<'live' | 'stock86' | 'dispatched' | 'history'>('live');
  const [isKitchenDrawerOpen, setIsKitchenDrawerOpen] = useState<boolean>(false);
  const [kitchenDrawerTab, setKitchenDrawerTab] = useState<'active' | 'completed' | 'stock86' | 'dispatched' | 'settings'>('active');

  const openKitchenDrawer = (tab?: 'active' | 'completed' | 'stock86' | 'dispatched' | 'settings') => {
    if (tab === 'stock86') {
      setActiveKitchenTab('stock86');
    } else if (tab === 'dispatched') {
      setActiveKitchenTab('dispatched');
    } else if (tab === 'completed') {
      setActiveKitchenTab('history');
    } else {
      setActiveKitchenTab('live');
    }
    setIsKitchenDrawerOpen(false);
  };

  // KDS View Mode ('columns' | 'grid')
  const [kdsViewMode, setKdsViewMode] = useState<'columns' | 'grid'>('columns');

  // KDS Status Filter ('All' | 'New' | 'Preparing' | 'Ready' | 'Picked Up' | 'Served / Completed')
  const [kdsStatusFilter, setKdsStatusFilter] = useState<string>('All');

  // KDS Station Filter ('All Stations' | 'Tandoor & Grill' | 'Curry' | 'Chinese')
  const [kdsSelectedStation, setKdsSelectedStation] = useState<string>('All Stations');

  // KDS Search Query (Search by KOT #, Table, Dish)
  const [kdsSearchQuery, setKdsSearchQuery] = useState<string>('');

  // Live Shift/Session Dispatched Tracking (Real-time item-level counter with Dine-in vs Takeaway Breakdown)
  const [dispatchedDishes, setDispatchedDishes] = useState<Record<string, { dineIn: number; takeaway: number }>>(() => {
    return {
      'Chicken Biryani': { dineIn: 9, takeaway: 5 }, // 14 Served (9 Dine-in | 5 Takeaway)
      'Butter Naan': { dineIn: 16, takeaway: 6 }, // 22 Served (16 Dine-in | 6 Takeaway)
      'Mutton Biryani': { dineIn: 5, takeaway: 2 }, // 7 Served (5 Dine-in | 2 Takeaway)
      'Paneer Tikka': { dineIn: 6, takeaway: 2 }, // 8 Served (6 Dine-in | 2 Takeaway)
      'Chicken 65': { dineIn: 8, takeaway: 3 }, // 11 Served (8 Dine-in | 3 Takeaway)
      'Garlic Naan': { dineIn: 10, takeaway: 4 }, // 14 Served (10 Dine-in | 4 Takeaway)
    };
  });

  const [dispatchedKotIds, setDispatchedKotIds] = useState<Set<string>>(new Set(['kot_10025']));

  const dispatchedItemStats = useMemo<DispatchedItemStats[]>(() => {
    return (Object.entries(dispatchedDishes) as [string, { dineIn: number; takeaway: number }][]).map(([name, counts]) => ({
      name,
      dineIn: counts.dineIn,
      takeaway: counts.takeaway,
      totalServed: counts.dineIn + counts.takeaway
    })).sort((a, b) => b.totalServed - a.totalServed);
  }, [dispatchedDishes]);

  // Custom Categories & Icons state
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('zaffran_pos_custom_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [deletedCategories, setDeletedCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('zaffran_pos_deleted_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [categoryIcons, setCategoryIcons] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('zaffran_pos_category_icons');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return {
      'Biryani': '🍛',
      'Starters': '🍢',
      'Main Course': '🍲',
      'Breads': '🫓',
      'Rice': '🍚',
      'Beverages': '🍹',
      'Desserts': '🍨',
    };
  });

  const categories = useMemo<string[]>(() => {
    const defaultCats = ['Biryani', 'Starters', 'Main Course', 'Breads', 'Rice', 'Beverages', 'Desserts'];
    const itemCats = (menuItems || []).map(i => i.category).filter(Boolean);
    const combined = Array.from(new Set([...defaultCats, ...itemCats, ...customCategories]))
      .filter(c => !deletedCategories.includes(c));
    return ['All', ...combined];
  }, [menuItems, customCategories, deletedCategories]);

  const [tables, setTables] = useState<RestaurantTable[]>(() => {
    const rawTables = (storedData?.tables && storedData.tables.length > 0) ? storedData.tables : [
      ...generateInitialTables('main'),
      ...generateInitialTables('city'),
      ...generateInitialTables('beach'),
    ];
    // Table physical status should strictly only be 'available', 'occupied', or 'billing'
    return rawTables.map((t: RestaurantTable) => {
      let status = t.status;
      if (status === 'ready' || status === 'waiting') {
        status = 'occupied';
      }
      // Guarantee Tables 2, 3, 5, and 6 in main branch have 'billing' status & synchronized amounts inclusive of GST
      if (t.branchId === 'main') {
        if (t.number === 2) {
          return { 
            ...t, 
            status: 'billing', 
            billRequested: true,
            currentAmount: 1243, // Real items total (1130) + 5% CGST (56.5) + 5% SGST (56.5)
            billRequestedAt: (t as any).billRequestedAt || '12:48 PM',
            billRequestedBy: t.assignedWaiterName || 'Ramesh Patel'
          };
        }
        if (t.number === 5) {
          return { 
            ...t, 
            status: 'billing', 
            billRequested: true,
            currentAmount: 1133, // Real items total (1030) + 5% CGST (51.5) + 5% SGST (51.5)
            billRequestedAt: (t as any).billRequestedAt || '12:50 PM',
            billRequestedBy: t.assignedWaiterName || 'Ramesh Patel'
          };
        }
        if (t.number === 3) {
          return { 
            ...t, 
            status: 'billing', 
            billRequested: true,
            currentAmount: 748, // 680 + 10% GST
            billRequestedAt: (t as any).billRequestedAt || '12:40 PM',
            billRequestedBy: t.assignedWaiterName || 'Ramesh Patel'
          };
        }
        if (t.number === 6) {
          return { 
            ...t, 
            status: 'billing', 
            billRequested: true,
            currentAmount: 330, // 300 + 10% GST
            billRequestedAt: (t as any).billRequestedAt || '12:52 PM',
            billRequestedBy: t.assignedWaiterName || 'Priya Nair'
          };
        }
      }
      return { ...t, status };
    });
  });

  const [kots, setKots] = useState<KOT[]>(() => {
    let list: KOT[] = storedData?.kots ?? INITIAL_KOTS;
    if (list.length < 15) {
      return INITIAL_KOTS;
    }
    const hasKot102 = list.some(k => k.kotNumber === 'KOT-102');
    const hasKot101 = list.some(k => k.kotNumber === 'KOT-101');
    if (!hasKot102 || !hasKot101) {
      const demoKots = INITIAL_KOTS.filter(k => k.kotNumber === 'KOT-102' || k.kotNumber === 'KOT-101');
      list = [...demoKots, ...list];
    }
    const hasKot10025 = list.some(k => k.kotNumber === 'KOT-10025');
    if (!hasKot10025) {
      const demoKot = INITIAL_KOTS.find(k => k.kotNumber === 'KOT-10025');
      if (demoKot) list = [demoKot, ...list];
    }
    const hasKot10111 = list.some(k => k.kotNumber === 'KOT-10111');
    if (!hasKot10111) {
      const demoKot = INITIAL_KOTS.find(k => k.kotNumber === 'KOT-10111');
      if (demoKot) list = [demoKot, ...list];
    }
    const hasKot10034 = list.some(k => k.kotNumber === 'KOT-10034');
    if (!hasKot10034) {
      const demoKot = INITIAL_KOTS.find(k => k.kotNumber === 'KOT-10034');
      if (demoKot) list = [demoKot, ...list];
    }
    // Normalize Dine-In orders in active stages so payment state is UNPAID
    list = list.map(k => {
      const isDineIn = !k.orderType || k.orderType === 'dine_in';
      const isActive = k.status === 'new' || k.status === 'preparing' || k.status === 'ready';
      if (isDineIn && isActive && !k.billId) {
        return {
          ...k,
          isBilled: false,
          isPaid: false,
          paymentStatus: 'UNPAID'
        };
      }
      return k;
    });
    return list;
  });

  const [bills, setBills] = useState<Bill[]>(() => {
    let list: Bill[] = storedData?.bills ?? INITIAL_BILLS;
    const hasInv10071 = list.some(b => b.billNumber === 'INV-10071');
    if (!hasInv10071) {
      const demoBill = INITIAL_BILLS.find(b => b.billNumber === 'INV-10071');
      if (demoBill) list = [demoBill, ...list];
    }
    const hasInv10089 = list.some(b => b.billNumber === 'INV-10089');
    if (!hasInv10089) {
      const demoBill = INITIAL_BILLS.find(b => b.billNumber === 'INV-10089');
      if (demoBill) list = [demoBill, ...list];
    }
    // Normalize active tables (Table 5 and Table 2) to UNPAID until settled by cashier
    return list.map(b => {
      const tbl = (b.tableNumber || '').toLowerCase();
      if ((tbl === 'table 5' || tbl === 'table 2' || b.billNumber === 'INV-10071' || b.billNumber === 'INV-10089') && b.status !== 'cancelled') {
        return {
          ...b,
          status: 'unpaid' as const,
          paymentStatus: 'UNPAID' as const,
          isPaid: false,
          isEstimate: true,
          grandTotal: tbl === 'table 5' || b.billNumber === 'INV-10071' ? 1133 : tbl === 'table 2' || b.billNumber === 'INV-10089' ? 1243 : b.grandTotal
        };
      }
      return b;
    });
  });

  const [customers, setCustomers] = useState<Customer[]>(
    storedData?.customers ?? INITIAL_CUSTOMERS
  );

  // Staff & Users State with RBAC
  const [users, setUsers] = useState<User[]>(() => {
    if (storedData?.users && Array.isArray(storedData.users) && storedData.users.length > 0) {
      return storedData.users;
    }
    return DEMO_USERS;
  });

  // Dynamic Restaurant Settings & Thermal Profile
  const [restaurantSettings, setRestaurantSettings] = useState<RestaurantSettings>(() => {
    if (storedData?.restaurantSettings) {
      return { ...DEFAULT_RESTAURANT_SETTINGS, ...storedData.restaurantSettings };
    }
    return DEFAULT_RESTAURANT_SETTINGS;
  });

  // Admin PIN Protection State
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState<boolean>(false);
  const [adminPinSuccessCallback, setAdminPinSuccessCallback] = useState<(() => void) | null>(null);

  // Table search & floor filter state
  const [tableSearchTerm, setTableSearchTerm] = useState<string>('');
  const [tableFloorFilter, setTableFloorFilter] = useState<string>('All');

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOrderType, setCartOrderType] = useState<OrderType>('dine_in');
  const [cartTableNumber, setCartTableNumber] = useState<string>('Table 5');
  const [takeawaySequence, setTakeawaySequence] = useState<number>(() => {
    const stored = storedData?.takeawaySequence;
    return typeof stored === 'number' && stored >= 102 ? stored : 102;
  });
  const [cartTakeawayId, setCartTakeawayId] = useState<string>(() => {
    return storedData?.cartTakeawayId ?? 'TK-102';
  });
  const [cartCustomerName, setCartCustomerName] = useState<string>('');
  const [cartCustomerMobile, setCartCustomerMobile] = useState<string>('');
  const [cartSpecialNotes, setCartSpecialNotes] = useState<string>('');
  const [cartPaidBill, setCartPaidBill] = useState<Bill | null>(storedData?.cartPaidBill ?? null);
  const [cartSentKotId, setCartSentKotId] = useState<string | null>(storedData?.cartSentKotId ?? null);
  const [cartDiscountPercent, setCartDiscountPercent] = useState<number>(0);
  const [cartCustomDiscount, setCartCustomDiscount] = useState<number>(0);
  const [savedActiveOrders, setSavedActiveOrders] = useState<Record<string, SavedActiveOrder>>(() => {
    return storedData?.savedActiveOrders ?? {};
  });
  const [isOrderSettled, setIsOrderSettled] = useState<boolean>(false);
  const [isBillPrinted, setIsBillPrinted] = useState<boolean>(false);

  // Modals & Toasts
  const [activeReceiptBill, setActiveReceiptBill] = useState<Bill | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [activeReceiptKOT, setActiveReceiptKOT] = useState<KOT | null>(null);
  const [isKOTModalOpen, setIsKOTModalOpen] = useState<boolean>(false);
  const [activeDetailsBill, setActiveDetailsBill] = useState<Bill | null>(null);
  const [isBillDetailsModalOpen, setIsBillDetailsModalOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Bill Requests state (for Waiter Request Bill -> Cashier Collect Payment)
  const [billRequests, setBillRequests] = useState<BillRequest[]>(() => {
    let list: BillRequest[] = (storedData?.billRequests && storedData.billRequests.length > 0)
      ? storedData.billRequests
      : INITIAL_BILL_REQUESTS;
    const hasTbl5 = list.some(r => r.tableNumber.toLowerCase() === 'table 5' && r.status === 'pending');
    if (!hasTbl5) {
      const demoReq = INITIAL_BILL_REQUESTS.find(r => r.tableNumber.toLowerCase() === 'table 5');
      if (demoReq) list = [{ ...demoReq, status: 'pending', totalAmount: 1133 }, ...list.filter(r => r.tableNumber.toLowerCase() !== 'table 5')];
    }
    const hasTbl2 = list.some(r => r.tableNumber.toLowerCase() === 'table 2' && r.status === 'pending');
    if (!hasTbl2) {
      const demoReq = INITIAL_BILL_REQUESTS.find(r => r.tableNumber.toLowerCase() === 'table 2');
      if (demoReq) list = [{ ...demoReq, status: 'pending', totalAmount: 1243 }, ...list.filter(r => r.tableNumber.toLowerCase() !== 'table 2')];
    }
    // Ensure all totals reflect real items total + 5% CGST + 5% SGST
    return list.map(r => {
      if (r.tableNumber.toLowerCase() === 'table 2') {
        return { ...r, totalAmount: 1243, kotNumbers: ['KOT-101'] };
      }
      if (r.tableNumber.toLowerCase() === 'table 5') {
        return { ...r, totalAmount: 1133, kotNumbers: ['KOT-102', 'KOT-10025'] };
      }
      return r;
    });
  });

  // KDS real-time cancellation alerts state
  const [kdsAlerts, setKdsAlerts] = useState<KDSAlert[]>([]);

  // Sequential counter tracker for next demo KOT (101, 102...) and Bill (INV-10025, INV-10071, INV-10089)
  const [kotSequence, setKotSequence] = useState<number>(() => {
    const stored = storedData?.kotSequence;
    return typeof stored === 'number' && stored >= 103 ? stored : 103;
  });
  const [billSequence, setBillSequence] = useState<number>(storedData?.billSequence ?? 10091);

  // Save to localStorage
  useEffect(() => {
    try {
      const stateToPersist = {
        currentUser,
        currentBranch,
        activeTab,
        menuItems,
        tables,
        kots,
        bills,
        customers,
        kotSequence,
        billSequence,
        cartPaidBill,
        cartSentKotId,
        takeawaySequence,
        cartTakeawayId,
        billRequests,
        users,
        restaurantSettings,
        savedActiveOrders
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToPersist));
    } catch {
      // Ignored
    }
  }, [currentUser, currentBranch, activeTab, menuItems, tables, kots, bills, customers, kotSequence, billSequence, cartPaidBill, cartSentKotId, takeawaySequence, cartTakeawayId, billRequests, users, restaurantSettings, savedActiveOrders]);

  // Toast Helper
  const showToast = (title: string, message: string, type: ToastMessage['type'] = 'success') => {
    const id = 'toast_' + Date.now() + Math.random().toString().slice(2, 6);
    const newToast: ToastMessage = { id, title, message, type, timestamp: Date.now() };
    setToasts(prev => [newToast, ...prev].slice(0, 5));

    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Auth Methods
  const login = (emailOrUsername: string, password = ''): { success: boolean; error?: string } => {
    const normalizedInput = (emailOrUsername || '').trim().toLowerCase();
    const cleanPassword = password.trim();

    // Support 4-digit PIN direct login via the input field
    if (/^\d{4}$/.test(normalizedInput) && (!cleanPassword || cleanPassword === normalizedInput)) {
      return loginWithPin(normalizedInput);
    }

    // Map username/email to valid accounts
    let userRole: 'owner' | 'cashier' | 'kitchen' | 'manager' | 'waiter' | 'admin' | null = null;
    let expectedPassword = '';
    let demoUserIndex = 0;

    if (normalizedInput === 'admin@restaurant.com' || normalizedInput === 'admin' || normalizedInput === 'owner') {
      userRole = 'owner';
      expectedPassword = 'admin123';
      demoUserIndex = 0;
    } else if (
      normalizedInput === 'admin@backoffice.com' || 
      normalizedInput === 'admin.backoffice' || 
      normalizedInput === 'admin.portal@restaurant.com' ||
      normalizedInput === 'adminlogin' ||
      normalizedInput === 'adminportal'
    ) {
      userRole = 'admin';
      expectedPassword = 'admin123';
      const idx = DEMO_USERS.findIndex(u => u.role === 'admin');
      demoUserIndex = idx >= 0 ? idx : 5;
    } else if (normalizedInput === 'cashier@restaurant.com' || normalizedInput === 'cashier') {
      userRole = 'cashier';
      expectedPassword = 'cashier123';
      demoUserIndex = 2;
    } else if (normalizedInput === 'kitchen@restaurant.com' || normalizedInput === 'kitchen') {
      userRole = 'kitchen';
      expectedPassword = 'kitchen123';
      demoUserIndex = 3;
    } else if (normalizedInput === 'manager@restaurant.com' || normalizedInput === 'manager') {
      userRole = 'manager';
      expectedPassword = 'manager123';
      demoUserIndex = 1;
    } else if (normalizedInput === 'waiter@restaurant.com' || normalizedInput === 'waiter') {
      userRole = 'waiter';
      expectedPassword = 'waiter123';
      demoUserIndex = 4;
    }

    // Also check dynamic users if not matched to static demo accounts
    if (!userRole) {
      const dynamicUser = users.find(u => u.email.toLowerCase() === normalizedInput && u.status !== 'inactive');
      if (dynamicUser) {
        if (cleanPassword === dynamicUser.pin || cleanPassword === `${dynamicUser.role}123` || cleanPassword === '1234') {
          try {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(dynamicUser));
          } catch (e) {
            console.error('Failed to save auth state', e);
          }
          setCurrentUser(dynamicUser);
          if (dynamicUser.role === 'admin') {
            setActiveTab('menu');
            setCurrentBranch('all');
          } else if (dynamicUser.role === 'owner') {
            setActiveTab('dashboard');
            setCurrentBranch('all');
          } else if (dynamicUser.role === 'manager' || dynamicUser.role === 'cashier') {
            setActiveTab('pos');
            setCurrentBranch('main');
          } else if (dynamicUser.role === 'waiter') {
            setActiveTab('tables');
            setCurrentBranch('main');
          } else {
            setActiveTab('dashboard');
            setCurrentBranch('main');
          }
          showToast('Welcome back', `Logged in as ${dynamicUser.name} (${dynamicUser.role.toUpperCase()})`);
          return { success: true };
        }
      }
    }

    const isAdminLogin = userRole === 'admin';
    const isPasswordValid = isAdminLogin
      ? (cleanPassword === 'admin123' || cleanPassword === 'admin' || cleanPassword === 'adminpass' || cleanPassword === '9999')
      : (cleanPassword === expectedPassword);

    if (!userRole || !isPasswordValid) {
      return { success: false, error: 'Invalid email or password' };
    }

    const matchedUser = DEMO_USERS[demoUserIndex] || users.find(u => u.role === userRole);
    if (!matchedUser) {
      return { success: false, error: 'Invalid email or password' };
    }

    // 1. Save authentication state in localStorage
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(matchedUser));
    } catch (e) {
      console.error('Failed to save auth state in localStorage', e);
    }

    // 2. Set authenticated user in React state
    setCurrentUser(matchedUser);

    // 3. Initial Routing after login:
    // ADMIN: Login -> Dedicated Menu Management / Staff Panel
    // OWNER: Login -> Dashboard
    // CASHIER: Login -> POS
    // MANAGER: Login -> POS (Branch 1 / Main Branch)
    // KITCHEN: Login -> Kitchen KDS
    // WAITER: Login -> Tables
    if (matchedUser.role === 'admin') {
      setActiveTab('menu');
      setCurrentBranch('all');
    } else if (matchedUser.role === 'owner') {
      setActiveTab('dashboard');
      setCurrentBranch('all');
    } else if (matchedUser.role === 'manager') {
      setActiveTab('pos');
      setCurrentBranch('main');
    } else if (matchedUser.role === 'cashier') {
      setActiveTab('pos');
      setCurrentBranch('main');
    } else if (matchedUser.role === 'kitchen') {
      setActiveTab('kitchen');
      setCurrentBranch('main');
    } else if (matchedUser.role === 'waiter') {
      setActiveTab('tables');
      setCurrentBranch('main');
    } else {
      setActiveTab('dashboard');
      setCurrentBranch('main');
    }

    showToast('Welcome back', `Logged in as ${matchedUser.name}`);
    return { success: true };
  };

  const loginWithPin = (pin: string): { success: boolean; error?: string } => {
    const cleanPin = (pin || '').trim();
    if (!cleanPin) {
      return { success: false, error: 'Please enter a 4-digit PIN' };
    }

    // Search active staff list and fallback to demo users
    const matchedUser = 
      users.find(u => u.pin === cleanPin && u.status !== 'inactive') ||
      DEMO_USERS.find(u => u.pin === cleanPin);

    if (!matchedUser) {
      return { success: false, error: 'Invalid PIN. Please check credentials or contact admin.' };
    }

    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(matchedUser));
    } catch (e) {
      console.error('Failed to save PIN auth state', e);
    }

    setCurrentUser(matchedUser);

    if (matchedUser.role === 'admin') {
      setActiveTab('menu');
      setCurrentBranch('all');
    } else if (matchedUser.role === 'owner') {
      setActiveTab('dashboard');
      setCurrentBranch('all');
    } else if (matchedUser.role === 'manager' || matchedUser.role === 'cashier') {
      setActiveTab('pos');
      setCurrentBranch('main');
    } else if (matchedUser.role === 'kitchen') {
      setActiveTab('kitchen');
      setCurrentBranch('main');
    } else if (matchedUser.role === 'waiter') {
      setActiveTab('tables');
      setCurrentBranch('main');
    } else {
      setActiveTab('dashboard');
      setCurrentBranch('main');
    }

    showToast('Welcome back', `Signed in as ${matchedUser.name} (${matchedUser.role.toUpperCase()})`);
    return { success: true };
  };

  const switchRole = (role: UserRole) => {
    const target = DEMO_USERS.find(u => u.role === role);
    if (!target) return;
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(target));
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.currentUser = target;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch (e) {
      console.error('Error saving role switch to localStorage:', e);
    }

    setCurrentUser(target);
    if (target.role === 'owner') {
      setActiveTab('dashboard');
      setCurrentBranch('all');
    } else if (target.role === 'manager') {
      setActiveTab('pos');
      setCurrentBranch('main');
    } else if (target.role === 'cashier') {
      setActiveTab('pos');
      setCurrentBranch('main');
    } else if (target.role === 'kitchen') {
      setActiveTab('kitchen');
      setCurrentBranch('main');
    } else if (target.role === 'waiter') {
      setActiveTab('tables');
      setCurrentBranch('main');
    }
    showToast('Role Switched', `Active User: ${target.name} (${target.role.toUpperCase()})`, 'info');
  };

  const logout = () => {
    // 1. Remove authentication from localStorage
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        delete parsed.currentUser;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch (e) {
      console.error('Error clearing auth from localStorage:', e);
    }

    // 2. Clear current user
    setCurrentUser(null);

    // 3. Reset active tab to default
    setActiveTab('dashboard');

    // 4. Redirect to Login & alert
    showToast('Logged Out', 'You have been signed out successfully.', 'info');
  };

  const setBranch = (branchId: BranchId) => {
    if (currentUser?.role !== 'owner' && branchId === 'all') {
      showToast('Restricted Access', 'Only the Owner can view consolidated branches data.', 'warning');
      return;
    }
    setCurrentBranch(branchId);
  };

  const handleSetActiveTab = (tab: string) => {
    if (currentUser?.role === 'waiter') {
      const allowed = ['dashboard', 'tables', 'pos', 'kot', 'kitchen'];
      if (!allowed.includes(tab)) {
        showToast('Restricted Access', 'Waiters do not have permission to access this section.', 'warning');
        return;
      }
    } else if (currentUser?.role === 'kitchen') {
      const allowed = ['kitchen', 'kot'];
      if (!allowed.includes(tab)) {
        showToast('Restricted Access', 'Kitchen display role is restricted to Kitchen KDS and KOT.', 'warning');
        return;
      }
    }
    setActiveTab(tab);
  };

  // Cart Operations
  const addToCart = (item: MenuItem, qty = 1, notes?: string, serveType?: ItemServeType, orderType?: OrderType) => {
    setIsOrderSettled(false);
    if (cartPaidBill) {
      showToast('Order Already Paid', `Invoice #${cartPaidBill.billNumber} is finalized. Send KOT or Start New Order.`, 'info');
      return;
    }

    const baseId = item.id.includes('_') ? item.id.split('_')[0] : item.id;
    const currentItem = (menuItems || []).find(m => m.id === baseId) || item;

    // Check Sold Out / 0 Stock
    const isSoldOut = !currentItem.available || currentItem.stockStatus === 'sold_out' || (currentItem.stockStatus === 'few_left' && (currentItem.stockCount ?? 0) <= 0);
    if (isSoldOut) {
      showToast('Item Unavailable', 'Item currently unavailable in kitchen', 'warning');
      return;
    }

    // Check "Few Left" limit
    if (currentItem.stockStatus === 'few_left' && typeof currentItem.stockCount === 'number') {
      const currentInCart = cart
        .filter(c => c.item.id === baseId || c.item.id.startsWith(`${baseId}_`))
        .reduce((sum, c) => sum + c.quantity, 0);

      const maxAllowed = currentItem.stockCount;
      if (currentInCart >= maxAllowed) {
        showToast('Stock Limit Reached', `Only ${maxAllowed} left in kitchen stock. Cannot add more.`, 'warning');
        return;
      }

      if (currentInCart + qty > maxAllowed) {
        qty = maxAllowed - currentInCart;
        showToast('Stock Limit Reached', `Only ${maxAllowed} left in kitchen stock. Adjusted quantity to ${qty}.`, 'info');
      }
    }

    const effectiveOrderType: OrderType = orderType || (serveType === 'DELIVERY' ? 'delivery' : serveType === 'TAKEAWAY' || serveType === 'PARCEL' ? 'takeaway' : cartOrderType);
    const effectiveServeType: ItemServeType = serveType || (effectiveOrderType === 'takeaway' || effectiveOrderType === 'parcel' ? 'PARCEL' : effectiveOrderType === 'delivery' ? 'DELIVERY' : 'DINE_IN');

    setIsBillPrinted(false);
    setCart(prev => {
      const existingIndex = prev.findIndex(c => c.item.id === item.id);
      if (existingIndex > -1) {
        const copy = [...prev];
        copy[existingIndex] = {
          ...copy[existingIndex],
          quantity: copy[existingIndex].quantity + qty,
          isSaved: false,
          isNew: true,
          ...(notes ? { notes } : {}),
          serveType: effectiveServeType,
          orderType: effectiveOrderType,
        };
        return copy;
      } else {
        return [...prev, { item, quantity: qty, serveType: effectiveServeType, orderType: effectiveOrderType, isSaved: false, isNew: true, ...(notes ? { notes } : {}) }];
      }
    });
  };

  const updateCartQuantity = (itemId: string, delta: number) => {
    setIsOrderSettled(false);
    setIsBillPrinted(false);
    if (cartPaidBill) {
      showToast('Order Already Paid', `Invoice #${cartPaidBill.billNumber} is finalized. Send KOT or Start New Order.`, 'info');
      return;
    }

    if (delta > 0) {
      const baseId = itemId.includes('_') ? itemId.split('_')[0] : itemId;
      const currentItem = (menuItems || []).find(m => m.id === baseId);
      if (currentItem) {
        const isSoldOut = !currentItem.available || currentItem.stockStatus === 'sold_out' || (currentItem.stockStatus === 'few_left' && (currentItem.stockCount ?? 0) <= 0);
        if (isSoldOut) {
          showToast('Item Unavailable', 'Item currently unavailable in kitchen', 'warning');
          return;
        }

        if (currentItem.stockStatus === 'few_left' && typeof currentItem.stockCount === 'number') {
          const currentInCart = cart
            .filter(c => c.item.id === baseId || c.item.id.startsWith(`${baseId}_`))
            .reduce((sum, c) => sum + c.quantity, 0);

          if (currentInCart + delta > currentItem.stockCount) {
            showToast('Stock Limit Reached', `Only ${currentItem.stockCount} left in kitchen stock.`, 'warning');
            return;
          }
        }
      }
    }

    setCart(prev => {
      return prev
        .map(c => {
          if (c.item.id === itemId) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty, isSaved: false, isNew: true } : null;
          }
          return c;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const updateCartItemNotes = (itemId: string, notes: string) => {
    setIsOrderSettled(false);
    setIsBillPrinted(false);
    setCart(prev => prev.map(c => c.item.id === itemId ? { ...c, notes, isSaved: false, isNew: true } : c));
  };

  const updateCartItemServeType = (itemId: string, serveType: ItemServeType) => {
    setIsOrderSettled(false);
    setIsBillPrinted(false);
    setCart(prev => prev.map(c => c.item.id === itemId ? { ...c, serveType, isSaved: false, isNew: true } : c));
  };

  const removeFromCart = (itemId: string) => {
    setIsOrderSettled(false);
    setIsBillPrinted(false);
    if (cartPaidBill) {
      showToast('Order Already Paid', `Invoice #${cartPaidBill.billNumber} is finalized. Send KOT or Start New Order.`, 'info');
      return;
    }
    setCart(prev => {
      const next = prev.filter(c => c.item.id !== itemId);
      return next.map(c => ({ ...c, isSaved: false, isNew: true }));
    });
  };

  const setCartItems = useCallback((items: CartItem[]) => {
    setIsBillPrinted(false);
    setCart(items);
  }, []);

  const clearCart = () => {
    setIsBillPrinted(false);
    setCart([]);
    setCartSpecialNotes('');
    setCartPaidBill(null);
    setCartSentKotId(null);
    setCartDiscountPercent(0);
    setCartCustomDiscount(0);
  };

  const resetCartOrder = () => {
    setIsBillPrinted(false);
    setCart([]);
    setCartSpecialNotes('');
    setCartCustomerName('');
    setCartCustomerMobile('');
    setCartPaidBill(null);
    setCartSentKotId(null);
    setCartOrderType('dine_in');
    setCartTableNumber('Table 1');
    setCartDiscountPercent(0);
    setCartCustomDiscount(0);
  };

  // Helper to check if current takeaway order/cart is empty
  const isCurrentTakeawayEmpty = useCallback(() => {
    // If cart has any items, order is not empty
    if (cart.length > 0) return false;

    // Check if there are any active unbilled KOTs for the current takeaway token
    const effectiveBranch = currentBranch === 'all' ? 'main' : currentBranch;
    const hasActiveKot = kots.some(k => {
      if (k.branchId !== effectiveBranch) return false;
      if (k.isBilled || k.status === 'cancelled') return false;
      const isTakeawayType = k.orderType === 'takeaway' || k.orderType === 'parcel' || k.orderType === 'delivery';
      if (!isTakeawayType) return false;
      const kotTakeawayId = k.takeawayId || (k.kotNumber ? `TK-${k.kotNumber.replace(/\D/g, '').slice(-3)}` : undefined);
      return kotTakeawayId && cartTakeawayId && kotTakeawayId.toLowerCase() === cartTakeawayId.toLowerCase();
    });

    return !hasActiveKot;
  }, [cart.length, currentBranch, kots, cartTakeawayId]);

  // Helper to determine if current active cart has been saved to Active list and has no unsaved changes
  const isCurrentOrderSaved = useMemo(() => {
    const isDineIn = cartOrderType === 'dine_in';
    const targetId = isDineIn ? cartTableNumber : (cartTakeawayId || 'TK-101');
    if (!targetId) return false;
    const orderKey = isDineIn ? `dine_in:${cartTableNumber.toLowerCase()}` : `takeaway:${targetId}`;
    const savedOrder = savedActiveOrders[orderKey];

    if (!savedOrder) return false;
    if (cart.length === 0) return false;
    if (cart.some(c => c.isNew || !c.isSaved)) return false;
    if (cart.length !== savedOrder.cart.length) return false;
    if ((cartCustomerName || '').trim() !== (savedOrder.customerName || '').trim()) return false;
    if ((cartCustomerMobile || '').trim() !== (savedOrder.customerMobile || '').trim()) return false;
    if ((cartSpecialNotes || '').trim() !== (savedOrder.specialNotes || '').trim()) return false;
    if ((cartCustomDiscount || 0) !== (savedOrder.customDiscount || 0)) return false;

    for (let i = 0; i < cart.length; i++) {
      const cItem = cart[i];
      const sItem = savedOrder.cart[i];
      if (!sItem) return false;
      if (
        cItem.item.id !== sItem.item.id ||
        cItem.quantity !== sItem.quantity ||
        (cItem.serveType || 'DINE_IN') !== (sItem.serveType || 'DINE_IN') ||
        (cItem.notes || '') !== (sItem.notes || '')
      ) {
        return false;
      }
    }

    return true;
  }, [
    cart,
    cartOrderType,
    cartTableNumber,
    cartTakeawayId,
    savedActiveOrders,
    cartCustomerName,
    cartCustomerMobile,
    cartSpecialNotes,
    cartCustomDiscount
  ]);

  // Helper to determine the next available takeaway token sequence (reusing unused empty tokens)
  const getNextAvailableTakeawayId = useCallback(() => {
    const occupiedNumbers = new Set<number>();

    // 1. Numbers from KOTs
    kots.forEach(k => {
      if (k.status === 'cancelled') return;
      const isTakeawayType = k.orderType === 'takeaway' || k.orderType === 'parcel' || k.orderType === 'delivery';
      if (!isTakeawayType && !k.takeawayId) return;
      const id = k.takeawayId || (k.kotNumber ? `TK-${k.kotNumber.replace(/\D/g, '').slice(-3)}` : undefined);
      if (id) {
        const num = parseInt(id.replace(/\D/g, ''), 10);
        if (!isNaN(num)) occupiedNumbers.add(num);
      }
    });

    // 2. Numbers from Bills
    bills.forEach(b => {
      if (b.status === 'cancelled') return;
      if (b.takeawayId) {
        const num = parseInt(b.takeawayId.replace(/\D/g, ''), 10);
        if (!isNaN(num)) occupiedNumbers.add(num);
      }
    });

    // 3. Numbers from savedActiveOrders (held active drafts)
    (Object.values(savedActiveOrders || {}) as SavedActiveOrder[]).forEach(s => {
      if (s.takeawayId) {
        const num = parseInt(s.takeawayId.replace(/\D/g, ''), 10);
        if (!isNaN(num)) occupiedNumbers.add(num);
      }
    });

    // 4. Current active token if it has items, is settled, or has active KOTs
    if (cartTakeawayId) {
      const isOccupied = cart.length > 0 || isOrderSettled || kots.some(k => {
        if (k.isBilled || k.status === 'cancelled') return false;
        const id = k.takeawayId || (k.kotNumber ? `TK-${k.kotNumber.replace(/\D/g, '').slice(-3)}` : undefined);
        return id && id.toLowerCase() === cartTakeawayId.toLowerCase();
      });
      if (isOccupied) {
        const num = parseInt(cartTakeawayId.replace(/\D/g, ''), 10);
        if (!isNaN(num)) occupiedNumbers.add(num);
      }
    }

    // Find the lowest sequence number >= 101 that is not currently in occupiedNumbers
    let seq = 101;
    while (occupiedNumbers.has(seq)) {
      seq++;
    }
    return { id: `TK-${seq}`, seq };
  }, [kots, bills, savedActiveOrders, cart.length, cartTakeawayId, isOrderSettled]);

  const startNewTakeawayOrder = useCallback(() => {
    // Generates next available token, resets/clears the cart, and initializes new empty ticket
    const { id: nextId, seq: nextSeq } = getNextAvailableTakeawayId();
    setTakeawaySequence(nextSeq);
    setCartTakeawayId(nextId);
    setCart([]);
    setCartCustomerName('');
    setCartCustomerMobile('');
    setCartSpecialNotes('');
    setCartPaidBill(null);
    setCartSentKotId(null);
    setCartDiscountPercent(0);
    setCartCustomDiscount(0);
    setIsOrderSettled(false);
    showToast('New Order Initialized', `Active ticket set to #${nextId}. Ready for new items.`, 'info');
  }, [getNextAvailableTakeawayId, showToast]);

  const selectTakeawayOrder = useCallback((takeawayId: string) => {
    setCartTakeawayId(takeawayId);
    setCartOrderType('takeaway');

    const orderKey = `takeaway:${takeawayId}`;
    const savedOrder = savedActiveOrders[orderKey];

    if (savedOrder && savedOrder.cart && savedOrder.cart.length > 0) {
      const loadedCart = savedOrder.cart.map(c => ({ ...c, isSaved: true, isNew: false }));
      setCart(loadedCart);
      setCartCustomerName(savedOrder.customerName || '');
      setCartCustomerMobile(savedOrder.customerMobile || '');
      setCartSpecialNotes(savedOrder.specialNotes || '');
      setCartDiscountPercent(savedOrder.discountPercent || 0);
      setCartCustomDiscount(savedOrder.customDiscount || 0);
      setCartPaidBill(null);
      setCartSentKotId(null);
      setIsOrderSettled(false);
      setIsBillPrinted(!!savedOrder.isPrinted);
      showToast('Order Loaded', `Active takeaway #${takeawayId} loaded to cart.`, 'info');
      return;
    }

    // Find unbilled KOT for this takeaway to populate customer info if exists
    const existingKot = kots.find(
      k =>
        (k.takeawayId === takeawayId || (k.kotNumber && `TK-${k.kotNumber.replace(/\D/g, '').slice(-3)}` === takeawayId)) &&
        !k.isBilled &&
        k.status !== 'cancelled'
    );
    if (existingKot) {
      if (existingKot.customerName) setCartCustomerName(existingKot.customerName);
      if (existingKot.customerMobile) setCartCustomerMobile(existingKot.customerMobile);
    } else {
      setCartCustomerName('');
      setCartCustomerMobile('');
    }

    // Cleanup: Reset draft cart when switching to an empty token
    setCart([]);
    setCartPaidBill(null);
    setCartSentKotId(null);
    setCartDiscountPercent(0);
    setCartCustomDiscount(0);
    setIsOrderSettled(false);
    setIsBillPrinted(false);
  }, [savedActiveOrders, kots, showToast]);

  const selectTableForPOS = useCallback((tableNumber: string) => {
    // 1. Auto-save previous table's un-sent cart items before switching to the new table
    if (cart.length > 0 && cartTableNumber && cartTableNumber.toLowerCase() !== tableNumber.toLowerCase()) {
      const prevOrderKey = `dine_in:${cartTableNumber.toLowerCase()}`;
      const subtotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
      const updatedCart = cart.map(c => ({ ...c, isSaved: true, isNew: false }));
      const now = new Date();

      const prevDraft: SavedActiveOrder = {
        id: cartTableNumber,
        key: prevOrderKey,
        orderType: 'dine_in',
        branchId: currentBranch === 'all' ? 'main' : currentBranch,
        tableNumber: cartTableNumber,
        cart: updatedCart,
        customerName: cartCustomerName || undefined,
        customerMobile: cartCustomerMobile || undefined,
        specialNotes: cartSpecialNotes || undefined,
        discountPercent: cartDiscountPercent || 0,
        customDiscount: cartCustomDiscount || 0,
        savedAt: now.toISOString(),
        subtotal,
      };

      setSavedActiveOrders(prev => ({
        ...prev,
        [prevOrderKey]: prevDraft
      }));
    }

    setCartTableNumber(tableNumber);
    setCartOrderType('dine_in');
    setActiveTab('pos');

    // 2. Lookup existing draft by table name or number
    const norm = tableNumber.toLowerCase().trim();
    const digits = tableNumber.replace(/[^0-9]/g, '');
    const orderKey = `dine_in:${norm}`;
    const altKey = digits ? `dine_in:table ${digits}` : orderKey;
    const shortKey = digits ? `dine_in:t${digits}` : orderKey;
    const savedOrder = savedActiveOrders[orderKey] || savedActiveOrders[altKey] || savedActiveOrders[shortKey];

    if (savedOrder && savedOrder.cart && savedOrder.cart.length > 0) {
      const loadedCart = savedOrder.cart.map(c => ({ ...c, isSaved: true, isNew: false }));
      setCart(loadedCart);
      setCartCustomerName(savedOrder.customerName || '');
      setCartCustomerMobile(savedOrder.customerMobile || '');
      setCartSpecialNotes(savedOrder.specialNotes || '');
      setCartDiscountPercent(savedOrder.discountPercent || 0);
      setCartCustomDiscount(savedOrder.customDiscount || 0);
      setCartPaidBill(null);
      setCartSentKotId(null);
      setIsOrderSettled(false);
      setIsBillPrinted(!!savedOrder.isPrinted);
      showToast('Draft Restored', `${tableNumber} draft with ${loadedCart.length} item(s) restored.`, 'info');
      return;
    }

    setCart([]);
    setCartCustomerName('');
    setCartCustomerMobile('');
    setCartSpecialNotes('');
    setCartDiscountPercent(0);
    setCartCustomDiscount(0);
    setIsOrderSettled(false);
    setIsBillPrinted(false);
  }, [cart, cartTableNumber, cartCustomerName, cartCustomerMobile, cartSpecialNotes, cartDiscountPercent, cartCustomDiscount, currentBranch, savedActiveOrders, showToast]);

  const saveActiveOrder = useCallback((isEstimate = false): Bill | null => {
    if (cart.length === 0) {
      showToast('No Order', 'Add items before saving order.', 'warning');
      return null;
    }

    const isDineIn = cartOrderType === 'dine_in';
    if (isDineIn && !cartTableNumber) {
      showToast('Select Table', 'Please assign a table before saving order.', 'warning');
      return null;
    }

    const effectiveBranch = currentBranch === 'all' ? 'main' : currentBranch;
    const branchObj = BRANCHES.find(b => b.id === effectiveBranch) || BRANCHES[0];
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const targetId = isDineIn ? cartTableNumber : (cartTakeawayId || 'TK-101');
    const orderKey = isDineIn ? `dine_in:${cartTableNumber.toLowerCase()}` : `takeaway:${targetId}`;

    const subtotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);

    // Mark all items as saved
    const updatedCart = cart.map(c => ({ ...c, isSaved: true, isNew: false }));
    setCart(updatedCart);

    // 1. Saves current order state to "Active Orders" (Draft/Held state)
    const savedOrder: SavedActiveOrder = {
      id: targetId,
      key: orderKey,
      orderType: cartOrderType,
      branchId: effectiveBranch,
      tableNumber: isDineIn ? cartTableNumber : undefined,
      takeawayId: !isDineIn ? targetId : undefined,
      cart: updatedCart,
      customerName: cartCustomerName || undefined,
      customerMobile: cartCustomerMobile || undefined,
      specialNotes: cartSpecialNotes || undefined,
      discountPercent: cartDiscountPercent || 0,
      customDiscount: cartCustomDiscount || 0,
      savedAt: now.toISOString(),
      subtotal,
      isPrinted: isEstimate ? true : savedActiveOrders[orderKey]?.isPrinted
    };

    setSavedActiveOrders(prev => ({
      ...prev,
      [orderKey]: savedOrder
    }));

    if (isEstimate) {
      setIsBillPrinted(true);
    }

    if (isDineIn) {
      setTables(prev =>
        prev.map(tbl => {
          if (tbl.name.toLowerCase() === cartTableNumber.toLowerCase()) {
            return {
              ...tbl,
              status: 'occupied',
              currentAmount: subtotal,
              guestName: cartCustomerName || tbl.guestName || 'Guest'
            };
          }
          return tbl;
        })
      );
    }

    // Build estimate bill preview if isEstimate requested
    let estimateBill: Bill | null = null;
    if (isEstimate) {
      const cgstPercent = restaurantSettings.cgstPercent ?? 5.0;
      const sgstPercent = restaurantSettings.sgstPercent ?? 5.0;
      const totalGstPercent = Number((cgstPercent + sgstPercent).toFixed(2));
      const cgstAmount = Number(((subtotal * (cgstPercent / 100))).toFixed(2));
      const sgstAmount = Number(((subtotal * (sgstPercent / 100))).toFixed(2));
      const gstAmount = Number((cgstAmount + sgstAmount).toFixed(2));
      const grandTotal = Math.max(0, Number((subtotal + cgstAmount + sgstAmount - (cartCustomDiscount || 0)).toFixed(2)));

      estimateBill = {
        id: 'est_' + Date.now(),
        billNumber: `EST-${Math.floor(1000 + Math.random() * 9000)}`,
        branchId: effectiveBranch as any,
        branchName: branchObj.name,
        date,
        time,
        tableNumber: isDineIn ? cartTableNumber : undefined,
        takeawayId: !isDineIn ? targetId : undefined,
        orderType: cartOrderType,
        customerName: cartCustomerName || 'Walk-in Guest',
        customerMobile: cartCustomerMobile || undefined,
        items: cart.map((c, idx) => ({
          id: c.item.id || `item_${idx}`,
          name: c.item.name,
          quantity: c.quantity,
          rate: c.item.price,
          amount: c.item.price * c.quantity,
          serveType: c.serveType || 'DINE_IN'
        })),
        subtotal,
        gstPercent: totalGstPercent,
        gstAmount,
        cgstPercent,
        cgstAmount,
        sgstPercent,
        sgstAmount,
        discountAmount: cartCustomDiscount || 0,
        grandTotal,
        paymentMethod: 'cash',
        status: 'provisional',
        isEstimate: true,
        cashierName: currentUser?.name || 'Anita',
        fssaiLicNo: restaurantSettings.fssai || '11223334000128'
      };
    }

    // 2. DO NOT create or send KOT to Kitchen/KDS (sendKOT is completely bypassed!)

    // 3. PERSIST & KEEP ACTIVE:
    // DO NOT automatically clear the cart or generate a fresh new order/ticket immediately.
    // Keep the saved order view active.
    setIsOrderSettled(false);

    // 4. Confirmation toast:
    if (isEstimate) {
      showToast(
        'Bill Preview Generated',
        isDineIn
          ? `Thermal bill receipt preview ready for Table ${cartTableNumber}.`
          : `Thermal bill receipt preview ready for Ticket #${targetId}.`,
        'success'
      );
    } else {
      showToast(
        'Order Saved Successfully',
        isDineIn
          ? `Table ${cartTableNumber} saved to Active list (KOT not sent).`
          : `Ticket #${targetId} saved to Active list (KOT not sent).`,
        'success'
      );
    }

    return estimateBill;
  }, [cart, cartOrderType, cartTableNumber, cartTakeawayId, cartCustomerName, cartCustomerMobile, cartSpecialNotes, cartDiscountPercent, cartCustomDiscount, currentBranch, restaurantSettings, currentUser, showToast]);

  const holdOrder = useCallback(() => {
    saveActiveOrder(false);
  }, [saveActiveOrder]);

  // KOT Flow
  const sendKOT = (overrideTableNumber?: string, overrideOrderType?: OrderType, overrideInstructions?: string): KOT | null => {
    if (cart.length === 0) {
      showToast('No items', 'Please add items before sending KOT.', 'warning');
      return null;
    }

    // Prevent duplicate KOT if already sent for this paid order
    if (cartPaidBill && cartSentKotId) {
      showToast('KOT Already Sent', `KOT was already sent to kitchen for invoice #${cartPaidBill.billNumber}.`, 'info');
      return null;
    }

    if (overrideOrderType) {
      setCartOrderType(overrideOrderType);
    }
    if (overrideInstructions !== undefined) {
      setCartSpecialNotes(overrideInstructions);
    }

    const effectiveBranch = currentBranch === 'all' ? 'main' : currentBranch;
    const branchObj = BRANCHES.find(b => b.id === effectiveBranch) || BRANCHES[0];
    const kotNumberStr = `KOT-${kotSequence}`;
    const nextSeq = kotSequence + 1;
    setKotSequence(nextSeq);

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const totalAmount = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
    const isPrepaid = !!cartPaidBill;
    const currentOrderType = overrideOrderType || (overrideTableNumber ? 'dine_in' : cartOrderType);
    const isTakeawayOrder = currentOrderType !== 'dine_in' && !overrideTableNumber;
    const effectiveTableNumber = overrideTableNumber || (currentOrderType === 'dine_in' ? cartTableNumber : undefined);
    const effectiveTakeawayId = isTakeawayOrder ? (cartTakeawayId || `TK-${takeawaySequence}`) : undefined;
    if (isTakeawayOrder && !cartTakeawayId && effectiveTakeawayId) {
      setCartTakeawayId(effectiveTakeawayId);
    }

    // Clear from savedActiveOrders if this order had a saved draft
    const orderKey = (overrideTableNumber || currentOrderType === 'dine_in')
      ? `dine_in:${(overrideTableNumber || cartTableNumber).toLowerCase()}`
      : `takeaway:${cartTakeawayId || 'TK-101'}`;
    setSavedActiveOrders(prev => {
      if (!prev[orderKey]) return prev;
      const next = { ...prev };
      delete next[orderKey];
      return next;
    });

    const newKOT: KOT = {
      id: 'kot_' + Date.now(),
      kotNumber: kotNumberStr,
      branchId: branchObj.id,
      branchName: branchObj.name,
      tableNumber: effectiveTableNumber,
      takeawayId: effectiveTakeawayId,
      orderType: currentOrderType,
      items: cart.map(c => ({
        menuItemId: c.item.id,
        name: c.item.name,
        quantity: c.quantity,
        rate: c.item.price,
        isVeg: c.item.isVeg,
        notes: c.notes,
        serveType: c.serveType || (c.orderType === 'delivery' ? 'DELIVERY' : c.orderType === 'takeaway' || currentOrderType !== 'dine_in' ? 'PARCEL' : 'DINE_IN'),
        orderType: c.orderType || currentOrderType
      })),
      status: 'new',
      createdAt: now.toISOString(),
      timeFormatted,
      specialInstructions: overrideInstructions !== undefined ? overrideInstructions : cartSpecialNotes,
      customerName: cartCustomerName || cartPaidBill?.customerName || undefined,
      customerMobile: cartCustomerMobile || cartPaidBill?.customerMobile || undefined,
      totalAmount,
      isBilled: isPrepaid,
      isPaid: isPrepaid,
      paymentStatus: isPrepaid ? 'PAID' : 'UNPAID',
      billId: cartPaidBill?.id,
      billedAt: isPrepaid ? now.toISOString() : undefined,
      serverName: currentUser?.name || 'Staff'
    };

    // Update KOT list
    setKots(prev => [newKOT, ...prev]);

    // Identify and update associated bill in bills history
    const targetBillId = cartPaidBill?.id;
    const targetBillNumber = cartPaidBill?.billNumber;
    const associatedBill = cartPaidBill || bills.find(b =>
      b.branchId === branchObj.id &&
      !b.kotSent &&
      b.status !== 'cancelled' &&
      ((effectiveTableNumber && b.tableNumber?.toLowerCase() === effectiveTableNumber.toLowerCase()) ||
       (effectiveTakeawayId && (b.takeawayId === effectiveTakeawayId || (targetBillNumber && b.billNumber === targetBillNumber))))
    );

    if (associatedBill || cartPaidBill) {
      const billIdToUpdate = associatedBill?.id || cartPaidBill?.id;
      const billNumToUpdate = associatedBill?.billNumber || cartPaidBill?.billNumber;

      setBills(prev =>
        prev.map(b => {
          if (b.id === billIdToUpdate || (billNumToUpdate && b.billNumber === billNumToUpdate)) {
            const existingList = b.kotNumbers || (b.kotNumber ? [b.kotNumber] : []);
            const updatedList = existingList.includes(kotNumberStr) ? existingList : [...existingList, kotNumberStr];
            return {
              ...b,
              kotStatus: 'KOT Sent',
              kotId: kotNumberStr,
              kotSent: true,
              kotSentAt: now.toISOString(),
              kotNumber: kotNumberStr,
              kotNumbers: updatedList
            };
          }
          return b;
        })
      );

      setCartPaidBill(prev =>
        prev
          ? {
              ...prev,
              kotStatus: 'KOT Sent',
              kotId: kotNumberStr,
              kotSent: true,
              kotSentAt: now.toISOString(),
              kotNumber: kotNumberStr,
              kotNumbers: [kotNumberStr]
            }
          : null
      );

      setActiveDetailsBill(prev => {
        if (prev && (prev.id === billIdToUpdate || (billNumToUpdate && prev.billNumber === billNumToUpdate))) {
          const existingList = prev.kotNumbers || (prev.kotNumber ? [prev.kotNumber] : []);
          const updatedList = existingList.includes(kotNumberStr) ? existingList : [...existingList, kotNumberStr];
          return {
            ...prev,
            kotStatus: 'KOT Sent',
            kotId: kotNumberStr,
            kotSent: true,
            kotSentAt: now.toISOString(),
            kotNumber: kotNumberStr,
            kotNumbers: updatedList
          };
        }
        return prev;
      });

      setCartSentKotId(newKOT.id);
    }

    // Update table status if dine_in
    const activeTable = effectiveTableNumber;
    if ((cartOrderType === 'dine_in' || overrideTableNumber) && activeTable) {
      setTables(prev =>
        prev.map(tbl => {
          if (tbl.branchId === effectiveBranch && tbl.name.toLowerCase() === activeTable.toLowerCase()) {
            const previousAmt = tbl.status === 'occupied' && tbl.currentAmount ? tbl.currentAmount : 0;
            return {
              ...tbl,
              status: 'occupied',
              activeKotId: newKOT.id,
              currentAmount: previousAmt + totalAmount,
              guestName: cartCustomerName || tbl.guestName || undefined,
              seatedAt: tbl.seatedAt || timeFormatted
            };
          }
          return tbl;
        })
      );
    }

    // Decrement stock for Few Left items
    setMenuItems(prev =>
      prev.map(m => {
        const baseId = m.id;
        const orderedQty = cart
          .filter(c => c.item.id === baseId || c.item.id.startsWith(`${baseId}_`))
          .reduce((sum, c) => sum + c.quantity, 0);

        if (orderedQty > 0 && m.stockStatus === 'few_left' && typeof m.stockCount === 'number') {
          const nextCount = Math.max(0, m.stockCount - orderedQty);
          return {
            ...m,
            stockCount: nextCount,
            stockStatus: nextCount === 0 ? 'sold_out' : 'few_left',
            available: nextCount > 0,
          };
        }
        return m;
      })
    );

    // Clear new punch items from cart
    setCart([]);
    setCartSpecialNotes('');

    // If order was settled/paid, reset terminal and advance to next available ticket
    if (isPrepaid || isOrderSettled) {
      setCartCustomerName('');
      setCartCustomerMobile('');
      setCartDiscountPercent(0);
      setCartCustomDiscount(0);
      setCartPaidBill(null);
      setCartSentKotId(null);
      setIsOrderSettled(false);

      if (cartOrderType !== 'dine_in' && !overrideTableNumber) {
        const { id: nextId, seq: nextSeq } = getNextAvailableTakeawayId();
        setTakeawaySequence(nextSeq);
        setCartTakeawayId(nextId);
      }
    }

    showToast(
      isPrepaid || isOrderSettled ? 'KOT Dispatched & Order Completed' : 'KOT Created & Sent',
      `${kotNumberStr} sent to Kitchen KDS • Status: New${isPrepaid || isOrderSettled ? ' • PAID' : ''}`,
      'success'
    );
    return newKOT;
  };

  const updateKOTStatus = (kotId: string, status: KOTStatus) => {
    setKots(prev =>
      prev.map(k => {
        if (k.id === kotId) {
          const updated = { ...k, status };
          if (status === 'preparing' && !k.startedAt) {
            updated.startedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }
          if (status === 'ready' && !k.readyAt) {
            updated.readyAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }
          if (status === 'picked_up' && !k.pickedUpAt) {
            updated.pickedUpAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }
          if (status === 'served' && !k.servedAt) {
            updated.servedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }
          return updated;
        }
        return k;
      })
    );

    const targetKot = kots.find(k => k.id === kotId);
    if (targetKot) {
      // Live Shift/Session Dispatched Tracking (Dine-in vs Takeaway Breakdown)
      if (status === 'ready' || status === 'picked_up' || status === 'served') {
        if (!dispatchedKotIds.has(kotId)) {
          setDispatchedKotIds(prev => new Set(prev).add(kotId));
          const isTakeaway = targetKot.orderType === 'takeaway' || targetKot.orderType === 'parcel';
          setDispatchedDishes(prev => {
            const next = { ...prev };
            targetKot.items.forEach(item => {
              if (item.status !== 'voided') {
                const itemParcel = item.serveType === 'PARCEL' || isTakeaway;
                const current = next[item.name] || { dineIn: 0, takeaway: 0 };
                next[item.name] = {
                  dineIn: current.dineIn + (itemParcel ? 0 : item.quantity),
                  takeaway: current.takeaway + (itemParcel ? item.quantity : 0)
                };
              }
            });
            return next;
          });
        }
      }
      if (status === 'ready') {
        showToast('KOT Ready!', `${targetKot.kotNumber} for ${targetKot.tableNumber || 'Takeaway'} is ready for pickup!`);
        // Table physical status strictly remains 'occupied' (or 'billing'); do not replace with 'ready'
      } else if (status === 'picked_up') {
        showToast('Food Picked Up', `${targetKot.kotNumber} picked up — en route to ${targetKot.tableNumber || 'Takeaway'}!`, 'info');
      } else if (status === 'preparing') {
        showToast('Kitchen Cooking', `Kitchen started preparing ${targetKot.kotNumber}`);
      } else if (status === 'served') {
        showToast('Order Served', `${targetKot.kotNumber} marked as served to guests.`, 'success');
        if (targetKot.tableNumber) {
          setTables(prev =>
            prev.map(tbl =>
              tbl.branchId === targetKot.branchId && tbl.name.toLowerCase() === targetKot.tableNumber?.toLowerCase()
                ? { ...tbl, status: tbl.status === 'billing' ? 'billing' : 'occupied' }
                : tbl
            )
          );
        }
      }
    }
  };

  // Void/Cancel an item in an already sent KOT (preserves audit history, updates running bill & table amount, notifies KDS)
  const voidKOTItem = (
    kotId: string,
    itemIndex: number,
    voidQty?: number,
    reason = 'Customer requested cancellation'
  ): boolean => {
    const targetKot = kots.find(k => k.id === kotId);
    if (!targetKot) {
      showToast('KOT Not Found', 'Could not locate the specified kitchen ticket.', 'error');
      return false;
    }

    if (targetKot.isBilled) {
      showToast('Action Restricted', 'This KOT has already been finalized and billed. Cannot void items.', 'warning');
      return false;
    }

    const itemToVoid = targetKot.items[itemIndex];
    if (!itemToVoid) {
      showToast('Item Not Found', 'Item line does not exist in this KOT.', 'error');
      return false;
    }

    if (itemToVoid.status === 'voided') {
      showToast('Already Voided', 'This item is already marked as voided.', 'info');
      return false;
    }

    const qtyToVoid = Math.min(itemToVoid.quantity, Math.max(1, voidQty ?? itemToVoid.quantity));
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const voidedByName = currentUser?.name || 'Waiter';

    let updatedItems: KOTItem[] = [];

    if (qtyToVoid >= itemToVoid.quantity) {
      // Void the entire item line
      updatedItems = targetKot.items.map((it, idx) => {
        if (idx === itemIndex) {
          return {
            ...it,
            status: 'voided' as const,
            voidedAt: timeFormatted,
            voidedBy: voidedByName,
            voidReason: reason
          };
        }
        return it;
      });
    } else {
      // Partial void: split into active remaining part and voided part
      const remainingActive: KOTItem = {
        ...itemToVoid,
        quantity: itemToVoid.quantity - qtyToVoid,
        status: 'active' as const
      };
      const voidedPart: KOTItem = {
        ...itemToVoid,
        quantity: qtyToVoid,
        status: 'voided' as const,
        voidedAt: timeFormatted,
        voidedBy: voidedByName,
        voidReason: reason,
        originalQuantity: itemToVoid.quantity
      };

      updatedItems = [];
      targetKot.items.forEach((it, idx) => {
        if (idx === itemIndex) {
          updatedItems.push(remainingActive);
          updatedItems.push(voidedPart);
        } else {
          updatedItems.push(it);
        }
      });
    }

    // Recalculate KOT active total amount
    const newActiveTotal = updatedItems.reduce((sum, it) => {
      if (it.status === 'voided') return sum;
      return sum + (it.rate * it.quantity);
    }, 0);

    const allItemsVoided = updatedItems.every(it => it.status === 'voided');

    setKots(prev =>
      prev.map(k => {
        if (k.id === kotId) {
          return {
            ...k,
            items: updatedItems,
            totalAmount: newActiveTotal,
            hasVoidedItems: true,
            status: allItemsVoided ? 'cancelled' : k.status
          };
        }
        return k;
      })
    );

    // If dining in table, update table's currentAmount (reduce by voided value)
    const voidedAmount = qtyToVoid * itemToVoid.rate;
    if (targetKot.orderType === 'dine_in' && targetKot.tableNumber) {
      setTables(prev =>
        prev.map(tbl => {
          if (tbl.branchId === targetKot.branchId && tbl.name.toLowerCase() === targetKot.tableNumber?.toLowerCase()) {
            const newTableAmt = Math.max(0, (tbl.currentAmount || 0) - voidedAmount);
            return {
              ...tbl,
              currentAmount: newTableAmt
            };
          }
          return tbl;
        })
      );
    }

    // Add immediate alert for KDS
    const alertId = 'alert_' + Date.now();
    const newAlert: KDSAlert = {
      id: alertId,
      kotId: targetKot.id,
      kotNumber: targetKot.kotNumber,
      tableNumber: targetKot.tableNumber,
      itemName: itemToVoid.name,
      quantity: qtyToVoid,
      voidedBy: voidedByName,
      time: timeFormatted,
      reason,
      dismissed: false
    };
    setKdsAlerts(prev => [newAlert, ...prev]);

    showToast(
      'Item Voided & KDS Notified',
      `${qtyToVoid}x ${itemToVoid.name} cancelled on ${targetKot.kotNumber}. Notified Kitchen KDS.`,
      'info'
    );

    return true;
  };

  const dismissKDSAlert = (alertId: string) => {
    setKdsAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  // Query active unbilled KOTs for a dining session or takeaway order
  const getActiveUnbilledKots = useCallback((
    tableNumber?: string,
    orderType?: OrderType,
    customerMobile?: string,
    takeawayId?: string
  ): KOT[] => {
    const effectiveBranch = currentBranch === 'all' ? 'main' : currentBranch;
    const targetType = orderType || cartOrderType;
    const targetTable = tableNumber || (targetType === 'dine_in' ? cartTableNumber : undefined);
    const targetMobile = customerMobile || cartCustomerMobile;
    const targetTakeawayId = takeawayId || (targetType !== 'dine_in' ? cartTakeawayId : undefined);

    if (targetType === 'dine_in') {
      if (!targetTable) return [];
      return kots.filter(
        k => k.branchId === effectiveBranch &&
             k.orderType === 'dine_in' &&
             k.tableNumber?.toLowerCase() === targetTable.toLowerCase() &&
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
          if (targetTakeawayId && kotTakeawayId) {
            return kotTakeawayId.toLowerCase() === targetTakeawayId.toLowerCase();
          }
          if (targetMobile && k.customerMobile) {
            return k.customerMobile === targetMobile;
          }
          if (targetTakeawayId && !kotTakeawayId && !k.customerMobile) {
            return true;
          }
          return false;
        }
      );
    }
  }, [currentBranch, cartOrderType, cartTableNumber, cartCustomerMobile, cartTakeawayId, kots]);

  // Generate Bill & Payment Recording
  const generateBill = (
    paymentMethod: PaymentMethod,
    splitDetails?: SplitPaymentDetail,
    discountAmount = 0
  ): Bill | null => {
    // Permission check: Waiter is strictly forbidden from collecting payment or finalizing tax invoices
    if (currentUser?.role === 'waiter') {
      showToast('Action Restricted', 'Waiters are not permitted to collect payment or finalize tax invoices. Please use Request Bill.', 'warning');
      return null;
    }

    // If order was already paid, do not create a second bill
    if (cartPaidBill) {
      showToast('Order Already Paid', `Order is already finalized under invoice #${cartPaidBill.billNumber}.`, 'info');
      return cartPaidBill;
    }

    const effectiveBranch = currentBranch === 'all' ? 'main' : currentBranch;
    const branchObj = BRANCHES.find(b => b.id === effectiveBranch) || BRANCHES[0];

    // 1. Retrieve all active unbilled KOTs for this dining session / table / takeaway ticket
    const activeKots = getActiveUnbilledKots(cartTableNumber, cartOrderType, cartCustomerMobile, cartTakeawayId);

    const billItems: BillItem[] = [];

    // Helper to merge duplicate items with same name, rate & serveType (summing quantities)
    const addOrMergeBillItem = (id: string, name: string, quantity: number, rate: number, serveType: ItemServeType = 'DINE_IN') => {
      const existing = billItems.find(
        b => b.name.toLowerCase() === name.toLowerCase() && b.rate === rate && (b.serveType || 'DINE_IN') === serveType
      );
      if (existing) {
        existing.quantity += quantity;
        existing.amount = existing.quantity * existing.rate;
      } else {
        billItems.push({
          id,
          name,
          quantity,
          rate,
          amount: rate * quantity,
          serveType
        });
      }
    };

    // 2. Combine all items from every unbilled KOT
    if (activeKots.length > 0) {
      activeKots.forEach(kot => {
        kot.items.forEach((it, idx) => {
          if (it.status === 'voided') return; // Exclude voided items from bill
          addOrMergeBillItem(
            it.menuItemId || `${kot.id}_item_${idx}`,
            it.name,
            it.quantity,
            it.rate,
            it.serveType || 'DINE_IN'
          );
        });
      });

      // Also include any unsent items currently in the cart
      if (cart.length > 0) {
        cart.forEach(c => {
          addOrMergeBillItem(c.item.id, c.item.name, c.quantity, c.item.price, c.serveType || 'DINE_IN');
        });
      }
    } else if (cart.length > 0) {
      cart.forEach(c => {
        addOrMergeBillItem(c.item.id, c.item.name, c.quantity, c.item.price, c.serveType || 'DINE_IN');
      });
    }

    if (billItems.length === 0) {
      showToast('No items to bill', 'Add items or select an active table with unbilled KOTs to generate bill.', 'error');
      return null;
    }

    const subtotal = billItems.reduce((s, i) => s + i.amount, 0);
    const cgstPercent = restaurantSettings.cgstPercent ?? 5.0;
    const sgstPercent = restaurantSettings.sgstPercent ?? 5.0;
    const totalGstPercent = Number((cgstPercent + sgstPercent).toFixed(2));
    const cgstAmount = Number(((subtotal * (cgstPercent / 100))).toFixed(2));
    const sgstAmount = Number(((subtotal * (sgstPercent / 100))).toFixed(2));
    const gstAmount = Number((cgstAmount + sgstAmount).toFixed(2));
    const grandTotal = Math.max(0, Number((subtotal + cgstAmount + sgstAmount - discountAmount).toFixed(2)));

    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const billNumberStr = `INV-${billSequence}`;
    setBillSequence(prev => prev + 1);

    // Infer customer name / mobile if not set in cart
    const effectiveCustomerName = cartCustomerName || activeKots.find(k => k.customerName)?.customerName || 'Walk-in Guest';
    const effectiveCustomerMobile = cartCustomerMobile || activeKots.find(k => k.customerMobile)?.customerMobile || undefined;

    // KOT numbers from the active KOTs combined in this bill (if any already sent)
    const kotNumbersList = activeKots.map(k => k.kotNumber);
    const kotNumberStr = kotNumbersList.length > 0 ? kotNumbersList.join(', ') : undefined;

    // Infer steward/waiter name from active KOTs or table
    const effectiveStewardName = activeKots.find(k => k.serverName || k.waiterName)?.serverName 
      || activeKots.find(k => k.serverName || k.waiterName)?.waiterName 
      || 'Ramesh Patel';

    const newBill: Bill = {
      id: 'bill_' + Date.now(),
      billNumber: billNumberStr,
      kotNumber: kotNumberStr,
      kotNumbers: kotNumbersList.length > 0 ? kotNumbersList : undefined,
      kotSent: kotNumbersList.length > 0,
      kotSentAt: kotNumbersList.length > 0 ? now.toISOString() : undefined,
      branchId: branchObj.id,
      branchName: branchObj.name,
      date,
      time,
      tableNumber: cartOrderType === 'dine_in' ? cartTableNumber : undefined,
      takeawayId: cartOrderType !== 'dine_in' ? (cartTakeawayId || activeKots.find(k => k.takeawayId)?.takeawayId) : undefined,
      orderType: cartOrderType,
      customerName: effectiveCustomerName,
      customerMobile: effectiveCustomerMobile,
      items: billItems,
      subtotal,
      gstPercent: totalGstPercent,
      gstAmount,
      cgstPercent,
      cgstAmount,
      sgstPercent,
      sgstAmount,
      discountAmount,
      grandTotal,
      paymentMethod,
      splitDetails: paymentMethod === 'split' ? splitDetails : undefined,
      status: paymentMethod === 'due' ? 'unpaid' : 'paid',
      paymentStatus: paymentMethod === 'due' ? 'UNPAID' : 'PAID',
      isPaid: paymentMethod !== 'due',
      cashierName: currentUser?.name || 'Anita',
      stewardName: effectiveStewardName,
      fssaiLicNo: branchObj.fssai || '11223334000128'
    };

    // Prepend to bills history and mark matching un-settled estimate bills for this table as settled
    setBills(prev => [
      newBill,
      ...prev.map(b => {
        if (
          cartOrderType === 'dine_in' &&
          cartTableNumber &&
          b.tableNumber?.toLowerCase() === cartTableNumber.toLowerCase() &&
          b.status !== 'paid'
        ) {
          return {
            ...b,
            status: (paymentMethod === 'due' ? 'unpaid' : 'paid') as BillStatus,
            paymentStatus: (paymentMethod === 'due' ? 'UNPAID' : 'PAID') as 'PAID' | 'UNPAID',
            isPaid: paymentMethod !== 'due',
            isEstimate: false,
            paymentMethod
          };
        }
        return b;
      })
    ]);

    // Mark all previously included KOTs as billed/settled
    const includedKotIds = activeKots.map(k => k.id);
    if (includedKotIds.length > 0) {
      setKots(prev =>
        prev.map(k => {
          if (includedKotIds.includes(k.id)) {
            return {
              ...k,
              isBilled: true,
              isPaid: newBill.status === 'paid',
              paymentStatus: newBill.status === 'paid' ? 'PAID' : 'UNPAID',
              billId: newBill.id,
              billedAt: now.toISOString()
            };
          }
          return k;
        })
      );
    }

    // Free up table if dine_in and settle any pending bill request
    if (cartOrderType === 'dine_in' && cartTableNumber) {
      // Settle any pending bill request for this table
      setBillRequests(prev =>
        prev.map(r => {
          if (
            r.branchId === effectiveBranch &&
            r.tableNumber.toLowerCase() === cartTableNumber.toLowerCase() &&
            r.status === 'pending'
          ) {
            return {
              ...r,
              status: 'settled',
              billId: newBill.id,
              billNumber: newBill.billNumber
            };
          }
          return r;
        })
      );

      setTables(prev =>
        prev.map(tbl => {
          if (tbl.branchId === effectiveBranch && tbl.name.toLowerCase() === cartTableNumber.toLowerCase()) {
            return {
              ...tbl,
              status: 'available',
              activeKotId: undefined,
              activeBillId: undefined,
              currentAmount: 0,
              seatedAt: undefined,
              guestCount: undefined,
              guestName: undefined,
              billRequested: false,
              billRequestedAt: undefined,
              billRequestedBy: undefined
            };
          }
          return tbl;
        })
      );
    }

    // Update customer stats if customer mobile exists
    if (cartCustomerMobile) {
      setCustomers(prev => {
        const existing = prev.find(c => c.mobile === cartCustomerMobile);
        if (existing) {
          return prev.map(c =>
            c.mobile === cartCustomerMobile
              ? {
                  ...c,
                  totalOrders: c.totalOrders + 1,
                  totalSpent: c.totalSpent + grandTotal,
                  lastVisit: date
                }
              : c
          );
        } else {
          return [
            ...prev,
            {
              id: 'cust_' + Date.now(),
              name: cartCustomerName || 'Guest',
              mobile: cartCustomerMobile,
              totalOrders: 1,
              totalSpent: grandTotal,
              lastVisit: date,
              favoriteBranch: branchObj.name
            }
          ];
        }
      });
    }

    // Remove order draft from savedActiveOrders if this order had a saved draft
    const targetOrderKey = cartOrderType === 'dine_in'
      ? (cartTableNumber ? `dine_in:${cartTableNumber.toLowerCase()}` : undefined)
      : `takeaway:${cartTakeawayId || 'TK-101'}`;

    if (targetOrderKey) {
      setSavedActiveOrders(prev => {
        if (!prev[targetOrderKey]) return prev;
        const next = { ...prev };
        delete next[targetOrderKey];
        return next;
      });
    }

    setCartPaidBill(newBill);
    setCartSentKotId(null);
    setIsOrderSettled(true);

    // Show thermal receipt modal automatically for confirmation (Paid Tax Invoice)
    setActiveReceiptBill(newBill);
    setIsReceiptModalOpen(true);

    showToast(
      'Payment Settled (PAID)',
      `Bill #${billNumberStr} marked as PAID via ${paymentMethod.toUpperCase()}.`,
      'success'
    );
    return newBill;
  };

  const voidBill = (billId: string, reason: string): boolean => {
    const targetBill = bills.find(b => b.id === billId || b.billNumber === billId);
    if (!targetBill) {
      showToast('Error', 'Bill not found.', 'error');
      return false;
    }

    const cancelReason = reason || 'Manager Void / Cancellation';
    const cancelledByName = currentUser?.name || 'Vikram Sharma (Manager)';
    const voidTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    setBills(prev => prev.map(b => {
      if (b.id === targetBill.id) {
        return {
          ...b,
          status: 'cancelled' as BillStatus,
          cancelledBy: cancelledByName,
          cancelReason: cancelReason,
          voidedAt: voidTime
        };
      }
      return b;
    }));

    if (activeDetailsBill && (activeDetailsBill.id === targetBill.id || activeDetailsBill.billNumber === targetBill.billNumber)) {
      setActiveDetailsBill(prev => prev ? {
        ...prev,
        status: 'cancelled' as BillStatus,
        cancelledBy: cancelledByName,
        cancelReason: cancelReason,
        voidedAt: voidTime
      } : null);
    }

    // Add alert to KDS & notification bell for void tracking
    const newAlert: KDSAlert = {
      id: `alert_void_${Date.now()}`,
      kotId: targetBill.kotNumber || targetBill.billNumber,
      kotNumber: targetBill.billNumber,
      tableNumber: targetBill.tableNumber,
      itemName: `VOID INVOICE #${targetBill.billNumber}`,
      quantity: targetBill.items?.length || 1,
      voidedBy: cancelledByName,
      time: voidTime,
      reason: cancelReason,
      dismissed: false
    };
    setKdsAlerts(prev => [newAlert, ...prev]);

    showToast('Bill Voided', `Invoice #${targetBill.billNumber} cancelled: ${cancelReason}`, 'warning');
    return true;
  };

  const openReceiptModal = (bill: Bill) => {
    setIsKOTModalOpen(false);
    setActiveReceiptKOT(null);
    setActiveReceiptBill(bill);
    setIsReceiptModalOpen(true);
  };

  const closeReceiptModal = () => {
    setIsReceiptModalOpen(false);
    setActiveReceiptBill(null);
  };

  const openKOTModal = (kot: KOT) => {
    setIsReceiptModalOpen(false);
    setActiveReceiptBill(null);
    setActiveReceiptKOT(kot);
    setIsKOTModalOpen(true);
  };

  const closeKOTModal = () => {
    setIsKOTModalOpen(false);
    setActiveReceiptKOT(null);
  };

  const openBillDetailsModal = (bill: Bill) => {
    setActiveDetailsBill(bill);
    setIsBillDetailsModalOpen(true);
  };

  const closeBillDetailsModal = () => {
    setIsBillDetailsModalOpen(false);
  };

  // Retroactive KOT dispatch for completed/settled bills
  const sendKotForBill = useCallback((bill: Bill): KOT | null => {
    if (!bill || !bill.items || bill.items.length === 0) {
      showToast('No items', 'Cannot dispatch KOT for an empty bill.', 'warning');
      return null;
    }

    // Safety: If KOT is already sent, re-send should NOT create a duplicate ticket!
    const isAlreadySent = bill.kotSent === true ||
      bill.kotStatus === 'KOT Sent' ||
      bill.kotStatus === 'DISPATCHED' ||
      Boolean(bill.kotNumber || (bill.kotNumbers && bill.kotNumbers.length > 0));

    if (isAlreadySent) {
      const existingKotNum = bill.kotNumbers?.[bill.kotNumbers.length - 1] || bill.kotNumber || bill.kotId || 'KOT';
      showToast(
        'KOT Re-dispatched',
        `KOT ${existingKotNum} reprinted/re-dispatched to kitchen without duplicating the order ticket.`,
        'success'
      );
      return null;
    }

    const effectiveBranch = bill.branchId || (currentBranch === 'all' ? 'main' : currentBranch);
    const branchObj = BRANCHES.find(b => b.id === effectiveBranch) || BRANCHES[0];
    const kotNumberStr = `KOT-${kotSequence}`;
    setKotSequence(prev => prev + 1);

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newKOT: KOT = {
      id: 'kot_' + Date.now(),
      kotNumber: kotNumberStr,
      branchId: branchObj.id,
      branchName: branchObj.name,
      tableNumber: bill.tableNumber,
      takeawayId: bill.takeawayId,
      orderType: bill.orderType,
      items: bill.items.map(it => ({
        menuItemId: it.id,
        name: it.name,
        quantity: it.quantity,
        rate: it.rate,
        isVeg: it.isVeg ?? true,
        notes: undefined,
        serveType: it.serveType || (bill.orderType === 'dine_in' ? 'DINE_IN' : 'PARCEL')
      })),
      status: 'new', // Immediately shows up in Kitchen KDS in NEW ORDERS
      createdAt: now.toISOString(),
      timeFormatted,
      specialInstructions: `Settled Bill #${bill.billNumber} • Retroactive KOT Dispatch`,
      customerName: bill.customerName,
      customerMobile: bill.customerMobile,
      totalAmount: bill.subtotal,
      isBilled: true,
      billId: bill.id,
      billedAt: bill.date + ' ' + bill.time,
      serverName: bill.stewardName || currentUser?.name || 'Staff'
    };

    // 1. Add to active KOTs list so Kitchen KDS picks it up
    setKots(prev => [newKOT, ...prev]);

    // 2. Mark the bill as kotSent: true, kotStatus: 'KOT Sent', kotId, and link the KOT number
    setBills(prev => prev.map(b => {
      if (b.id === bill.id || b.billNumber === bill.billNumber) {
        const existingList = b.kotNumbers || (b.kotNumber ? [b.kotNumber] : []);
        const updatedList = existingList.includes(kotNumberStr) ? existingList : [...existingList, kotNumberStr];
        return {
          ...b,
          kotSent: true,
          kotSentAt: now.toISOString(),
          kotStatus: 'KOT Sent',
          kotId: kotNumberStr,
          kotNumber: kotNumberStr,
          kotNumbers: updatedList
        };
      }
      return b;
    }));

    // 3. Sync activeDetailsBill if modal is open
    setActiveDetailsBill(prev => {
      if (prev && (prev.id === bill.id || prev.billNumber === bill.billNumber)) {
        const existingList = prev.kotNumbers || (prev.kotNumber ? [prev.kotNumber] : []);
        const updatedList = existingList.includes(kotNumberStr) ? existingList : [...existingList, kotNumberStr];
        return {
          ...prev,
          kotSent: true,
          kotSentAt: now.toISOString(),
          kotStatus: 'KOT Sent',
          kotId: kotNumberStr,
          kotNumber: kotNumberStr,
          kotNumbers: updatedList
        };
      }
      return prev;
    });

    showToast(
      'KOT Dispatched to Kitchen',
      `KOT #${kotNumberStr} for Bill #${bill.billNumber} sent to Kitchen KDS.`,
      'success'
    );

    return newKOT;
  }, [kotSequence, currentBranch, currentUser, showToast]);

  // Bill Request actions (Waiter -> Cashier settlement flow)
  const requestBill = (tableNum?: string, notes?: string): BillRequest | null => {
    const targetTableNum = tableNum || cartTableNumber;
    if (!targetTableNum) {
      showToast('No Table Selected', 'Please select a table to request a bill.', 'warning');
      return null;
    }

    const effectiveBranch = currentBranch === 'all' ? 'main' : currentBranch;
    const branchObj = BRANCHES.find(b => b.id === effectiveBranch) || BRANCHES[0];

    // Find active unbilled KOTs for this table
    const unbilledKots = kots.filter(
      k => k.branchId === effectiveBranch &&
           k.orderType === 'dine_in' &&
           k.tableNumber?.toLowerCase() === targetTableNum.toLowerCase() &&
           !k.isBilled &&
           k.status !== 'cancelled'
    );

    let baseAmount = unbilledKots.reduce((sum, k) => sum + k.totalAmount, 0);
    if (baseAmount === 0 && cart.length > 0 && cartTableNumber.toLowerCase() === targetTableNum.toLowerCase()) {
      baseAmount = cart.reduce((sum, item) => sum + item.item.price * item.quantity, 0);
    }

    const cgstAmt = Number((baseAmount * 0.05).toFixed(2));
    const sgstAmt = Number((baseAmount * 0.05).toFixed(2));
    const grandTotalWithTax = Math.round(baseAmount + cgstAmt + sgstAmt);

    const existingPending = billRequests.find(
      r => r.branchId === effectiveBranch &&
           r.tableNumber.toLowerCase() === targetTableNum.toLowerCase() &&
           r.status === 'pending'
    );

    if (existingPending) {
      showToast('Bill Already Requested', `Cashier was already notified for ${targetTableNum} at ${existingPending.requestedAt}.`, 'info');
      return existingPending;
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newRequest: BillRequest = {
      id: 'req_' + Date.now(),
      tableNumber: targetTableNum,
      branchId: effectiveBranch,
      branchName: branchObj.name,
      orderType: 'dine_in',
      requestedBy: currentUser?.name || 'Waiter',
      requestedByRole: currentUser?.role || 'waiter',
      requestedAt: timeStr,
      status: 'pending',
      kotNumbers: unbilledKots.map(k => k.kotNumber),
      totalAmount: grandTotalWithTax || baseAmount || 0,
      customerName: cartCustomerName || unbilledKots[0]?.customerName,
      customerMobile: cartCustomerMobile || unbilledKots[0]?.customerMobile,
      notes: notes || cartSpecialNotes
    };

    setBillRequests(prev => [newRequest, ...prev]);

    // Mark table status as 'billing'
    setTables(prev =>
      prev.map(tbl => {
        if (tbl.branchId === effectiveBranch && tbl.name.toLowerCase() === targetTableNum.toLowerCase()) {
          return {
            ...tbl,
            status: 'billing',
            billRequested: true,
            billRequestedAt: timeStr,
            billRequestedBy: currentUser?.name || 'Waiter'
          };
        }
        return tbl;
      })
    );

    showToast('Bill Requested', `Cashier desk notified for ${targetTableNum} (Approx. ₹${newRequest.totalAmount}). Status updated to BILL REQUESTED.`);
    return newRequest;
  };

  const cancelBillRequest = (requestId: string) => {
    const target = billRequests.find(r => r.id === requestId);
    if (!target) return;
    setBillRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'cancelled' } : r));
    setTables(prev =>
      prev.map(tbl => {
        if (
          tbl.branchId === target.branchId &&
          tbl.name.toLowerCase() === target.tableNumber.toLowerCase() &&
          tbl.status === 'billing'
        ) {
          return {
            ...tbl,
            status: 'occupied',
            billRequested: false,
            billRequestedAt: undefined,
            billRequestedBy: undefined
          };
        }
        return tbl;
      })
    );
    showToast('Request Cancelled', `Bill request for ${target.tableNumber} cancelled.`);
  };

  const settleBillRequest = (requestId: string, paymentMethod: PaymentMethod = 'cash') => {
    const target = billRequests.find(r => r.id === requestId);
    if (!target) return;

    const effectiveBranch = target.branchId;
    const now = new Date();
    const nextSeq = billSequence;
    setBillSequence(prev => prev + 1);
    const billNum = `INV-${nextSeq}`;

    // Find table
    const table = tables.find(
      t => t.branchId === effectiveBranch && t.name.toLowerCase() === target.tableNumber.toLowerCase()
    );

    // Find active KOTs for this table
    const tableKots = kots.filter(
      k => k.branchId === effectiveBranch &&
           k.tableNumber &&
           k.tableNumber.toLowerCase() === target.tableNumber.toLowerCase() &&
           !k.isBilled
    );

    // Gather items from KOTs or generate a dining order item
    let billItems = tableKots.flatMap(k => k.items);
    if (billItems.length === 0) {
      billItems = [
        {
          id: `item_${Date.now()}`,
          name: `${target.tableNumber} Dining Order`,
          quantity: 1,
          price: target.totalAmount,
          category: 'Dining'
        }
      ];
    }

    const newBill: Bill = {
      id: `bill_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      billNumber: billNum,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      branchId: effectiveBranch,
      branchName: BRANCHES.find(b => b.id === effectiveBranch)?.name || 'Main Branch',
      orderType: 'dine_in',
      tableNumber: target.tableNumber,
      customerName: table?.guestName || 'Walk-in Guest',
      items: billItems,
      subtotal: target.totalAmount,
      gstPercent: 5,
      gstAmount: 0,
      discountAmount: 0,
      grandTotal: target.totalAmount,
      paymentMethod,
      status: 'paid',
      paymentStatus: 'PAID',
      isPaid: true,
      cashierName: currentUser?.name || 'Cashier'
    };

    setBills(prev => [
      newBill,
      ...prev.map(b => {
        if (b.tableNumber?.toLowerCase() === target.tableNumber.toLowerCase() && b.status !== 'paid') {
          return {
            ...b,
            status: 'paid' as const,
            paymentStatus: 'PAID' as const,
            isPaid: true,
            isEstimate: false,
            paymentMethod
          };
        }
        return b;
      })
    ]);

    // Mark KOTs as billed/settled
    if (tableKots.length > 0) {
      const kotIds = tableKots.map(k => k.id);
      setKots(prev =>
        prev.map(k => {
          if (kotIds.includes(k.id)) {
            return {
              ...k,
              isBilled: true,
              isPaid: true,
              paymentStatus: 'PAID',
              billId: newBill.id,
              billedAt: now.toISOString(),
              status: 'served'
            };
          }
          return k;
        })
      );
    }

    // Mark bill request as settled
    setBillRequests(prev =>
      prev.map(r =>
        r.id === requestId
          ? { ...r, status: 'settled', billId: newBill.id, billNumber: newBill.billNumber }
          : r
      )
    );

    // Free up table
    setTables(prev =>
      prev.map(tbl => {
        if (tbl.branchId === effectiveBranch && tbl.name.toLowerCase() === target.tableNumber.toLowerCase()) {
          return {
            ...tbl,
            status: 'available',
            currentAmount: 0,
            guestCount: undefined,
            guestName: undefined,
            seatedAt: undefined,
            billRequested: false,
            billRequestedAt: undefined,
            billRequestedBy: undefined
          };
        }
        return tbl;
      })
    );

    showToast(
      'Payment Settled',
      `${target.tableNumber} bill of ₹${target.totalAmount.toLocaleString('en-IN')} settled via ${paymentMethod.toUpperCase()}. Table is now Available.`,
      'success'
    );
  };

  const pendingBillRequests = useMemo(() => {
    // 1. Requests from billRequests state
    const list = [...billRequests.filter(
      r => r.status === 'pending' && (currentBranch === 'all' || r.branchId === currentBranch)
    )];

    // 2. Also ensure every table with status 'billing', 'BILL_REQUESTED', or billRequested is included
    const billingTables = tables.filter(
      t => (currentBranch === 'all' || t.branchId === currentBranch) &&
           (t.status === 'billing' || t.status === 'BILL_REQUESTED' || (t.status as string)?.toLowerCase() === 'bill requested' || Boolean((t as any).billRequested))
    );

    billingTables.forEach(t => {
      const alreadyInList = list.some(
        r => r.tableNumber.toLowerCase() === t.name.toLowerCase() &&
             (currentBranch === 'all' || r.branchId === t.branchId)
      );
      if (!alreadyInList) {
        const tableKots = kots.filter(
          k => k.branchId === t.branchId &&
               k.orderType === 'dine_in' &&
               k.tableNumber?.toLowerCase() === t.name.toLowerCase() &&
               !k.isBilled &&
               k.status !== 'cancelled'
        );
        const rawItemsSubtotal = tableKots.length > 0
          ? tableKots.reduce((sum, k) => sum + k.totalAmount, 0)
          : (t.number === 2 ? 1130 : t.number === 5 ? 1030 : t.number === 3 ? 680 : t.number === 6 ? 300 : (t.currentAmount ? Math.round(t.currentAmount / 1.1) : 500));
        const cgstAmt = Number((rawItemsSubtotal * 0.05).toFixed(2));
        const sgstAmt = Number((rawItemsSubtotal * 0.05).toFixed(2));
        const total = Math.round(rawItemsSubtotal + cgstAmt + sgstAmt);

        list.push({
          id: `req_tbl_${t.id}`,
          tableNumber: t.name,
          tableId: t.id,
          branchId: t.branchId,
          branchName: t.branchId === 'city' ? 'City Branch' : t.branchId === 'beach' ? 'Beach Branch' : 'Main Branch',
          orderType: 'dine_in',
          requestedBy: t.assignedWaiterName || 'Waiter',
          requestedByRole: 'waiter',
          requestedAt: (t as any).billRequestedAt || '12:45 PM',
          status: 'pending',
          kotNumbers: tableKots.map(k => k.kotNumber),
          totalAmount: total,
          notes: 'Customer requested bill.'
        });
      }
    });

    return list;
  }, [billRequests, currentBranch, tables, kots]);

  const updateTableStatus = useCallback((tableId: string, status: RestaurantTable['status']) => {
    setTables(prev => {
      const existing = prev.find(tbl => tbl.id === tableId);
      if (existing && existing.status === status) {
        return prev;
      }
      return prev.map(tbl => (tbl.id === tableId ? { ...tbl, status } : tbl));
    });
  }, []);

  const setTableStatusByNumber = useCallback((tableNumber: string, status: RestaurantTable['status']) => {
    const effectiveBranch = currentBranch === 'all' ? 'main' : currentBranch;
    setTables(prev => {
      const existing = prev.find(
        tbl => tbl.branchId === effectiveBranch && tbl.name.toLowerCase() === tableNumber.toLowerCase()
      );
      if (existing && existing.status === status) {
        return prev;
      }
      return prev.map(tbl =>
        tbl.branchId === effectiveBranch && tbl.name.toLowerCase() === tableNumber.toLowerCase()
          ? { ...tbl, status }
          : tbl
      );
    });
  }, [currentBranch]);

  const addCategory = (name: string, icon?: string): boolean => {
    const trimmed = name.trim();
    if (!trimmed) {
      showToast('Invalid Name', 'Please enter a valid category name', 'error');
      return false;
    }

    // Check if category already exists (case-insensitive)
    const exists = categories.some(c => c.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      showToast('Category Exists', `Category "${trimmed}" is already in your menu filters.`, 'info');
      return false;
    }

    const updated = [...customCategories, trimmed];
    setCustomCategories(updated);
    try {
      localStorage.setItem('zaffran_pos_custom_categories', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    if (icon && icon.trim()) {
      const updatedIcons = { ...categoryIcons, [trimmed]: icon.trim() };
      setCategoryIcons(updatedIcons);
      try {
        localStorage.setItem('zaffran_pos_category_icons', JSON.stringify(updatedIcons));
      } catch (e) {
        console.error(e);
      }
    }

    showToast('Category Created', `Category "${trimmed}" has been added to menu filters!`, 'success');
    return true;
  };

  const updateCategory = (oldName: string, newName: string, icon?: string): boolean => {
    const trimmedNew = newName.trim();
    if (!trimmedNew) {
      showToast('Invalid Name', 'Category name cannot be empty', 'error');
      return false;
    }
    if (trimmedNew.toLowerCase() !== oldName.toLowerCase()) {
      const exists = categories.some(c => c.toLowerCase() === trimmedNew.toLowerCase() && c.toLowerCase() !== oldName.toLowerCase());
      if (exists) {
        showToast('Category Exists', `Category "${trimmedNew}" already exists.`, 'warning');
        return false;
      }
    }

    // Update customCategories
    const updatedCustom = customCategories.map(c => c.toLowerCase() === oldName.toLowerCase() ? trimmedNew : c);
    if (!updatedCustom.some(c => c.toLowerCase() === trimmedNew.toLowerCase()) && !['Biryani', 'Starters', 'Main Course', 'Breads', 'Rice', 'Beverages', 'Desserts'].includes(trimmedNew)) {
      updatedCustom.push(trimmedNew);
    }
    setCustomCategories(updatedCustom);

    // If new name was previously in deletedCategories, remove it
    const updatedDeleted = deletedCategories.filter(c => c.toLowerCase() !== trimmedNew.toLowerCase());
    setDeletedCategories(updatedDeleted);

    // Update icons
    const updatedIcons = { ...categoryIcons };
    if (icon && icon.trim()) {
      updatedIcons[trimmedNew] = icon.trim();
    }
    if (oldName !== trimmedNew && updatedIcons[oldName] && (!icon || !icon.trim())) {
      updatedIcons[trimmedNew] = updatedIcons[oldName];
      delete updatedIcons[oldName];
    }
    setCategoryIcons(updatedIcons);

    // Update dishes assigned to oldName
    if (oldName.toLowerCase() !== trimmedNew.toLowerCase()) {
      setMenuItems(prev => prev.map(m => m.category.toLowerCase() === oldName.toLowerCase() ? { ...m, category: trimmedNew } : m));
    }

    try {
      localStorage.setItem('zaffran_pos_custom_categories', JSON.stringify(updatedCustom));
      localStorage.setItem('zaffran_pos_deleted_categories', JSON.stringify(updatedDeleted));
      localStorage.setItem('zaffran_pos_category_icons', JSON.stringify(updatedIcons));
    } catch (e) {
      console.error(e);
    }

    showToast('Category Updated', `Category updated to "${trimmedNew}"`, 'success');
    return true;
  };

  const deleteCategory = (name: string) => {
    if (name.toLowerCase() === 'all') return;
    const updatedCustom = customCategories.filter(c => c.toLowerCase() !== name.toLowerCase());
    setCustomCategories(updatedCustom);
    const updatedDeleted = Array.from(new Set([...deletedCategories, name]));
    setDeletedCategories(updatedDeleted);

    try {
      localStorage.setItem('zaffran_pos_custom_categories', JSON.stringify(updatedCustom));
      localStorage.setItem('zaffran_pos_deleted_categories', JSON.stringify(updatedDeleted));
    } catch (e) {
      console.error(e);
    }
    showToast('Category Removed', `Category "${name}" removed from menu filters`, 'info');
  };

  const addMenuItem = (item: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = {
      ...item,
      id: 'item_' + Date.now()
    };
    setMenuItems(prev => [newItem, ...prev]);
    showToast('Menu Item Added', `${newItem.name} has been added to ${newItem.category}`);
  };

  const updateMenuItem = (item: MenuItem) => {
    setMenuItems(prev => prev.map(m => (m.id === item.id ? item : m)));
    showToast('Item Updated', `${item.name} details saved`);
  };

  const deleteMenuItem = (id: string) => {
    setMenuItems(prev => prev.filter(m => m.id !== id));
    showToast('Dish Deleted', 'Item removed from restaurant menu catalog', 'info');
  };

  const toggleMenuItemAvailability = (id: string) => {
    setMenuItems(prev =>
      prev.map(m => {
        if (m.id === id) {
          const nextAvail = !m.available;
          const nextStatus: ItemStockStatus = nextAvail ? 'available' : 'sold_out';
          const updated: MenuItem = {
            ...m,
            available: nextAvail,
            stockStatus: nextStatus,
            stockCount: nextAvail ? undefined : 0,
          };
          showToast(
            nextAvail ? 'Item Restocked' : 'Item 86-ed (Sold Out)',
            `${m.name} is now ${nextAvail ? 'AVAILABLE' : 'SOLD OUT (86)'}.`,
            nextAvail ? 'success' : 'warning'
          );
          return updated;
        }
        return m;
      })
    );
  };

  const updateMenuItemStock = (id: string, stockStatus: ItemStockStatus, stockCount?: number) => {
    setMenuItems(prev =>
      prev.map(m => {
        if (m.id === id) {
          let count = stockCount;
          let isAvail = true;
          if (stockStatus === 'sold_out') {
            count = 0;
            isAvail = false;
          } else if (stockStatus === 'few_left') {
            count = typeof stockCount === 'number' ? Math.max(0, stockCount) : (m.stockCount ?? 5);
            isAvail = count > 0;
          } else {
            // available
            count = undefined;
            isAvail = true;
          }
          const updated: MenuItem = {
            ...m,
            stockStatus,
            stockCount: count,
            available: isAvail,
          };
          showToast(
            stockStatus === 'sold_out'
              ? 'Item 86-ed (Sold Out)'
              : stockStatus === 'few_left'
              ? 'Stock Updated: Few Left'
              : 'Item Available',
            stockStatus === 'sold_out'
              ? `${m.name} is now marked SOLD OUT (86) across POS & Waiters.`
              : stockStatus === 'few_left'
              ? `${m.name} set to Few Left: ${count} plates remaining.`
              : `${m.name} is now Available.`,
            stockStatus === 'sold_out' ? 'warning' : 'success'
          );
          return updated;
        }
        return m;
      })
    );
  };

  const addCustomer = (customer: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'lastVisit'>) => {
    const newCust: Customer = {
      ...customer,
      id: 'cust_' + Date.now(),
      totalOrders: 0,
      totalSpent: 0,
      lastVisit: new Date().toISOString().split('T')[0]
    };
    setCustomers(prev => [newCust, ...prev]);
    showToast('Customer Added', `${newCust.name} added successfully`);
  };

  const updateCustomer = (updated: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
    showToast('Customer Updated', `${updated.name}'s details saved`);
  };

  const addUser = (newUser: Omit<User, 'id'>) => {
    const user: User = {
      ...newUser,
      id: 'usr_' + Date.now(),
      status: newUser.status || 'active',
      pin: newUser.pin || '1234'
    };
    setUsers(prev => [...prev, user]);
    showToast('Staff Member Created', `${user.name} (${user.role.toUpperCase()}) added with PIN ${user.pin}`, 'success');
  };

  const updateUser = (updated: User) => {
    setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
    if (currentUser?.id === updated.id) {
      setCurrentUser(updated);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignored
      }
    }
    showToast('Staff Profile Updated', `${updated.name}'s details & PIN saved`, 'success');
  };

  const deleteUser = (id: string) => {
    if (currentUser?.id === id) {
      showToast('Cannot Delete Self', 'You cannot delete the user account currently signed in.', 'error');
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== id));
    showToast('Staff Member Removed', 'User profile and access credentials revoked', 'info');
  };

  const updateRestaurantSettings = (newSettings: Partial<RestaurantSettings>) => {
    setRestaurantSettings(prev => ({
      ...prev,
      ...newSettings
    }));
    showToast('Settings Saved', 'Restaurant profile and thermal printer details updated', 'success');
  };

  const openAdminPinModal = (onSuccess?: () => void) => {
    setAdminPinSuccessCallback(() => (onSuccess ? onSuccess : null));
    setIsAdminPinModalOpen(true);
  };

  const closeAdminPinModal = () => {
    setIsAdminPinModalOpen(false);
    setAdminPinSuccessCallback(null);
  };

  const verifyAdminPin = (pin: string): boolean => {
    const cleanPin = pin.trim();
    if (cleanPin === '1234') return true;
    const matchingAdmin = users.find(u => (u.role === 'owner' || u.role === 'manager') && u.pin === cleanPin);
    return !!matchingAdmin;
  };

  const switchRoleToAdmin = () => {
    const adminUser = users.find(u => u.role === 'owner') || DEMO_USERS[0];
    setCurrentUser(adminUser);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminUser));
    } catch {
      // Ignored
    }
    setActiveTab('menu');
    showToast('Admin Mode Active', 'Welcome Vikramaditya Rao. Full RBAC & Menu Control enabled.', 'success');
    if (adminPinSuccessCallback) {
      adminPinSuccessCallback();
      setAdminPinSuccessCallback(null);
    }
  };

  const resetDemoData = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setCurrentUser(DEMO_USERS[0]);
    setCurrentBranch('main');
    setActiveTab('dashboard');
    setMenuItems(INITIAL_MENU_ITEMS);
    setTables([
      ...generateInitialTables('main'),
      ...generateInitialTables('city'),
      ...generateInitialTables('beach'),
    ]);
    setKots(INITIAL_KOTS);
    setBills(INITIAL_BILLS);
    setCustomers(INITIAL_CUSTOMERS);
    setCart([]);
    setCartTableNumber('Table 5');
    setCartPaidBill(null);
    setCartSentKotId(null);
    setKotSequence(10025);
    setBillSequence(10025);
    showToast('Demo Data Reset', 'Restored to clean demo scenario.');
  };

  // Filtered views based on branch selection
  const currentBranchInfo = useMemo(() => {
    if (currentBranch === 'all') return null;
    return BRANCHES.find(b => b.id === currentBranch) || null;
  }, [currentBranch]);

  const filteredTables = useMemo(() => {
    if (currentBranch === 'all') return tables;
    return tables.filter(t => t.branchId === currentBranch);
  }, [tables, currentBranch]);

  const filteredKots = useMemo(() => {
    if (currentBranch === 'all') return kots;
    return kots.filter(k => k.branchId === currentBranch);
  }, [kots, currentBranch]);

  const filteredBills = useMemo(() => {
    if (currentBranch === 'all') return bills;
    return bills.filter(b => b.branchId === currentBranch);
  }, [bills, currentBranch]);

  // Dynamically compute stats from seed benchmark plus any live bills created during session
  const computedStats = useMemo(() => {
    // Base benchmark figures
    const isConsolidated = currentBranch === 'all';
    const base = isConsolidated 
      ? BENCHMARK_STATS.consolidated 
      : BENCHMARK_STATS[currentBranch as 'main' | 'city' | 'beach'];

    // Additional live bills created beyond initial seed bills
    const initialBillIds = new Set(INITIAL_BILLS.map(b => b.id));
    const newBills = bills.filter(b => !initialBillIds.has(b.id));

    let liveSales = 0;
    let liveOrders = 0;
    let liveDineIn = 0;
    let liveTakeaway = 0;
    let liveCash = 0;
    let liveUpi = 0;
    let liveCard = 0;
    const branchAdditions = { main: 0, city: 0, beach: 0 };

    newBills.forEach(b => {
      const matchBranch = isConsolidated || b.branchId === currentBranch;
      if (matchBranch) {
        liveSales += b.grandTotal;
        liveOrders += 1;
        if (b.orderType === 'dine_in') liveDineIn += 1;
        else liveTakeaway += 1;

        if (b.paymentMethod === 'cash') liveCash += b.grandTotal;
        else if (b.paymentMethod === 'upi') liveUpi += b.grandTotal;
        else if (b.paymentMethod === 'card') liveCard += b.grandTotal;
        else if (b.paymentMethod === 'split' && b.splitDetails) {
          liveCash += b.splitDetails.cash || 0;
          liveUpi += b.splitDetails.upi || 0;
          liveCard += b.splitDetails.card || 0;
        }
      }
      if (b.branchId === 'main') branchAdditions.main += b.grandTotal;
      if (b.branchId === 'city') branchAdditions.city += b.grandTotal;
      if (b.branchId === 'beach') branchAdditions.beach += b.grandTotal;
    });

    const pendingKotsCount = filteredKots.filter(k => k.status === 'new' && !k.isBilled).length;
    const activeCookingCount = filteredKots.filter(k => k.status === 'preparing' && !k.isBilled).length;
    const readyKotsCount = filteredKots.filter(k => k.status === 'ready' && !k.isBilled).length;

    return {
      todaySales: base.todaySales + liveSales,
      totalOrders: base.totalOrders + liveOrders,
      dineInOrders: base.dineInOrders + liveDineIn,
      takeawayOrders: base.takeawayOrders + liveTakeaway,
      pendingKOTs: pendingKotsCount,
      activeCookingKOTs: activeCookingCount,
      readyKOTs: readyKotsCount,
      paidBills: (isConsolidated ? BENCHMARK_STATS.consolidated.paidBills : BENCHMARK_STATS[currentBranch as 'main'|'city'|'beach'].paidBills) + newBills.filter(b => isConsolidated || b.branchId === currentBranch).length,
      paymentBreakdown: {
        cash: base.paymentBreakdown.cash + liveCash,
        upi: base.paymentBreakdown.upi + liveUpi,
        card: base.paymentBreakdown.card + liveCard
      },
      branchPerformance: {
        main: BENCHMARK_STATS.consolidated.branchPerformance.main + branchAdditions.main,
        city: BENCHMARK_STATS.consolidated.branchPerformance.city + branchAdditions.city,
        beach: BENCHMARK_STATS.consolidated.branchPerformance.beach + branchAdditions.beach
      }
    };
  }, [currentBranch, bills, filteredKots]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentBranch,
        branches: BRANCHES,
        activeTab,
        menuItems,
        categories,
        categoryIcons,
        addCategory,
        updateCategory,
        deleteCategory,
        tables,
        branchTables: filteredTables,
        kots,
        bills,
        customers,
        cart,
        cartOrderType,
        cartTableNumber,
        cartTakeawayId,
        setCartTakeawayId,
        takeawaySequence,
        isCurrentTakeawayEmpty,
        startNewTakeawayOrder,
        selectTakeawayOrder,
        cartCustomerName,
        cartCustomerMobile,
        cartSpecialNotes,
        cartPaidBill,
        cartSentKotId,
        cartDiscountPercent,
        setCartDiscountPercent,
        cartCustomDiscount,
        setCartCustomDiscount,
        setCartPaidBill,
        setCartSentKotId,
        resetCartOrder,
        activeReceiptBill,
        isReceiptModalOpen,
        activeReceiptKOT,
        isKOTModalOpen,
        openKOTModal,
        closeKOTModal,
        activeDetailsBill,
        isBillDetailsModalOpen,
        openBillDetailsModal,
        closeBillDetailsModal,
        toasts,
        login,
        loginWithPin,
        logout,
        switchRole,
        setBranch,
        setActiveTab: handleSetActiveTab,
        addToCart,
        updateCartQuantity,
        updateCartItemNotes,
        updateCartItemServeType,
        removeFromCart,
        setCartItems,
        clearCart,
        setCartOrderType,
        setCartTableNumber,
        setCartCustomerName,
        setCartCustomerMobile,
        setCartSpecialNotes,
        holdOrder,
        savedActiveOrders,
        setSavedActiveOrders,
        saveActiveOrder,
        isCurrentOrderSaved,
        isOrderSettled,
        setIsOrderSettled,
        isBillPrinted,
        setIsBillPrinted,
        sendKOT,
        updateKOTStatus,
        voidKOTItem,
        kdsAlerts,
        dismissKDSAlert,
        generateBill,
        sendKotForBill,
        voidBill,
        openReceiptModal,
        closeReceiptModal,
        billRequests,
        pendingBillRequests,
        requestBill,
        cancelBillRequest,
        settleBillRequest,
        selectTableForPOS,
        updateTableStatus,
        setTableStatusByNumber,
        tableSearchTerm,
        setTableSearchTerm,
        tableFloorFilter,
        setTableFloorFilter,
        getActiveUnbilledKots,
        billSequence,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        toggleMenuItemAvailability,
        updateMenuItemStock,
        dispatchedItemStats,
        activeKitchenTab,
        setActiveKitchenTab,
        isKitchenDrawerOpen,
        setIsKitchenDrawerOpen,
        kitchenDrawerTab,
        setKitchenDrawerTab,
        openKitchenDrawer,
        kdsViewMode,
        setKdsViewMode,
        kdsStatusFilter,
        setKdsStatusFilter,
        kdsSelectedStation,
        setKdsSelectedStation,
        kdsSearchQuery,
        setKdsSearchQuery,
        addCustomer,
        updateCustomer,
        users,
        addUser,
        updateUser,
        deleteUser,
        restaurantSettings,
        updateRestaurantSettings,
        isAdminPinModalOpen,
        openAdminPinModal,
        closeAdminPinModal,
        verifyAdminPin,
        switchRoleToAdmin,
        showToast,
        dismissToast,
        resetDemoData,
        computedStats,
        currentBranchInfo,
        filteredTables,
        filteredKots,
        filteredBills
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
