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

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '24px',
          background: '#151310',
          color: '#f5f2eb',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '480px',
            background: '#1f1b16',
            border: '1px solid #332b21',
            borderRadius: '12px',
            padding: '32px',
            textAlign: 'center'
          }}>
            <h2 style={{ fontSize: '20px', marginBottom: '8px', color: '#e5c378' }}>Something went wrong</h2>
            <p style={{ color: '#a6a39b', fontSize: '14px', lineHeight: 1.5, marginBottom: '20px' }}>
              We encountered an unexpected display error. Your session and saved data are safe.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  background: '#c5a059',
                  color: '#151310',
                  fontWeight: 600,
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Reload page
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/';
                }}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  background: 'transparent',
                  color: '#f5f2eb',
                  fontWeight: 600,
                  fontSize: '13px',
                  border: '1px solid #332b21',
                  cursor: 'pointer'
                }}
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <AppRouter />
      </StoreProvider>
    </ErrorBoundary>
  );
}

export default App;
