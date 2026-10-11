import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, BadgeCheck, BadgePercent, CalendarClock, CalendarDays,
  ChartNoAxesCombined, CircleHelp, Clock3, Globe2, Home, LayoutDashboard,
  ListOrdered, LockKeyhole, LogIn, LogOut, Menu, Package, RefreshCcw, Scissors,
  Settings2, Sparkles, Star, TrendingUp, UserPlus, UserRound, Users, WalletCards, X
} from 'lucide-react';
import { useStore, rolePath } from '../../context/StoreContext';
import { navItems, routeManifest } from '../../data';

const IconMap = {
  LayoutDashboard, CalendarDays, UserPlus, ListOrdered, Users, WalletCards,
  ReceiptText: WalletCards, UserRound, Scissors, Clock3, TrendingUp, BadgeCheck,
  Sparkles, CalendarClock, ChartNoAxesCombined, Package, BadgePercent, Settings2, Star
};

export function PublicLayout({ children }) {
  const { session, openModal, closeModal } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('home');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);

      if (location.pathname === '/') {
        const homeEl = document.getElementById('home');
        const servicesEl = document.getElementById('services');
        const reviewsEl = document.getElementById('reviews');
        const locationEl = document.getElementById('location');

        // Check if near bottom of page (Visit Us)
        const isNearBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 150);
        const currentPos = window.scrollY + 160;

        if (isNearBottom || (locationEl && currentPos >= locationEl.offsetTop)) {
          setActiveSection('location');
        } else if (reviewsEl && currentPos >= reviewsEl.offsetTop) {
          setActiveSection('reviews');
        } else if (servicesEl && currentPos >= servicesEl.offsetTop) {
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
    if (!session) {
      navigate('/booking');
      openModal('login', { targetPath: '/booking', hideClose: true });
    } else {
      navigate('/booking');
    }
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
              <button className="profile-trigger" onClick={() => navigate(rolePath(session.role))}>
                <span className="avatar avatar-sm">{session.initials}</span>
                <span className="hide-mobile">{session.name}</span>
              </button>
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
          <span>Demo frontend · No real payments</span>
        </div>
      </footer>
    </div>
  );
}

export function StaffLayout({ role, children }) {
  const { session, logout, reset } = useStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = navItems[role] || [];
  const location = useLocation();
  const title = routeManifest.find((item) => item.path === location.pathname)?.title || 'Workspace';
  const deskLabel = role === 'customer' ? 'customer portal' : `${role} desk`;
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
            <Link to="/" className="brand-lockup">
              <img src="/logo.png" alt="Biglang Gwapo Logo" className="brand-logo" />
              <span>
                <strong>Biglang Gwapo</strong>
                <small>{deskLabel}</small>
              </span>
            </Link>
          ) : (
            <div className="brand-lockup" style={{ cursor: 'default' }}>
              <img src="/logo.png" alt="Biglang Gwapo Logo" className="brand-logo" />
              <span>
                <strong>Biglang Gwapo</strong>
                <small>{deskLabel}</small>
              </span>
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
              <span className="avatar avatar-sm">{session?.initials || 'MS'}</span>
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
