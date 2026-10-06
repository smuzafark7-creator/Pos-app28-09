import { Branch, MenuItem, RestaurantTable, KOT, Bill, Customer, User, BillRequest, RestaurantSettings } from '../types';

export const DEFAULT_RESTAURANT_SETTINGS: RestaurantSettings = {
  name: 'Bilaal Restaurant',
  brandName: 'Bilaal Restaurant & Bar',
  address: 'Grand Promenade, 42 MG Road, Indiranagar, Bengaluru - 560038',
  phone: '+91 80 2558 9123',
  gstin: '29AABCR1234F1Z5',
  fssai: '11223334000128',
  footerMessage: 'Thank you for dining with us! Please visit again. Follow @zaffrankitchen',
  defaultTaxPercent: 10.0,
  cgstPercent: 5.0,
  sgstPercent: 5.0,
  printerType: '80mm Thermal Printer',
  autoPrintOnBill: true,
  printerPaperWidth: '80mm',
  printerAutoCut: true,
  printCopies: 1
};

export const BRANCHES: Branch[] = [
  {
    id: 'main',
    name: 'Main Branch',
    code: 'MB',
    address: 'Grand Promenade, 42 MG Road, Indiranagar, Bengaluru - 560038',
    phone: '+91 80 2558 9123',
    gstin: '29AABCR1234F1Z5',
    fssai: '11223334000128',
    color: '#E05A47'
  },
  {
    id: 'city',
    name: 'City Branch',
    code: 'CB',
    address: 'Central Mall Plaza, 4th Block, Jayanagar, Bengaluru - 560011',
    phone: '+91 80 4122 8490',
    gstin: '29AABCR1234F2Z4',
    fssai: '11223334000192',
    color: '#2A9D8F'
  },
  {
    id: 'beach',
    name: 'Beach Road Branch',
    code: 'BRB',
    address: 'Bayview Waterfront, Marine Parade, Promenade - 560001',
    phone: '+91 80 3981 7765',
    gstin: '29AABCR1234F3Z3',
    fssai: '11223334000215',
    color: '#E76F51'
  }
];

export const DEMO_USERS: User[] = [
  {
    id: 'usr_1',
    name: 'Vikramaditya Rao (Owner)',
    email: 'admin@restaurant.com',
    role: 'owner',
    branchId: 'all',
    branchName: 'All Branches',
    pin: '1234',
    phone: '+91 98860 12345',
    status: 'active'
  },
  {
    id: 'usr_2',
    name: 'Vikram Sharma (Manager)',
    email: 'manager@restaurant.com',
    role: 'manager',
    branchId: 'main',
    branchName: 'Main Branch',
    pin: '2222',
    phone: '+91 98860 23456',
    status: 'active'
  },
  {
    id: 'usr_3',
    name: 'Anita Deshmukh (Cashier)',
    email: 'cashier@restaurant.com',
    role: 'cashier',
    branchId: 'main',
    branchName: 'Main Branch',
    pin: '3333',
    phone: '+91 98860 34567',
    status: 'active'
  },
  {
    id: 'usr_4',
    name: 'Chef Rajesh Kumar (Kitchen)',
    email: 'kitchen@restaurant.com',
    role: 'kitchen',
    branchId: 'main',
    branchName: 'Main Branch',
    pin: '5555',
    phone: '+91 98860 45678',
    status: 'active'
  },
  {
    id: 'usr_5',
    name: 'Ramesh Patel (Waiter)',
    email: 'waiter@restaurant.com',
    role: 'waiter',
    branchId: 'main',
    branchName: 'Main Branch',
    pin: '4444',
    phone: '+91 98860 56789',
    status: 'active'
  },
  {
    id: 'usr_admin',
    name: 'System Administrator (Admin)',
    email: 'admin@backoffice.com',
    role: 'admin',
    branchId: 'all',
    branchName: 'All Branches',
    pin: '9999',
    phone: '+91 99999 00000',
    status: 'active'
  }
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  // Biryani
  {
    id: 'item_1',
    name: 'Chicken Biryani',
    category: 'Biryani',
    price: 280,
    gstRate: 5,
    isVeg: false,
    available: true,
    stockStatus: 'available',
    description: 'Fragrant dum cooked long-grain basmati rice with tender spiced chicken pieces and saffron.',
    popular: true,
    variations: [
      { id: 'var_cb_half', name: 'Half', price: 180 },
      { id: 'var_cb_full', name: 'Full', price: 280 },
      { id: 'var_cb_family', name: 'Family Pack', price: 550 },
    ]
  },
  {
    id: 'item_2',
    name: 'Mutton Biryani',
    category: 'Biryani',
    price: 360,
    gstRate: 5,
    isVeg: false,
    available: true,
    stockStatus: 'few_left',
    stockCount: 4,
    description: 'Royal slow-cooked goat meat cooked in clay handi with aromatic whole spices.',
    popular: true,
    variations: [
      { id: 'var_mb_half', name: 'Half', price: 240 },
      { id: 'var_mb_full', name: 'Full', price: 360 },
      { id: 'var_mb_family', name: 'Family Pack', price: 720 },
    ]
  },
  {
    id: 'item_3',
    name: 'Veg Biryani',
    category: 'Biryani',
    price: 220,
    gstRate: 5,
    isVeg: true,
    available: true,
    description: 'Garden fresh vegetables, cottage cheese and mint layered in dum basmati rice.',
    popular: false,
    variations: [
      { id: 'var_vb_half', name: 'Half', price: 140 },
      { id: 'var_vb_full', name: 'Full', price: 220 },
      { id: 'var_vb_family', name: 'Family Pack', price: 420 },
    ]
  },
  // Starters
  {
    id: 'item_chips',
    name: 'Plain Chips',
    category: 'Starters',
    price: 90,
    gstRate: 5,
    isVeg: true,
    available: true,
    description: 'Crispy salted potato chips freshly fried and seasoned.',
    popular: true,
    variations: [
      { id: 'var_chips_reg', name: 'Regular', price: 90 },
      { id: 'var_chips_med', name: 'Medium', price: 120 },
      { id: 'var_chips_lrg', name: 'Large', price: 150 },
    ]
  },
  {
    id: 'item_4',
    name: 'Chicken 65',
    category: 'Starters',
    price: 240,
    gstRate: 5,
    isVeg: false,
    available: true,
    description: 'Crispy fried boneless chicken tossed with curry leaves, crushed garlic and fiery red chillies.',
    popular: true,
    variations: [
      { id: 'var_c65_half', name: 'Half Plate', price: 160 },
      { id: 'var_c65_full', name: 'Full Plate', price: 240 },
    ]
  },
  {
    id: 'item_5',
    name: 'Paneer 65',
    category: 'Starters',
    price: 220,
    gstRate: 5,
    isVeg: true,
    available: true,
    description: 'Crisp fried paneer cubes tempered with curd, south spices and fresh coriander.',
    popular: false,
    variations: [
      { id: 'var_p65_half', name: 'Half Plate', price: 150 },
      { id: 'var_p65_full', name: 'Full Plate', price: 220 },
    ]
  },
  {
    id: 'item_6',
    name: 'Tandoori Chicken',
    category: 'Starters',
    price: 280,
    gstRate: 5,
    isVeg: false,
    available: false,
    stockStatus: 'sold_out',
    stockCount: 0,
    description: 'Classic chargrilled chicken on the bone marinated in hung yoghurt and tandoori spices.',
    variations: [
      { id: 'var_tc_half', name: 'Half Plate', price: 280 },
      { id: 'var_tc_full', name: 'Full Plate', price: 520 },
    ]
  },
  {
    id: 'item_7',
    name: 'Crispy Corn Salt & Pepper',
    category: 'Starters',
    price: 180,
    gstRate: 5,
    isVeg: true,
    available: true,
    description: 'American sweet corn kernels deep fried crisp and seasoned with cracked pepper.',
    variations: [
      { id: 'var_cc_reg', name: 'Regular', price: 120 },
      { id: 'var_cc_lrg', name: 'Large', price: 180 },
    ]
  },
  // Main Course
  {
    id: 'item_8',
    name: 'Butter Chicken',
    category: 'Main Course',
    price: 320,
    gstRate: 5,
    isVeg: false,
    available: true,
    description: 'Charred tandoori chicken simmered in rich creamy butter tomato makhani gravy.',
    popular: true,
    variations: [
      { id: 'var_bc_half', name: 'Half Handi', price: 190 },
      { id: 'var_bc_full', name: 'Full Handi', price: 320 },
    ]
  },
  {
    id: 'item_9',
    name: 'Paneer Butter Masala',
    category: 'Main Course',
    price: 260,
    gstRate: 5,
    isVeg: true,
    available: true,
    description: 'Fresh cottage cheese blocks in mild satin smooth cashew and butter gravy.',
    popular: true,
    variations: [
      { id: 'var_pbm_half', name: 'Half Handi', price: 160 },
      { id: 'var_pbm_full', name: 'Full Handi', price: 260 },
    ]
  },
  {
    id: 'item_10',
    name: 'Dal Makhani',
    category: 'Main Course',
    price: 210,
    gstRate: 5,
    isVeg: true,
    available: true,
    description: 'Black lentils slow cooked overnight on charcoal embers with fresh cream and butter.',
    variations: [
      { id: 'var_dm_half', name: 'Half Handi', price: 140 },
      { id: 'var_dm_full', name: 'Full Handi', price: 210 },
    ]
  },
  {
    id: 'item_11',
    name: 'Mutton Rogan Josh',
    category: 'Main Course',
    price: 380,
    gstRate: 5,
    isVeg: false,
    available: true,
    description: 'Kashmiri delicacy of lamb braised in aromatic gravy with alkanet root and fennel.',
    variations: [
      { id: 'var_mrj_half', name: 'Half Handi', price: 240 },
      { id: 'var_mrj_full', name: 'Full Handi', price: 380 },
    ]
  },
  // Breads
  {
    id: 'item_12',
    name: 'Butter Naan',
    category: 'Breads',
    price: 50,
    gstRate: 5,
    isVeg: true,
    available: true,
    description: 'Soft tandoori leavened flatbread glazed generously with pure salted butter.',
    popular: true,
    variations: [
      { id: 'var_bn_single', name: 'Single Piece', price: 50 },
      { id: 'var_bn_basket', name: 'Basket (3 Pcs)', price: 140 },
    ]
  },
  {
    id: 'item_13',
    name: 'Plain Naan',
    category: 'Breads',
    price: 35,
    gstRate: 5,
    isVeg: true,
    available: true,
    description: 'Traditional refined flour bread baked fresh on clay tandoor walls.',
    variations: [
      { id: 'var_pn_single', name: 'Single Piece', price: 35 },
      { id: 'var_pn_basket', name: 'Basket (3 Pcs)', price: 95 },
    ]
  },
  {
    id: 'item_14',
    name: 'Garlic Naan',
    category: 'Breads',
    price: 65,
    gstRate: 5,
    isVeg: true,
    available: true,
    description: 'Tandoori naan topped with roasted chopped garlic and fresh cilantro.',
    variations: [
      { id: 'var_gn_single', name: 'Single Piece', price: 65 },
      { id: 'var_gn_basket', name: 'Basket (3 Pcs)', price: 180 },
    ]
  },
  {
    id: 'item_15',
    name: 'Tandoori Roti',
    category: 'Breads',
    price: 25,
    gstRate: 5,
    isVeg: true,
    available: true,
    description: 'Whole wheat round bread baked in tandoor.',
    variations: [
      { id: 'var_tr_single', name: 'Single Piece', price: 25 },
      { id: 'var_tr_basket', name: 'Basket (3 Pcs)', price: 70 },
    ]
  },
  // Rice
  {
    id: 'item_16',
    name: 'Chicken Fried Rice',
    category: 'Rice',
    price: 240,
    gstRate: 5,
    isVeg: false,
    available: true,
    description: 'Wok tossed basmati rice with diced chicken, egg, scallions and light soy.',
    variations: [
      { id: 'var_cfr_half', name: 'Half', price: 150 },
      { id: 'var_cfr_full', name: 'Full', price: 240 },
    ]
  },
  {
    id: 'item_17',
    name: 'Veg Fried Rice',
    category: 'Rice',
    price: 190,
    gstRate: 5,
    isVeg: true,
    available: true,
    description: 'Classic wok-fried rice tossed with spring onions, carrots and cabbage.',
    variations: [
      { id: 'var_vfr_half', name: 'Half', price: 120 },
      { id: 'var_vfr_full', name: 'Full', price: 190 },
    ]
  },
  {
    id: 'item_18',
    name: 'Jeera Rice',
    category: 'Rice',
    price: 160,
    gstRate: 5,
    isVeg: true,
    available: true,
    description: 'Steamed basmati rice tempered with aromatic cumin seeds and desi ghee.',
    variations: [
      { id: 'var_jr_half', name: 'Half', price: 110 },
      { id: 'var_jr_full', name: 'Full', price: 160 },
    ]
  },
  // Beverages
  {
    id: 'item_19',
    name: 'Coke',
    category: 'Beverages',
    price: 40,
    gstRate: 5,
    isVeg: true,
    available: true,
    description: 'Chilled refreshing Coca-Cola can (330ml).',
    variations: [
      { id: 'var_coke_can', name: 'Regular (300ml)', price: 40 },
      { id: 'var_coke_btl', name: 'Large (500ml)', price: 70 },
    ]
  },
  {
    id: 'item_20',
    name: 'Water Bottle',
    category: 'Beverages',
    price: 20,
    gstRate: 5,
    isVeg: true,
    available: true,
    description: 'Packaged mineral water 1 Litre bottle.',
    variations: [
      { id: 'var_wb_500', name: 'Regular (500ml)', price: 15 },
      { id: 'var_wb_1000', name: 'Large (1000ml)', price: 25 },
    ]
  },
  {
    id: 'item_21',
    name: 'Fresh Lime Soda',
    category: 'Beverages',
    price: 60,
    gstRate: 5,
    isVeg: true,
    available: true,
    description: 'Sweet and salted freshly squeezed lemon juice with sparkling club soda.',
    variations: [
      { id: 'var_fls_reg', name: 'Regular (300ml)', price: 60 },
      { id: 'var_fls_lrg', name: 'Large (500ml)', price: 90 },
    ]
  },
  {
    id: 'item_22',
    name: 'Mango Lassi',
    category: 'Beverages',
    price: 80,
    gstRate: 5,
    isVeg: true,
    available: true,
    description: 'Thick churned creamy yogurt blended with Alphonso mango pulp.',
    variations: [
      { id: 'var_ml_reg', name: 'Regular (300ml)', price: 80 },
      { id: 'var_ml_lrg', name: 'Large (500ml)', price: 120 },
    ]
  },
  // Desserts
  {
    id: 'item_23',
    name: 'Ice Cream',
    category: 'Desserts',
    price: 100,
    gstRate: 5,
    isVeg: true,
    available: true,
    description: 'Double scoop gourmet vanilla bean / belgian chocolate ice cream.',
    variations: [
      { id: 'var_ic_single', name: 'Single Scoop', price: 60 },
      { id: 'var_ic_double', name: 'Double Scoop', price: 100 },
    ]
  },
  {
    id: 'item_24',
    name: 'Gulab Jamun',
    category: 'Desserts',
    price: 90,
    gstRate: 5,
    isVeg: true,
    available: true,
    description: 'Warm golden milk dumplings soaked in cardamom rose flavored sugar syrup.',
    variations: [
      { id: 'var_gj_1pc', name: '1 Piece', price: 50 },
      { id: 'var_gj_2pc', name: '2 Pieces', price: 90 },
    ]
  },
  {
    id: 'item_25',
    name: 'Matka Kulfi',
    category: 'Desserts',
    price: 120,
    gstRate: 5,
    isVeg: true,
    available: true,
    description: 'Traditional slow-condensed milk kulfi garnished with pistachios in earthen pot.',
    variations: [
      { id: 'var_mk_single', name: 'Single Pot', price: 70 },
      { id: 'var_mk_double', name: 'Double Pot', price: 120 },
    ]
  }
];

export const generateInitialTables = (branchId: 'main' | 'city' | 'beach'): RestaurantTable[] => {
  return [
    { id: `${branchId}_t1`, number: 1, name: 'Table 1', capacity: 2, branchId, status: 'occupied', currentAmount: 640, seatedAt: '12:15 PM', guestCount: 2, assignedWaiterName: 'Ramesh Patel', assignedWaiterId: 'usr_5' },
    { id: `${branchId}_t2`, number: 2, name: 'Table 2', capacity: 4, branchId, status: 'billing', currentAmount: 1243, seatedAt: '12:22 PM', guestCount: 3, assignedWaiterName: 'Ramesh Patel', assignedWaiterId: 'usr_5', billRequested: true, billRequestedAt: '12:48 PM', billRequestedBy: 'Ramesh Patel' },
    { id: `${branchId}_t3`, number: 3, name: 'Table 3', capacity: 4, branchId, status: 'billing', currentAmount: 748, seatedAt: '11:45 AM', guestCount: 4, assignedWaiterName: 'Ramesh Patel', assignedWaiterId: 'usr_5', billRequested: true, billRequestedAt: '12:40 PM', billRequestedBy: 'Ramesh Patel' },
    { id: `${branchId}_t4`, number: 4, name: 'Table 4', capacity: 6, branchId, status: 'occupied', currentAmount: 890, seatedAt: '12:35 PM', guestCount: 5, assignedWaiterName: 'Ramesh Patel', assignedWaiterId: 'usr_5' },
    { id: `${branchId}_t5`, number: 5, name: 'Table 5', capacity: 4, branchId, status: 'billing', currentAmount: 1133, seatedAt: '12:30 PM', guestCount: 3, guestName: 'Rahul Sharma', assignedWaiterName: 'Ramesh Patel', assignedWaiterId: 'usr_5', billRequested: true, billRequestedAt: '12:50 PM', billRequestedBy: 'Ramesh Patel' },
    { id: `${branchId}_t6`, number: 6, name: 'Table 6', capacity: 2, branchId, status: 'billing', currentAmount: 330, seatedAt: '12:35 PM', guestCount: 2, guestName: 'Ananya Sen', assignedWaiterName: 'Priya Nair', assignedWaiterId: 'usr_6', billRequested: true, billRequestedAt: '12:52 PM', billRequestedBy: 'Priya Nair' },
    { id: `${branchId}_t7`, number: 7, name: 'Table 7', capacity: 4, branchId, status: 'occupied', currentAmount: 760, seatedAt: '12:40 PM', guestCount: 2, assignedWaiterName: 'Priya Nair', assignedWaiterId: 'usr_6' },
    { id: `${branchId}_t8`, number: 8, name: 'Table 8', capacity: 8, branchId, status: 'available', currentAmount: 0, assignedWaiterName: 'Priya Nair', assignedWaiterId: 'usr_6' },
    { id: `${branchId}_t9`, number: 9, name: 'Table 9', capacity: 4, branchId, status: 'available', currentAmount: 0, assignedWaiterName: 'Priya Nair', assignedWaiterId: 'usr_6' },
    { id: `${branchId}_t10`, number: 10, name: 'Table 10', capacity: 6, branchId, status: 'available', currentAmount: 0, assignedWaiterName: 'Priya Nair', assignedWaiterId: 'usr_6' },
  ];
};

export const INITIAL_BILL_REQUESTS: BillRequest[] = [
  {
    id: 'req_demo_tbl2',
    tableNumber: 'Table 2',
    tableId: 'main_t2',
    branchId: 'main',
    branchName: 'Main Branch',
    orderType: 'dine_in',
    requestedBy: 'Ramesh Patel',
    requestedAt: '12:48 PM',
    status: 'pending',
    kotNumbers: ['KOT-101'],
    totalAmount: 1243,
    notes: 'Guest requested bill. Payment via Card/Cash.'
  },
  {
    id: 'req_demo_tbl5',
    tableNumber: 'Table 5',
    tableId: 'main_t5',
    branchId: 'main',
    branchName: 'Main Branch',
    orderType: 'dine_in',
    requestedBy: 'Ramesh Patel',
    requestedAt: '12:50 PM',
    status: 'pending',
    kotNumbers: ['KOT-102', 'KOT-10025'],
    totalAmount: 1133,
    customerName: 'Rahul Sharma',
    notes: 'Guest requested bill. Payment via UPI/Cash.'
  },
  {
    id: 'req_demo_tbl3',
    tableNumber: 'Table 3',
    tableId: 'main_t3',
    branchId: 'main',
    branchName: 'Main Branch',
    orderType: 'dine_in',
    requestedBy: 'Ramesh Patel',
    requestedAt: '12:40 PM',
    status: 'pending',
    kotNumbers: ['KOT-10028'],
    totalAmount: 748,
    notes: 'Guest requested bill. UPI payment.'
  },
  {
    id: 'req_demo_tbl6',
    tableNumber: 'Table 6',
    tableId: 'main_t6',
    branchId: 'main',
    branchName: 'Main Branch',
    orderType: 'dine_in',
    requestedBy: 'Priya Nair',
    requestedAt: '12:52 PM',
    status: 'pending',
    kotNumbers: ['KOT-10029'],
    totalAmount: 330,
    notes: 'Awaiting quick cashier settlement.'
  }
];

export const INITIAL_KOTS: KOT[] = [
  // --- MAIN BRANCH ---
  // Pending (7 KOTs - Awaiting Kitchen Pickup / In Queue)
  {
    id: 'kot_10022',
    kotNumber: 'KOT-10022',
    branchId: 'main',
    branchName: 'Main Branch',
    tableNumber: 'Table 4',
    tableId: 'main_t4',
    orderType: 'dine_in',
    status: 'new',
    createdAt: '2026-09-07T12:35:00',
    timeFormatted: '12:35 PM',
    items: [
      { menuItemId: 'item_4', name: 'Chicken 65', quantity: 2, rate: 240, isVeg: false },
      { menuItemId: 'item_5', name: 'Paneer 65', quantity: 1, rate: 220, isVeg: true },
      { menuItemId: 'item_19', name: 'Coke', quantity: 3, rate: 40, isVeg: true }
    ],
    totalAmount: 820,
    specialInstructions: 'Extra lemon wedges please',
    isBilled: false
  },
  {
    id: 'kot_10027',
    kotNumber: 'KOT-10027',
    branchId: 'main',
    branchName: 'Main Branch',
    tableNumber: 'Table 1',
    tableId: 'main_t1',
    orderType: 'dine_in',
    status: 'new',
    createdAt: '2026-09-07T12:48:00',
    timeFormatted: '12:48 PM',
    items: [
      { menuItemId: 'item_8', name: 'Butter Chicken', quantity: 1, rate: 320, isVeg: false },
      { menuItemId: 'item_11', name: 'Tandoori Roti', quantity: 4, rate: 30, isVeg: true },
      { menuItemId: 'item_20', name: 'Water Bottle', quantity: 1, rate: 20, isVeg: true }
    ],
    totalAmount: 460,
    specialInstructions: 'Butter chicken extra mild',
    isBilled: false
  },
  {
    id: 'kot_10028',
    kotNumber: 'KOT-10028',
    branchId: 'main',
    branchName: 'Main Branch',
    tableNumber: 'Table 3',
    tableId: 'main_t3',
    orderType: 'dine_in',
    status: 'new',
    createdAt: '2026-09-07T12:50:00',
    timeFormatted: '12:50 PM',
    items: [
      { menuItemId: 'item_10', name: 'Dal Makhani', quantity: 1, rate: 220, isVeg: true },
      { menuItemId: 'item_14', name: 'Garlic Naan', quantity: 4, rate: 60, isVeg: true },
      { menuItemId: 'item_21', name: 'Fresh Lime Soda', quantity: 2, rate: 60, isVeg: true },
      { menuItemId: 'item_25', name: 'Matka Kulfi', quantity: 1, rate: 100, isVeg: true }
    ],
    totalAmount: 680,
    isBilled: false
  },
  {
    id: 'kot_10029',
    kotNumber: 'KOT-10029',
    branchId: 'main',
    branchName: 'Main Branch',
    tableNumber: 'Table 6',
    tableId: 'main_t6',
    orderType: 'dine_in',
    status: 'new',
    createdAt: '2026-09-07T12:52:00',
    timeFormatted: '12:52 PM',
    items: [
      { menuItemId: 'item_21', name: 'Fresh Lime Soda', quantity: 2, rate: 60, isVeg: true },
      { menuItemId: 'item_11', name: 'Tandoori Roti', quantity: 3, rate: 30, isVeg: true },
      { menuItemId: 'item_25', name: 'Matka Kulfi', quantity: 1, rate: 90, isVeg: true }
    ],
    totalAmount: 300,
    specialInstructions: 'Serve kulfi chilled',
    isBilled: false
  },
  {
    id: 'kot_10030',
    kotNumber: 'KOT-10030',
    branchId: 'main',
    branchName: 'Main Branch',
    tableNumber: 'Table 7',
    tableId: 'main_t7',
    orderType: 'dine_in',
    status: 'new',
    createdAt: '2026-09-07T12:53:00',
    timeFormatted: '12:53 PM',
    items: [
      { menuItemId: 'item_7', name: 'Paneer Butter Masala', quantity: 1, rate: 260, isVeg: true },
      { menuItemId: 'item_18', name: 'Jeera Rice', quantity: 2, rate: 160, isVeg: true },
      { menuItemId: 'item_12', name: 'Butter Naan', quantity: 2, rate: 50, isVeg: true }
    ],
    totalAmount: 680,
    isBilled: false
  },
  {
    id: 'kot_10031',
    kotNumber: 'KOT-10031',
    branchId: 'main',
    branchName: 'Main Branch',
    tableNumber: 'Table 8',
    tableId: 'main_t8',
    orderType: 'dine_in',
    status: 'new',
    createdAt: '2026-09-07T12:55:00',
    timeFormatted: '12:55 PM',
    items: [
      { menuItemId: 'item_4', name: 'Chicken 65', quantity: 1, rate: 240, isVeg: false },
      { menuItemId: 'item_16', name: 'Chicken Fried Rice', quantity: 1, rate: 240, isVeg: false },
      { menuItemId: 'item_21', name: 'Fresh Lime Soda', quantity: 2, rate: 60, isVeg: true }
    ],
    totalAmount: 600,
    isBilled: false
  },
  {
    id: 'kot_10032',
    kotNumber: 'KOT-10032',
    branchId: 'main',
    branchName: 'Main Branch',
    orderType: 'takeaway',
    takeawayId: 'TK-101',
    status: 'new',
    createdAt: '2026-09-07T12:56:00',
    timeFormatted: '12:56 PM',
    customerName: 'Karan Mehra',
    customerMobile: '9819087654',
    items: [
      { menuItemId: 'item_1', name: 'Chicken Biryani', quantity: 2, rate: 280, isVeg: false },
      { menuItemId: 'item_22', name: 'Mango Lassi', quantity: 2, rate: 80, isVeg: true }
    ],
    totalAmount: 720,
    isBilled: false
  },
  {
    id: 'kot_10040_del',
    kotNumber: 'KOT-10040',
    branchId: 'main',
    branchName: 'Main Branch',
    orderType: 'delivery',
    status: 'new',
    createdAt: '2026-09-07T12:57:00',
    timeFormatted: '12:57 PM',
    customerName: 'Zomato Delivery #482',
    customerMobile: '9820011223',
    items: [
      { menuItemId: 'item_1', name: 'Chicken Biryani', quantity: 2, rate: 280, isVeg: false },
      { menuItemId: 'item_4', name: 'Chicken 65', quantity: 1, rate: 240, isVeg: false }
    ],
    totalAmount: 800,
    specialInstructions: 'Delivery rider waiting. Seal box.',
    isBilled: false
  },
  // Active Cooking (5 KOTs - Food in Preparation)
  {
    id: 'kot_101',
    kotNumber: 'KOT-101',
    branchId: 'main',
    branchName: 'Main Branch',
    tableNumber: 'Table 2',
    tableId: 'main_t2',
    orderType: 'dine_in',
    status: 'preparing',
    createdAt: '2026-09-07T12:22:00',
    timeFormatted: '12:22 PM',
    startedAt: '12:24 PM',
    items: [
      { menuItemId: 'item_1', name: 'Chicken Biryani', quantity: 2, rate: 280, isVeg: false },
      { menuItemId: 'item_12', name: 'Butter Naan', quantity: 3, rate: 50, isVeg: true },
      { menuItemId: 'item_8', name: 'Butter Chicken', quantity: 1, rate: 320, isVeg: false },
      { menuItemId: 'item_21', name: 'Fresh Lime Soda', quantity: 2, rate: 50, isVeg: true }
    ],
    totalAmount: 1130,
    specialInstructions: 'Make biryani medium spicy',
    isBilled: false,
    isPaid: false,
    paymentStatus: 'UNPAID'
  },
  {
    id: 'kot_102',
    kotNumber: 'KOT-102',
    branchId: 'main',
    branchName: 'Main Branch',
    tableNumber: 'Table 5',
    tableId: 'main_t5',
    orderType: 'dine_in',
    status: 'preparing',
    createdAt: '2026-09-07T12:45:00',
    timeFormatted: '12:45 PM',
    startedAt: '12:47 PM',
    customerName: 'Rahul Sharma',
    customerMobile: '9876543210',
    items: [
      { menuItemId: 'item_13', name: 'Plain Naan', quantity: 2, rate: 35, isVeg: true },
      { menuItemId: 'item_8', name: 'Butter Chicken', quantity: 1, rate: 320, isVeg: false }
    ],
    totalAmount: 390,
    specialInstructions: 'Additional order',
    isBilled: false,
    isPaid: false,
    paymentStatus: 'UNPAID'
  },
  {
    id: 'kot_10033',
    kotNumber: 'KOT-10033',
    branchId: 'main',
    branchName: 'Main Branch',
    tableNumber: 'Table 9',
    tableId: 'main_t9',
    orderType: 'dine_in',
    status: 'preparing',
    createdAt: '2026-09-07T12:38:00',
    timeFormatted: '12:38 PM',
    startedAt: '12:40 PM',
    items: [
      { menuItemId: 'item_2', name: 'Mutton Biryani', quantity: 2, rate: 360, isVeg: false },
      { menuItemId: 'item_4', name: 'Chicken 65', quantity: 1, rate: 240, isVeg: false }
    ],
    totalAmount: 960,
    isBilled: false
  },
  {
    id: 'kot_10041_del',
    kotNumber: 'KOT-10041',
    branchId: 'main',
    branchName: 'Main Branch',
    orderType: 'delivery',
    status: 'preparing',
    createdAt: '2026-09-07T12:40:00',
    timeFormatted: '12:40 PM',
    startedAt: '12:42 PM',
    customerName: 'Swiggy Delivery #912',
    customerMobile: '9845199887',
    items: [
      { menuItemId: 'item_8', name: 'Butter Chicken', quantity: 1, rate: 320, isVeg: false },
      { menuItemId: 'item_14', name: 'Garlic Naan', quantity: 3, rate: 60, isVeg: true }
    ],
    totalAmount: 500,
    specialInstructions: 'Pack in insulated thermal bag.',
    isBilled: false
  },
  {
    id: 'kot_10034',
    kotNumber: 'KOT-10034',
    branchId: 'main',
    branchName: 'Main Branch',
    orderType: 'takeaway',
    takeawayId: 'TK-100',
    status: 'ready',
    createdAt: '2026-09-07T12:42:00',
    timeFormatted: '12:42 PM',
    startedAt: '12:44 PM',
    readyAt: '12:55 PM',
    customerName: 'Deepak Varma',
    customerMobile: '9880123456',
    items: [
      { menuItemId: 'item_3', name: 'Veg Biryani', quantity: 2, rate: 220, isVeg: true },
      { menuItemId: 'item_7', name: 'Paneer Butter Masala', quantity: 1, rate: 260, isVeg: true },
      { menuItemId: 'item_14', name: 'Garlic Naan', quantity: 2, rate: 60, isVeg: true }
    ],
    totalAmount: 820,
    isBilled: false
  },
  // Ready to Serve (2 Takeaway packets for Cashier + 2 Dine-in tables for Waiter)
  {
    id: 'kot_10111',
    kotNumber: 'KOT-10111',
    branchId: 'main',
    branchName: 'Main Branch',
    orderType: 'takeaway',
    takeawayId: 'TK-111',
    status: 'ready',
    createdAt: '2026-09-07T12:25:00',
    timeFormatted: '12:25 PM',
    startedAt: '12:26 PM',
    readyAt: '12:42 PM',
    customerName: 'Sanjay Kapoor',
    customerMobile: '9845012345',
    items: [
      { menuItemId: 'item_10', name: 'Paneer 65', quantity: 1, rate: 210, isVeg: true },
      { menuItemId: 'item_22', name: 'Mango Lassi', quantity: 1, rate: 80, isVeg: true }
    ],
    totalAmount: 290,
    isBilled: false
  },
  {
    id: 'kot_10035',
    kotNumber: 'KOT-10035',
    branchId: 'main',
    branchName: 'Main Branch',
    tableNumber: 'Table 10',
    tableId: 'main_t10',
    orderType: 'dine_in',
    status: 'ready',
    createdAt: '2026-09-07T12:22:00',
    timeFormatted: '12:22 PM',
    startedAt: '12:24 PM',
    readyAt: '12:36 PM',
    items: [
      { menuItemId: 'item_1', name: 'Chicken Biryani', quantity: 1, rate: 280, isVeg: false },
      { menuItemId: 'item_22', name: 'Mango Lassi', quantity: 2, rate: 80, isVeg: true }
    ],
    totalAmount: 440,
    isBilled: false,
    isPaid: false,
    paymentStatus: 'UNPAID'
  },
  {
    id: 'kot_10036',
    kotNumber: 'KOT-10036',
    branchId: 'main',
    branchName: 'Main Branch',
    tableNumber: 'Table 4',
    tableId: 'main_t4',
    orderType: 'dine_in',
    status: 'ready',
    createdAt: '2026-09-07T12:20:00',
    timeFormatted: '12:20 PM',
    startedAt: '12:22 PM',
    readyAt: '12:39 PM',
    items: [
      { menuItemId: 'item_6', name: 'Tandoori Chicken (Half)', quantity: 1, rate: 260, isVeg: false },
      { menuItemId: 'item_12', name: 'Butter Naan', quantity: 2, rate: 50, isVeg: true }
    ],
    totalAmount: 360,
    isBilled: false
  },
  // Served (1 KOT)
  {
    id: 'kot_10025',
    kotNumber: 'KOT-10025',
    branchId: 'main',
    branchName: 'Main Branch',
    tableNumber: 'Table 5',
    tableId: 'main_t5',
    orderType: 'dine_in',
    status: 'served',
    createdAt: '2026-09-07T12:30:00',
    timeFormatted: '12:30 PM',
    customerName: 'Rahul Sharma',
    customerMobile: '9876543210',
    items: [
      { menuItemId: 'item_1', name: 'Chicken Biryani', quantity: 2, rate: 280, isVeg: false },
      { menuItemId: 'item_19', name: 'Coke', quantity: 2, rate: 40, isVeg: true }
    ],
    totalAmount: 640,
    specialInstructions: 'First order',
    isBilled: false,
    isPaid: false,
    paymentStatus: 'UNPAID'
  },

  // --- CITY BRANCH ---
  // Pending (5 KOTs)
  {
    id: 'kot_10037',
    kotNumber: 'KOT-10037',
    branchId: 'city',
    branchName: 'City Branch',
    tableNumber: 'Table 2',
    tableId: 'city_t2',
    orderType: 'dine_in',
    status: 'new',
    createdAt: '2026-09-07T12:46:00',
    timeFormatted: '12:46 PM',
    items: [
      { menuItemId: 'item_1', name: 'Chicken Biryani', quantity: 2, rate: 280, isVeg: false },
      { menuItemId: 'item_21', name: 'Fresh Lime Soda', quantity: 2, rate: 60, isVeg: true }
    ],
    totalAmount: 680,
    isBilled: false
  },
  {
    id: 'kot_10038',
    kotNumber: 'KOT-10038',
    branchId: 'city',
    branchName: 'City Branch',
    tableNumber: 'Table 3',
    tableId: 'city_t3',
    orderType: 'dine_in',
    status: 'new',
    createdAt: '2026-09-07T12:49:00',
    timeFormatted: '12:49 PM',
    items: [
      { menuItemId: 'item_3', name: 'Veg Biryani', quantity: 1, rate: 220, isVeg: true },
      { menuItemId: 'item_5', name: 'Paneer 65', quantity: 1, rate: 220, isVeg: true }
    ],
    totalAmount: 440,
    isBilled: false
  },
  {
    id: 'kot_10039',
    kotNumber: 'KOT-10039',
    branchId: 'city',
    branchName: 'City Branch',
    tableNumber: 'Table 4',
    tableId: 'city_t4',
    orderType: 'dine_in',
    status: 'new',
    createdAt: '2026-09-07T12:51:00',
    timeFormatted: '12:51 PM',
    items: [
      { menuItemId: 'item_2', name: 'Mutton Biryani', quantity: 2, rate: 360, isVeg: false },
      { menuItemId: 'item_19', name: 'Coke', quantity: 2, rate: 40, isVeg: true }
    ],
    totalAmount: 800,
    isBilled: false
  },
  {
    id: 'kot_10040',
    kotNumber: 'KOT-10040',
    branchId: 'city',
    branchName: 'City Branch',
    tableNumber: 'Table 5',
    tableId: 'city_t5',
    orderType: 'dine_in',
    status: 'new',
    createdAt: '2026-09-07T12:54:00',
    timeFormatted: '12:54 PM',
    items: [
      { menuItemId: 'item_7', name: 'Paneer Butter Masala', quantity: 1, rate: 260, isVeg: true },
      { menuItemId: 'item_12', name: 'Butter Naan', quantity: 3, rate: 50, isVeg: true }
    ],
    totalAmount: 410,
    isBilled: false
  },
  {
    id: 'kot_10041',
    kotNumber: 'KOT-10041',
    branchId: 'city',
    branchName: 'City Branch',
    orderType: 'takeaway',
    status: 'new',
    createdAt: '2026-09-07T12:55:00',
    timeFormatted: '12:55 PM',
    customerName: 'Anil Kumble',
    customerMobile: '9845112233',
    items: [
      { menuItemId: 'item_1', name: 'Chicken Biryani', quantity: 3, rate: 280, isVeg: false },
      { menuItemId: 'item_4', name: 'Chicken 65', quantity: 1, rate: 240, isVeg: false }
    ],
    totalAmount: 1080,
    isBilled: false
  },
  // Active Cooking (2 KOTs)
  {
    id: 'kot_10042',
    kotNumber: 'KOT-10042',
    branchId: 'city',
    branchName: 'City Branch',
    tableNumber: 'Table 6',
    tableId: 'city_t6',
    orderType: 'dine_in',
    status: 'preparing',
    createdAt: '2026-09-07T12:37:00',
    timeFormatted: '12:37 PM',
    startedAt: '12:39 PM',
    items: [
      { menuItemId: 'item_8', name: 'Butter Chicken', quantity: 1, rate: 320, isVeg: false },
      { menuItemId: 'item_14', name: 'Garlic Naan', quantity: 3, rate: 60, isVeg: true },
      { menuItemId: 'item_24', name: 'Gulab Jamun (2 pcs)', quantity: 2, rate: 90, isVeg: true }
    ],
    totalAmount: 680,
    isBilled: false
  },
  {
    id: 'kot_10043',
    kotNumber: 'KOT-10043',
    branchId: 'city',
    branchName: 'City Branch',
    orderType: 'takeaway',
    status: 'preparing',
    createdAt: '2026-09-07T12:41:00',
    timeFormatted: '12:41 PM',
    startedAt: '12:43 PM',
    customerName: 'Nisha Pillai',
    customerMobile: '9811223344',
    items: [
      { menuItemId: 'item_16', name: 'Chicken Fried Rice', quantity: 2, rate: 240, isVeg: false },
      { menuItemId: 'item_4', name: 'Chicken 65', quantity: 1, rate: 240, isVeg: false }
    ],
    totalAmount: 720,
    isBilled: false
  },
  // Ready (1 KOT)
  {
    id: 'kot_10023',
    kotNumber: 'KOT-10023',
    branchId: 'city',
    branchName: 'City Branch',
    tableNumber: 'Table 1',
    tableId: 'city_t1',
    orderType: 'dine_in',
    status: 'ready',
    createdAt: '2026-09-07T12:18:00',
    timeFormatted: '12:18 PM',
    startedAt: '12:20 PM',
    readyAt: '12:35 PM',
    items: [
      { menuItemId: 'item_2', name: 'Mutton Biryani', quantity: 1, rate: 360, isVeg: false },
      { menuItemId: 'item_22', name: 'Mango Lassi', quantity: 2, rate: 80, isVeg: true }
    ],
    totalAmount: 520,
    isBilled: false
  },

  // --- BEACH ROAD BRANCH ---
  // Pending (4 KOTs)
  {
    id: 'kot_10044',
    kotNumber: 'KOT-10044',
    branchId: 'beach',
    branchName: 'Beach Road Branch',
    tableNumber: 'Table 1',
    tableId: 'beach_t1',
    orderType: 'dine_in',
    status: 'new',
    createdAt: '2026-09-07T12:47:00',
    timeFormatted: '12:47 PM',
    items: [
      { menuItemId: 'item_1', name: 'Chicken Biryani', quantity: 2, rate: 280, isVeg: false },
      { menuItemId: 'item_21', name: 'Fresh Lime Soda', quantity: 2, rate: 60, isVeg: true }
    ],
    totalAmount: 680,
    isBilled: false
  },
  {
    id: 'kot_10045',
    kotNumber: 'KOT-10045',
    branchId: 'beach',
    branchName: 'Beach Road Branch',
    tableNumber: 'Table 2',
    tableId: 'beach_t2',
    orderType: 'dine_in',
    status: 'new',
    createdAt: '2026-09-07T12:50:00',
    timeFormatted: '12:50 PM',
    items: [
      { menuItemId: 'item_7', name: 'Paneer Butter Masala', quantity: 1, rate: 260, isVeg: true },
      { menuItemId: 'item_13', name: 'Plain Naan', quantity: 3, rate: 35, isVeg: true }
    ],
    totalAmount: 365,
    isBilled: false
  },
  {
    id: 'kot_10046',
    kotNumber: 'KOT-10046',
    branchId: 'beach',
    branchName: 'Beach Road Branch',
    tableNumber: 'Table 3',
    tableId: 'beach_t3',
    orderType: 'dine_in',
    status: 'new',
    createdAt: '2026-09-07T12:53:00',
    timeFormatted: '12:53 PM',
    items: [
      { menuItemId: 'item_2', name: 'Mutton Biryani', quantity: 1, rate: 360, isVeg: false },
      { menuItemId: 'item_19', name: 'Coke', quantity: 1, rate: 40, isVeg: true }
    ],
    totalAmount: 400,
    isBilled: false
  },
  {
    id: 'kot_10047',
    kotNumber: 'KOT-10047',
    branchId: 'beach',
    branchName: 'Beach Road Branch',
    orderType: 'takeaway',
    status: 'new',
    createdAt: '2026-09-07T12:55:00',
    timeFormatted: '12:55 PM',
    customerName: 'Sunita Rao',
    customerMobile: '9844001122',
    items: [
      { menuItemId: 'item_17', name: 'Veg Fried Rice', quantity: 2, rate: 190, isVeg: true },
      { menuItemId: 'item_5', name: 'Paneer 65', quantity: 1, rate: 220, isVeg: true }
    ],
    totalAmount: 600,
    isBilled: false
  },
  // Active Cooking (2 KOTs)
  {
    id: 'kot_10024',
    kotNumber: 'KOT-10024',
    branchId: 'beach',
    branchName: 'Beach Road Branch',
    orderType: 'takeaway',
    status: 'preparing',
    createdAt: '2026-09-07T12:28:00',
    timeFormatted: '12:28 PM',
    startedAt: '12:30 PM',
    customerName: 'Suresh Raina',
    customerMobile: '9845012345',
    items: [
      { menuItemId: 'item_1', name: 'Chicken Biryani', quantity: 3, rate: 280, isVeg: false },
      { menuItemId: 'item_23', name: 'Ice Cream', quantity: 2, rate: 100, isVeg: true }
    ],
    totalAmount: 1040,
    isBilled: false
  },
  {
    id: 'kot_10048',
    kotNumber: 'KOT-10048',
    branchId: 'beach',
    branchName: 'Beach Road Branch',
    tableNumber: 'Table 4',
    tableId: 'beach_t4',
    orderType: 'dine_in',
    status: 'preparing',
    createdAt: '2026-09-07T12:36:00',
    timeFormatted: '12:36 PM',
    startedAt: '12:38 PM',
    items: [
      { menuItemId: 'item_6', name: 'Tandoori Chicken (Half)', quantity: 2, rate: 260, isVeg: false },
      { menuItemId: 'item_12', name: 'Butter Naan', quantity: 4, rate: 50, isVeg: true }
    ],
    totalAmount: 720,
    isBilled: false
  },
  // Ready (1 KOT)
  {
    id: 'kot_10049',
    kotNumber: 'KOT-10049',
    branchId: 'beach',
    branchName: 'Beach Road Branch',
    tableNumber: 'Table 5',
    tableId: 'beach_t5',
    orderType: 'dine_in',
    status: 'ready',
    createdAt: '2026-09-07T12:24:00',
    timeFormatted: '12:24 PM',
    startedAt: '12:26 PM',
    readyAt: '12:41 PM',
    items: [
      { menuItemId: 'item_8', name: 'Butter Chicken', quantity: 1, rate: 320, isVeg: false },
      { menuItemId: 'item_14', name: 'Garlic Naan', quantity: 2, rate: 60, isVeg: true }
    ],
    totalAmount: 440,
    isBilled: false
  }
];

export const INITIAL_BILLS: Bill[] = [
  {
    id: 'inv_10071',
    billNumber: 'INV-10071',
    kotNumber: 'KOT-102',
    kotNumbers: ['KOT-102', 'KOT-10025'],
    kotSent: true,
    branchId: 'main',
    branchName: 'Main Branch',
    date: '2026-09-30',
    time: '12:50 PM',
    tableNumber: 'Table 5',
    orderType: 'dine_in',
    customerName: 'Rahul Sharma',
    customerMobile: '9820123456',
    stewardName: 'Ramesh Patel',
    items: [
      { id: 'item_1', name: 'Chicken Biryani', quantity: 2, rate: 280, amount: 560 },
      { id: 'item_19', name: 'Coke', quantity: 2, rate: 40, amount: 80 },
      { id: 'item_13', name: 'Plain Naan', quantity: 2, rate: 35, amount: 70 },
      { id: 'item_8', name: 'Butter Chicken', quantity: 1, rate: 320, amount: 320 }
    ],
    subtotal: 1030,
    gstPercent: 10,
    gstAmount: 103,
    cgstPercent: 5,
    cgstAmount: 51.5,
    sgstPercent: 5,
    sgstAmount: 51.5,
    discountAmount: 0,
    grandTotal: 1133,
    paymentMethod: 'cash',
    status: 'unpaid',
    paymentStatus: 'UNPAID',
    isPaid: false,
    isEstimate: true,
    cashierName: 'Cashier Desk'
  },
  {
    id: 'inv_10089',
    billNumber: 'INV-10089',
    kotNumber: 'KOT-101',
    kotNumbers: ['KOT-101'],
    kotSent: true,
    branchId: 'main',
    branchName: 'Main Branch',
    date: '2026-09-30',
    time: '12:48 PM',
    tableNumber: 'Table 2',
    orderType: 'dine_in',
    customerName: 'Guest at Table 2',
    items: [
      { id: 'item_1', name: 'Chicken Biryani', quantity: 2, rate: 280, amount: 560 },
      { id: 'item_12', name: 'Butter Naan', quantity: 3, rate: 50, amount: 150 },
      { id: 'item_8', name: 'Butter Chicken', quantity: 1, rate: 320, amount: 320 },
      { id: 'item_21', name: 'Fresh Lime Soda', quantity: 2, rate: 50, amount: 100 }
    ],
    subtotal: 1130,
    gstPercent: 10,
    gstAmount: 113,
    cgstPercent: 5,
    cgstAmount: 56.5,
    sgstPercent: 5,
    sgstAmount: 56.5,
    discountAmount: 0,
    grandTotal: 1243,
    paymentMethod: 'cash',
    status: 'unpaid',
    paymentStatus: 'UNPAID',
    isPaid: false,
    isEstimate: true,
    cashierName: 'Cashier Desk'
  },
  {
    id: 'inv_10001',
    billNumber: 'INV-10001',
    kotNumber: 'KOT-10001',
    kotSent: true,
    branchId: 'main',
    branchName: 'Main Branch',
    date: '2026-09-07',
    time: '11:15 AM',
    tableNumber: 'Table 3',
    orderType: 'dine_in',
    customerName: 'Amit Verma',
    customerMobile: '9876543210',
    items: [
      { id: 'item_1', name: 'Chicken Biryani', quantity: 2, rate: 280, amount: 560 },
      { id: 'item_19', name: 'Coke', quantity: 2, rate: 40, amount: 80 },
      { id: 'item_4', name: 'Chicken 65', quantity: 1, rate: 240, amount: 240 }
    ],
    subtotal: 880,
    gstPercent: 5,
    gstAmount: 44,
    discountAmount: 0,
    grandTotal: 924,
    paymentMethod: 'upi',
    status: 'paid',
    cashierName: 'Anita Deshmukh'
  },
  {
    id: 'inv_10002',
    billNumber: 'INV-10002',
    kotNumber: 'KOT-10002',
    kotSent: true,
    branchId: 'main',
    branchName: 'Main Branch',
    date: '2026-09-07',
    time: '11:30 AM',
    tableNumber: 'Table 1',
    orderType: 'dine_in',
    customerName: 'Priya Nair',
    customerMobile: '9812345678',
    items: [
      { id: 'item_2', name: 'Mutton Biryani', quantity: 2, rate: 360, amount: 720 },
      { id: 'item_12', name: 'Butter Naan', quantity: 4, rate: 50, amount: 200 },
      { id: 'item_8', name: 'Butter Chicken', quantity: 1, rate: 320, amount: 320 }
    ],
    subtotal: 1240,
    gstPercent: 5,
    gstAmount: 62,
    discountAmount: 0,
    grandTotal: 1302,
    paymentMethod: 'card',
    status: 'paid',
    cashierName: 'Anita Deshmukh'
  },
  {
    id: 'inv_10003',
    billNumber: 'INV-10003',
    kotSent: false,
    branchId: 'city',
    branchName: 'City Branch',
    date: '2026-09-07',
    time: '11:42 AM',
    tableNumber: 'Table 5',
    orderType: 'dine_in',
    customerName: 'Sneha Reddy',
    customerMobile: '9945123456',
    items: [
      { id: 'item_3', name: 'Veg Biryani', quantity: 2, rate: 220, amount: 440 },
      { id: 'item_5', name: 'Paneer 65', quantity: 1, rate: 220, amount: 220 },
      { id: 'item_22', name: 'Mango Lassi', quantity: 2, rate: 80, amount: 160 }
    ],
    subtotal: 820,
    gstPercent: 5,
    gstAmount: 41,
    discountAmount: 0,
    grandTotal: 861,
    paymentMethod: 'cash',
    status: 'paid',
    cashierName: 'Ramesh K'
  },
  {
    id: 'inv_10004',
    billNumber: 'INV-10004',
    kotNumber: 'KOT-10004',
    kotSent: true,
    branchId: 'beach',
    branchName: 'Beach Road Branch',
    date: '2026-09-07',
    time: '12:05 PM',
    orderType: 'takeaway',
    customerName: 'Vikram Malhotra',
    customerMobile: '9765432190',
    items: [
      { id: 'item_1', name: 'Chicken Biryani', quantity: 4, rate: 280, amount: 1120 },
      { id: 'item_4', name: 'Chicken 65', quantity: 2, rate: 240, amount: 480 },
      { id: 'item_20', name: 'Water Bottle', quantity: 4, rate: 20, amount: 80 }
    ],
    subtotal: 1680,
    gstPercent: 5,
    gstAmount: 84,
    discountAmount: 0,
    grandTotal: 1764,
    paymentMethod: 'upi',
    status: 'paid',
    cashierName: 'Kavita M'
  },
  {
    id: 'inv_10005',
    billNumber: 'INV-10005',
    kotSent: false,
    branchId: 'main',
    branchName: 'Main Branch',
    date: '2026-09-07',
    time: '12:12 PM',
    orderType: 'parcel',
    customerName: 'Deepak Joshi',
    customerMobile: '9845761230',
    items: [
      { id: 'item_16', name: 'Chicken Fried Rice', quantity: 2, rate: 240, amount: 480 },
      { id: 'item_4', name: 'Chicken 65', quantity: 1, rate: 240, amount: 240 }
    ],
    subtotal: 720,
    gstPercent: 5,
    gstAmount: 36,
    discountAmount: 0,
    grandTotal: 756,
    paymentMethod: 'split',
    splitDetails: { cash: 500, upi: 256, card: 0 },
    status: 'paid',
    cashierName: 'Anita Deshmukh'
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust_1',
    name: 'Amit Verma',
    mobile: '9876543210',
    email: 'amit.verma@example.com',
    totalOrders: 14,
    totalSpent: 18450,
    lastVisit: '2026-09-07',
    favoriteBranch: 'Main Branch'
  },
  {
    id: 'cust_2',
    name: 'Priya Nair',
    mobile: '9812345678',
    email: 'priya.nair@example.com',
    totalOrders: 9,
    totalSpent: 12200,
    lastVisit: '2026-09-07',
    favoriteBranch: 'Main Branch'
  },
  {
    id: 'cust_3',
    name: 'Sneha Reddy',
    mobile: '9945123456',
    email: 'sneha.r@example.com',
    totalOrders: 22,
    totalSpent: 26800,
    lastVisit: '2026-09-07',
    favoriteBranch: 'City Branch'
  },
  {
    id: 'cust_4',
    name: 'Vikram Malhotra',
    mobile: '9765432190',
    email: 'vikram.m@example.com',
    totalOrders: 7,
    totalSpent: 9600,
    lastVisit: '2026-09-07',
    favoriteBranch: 'Beach Road Branch'
  },
  {
    id: 'cust_5',
    name: 'Suresh Raina',
    mobile: '9845012345',
    email: 'suresh.raina@example.com',
    totalOrders: 18,
    totalSpent: 21900,
    lastVisit: '2026-09-06',
    favoriteBranch: 'Beach Road Branch'
  },
  {
    id: 'cust_6',
    name: 'Rohit Kulkarni',
    mobile: '9820019283',
    email: 'rohit.k@example.com',
    totalOrders: 11,
    totalSpent: 14750,
    lastVisit: '2026-09-05',
    favoriteBranch: 'Main Branch'
  }
];

// Seed summary metrics as instructed in user prompt for high fidelity:
export const BENCHMARK_STATS = {
  consolidated: {
    todaySales: 218450,
    totalOrders: 428,
    dineInOrders: 238,
    takeawayOrders: 190,
    pendingKOTs: 16,
    activeCookingKOTs: 8,
    readyKOTs: 4,
    paidBills: 410,
    paymentBreakdown: {
      cash: 72500,
      upi: 98250,
      card: 47700
    },
    branchPerformance: {
      main: 92500,
      city: 68750,
      beach: 57200
    }
  },
  main: {
    todaySales: 92500,
    totalOrders: 182,
    dineInOrders: 104,
    takeawayOrders: 78,
    pendingKOTs: 7,
    activeCookingKOTs: 4,
    readyKOTs: 2,
    paidBills: 175,
    paymentBreakdown: {
      cash: 31000,
      upi: 41500,
      card: 20000
    }
  },
  city: {
    todaySales: 68750,
    totalOrders: 136,
    dineInOrders: 76,
    takeawayOrders: 60,
    pendingKOTs: 5,
    activeCookingKOTs: 2,
    readyKOTs: 1,
    paidBills: 130,
    paymentBreakdown: {
      cash: 23500,
      upi: 30750,
      card: 14500
    }
  },
  beach: {
    todaySales: 57200,
    totalOrders: 110,
    dineInOrders: 58,
    takeawayOrders: 52,
    pendingKOTs: 4,
    activeCookingKOTs: 2,
    readyKOTs: 1,
    paidBills: 105,
    paymentBreakdown: {
      cash: 18000,
      upi: 26000,
      card: 13200
    }
  }
};
