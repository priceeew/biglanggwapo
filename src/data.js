export const services = [];


export const barbers = [];

export const promotions = [
  { id: 'promo-welcome', code: 'WELCOME20', title: 'First chair, first impression', description: 'New clients enjoy 20% off their first Signature Fade.', type: 'Percentage', value: 20, validFrom: '2026-10-01', validTo: '2026-12-31', services: ['svc-fade'], active: true },
  { id: 'promo-midweek', code: 'MIDWEEK50', title: 'Midweek reset', description: 'Save ₱50 on any cut every Wednesday.', type: 'Fixed', value: 50, validFrom: '2026-10-01', validTo: '2026-11-30', services: ['svc-fade', 'svc-classic', 'svc-kids'], active: true }
];

export const reviews = [];

export const customers = [];

export const appointments = [];

export const queue = [];

export const transactions = [];

export const inventory = [
  // Products for Sale (Retail - binebenta sa shop)
  { id: 'inv-prod-1', name: 'Matte Clay (Strong Hold)', category: 'Products for Sale', stock: 12, unit: 'jars', threshold: 5, cost: 180, notes: 'Matte finish with pliable hold.' },
  { id: 'inv-prod-2', name: 'Beard Oil & Conditioner', category: 'Products for Sale', stock: 3, unit: 'bottles', threshold: 5, cost: 220, notes: 'Argan oil blend with cedar scent.' },
  { id: 'inv-prod-3', name: 'Water-Based Pomade (High Shine)', category: 'Products for Sale', stock: 16, unit: 'cans', threshold: 6, cost: 260, notes: 'Easy rinse, classic sleek finish.' },
  { id: 'inv-prod-4', name: 'Sea Salt Texture Spray', category: 'Products for Sale', stock: 9, unit: 'bottles', threshold: 4, cost: 290, notes: 'Adds volume and beachy texture.' },
  { id: 'inv-prod-5', name: 'Menthol Aftershave Splash', category: 'Products for Sale', stock: 7, unit: 'bottles', threshold: 3, cost: 210, notes: 'Cooling post-shave skin calm.' },

  // Barber Tools
  { id: 'inv-tool-1', name: 'Wahl Cordless Senior Clipper', category: 'Barber Tools', stock: 4, unit: 'units', threshold: 2, cost: 4500, notes: 'Rotary motor with precision fade blade.' },
  { id: 'inv-tool-2', name: 'Detailer Li Trimmer', category: 'Barber Tools', stock: 3, unit: 'units', threshold: 2, cost: 3200, notes: 'T-wide blade for crisp line-ups.' },
  { id: 'inv-tool-3', name: 'Japanese 6.0" Steel Shears', category: 'Barber Tools', stock: 5, unit: 'pairs', threshold: 2, cost: 2800, notes: 'Convex edge for wet & dry cutting.' },
  { id: 'inv-tool-4', name: 'Professional Ionic Hair Dryer', category: 'Barber Tools', stock: 3, unit: 'units', threshold: 1, cost: 2200, notes: 'Quick drying with cold shot button.' },
  { id: 'inv-tool-5', name: 'Hypoallergenic Foil Shaver', category: 'Barber Tools', stock: 2, unit: 'units', threshold: 1, cost: 2400, notes: 'Zero-gap finish for clean necklines.' },

  // Shop Furniture
  { id: 'inv-furn-1', name: 'Vintage Hydraulic Barber Chair', category: 'Shop Furniture', stock: 4, unit: 'units', threshold: 1, cost: 16500, notes: 'Reclining heavy-duty cast iron base.' },
  { id: 'inv-furn-2', name: 'Styling Station Mirror w/ LED', category: 'Shop Furniture', stock: 4, unit: 'units', threshold: 1, cost: 8000, notes: 'Warm lighting and integrated socket.' },
  { id: 'inv-furn-3', name: 'Waiting Area Chesterfield Leather Sofa', category: 'Shop Furniture', stock: 2, unit: 'units', threshold: 1, cost: 12500, notes: 'Deep tufted black leather finish.' },
  { id: 'inv-furn-4', name: 'Ceramic Shampoo Backwash Basin', category: 'Shop Furniture', stock: 2, unit: 'units', threshold: 1, cost: 9500, notes: 'Tilting ceramic bowl with silicone neck rest.' },
  { id: 'inv-furn-5', name: 'Stainless 4-Tier Barber Trolley', category: 'Shop Furniture', stock: 4, unit: 'units', threshold: 1, cost: 3200, notes: 'Lockable wheels and heat-resistant top.' },

  // Accessories
  { id: 'inv-acc-1', name: 'Barber Cutting Cape (Gold Logo)', category: 'Accessories', stock: 15, unit: 'pcs', threshold: 5, cost: 350, notes: 'Static-free water-resistant fabric.' },
  { id: 'inv-acc-2', name: 'Leather Barber Work Apron', category: 'Accessories', stock: 6, unit: 'pcs', threshold: 2, cost: 850, notes: 'Cross-back straps with tool pockets.' },
  { id: 'inv-acc-3', name: 'Soft Horsehair Neck Duster', category: 'Accessories', stock: 6, unit: 'pcs', threshold: 2, cost: 220, notes: 'Comfort stand-up base.' },
  { id: 'inv-acc-4', name: 'Continuous Ultra-Fine Mist Spray', category: 'Accessories', stock: 8, unit: 'pcs', threshold: 3, cost: 180, notes: '300ml 360-degree spray trigger.' },
  { id: 'inv-acc-5', name: 'Glass Barbicide Disinfectant Jar', category: 'Accessories', stock: 4, unit: 'jars', threshold: 2, cost: 480, notes: 'Stainless steel basket for sanitation.' },

  // Consumables & Supplies
  { id: 'inv-con-1', name: 'Disposable Neck Strips (5 Rolls)', category: 'Consumable', stock: 42, unit: 'packs', threshold: 15, cost: 65, notes: 'Self-adhesive flexible paper.' },
  { id: 'inv-con-2', name: 'Hot Towel Laundry Bundles', category: 'Consumable', stock: 18, unit: 'bundles', threshold: 10, cost: 120, notes: 'Freshly laundered 10-pack towels.' },
  { id: 'inv-con-3', name: 'Double Edge Razor Blades (100s)', category: 'Consumable', stock: 28, unit: 'boxes', threshold: 10, cost: 95, notes: 'Platinum-coated disposable blades.' }
];

export const settings = {
  shopName: 'Biglang Gwapo Barber Shop',
  phone: '+63 917 555 0100',
  email: 'hello@biglanggwapo.demo',
  address: '180 Cutcot National Highway, Pulilan, Bulacan',
  hours: 'Mon–Sun · 9:00 AM–8:00 PM',
  slotInterval: 15,
  cancellationPolicy: 'Please cancel at least 2 hours before your appointment.',
  paymentMethods: ['Cash', 'GCash', 'Card only'],
  commissionTracking: false
};

export const receptionists = [];

export { accounts, saveAccount, deleteAccount, getAccounts, syncAccountsFromAtlas, applyAccounts, revokeSession, validatePassword, validatePhone } from './globs/User';

export const staffUsers = {
  admin: { name: 'Admin Desk', initials: 'AD', role: 'Admin' }
};

export const navItems = {
  customer: [
    { label: 'Overview', path: '/customer', icon: 'LayoutDashboard' },
    { label: 'Book a Chair', path: '/booking', icon: 'Scissors' },
    { label: 'My Appointments', path: '/my-appointments', icon: 'CalendarDays' },
    { label: 'Queue Status', path: '/queue-status', icon: 'ListOrdered' },
    { label: 'Service History', path: '/service-history', icon: 'ReceiptText' },
    { label: 'Reviews & Ratings', path: '/reviews', icon: 'Star' },
    { label: 'My Profile', path: '/profile', icon: 'UserRound' }
  ],
  receptionist: [
    { label: 'Overview', path: '/receptionist', icon: 'LayoutDashboard' },
    { label: 'Appointments', path: '/receptionist/appointments', icon: 'CalendarDays' },
    { label: 'Walk-in Registration', path: '/receptionist/walk-ins', icon: 'UserPlus' },
    { label: 'Queue Management', path: '/receptionist/queue', icon: 'ListOrdered' },
    { label: 'Customers', path: '/receptionist/customers', icon: 'Users' },
    { label: 'Payment & Checkout', path: '/receptionist/payments', icon: 'WalletCards' },
    { label: 'Products & Retail', path: '/receptionist/products', icon: 'ShoppingBag' },
    { label: 'Customer Reviews', path: '/receptionist/reviews', icon: 'Star' },
    { label: 'Daily Transactions', path: '/receptionist/transactions', icon: 'ReceiptText' },
    { label: 'My Profile', path: '/receptionist/profile', icon: 'UserRound' }
  ],
  barber: [
    { label: 'Overview', path: '/barber', icon: 'LayoutDashboard' },
    { label: 'My Appointments', path: '/barber/appointments', icon: 'CalendarDays' },
    { label: 'My Queue', path: '/barber/queue', icon: 'ListOrdered' },
    { label: 'Customer Details', path: '/barber/customer-details', icon: 'UserRound' },
    { label: 'Service Session', path: '/barber/service-session', icon: 'Scissors' },
    { label: 'Customer Reviews', path: '/barber/reviews', icon: 'Star' },
    { label: 'My Schedule', path: '/barber/schedule', icon: 'Clock3' },
    { label: 'My Performance', path: '/barber/performance', icon: 'TrendingUp' },
    { label: 'My Profile', path: '/barber/profile', icon: 'UserRound' }
  ],
  admin: [
    { label: 'Overview', path: '/admin', icon: 'LayoutDashboard' },
    { label: 'Receptionists', path: '/admin/receptionists', icon: 'BadgeCheck' },
    { label: 'Barbers', path: '/admin/barbers', icon: 'Scissors' },
    { label: 'Customers', path: '/admin/customers', icon: 'Users' },
    { label: 'Services', path: '/admin/services', icon: 'Sparkles' },
    { label: 'Appointments', path: '/admin/appointments', icon: 'CalendarDays' },
    { label: 'Schedules', path: '/admin/schedules', icon: 'CalendarClock' },
    { label: 'Transactions', path: '/admin/transactions', icon: 'ReceiptText' },
    { label: 'Reports & Analytics', path: '/admin/reports', icon: 'ChartNoAxesCombined' },
    { label: 'Inventory', path: '/admin/inventory', icon: 'Package' },
    { label: 'Promotions & Discounts', path: '/admin/promotions', icon: 'BadgePercent' },
    { label: 'Customer Reviews', path: '/admin/reviews', icon: 'Star' },
    { label: 'System Settings', path: '/admin/settings', icon: 'Settings2' }
  ]
};

export const routeManifest = [
  ['/', 'Home'], ['/services', 'Services'], ['/barbers', 'Barbers'], ['/booking', 'Booking'],
  ['/customer', 'Customer Overview'], ['/my-appointments', 'My Appointments'], ['/queue-status', 'Queue Status'], ['/service-history', 'Service History'], ['/reviews', 'Reviews & Ratings'], ['/profile', 'My Profile'],
  ['/receptionist', 'Receptionist Dashboard'], ['/receptionist/appointments', 'Appointment Management'], ['/receptionist/walk-ins', 'Walk-in Registration'], ['/receptionist/queue', 'Queue Management'], ['/receptionist/customers', 'Customer Management'], ['/receptionist/payments', 'Payment & Checkout'], ['/receptionist/products', 'Products & Retail'], ['/receptionist/reviews', 'Customer Reviews'], ['/receptionist/transactions', 'Daily Transactions'], ['/receptionist/profile', 'Receptionist Profile & Settings'],
  ['/barber', 'Barber Dashboard'], ['/barber/appointments', 'Barber Appointments'], ['/barber/queue', 'Barber Queue'], ['/barber/customer-details', 'Customer Details'], ['/barber/service-session', 'Service Session'], ['/barber/reviews', 'Barber Reviews'], ['/barber/schedule', 'Barber Schedule'], ['/barber/performance', 'Barber Performance'], ['/barber/profile', 'Barber Profile & Settings'],
  ['/admin', 'Admin Dashboard'], ['/admin/receptionists', 'Manage Receptionists'], ['/admin/barbers', 'Manage Barbers'], ['/admin/customers', 'Manage Customers'], ['/admin/services', 'Manage Services'], ['/admin/appointments', 'Manage Appointments'], ['/admin/schedules', 'Manage Schedules'], ['/admin/transactions', 'Manage Transactions'], ['/admin/reports', 'Reports & Analytics'], ['/admin/inventory', 'Inventory Management'], ['/admin/promotions', 'Promotions & Discounts'], ['/admin/reviews', 'Customer Reviews'], ['/admin/settings', 'System Settings']
].map(([path, title]) => ({ path, title }));
