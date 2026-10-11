export const services = [
  { id: 'svc-fade', name: 'Signature Fade', description: 'Clean taper, tailored finish, and a hot towel reset.', price: 420, duration: 45, category: 'Cuts', active: true },
  { id: 'svc-classic', name: 'Classic Cut', description: 'Scissor work and a timeless, easy-to-style finish.', price: 380, duration: 40, category: 'Cuts', active: true },
  { id: 'svc-beard', name: 'Beard Sculpt', description: 'Line-up, shaping, conditioning, and a crisp outline.', price: 280, duration: 25, category: 'Grooming', active: true },
  { id: 'svc-combo', name: 'The Full Ritual', description: 'Signature Fade paired with a full beard sculpt.', price: 620, duration: 70, category: 'Combos', active: true },
  { id: 'svc-kids', name: 'Junior Cut', description: 'A patient, tidy cut for our younger clients.', price: 300, duration: 35, category: 'Cuts', active: true }
];

export const barbers = [
  { id: 'bar-marco', name: 'Marco Reyes', initials: 'MR', specialty: 'Fades & texture', rating: 4.9, status: 'On shift', bio: 'Known for clean fades and low-key chair-side energy.', working: true, commissionEnabled: false },
  { id: 'bar-paolo', name: 'Paolo Santos', initials: 'PS', specialty: 'Classic cuts', rating: 4.8, status: 'On shift', bio: 'Precision scissor work with a classic barbershop finish.', working: true, commissionEnabled: false },
  { id: 'bar-nico', name: 'Nico Dela Cruz', initials: 'ND', specialty: 'Beard & grooming', rating: 4.7, status: 'Next shift 2:00 PM', bio: 'Beard shaping, hot towels, and relaxed consultations.', working: false, commissionEnabled: false }
];

export const promotions = [
  { id: 'promo-welcome', title: 'First chair, first impression', description: 'New clients enjoy 20% off their first Signature Fade.', type: 'Percentage', value: 20, validFrom: '2026-10-01', validTo: '2026-12-31', services: ['svc-fade'], active: true },
  { id: 'promo-midweek', title: 'Midweek reset', description: 'Save ₱50 on any cut every Wednesday.', type: 'Fixed', value: 50, validFrom: '2026-10-01', validTo: '2026-11-30', services: ['svc-fade', 'svc-classic', 'svc-kids'], active: true },
  { id: 'promo-old', title: 'Back-to-school ritual', description: 'A past demo offer kept for reporting history.', type: 'Fixed', value: 40, validFrom: '2026-08-01', validTo: '2026-09-15', services: ['svc-kids'], active: false }
];

export const reviews = [
  { id: 'rev-1', customer: 'Andrea Lim', initials: 'AL', barber: 'Marco Reyes', rating: 5, comment: 'The fade was sharp and the whole visit felt effortless.', date: '2026-10-08', public: true },
  { id: 'rev-2', customer: 'Jonas Villanueva', initials: 'JV', barber: 'Paolo Santos', rating: 5, comment: 'Exactly the classic cut I described. I will be back.', date: '2026-10-05', public: true },
  { id: 'rev-3', customer: 'Kyla Ramos', initials: 'KR', barber: 'Nico Dela Cruz', rating: 4, comment: 'Great beard sculpt and a very friendly consultation.', date: '2026-09-29', public: true },
  { id: 'rev-4', customer: 'Christian Dizon', initials: 'CD', barber: 'Marco Reyes', rating: 5, comment: 'Best tapers in Bulacan. Clean shop, cold drinks, and zero rush.', date: '2026-10-09', public: true },
  { id: 'rev-5', customer: 'Rafael Cruz', initials: 'RC', barber: 'Paolo Santos', rating: 5, comment: 'The hot towel shave and scissor work here is unbeatable.', date: '2026-10-06', public: true },
  { id: 'rev-6', customer: 'Dave Bautista', initials: 'DB', barber: 'Nico Dela Cruz', rating: 5, comment: 'Consistent quality every single time. My go-to barbershop in Pulilan.', date: '2026-10-03', public: true },
  { id: 'rev-7', customer: 'Mark Anthony Tan', initials: 'MT', barber: 'Marco Reyes', rating: 5, comment: 'Smooth booking system and my haircut turned out immaculate.', date: '2026-10-01', public: true },
  { id: 'rev-8', customer: 'Lorenzo Gabriel', initials: 'LG', barber: 'Paolo Santos', rating: 4, comment: 'Clean lineup and solid styling advice from Paolo. Highly recommend!', date: '2026-09-27', public: true },
  { id: 'rev-9', customer: 'Kenneth Alcantara', initials: 'KA', barber: 'Nico Dela Cruz', rating: 5, comment: 'Super accommodating crew and great ambience. Worth every peso.', date: '2026-09-24', public: true },
  { id: 'rev-10', customer: 'Gian Carlo Morales', initials: 'GM', barber: 'Marco Reyes', rating: 5, comment: 'First time here and Marco gave me the cleanest low taper fade I’ve ever had. Will definitely become a regular!', date: '2026-10-10', public: true },
  { id: 'rev-11', customer: 'Patrick De Jesus', initials: 'PJ', barber: 'Paolo Santos', rating: 5, comment: 'Top-tier scissor cut. Paolo pays extreme attention to symmetry and detail.', date: '2026-10-07', public: true },
  { id: 'rev-12', customer: 'Adrian Mercado', initials: 'AM', barber: 'Nico Dela Cruz', rating: 5, comment: 'The hot towel treatment and beard grooming package was pure relaxation. 10/10 service.', date: '2026-10-04', public: true },
  { id: 'rev-13', customer: 'Joshua Fernandez', initials: 'JF', barber: 'Marco Reyes', rating: 5, comment: 'Crisp hairline, modern styling, and very welcoming atmosphere. Biglang Gwapo never disappoints.', date: '2026-09-30', public: true },
  { id: 'rev-14', customer: 'Carl Mendoza', initials: 'CM', barber: 'Paolo Santos', rating: 5, comment: 'Quick wait time, smooth process, and my pompadour styling looks sharp.', date: '2026-09-26', public: true },
  { id: 'rev-15', customer: 'Dominic Soriano', initials: 'DS', barber: 'Nico Dela Cruz', rating: 5, comment: 'Great music, cold aircon, and expertly blended fade. Easily the best barbershop in town.', date: '2026-09-21', public: true }
];

export const customers = [
  { id: 'cust-demo', name: 'Miguel Santos', initials: 'MS', email: 'miguel@example.com', phone: '+63 917 555 0142', status: 'Active', visits: 4, lastVisit: '2026-10-04', preferences: 'Low fade, matte finish', notes: 'Prefers afternoon appointments.' },
  { id: 'cust-ana', name: 'Ana Villanueva', initials: 'AV', email: 'ana@example.com', phone: '+63 917 555 1093', status: 'Active', visits: 7, lastVisit: '2026-10-08', preferences: 'Classic scissor cut', notes: 'Usually books Paolo.' },
  { id: 'cust-jordan', name: 'Jordan Lim', initials: 'JL', email: 'jordan@example.com', phone: '+63 905 777 2230', status: 'Active', visits: 2, lastVisit: '2026-09-22', preferences: 'Beard sculpt', notes: 'Likes hot towel finish.' },
  { id: 'cust-paolo', name: 'Paolo Mendoza', initials: 'PM', email: 'paolo@example.com', phone: '+63 908 441 0871', status: 'Inactive', visits: 1, lastVisit: '2026-06-18', preferences: 'Junior Cut', notes: '' }
];

export const appointments = [
  { id: 'apt-demo', customerId: 'cust-demo', customerName: 'Miguel Santos', serviceId: 'svc-fade', serviceName: 'Signature Fade', barberId: 'bar-marco', barberName: 'Marco Reyes', date: '2026-10-12', time: '10:00 AM', duration: 45, price: 420, status: 'Pending', paymentStatus: 'Unpaid', source: 'Online', notes: 'Low fade, matte finish.' },
  { id: 'apt-ana', customerId: 'cust-ana', customerName: 'Ana Villanueva', serviceId: 'svc-classic', serviceName: 'Classic Cut', barberId: 'bar-paolo', barberName: 'Paolo Santos', date: '2026-10-12', time: '10:45 AM', duration: 40, price: 380, status: 'Confirmed', paymentStatus: 'Unpaid', source: 'Online', notes: '' },
  { id: 'apt-jordan', customerId: 'cust-jordan', customerName: 'Jordan Lim', serviceId: 'svc-beard', serviceName: 'Beard Sculpt', barberId: 'bar-nico', barberName: 'Nico Dela Cruz', date: '2026-10-11', time: '2:00 PM', duration: 25, price: 280, status: 'Completed', paymentStatus: 'Paid', source: 'Walk-in', notes: 'Hot towel finish.' },
  { id: 'apt-complete', customerId: 'cust-demo', customerName: 'Miguel Santos', serviceId: 'svc-classic', serviceName: 'Classic Cut', barberId: 'bar-paolo', barberName: 'Paolo Santos', date: '2026-10-04', time: '3:00 PM', duration: 40, price: 380, status: 'Completed', paymentStatus: 'Paid', source: 'Online', notes: '' }
];

export const queue = [
  { id: 'queue-ana', number: 'Q-014', customerId: 'cust-ana', customerName: 'Ana Villanueva', barberId: 'bar-paolo', barberName: 'Paolo Santos', serviceName: 'Classic Cut', status: 'Waiting', joinedAt: '10:12 AM', estimatedMinutes: 20, appointmentId: 'apt-ana' },
  { id: 'queue-jordan', number: 'Q-013', customerId: 'cust-jordan', customerName: 'Jordan Lim', barberId: 'bar-nico', barberName: 'Nico Dela Cruz', serviceName: 'Beard Sculpt', status: 'In Service', joinedAt: '9:50 AM', estimatedMinutes: 0, appointmentId: 'apt-jordan' }
];

export const transactions = [
  { id: 'txn-1042', appointmentId: 'apt-jordan', customerName: 'Jordan Lim', serviceName: 'Beard Sculpt', amount: 280, method: 'GCash', status: 'Paid', date: '2026-10-11', time: '2:41 PM', receipt: 'BG-20261011-1042' },
  { id: 'txn-1041', appointmentId: 'apt-complete', customerName: 'Miguel Santos', serviceName: 'Classic Cut', amount: 380, method: 'Cash', status: 'Paid', date: '2026-10-04', time: '3:49 PM', receipt: 'BG-20261004-1041' },
  { id: 'txn-1040', appointmentId: 'apt-old', customerName: 'Ana Villanueva', serviceName: 'Signature Fade', amount: 420, method: 'Cash', status: 'Paid', date: '2026-10-03', time: '5:10 PM', receipt: 'BG-20261003-1040' }
];

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
  paymentMethods: ['Cash', 'GCash', 'Card (demo)'],
  commissionTracking: false
};

export { accounts } from './globs/User';

export const staffUsers = {
  receptionist: { name: 'Bea Dizon', initials: 'BD', role: 'Receptionist' },
  barber: { name: 'Marco Reyes', initials: 'MR', role: 'Barber', barberId: 'bar-marco' },
  admin: { name: 'Leah Navarro', initials: 'LN', role: 'Admin' }
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
    { label: 'Daily Transactions', path: '/receptionist/transactions', icon: 'ReceiptText' }
  ],
  barber: [
    { label: 'Overview', path: '/barber', icon: 'LayoutDashboard' },
    { label: 'My Appointments', path: '/barber/appointments', icon: 'CalendarDays' },
    { label: 'My Queue', path: '/barber/queue', icon: 'ListOrdered' },
    { label: 'Customer Details', path: '/barber/customer-details', icon: 'UserRound' },
    { label: 'Service Session', path: '/barber/service-session', icon: 'Scissors' },
    { label: 'My Schedule', path: '/barber/schedule', icon: 'Clock3' },
    { label: 'My Performance', path: '/barber/performance', icon: 'TrendingUp' }
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
    { label: 'System Settings', path: '/admin/settings', icon: 'Settings2' }
  ]
};

export const routeManifest = [
  ['/', 'Home'], ['/services', 'Services'], ['/barbers', 'Barbers'], ['/booking', 'Booking'],
  ['/customer', 'Customer Overview'], ['/my-appointments', 'My Appointments'], ['/queue-status', 'Queue Status'], ['/service-history', 'Service History'], ['/reviews', 'Reviews & Ratings'], ['/profile', 'My Profile'],
  ['/receptionist', 'Receptionist Dashboard'], ['/receptionist/appointments', 'Appointment Management'], ['/receptionist/walk-ins', 'Walk-in Registration'], ['/receptionist/queue', 'Queue Management'], ['/receptionist/customers', 'Customer Management'], ['/receptionist/payments', 'Payment & Checkout'], ['/receptionist/transactions', 'Daily Transactions'],
  ['/barber', 'Barber Dashboard'], ['/barber/appointments', 'Barber Appointments'], ['/barber/queue', 'Barber Queue'], ['/barber/customer-details', 'Customer Details'], ['/barber/service-session', 'Service Session'], ['/barber/schedule', 'Barber Schedule'], ['/barber/performance', 'Barber Performance'],
  ['/admin', 'Admin Dashboard'], ['/admin/receptionists', 'Manage Receptionists'], ['/admin/barbers', 'Manage Barbers'], ['/admin/customers', 'Manage Customers'], ['/admin/services', 'Manage Services'], ['/admin/appointments', 'Manage Appointments'], ['/admin/schedules', 'Manage Schedules'], ['/admin/transactions', 'Manage Transactions'], ['/admin/reports', 'Reports & Analytics'], ['/admin/inventory', 'Inventory Management'], ['/admin/promotions', 'Promotions & Discounts'], ['/admin/settings', 'System Settings']
].map(([path, title]) => ({ path, title }));
