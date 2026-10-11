import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './context/StoreContext';
import { PublicLayout, StaffLayout, StaffGuard, CustomerGuard } from './components/layout/Layouts';
import { AuthModal } from './components/common/AuthModal';
import { Toast } from './components/common/UIComponents';

// Public pages
import {
  HomePage,
  ServicesPage,
  BarbersPage,
  BookingPage,
  StaffAccessPage
} from './pages/public/PublicPages';
import { RegisterPage, ForgotPasswordPage } from './pages/public/AuthPages';

// Role pages
import { CustomerPage } from './pages/customer/CustomerPages';
import { ReceptionistPage } from './pages/receptionist/ReceptionistPages';
import { BarberPage } from './pages/barber/BarberPages';
import { AdminPage } from './pages/admin/AdminPages';

export function RouteRenderer() {
  const location = useLocation();
  const path = location.pathname;
  const { session } = useStore();

  if (path.startsWith('/receptionist')) {
    return (
      <StaffGuard role="receptionist">
        <StaffLayout role="receptionist">
          <ReceptionistPage path={path} />
        </StaffLayout>
      </StaffGuard>
    );
  }

  if (path.startsWith('/barber')) {
    return (
      <StaffGuard role="barber">
        <StaffLayout role="barber">
          <BarberPage path={path} />
        </StaffLayout>
      </StaffGuard>
    );
  }

  if (path.startsWith('/admin')) {
    return (
      <StaffGuard role="admin">
        <StaffLayout role="admin">
          <AdminPage path={path} />
        </StaffLayout>
      </StaffGuard>
    );
  }

  if (
    path.startsWith('/customer') ||
    ['/my-appointments', '/queue-status', '/service-history', '/reviews', '/profile'].includes(path)
  ) {
    return (
      <CustomerGuard>
        <StaffLayout role="customer">
          <CustomerPage path={path} />
        </StaffLayout>
      </CustomerGuard>
    );
  }

  if (path === '/booking') {
    return (
      <PublicLayout>
        <BookingPage />
      </PublicLayout>
    );
  }

  if (path === '/services') {
    return (
      <PublicLayout>
        <ServicesPage />
      </PublicLayout>
    );
  }

  if (path === '/barbers') {
    return (
      <PublicLayout>
        <BarbersPage />
      </PublicLayout>
    );
  }

  if (path === '/staff-access') {
    return (
      <PublicLayout>
        <StaffAccessPage />
      </PublicLayout>
    );
  }

  if (path === '/register') {
    return (
      <PublicLayout>
        <RegisterPage />
      </PublicLayout>
    );
  }

  if (path === '/forgot-password') {
    return (
      <PublicLayout>
        <ForgotPasswordPage />
      </PublicLayout>
    );
  }

  if (path === '/') {
    return (
      <PublicLayout>
        <HomePage />
      </PublicLayout>
    );
  }

  return <Navigate to="/" replace />;
}

export function AppRouter() {
  const { toast } = useStore();
  return (
    <>
      <Routes>
        <Route path="*" element={<RouteRenderer />} />
      </Routes>
      <AuthModal />
      <Toast toast={toast} />
    </>
  );
}

function App() {
  return (
    <StoreProvider>
      <AppRouter />
    </StoreProvider>
  );
}

export default App;
