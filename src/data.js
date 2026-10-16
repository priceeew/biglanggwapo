export const services = [];


export const barbers = [];

export const promotions = [];

export const reviews = [];

export const customers = [];

export const appointments = [];

export const queue = [];

export const transactions = [];

export const inventory = [];

export const settings = {
  shopName: 'Biglang Gwapo Barber Shop',
  phone: '+63 917 555 0100',
  email: 'hello@biglanggwapo.demo',
  address: '180 Cutcot National Highway, Pulilan, Bulacan',
  hours: 'Mon–Sun · 9:00 AM–8:00 PM',
  slotInterval: 15,
  cancellationPolicy: 'Please cancel at least 2 hours before your appointment.',
  paymentMethods: ['Cash', 'GCash', 'Card (demo)'],
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
