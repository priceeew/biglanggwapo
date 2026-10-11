# Biglang Gwapo Barber Shop

A complete React + Vite frontend demo for a fictional Philippine barbershop. This phase is frontend-only: data is mock, interactions are simulated, and passwords, email delivery, payment gateways, MongoDB, Express, and real authentication are intentionally not implemented.

## Run locally

```bash
npm install
npm run dev
```

The Vite preview listens on `http://localhost:3000`. Production validation uses:

```bash
npm run build
```

## Demo access

Open the public homepage first. **Customer Login** accepts any valid-looking email and password and creates a simulated customer session. **Staff access** is intentionally separate and offers one-click demo entry for Receptionist, Barber, and Admin. Use the role switcher only from the Staff Access page or the staff gate.

The customer demo is Miguel Santos. Receptionist is Bea Dizon, Barber is Marco Reyes, and Admin is Leah Navarro. There are no real credentials.

## Connected workflow

1. Customer signs in, selects a service, barber, date, and available time, and confirms a booking.
2. Receptionist opens Appointment Management, confirms the booking, and marks the customer arrived. The appointment enters the shared queue exactly once.
3. Barber opens My Queue / Service Session, starts the service, adds notes, and completes it.
4. Receptionist opens Payment & Checkout, selects the completed service, and records a mock Cash, GCash, or Card (demo) payment. Cash change is calculated and duplicate payment recording is prevented.
5. The service appears in customer history and demo analytics. Customer Reviews unlocks feedback for completed services.

Reset Demo Data is available in every staff sidebar and on the customer Profile page. Demo state is stored in localStorage, excluding passwords.

## Structure

- `src/App.jsx` — routes, reusable layouts, page components, dialogs, and interactions.
- `src/data.js` — shared Filipino demo data, navigation metadata, and route manifest source.
- `src/mockService.js` — local API-shaped business logic and persistence.
- `src/styles.css` — minimal classic barbershop design system and responsive rules.
- `public/manus-routes.json` — all 35 page paths for preview tooling.
- `plan.md` — implementation and design plan.

## Page coverage

| # | Page | Route |
|---:|---|---|
| 1 | Home | `/` |
| 2 | Services | `/services` |
| 3 | Barbers | `/barbers` |
| 4 | Booking | `/booking` |
| 5 | My Appointments | `/my-appointments` |
| 6 | Queue Status | `/queue-status` |
| 7 | Service History | `/service-history` |
| 8 | Reviews & Ratings | `/reviews` |
| 9 | Profile | `/profile` |
| 10–16 | Receptionist Dashboard, Appointment Management, Walk-in Registration, Queue Management, Customer Management, Payment & Checkout, Daily Transactions | `/receptionist/*` |
| 17–23 | Barber Dashboard, My Appointments, My Queue, Customer Details, Service Session, My Schedule, My Performance | `/barber/*` |
| 24–35 | Admin Dashboard, Manage Receptionists, Manage Barbers, Manage Customers, Manage Services, Manage Appointments, Manage Schedules, Manage Transactions, Reports & Analytics, Inventory, Promotions & Discounts, System Settings | `/admin/*` |

The supplied upload did not include a separate logo file, so the UI uses an easy-to-replace typographic BG mark without inventing or recoloring an asset.
