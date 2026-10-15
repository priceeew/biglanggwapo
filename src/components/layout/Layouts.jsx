import React, { useEffect, useState, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, BadgeCheck, BadgePercent, CalendarClock, CalendarDays,
  ChartNoAxesCombined, ChevronDown, CircleHelp, Clock3, Globe2, Home, LayoutDashboard,
  ListOrdered, LockKeyhole, LogIn, LogOut, Menu, Package, RefreshCcw, Scissors,
  Settings2, Sparkles, Star, TrendingUp, UserCheck, UserPlus, UserRound, Users, WalletCards, X
} from 'lucide-react';
import { useStore, rolePath } from '../../context/StoreContext';
import { navItems, routeManifest } from '../../data';

const IconMap = {
  LayoutDashboard, CalendarDays, UserPlus, ListOrdered, Users, WalletCards,
  ReceiptText: WalletCards, UserRound, Scissors, Clock3, TrendingUp, BadgeCheck,
  Sparkles, CalendarClock, ChartNoAxesCombined, Package, BadgePercent, Settings2, Star
};

const SCROLL_OFFSETS = {
  home: 0,
  services: 300,
  reviews: 250,
  location: 200,
};

export function PublicLayout({ children }) {
  const { session, logout, openModal, closeModal } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('home');
  const [scrolled, setScrolled] = useState(false);
  const [customerMenuOpen, setCustomerMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setCustomerMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);

      if (location.pathname === '/') {
        const servicesEl = document.getElementById('services');
        const reviewsEl = document.getElementById('reviews');
        const locationEl = document.getElementById('location');

        const isNearBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 150);

        if (isNearBottom || (locationEl && window.scrollY + SCROLL_OFFSETS.location >= locationEl.offsetTop)) {
          setActiveSection('location');
        } else if (reviewsEl && window.scrollY + SCROLL_OFFSETS.reviews >= reviewsEl.offsetTop) {
          setActiveSection('reviews');
        } else if (servicesEl && window.scrollY + SCROLL_OFFSETS.services >= servicesEl.offsetTop) {
          setActiveSection('services');
        } else {
          setActiveSection('home');
        }
      } else if (location.pathname === '/booking') {
        setActiveSection('appointment');
      } else {
        setActiveSection('');
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  const scrollToSection = (sectionId) => {
    closeModal();
    setCustomerMenuOpen(false);

    const sectionKey = {
      home: 'home',
      services: 'services',
      reviews: 'reviews',
      location: 'location',
    }[sectionId];
    if (sectionKey) setActiveSection(sectionKey);

    if (location.pathname !== '/') {
      navigate('/#' + sectionId);
      setTimeout(() => {
        const target = document.getElementById(sectionId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const target = document.getElementById(sectionId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleAppointmentClick = () => {
    setCustomerMenuOpen(false);
    navigate('/booking');
  };

  return (
    <div className="public-app">
      <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="site-header-inner">
          <Link to="/" onClick={() => scrollToSection('home')} className="brand-lockup" aria-label="Biglang Gwapo home">
            <img src="/logo.png" alt="Biglang Gwapo Logo" className="brand-logo" />
            <span><strong>Biglang Gwapo</strong><small>BARBER SHOP</small></span>
          </Link>

          <nav className="desktop-nav" aria-label="Primary navigation">
            <button
              type="button"
              className={`nav-link-btn ${activeSection === 'home' && location.pathname === '/' ? 'active' : ''}`}
              onClick={() => scrollToSection('home')}
            >
              Home
            </button>
            <button
              type="button"
              className={`nav-link-btn ${activeSection === 'services' && location.pathname === '/' ? 'active' : ''}`}
              onClick={() => scrollToSection('services')}
            >
              Service
            </button>
            <button
              type="button"
              className={`nav-link-btn ${activeSection === 'reviews' && location.pathname === '/' ? 'active' : ''}`}
              onClick={() => scrollToSection('reviews')}
            >
              Reviews
            </button>
            <button
              type="button"
              className={`nav-link-btn ${activeSection === 'location' && location.pathname === '/' ? 'active' : ''}`}
              onClick={() => scrollToSection('location')}
            >
              Visit us
            </button>
            <button
              type="button"
              className={`nav-link-btn ${location.pathname === '/booking' || activeSection === 'appointment' ? 'active' : ''}`}
              onClick={handleAppointmentClick}
            >
              Appointment
            </button>

            {session ? (
              <div className="nav-profile-wrapper" ref={dropdownRef}>
                <button
                  type="button"
                  className="profile-trigger"
                  onClick={() => navigate(rolePath(session.role))}
                >
                  {session.role === 'admin' ? (
                    <img src="/logo.png" alt="Admin" className="brand-logo avatar-sm" style={{ width: 34, height: 34 }} />
                  ) : session.photoUrl ? (
                    <img src={session.photoUrl} alt={session.name || 'User'} className="brand-logo avatar-sm" style={{ width: 34, height: 34 }} />
                  ) : (
                    <span className="avatar avatar-sm">{session?.initials || (session?.name ? session.name.slice(0, 2).toUpperCase() : 'BG')}</span>
                  )}
                  <span className="hide-mobile">{session?.name || 'Account'}</span>
                </button>

                {session.role === 'customer' && (
                  <>
                    <button
                      type="button"
                      className="nav-dropdown-toggle"
                      onClick={() => setCustomerMenuOpen((prev) => !prev)}
                      aria-label="Toggle customer panel menu"
                      aria-expanded={customerMenuOpen}
                    >
                      <ChevronDown size={14} className={customerMenuOpen ? 'rotated' : ''} />
                    </button>

                    {customerMenuOpen && (
                      <div className="customer-dropdown-menu">
                        <div className="dropdown-header">
                          <strong>{session.name}</strong>
                          <small>Customer Account</small>
                        </div>
                        <div className="dropdown-divider" />
                        <Link
                          to="/customer"
                          className="dropdown-item"
                          onClick={() => setCustomerMenuOpen(false)}
                        >
                          <LayoutDashboard size={14} /> Customer Overview
                        </Link>
                        <Link
                          to="/my-appointments"
                          className="dropdown-item"
                          onClick={() => setCustomerMenuOpen(false)}
                        >
                          <CalendarDays size={14} /> My Appointments
                        </Link>
                        <Link
                          to="/booking"
                          className="dropdown-item"
                          onClick={() => setCustomerMenuOpen(false)}
                        >
                          <Scissors size={14} /> Book a Chair
                        </Link>
                        <Link
                          to="/customer-profile"
                          className="dropdown-item"
                          onClick={() => setCustomerMenuOpen(false)}
                        >
                          <Settings2 size={14} /> Profile & Settings
                        </Link>
                        <div className="dropdown-divider" />
                        <button
                          type="button"
                          className="dropdown-item logout"
                          onClick={() => {
                            setCustomerMenuOpen(false);
                            logout();
                            navigate('/');
                          }}
                        >
                          <LogOut size={14} /> Sign out
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="button button-ghost button-small nav-login-btn"
                onClick={() => openModal('login')}
              >
                <LogIn size={15} /> Login
              </button>
            )}
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <div className="footer-brand">
          <img src="/logo.png" alt="Biglang Gwapo Logo" className="brand-logo" />
          <div>
            <strong>Biglang Gwapo Barber Shop</strong>
            <p>Sharp cuts. Easy booking.</p>
          </div>
        </div>
        <div className="footer-meta">
          <span>180 Cutcot National Highway, Pulilan, Bulacan</span>
          <span>Open daily · 9:00 AM–8:00 PM</span>
          <span>© 2026 Biglang Gwapo Barbershop · All rights reserved</span>
        </div>
        {session?.role !== 'customer' && (
          <div className="footer-staff-action">
            <button
              type="button"
              className="footer-employee-link"
              onClick={() => openModal('employeeLogin')}
            >
              <LockKeyhole size={13} /> Staff & Employee Portal
            </button>
          </div>
        )}
      </footer>
    </div>
  );
}

export function StaffLayout({ role, children }) {
  const { session, logout } = useStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = navItems[role] || [];
  const location = useLocation();
  const title = routeManifest.find((item) => item.path === location.pathname)?.title || 'Workspace';
  const deskLabel = role === 'customer' ? 'customer portal' : role === 'receptionist' ? 'reception desk' : `${role} desk`;
  const workspaceEyebrow = role === 'customer' ? 'customer workspace' : `${role} workspace`;

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="staff-app">
      <aside className={`staff-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-top">
          {role === 'customer' ? (
            <Link to="/" className="brand-lockup workspace-brand-lockup" aria-label="Biglang Gwapo workspace home">
              <img src="/logo.png" alt="Biglang Gwapo Logo" className="brand-logo" />
              <div className="workspace-brand-text">
                <strong>Biglang Gwapo</strong>
                <small>{deskLabel}</small>
              </div>
            </Link>
          ) : (
            <div className="brand-lockup workspace-brand-lockup" style={{ cursor: 'default' }}>
              <img src="/logo.png" alt="Biglang Gwapo Logo" className="brand-logo" />
              <div className="workspace-brand-text">
                <strong>Biglang Gwapo</strong>
                <small>{deskLabel}</small>
              </div>
            </div>
          )}
          <button className="icon-button mobile-only" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>
        <div className="sidebar-label">{role === 'customer' ? 'Customer panel' : 'Workspace'}</div>
        <nav className="staff-nav">
          {role === 'customer' && (
            <Link to="/" className="staff-nav-link" onClick={() => setMobileOpen(false)}>
              <Home size={17} />
              <span>Home</span>
            </Link>
          )}
          {items.map((item) => {
            const ItemIcon = IconMap[item.icon] || LayoutDashboard;
            return (
              <NavLink
                end={item.path === `/${role}` || item.path === '/customer' || item.path === '/my-appointments' || item.path === '/booking'}
                to={item.path}
                key={item.path}
                onClick={() => setMobileOpen(false)}
              >
                <ItemIcon size={17} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <button className="staff-nav-link" onClick={handleSignOut}>
            <LogOut size={17} /> Sign out
          </button>
        </div>
      </aside>
      {mobileOpen && (
        <button className="sidebar-overlay mobile-only" onClick={() => setMobileOpen(false)} aria-label="Close menu" />
      )}
      <div className="staff-main">
        <header className="staff-topbar">
          <button className="icon-button mobile-only" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
            <Menu size={20} />
          </button>
          <div>
            <span className="eyebrow">{workspaceEyebrow}</span>
            <h1>{title}</h1>
          </div>
          <div className="staff-top-actions">
            <button className="icon-button" title="Help">
              <CircleHelp size={18} />
            </button>
            <div className="staff-user">
              {session?.role === 'admin' ? (
                <img src="/logo.png" alt="Biglang Gwapo Logo" className="brand-logo avatar-sm" style={{ width: 34, height: 34 }} />
              ) : session?.photoUrl ? (
                <img src={session.photoUrl} alt={session.name} className="brand-logo avatar-sm" style={{ width: 34, height: 34 }} />
              ) : (
                <span className="avatar avatar-sm">{session?.initials || 'MS'}</span>
              )}
              <span className="hide-mobile">
                <strong>{session?.name || 'Customer'}</strong>
                <small>{session?.role || 'Customer'}</small>
              </span>
            </div>
          </div>
        </header>
        <main className="staff-content">{children}</main>
      </div>
    </div>
  );
}

export function CustomerLayout({ children }) {
  return <StaffLayout role="customer">{children}</StaffLayout>;
}

export function StaffGuard({ role, children }) {
  const { session, openModal } = useStore();
  if (!session || session.role !== role) {
    return <AccessGate role={role} onOpen={() => openModal('staff', { requestedRole: role })} />;
  }
  return children;
}

export function CustomerGuard({ children }) {
  const { session, openModal } = useStore();
  if (!session || session.role !== 'customer') {
    return <AccessGate role="customer" onOpen={() => openModal('login', { targetPath: window.location.pathname })} />;
  }
  return children;
}

export function AccessGate({ role, onOpen }) {
  const roleName = role === 'customer' ? 'your customer account' : `${role} panel`;
  return (
    <PublicLayout>
      <section className="access-gate content-width">
        <div className="eyebrow"><LockKeyhole size={14} /> Account access</div>
        <h1>Sign in to open {roleName}.</h1>
        <p>Please enter your account email and password to access this panel.</p>
        <button className="button button-dark" onClick={onOpen}>
          {role === 'customer' ? 'Customer login' : `${role.charAt(0).toUpperCase() + role.slice(1)} login`} <ArrowRight size={17} />
        </button>
        <Link className="button button-ghost" to="/">Back to public home</Link>
      </section>
    </PublicLayout>
  );
}