# Biglang Gwapo Barbershop Management System

A web-based barbershop operations and online appointment scheduling system for **Biglang Gwapo Barbershop** (Pulilan, Bulacan).

Built using **React**, **Vite**, **React Router**, and **Vanilla CSS**.

---

## Features & Modules

### 1. Public & Customer Portal
- **Service Catalog**: Browse cuts, beard trims, and grooming packages with real-time pricing and duration.
- **Barber Profiles**: View barber specialties, ratings, and shifts (Marco Reyes, Paolo Santos, Nico Dela Cruz).
- **Online Booking**: Multi-step booking flow with date, barber, and slot selection.
- **Queue Status**: Live monitoring of waiting list and chair status.
- **Customer Account**: Profile management, past service history, and review submission.

### 2. Receptionist Desk (`/receptionist`)
- **Appointment Management**: View and confirm incoming bookings.
- **Walk-in Queue**: Fast registration of walk-in clients with queue ticket assignment.
- **Checkout & Payments**: Record cash, GCash, or card payments with automatic change computation and receipt generation.

### 3. Barber Station (`/barber`)
- **Queue Overview**: Live list of customers waiting for each barber chair.
- **Service Session**: Active chair management with service timer, checklist, and hair notes.
- **Barber Schedule & Performance**: Personal calendar and client metrics.

### 4. Admin Management (`/admin`)
- **Operations Dashboard**: Summary metrics for revenue, bookings, queue, and staff.
- **Categorized Inventory & Asset Management**: Separate management for:
  - Products for Sale (Retail pomades, clays, oils)
  - Barber Tools (Clippers, trimmers, shears)
  - Shop Furniture (Chairs, mirrors, sofas)
  - Accessories (Capes, aprons, dusters)
  - Consumables (Neck strips, towels, blades)
- **Staff & Services**: Manage barber accounts, receptionists, menu pricing, and working schedules.
- **Promotions & Discounts**: Manage shop offers featured on the homepage.
- **Reports & Analytics**: Daily sales, payment breakdowns, and service trends.

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation & Run

```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

The application runs locally at `http://localhost:3000`.

### Build for Production

```bash
npm run build
```

---

## Project Structure

```
biglanggwapo/
├── public/               # Static assets & barbershop logo
├── src/
│   ├── components/       # Common UI elements & layout wrappers
│   ├── context/          # Global store & state management
│   ├── pages/            # Role-based page views (Customer, Barber, Receptionist, Admin)
│   ├── data.js           # Shop data, initial inventory, services & staff
│   ├── mockService.js    # Data layer & localStorage persistence
│   ├── styles.css        # Responsive styling & design tokens
│   ├── App.jsx           # Main router & app container
│   └── main.jsx          # Entry point
├── index.html            # HTML shell with barbershop branding
├── package.json          # Project configuration & dependencies
└── vite.config.js        # Vite build configuration
```
