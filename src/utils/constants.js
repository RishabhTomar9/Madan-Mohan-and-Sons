// Role hierarchy and permissions
export const ROLES = {
  OWNER: 'owner',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  CUSTOMER: 'customer',
};

// What each role can access
export const ROLE_PERMISSIONS = {
  [ROLES.OWNER]: [
    'dashboard', 'billing', 'invoices', 'khatabook', 'customers',
    'products', 'inventory', 'orders', 'ecommerce', 'reports',
    'notifications', 'settings', 'manage_users',
  ],
  [ROLES.MANAGER]: [
    'dashboard', 'billing', 'invoices', 'khatabook', 'customers',
    'products', 'inventory', 'orders', 'ecommerce', 'reports',
    'notifications',
  ],
  [ROLES.CASHIER]: [
    'billing', 'invoices', 'customers',
  ],
  [ROLES.CUSTOMER]: [
    'store', 'cart', 'orders', 'profile', 'khata_balance',
  ],
};

// Navigation items for each role
export const NAV_ITEMS = {
  staff: [
    { label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard', permission: 'dashboard' },
    { label: 'Billing', icon: 'Calculator', path: '/billing', permission: 'billing' },
    { label: 'Invoices', icon: 'FileText', path: '/invoices', permission: 'invoices' },
    { label: 'KhataBook', icon: 'BookOpen', path: '/khatabook', permission: 'khatabook' },
    { label: 'Customers', icon: 'Users', path: '/customers', permission: 'customers' },
    { label: 'Products', icon: 'Package', path: '/products', permission: 'products' },
    { label: 'Inventory', icon: 'Warehouse', path: '/inventory', permission: 'inventory' },
    { label: 'Orders', icon: 'ShoppingBag', path: '/orders', permission: 'orders' },
    { label: 'E-commerce', icon: 'Store', path: '/store-admin', permission: 'ecommerce' },
    { label: 'Reports', icon: 'BarChart3', path: '/reports', permission: 'reports' },
    { label: 'Notifications', icon: 'Bell', path: '/notifications', permission: 'notifications' },
    { label: 'Settings', icon: 'Settings', path: '/settings', permission: 'settings' },
  ],
  customer: [
    { label: 'Home', icon: 'Home', path: '/store' },
    { label: 'Shop', icon: 'Store', path: '/store/products' },
    { label: 'Cart', icon: 'ShoppingCart', path: '/store/cart' },
    { label: 'Orders', icon: 'Package', path: '/store/orders' },
    { label: 'Profile', icon: 'User', path: '/store/profile' },
  ],
};

// Mobile bottom nav items (subset)
export const MOBILE_NAV_STAFF = [
  { label: 'Home', icon: 'LayoutDashboard', path: '/dashboard', permission: 'dashboard' },
  { label: 'Bill', icon: 'Calculator', path: '/billing', permission: 'billing' },
  { label: 'Khata', icon: 'BookOpen', path: '/khatabook', permission: 'khatabook' },
  { label: 'More', icon: 'Menu', path: null }, // opens drawer
];

export const MOBILE_NAV_CUSTOMER = [
  { label: 'Home', icon: 'Home', path: '/store' },
  { label: 'Shop', icon: 'Store', path: '/store/products' },
  { label: 'Cart', icon: 'ShoppingCart', path: '/store/cart' },
  { label: 'Profile', icon: 'User', path: '/store/profile' },
];

// Invoice
export const INVOICE_PREFIX = 'MM';
export const CURRENCY_SYMBOL = '₹';
export const CURRENCY_CODE = 'INR';

// Tax types
export const TAX_TYPES = ['GST', 'CGST', 'SGST', 'IGST'];

// Payment methods
export const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: 'Banknote' },
  { id: 'upi', label: 'UPI', icon: 'Smartphone' },
  { id: 'card', label: 'Card', icon: 'CreditCard' },
  { id: 'bank', label: 'Bank Transfer', icon: 'Building2' },
  { id: 'credit', label: 'Credit / Khata', icon: 'BookOpen' },
];

// Product units
export const PRODUCT_UNITS = [
  'Piece', 'Kg', 'Gram', 'Litre', 'Meter', 'Box', 'Pack',
];

// Order statuses
export const ORDER_STATUSES = [
  'new', 'confirmed', 'processing', 'ready', 'shipped', 'delivered', 'cancelled', 'returned',
];

// Khata transaction types
export const KHATA_TYPES = ['CREDIT', 'DEBIT', 'PAYMENT', 'ADJUSTMENT'];

// Shop default info
export const SHOP_INFO = {
  name: 'Madan Mohan & Sons',
  tagline: 'Your Trusted Retail Partner',
};
