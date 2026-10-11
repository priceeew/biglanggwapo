import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, BadgeCheck, BadgePercent, CalendarClock, CalendarDays, Check, CheckCircle2, ChevronDown,
  ChevronLeft, ChevronRight, CircleHelp, Clock3, Copy, Download, ExternalLink, Eye, EyeOff, FileText, Filter,
  Globe2, LayoutDashboard, ListOrdered, LockKeyhole, LogIn, LogOut, Menu, MoreHorizontal, Package, Pencil,
  Plus, ReceiptText, RefreshCcw, Scissors, Search, Send, Settings2, ShieldCheck, ShoppingBag, Sparkles, Star,
  Tag, TrendingUp, UserPlus, UserRound, Users, WalletCards, X, Zap, ChartNoAxesCombined,
  AlertTriangle, Layers, Trash2
} from 'lucide-react';
import { accounts, barbers, customers, navItems, promotions, reviews, routeManifest, services, staffUsers } from './data';
import { demoApi, loadDemoState, persistDemoState, resetDemoState } from './mockService';

const StoreContext = createContext(null);
const IconMap = { LayoutDashboard, CalendarDays, UserPlus, ListOrdered, Users, WalletCards, ReceiptText, UserRound, Scissors, Clock3, TrendingUp, BadgeCheck, Sparkles, CalendarClock, ChartNoAxesCombined, Package, BadgePercent, Settings2, Star };
const currency = (value) => `₱${Number(value || 0).toLocaleString('en-PH')}`;
const today = '2026-10-12';
const humanDate = (value) => value === today ? 'Today' : new Date(`${value}T00:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
const stars = (rating) => '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
const rolePath = (role) => role === 'customer' ? '/customer' : `/${role}`;

function StoreProvider({ children }) {
  const [demo, setDemo] = useState(loadDemoState);
  const [session, setSession] = useState(() => {
    try { return JSON.parse(window.localStorage.getItem('biglanggwapo-session') || 'null'); } catch { return null; }
  });
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const notify = (message, tone = 'success') => { setToast({ message, tone }); window.setTimeout(() => setToast(null), 3200); };
  const commit = (recipe) => setDemo((prev) => { const next = typeof recipe === 'function' ? recipe(prev) : recipe; persistDemoState(next); return next; });
  const login = (nextSession) => { setSession(nextSession); window.localStorage.setItem('biglanggwapo-session', JSON.stringify(nextSession)); setModal(null); notify(`Signed in as ${nextSession.name}.`); };
  const logout = () => { setSession(null); window.localStorage.removeItem('biglanggwapo-session'); notify('You have been signed out.'); };
  const reset = () => { commit(resetDemoState()); notify('Demo data has been reset.'); };
  const openModal = (type, options = {}) => setModal({ type, ...options });
  const value = { demo, session, modal, toast, notify, commit, login, logout, reset, openModal, closeModal: () => setModal(null) };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

function useStore() { return useContext(StoreContext); }

function App() {
  return <StoreProvider><AppRouter /></StoreProvider>;
}

function AppRouter() {
  return <><Routes><Route path="*" element={<RouteRenderer />} /></Routes><AuthModal /><Toast /></>;
}

function RouteRenderer() {
  const location = useLocation();
  const path = location.pathname;
  const { session } = useStore();
  if (path.startsWith('/receptionist')) return <StaffGuard role="receptionist"><StaffLayout role="receptionist"><ReceptionistPage path={path} /></StaffLayout></StaffGuard>;
  if (path.startsWith('/barber')) return <StaffGuard role="barber"><StaffLayout role="barber"><BarberPage path={path} /></StaffLayout></StaffGuard>;
  if (path.startsWith('/admin')) return <StaffGuard role="admin"><StaffLayout role="admin"><AdminPage path={path} /></StaffLayout></StaffGuard>;
  if (path.startsWith('/customer') || ['/my-appointments', '/queue-status', '/service-history', '/reviews', '/profile'].includes(path) || (path === '/booking' && session?.role === 'customer')) return <CustomerGuard><StaffLayout role="customer"><CustomerPage path={path} /></StaffLayout></CustomerGuard>;
  if (path === '/booking') return <PublicLayout><BookingPage /></PublicLayout>;
  if (path === '/services') return <PublicLayout><ServicesPage /></PublicLayout>;
  if (path === '/barbers') return <PublicLayout><BarbersPage /></PublicLayout>;
  if (path === '/staff-access') return <PublicLayout><StaffAccessPage /></PublicLayout>;
  if (path === '/') return <PublicLayout><HomePage /></PublicLayout>;
  return <Navigate to="/" replace />;
}

function PublicLayout({ children }) {
  const { session, openModal, logout } = useStore();
  const navigate = useNavigate();
  return <div className="public-app">
    <header className="site-header">
      <Link to="/" className="brand-lockup" aria-label="Biglang Gwapo home"><img src="/logo.png" alt="Biglang Gwapo Logo" className="brand-logo" /><span><strong>Biglang Gwapo</strong><small>BARBER SHOP</small></span></Link>
      <nav className="desktop-nav" aria-label="Primary navigation">
        <NavLink to="/services">Services</NavLink><NavLink to="/barbers">Barbers</NavLink><a href="#reviews">Reviews</a><a href="#location">Visit us</a>
      </nav>
      <div className="header-actions"><Link to="/staff-access" className="staff-link">Staff access</Link>{session ? <button className="profile-trigger" onClick={() => navigate(rolePath(session.role))}><span className="avatar avatar-sm">{session.initials}</span><span className="hide-mobile">{session.name}</span></button> : <button className="button button-ghost button-small" onClick={() => openModal('login')}><LogIn size={16} /> Login</button>}<Link className="button button-dark button-small" to="/booking">Book now <ArrowUpRight size={16} /></Link></div>
    </header>
    <main>{children}</main>
    <footer className="site-footer"><div className="footer-brand"><img src="/logo.png" alt="Biglang Gwapo Logo" className="brand-logo" /><div><strong>Biglang Gwapo Barber Shop</strong><p>Sharp cuts. Easy booking.</p></div></div><div className="footer-meta"><span>180 Cutcot National Highway, Pulilan, Bulacan</span><span>Open daily · 9:00 AM–8:00 PM</span><span>Demo frontend · No real payments</span></div></footer>
  </div>;
}

function CustomerLayout({ children }) {
  return <StaffLayout role="customer">{children}</StaffLayout>;
}

function StaffGuard({ role, children }) {
  const { session, openModal } = useStore();
  if (!session || session.role !== role) return <AccessGate role={role} onOpen={() => openModal('staff', { requestedRole: role })} />;
  return children;
}

function CustomerGuard({ children }) {
  const { session, openModal } = useStore();
  if (!session || session.role !== 'customer') return <AccessGate role="customer" onOpen={() => openModal('login', { targetPath: window.location.pathname })} />;
  return children;
}

function AccessGate({ role, onOpen }) {
  const roleName = role === 'customer' ? 'your customer account' : `${role} panel`;
  return <PublicLayout><section className="access-gate content-width"><div className="eyebrow"><LockKeyhole size={14} /> Account access</div><h1>Sign in to open {roleName}.</h1><p>Please enter your account email and password to access this panel.</p><button className="button button-dark" onClick={onOpen}>{role === 'customer' ? 'Customer login' : `${role.charAt(0).toUpperCase() + role.slice(1)} login`} <ArrowRight size={17} /></button><Link className="button button-ghost" to="/">Back to public home</Link></section></PublicLayout>;
}

function StaffAccessPage() {
  const { openModal } = useStore();
  return <section className="access-page content-width"><div className="eyebrow"><ShieldCheck size={14} /> Separate demo access</div><h1>Keep the shop moving.</h1><p className="lead-copy">Choose a staff view to explore the operational side of Biglang Gwapo. These roles are intentionally separate from customer login and are for demonstration only.</p><div className="role-cards">{Object.entries(staffUsers).map(([role, user]) => <button className="role-card" key={role} onClick={() => openModal('staff', { requestedRole: role })}><span className="avatar avatar-lg">{user.initials}</span><span><strong>{user.role}</strong><small>{role === 'receptionist' ? 'Bookings, queue, checkout' : role === 'barber' ? 'Chair, service, schedule' : 'People, settings, reports'}</small></span><ArrowUpRight size={18} /></button>)}</div></section>;
}

function HomePage() {
  const { demo, session, openModal } = useStore();
  const navigate = useNavigate();
  const activePromo = demo.promotions.find((promo) => promo.active) || promotions[0];
  return <>
    <section className="hero-section content-width"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot" /> Pulilan, Bulacan · Open daily</div><h1>Good hair days<br /><em>start here.</em></h1><p>Biglang Gwapo is your neighborhood chair for sharp fades, classic cuts, and the kind of service that makes you want to stay a little longer.</p><div className="hero-actions"><button className="button button-dark button-large" onClick={() => session ? navigate('/booking') : openModal('login', { targetPath: '/booking' })}>Book your chair <ArrowRight size={18} /></button><a href="#services" className="button button-ghost button-large">Explore services</a></div><div className="hero-note"><span className="avatar-stack"><span className="avatar avatar-xs">MR</span><span className="avatar avatar-xs">PS</span><span className="avatar avatar-xs">ND</span></span><span>Trusted by 400+ local regulars</span></div></div><div className="hero-art"><div className="hero-stamp"><img src="/logo.png" alt="Biglang Gwapo Logo" className="hero-logo" /><span>EST. 2019</span></div><div className="hero-art-copy"><span>THE DAILY RITUAL</span><strong>Stay sharp.<br />Stay easy.</strong></div><div className="hero-lines" /></div></section>
    <section className="promo-strip content-width"><div><span className="eyebrow gold">Limited demo offer</span><h2>{activePromo.title}</h2><p>{activePromo.description}</p></div><div className="promo-value"><strong>{activePromo.type === 'Percentage' ? `${activePromo.value}%` : currency(activePromo.value)}</strong><span>off your visit</span></div><button className="button button-dark" onClick={() => navigate('/booking')}>Use offer <ArrowUpRight size={17} /></button></section>
    <section id="services" className="section-block content-width"><SectionIntro eyebrow="Our services" title="The essentials, done properly." action={<Link to="/services" className="text-link">View all services <ArrowRight size={15} /></Link>} /><div className="service-grid">{demo.services.slice(0, 4).map((service, index) => <ServiceCard key={service.id} service={service} index={index} />)}</div></section>
    <section className="section-block section-charcoal"><div className="content-width"><SectionIntro eyebrow="Meet the crew" title="Your cut, their craft." inverse action={<Link to="/barbers" className="text-link light">Meet the barbers <ArrowRight size={15} /></Link>} /><div className="barber-grid">{demo.barbers.map((barber) => <BarberCard key={barber.id} barber={barber} compact />)}</div></div></section>
    <section id="reviews" className="section-block content-width"><SectionIntro eyebrow="In their words" title="A chair worth coming back to." /><div className="review-grid">{demo.reviews.slice(0, 3).map((review) => <ReviewCard key={review.id} review={review} />)}</div></section>
    <section id="location" className="visit-panel content-width"><div><div className="eyebrow">Find your way here</div><h2>Pulilan, when you need a reset.</h2><p>Drop by for a walk-in or book ahead. We keep the chairs moving without making the visit feel rushed.</p><div className="visit-details"><span><strong>Address</strong>180 Cutcot National Highway, Pulilan, Bulacan</span><span><strong>Hours</strong>Mon–Sun · 9:00 AM–8:00 PM</span><span><strong>Contact</strong>+63 917 555 0100</span></div></div><div className="map-frame-wrapper"><iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3855.6315022115173!2d120.85780967487896!3d14.901869885621!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33965516e729bc35%3A0xdd2f48256d4c3149!2sBIGLANG%20GWAPO%20BARBERSHOP!5e0!3m2!1sen!2sph!4v1791729866482!5m2!1sen!2sph" width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" title="Biglang Gwapo Barbershop Location"></iframe></div></section>
  </>;
}

function ServicesPage() {
  const { demo } = useStore();
  return <PageFrame eyebrow="Menu" title="Services made for the regulars." description="No overthinking. Pick your service, choose your barber, and we’ll take it from there."><div className="service-list">{demo.services.map((service, index) => <ServiceCard key={service.id} service={service} index={index} detailed />)}</div><div className="notice-bar"><CircleHelp size={17} /><span>Prices are demo values in Philippine pesos. Final service details can be updated from Admin → Services.</span></div></PageFrame>;
}

function BarbersPage() {
  const { demo } = useStore();
  return <PageFrame eyebrow="The crew" title="Good hands, good energy." description="Every barber brings a different specialty to the chair. Choose the pace and finish that feels like you."><div className="barber-grid public-barbers">{demo.barbers.map((barber) => <BarberCard key={barber.id} barber={barber} />)}</div></PageFrame>;
}

function BookingPage() {
  const { demo, session, commit, notify, openModal } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selection, setSelection] = useState({ serviceId: '', barberId: '', date: today, time: '', notes: '' });
  const [confirmed, setConfirmed] = useState(null);
  const service = demo.services.find((item) => item.id === selection.serviceId);
  const barber = demo.barbers.find((item) => item.id === selection.barberId);
  const slots = ['9:00 AM', '9:45 AM', '10:30 AM', '11:15 AM', '1:00 PM', '1:45 PM', '2:30 PM', '3:15 PM', '4:00 PM', '5:00 PM'];
  const isTaken = (time) => demo.appointments.some((item) => item.barberId === selection.barberId && item.date === selection.date && item.time === time && !['Cancelled', 'No-show'].includes(item.status));
  const nextStep = () => {
    if (step === 1 && !service) return notify('Choose a service to continue.', 'error');
    if (step === 2 && !barber) return notify('Choose a barber to continue.', 'error');
    if (step === 3 && !selection.time) return notify('Choose an available time.', 'error');
    setStep((current) => Math.min(4, current + 1));
  };
  const confirm = () => {
    if (!session || session.role !== 'customer') return openModal('login', { targetPath: '/booking' });
    try {
      commit((state) => demoApi.createBooking(state, { ...selection, customerId: 'cust-demo', customerName: session.name, serviceName: service.name, barberName: barber.name, duration: service.duration, price: service.price }));
      setConfirmed({ ...selection, serviceName: service.name, barberName: barber.name, price: service.price, duration: service.duration });
      notify('Your booking is ready for reception to confirm.');
    } catch (error) { notify(error.message, 'error'); }
  };
  if (confirmed) return <PageFrame eyebrow="Booking confirmed" title="Your chair is on the board." description="This is a demo confirmation. Reception can now confirm the appointment and mark you arrived from the staff view."><div className="confirmation-card"><div className="confirmation-icon"><Check size={24} /></div><div><span className="eyebrow gold">Booking reference · BG-DEMO</span><h2>{confirmed.serviceName}</h2><p>{humanDate(confirmed.date)} · {confirmed.time} with {confirmed.barberName}</p></div><div className="confirmation-meta"><span><small>Price</small><strong>{currency(confirmed.price)}</strong></span><span><small>Duration</small><strong>{confirmed.duration} min</strong></span></div><div className="confirmation-actions"><Link to="/my-appointments" className="button button-dark">View appointment <ArrowRight size={16} /></Link><button className="button button-ghost" onClick={() => { setConfirmed(null); setStep(1); setSelection({ serviceId: '', barberId: '', date: today, time: '', notes: '' }); }}>Book another</button></div></div></PageFrame>;
  return <PageFrame eyebrow="Book your chair" title="A better cut starts with a clear plan." description="Choose a service, tell us who you want in your corner, and we’ll keep the rest simple."><div className="booking-layout"><div className="booking-main"><div className="stepper">{['Service', 'Barber', 'Date & time', 'Review'].map((label, index) => <div className={`step-item ${step === index + 1 ? 'active' : ''} ${step > index + 1 ? 'done' : ''}`} key={label}><span>{step > index + 1 ? <Check size={14} /> : index + 1}</span><small>{label}</small></div>)}</div>{step === 1 && <div className="choice-grid">{demo.services.filter((item) => item.active).map((item) => <button className={`choice-card ${selection.serviceId === item.id ? 'selected' : ''}`} key={item.id} onClick={() => setSelection({ ...selection, serviceId: item.id })}><span className="choice-index">0{demo.services.indexOf(item) + 1}</span><strong>{item.name}</strong><small>{item.description}</small><span className="choice-bottom"><b>{currency(item.price)}</b><em>{item.duration} min</em></span></button>)}</div>}{step === 2 && <div className="choice-grid">{demo.barbers.filter((item) => item.working).map((item) => <button className={`choice-card barber-choice ${selection.barberId === item.id ? 'selected' : ''}`} key={item.id} onClick={() => setSelection({ ...selection, barberId: item.id })}><span className="avatar avatar-md">{item.initials}</span><strong>{item.name}</strong><small>{item.specialty}</small><span className="rating-line">{stars(item.rating)} <em>{item.rating}</em></span></button>)}</div>}{step === 3 && <div className="date-time-panel"><label className="field-label">Appointment date<input className="input" type="date" min={today} value={selection.date} onChange={(event) => setSelection({ ...selection, date: event.target.value, time: '' })} /></label><div className="field-label">Available times<div className="slot-grid">{slots.map((slot) => <button key={slot} disabled={isTaken(slot)} className={`slot-button ${selection.time === slot ? 'selected' : ''}`} onClick={() => setSelection({ ...selection, time: slot })}>{slot}{isTaken(slot) && <small>Booked</small>}</button>)}</div></div></div>}{step === 4 && <div className="review-booking"><div className="review-summary"><span><small>Service</small><strong>{service?.name}</strong></span><span><small>Barber</small><strong>{barber?.name}</strong></span><span><small>Schedule</small><strong>{humanDate(selection.date)} · {selection.time}</strong></span><span><small>Price</small><strong>{currency(service?.price)}</strong></span></div><label className="field-label">Notes for your barber<textarea className="input textarea" placeholder="Anything we should know?" value={selection.notes} onChange={(event) => setSelection({ ...selection, notes: event.target.value })} /></label>{!session && <div className="inline-alert"><LockKeyhole size={17} /><span>You’ll sign in before this demo booking is submitted. Your selection will be kept.</span></div>}</div>}<div className="booking-actions">{step > 1 && <button className="button button-ghost" onClick={() => setStep((current) => current - 1)}><ChevronLeft size={16} /> Back</button>}{step < 4 ? <button className="button button-dark" onClick={nextStep}>Continue <ArrowRight size={16} /></button> : <button className="button button-dark" onClick={confirm}>{session ? 'Confirm booking' : 'Sign in to confirm'} <ArrowRight size={16} /></button>}</div></div><aside className="booking-aside"><span className="eyebrow">Your booking</span><div className="aside-rule" />{service ? <div className="aside-service"><span className="service-icon"><Scissors size={18} /></span><strong>{service.name}</strong><span>{currency(service.price)} · {service.duration} min</span></div> : <p className="muted-copy">Select a service to see your summary.</p>}{barber && <div className="aside-person"><span className="avatar avatar-sm">{barber.initials}</span><span><small>With</small><strong>{barber.name}</strong></span></div>}<div className="aside-note"><Zap size={15} /> Availability is demo data and respects existing bookings.</div></aside></div></PageFrame>;
}

function CustomerPage({ path }) {
  if (path === '/customer') return <CustomerDashboard />;
  if (path === '/booking') return <BookingPage />;
  if (path === '/my-appointments') return <CustomerAppointments />;
  if (path === '/queue-status') return <CustomerQueue />;
  if (path === '/service-history') return <CustomerHistory />;
  if (path === '/reviews') return <CustomerReviews />;
  return <CustomerProfile />;
}

function CustomerDashboard() {
  const { demo, commit, notify } = useStore();
  const appointments = demo.appointments.filter((item) => item.customerId === 'cust-demo');
  const upcoming = appointments.find((item) => !['Completed', 'Cancelled'].includes(item.status));
  const completed = appointments.filter((item) => item.status === 'Completed');
  const queueEntry = demo.queue.find((item) => item.customerId === 'cust-demo' && !['Completed', 'Removed', 'Skipped'].includes(item.status));

  const cancel = (id) => {
    if (window.confirm('Cancel this appointment? This demo action cannot be undone.')) {
      commit((state) => demoApi.cancelAppointment(state, id));
      notify('Appointment cancelled.');
    }
  };

  const reschedule = (id) => {
    const date = window.prompt('New date (YYYY-MM-DD)', today);
    const time = date && window.prompt('New time (for example, 2:00 PM)', '2:00 PM');
    if (!date || !time) return;
    try {
      commit((state) => demoApi.rescheduleAppointment(state, id, date, time));
      notify('Appointment rescheduled and returned to Pending.');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  return (
    <>
      <BentoStats
        items={[
          ['Next appointment', upcoming ? `${humanDate(upcoming.date)} · ${upcoming.time}` : 'None scheduled', CalendarDays, upcoming ? upcoming.serviceName : 'Book your next visit'],
          ['Queue status', queueEntry ? `${queueEntry.number} (${queueEntry.status})` : 'Not in queue', ListOrdered, queueEntry ? `~${queueEntry.estimatedMinutes}m estimated wait` : 'Ready when you arrive'],
          ['Total visits', `${completed.length} completed`, Scissors, 'Recorded in shop ledger'],
          ['Preferred barber', upcoming?.barberName || 'Marco Reyes', Star, 'Master Barber']
        ]}
      />

      <div className="dashboard-grid two-thirds">
        <SectionCard
          title="Upcoming appointment"
          description="Your scheduled session in the barber chair."
          action={<Link to="/my-appointments" className="text-link">View all <ArrowRight size={14} /></Link>}
        >
          {upcoming ? (
            <div style={{ padding: '20px' }}>
              <AppointmentCard appointment={upcoming} onCancel={cancel} onReschedule={() => reschedule(upcoming.id)} />
            </div>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="No upcoming bookings"
              copy="Ready for your next fresh cut? Select a service and barber."
              action={<Link to="/booking" className="button button-dark">Book a chair <ArrowRight size={15} /></Link>}
            />
          )}
        </SectionCard>

        <SectionCard title="Quick actions">
          <div className="quick-actions">
            <Link to="/booking">
              <Scissors size={19} />
              <span><strong>Book a chair</strong><small>Choose service, barber & slot.</small></span>
              <ArrowUpRight size={16} />
            </Link>
            <Link to="/queue-status">
              <ListOrdered size={19} />
              <span><strong>Check live queue</strong><small>See wait time & position in line.</small></span>
              <ArrowUpRight size={16} />
            </Link>
            <Link to="/reviews">
              <Star size={19} />
              <span><strong>Rate your barber</strong><small>Leave feedback for your recent cut.</small></span>
              <ArrowUpRight size={16} />
            </Link>
            <Link to="/profile">
              <UserRound size={19} />
              <span><strong>My profile</strong><small>Update phone & preferences.</small></span>
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </SectionCard>
      </div>

      <div className="dashboard-grid two-thirds">
        <SectionCard
          title="Recent completed cuts"
          description="Your past services at Biglang Gwapo."
          action={<Link to="/service-history" className="text-link">Full history <ArrowRight size={14} /></Link>}
        >
          {completed.length ? (
            <div className="compact-list">
              {completed.slice(0, 3).map((item) => (
                <div className="compact-row" key={item.id}>
                  <span className="time-label">{humanDate(item.date)}</span>
                  <div className="compact-row-main">
                    <strong>{item.serviceName}</strong>
                    <small>with {item.barberName} · {currency(item.price)}</small>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No past visits yet" copy="Completed services will be logged here with digital receipts." />
          )}
        </SectionCard>

        <SectionCard title="Shop bulletin">
          <div className="shift-note">
            <span className="note-mark">“</span>
            <p>Welcome back, Miguel! Free cold brew & espresso at the lounge while waiting for your chair.</p>
            <small>Front Desk · Biglang Gwapo Pulilan</small>
          </div>
        </SectionCard>
      </div>
    </>
  );
}

function CustomerAppointments() {
  const { demo, commit, notify } = useStore();
  const [tab, setTab] = useState('Upcoming');
  const mine = demo.appointments.filter((item) => item.customerId === 'cust-demo');
  const upcomingList = mine.filter((item) => !['Completed', 'Cancelled'].includes(item.status));
  const completedList = mine.filter((item) => item.status === 'Completed');
  const list = tab === 'Upcoming' ? upcomingList : completedList;
  const queueEntry = demo.queue.find((item) => item.customerId === 'cust-demo' && !['Completed', 'Removed', 'Skipped'].includes(item.status));

  const cancel = (id) => {
    if (window.confirm('Cancel this appointment? This demo action cannot be undone.')) {
      commit((state) => demoApi.cancelAppointment(state, id));
      notify('Appointment cancelled.');
    }
  };

  const reschedule = (id) => {
    const date = window.prompt('New date (YYYY-MM-DD)', today);
    const time = date && window.prompt('New time (for example, 2:00 PM)', '2:00 PM');
    if (!date || !time) return;
    try {
      commit((state) => demoApi.rescheduleAppointment(state, id, date, time));
      notify('Appointment rescheduled and returned to Pending.');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  return (
    <>
      <BentoStats
        items={[
          ['Upcoming visits', `${upcomingList.length} booked`, CalendarDays, upcomingList[0] ? `${humanDate(upcomingList[0].date)} · ${upcomingList[0].time}` : 'No upcoming bookings'],
          ['Queue status', queueEntry ? `${queueEntry.number} (${queueEntry.status})` : 'Not in queue', ListOrdered, queueEntry ? `~${queueEntry.estimatedMinutes}m wait` : 'Ready when you arrive'],
          ['Completed visits', `${completedList.length} finished`, Scissors, 'Logged in history'],
          ['Preferred barber', upcomingList[0]?.barberName || 'Marco Reyes', Star, 'Master Barber']
        ]}
      />

      <Toolbar
        title="My appointments"
        count={list.length}
        description="Keep your next visit close, without losing the history behind it."
        action={
          <Link to="/booking" className="button button-dark button-small">
            <Plus size={15} /> Book new chair
          </Link>
        }
      />

      <div className="tabs">
        <button className={tab === 'Upcoming' ? 'active' : ''} onClick={() => setTab('Upcoming')}>
          Upcoming <span>{upcomingList.length}</span>
        </button>
        <button className={tab === 'Completed' ? 'active' : ''} onClick={() => setTab('Completed')}>
          Completed <span>{completedList.length}</span>
        </button>
      </div>

      <SectionCard>
        {list.length ? (
          <div className="appointment-list" style={{ padding: '16px' }}>
            {list.map((item) => (
              <AppointmentCard
                key={item.id}
                appointment={item}
                onCancel={cancel}
                onReschedule={() => reschedule(item.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CalendarDays}
            title={tab === 'Upcoming' ? 'No upcoming appointments' : 'No completed appointments yet'}
            copy={tab === 'Upcoming' ? 'Book a chair and your next visit will land here.' : 'Completed appointments will appear here after your session.'}
            action={
              tab === 'Upcoming' && (
                <Link className="button button-dark" to="/booking">
                  Book now
                </Link>
              )
            }
          />
        )}
      </SectionCard>
    </>
  );
}

function CustomerQueue() {
  const { demo } = useStore();
  const active = demo.queue.find((item) => item.customerId === 'cust-demo' && !['Completed', 'Removed', 'Skipped'].includes(item.status));
  const ahead = active ? demo.queue.filter((item) => item.status === 'Waiting' && item.id !== active.id).length : 0;

  return (
    <>
      <BentoStats
        items={[
          ['Your queue #', active?.number || '—', ListOrdered, active?.status || 'No active queue entry'],
          ['Assigned barber', active?.barberName || 'Not assigned', Scissors, 'On-duty barber'],
          ['Customers ahead', `${ahead} in line`, Users, 'Before your chair'],
          ['Estimated wait', active ? `~${Math.max(5, ahead * 15)} min` : '—', Clock3, 'Real-time estimate']
        ]}
      />

      <Toolbar
        title="Live queue status"
        description="Waiting times are estimates. Your barber or reception team can update the live state."
        action={
          <Link to="/booking" className="button button-ghost button-small">
            <Plus size={15} /> Book appointment
          </Link>
        }
      />

      <div className="split-layout">
        <SectionCard title="Your active queue ticket">
          <div style={{ padding: '20px' }}>
            <div className="queue-hero" style={{ marginBottom: '16px' }}>
              <div className="queue-number">
                <small>Your queue number</small>
                <strong>{active?.number || '—'}</strong>
                <span>{active?.status || 'No active queue entry'}</span>
              </div>
              <div className="queue-details">
                <span>
                  <small>Assigned barber</small>
                  <strong>{active?.barberName || 'Not assigned'}</strong>
                </span>
                <span>
                  <small>Customers ahead</small>
                  <strong>{ahead}</strong>
                </span>
                <span>
                  <small>Estimated wait</small>
                  <strong>{active ? `${Math.max(5, ahead * 15)} min` : '—'}</strong>
                </span>
              </div>
            </div>

            <div className="notice-bar">
              <Clock3 size={17} />
              <span>All wait times are dynamic estimates and update as barbers finish clients.</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Queue progression" description="What happens next">
          <div style={{ padding: '24px' }}>
            <div className="timeline">
              <div className="timeline-item done">
                <span><Check size={15} /></span>
                <div>
                  <strong>1. Booking / Walk-in registered</strong>
                  <small>Your session is on the shop schedule.</small>
                </div>
              </div>
              <div className={`timeline-item ${active ? 'done' : ''}`}>
                <span>{active ? <Check size={15} /> : '2'}</span>
                <div>
                  <strong>2. Join the assigned queue</strong>
                  <small>Reception marks you arrived and assigns your queue ticket.</small>
                </div>
              </div>
              <div className={`timeline-item ${active?.status === 'In Service' ? 'done' : ''}`}>
                <span>{active?.status === 'In Service' ? <Check size={15} /> : '3'}</span>
                <div>
                  <strong>3. Chair call</strong>
                  <small>Your barber calls your number to the styling chair.</small>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <div style={{ marginTop: '16px' }}>
        <SectionCard title="Shop queue overview" description="Live line at Pulilan branch">
          <QueueMini queue={demo.queue} />
        </SectionCard>
      </div>
    </>
  );
}

function CustomerHistory() {
  const { demo, notify } = useStore();
  const [query, setQuery] = useState('');
  const history = demo.appointments.filter((item) => item.customerId === 'cust-demo' && item.status === 'Completed');
  const filtered = history.filter((item) => `${item.serviceName} ${item.barberName} ${item.notes || ''}`.toLowerCase().includes(query.toLowerCase()));
  const totalSpent = history.reduce((sum, item) => sum + (item.price || 0), 0);

  return (
    <>
      <BentoStats
        items={[
          ['Completed visits', `${history.length} services`, Scissors, 'All finished cuts'],
          ['Total spent', currency(totalSpent), WalletCards, 'Paid in full'],
          ['Favorite barber', history[0]?.barberName || 'Marco Reyes', Star, 'Master Barber'],
          ['Last visit', history[0] ? humanDate(history[0].date) : 'None', CalendarDays, 'Up to date']
        ]}
      />

      <Toolbar
        title="Service history"
        count={filtered.length}
        description="Every finished service, receipt, and barber note in one place."
        query={query}
        setQuery={setQuery}
        action={
          <button className="button button-ghost button-small" onClick={() => notify('Receipt export downloaded.')}>
            <Download size={15} /> Export
          </button>
        }
      />

      <SectionCard>
        {filtered.length ? (
          <div className="history-list" style={{ padding: '16px' }}>
            {filtered.map((item) => (
              <div className="history-card" key={item.id}>
                <div className="history-date">
                  <strong>{new Date(`${item.date}T00:00:00`).getDate()}</strong>
                  <span>{new Date(`${item.date}T00:00:00`).toLocaleDateString('en-PH', { month: 'short' })}</span>
                </div>
                <div className="history-main">
                  <span className="eyebrow">{item.serviceName}</span>
                  <h3>{item.barberName}</h3>
                  <p>{item.notes || 'Service completed with a clean, tailored finish.'}</p>
                </div>
                <div className="history-side">
                  <span>
                    <small>Paid</small>
                    <strong>{currency(item.price)}</strong>
                  </span>
                  <button
                    className="button button-ghost button-small"
                    onClick={() => notify(`Receipt for ${item.serviceName} (${currency(item.price)}) downloaded.`)}
                  >
                    <FileText size={15} /> Receipt
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No completed services yet"
            copy="Your finished visits and receipts will appear here once your service is marked complete."
          />
        )}
      </SectionCard>
    </>
  );
}

function CustomerReviews() {
  const { demo, commit, notify } = useStore();
  const eligible = demo.appointments.find((item) => item.customerId === 'cust-demo' && item.status === 'Completed' && !demo.reviews.some((review) => review.appointmentId === item.id));
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const myReviews = demo.reviews.filter((review) => review.customer === 'Miguel Santos');

  const submit = (event) => {
    event.preventDefault();
    if (!eligible) return notify('Reviews are available after a completed demo service.', 'error');
    if (!rating || !comment.trim()) return notify('Choose a rating and add feedback.', 'error');
    commit((state) => demoApi.addReview(state, { customer: 'Miguel Santos', initials: 'MS', barber: eligible.barberName, rating, comment, appointmentId: eligible.id }));
    setRating(0);
    setComment('');
    notify('Thanks for sharing your review.');
  };

  return (
    <>
      <BentoStats
        items={[
          ['Eligible for review', eligible ? '1 service' : '0 pending', Star, eligible ? `With ${eligible.barberName}` : 'All caught up'],
          ['Your reviews', `${myReviews.length} submitted`, ReceiptText, 'Shared with shop'],
          ['Shop average', '4.9 ★', Sparkles, 'Community rating'],
          ['Recent barber', eligible?.barberName || myReviews[0]?.barber || 'Marco Reyes', Scissors, 'Master Barber']
        ]}
      />

      <Toolbar
        title="Reviews & ratings"
        count={myReviews.length}
        description="Leave a little signal for the next person choosing their chair."
      />

      <div className="split-layout">
        <SectionCard title="Write a review" description="Share feedback for your recent completed visit.">
          <div style={{ padding: '20px' }}>
            <div className="review-write" style={{ margin: 0 }}>
              <div>
                <span className="eyebrow gold">Eligible service</span>
                <h2>{eligible ? eligible.serviceName : 'No pending review'}</h2>
                <p>{eligible ? `Your completed visit with ${eligible.barberName} is ready for feedback.` : 'Complete another demo service to unlock a review.'}</p>
              </div>
              <form onSubmit={submit}>
                <div className="star-picker" aria-label="Choose a rating">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button type="button" key={value} className={value <= rating ? 'active' : ''} onClick={() => setRating(value)} aria-label={`${value} stars`}>
                      <Star size={25} fill="currentColor" />
                    </button>
                  ))}
                </div>
                <textarea
                  className="input textarea"
                  disabled={!eligible}
                  placeholder="What stood out about the cut and barber?"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                />
                <button className="button button-dark" disabled={!eligible}>
                  Submit review <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Your submitted reviews" description="Feedback you provided">
          <div style={{ padding: '20px' }}>
            <div className="submitted-reviews" style={{ maxWidth: '100%' }}>
              {myReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
              {!myReviews.length && (
                <EmptyState
                  icon={Star}
                  title="No reviews yet"
                  copy="Reviews you write after your cuts will be listed here."
                />
              )}
            </div>
          </div>
        </SectionCard>
      </div>
    </>
  );
}

function CustomerProfile() {
  const { session, notify, reset } = useStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(session?.name || 'Miguel Santos');
  const [phone, setPhone] = useState(session?.phone || '+63 917 555 0142');

  return (
    <>
      <BentoStats
        items={[
          ['Member profile', name, UserRound, 'Active customer'],
          ['Phone number', phone, BadgeCheck, 'SMS booking updates'],
          ['Account role', 'Customer', ShieldCheck, 'Biglang Gwapo regular'],
          ['Member since', 'October 2026', CalendarDays, 'Pulilan regular']
        ]}
      />

      <Toolbar
        title="My profile & settings"
        description="Keep your details ready for a smoother visit."
      />

      <div className="profile-layout">
        <div className="profile-card">
          <div className="profile-header">
            <span className="avatar avatar-xl">{session?.initials || 'MS'}</span>
            <div>
              <h2>{name}</h2>
              <p>{session?.email || 'customer@biglanggwapo.com'} · Member since 2026</p>
            </div>
            <button className="button button-ghost button-small" onClick={() => setEditing(!editing)}>
              <Pencil size={15} /> {editing ? 'Cancel' : 'Edit profile'}
            </button>
          </div>
          <div className="profile-fields">
            <label className="field-label">
              Full name
              <input className="input" disabled={!editing} value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label className="field-label">
              Email
              <input className="input" disabled value={session?.email || 'customer@biglanggwapo.com'} readOnly />
            </label>
            <label className="field-label">
              Phone number
              <input className="input" disabled={!editing} value={phone} onChange={(event) => setPhone(event.target.value)} />
            </label>
          </div>
          {editing && (
            <button
              className="button button-dark"
              onClick={() => {
                setEditing(false);
                notify('Profile details updated for this session.');
              }}
            >
              Save changes <Check size={16} />
            </button>
          )}
        </div>

        <div className="settings-card">
          <span className="eyebrow">Account settings</span>
          <div className="setting-row">
            <div>
              <strong>Booking notifications</strong>
              <small>Receive updates when queue moves or status changes.</small>
            </div>
            <button className="toggle active" aria-label="Booking notifications enabled">
              <span />
            </button>
          </div>
          <div className="setting-row">
            <div>
              <strong>Change password</strong>
              <small>Simulated password update for demo accounts.</small>
            </div>
            <button className="button button-ghost button-small" onClick={() => notify('Password-change interface is simulated in this build.')}>
              Open <ArrowRight size={14} />
            </button>
          </div>
          <div className="setting-row">
            <div>
              <strong>Reset demo data</strong>
              <small>Restore default appointments, queue and reviews.</small>
            </div>
            <button
              className="button button-danger button-small"
              onClick={() => window.confirm('Reset all demo data?') && reset()}
            >
              Reset data
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function StaffLayout({ role, children }) {
  const { session, logout, reset } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = navItems[role] || [];
  const location = useLocation();
  const title = routeManifest.find((item) => item.path === location.pathname)?.title || 'Workspace';
  const deskLabel = role === 'customer' ? 'customer portal' : `${role} desk`;
  const workspaceEyebrow = role === 'customer' ? 'customer workspace' : `${role} workspace`;

  return (
    <div className="staff-app">
      <aside className={`staff-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-top">
          <Link to="/" className="brand-lockup">
            <img src="/logo.png" alt="Biglang Gwapo Logo" className="brand-logo" />
            <span>
              <strong>Biglang Gwapo</strong>
              <small>{deskLabel}</small>
            </span>
          </Link>
          <button className="icon-button mobile-only" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>
        <div className="sidebar-label">{role === 'customer' ? 'Customer panel' : 'Workspace'}</div>
        <nav className="staff-nav">
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
          {role === 'customer' && (
            <NavLink
              to="/booking"
              className={({ isActive }) => `staff-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <Scissors size={17} /> Book a chair
            </NavLink>
          )}
          <Link to="/" className="staff-nav-link">
            <Globe2 size={17} /> View public site
          </Link>
          <button className="staff-nav-link" onClick={() => { if (window.confirm('Reset all demo data?')) reset(); }}>
            <RefreshCcw size={17} /> Reset demo data
          </button>
          <button className="staff-nav-link" onClick={logout}>
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
              <ChevronDown size={15} />
            </div>
          </div>
        </header>
        <main className="staff-content">{children}</main>
      </div>
    </div>
  );
}

function ReceptionistPage({ path }) {
  if (path === '/receptionist') return <ReceptionistDashboard />;
  if (path === '/receptionist/appointments') return <ReceptionistAppointments />;
  if (path === '/receptionist/walk-ins') return <WalkInPage />;
  if (path === '/receptionist/queue') return <QueueManagement />;
  if (path === '/receptionist/customers') return <CustomerManagement />;
  if (path === '/receptionist/payments') return <PaymentPage />;
  return <TransactionsPage />;
}

function ReceptionistDashboard() {
  const { demo } = useStore();
  const todayAppointments = demo.appointments.filter((item) => item.date === today);
  const sales = demo.transactions.filter((item) => item.date === today).reduce((sum, item) => sum + item.amount, 0);
  return <><BentoStats items={[['Today\'s appointments', todayAppointments.length + 4, CalendarDays, '2 waiting confirmation'], ['Current queue', demo.queue.filter((item) => item.status === 'Waiting').length, ListOrdered, '1 in service'], ['Walk-ins', 6, UserPlus, '↑ 2 from yesterday'], ['Today\'s sales', currency(sales + 1680), WalletCards, '4 paid transactions']]} /><div className="dashboard-grid two-thirds"><SectionCard title="Upcoming appointments" action={<Link to="/receptionist/appointments" className="text-link">View all <ArrowRight size={14} /></Link>}><div className="compact-list">{demo.appointments.slice(0, 4).map((item) => <AppointmentRow key={item.id} appointment={item} />)}</div></SectionCard><SectionCard title="Quick actions"><div className="quick-actions"><Link to="/receptionist/walk-ins"><UserPlus size={19} /><span><strong>Register walk-in</strong><small>Put a guest in the queue.</small></span><ArrowUpRight size={16} /></Link><Link to="/receptionist/queue"><ListOrdered size={19} /><span><strong>Manage queue</strong><small>Call, skip, or remove.</small></span><ArrowUpRight size={16} /></Link><Link to="/receptionist/payments"><WalletCards size={19} /><span><strong>Open checkout</strong><small>Record a mock payment.</small></span><ArrowUpRight size={16} /></Link></div></SectionCard></div><div className="dashboard-grid two-thirds"><SectionCard title="Current queue" action={<Link to="/receptionist/queue" className="text-link">Open queue <ArrowRight size={14} /></Link>}><QueueMini queue={demo.queue} /></SectionCard><SectionCard title="Shift note"><div className="shift-note"><span className="note-mark">“</span><p>Keep the 1:00 PM slot open for walk-ins. Marco is ready for the next fade.</p><small>Bea · Front desk note</small></div></SectionCard></div></>;
}

function ReceptionistAppointments() {
  const { demo, commit, notify } = useStore();
  const [query, setQuery] = useState(''); const [status, setStatus] = useState('All');
  const filtered = demo.appointments.filter((item) => `${item.customerName} ${item.serviceName} ${item.barberName}`.toLowerCase().includes(query.toLowerCase()) && (status === 'All' || item.status === status));
  const act = (id, action) => { const updater = action === 'confirm' ? demoApi.confirmAppointment : action === 'arrived' ? demoApi.markArrived : demoApi.cancelAppointment; if (action === 'cancel' && !window.confirm('Cancel this appointment?')) return; commit((state) => updater(state, id)); notify(action === 'arrived' ? 'Customer marked arrived and added to the queue.' : `Appointment ${action}ed.`); };
  return <><Toolbar title="Bookings on the board" count={filtered.length} query={query} setQuery={setQuery} filter={status} setFilter={setStatus} filters={['All', 'Pending', 'Confirmed', 'Arrived', 'Completed', 'Cancelled']} /><SectionCard><DataTable columns={['Customer', 'Service', 'Schedule', 'Barber', 'Status', 'Actions']}><tbody>{filtered.map((item) => <tr key={item.id}><td><div className="table-person"><span className="avatar avatar-xs">{item.customerName.split(' ').map((p) => p[0]).join('').slice(0, 2)}</span><span><strong>{item.customerName}</strong><small>{item.source}</small></span></div></td><td>{item.serviceName}<small className="table-sub">{currency(item.price)} · {item.duration}m</small></td><td>{humanDate(item.date)}<small className="table-sub">{item.time}</small></td><td>{item.barberName}</td><td><StatusBadge status={item.status} /></td><td><div className="row-actions">{item.status === 'Pending' && <button className="button button-soft button-small" onClick={() => act(item.id, 'confirm')}>Confirm</button>}{['Confirmed', 'Arrived'].includes(item.status) && <button className="button button-soft button-small" onClick={() => act(item.id, 'arrived')}>Mark arrived</button>}{!['Completed', 'Cancelled'].includes(item.status) && <button className="icon-button" title="Cancel" onClick={() => act(item.id, 'cancel')}><X size={16} /></button>}<button className="icon-button" title="View details"><MoreHorizontal size={17} /></button></div></td></tr>)}</tbody></DataTable>{!filtered.length && <EmptyState title="No bookings match" copy="Try a different search or status filter." />}</SectionCard></>;
}

function WalkInPage() {
  const { demo, commit, notify } = useStore();
  const [form, setForm] = useState({ customerId: '', customerName: '', phone: '', serviceId: demo.services[0].id, barberId: demo.barbers[0].id });
  const [created, setCreated] = useState(null);
  const submit = (event) => { event.preventDefault(); if (!form.customerId && !form.customerName.trim()) return notify('Choose an existing customer or enter a name.', 'error'); const before = demo.queue.length; commit((state) => demoApi.addWalkIn(state, form)); setCreated(`Q-${String(before + 15).padStart(3, '0')}`); notify('Walk-in added to the queue.'); };
  return <div className="split-layout"><SectionCard title="Register a walk-in" description="Create a queue entry without an online booking."><form className="form-stack" onSubmit={submit}><label className="field-label">Existing customer<select className="input" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value, customerName: '' })}><option value="">New walk-in</option>{demo.customers.filter((c) => c.status === 'Active').map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>{!form.customerId && <><label className="field-label">Customer name<input className="input" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="e.g. Sam Rivera" required /></label><label className="field-label">Phone number<input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+63 917 ..." /></label></>}<div className="form-grid"><label className="field-label">Service<select className="input" value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })}>{demo.services.filter((s) => s.active).map((service) => <option key={service.id} value={service.id}>{service.name} · {currency(service.price)}</option>)}</select></label><label className="field-label">Preferred barber<select className="input" value={form.barberId} onChange={(e) => setForm({ ...form, barberId: e.target.value })}>{demo.barbers.filter((b) => b.working).map((barber) => <option key={barber.id} value={barber.id}>{barber.name}</option>)}</select></label></div><button className="button button-dark" type="submit">Add to queue <ArrowRight size={16} /></button></form></SectionCard><SectionCard title="Assigned queue number"><div className="queue-result">{created ? <><span className="queue-result-number">{created}</span><strong>Guest is in line.</strong><p>Keep this number visible so the front desk can call them next.</p><Link to="/receptionist/queue" className="button button-ghost">Open queue</Link></> : <><div className="empty-illustration"><UserPlus size={23} /></div><strong>Ready for the next walk-in</strong><p>After submission, the assigned number and barber will appear here.</p></>}</div></SectionCard></div>;
}

function QueueManagement() {
  const { demo, commit, notify } = useStore();
  const [barber, setBarber] = useState('All');
  const active = demo.queue.filter((item) => !['Completed', 'Removed', 'Skipped'].includes(item.status) && (barber === 'All' || item.barberId === barber));
  const act = (id, type) => { if (type === 'remove' && !window.confirm('Remove this queue entry?')) return; const api = type === 'start' ? demoApi.startService : type === 'skip' ? demoApi.skipQueue : demoApi.removeQueue; commit((state) => api(state, id)); notify(type === 'start' ? 'Customer called into service.' : `Queue entry ${type}ped.`); };
  return <><Toolbar title="Keep chairs moving" count={active.length} filter={barber} setFilter={setBarber} filters={['All', ...demo.barbers.map((b) => b.id)]} filterLabels={{ All: 'All barbers', ...Object.fromEntries(demo.barbers.map((b) => [b.id, b.name])) }} action={<Link to="/receptionist/walk-ins" className="button button-dark button-small"><Plus size={15} /> Add walk-in</Link>} /><div className="queue-board">{active.map((item, index) => <div className={`queue-row ${item.status === 'In Service' ? 'current' : ''}`} key={item.id}><div className="queue-rank">{index === 0 ? <Zap size={15} /> : index + 1}</div><div className="queue-main"><strong>{item.number} · {item.customerName}</strong><span>{item.serviceName} · {item.barberName}</span></div><StatusBadge status={item.status} /><span className="queue-wait">{item.status === 'In Service' ? 'In chair' : `~${item.estimatedMinutes} min`}</span><div className="row-actions">{item.status === 'Waiting' && <button className="button button-soft button-small" onClick={() => act(item.id, 'start')}>Call next</button>}{item.status === 'Waiting' && <button className="icon-button" title="Skip" onClick={() => act(item.id, 'skip')}><ChevronRight size={16} /></button>}<button className="icon-button" title="Remove" onClick={() => act(item.id, 'remove')}><X size={16} /></button></div></div>)}{!active.length && <EmptyState title="Queue is clear" copy="Walk-ins and arrived appointments will land here." action={<Link className="button button-dark" to="/receptionist/walk-ins">Add walk-in</Link>} />}</div></>;
}

function CustomerManagement() {
  const { demo } = useStore(); const [query, setQuery] = useState(''); const [selected, setSelected] = useState(demo.customers[0]);
  const filtered = demo.customers.filter((item) => `${item.name} ${item.email} ${item.phone}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="split-layout customer-management"><SectionCard title="Customers" description="Search profiles, appointment history, and service notes."><div className="inline-search"><Search size={16} /><input placeholder="Search by name, email, or phone" value={query} onChange={(e) => setQuery(e.target.value)} /></div><div className="customer-list">{filtered.map((customer) => <button key={customer.id} className={`customer-list-row ${selected?.id === customer.id ? 'selected' : ''}`} onClick={() => setSelected(customer)}><span className="avatar avatar-sm">{customer.initials}</span><span><strong>{customer.name}</strong><small>{customer.email}</small></span><StatusBadge status={customer.status} /></button>)}</div></SectionCard><SectionCard title="Customer detail" action={<button className="icon-button"><MoreHorizontal size={17} /></button>}>{selected ? <div className="customer-detail"><div className="customer-detail-head"><span className="avatar avatar-lg">{selected.initials}</span><div><h2>{selected.name}</h2><p>{selected.email} · {selected.phone}</p></div></div><div className="detail-facts"><span><small>Visits</small><strong>{selected.visits}</strong></span><span><small>Last visit</small><strong>{selected.lastVisit}</strong></span><span><small>Status</small><strong>{selected.status}</strong></span></div><div className="detail-block"><span className="eyebrow">Preferences</span><p>{selected.preferences || 'No preferences added.'}</p></div><div className="detail-block"><span className="eyebrow">Notes</span><p>{selected.notes || 'No notes added.'}</p></div><div className="detail-block"><span className="eyebrow">Recent bookings</span>{demo.appointments.filter((item) => item.customerId === selected.id).slice(0, 3).map((item) => <AppointmentRow key={item.id} appointment={item} />)}</div></div> : <EmptyState title="Select a customer" copy="Choose a profile from the list." />}</SectionCard></div>;
}

function PaymentPage() {
  const { demo, commit, notify } = useStore(); const [selected, setSelected] = useState(''); const [method, setMethod] = useState('Cash'); const [cash, setCash] = useState('');
  const unpaid = demo.appointments.filter((item) => item.status === 'Completed' && item.paymentStatus === 'Unpaid'); const item = demo.appointments.find((appointment) => appointment.id === selected); const change = method === 'Cash' ? Math.max(0, Number(cash || 0) - Number(item?.price || 0)) : 0;
  const pay = () => { if (!item) return notify('Choose a completed service to check out.', 'error'); if (method === 'Cash' && Number(cash) < item.price) return notify('Cash received must cover the total.', 'error'); try { commit((state) => demoApi.recordPayment(state, item.id, method, cash)); notify('Payment recorded and receipt generated.'); setSelected(''); setCash(''); } catch (error) { notify(error.message, 'error'); } };
  return <div className="split-layout"><SectionCard title="Completed services awaiting payment" description="Only completed services can be checked out."><div className="checkout-list">{unpaid.map((appointment) => <button className={`checkout-row ${selected === appointment.id ? 'selected' : ''}`} key={appointment.id} onClick={() => setSelected(appointment.id)}><span className="avatar avatar-sm">{appointment.customerName.split(' ').map((p) => p[0]).join('').slice(0, 2)}</span><span><strong>{appointment.customerName}</strong><small>{appointment.serviceName} · {appointment.barberName}</small></span><b>{currency(appointment.price)}</b></button>)}{!unpaid.length && <EmptyState title="Nothing to check out" copy="Completed unpaid services will appear here." />}</div></SectionCard><SectionCard title="Checkout" description="GCash and Card are mock recording methods only.">{item ? <div className="checkout-panel"><div className="checkout-total"><span>Total due</span><strong>{currency(item.price)}</strong></div><div className="method-tabs">{['Cash', 'GCash', 'Card (demo)'].map((itemMethod) => <button key={itemMethod} className={method === itemMethod ? 'active' : ''} onClick={() => setMethod(itemMethod)}>{itemMethod}</button>)}</div>{method === 'Cash' && <label className="field-label">Cash received<input className="input" type="number" min={item.price} value={cash} onChange={(e) => setCash(e.target.value)} placeholder={item.price} /><small className="change-hint">Change: {currency(change)}</small></label>}<button className="button button-dark button-full" onClick={pay}>Record payment <Check size={16} /></button><button className="button button-ghost button-full" onClick={() => notify('Receipt preview is ready for printing in the demo.')}>Preview printable receipt <FileText size={16} /></button></div> : <EmptyState title="Select a service" copy="Choose a completed service from the left." />}</SectionCard></div>;
}

function TransactionsPage() {
  const { demo } = useStore(); const [query, setQuery] = useState(''); const filtered = demo.transactions.filter((item) => `${item.customerName} ${item.serviceName} ${item.receipt}`.toLowerCase().includes(query.toLowerCase()));
  return <><Toolbar title="Daily transactions" count={filtered.length} query={query} setQuery={setQuery} action={<button className="button button-ghost button-small"><Download size={15} /> Export CSV</button>} /><div className="stats-row small-stats"><StatCard label="Gross sales" value={currency(demo.transactions.reduce((sum, item) => sum + item.amount, 0))} icon={WalletCards} /><StatCard label="Cash" value={currency(demo.transactions.filter((item) => item.method === 'Cash').reduce((sum, item) => sum + item.amount, 0))} icon={ShoppingBag} /><StatCard label="Digital" value={currency(demo.transactions.filter((item) => item.method !== 'Cash').reduce((sum, item) => sum + item.amount, 0))} icon={Zap} /></div><SectionCard><DataTable columns={['Receipt', 'Customer', 'Service', 'Method', 'Amount', 'Date']}><tbody>{filtered.map((item) => <tr key={item.id}><td><strong>{item.receipt}</strong></td><td>{item.customerName}</td><td>{item.serviceName}</td><td><span className="method-label">{item.method}</span></td><td><strong>{currency(item.amount)}</strong></td><td>{humanDate(item.date)}<small className="table-sub">{item.time}</small></td></tr>)}</tbody></DataTable></SectionCard></>;
}

function BarberPage({ path }) {
  if (path === '/barber') return <BarberDashboard />;
  if (path === '/barber/appointments') return <BarberAppointments />;
  if (path === '/barber/queue') return <BarberQueue />;
  if (path === '/barber/customer-details') return <BarberCustomerDetails />;
  if (path === '/barber/service-session') return <ServiceSession />;
  if (path === '/barber/schedule') return <BarberSchedule />;
  return <BarberPerformance />;
}

function BarberDashboard() {
  const { demo } = useStore(); const current = demo.queue.find((item) => item.barberId === 'bar-marco' && item.status === 'In Service'); const next = demo.queue.find((item) => item.barberId === 'bar-marco' && item.status === 'Waiting'); const completed = demo.appointments.filter((item) => item.barberId === 'bar-marco' && item.status === 'Completed').length;
  return <><BentoStats items={[["Today's appointments", demo.appointments.filter((item) => item.barberId === 'bar-marco').length + 2, CalendarDays, 'Next at 10:30 AM'], ['Current customer', current?.customerName || 'No one yet', UserRound, current ? 'In service' : 'Chair is ready'], ['Next customer', next?.customerName || 'Queue is clear', ListOrdered, next?.serviceName || 'Take a short reset'], ['Completed services', completed + 5, CheckCircle2, '↑ 12% this month']]} /><div className="dashboard-grid two-thirds"><SectionCard title="Chair focus" action={<Link to="/barber/service-session" className="button button-dark button-small">Open session <ArrowRight size={15} /></Link>}><div className="chair-focus">{current ? <><span className="avatar avatar-lg">{current.customerName.split(' ').map((p) => p[0]).join('').slice(0, 2)}</span><div><span className="eyebrow gold">In service · {current.number}</span><h2>{current.customerName}</h2><p>{current.serviceName} · {current.estimatedMinutes || 45} min</p></div></> : <><div className="empty-illustration"><Scissors size={24} /></div><div><span className="eyebrow">Chair is ready</span><h2>Open the queue</h2><p>The next customer will appear when reception calls them in.</p></div></>}</div></SectionCard><SectionCard title="Today at a glance"><div className="mini-metrics"><span><strong>09:00</strong><small>First chair</small></span><span><strong>6</strong><small>Booked today</small></span><span><strong>4.9</strong><small>Rating</small></span></div><div className="progress-line"><span style={{ width: '68%' }} /></div><small className="muted-copy">68% of today’s scheduled chair time completed.</small></SectionCard></div><SectionCard title="Upcoming chair list"><DataTable columns={['Time', 'Customer', 'Service', 'Status', '']}><tbody>{demo.appointments.filter((item) => item.barberId === 'bar-marco').map((item) => <tr key={item.id}><td><strong>{item.time}</strong></td><td>{item.customerName}</td><td>{item.serviceName}</td><td><StatusBadge status={item.status} /></td><td><Link className="text-link" to="/barber/customer-details">Details <ArrowRight size={14} /></Link></td></tr>)}</tbody></DataTable></SectionCard></>;
}

function BarberAppointments() { const { demo } = useStore(); return <><Toolbar title="Your bookings" count={demo.appointments.filter((item) => item.barberId === 'bar-marco').length} action={<Link className="button button-ghost button-small" to="/barber/schedule"><CalendarClock size={15} /> View schedule</Link>} /><SectionCard><DataTable columns={['Time', 'Customer', 'Service', 'Status', 'Action']}><tbody>{demo.appointments.filter((item) => item.barberId === 'bar-marco').map((item) => <tr key={item.id}><td><strong>{item.time}</strong><small className="table-sub">{humanDate(item.date)}</small></td><td><div className="table-person"><span className="avatar avatar-xs">{item.customerName.split(' ').map((p) => p[0]).join('').slice(0, 2)}</span><strong>{item.customerName}</strong></div></td><td>{item.serviceName}</td><td><StatusBadge status={item.status} /></td><td><Link className="button button-soft button-small" to="/barber/customer-details">Customer details</Link></td></tr>)}</tbody></DataTable></SectionCard></>; }

function BarberQueue() { const { demo, commit, notify } = useStore(); const list = demo.queue.filter((item) => item.barberId === 'bar-marco' && !['Completed', 'Removed', 'Skipped'].includes(item.status)); const start = (item) => { commit((state) => demoApi.startService(state, item.id)); notify('Service session started.'); }; return <><div className="queue-callout"><div><span className="eyebrow gold">Your queue</span><h2>{list.length ? `${list.length} customer${list.length > 1 ? 's' : ''} in line.` : 'No one is waiting.'}</h2><p>Keep each service moving with clear handoffs from reception.</p></div><Link to="/barber/service-session" className="button button-dark">Open service session <ArrowRight size={16} /></Link></div><div className="barber-queue-list">{list.map((item, index) => <div className={`barber-queue-card ${item.status === 'In Service' ? 'current' : ''}`} key={item.id}><span className="queue-number-small">{item.number}</span><span className="avatar avatar-md">{item.customerName.split(' ').map((p) => p[0]).join('').slice(0, 2)}</span><div><span className="eyebrow">{index === 0 ? 'Now / next' : `In line · ${index}`}</span><h3>{item.customerName}</h3><p>{item.serviceName}</p></div><StatusBadge status={item.status} />{item.status === 'Waiting' && <button className="button button-dark button-small" onClick={() => start(item)}>Start</button>}</div>)}{!list.length && <EmptyState title="The queue is clear" copy="Reception will add customers here as they arrive." />}</div></>; }

function BarberCustomerDetails() { const { demo } = useStore(); const customer = demo.customers.find((item) => item.id === 'cust-demo'); const current = demo.queue.find((item) => item.barberId === 'bar-marco' && !['Completed', 'Removed', 'Skipped'].includes(item.status)); return <div className="detail-page"><div className="detail-hero"><span className="avatar avatar-xl">{customer?.initials}</span><div><span className="eyebrow gold">Customer profile</span><h2>{customer?.name}</h2><p>{customer?.phone} · {customer?.email}</p></div><Link to="/barber/service-session" className="button button-dark">Service session <ArrowRight size={16} /></Link></div><div className="detail-columns"><SectionCard title="Current requested service"><div className="requested-service"><span className="service-icon"><Scissors size={19} /></span><div><strong>{current?.serviceName || 'Signature Fade'}</strong><small>{current ? `${current.number} · Waiting in your queue` : 'No active queue item'}</small></div></div></SectionCard><SectionCard title="Preferences & notes"><p className="detail-quote">“{customer?.preferences || 'No preferences added.'}”</p><p className="muted-copy">{customer?.notes || 'No notes added for this customer.'}</p></SectionCard></div><SectionCard title="Previous services"><DataTable columns={['Date', 'Service', 'Amount', 'Status']}><tbody>{demo.appointments.filter((item) => item.customerId === customer?.id).map((item) => <tr key={item.id}><td>{humanDate(item.date)}</td><td>{item.serviceName}</td><td>{currency(item.price)}</td><td><StatusBadge status={item.status} /></td></tr>)}</tbody></DataTable></SectionCard></div>; }

function ServiceSession() { const { demo, commit, notify } = useStore(); const current = demo.queue.find((item) => item.barberId === 'bar-marco' && !['Completed', 'Removed', 'Skipped'].includes(item.status)); const [notes, setNotes] = useState(current?.notes || ''); const act = () => { if (!current) return notify('No active queue customer.', 'error'); if (current.status === 'Waiting') { commit((state) => demoApi.startService(state, current.id)); notify('Service started.'); } else if (current.status === 'In Service') { commit((state) => demoApi.completeService(state, current.id, notes)); notify('Service completed and sent to checkout.'); } }; return <div className="session-layout"><div className="session-stage"><div className="session-top"><span className="eyebrow gold">Live service session</span><StatusBadge status={current?.status || 'Waiting'} /></div>{current ? <><div className="session-client"><span className="avatar avatar-xl">{current.customerName.split(' ').map((p) => p[0]).join('').slice(0, 2)}</span><span><small>{current.number} · {current.barberName}</small><h2>{current.customerName}</h2><p>{current.serviceName}</p></span></div><div className="session-timer"><Clock3 size={20} /><span>{current.status === 'In Service' ? 'Service is in progress' : 'Ready to start the service'}</span></div><label className="field-label">Service notes<textarea className="input textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add finish, preferences, or handoff notes..." /></label><button className="button button-dark button-large button-full" onClick={act}>{current.status === 'Waiting' ? 'Start service' : 'Complete service'} <CheckCircle2 size={18} /></button></> : <EmptyState title="No service selected" copy="Open a customer from your queue to begin." action={<Link className="button button-dark" to="/barber/queue">Open queue</Link>} />}</div><aside className="session-aside"><span className="eyebrow">Session checklist</span><div className={`checklist-row ${current?.status !== 'Waiting' ? 'done' : ''}`}><span><Check size={14} /></span><div><strong>Customer called</strong><small>Confirm the requested service.</small></div></div><div className={`checklist-row ${current?.status === 'In Service' || current?.status === 'Completed' ? 'done' : ''}`}><span><Scissors size={14} /></span><div><strong>Service in progress</strong><small>Keep finish notes in the handoff.</small></div></div><div className="checklist-row"><span><WalletCards size={14} /></span><div><strong>Reception checkout</strong><small>Payment appears after completion.</small></div></div></aside></div>; }

function BarberSchedule() { return <><div className="schedule-header"><div><span className="eyebrow">Week of October 12</span><h2>My schedule</h2></div><div className="segmented"><button className="active">Agenda</button><button>Week</button></div></div><div className="agenda-list">{['Monday, Oct 12', 'Tuesday, Oct 13', 'Wednesday, Oct 14'].map((day, index) => <div className="agenda-day" key={day}><div className="agenda-date"><strong>{day.split(',')[0]}</strong><span>{day.split(',')[1]}</span></div><div className="agenda-events"><div className="agenda-event"><span className="event-time">9:00 AM</span><span><strong>{index === 0 ? 'Open chair' : 'Working hours'}</strong><small>{index === 0 ? 'Available for walk-ins' : '9:00 AM – 8:00 PM'}</small></span><span className="event-status available">Available</span></div><div className="agenda-event booked"><span className="event-time">10:30 AM</span><span><strong>{index === 0 ? 'Miguel Santos' : 'Reserved slot'}</strong><small>{index === 0 ? 'Signature Fade' : 'Online booking'}</small></span><span className="event-status">Booked</span></div><div className="agenda-event break"><span className="event-time">1:00 PM</span><span><strong>Break</strong><small>Chair reset</small></span><span className="event-status">Unavailable</span></div></div></div>)}</div></>; }

function BarberPerformance() { const { demo } = useStore(); return <><BentoStats items={[["Completed services", 36, CheckCircle2, '↑ 8% vs last month'], ['Customers served', 31, Users, '24 returning clients'], ['Average rating', '4.9', Star, 'From 18 reviews'], ['Chair utilization', '78%', TrendingUp, 'Healthy pace']]} /><div className="dashboard-grid two-thirds"><SectionCard title="Service mix"><div className="chart-bars"><span style={{ height: '82%' }}><i />Fades</span><span style={{ height: '62%' }}><i />Classic</span><span style={{ height: '48%' }}><i />Beard</span><span style={{ height: '35%' }}><i />Combos</span></div></SectionCard><SectionCard title="Customer signal"><div className="rating-summary"><strong>4.9</strong><div><span className="stars">★★★★★</span><small>18 submitted reviews</small></div></div><div className="rating-line-item"><span>5 stars</span><div><i style={{ width: '88%' }} /></div><b>16</b></div><div className="rating-line-item"><span>4 stars</span><div><i style={{ width: '36%' }} /></div><b>2</b></div></SectionCard></div></>; }

function AdminPage({ path }) {
  if (path === '/admin') return <AdminDashboard />;
  if (path === '/admin/reports') return <ReportsPage />;
  if (path === '/admin/inventory') return <InventoryPage />;
  if (path === '/admin/promotions') return <PromotionsPage />;
  if (path === '/admin/settings') return <SettingsPage />;
  const collection = path.split('/')[2];
  return <AdminManagementPage collection={collection} />;
}

function AdminDashboard() { const { demo } = useStore(); const revenue = demo.transactions.reduce((sum, item) => sum + item.amount, 0); return <><BentoStats items={[["Revenue this month", currency(revenue + 4820), TrendingUp, '↑ 14.8% vs Sep'], ['Appointments', demo.appointments.length + 24, CalendarDays, '92% completion rate'], ['Active barbers', demo.barbers.filter((item) => item.working).length, Scissors, 'All shifts covered'], ['Customers', demo.customers.length + 126, Users, '↑ 18 this week']]} /><div className="dashboard-grid two-thirds"><SectionCard title="Revenue trend" action={<Link to="/admin/reports" className="text-link">Full reports <ArrowRight size={14} /></Link>}><MiniChart /></SectionCard><SectionCard title="Queue overview"><div className="overview-ring"><div><strong>{demo.queue.filter((item) => item.status === 'Waiting').length + 8}</strong><small>in queue today</small></div></div><div className="ring-legend"><span><i className="dot gold-dot" /> Waiting <b>8</b></span><span><i className="dot dark-dot" /> In service <b>1</b></span><span><i className="dot muted-dot" /> Completed <b>24</b></span></div></SectionCard></div><div className="dashboard-grid two-thirds"><SectionCard title="Recent transactions"><DataTable columns={['Customer', 'Service', 'Amount', 'Status']}><tbody>{demo.transactions.slice(0, 4).map((item) => <tr key={item.id}><td>{item.customerName}</td><td>{item.serviceName}</td><td><strong>{currency(item.amount)}</strong></td><td><StatusBadge status={item.status} /></td></tr>)}</tbody></DataTable></SectionCard><SectionCard title="Popular services"><div className="rank-list">{demo.services.slice(0, 4).map((service, index) => <div key={service.id}><span className="rank">0{index + 1}</span><span><strong>{service.name}</strong><small>{24 - index * 4} bookings</small></span><strong>{index === 0 ? '32%' : `${21 - index * 4}%`}</strong></div>)}</div></SectionCard></div></>; }

function AdminManagementPage({ collection }) { const { demo, commit, notify } = useStore(); const config = { receptionists: { title: 'Manage receptionists', desc: 'Keep front-desk access current.', data: [{ id: 'rec-1', name: 'Bea Dizon', email: 'bea@biglanggwapo.demo', status: 'Active', access: 'Receptionist' }, { id: 'rec-2', name: 'Carlo Uy', email: 'carlo@biglanggwapo.demo', status: 'Active', access: 'Receptionist' }] }, barbers: { title: 'Manage barbers', desc: 'Profiles, specialties, shifts, and optional commission settings.', data: demo.barbers }, customers: { title: 'Manage customers', desc: 'Search accounts, history, and status.', data: demo.customers }, services: { title: 'Manage services', desc: 'Keep the menu, price, duration, and active state clear.', data: demo.services }, appointments: { title: 'Manage appointments', desc: 'All bookings across the shop.', data: demo.appointments }, schedules: { title: 'Manage schedules', desc: 'Working hours, breaks, days off, and available slots.', data: demo.barbers.map((b) => ({ ...b, schedule: 'Mon–Sun · 9:00 AM–8:00 PM' })) }, transactions: { title: 'Manage transactions', desc: 'All recorded payments and receipts.', data: demo.transactions } }; const current = config[collection] || config.customers; const [query, setQuery] = useState(''); const filtered = current.data.filter((item) => JSON.stringify(item).toLowerCase().includes(query.toLowerCase())); const toggle = (item) => { if (collection === 'barbers' || collection === 'services' || collection === 'customers') { if (window.confirm(`${item.active === false || item.status === 'Inactive' ? 'Activate' : 'Deactivate'} this record?`)) { const field = collection === 'customers' ? 'status' : collection === 'barbers' ? 'working' : 'active'; commit((state) => demoApi.toggleActive(state, collection, item.id, field)); notify('Record status updated.'); } } }; return <><Toolbar title={current.title} description={current.desc} count={filtered.length} query={query} setQuery={setQuery} action={<button className="button button-dark button-small" onClick={() => notify('Create form opened in this demo build.')}><Plus size={15} /> Add new</button>} /><SectionCard><DataTable columns={collection === 'services' ? ['Service', 'Category', 'Price', 'Duration', 'Status', ''] : collection === 'appointments' ? ['Customer', 'Service', 'Date', 'Barber', 'Status', ''] : collection === 'transactions' ? ['Receipt', 'Customer', 'Method', 'Amount', 'Date', ''] : ['Name / record', 'Details', 'Status', 'Last updated', '']}><tbody>{filtered.map((item) => <tr key={item.id}><td><div className="table-person"><span className="avatar avatar-xs">{(item.initials || item.name || item.customerName || item.receipt || 'BG').slice(0, 2).toUpperCase()}</span><span><strong>{item.name || item.customerName || item.receipt}</strong><small>{item.email || item.description || item.serviceName || item.category || item.access || ''}</small></span></div></td><td>{collection === 'services' ? item.category : collection === 'appointments' ? item.serviceName : collection === 'transactions' ? item.method : collection === 'schedules' ? item.schedule : item.phone || item.specialty || item.email || '—'}</td><td>{collection === 'services' ? currency(item.price) : collection === 'appointments' ? humanDate(item.date) : collection === 'transactions' ? currency(item.amount) : <StatusBadge status={item.status || (item.active || item.working ? 'Active' : 'Inactive')} />}</td><td>{collection === 'services' ? `${item.duration} min` : collection === 'appointments' ? <StatusBadge status={item.status} /> : collection === 'transactions' ? humanDate(item.date) : item.lastVisit || 'Today'}</td><td><div className="row-actions"><button className="icon-button" title="Edit" onClick={() => notify('Edit form opened in this demo build.')}><Pencil size={16} /></button>{['barbers', 'services', 'customers'].includes(collection) && <button className="button button-soft button-small" onClick={() => toggle(item)}>{item.active === false || item.status === 'Inactive' ? 'Activate' : 'Deactivate'}</button>}</div></td></tr>)}</tbody></DataTable>{!filtered.length && <EmptyState title="No records match" copy="Try a different search phrase." />}</SectionCard></>; }

function ReportsPage() { const { demo, notify } = useStore(); return <><Toolbar title="Reports & analytics" description="A practical read on revenue, bookings, and the team." action={<button className="button button-dark button-small" onClick={() => notify('Mock CSV export downloaded.')}><Download size={15} /> Export CSV</button>} /><div className="dashboard-grid two-thirds"><SectionCard title="Revenue trend"><MiniChart tall /></SectionCard><SectionCard title="Payment method breakdown"><div className="donut-card"><div className="donut"><strong>₱{(demo.transactions.reduce((sum, item) => sum + item.amount, 0) / 1000).toFixed(1)}k</strong><small>total demo sales</small></div><div className="donut-legend"><span><i className="dot gold-dot" /> Cash <b>48%</b></span><span><i className="dot dark-dot" /> GCash <b>36%</b></span><span><i className="dot muted-dot" /> Card <b>16%</b></span></div></div></SectionCard></div><div className="dashboard-grid three"><SectionCard title="Appointment trends"><div className="big-metric">92%<small>completion rate</small></div><div className="progress-line"><span style={{ width: '92%' }} /></div></SectionCard><SectionCard title="Popular service"><div className="big-metric">Fade<small>32% of bookings</small></div><div className="progress-line"><span style={{ width: '74%' }} /></div></SectionCard><SectionCard title="Barber performance"><div className="big-metric">Marco<small>4.9 average rating</small></div><div className="progress-line"><span style={{ width: '89%' }} /></div></SectionCard></div></>; }

function InventoryPage() {
  const { demo, commit, notify } = useStore();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isAdding, setIsAdding] = useState(false);
  const [isStockingIn, setIsStockingIn] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [addForm, setAddForm] = useState({
    name: '',
    category: 'Products for Sale',
    cost: '',
    stock: '',
    unit: 'jars',
    threshold: 5,
    notes: ''
  });

  const [stockInForm, setStockInForm] = useState({
    itemId: '',
    quantity: 5,
    note: ''
  });

  const normalizeCat = (cat) => {
    if (!cat) return 'Products for Sale';
    const c = String(cat).toLowerCase();
    if (c.includes('product') || c.includes('retail') || c.includes('sale') || c.includes('binebenta')) return 'Products for Sale';
    if (c.includes('tool')) return 'Barber Tools';
    if (c.includes('furnitur') || c.includes('chair') || c.includes('mirror') || c.includes('sofa') || c.includes('basin') || c.includes('trolley')) return 'Shop Furniture';
    if (c.includes('accessor') || c.includes('cape') || c.includes('apron') || c.includes('duster') || c.includes('spray') || c.includes('jar')) return 'Accessories';
    if (c.includes('consum') || c.includes('suppl') || c.includes('strip') || c.includes('towel') || c.includes('blade')) return 'Consumable';
    return cat;
  };

  const getCategoryBadge = (cat) => {
    const norm = normalizeCat(cat);
    if (norm === 'Products for Sale') return { cls: 'category-badge sale', label: 'Products for Sale', icon: ShoppingBag };
    if (norm === 'Barber Tools') return { cls: 'category-badge tool', label: 'Barber Tools', icon: Scissors };
    if (norm === 'Shop Furniture') return { cls: 'category-badge furniture', label: 'Shop Furniture', icon: Layers };
    if (norm === 'Accessories') return { cls: 'category-badge accessory', label: 'Accessories', icon: Tag };
    return { cls: 'category-badge consumable', label: 'Consumable', icon: Package };
  };

  // Live Counts
  const retailItems = demo.inventory.filter((item) => normalizeCat(item.category) === 'Products for Sale');
  const toolItems = demo.inventory.filter((item) => normalizeCat(item.category) === 'Barber Tools');
  const furnitureItems = demo.inventory.filter((item) => normalizeCat(item.category) === 'Shop Furniture');
  const accessoryItems = demo.inventory.filter((item) => normalizeCat(item.category) === 'Accessories');
  const consumableItems = demo.inventory.filter((item) => normalizeCat(item.category) === 'Consumable');
  const lowStockItems = demo.inventory.filter((item) => item.stock <= item.threshold);

  const retailTotalUnits = retailItems.reduce((sum, item) => sum + (Number(item.stock) || 0), 0);
  const toolsTotalUnits = toolItems.reduce((sum, item) => sum + (Number(item.stock) || 0), 0);
  const furnitureTotalUnits = furnitureItems.reduce((sum, item) => sum + (Number(item.stock) || 0), 0);

  // Filtered Items
  const filtered = demo.inventory.filter((item) => {
    const norm = normalizeCat(item.category);
    if (selectedCategory !== 'All' && norm !== selectedCategory) return false;
    if (statusFilter === 'Low stock' && item.stock > item.threshold) return false;
    if (statusFilter === 'In stock' && item.stock <= item.threshold) return false;
    if (query) {
      const q = query.toLowerCase();
      const match = `${item.name} ${item.category} ${item.notes || ''} ${item.unit}`.toLowerCase();
      if (!match.includes(q)) return false;
    }
    return true;
  });

  const handleOpenAdd = (categoryDefault) => {
    setAddForm({
      name: '',
      category: categoryDefault || (selectedCategory !== 'All' ? selectedCategory : 'Products for Sale'),
      cost: '',
      stock: 10,
      unit: categoryDefault === 'Barber Tools' || categoryDefault === 'Shop Furniture' ? 'units' : 'jars',
      threshold: 5,
      notes: ''
    });
    setIsAdding(true);
  };

  const submitAdd = (e) => {
    e.preventDefault();
    if (!addForm.name.trim()) return notify('Item name is required.', 'error');
    if (!addForm.cost || Number(addForm.cost) < 0) return notify('Valid price/cost is required.', 'error');

    const newItem = {
      name: addForm.name.trim(),
      category: addForm.category,
      cost: Number(addForm.cost),
      stock: Number(addForm.stock) || 0,
      unit: addForm.unit || 'units',
      threshold: Number(addForm.threshold) || 1,
      notes: addForm.notes.trim()
    };

    commit((state) => demoApi.addItem(state, 'inventory', newItem));
    notify(`"${newItem.name}" added to ${newItem.category}!`);
    setIsAdding(false);
    if (selectedCategory !== 'All' && selectedCategory !== newItem.category) {
      setSelectedCategory(newItem.category);
    }
  };

  const submitStockIn = (e) => {
    e.preventDefault();
    const targetItem = demo.inventory.find((i) => i.id === (stockInForm.itemId || demo.inventory[0]?.id));
    if (!targetItem) return notify('Select an item to restock.', 'error');
    const qty = Number(stockInForm.quantity) || 0;
    if (qty <= 0) return notify('Enter quantity greater than 0.', 'error');

    commit((state) => demoApi.updateItem(state, 'inventory', targetItem.id, { stock: targetItem.stock + qty }));
    notify(`Stock updated: +${qty} ${targetItem.unit} added to ${targetItem.name}.`);
    setIsStockingIn(false);
  };

  const submitEdit = (e) => {
    e.preventDefault();
    if (!editingItem) return;
    commit((state) => demoApi.updateItem(state, 'inventory', editingItem.id, {
      name: editingItem.name,
      category: editingItem.category,
      cost: Number(editingItem.cost),
      stock: Number(editingItem.stock),
      unit: editingItem.unit,
      threshold: Number(editingItem.threshold),
      notes: editingItem.notes
    }));
    notify(`Updated "${editingItem.name}".`);
    setEditingItem(null);
  };

  const deleteItem = (item) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}" from inventory?`)) {
      commit((state) => demoApi.deleteItem(state, 'inventory', item.id));
      notify(`Deleted "${item.name}" from inventory.`);
    }
  };

  const quickStockIn = (item, amount = 5) => {
    commit((state) => demoApi.updateItem(state, 'inventory', item.id, { stock: item.stock + amount }));
    notify(`+${amount} ${item.unit} added to ${item.name}.`);
  };

  const categoryDescriptions = {
    'All': 'Complete shop inventory covering retail products for sale, tools, furniture, accessories, and consumables.',
    'Products for Sale': 'Retail Products for Sale (Binebenta na Products): Hair clays, pomades, beard oils, and shampoos displayed for clients to purchase.',
    'Barber Tools': 'Barber Tools: Professional clippers, detail trimmers, Japanese shears, hair dryers, and electric razors used at barber stations.',
    'Shop Furniture': 'Shop Furniture: Physical salon fixtures including hydraulic chairs, LED station mirrors, waiting leather couches, and wash basins.',
    'Accessories': 'Accessories: Workwear and shop accessories such as cutting capes, leather aprons, neck dusters, mist sprays, and Barbicide jars.',
    'Consumable': 'Consumables & Supplies: Daily supplies such as neck strips, hot towel laundry bundles, and double-edge razor blades.'
  };

  return (
    <>
      <BentoStats
        items={[
          ['Products for Sale', `${retailItems.length} items (${retailTotalUnits} pcs)`, ShoppingBag, 'Retail goods sold in shop'],
          ['Barber Tools', `${toolItems.length} items (${toolsTotalUnits} units)`, Scissors, 'Clippers, trimmers & shears'],
          ['Shop Furniture', `${furnitureItems.length} items (${furnitureTotalUnits} units)`, Layers, 'Chairs, mirrors & fixtures'],
          ['Low Stock Alerts', `${lowStockItems.length} items`, AlertTriangle, lowStockItems.length ? 'Reorder needed soon' : 'All levels healthy']
        ]}
      />

      <Toolbar
        title="Inventory & Asset Management"
        description="Separated sections for retail products, barber tools, furniture, accessories, and consumables."
        count={filtered.length}
        query={query}
        setQuery={setQuery}
        filter={statusFilter}
        setFilter={setStatusFilter}
        filters={['All', 'Low stock', 'In stock']}
        filterLabels={{ 'All': 'All Status', 'Low stock': 'Low Stock', 'In stock': 'In Stock' }}
        action={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="button button-dark button-small"
              onClick={() => handleOpenAdd(selectedCategory !== 'All' ? selectedCategory : 'Products for Sale')}
              title="Add a retail product or shop asset"
            >
              <Plus size={15} /> Add product / item
            </button>
            <button
              className="button button-ghost button-small"
              onClick={() => {
                setStockInForm({ itemId: demo.inventory[0]?.id || '', quantity: 5, note: '' });
                setIsStockingIn(true);
              }}
            >
              <RefreshCcw size={14} /> Record stock-in
            </button>
          </div>
        }
      />

      {/* Category Tabs */}
      <div className="tabs inventory-tabs">
        {[
          { key: 'All', label: 'All Items', count: demo.inventory.length },
          { key: 'Products for Sale', label: 'Products for Sale', count: retailItems.length },
          { key: 'Barber Tools', label: 'Barber Tools', count: toolItems.length },
          { key: 'Shop Furniture', label: 'Shop Furniture', count: furnitureItems.length },
          { key: 'Accessories', label: 'Accessories', count: accessoryItems.length },
          { key: 'Consumable', label: 'Consumables', count: consumableItems.length }
        ].map((tab) => (
          <button
            key={tab.key}
            className={selectedCategory === tab.key ? 'active' : ''}
            onClick={() => setSelectedCategory(tab.key)}
          >
            {tab.label} <span>{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="inventory-callout">
        <div>{categoryDescriptions[selectedCategory] || categoryDescriptions['All']}</div>
        <button
          className="button button-soft button-small"
          style={{ marginLeft: 'auto', flexShrink: 0 }}
          onClick={() => handleOpenAdd(selectedCategory !== 'All' ? selectedCategory : 'Products for Sale')}
        >
          <Plus size={14} /> Add to {selectedCategory === 'All' ? 'Inventory' : selectedCategory}
        </button>
      </div>

      <SectionCard>
        <DataTable columns={['Item & Details', 'Category', 'Current Stock', 'Alert Threshold', 'Status', 'Actions']}>
          <tbody>
            {filtered.map((item) => {
              const badge = getCategoryBadge(item.category);
              const BadgeIcon = badge.icon;
              const isSale = normalizeCat(item.category) === 'Products for Sale';
              return (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ fontSize: '13px' }}>{item.name}</strong>
                      <span style={{ fontSize: '11px', color: isSale ? 'var(--gold)' : 'var(--muted)', fontWeight: isSale ? 600 : 400 }}>
                        {isSale ? 'Retail price: ' : 'Cost: '}{currency(item.cost)} per {item.unit.replace(/s$/, '')}
                      </span>
                      {item.notes && <small style={{ color: '#888', fontSize: '10px', marginTop: '2px' }}>{item.notes}</small>}
                    </div>
                  </td>
                  <td>
                    <span className={badge.cls}>
                      <BadgeIcon size={12} /> {badge.label}
                    </span>
                  </td>
                  <td>
                    <strong style={{ fontSize: '13px' }}>{item.stock} {item.unit}</strong>
                  </td>
                  <td>
                    <span style={{ color: 'var(--muted)', fontSize: '12px' }}>{item.threshold} {item.unit}</span>
                  </td>
                  <td>
                    {item.stock <= item.threshold ? (
                      <StatusBadge status="Low stock" />
                    ) : (
                      <StatusBadge status="In stock" />
                    )}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="button button-soft button-small"
                        onClick={() => quickStockIn(item, 5)}
                        title="Quickly add 5 units"
                      >
                        +5 Stock
                      </button>
                      <button
                        className="icon-button"
                        onClick={() => setEditingItem({ ...item })}
                        title="Edit item details"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="icon-button"
                        style={{ color: 'var(--red)' }}
                        onClick={() => deleteItem(item)}
                        title="Delete item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
        {!filtered.length && (
          <EmptyState
            icon={Package}
            title="No items found"
            copy={`No items match in ${selectedCategory === 'All' ? 'inventory' : selectedCategory}. You can add one using the button below.`}
            action={
              <button
                className="button button-dark"
                onClick={() => handleOpenAdd(selectedCategory !== 'All' ? selectedCategory : 'Products for Sale')}
              >
                <Plus size={15} /> Add new {selectedCategory === 'All' ? 'item' : selectedCategory}
              </button>
            }
          />
        )}
      </SectionCard>

      {/* Modal: Add New Product / Asset */}
      {isAdding && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setIsAdding(false)}>
          <div className="modal-card">
            <button className="modal-close" onClick={() => setIsAdding(false)} aria-label="Close dialog">
              <X size={18} />
            </button>
            <div className="modal-heading">
              <div className="modal-mark"><Plus size={20} /></div>
              <span className="eyebrow gold">New inventory item</span>
              <h2>Add to Inventory</h2>
              <p>Add retail products for sale, barber tools, furniture, or shop accessories.</p>
            </div>
            <form className="form-stack" onSubmit={submitAdd}>
              <label className="field-label">Category
                <select
                  className="input"
                  value={addForm.category}
                  onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                >
                  <option value="Products for Sale">Products for Sale (Retail - binebenta sa customers)</option>
                  <option value="Barber Tools">Barber Tools (Clippers, trimmers, shears, dryers)</option>
                  <option value="Shop Furniture">Shop Furniture (Chairs, mirrors, sofas, basins)</option>
                  <option value="Accessories">Accessories (Capes, aprons, spray bottles, jars)</option>
                  <option value="Consumable">Consumables & Supplies (Neck strips, towels, blades)</option>
                </select>
              </label>

              <label className="field-label">Item name
                <input
                  className="input"
                  required
                  placeholder={addForm.category === 'Products for Sale' ? 'e.g. Matte Clay, Pomade, Beard Oil' : addForm.category === 'Barber Tools' ? 'e.g. Wahl Cordless Clipper' : 'e.g. Hydraulic Barber Chair'}
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                />
              </label>

              <div className="form-grid">
                <label className="field-label">
                  {addForm.category === 'Products for Sale' ? 'Selling Price (₱)' : 'Cost / Price (₱)'}
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="1"
                    required
                    placeholder="180"
                    value={addForm.cost}
                    onChange={(e) => setAddForm({ ...addForm, cost: e.target.value })}
                  />
                </label>
                <label className="field-label">Initial stock
                  <input
                    className="input"
                    type="number"
                    min="0"
                    required
                    placeholder="10"
                    value={addForm.stock}
                    onChange={(e) => setAddForm({ ...addForm, stock: e.target.value })}
                  />
                </label>
              </div>

              <div className="form-grid">
                <label className="field-label">Unit of measurement
                  <select
                    className="input"
                    value={addForm.unit}
                    onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
                  >
                    <option value="jars">jars</option>
                    <option value="bottles">bottles</option>
                    <option value="cans">cans</option>
                    <option value="tubes">tubes</option>
                    <option value="units">units</option>
                    <option value="pairs">pairs</option>
                    <option value="pcs">pcs</option>
                    <option value="packs">packs</option>
                    <option value="bundles">bundles</option>
                    <option value="boxes">boxes</option>
                  </select>
                </label>
                <label className="field-label">Low stock threshold
                  <input
                    className="input"
                    type="number"
                    min="1"
                    required
                    placeholder="5"
                    value={addForm.threshold}
                    onChange={(e) => setAddForm({ ...addForm, threshold: e.target.value })}
                  />
                </label>
              </div>

              <label className="field-label">Description / notes (optional)
                <input
                  className="input"
                  placeholder="e.g. Strong hold matte finish, 100g jar"
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                />
              </label>

              <button className="button button-dark button-full" type="submit">
                Add item to inventory <Check size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Stock-in */}
      {isStockingIn && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setIsStockingIn(false)}>
          <div className="modal-card">
            <button className="modal-close" onClick={() => setIsStockingIn(false)} aria-label="Close dialog">
              <X size={18} />
            </button>
            <div className="modal-heading">
              <div className="modal-mark"><RefreshCcw size={20} /></div>
              <span className="eyebrow gold">Stock management</span>
              <h2>Record Stock-in</h2>
              <p>Receive new shipments or restock existing items.</p>
            </div>
            <form className="form-stack" onSubmit={submitStockIn}>
              <label className="field-label">Select item to restock
                <select
                  className="input"
                  value={stockInForm.itemId || demo.inventory[0]?.id}
                  onChange={(e) => setStockInForm({ ...stockInForm, itemId: e.target.value })}
                >
                  {demo.inventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.stock} {item.unit} in stock) · {item.category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field-label">Quantity to add
                <input
                  className="input"
                  type="number"
                  min="1"
                  required
                  value={stockInForm.quantity}
                  onChange={(e) => setStockInForm({ ...stockInForm, quantity: e.target.value })}
                />
              </label>

              <label className="field-label">Stock-in notes (optional)
                <input
                  className="input"
                  placeholder="e.g. Supplier delivery PO-2026, restock"
                  value={stockInForm.note}
                  onChange={(e) => setStockInForm({ ...stockInForm, note: e.target.value })}
                />
              </label>

              <button className="button button-dark button-full" type="submit">
                Confirm stock-in <Check size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Item */}
      {editingItem && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setEditingItem(null)}>
          <div className="modal-card">
            <button className="modal-close" onClick={() => setEditingItem(null)} aria-label="Close dialog">
              <X size={18} />
            </button>
            <div className="modal-heading">
              <div className="modal-mark"><Pencil size={20} /></div>
              <span className="eyebrow gold">Edit inventory</span>
              <h2>Edit Item Details</h2>
              <p>Update item name, category, pricing, or stock threshold.</p>
            </div>
            <form className="form-stack" onSubmit={submitEdit}>
              <label className="field-label">Item name
                <input
                  className="input"
                  required
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                />
              </label>

              <label className="field-label">Category
                <select
                  className="input"
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                >
                  <option value="Products for Sale">Products for Sale (Retail - binebenta)</option>
                  <option value="Barber Tools">Barber Tools</option>
                  <option value="Shop Furniture">Shop Furniture</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Consumable">Consumable</option>
                </select>
              </label>

              <div className="form-grid">
                <label className="field-label">Price / Cost (₱)
                  <input
                    className="input"
                    type="number"
                    min="0"
                    required
                    value={editingItem.cost}
                    onChange={(e) => setEditingItem({ ...editingItem, cost: e.target.value })}
                  />
                </label>
                <label className="field-label">Current stock
                  <input
                    className="input"
                    type="number"
                    min="0"
                    required
                    value={editingItem.stock}
                    onChange={(e) => setEditingItem({ ...editingItem, stock: e.target.value })}
                  />
                </label>
              </div>

              <div className="form-grid">
                <label className="field-label">Unit
                  <input
                    className="input"
                    required
                    value={editingItem.unit}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                  />
                </label>
                <label className="field-label">Threshold
                  <input
                    className="input"
                    type="number"
                    min="1"
                    required
                    value={editingItem.threshold}
                    onChange={(e) => setEditingItem({ ...editingItem, threshold: e.target.value })}
                  />
                </label>
              </div>

              <label className="field-label">Notes
                <input
                  className="input"
                  value={editingItem.notes || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                />
              </label>

              <button className="button button-dark button-full" type="submit">
                Save changes <Check size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function PromotionsPage() { const { demo, commit, notify } = useStore(); return <><Toolbar title="Promotions & discounts" description="Active offers are automatically featured on the public homepage." action={<button className="button button-dark button-small" onClick={() => notify('Promotion form opened in this demo build.')}><Plus size={15} /> Create promotion</button>} /><div className="promo-admin-grid">{demo.promotions.map((promo) => <div className={`promo-admin-card ${promo.active ? 'active' : ''}`} key={promo.id}><div className="promo-admin-top"><span className="promo-symbol"><Tag size={18} /></span><StatusBadge status={promo.active ? 'Active' : 'Inactive'} /></div><span className="eyebrow">{promo.type} discount</span><h2>{promo.title}</h2><p>{promo.description}</p><div className="promo-admin-meta"><span><small>Value</small><strong>{promo.type === 'Percentage' ? `${promo.value}%` : currency(promo.value)}</strong></span><span><small>Validity</small><strong>{promo.validFrom} → {promo.validTo}</strong></span></div><button className="button button-ghost button-small" onClick={() => { commit((state) => demoApi.toggleActive(state, 'promotions', promo.id)); notify('Promotion status updated.'); }}>{promo.active ? 'Deactivate' : 'Activate'} <ArrowRight size={14} /></button></div>)}</div></>; }

function SettingsPage() { const { demo, commit, notify } = useStore(); const [form, setForm] = useState(demo.settings); const save = (e) => { e.preventDefault(); commit((state) => demoApi.saveSettings(state, form)); notify('System settings saved.'); }; return <form className="settings-layout" onSubmit={save}><SectionCard title="Shop details" description="The public site uses these settings for contact and hours."><div className="form-grid"><label className="field-label">Shop name<input className="input" value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} /></label><label className="field-label">Phone<input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label><label className="field-label">Email<input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label className="field-label">Opening hours<input className="input" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} /></label></div><label className="field-label">Address<input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label></SectionCard><SectionCard title="Booking & checkout"><div className="form-grid"><label className="field-label">Slot interval<select className="input" value={form.slotInterval} onChange={(e) => setForm({ ...form, slotInterval: Number(e.target.value) })}><option value="15">15 minutes</option><option value="30">30 minutes</option></select></label><label className="field-label">Payment methods<input className="input" value={form.paymentMethods.join(', ')} onChange={(e) => setForm({ ...form, paymentMethods: e.target.value.split(',').map((x) => x.trim()) })} /></label></div><label className="field-label">Cancellation policy<textarea className="input textarea" value={form.cancellationPolicy} onChange={(e) => setForm({ ...form, cancellationPolicy: e.target.value })} /></label><div className="setting-row"><div><strong>Commission tracking</strong><small>Hide commission data when disabled.</small></div><button type="button" className={`toggle ${form.commissionTracking ? 'active' : ''}`} onClick={() => setForm({ ...form, commissionTracking: !form.commissionTracking })}><span /></button></div><button className="button button-dark" type="submit">Save settings <Check size={16} /></button></SectionCard></form>; }

function AuthModal() {
  const { modal, closeModal, login, notify } = useStore();
  const navigate = useNavigate();
  const dialogRef = useRef(null);
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', role: 'receptionist' });

  useEffect(() => {
    if (modal) {
      setMode(modal.type);
      if (modal.type === 'staff') {
        const defaultRole = modal.requestedRole || 'admin';
        const staffAcc = Object.values(accounts).find((a) => a.role === defaultRole) || accounts['admin@biglanggwapo.com'];
        setForm({ name: '', email: staffAcc.email, phone: '', password: staffAcc.password, confirm: '', role: defaultRole });
      } else {
        setForm({ name: '', email: '', phone: '', password: '', confirm: '', role: modal.requestedRole || 'receptionist' });
      }
      setTimeout(() => dialogRef.current?.focus(), 30);
    }
  }, [modal]);

  useEffect(() => {
    const key = (event) => {
      if (event.key === 'Escape' && modal) closeModal();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [modal, closeModal]);

  if (!modal) return null;

  const handleLoginSubmit = (event) => {
    event.preventDefault();
    const cleanEmail = form.email.trim().toLowerCase();
    const cleanPassword = form.password;

    if (!cleanEmail || !cleanPassword) {
      return notify('Email and password are required.', 'error');
    }

    const matchedAccount = accounts[cleanEmail];
    if (!matchedAccount || matchedAccount.password !== cleanPassword) {
      return notify('Invalid email or password. Please check your credentials.', 'error');
    }

    // Role check if opened from a specific role gate
    if (modal.requestedRole && matchedAccount.role !== modal.requestedRole) {
      return notify(`This account has the role "${matchedAccount.role}", not "${modal.requestedRole}". Redirecting to its panel...`, 'warning');
    }

    login(matchedAccount);

    // Redirect to respective panel or original requested destination
    if (modal.targetPath && matchedAccount.role === 'customer') {
      navigate(modal.targetPath);
    } else {
      navigate(matchedAccount.redirectPath);
    }
  };

  const submitRegister = (event) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.password) {
      return notify('Please complete all registration fields.', 'error');
    }
    if (form.password !== form.confirm) {
      return notify('Passwords do not match.', 'error');
    }
    const cleanEmail = form.email.trim().toLowerCase();
    const newCustomer = {
      email: cleanEmail,
      password: form.password,
      role: 'customer',
      name: form.name,
      initials: form.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'CU',
      customerId: `cust-${Date.now()}`,
      phone: form.phone,
      redirectPath: '/customer'
    };
    accounts[cleanEmail] = newCustomer;
    login(newCustomer);
    if (modal.targetPath) {
      navigate(modal.targetPath);
    } else {
      navigate('/customer');
    }
  };

  const fillQuickAccount = (email) => {
    const acc = accounts[email];
    if (acc) {
      setForm((prev) => ({ ...prev, email: acc.email, password: acc.password }));
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabIndex="-1" ref={dialogRef}>
        <button className="modal-close" onClick={closeModal} aria-label="Close dialog">
          <X size={18} />
        </button>

        {mode === 'recovery' ? (
          <>
            <div className="modal-heading">
              <div className="modal-mark"><Send size={20} /></div>
              <span className="eyebrow gold">Password recovery</span>
              <h2 id="modal-title">We’ll keep it in the demo.</h2>
              <p>Demo credentials are preserved in the system.</p>
            </div>
            <form className="form-stack" onSubmit={(e) => { e.preventDefault(); notify('Demo recovery confirmed.'); closeModal(); }}>
              <label className="field-label">Email
                <input className="input" type="email" required placeholder="you@biglanggwapo.com" />
              </label>
              <button className="button button-dark button-full">Confirm recovery <Check size={16} /></button>
              <button type="button" className="text-button center-button" onClick={() => setMode('login')}>Back to login</button>
            </form>
          </>
        ) : mode === 'register' ? (
          <>
            <div className="modal-heading">
              <div className="modal-mark"><img src="/logo.png" alt="Biglang Gwapo Logo" className="modal-logo-img" /></div>
              <span className="eyebrow gold">Customer account</span>
              <h2 id="modal-title">Make the chair yours.</h2>
              <p>Create an account to hold your bookings and service history.</p>
            </div>
            <form className="form-stack" onSubmit={submitRegister}>
              <label className="field-label">Full name
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Juan Dela Cruz" />
              </label>
              <label className="field-label">Email
                <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="you@biglanggwapo.com" />
              </label>
              <label className="field-label">Phone number
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required placeholder="+63 917 000 0000" />
              </label>
              <label className="field-label">Password
                <div className="password-input">
                  <input className="input" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>
              <label className="field-label">Confirm password
                <input className="input" type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required placeholder="Repeat password" />
              </label>
              <button className="button button-dark button-full">Create customer account <ArrowRight size={16} /></button>
            </form>
            <div className="modal-links">
              <button className="text-button" onClick={() => setMode('login')}>Already have an account? Log in</button>
            </div>
          </>
        ) : (
          <>
            <div className="modal-heading">
              <div className="modal-mark">
                <img src="/logo.png" alt="Biglang Gwapo Logo" className="modal-logo-img" />
              </div>
              <span className="eyebrow gold">
                {modal.requestedRole ? `${modal.requestedRole.toUpperCase()} ACCESS` : 'PORTAL LOGIN'}
              </span>
              <h2 id="modal-title">Sign in to your panel</h2>
              <p>Enter your email and password to open your respective panel.</p>
            </div>

            <form className="form-stack" onSubmit={handleLoginSubmit}>
              <label className="field-label">Email address
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="name@biglanggwapo.com"
                  autoFocus
                />
              </label>

              <label className="field-label">Password
                <div className="password-input">
                  <input
                    className="input"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>

              <button className="button button-dark button-full" type="submit">
                Sign in to panel <ArrowRight size={16} />
              </button>
            </form>

            <div className="demo-accounts-box" style={{ marginTop: '20px', padding: '14px', background: '#f8f6f2', borderRadius: '8px', border: '1px solid #e7e4dc' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888', marginBottom: '8px' }}>
                Quick Fill Demo Accounts:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {Object.entries(accounts).map(([emailKey, acc]) => (
                  <button
                    key={emailKey}
                    type="button"
                    onClick={() => fillQuickAccount(emailKey)}
                    className="button button-ghost button-small"
                    style={{ textAlign: 'left', justifyContent: 'flex-start', padding: '6px 8px', fontSize: '11px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                  >
                    <span style={{ fontWeight: '700', textTransform: 'capitalize' }}>{acc.role}</span>
                    <small style={{ color: '#777', fontSize: '10px' }}>{acc.email}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-links">
              <button className="text-button" onClick={() => setMode('recovery')}>Forgot password?</button>
              <span>·</span>
              <button className="text-button" onClick={() => setMode('register')}>Create customer account</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Toast() { const { toast } = useStore(); return toast ? <div className={`toast ${toast.tone}`} role="status"><span>{toast.tone === 'error' ? <CircleHelp size={17} /> : <CheckCircle2 size={17} />}</span>{toast.message}</div> : null; }

function PageFrame({ eyebrow, title, description, children }) { return <div className="page-frame content-width"><div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div></div>{children}</div>; }
function SectionIntro({ eyebrow, title, action, inverse = false }) { return <div className={`section-intro ${inverse ? 'inverse' : ''}`}><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2></div>{action}</div>; }
function ServiceCard({ service, index, detailed = false }) { const navigate = useNavigate(); return <article className={`service-card ${detailed ? 'detailed' : ''}`}><div className="service-card-top"><span className="service-index">0{index + 1}</span><span className="service-icon"><Scissors size={19} /></span></div><h3>{service.name}</h3><p>{service.description}</p><div className="service-meta"><strong>{currency(service.price)}</strong><span>{service.duration} min</span></div>{detailed && <button className="button button-dark button-small" onClick={() => navigate(`/booking?service=${service.id}`)}>Book this service <ArrowRight size={15} /></button>}</article>; }
function BarberCard({ barber, compact = false }) { const navigate = useNavigate(); return <article className={`barber-card ${compact ? 'compact' : ''}`}><div className="barber-card-top"><span className="avatar avatar-lg">{barber.initials}</span><span className={`availability ${barber.working ? 'online' : ''}`}><i />{barber.status}</span></div><div className="barber-card-body"><h3>{barber.name}</h3><p>{barber.specialty}</p><div className="rating-line"><span className="stars">{stars(barber.rating)}</span><strong>{barber.rating}</strong></div></div>{!compact && <><p className="barber-bio">{barber.bio}</p><button className="text-link" onClick={() => navigate('/booking')}>Choose {barber.name.split(' ')[0]} <ArrowRight size={15} /></button></>}</article>; }
function ReviewCard({ review }) { return <article className="review-card"><div className="review-top"><span className="avatar avatar-sm">{review.initials}</span><div><strong>{review.customer}</strong><small>{review.barber}</small></div><span className="stars">{stars(review.rating)}</span></div><p>“{review.comment}”</p><small className="review-date">{humanDate(review.date)}</small></article>; }
function AppointmentCard({ appointment, onCancel, onReschedule }) { return <article className="appointment-card"><div className="appointment-date"><strong>{new Date(`${appointment.date}T00:00:00`).getDate()}</strong><span>{new Date(`${appointment.date}T00:00:00`).toLocaleDateString('en-PH', { month: 'short' })}</span></div><div className="appointment-main"><div className="appointment-title"><span className="eyebrow">{appointment.time}</span><StatusBadge status={appointment.status} /></div><h3>{appointment.serviceName}</h3><p>with {appointment.barberName} · {appointment.duration} min</p></div><div className="appointment-price"><strong>{currency(appointment.price)}</strong><small>{appointment.paymentStatus}</small></div>{!['Completed', 'Cancelled'].includes(appointment.status) && <div className="appointment-actions"><button className="button button-ghost button-small" onClick={onReschedule}>Reschedule</button><button className="text-button danger-text" onClick={() => onCancel(appointment.id)}>Cancel</button></div>}</article>; }
function AppointmentRow({ appointment }) { return <div className="compact-row"><span className="time-label">{appointment.time}</span><span className="compact-row-main"><strong>{appointment.customerName}</strong><small>{appointment.serviceName} · {appointment.barberName}</small></span><StatusBadge status={appointment.status} /></div>; }
function QueueMini({ queue }) { return <div className="compact-list">{queue.filter((item) => !['Completed', 'Removed', 'Skipped'].includes(item.status)).slice(0, 4).map((item) => <div className="compact-row" key={item.id}><span className="queue-pill">{item.number}</span><span className="compact-row-main"><strong>{item.customerName}</strong><small>{item.serviceName} · {item.barberName}</small></span><StatusBadge status={item.status} /></div>)}{!queue.length && <EmptyState title="Queue is clear" copy="New arrivals will appear here." />}</div>; }
function SectionCard({ title, description, action, children }) { return <section className="section-card"><div className="section-card-head">{title && <div><h2>{title}</h2>{description && <p>{description}</p>}</div>}{action}</div>{children}</section>; }
function StatCard({ label, value, icon: CardIcon, note }) { return <div className="stat-card"><div className="stat-icon"><CardIcon size={18} /></div><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>; }
function BentoStats({ items }) { return <div className="stats-row">{items.map(([label, value, icon, note]) => <StatCard key={label} label={label} value={value} icon={icon} note={note} />)}</div>; }
function Toolbar({ title, description, count, query, setQuery, filter, setFilter, filters, filterLabels = {}, action }) { return <div className="toolbar"><div><div className="eyebrow">Operations</div><h2>{title}{typeof count === 'number' && <span className="count-badge">{count}</span>}</h2>{description && <p>{description}</p>}</div><div className="toolbar-actions">{setQuery && <div className="inline-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" /></div>}{setFilter && <div className="filter-select"><Filter size={15} /><select value={filter} onChange={(e) => setFilter(e.target.value)}>{filters.map((item) => <option key={item} value={item}>{filterLabels[item] || item}</option>)}</select></div>}{action}</div></div>; }
function DataTable({ columns, children }) { return <div className="table-scroll"><table><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>{children}</table></div>; }
function StatusBadge({ status }) { const safe = String(status || 'Pending'); const slug = safe.toLowerCase().replaceAll(' ', '-'); return <span className={`status-badge ${slug}`}><i />{safe}</span>; }
function EmptyState({ icon: EmptyIcon = FileText, title, copy, action }) { return <div className="empty-state"><div className="empty-illustration"><EmptyIcon size={21} /></div><h3>{title}</h3>{copy && <p>{copy}</p>}{action}</div>; }
function MiniChart({ tall = false }) { return <div className={`mini-chart ${tall ? 'tall' : ''}`}><div className="chart-axis"><span>₱8k</span><span>₱4k</span><span>₱0</span></div><svg viewBox="0 0 640 220" preserveAspectRatio="none" aria-label="Revenue chart"><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#B88A44" stopOpacity=".26" /><stop offset="1" stopColor="#B88A44" stopOpacity="0" /></linearGradient></defs><path d="M0 185 C60 160 75 168 120 148 S190 152 220 120 S290 132 328 96 S385 112 420 79 S480 98 520 62 S590 70 640 25 V220 H0 Z" fill="url(#chartFill)" /><path d="M0 185 C60 160 75 168 120 148 S190 152 220 120 S290 132 328 96 S385 112 420 79 S480 98 520 62 S590 70 640 25" fill="none" stroke="#B88A44" strokeWidth="4" strokeLinecap="round" /></svg><div className="chart-labels"><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span></div></div>; }

export default App;
