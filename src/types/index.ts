export type UserRole = 'owner' | 'manager' | 'cashier' | 'kitchen' | 'waiter' | 'admin';

export type CategoryBadgeMode = 'alternating' | 'active-crimson';

export type BranchId = 'all' | 'main' | 'city' | 'beach';

export interface Branch {
  id: 'main' | 'city' | 'beach';
  name: string;
  code: string;
  address: string;
  phone: string;
  gstin: string;
  fssai?: string;
  color: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branchId: BranchId;
  branchName: string;
  avatar?: string;
  pin?: string; // 4-digit numeric login PIN
  phone?: string;
  status?: 'active' | 'inactive';
}

export type OrderType = 'dine_in' | 'takeaway' | 'parcel' | 'delivery';

export type TableStatus = 'available' | 'occupied' | 'waiting' | 'billing' | 'ready' | 'cleaning';

export interface RestaurantTable {
  id: string;
  number: number;
  name: string;
  capacity: number;
  branchId: 'main' | 'city' | 'beach';
  status: TableStatus;
  floor?: string;
  activeKotId?: string;
  activeBillId?: string;
  currentAmount?: number;
  seatedAt?: string;
  guestCount?: number;
  guestName?: string;
  billRequested?: boolean;
  billRequestedAt?: string;
  billRequestedBy?: string;
  assignedWaiterName?: string;
  assignedWaiterId?: string;
}

export interface BillRequest {
  id: string;
  tableNumber: string;
  tableId?: string;
  branchId: 'main' | 'city' | 'beach';
  branchName: string;
  orderType: OrderType;
  requestedBy: string;
  requestedByRole?: UserRole;
  requestedAt: string;
  status: 'pending' | 'settled' | 'cancelled';
  kotNumbers: string[];
  totalAmount: number;
  customerName?: string;
  customerMobile?: string;
  billId?: string;
  billNumber?: string;
  notes?: string;
}

export type MenuCategory = 
  | 'Biryani' 
  | 'Starters' 
  | 'Main Course' 
  | 'Breads' 
  | 'Rice' 
  | 'Beverages' 
  | 'Desserts'
  | (string & {});

export interface ItemVariation {
  id: string;
  name: string;
  price: number;
}

export interface PortionSelection {
  variation: ItemVariation;
  quantity: number;
  notes?: string;
  orderType?: OrderType;
  serveType?: ItemServeType;
}

export type ItemStockStatus = 'available' | 'few_left' | 'sold_out';

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  gstRate: number; // e.g. 5 for 5%
  isVeg: boolean;
  available: boolean;
  stockStatus?: ItemStockStatus;
  stockCount?: number;
  description?: string;
  popular?: boolean;
  variations?: ItemVariation[];
}

export interface DispatchedItemStats {
  name: string;
  totalServed: number;
  dineIn: number;
  takeaway: number;
}

export type ItemServeType = 'DINE_IN' | 'PARCEL' | 'TAKEAWAY' | 'DELIVERY';
export type ServeType = ItemServeType;

export interface CartItem {
  item: MenuItem;
  quantity: number;
  notes?: string;
  serveType?: ItemServeType;
  orderType?: OrderType;
  isSaved?: boolean;
  isNew?: boolean;
}

export type KOTStatus = 'new' | 'preparing' | 'ready' | 'picked_up' | 'served' | 'cancelled';

export interface KOTItem {
  menuItemId: string;
  name: string;
  quantity: number;
  rate: number;
  notes?: string;
  isVeg: boolean;
  serveType?: ItemServeType;
  orderType?: OrderType;
  status?: 'active' | 'voided';
  voidedAt?: string;
  voidedBy?: string;
  voidReason?: string;
  originalQuantity?: number;
}

export interface KDSAlert {
  id: string;
  kotId: string;
  kotNumber: string;
  tableNumber?: string;
  itemName: string;
  quantity: number;
  voidedBy: string;
  time: string;
  reason?: string;
  dismissed?: boolean;
}

export interface KOT {
  id: string;
  kotNumber: string; // e.g. "KOT-10025"
  branchId: 'main' | 'city' | 'beach';
  branchName: string;
  tableNumber?: string;
  tableId?: string;
  takeawayId?: string; // e.g. "TK-102"
  orderType: OrderType;
  items: KOTItem[];
  status: KOTStatus;
  createdAt: string;
  timeFormatted: string;
  startedAt?: string;
  readyAt?: string;
  pickedUpAt?: string;
  servedAt?: string;
  specialInstructions?: string;
  customerName?: string;
  customerMobile?: string;
  totalAmount: number;
  isBilled?: boolean;
  isPaid?: boolean;
  paymentStatus?: 'PAID' | 'UNPAID';
  billId?: string;
  billedAt?: string;
  hasVoidedItems?: boolean;
  serverName?: string;
  waiterName?: string;
}

export type BillStatus = 'unpaid' | 'paid' | 'cancelled' | 'provisional';
export type PaymentMethod = 'cash' | 'upi' | 'card' | 'due' | 'other' | 'split';

export interface SplitPaymentDetail {
  cash: number;
  upi: number;
  card: number;
  due?: number;
  other?: number;
}

export interface BillItem {
  id: string;
  name: string;
  quantity: number;
  rate: number;
  amount: number;
  isVeg?: boolean;
  serveType?: ItemServeType;
}

export interface Bill {
  id: string;
  billNumber: string; // e.g. "INV-10025"
  kotNumber?: string;
  kotNumbers?: string[];
  kotSent?: boolean;
  kotSentAt?: string;
  kotId?: string;
  kotStatus?: string; // e.g. 'KOT Sent' or 'DISPATCHED'
  branchId: 'main' | 'city' | 'beach';
  branchName: string;
  date: string;
  time: string;
  tableNumber?: string;
  tableId?: string;
  takeawayId?: string; // e.g. "TK-102"
  orderType: OrderType;
  customerName?: string;
  customerMobile?: string;
  items: BillItem[];
  subtotal: number;
  gstPercent: number; // total GST % (CGST + SGST)
  gstAmount: number;
  cgstPercent?: number; // configured CGST %
  cgstAmount?: number; // Sub Total * (CGST % / 100)
  sgstPercent?: number; // configured SGST %
  sgstAmount?: number; // Sub Total * (SGST % / 100)
  discountPercent?: number;
  discountAmount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  splitDetails?: SplitPaymentDetail;
  status: BillStatus;
  isEstimate?: boolean;
  paymentStatus?: 'PAID' | 'UNPAID';
  isPaid?: boolean;
  cashierName?: string;
  stewardName?: string;
  fssaiLicNo?: string;
  cancelledBy?: string;
  cancelReason?: string;
  voidedAt?: string;
}

export interface SavedActiveOrder {
  id: string;
  key: string;
  orderType: OrderType;
  branchId: string;
  tableNumber?: string;
  takeawayId?: string;
  cart: CartItem[];
  customerName?: string;
  customerMobile?: string;
  specialNotes?: string;
  discountPercent?: number;
  customDiscount?: number;
  savedAt: string;
  subtotal: number;
  isPrinted?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  totalOrders: number;
  totalSpent: number;
  lastVisit: string;
  favoriteBranch: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: number;
}

export interface RestaurantSettings {
  name: string;
  brandName: string;
  address: string;
  phone: string;
  gstin: string;
  fssai: string;
  footerMessage: string;
  defaultTaxPercent: number;
  cgstPercent?: number; // independent CGST % (Default: 5%)
  sgstPercent?: number; // independent SGST % (Default: 5%)
  printerType: string;
  autoPrintOnBill: boolean;
  printerPaperWidth?: '80mm' | '58mm';
  printerAutoCut?: boolean;
  printCopies?: number;
}

