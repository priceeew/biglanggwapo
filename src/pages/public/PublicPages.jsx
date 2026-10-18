import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, ArrowUpRight, Check, ChevronLeft, ChevronRight,
  Clock, LockKeyhole, Scissors, ShieldCheck, Sparkles, Tag, Zap, Flame, Users, TrendingUp,
  UserPlus, UserCheck, X
} from 'lucide-react';
import { useStore, currency, today, humanDate, stars } from '../../context/StoreContext';
import { promotions, staffUsers } from '../../data';
import { demoApi } from '../../mockService';
import { saveAppointmentToAtlas } from '../../services/api';
import { addSystemNotification } from '../../services/notificationService';
import { getSlotAvailability, isRestDay, isBarberOnLeave, isSameDayBookingClosed, getTomorrowDateStr, minutesToTime } from '../../utils/scheduling';
import {
  PageFrame, SectionIntro, ServiceCard, BarberCard, ReviewCard, ReviewPhotoModal
} from '../../components/common/UIComponents';

export function HomePage() {
  const { demo, session, openModal } = useStore();
  const navigate = useNavigate();
  const reviewsContainerRef = useRef(null);
  const [activePhotoModal, setActivePhotoModal] = useState(null);
  const activePromo = demo.promotions?.find((promo) => promo.active) || promotions?.[0] || null;

  const scrollReviews = (direction) => {
    if (reviewsContainerRef.current) {
      const scrollAmount = 340;
      reviewsContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <>
      <section id="home" className="hero-section content-width">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> Pulilan, Bulacan · Open daily</div>
          <h1>Good hair days<br /><em>start here.</em></h1>
          <p>Biglang Gwapo is your neighborhood chair for sharp fades, classic cuts, and the kind of service that makes you want to stay a little longer.</p>
          <div className="hero-actions">
            <button
              className="button button-dark button-large"
              onClick={() => session ? navigate('/booking') : openModal('login', { targetPath: '/booking' })}
            >
              Book your chair <ArrowRight size={18} />
            </button>
            <a href="#services" className="button button-ghost button-large">Explore services</a>
          </div>
        </div>
        <div className="hero-art">
          <div className="hero-stamp">
            <img src="/logo.png" alt="Biglang Gwapo Logo" className="hero-logo" />
            <span>EST. 2019</span>
          </div>
          <div className="hero-art-copy">
            <span>THE DAILY RITUAL</span>
            <strong>Stay sharp.<br />Stay easy.</strong>
          </div>
          <div className="hero-lines" />
        </div>
      </section>

      {activePromo && (
        <section className="promo-strip content-width">
          <div>
            <span className="eyebrow gold">Limited time offer</span>
            <h2>{activePromo.title}</h2>
            <p>{activePromo.description}</p>
          </div>
          <div className="promo-value">
            <strong>{activePromo.type === 'Percentage' ? `${activePromo.value}%` : currency(activePromo.value)}</strong>
            <span>off your visit</span>
          </div>
          <button
            className="button button-dark"
            onClick={() => {
              if (!session) {
                navigate('/booking');
                openModal('login', { targetPath: '/booking' });
              } else {
                navigate('/booking');
              }
            }}
          >
            Use offers <ArrowUpRight size={17} />
          </button>
        </section>
      )}

      <section id="services" className="section-block content-width">
        <SectionIntro
          eyebrow="Our services"
          title="The essentials, done properly."
          action={<Link to="/booking" className="text-link">View all services <ArrowRight size={15} /></Link>}
        />
        <div className="service-grid">
          {demo.services.length > 0 ? (
            demo.services.slice(0, 4).map((service, index) => (
              <ServiceCard key={service.id} service={service} index={index} />
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 20px', gridColumn: '1 / -1', background: 'var(--white)', border: '1px solid var(--line)', borderRadius: '10px' }}>
              <p style={{ color: 'var(--muted)', margin: 0 }}>No services published yet. Please add services from Admin → Services.</p>
            </div>
          )}
        </div>
      </section>

      <section id="reviews" className="section-block section-charcoal">
        <div className="content-width">
          <SectionIntro
            eyebrow="In their words"
            title="A chair worth coming back to."
            inverse
            action={
              <div className="scroll-nav-btns">
                <button className="scroll-arrow-btn" onClick={() => scrollReviews('left')} aria-label="Scroll reviews left">
                  <ChevronLeft size={18} />
                </button>
                <button className="scroll-arrow-btn" onClick={() => scrollReviews('right')} aria-label="Scroll reviews right">
                  <ChevronRight size={18} />
                </button>
              </div>
            }
          />
          <div className="reviews-scroll-container" ref={reviewsContainerRef}>
            {demo.reviews && demo.reviews.filter((r) => !r.hidden && r.public !== false).length > 0 ? (
              demo.reviews.filter((r) => !r.hidden && r.public !== false).map((review) => (
                <div className="reviews-scroll-item" key={review.id}>
                  <ReviewCard
                    review={review}
                    onImageClick={(img, rev) => setActivePhotoModal({ image: img, review: rev })}
                  />
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', width: '100%', color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
                No customer reviews yet. Reviews will appear here once submitted.
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="location" className="visit-panel content-width">
        <div>
          <div className="eyebrow">Find your way here</div>
          <h2>Pulilan, when you need a reset.</h2>
          <p>Drop by for a walk-in or book ahead. We keep the chairs moving without making the visit feel rushed.</p>
          <div className="visit-details">
            <span><strong>Address</strong>{demo.settings?.address || '180 Cutcot National Highway, Pulilan, Bulacan'}</span>
            <span><strong>Hours</strong>{demo.settings?.hours || 'Mon–Sun · 9:00 AM–8:00 PM'}</span>
            <span><strong>Contact</strong>{demo.settings?.phone || '+63 917 555 0100'}</span>
          </div>
        </div>
        <div className="map-frame-wrapper">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3855.6315022115173!2d120.85780967487896!3d14.901869885621!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33965516e729bc35%3A0xdd2f48256d4c3149!2sBIGLANG%20GWAPO%20BARBERSHOP!5e0!3m2!1sen!2sph!4v1791729866482!5m2!1sen!2sph"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            title="Biglang Gwapo Barbershop Location"
          />
        </div>
      </section>

      <ReviewPhotoModal
        modalData={activePhotoModal}
        onClose={() => setActivePhotoModal(null)}
      />
    </>
  );
}

export function ServicesPage() {
  const { demo } = useStore();
  return (
    <PageFrame
      eyebrow="Menu"
      title="Services made for the regulars."
      description="No overthinking. Pick your service, choose your barber, and we’ll take it from there."
    >
      {demo.services.length > 0 ? (
        <div className="service-list">
          {demo.services.map((service, index) => (
            <ServiceCard key={service.id} service={service} index={index} detailed />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--white)', border: '1px solid var(--line)', borderRadius: '10px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No services available yet</h3>
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Services added from Admin → Services will appear here.</p>
        </div>
      )}
    </PageFrame>
  );
}

export function BarbersPage() {
  const { demo } = useStore();
  return (
    <PageFrame
      eyebrow="The crew"
      title="Good hands, good energy."
      description="Every barber brings a different specialty to the chair. Choose the pace and finish that feels like you."
    >
      {demo.barbers.length > 0 ? (
        <div className="barber-grid public-barbers">
          {demo.barbers.map((barber) => (
            <BarberCard key={barber.id} barber={barber} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--white)', border: '1px solid var(--line)', borderRadius: '10px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No barbers registered yet</h3>
          <p style={{ color: 'var(--muted)', fontSize: '13px', maxWidth: '400px', margin: '0 auto' }}>
            New barbers will appear here once invited and added by the shop administrator.
          </p>
        </div>
      )}
    </PageFrame>
  );
}

export function BookingPage() {
  const { demo, session, commit, notify, openModal } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const defaultBookingDate = isSameDayBookingClosed() ? getTomorrowDateStr() : today;
  const [selection, setSelection] = useState({
    haircutId: '',
    shaveId: '',
    treatmentIds: [],
    barberId: '',
    date: defaultBookingDate,
    time: '',
    notes: ''
  });
  const [confirmed, setConfirmed] = useState(null);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountError, setDiscountError] = useState('');
  const [bookingFor, setBookingFor] = useState('self'); // 'self' | 'other'
  const [companionSuffix, setCompanionSuffix] = useState(null); // e.g. 2, 3...
  const [doubleBookingModalOpen, setDoubleBookingModalOpen] = useState(false);
  const [doubleBookingBarber, setDoubleBookingBarber] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  // Selected services lookup
  const haircutService = demo.services.find((item) => item.id === selection.haircutId);
  const shaveService = demo.services.find((item) => item.id === selection.shaveId);
  const treatmentServices = demo.services.filter((item) => (selection.treatmentIds || []).includes(item.id));

  const allSelectedServices = [
    ...(haircutService ? [haircutService] : []),
    ...(shaveService ? [shaveService] : []),
    ...treatmentServices
  ];

  const totalDuration = allSelectedServices.reduce((sum, item) => sum + (Number(item.duration) || 0), 0) || 45;
  const totalPrice = allSelectedServices.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const combinedServiceName = allSelectedServices.map((s) => s.name).join(' + ') || 'Service Booking';

  const discountAmount = appliedDiscount
    ? (appliedDiscount.type === 'Percentage'
        ? Math.round((totalPrice * (Number(appliedDiscount.value) || 0)) / 100)
        : Math.min(totalPrice, Number(appliedDiscount.value) || 0))
    : 0;
  const finalPrice = Math.max(0, totalPrice - discountAmount);

  const handleApplyPromo = (codeOverride) => {
    const rawCode = (codeOverride !== undefined ? codeOverride : discountCode).trim().toUpperCase();
    if (!rawCode) {
      setAppliedDiscount(null);
      setDiscountError('');
      return;
    }
    const found = (demo.promotions || []).find(
      (p) => (p.code && p.code.trim().toUpperCase() === rawCode) || (p.title && p.title.trim().toUpperCase() === rawCode)
    );
    if (!found) {
      setAppliedDiscount(null);
      setDiscountError('Invalid promo code');
      return;
    }
    if (found.active === false) {
      setAppliedDiscount(null);
      setDiscountError('This promotion is inactive');
      return;
    }
    if (found.validTo && found.validTo < today) {
      setAppliedDiscount(null);
      setDiscountError('This promo has expired');
      return;
    }
    setAppliedDiscount(found);
    setDiscountError('');
    notify(`Promo "${found.title}" applied successfully!`);
  };

  const barber = demo.barbers.find((item) => item.id === selection.barberId);

  // Calculate 100% accurate customer pick rate stats for each barber based on real database bookings
  const barberPickStats = useMemo(() => {
    const barbers = demo.barbers || [];
    const appointments = demo.appointments || [];
    const queue = demo.queue || [];
    const transactions = demo.transactions || [];

    const counts = {};
    barbers.forEach((b) => {
      counts[b.id] = 0;
    });

    // 1. Appointments (Valid non-cancelled customer bookings)
    appointments.forEach((apt) => {
      if (['Cancelled', 'No-show'].includes(apt.status)) return;
      if (apt.barberId && counts[apt.barberId] !== undefined) {
        counts[apt.barberId]++;
      } else if (apt.barberName) {
        const match = barbers.find((b) => b.name?.trim().toLowerCase() === apt.barberName?.trim().toLowerCase());
        if (match) counts[match.id]++;
      }
    });

    // 2. Queue (Walk-in entries without appointmentId to prevent double-counting)
    queue.forEach((q) => {
      if (q.appointmentId) return;
      if (['Cancelled', 'Removed', 'Skipped'].includes(q.status)) return;
      if (q.barberId && counts[q.barberId] !== undefined) {
        counts[q.barberId]++;
      } else if (q.barberName) {
        const match = barbers.find((b) => b.name?.trim().toLowerCase() === q.barberName?.trim().toLowerCase());
        if (match) counts[match.id]++;
      }
    });

    // 3. Transactions (Direct walk-in payments without appointmentId)
    transactions.forEach((tx) => {
      if (tx.appointmentId) return;
      if (tx.barberId && counts[tx.barberId] !== undefined) {
        counts[tx.barberId]++;
      } else if (tx.barberName) {
        const match = barbers.find((b) => b.name?.trim().toLowerCase() === tx.barberName?.trim().toLowerCase());
        if (match) counts[match.id]++;
      }
    });

    const totalActualChoices = Object.values(counts).reduce((a, b) => a + b, 0);

    const statsMap = {};
    let maxCount = 0;
    let topBarberId = null;

    barbers.forEach((b) => {
      const count = counts[b.id] || 0;
      const pct = totalActualChoices > 0 ? Math.round((count / totalActualChoices) * 100) : 0;

      if (count > maxCount) {
        maxCount = count;
        topBarberId = b.id;
      }

      statsMap[b.id] = {
        count,
        percentage: pct,
        isTop: false,
        badge: null,
        badgeClass: '',
        totalShopPicks: totalActualChoices
      };
    });

    // Badges assigned purely from real customer booking volume
    if (totalActualChoices > 0 && maxCount > 0) {
      barbers.forEach((b) => {
        const stat = statsMap[b.id];
        if (!stat || stat.count === 0) return;
        if (b.id === topBarberId) {
          stat.isTop = true;
          stat.badge = 'Top choice';
          stat.badgeClass = 'top-choice';
        } else if (stat.percentage >= 20 || stat.count >= 2) {
          stat.badge = 'Often chosen';
          stat.badgeClass = 'often-chosen';
        }
      });
    }

    return statsMap;
  }, [demo.barbers, demo.appointments, demo.queue, demo.transactions]);

  // Calculate 100% accurate customer ratings and review counts for each barber based on real reviews
  const barberRatingStats = useMemo(() => {
    const barbers = demo.barbers || [];
    const reviews = demo.reviews || [];

    const statsMap = {};
    barbers.forEach((b) => {
      const bReviews = reviews.filter((r) => {
        if (!r) return false;
        if (r.barberId && b.id && String(r.barberId) === String(b.id)) return true;
        if (r.barber && b.name && r.barber.trim().toLowerCase() === b.name.trim().toLowerCase()) return true;
        return false;
      });

      if (bReviews.length > 0) {
        const sum = bReviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
        const avg = sum / bReviews.length;
        const rounded = Number(avg.toFixed(1));
        statsMap[b.id] = {
          rating: rounded,
          display: rounded.toFixed(1),
          count: bReviews.length,
          hasReviews: true
        };
      } else {
        statsMap[b.id] = {
          rating: 0,
          display: 'No reviews',
          count: 0,
          hasReviews: false
        };
      }
    });
    return statsMap;
  }, [demo.barbers, demo.reviews]);
  const slotInterval = Number(demo.settings?.slotInterval) || 30;
  const slots = useMemo(() => {
    const interval = slotInterval === 15 ? 15 : 30;
    const list = [];
    for (let m = 540; m <= 1140; m += interval) {
      list.push(minutesToTime(m));
    }
    return list;
  }, [slotInterval]);

  // Safeguard & Validation: Check active bookings customer has with a specific barber
  const getActiveBookingsWithBarber = (targetBarberId, targetBarberName) => {
    if (!session) return [];
    const baseName = (session.name || '').trim().toLowerCase();
    const currentEmail = (session.email || '').trim().toLowerCase();
    const currentCustId = session.customerId;
    const cleanBarberName = (targetBarberName || barber?.name || '').trim().toLowerCase();

    return (demo.appointments || []).filter((item) => {
      const sameBarberId = targetBarberId && (item.barberId === targetBarberId || String(item.barberId) === String(targetBarberId));
      const sameBarberName = cleanBarberName && item.barberName && item.barberName.trim().toLowerCase() === cleanBarberName;
      if (!sameBarberId && !sameBarberName) return false;

      const isFinished = ['Completed', 'Cancelled', 'No-show'].includes(item.status);
      if (isFinished) return false;

      const aptCustId = item.customerId;
      const aptCustEmail = item.customerEmail ? item.customerEmail.trim().toLowerCase() : '';
      const aptCustName = item.customerName ? item.customerName.trim().toLowerCase() : '';

      const isDirectMatch = (
        (currentCustId && aptCustId && String(currentCustId) === String(aptCustId)) ||
        (currentEmail && aptCustEmail && currentEmail === aptCustEmail) ||
        (baseName && aptCustName === baseName)
      );
      if (isDirectMatch) return true;

      // Companion booking pattern e.g. "Juan Dela Cruz (2)"
      if (baseName && aptCustName.startsWith(baseName) && /\(\d+\)$/.test(aptCustName)) {
        return true;
      }

      return false;
    });
  };

  const hasActiveBookingWithBarber = (targetBarberId, targetBarberName) => {
    return getActiveBookingsWithBarber(targetBarberId, targetBarberName).length > 0;
  };

  // Determine next companion suffix: (2), (3), etc.
  const getNextCompanionSuffix = (targetBarberId, targetBarberName) => {
    const activeBookings = getActiveBookingsWithBarber(targetBarberId, targetBarberName);
    if (activeBookings.length === 0) return 2;

    let maxSuffix = 1;
    const baseName = (session?.name || '').trim();
    const escapedBase = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escapedBase}\\s*\\((\\d+)\\)$`, 'i');

    activeBookings.forEach((b) => {
      const name = (b.customerName || '').trim();
      const match = name.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxSuffix) maxSuffix = num;
      } else {
        if (maxSuffix < 1) maxSuffix = 1;
      }
    });

    return maxSuffix + 1;
  };

  const handleSelectBarber = (item) => {
    if (item.isUnavailable || item.status === 'Unavailable' || item.leaveStatus === 'Unavailable') {
      return notify(`${item.name} is currently marked as Unavailable. Please select another barber.`, 'error');
    }

    const hasActive = hasActiveBookingWithBarber(item.id, item.name);
    if (hasActive) {
      if (selection.barberId === item.id && bookingFor === 'other') {
        // Already assigned for companion with this barber
        setDoubleBookingBarber(item);
        setDoubleBookingModalOpen(true);
        return;
      }
      // Trigger double booking validation prompt
      setDoubleBookingBarber(item);
      setDoubleBookingModalOpen(true);
      return;
    }

    // Normal single booking for self
    setBookingFor('self');
    setCompanionSuffix(null);
    setSelection({ ...selection, barberId: item.id });
  };

  const handleBookAnother = () => {
    setConfirmed(null);
    setStep(1);
    setSelection({
      haircutId: '',
      shaveId: '',
      treatmentIds: [],
      barberId: '',
      date: defaultBookingDate,
      time: '',
      notes: ''
    });
    setBookingFor('self');
    setCompanionSuffix(null);
    setAppliedDiscount(null);
    setDiscountCode('');
    setDiscountError('');
  };

  const nextStep = () => {
    if (step === 1 && allSelectedServices.length === 0) {
      return notify('Please select at least one service (Haircut, Shave, or Treatment) to continue.', 'error');
    }
    if (step === 2) {
      if (!barber) return notify('Choose a barber to continue.', 'error');
      if (hasActiveBookingWithBarber(barber.id, barber.name) && bookingFor !== 'other') {
        setDoubleBookingBarber(barber);
        setDoubleBookingModalOpen(true);
        return;
      }
    }
    if (step === 3) {
      if (!selection.time) return notify('Choose an available time.', 'error');
      const slotCheck = getSlotAvailability(selection.time, totalDuration, barber, selection.date, demo.appointments);
      if (!slotCheck.available) {
        if (selection.date === today && isSameDayBookingClosed()) {
          return notify('Same-day booking is closed after 9:00 PM. Please select tomorrow or a later date.', 'error');
        }
        return notify(`Cannot select this time (${slotCheck.reason}). Please choose an available time slot.`, 'error');
      }
    }
    setStep((current) => Math.min(4, current + 1));
  };

  const confirm = () => {
    if (!session || session.role !== 'customer') return openModal('login', { targetPath: '/booking' });

    if (hasActiveBookingWithBarber(barber?.id, barber?.name) && bookingFor !== 'other') {
      setDoubleBookingBarber(barber);
      setDoubleBookingModalOpen(true);
      return;
    }

    const slotCheck = getSlotAvailability(selection.time, totalDuration, barber, selection.date, demo.appointments);
    if (!slotCheck.available) {
      if (selection.date === today && isSameDayBookingClosed()) {
        return notify('Same-day booking is closed after 9:00 PM. Please select tomorrow or a later date.', 'error');
      }
      return notify(`Cannot confirm booking (${slotCheck.reason}). Please select an available time.`, 'error');
    }

    try {
      const primaryServiceId = selection.haircutId || selection.shaveId || selection.treatmentIds[0] || 'svc-fade';
      const effectiveCustomerName = (bookingFor === 'other' && companionSuffix)
        ? `${session.name} (${companionSuffix})`
        : session.name;

      const newApt = {
        id: 'apt-' + Date.now(),
        ...selection,
        serviceId: primaryServiceId,
        customerId: session.customerId || 'cust-demo',
        customerName: effectiveCustomerName,
        customerEmail: session.email || '',
        bookingFor,
        companionSuffix: companionSuffix || null,
        serviceName: combinedServiceName,
        barberName: barber.name,
        barberImage: barber.image || '',
        duration: totalDuration,
        price: finalPrice,
        originalPrice: totalPrice,
        discountCode: appliedDiscount ? (appliedDiscount.code || appliedDiscount.title) : '',
        discountAmount,
        status: 'Pending',
        paymentStatus: 'Unpaid',
        source: 'Online',
        notes: selection.notes || ''
      };

      // Safely validate and generate state synchronously inside try/catch so any error displays gracefully
      const nextState = demoApi.createBooking(demo, newApt);
      commit(() => nextState);
      saveAppointmentToAtlas(newApt);

      // Notify the receptionist of the new booking request
      addSystemNotification({
        title: `New Booking Request: ${effectiveCustomerName}`,
        message: `${effectiveCustomerName} booked ${combinedServiceName} with ${barber.name} on ${humanDate(selection.date)} at ${selection.time}. Awaiting confirmation.`,
        type: 'pending-confirm',
        recipientRole: 'receptionist',
        actionUrl: '/receptionist/appointments',
        actionLabel: 'Review Booking',
        urgent: true
      });

      // Notify the assigned barber of the booking request with customer notes
      addSystemNotification({
        title: `New Booking Request: ${effectiveCustomerName}`,
        message: `${effectiveCustomerName} requested ${combinedServiceName} on ${humanDate(selection.date)} at ${selection.time}.${selection.notes ? ` Notes: "${selection.notes}".` : ''}`,
        type: 'info',
        recipientRole: 'barber',
        recipientId: barber.id,
        recipientName: barber.name,
        actionUrl: '/barber/appointments',
        actionLabel: 'View Schedule',
        urgent: false
      });
      setConfirmed({
        ...selection,
        customerName: effectiveCustomerName,
        serviceName: combinedServiceName,
        barberName: barber.name,
        barberImage: barber.image || '',
        price: finalPrice,
        originalPrice: totalPrice,
        discountCode: appliedDiscount ? (appliedDiscount.code || appliedDiscount.title) : '',
        discountAmount,
        duration: totalDuration,
        selectedServicesList: allSelectedServices,
        bookingFor,
        companionSuffix
      });
      notify('Your booking is ready for reception to confirm.');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  if (confirmed) {
    return (
      <PageFrame
        eyebrow="Booking confirmed"
        title="Your chair is on the board."
        description="Reception will confirm your appointment and mark you arrived upon your visit."
      >
        <div className="confirmation-card">
          <div className="confirmation-icon"><Check size={24} /></div>
          <div>
            <span className="eyebrow gold">Booking reference · BG-{confirmed.id?.slice(-6)?.toUpperCase() || 'BOOKED'}</span>
            <h2>{confirmed.serviceName}</h2>
            {confirmed.customerName && confirmed.customerName !== session?.name && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--gold-soft)', color: '#6d4e21', padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, margin: '6px 0 2px' }}>
                <Users size={12} />
                <span>Companion: {confirmed.customerName}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              {confirmed.barberImage ? (
                <img
                  src={confirmed.barberImage}
                  alt={confirmed.barberName}
                  style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--line)' }}
                />
              ) : null}
              <p style={{ margin: 0 }}>{humanDate(confirmed.date)} · {confirmed.time} with <strong>{confirmed.barberName}</strong></p>
            </div>
          </div>
          <div className="confirmation-meta">
            <span><small>Price</small><strong>{currency(confirmed.price)}</strong></span>
            <span><small>Duration</small><strong>{confirmed.duration} min</strong></span>
          </div>
          <div className="confirmation-actions">
            <Link to="/my-appointments" className="button button-dark">View appointment <ArrowRight size={16} /></Link>
            <button
              className="button button-ghost"
              onClick={handleBookAnother}
            >
              Book another
            </button>
          </div>
        </div>
      </PageFrame>
    );
  }

  return (
    <PageFrame
      eyebrow="Book your chair"
      title="A better cut starts with a clear plan."
      description="Choose a service, tell us who you want in your corner, and we’ll keep the rest simple."
    >
      <div className="booking-layout">
        <div className="booking-main">
          <div className="stepper">
            {['Service', 'Barber', 'Date & time', 'Review'].map((label, index) => (
              <div className={`step-item ${step === index + 1 ? 'active' : ''} ${step > index + 1 ? 'done' : ''}`} key={label}>
                <span>{step > index + 1 ? <Check size={14} /> : index + 1}</span>
                <small>{label}</small>
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="booking-categories-subtle-nav">
              <button
                type="button"
                className={`subtle-cat-btn ${selection.haircutId ? 'has-pick' : ''}`}
                onClick={() => {
                  const container = document.querySelector('.services-categorized-container');
                  const target = document.getElementById('sec-haircuts');
                  if (container && target) {
                    container.scrollTo({ top: target.offsetTop - container.offsetTop, behavior: 'smooth' });
                  }
                }}
              >
                {selection.haircutId ? <Check size={14} className="cat-btn-icon" /> : <Scissors size={14} className="cat-btn-icon" />}
                <span>Haircuts</span>
                {selection.haircutId && <span className="cat-btn-badge">Selected</span>}
              </button>
              <div className="subtle-cat-divider">
                <ChevronRight size={14} />
              </div>
              <button
                type="button"
                className={`subtle-cat-btn ${selection.shaveId ? 'has-pick' : ''}`}
                onClick={() => {
                  const container = document.querySelector('.services-categorized-container');
                  const target = document.getElementById('sec-shave');
                  if (container && target) {
                    container.scrollTo({ top: target.offsetTop - container.offsetTop, behavior: 'smooth' });
                  }
                }}
              >
                {selection.shaveId ? <Check size={14} className="cat-btn-icon" /> : <Sparkles size={14} className="cat-btn-icon" />}
                <span>Shave</span>
                {selection.shaveId && <span className="cat-btn-badge">Selected</span>}
              </button>
              <div className="subtle-cat-divider">
                <ChevronRight size={14} />
              </div>
              <button
                type="button"
                className={`subtle-cat-btn ${(selection.treatmentIds || []).length > 0 ? 'has-pick' : ''}`}
                onClick={() => {
                  const container = document.querySelector('.services-categorized-container');
                  const target = document.getElementById('sec-treatments');
                  if (container && target) {
                    container.scrollTo({ top: target.offsetTop - container.offsetTop, behavior: 'smooth' });
                  }
                }}
              >
                {(selection.treatmentIds || []).length > 0 ? <Check size={14} className="cat-btn-icon" /> : <Zap size={14} className="cat-btn-icon" />}
                <span>Treatment</span>
                {(selection.treatmentIds || []).length > 0 && <span className="cat-btn-badge">{(selection.treatmentIds || []).length}</span>}
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="services-categorized-container">
              {demo.services.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--white)', border: '1px solid var(--line)', borderRadius: '10px', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '6px' }}>No services currently on the menu</h3>
                  <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>Please add services via Admin → Services to begin booking.</p>
                </div>
              )}
              {/* SECTION 1: HAIRCUTS (Pick 1) */}
              <div className="service-category-group" id="sec-haircuts">
                <div className="service-category-header">
                  <div>
                    <h3>1. Haircuts <span className="category-pill single">Choose 1</span></h3>
                    <p>Select your primary haircut style or skin taper</p>
                  </div>
                    {selection.haircutId && (
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => setSelection({ ...selection, haircutId: '' })}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                <div className="choice-grid">
                  {demo.services.filter((item) => item.active && (item.category === 'Haircut' || item.category === 'Cuts')).map((item, index) => {
                    const isSelected = selection.haircutId === item.id;
                    return (
                      <button
                        type="button"
                        className={`choice-card service-booking-card ${isSelected ? 'selected' : ''}`}
                        key={item.id}
                        onClick={() => setSelection({ ...selection, haircutId: isSelected ? '' : item.id })}
                      >
                        {item.image && (
                          <div className="choice-card-media">
                            <img src={item.image} alt={item.name} loading="lazy" />
                          </div>
                        )}
                        <span className="choice-index">0{index + 1}</span>
                        <strong>{item.name}</strong>
                        <small>{item.description}</small>
                        <span className="choice-bottom">
                          <b>{currency(item.price)}</b>
                          <em>{item.duration} min</em>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: SHAVE (Pick 1) */}
              <div className="service-category-group" id="sec-shave">
                <div className="service-category-header">
                  <div>
                    <h3>2. Shave & Grooming <span className="category-pill single">Choose 1</span></h3>
                    <p>Beard sculpt, razor line-up, or hot towel ritual</p>
                  </div>
                  {selection.shaveId && (
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => setSelection({ ...selection, shaveId: '' })}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="choice-grid">
                  {demo.services.filter((item) => item.active && (item.category === 'Shave' || item.category === 'Grooming' || item.category === 'Combos')).map((item, index) => {
                    const isSelected = selection.shaveId === item.id;
                    return (
                      <button
                        type="button"
                        className={`choice-card service-booking-card ${isSelected ? 'selected' : ''}`}
                        key={item.id}
                        onClick={() => setSelection({ ...selection, shaveId: isSelected ? '' : item.id })}
                      >
                        {item.image && (
                          <div className="choice-card-media">
                            <img src={item.image} alt={item.name} loading="lazy" />
                          </div>
                        )}
                        <span className="choice-index">0{index + 1}</span>
                        <strong>{item.name}</strong>
                        <small>{item.description}</small>
                        <span className="choice-bottom">
                          <b>{currency(item.price)}</b>
                          <em>{item.duration} min</em>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 3: TREATMENTS (Pick Many) */}
              <div className="service-category-group" id="sec-treatments">
                <div className="service-category-header">
                  <div>
                    <h3>3. Treatments & Add-ons <span className="category-pill multi">Select Multiple</span></h3>
                    <p>Scalp massage, clarifying face detox, hair toning & resets</p>
                  </div>
                  {(selection.treatmentIds || []).length > 0 && (
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => setSelection({ ...selection, treatmentIds: [] })}
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="choice-grid">
                  {demo.services.filter((item) => item.active && (item.category === 'Treatment' || (!['Haircut', 'Cuts', 'Shave', 'Grooming', 'Combos'].includes(item.category)))).map((item, index) => {
                    const isSelected = (selection.treatmentIds || []).includes(item.id);
                    return (
                      <button
                        type="button"
                        className={`choice-card service-booking-card ${isSelected ? 'selected' : ''}`}
                        key={item.id}
                        onClick={() => {
                          const currentTreatments = selection.treatmentIds || [];
                          const updated = isSelected
                            ? currentTreatments.filter((id) => id !== item.id)
                            : [...currentTreatments, item.id];
                          setSelection({ ...selection, treatmentIds: updated });
                        }}
                      >
                        {item.image && (
                          <div className="choice-card-media">
                            <img src={item.image} alt={item.name} loading="lazy" />
                          </div>
                        )}
                        <span className="choice-index">0{index + 1}</span>
                        <strong>{item.name}</strong>
                        <small>{item.description}</small>
                        <span className="choice-bottom">
                          <b>{currency(item.price)}</b>
                          <em>{item.duration} min</em>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            demo.barbers.filter((item) => item.working).length > 0 ? (
              <div className="choice-grid">
                {demo.barbers.filter((item) => item.working).map((item) => {
                  const isBlocked = hasActiveBookingWithBarber(item.id, item.name);
                  const isUnavail = Boolean(item.isUnavailable || item.status === 'Unavailable' || item.leaveStatus === 'Unavailable');
                  const stats = barberPickStats[item.id] || { count: 0, percentage: 0, isTop: false, badge: null, badgeClass: '' };
                  const ratingStat = barberRatingStats[item.id] || { rating: 0, display: 'No reviews', count: 0, hasReviews: false };
                  const isSelected = selection.barberId === item.id;
                  const isCompanionPick = isSelected && bookingFor === 'other';
                  return (
                    <button
                      type="button"
                      className={`choice-card barber-choice ${isSelected ? 'selected' : ''} ${isUnavail ? 'disabled-choice' : ''}`}
                      key={item.id}
                      onClick={() => handleSelectBarber(item)}
                    >
                      <div className="barber-choice-top-row">
                        <div className="barber-choice-avatar-wrap">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="barber-choice-avatar-img"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                if (e.currentTarget.nextElementSibling) {
                                  e.currentTarget.nextElementSibling.style.display = 'inline-grid';
                                }
                              }}
                            />
                          ) : null}
                          <span className="avatar avatar-md" style={{ display: item.image ? 'none' : 'inline-grid' }}>
                            {item.initials || (item.name || '').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        {stats.badge && !isUnavail && !isBlocked && (
                          <span className={`pickrate-badge ${stats.badgeClass}`}>
                            {stats.badge === 'Top choice' ? <Flame size={11} /> : <TrendingUp size={11} />}
                            {stats.badge}
                          </span>
                        )}
                      </div>

                      <div className="barber-choice-info">
                        <strong>{item.name}</strong>
                        <small>{item.specialty || 'All-around barber'}</small>
                      </div>

                      <div className="barber-pickrate-container">
                        <div className="barber-pickrate-row">
                          <span className="barber-pickrate-label">
                            <Users size={11} /> Pick rate
                          </span>
                          <span className="barber-pickrate-pct">
                            <strong>{stats.percentage}%</strong>
                            <small>({stats.count} {stats.count === 1 ? 'choice' : 'choices'})</small>
                          </span>
                        </div>
                        <div className="barber-pickrate-bar">
                          <span
                            className={`barber-pickrate-fill ${stats.isTop ? 'gold' : ''}`}
                            style={{ width: `${stats.count > 0 ? Math.max(stats.percentage, 6) : 0}%` }}
                          />
                        </div>
                      </div>

                      <div className="barber-choice-footer">
                        {isUnavail ? (
                          <span className="active-booking-badge" style={{ color: '#b91c1c', background: '#fee2e2', borderColor: '#fca5a5' }}>
                            ● Unavailable
                          </span>
                        ) : isCompanionPick ? (
                          <span className="active-booking-badge" style={{ color: '#166534', background: '#f0fdf4', borderColor: '#bbf7d0', fontWeight: 700 }}>
                            ✓ Companion ({companionSuffix})
                          </span>
                        ) : isBlocked ? (
                          <span className="active-booking-badge" style={{ color: '#854d0e', background: '#fef9c3', borderColor: '#fde047', cursor: 'pointer' }}>
                            ● Active booking (Tap to validate)
                          </span>
                        ) : ratingStat.hasReviews ? (
                          <span className="rating-line">
                            <span className="stars">{stars(ratingStat.rating)}</span>
                            <em>{ratingStat.display}</em>
                            <small style={{ color: 'var(--muted)', fontSize: '10px', marginLeft: '2px' }}>
                              ({ratingStat.count} {ratingStat.count === 1 ? 'review' : 'reviews'})
                            </small>
                          </span>
                        ) : (
                          <span className="rating-line" style={{ color: 'var(--muted)' }}>
                            <span className="stars" style={{ color: '#c4c0b8' }}>☆☆☆☆☆</span>
                            <em style={{ fontSize: '11px', color: 'var(--muted)' }}>No reviews yet</em>
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--white)', border: '1px solid var(--line)', borderRadius: '8px' }}>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '13px' }}>
                  No barbers are currently on shift. Please check back later or contact the shop.
                </p>
              </div>
            )
          )}

          {step === 3 && (() => {
            const restCheck = barber ? isRestDay(barber, selection.date) : { isRest: false };
            const leaveCheck = barber ? isBarberOnLeave(barber) : { onLeave: false };
            const isTodaySelected = selection.date === today;
            const sameDayClosed = isTodaySelected && isSameDayBookingClosed();

            return (
              <div className="date-time-panel">
                <label className="field-label">
                  Appointment date
                  <input
                    className="input"
                    type="date"
                    min={today}
                    value={selection.date}
                    onChange={(event) => setSelection({ ...selection, date: event.target.value, time: '' })}
                  />
                </label>

                {sameDayClosed && (
                  <div style={{
                    padding: '14px 16px',
                    background: '#fff9e6',
                    border: '1px solid #f0dfa8',
                    borderRadius: '8px',
                    color: '#805d15',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={18} style={{ flexShrink: 0, color: 'var(--gold)' }} />
                      <span>
                        <strong>Same-Day Booking Closed:</strong> We stop accepting bookings for today after 9:00 PM. All slots for today are grayed out. Please select tomorrow or another date.
                      </span>
                    </div>
                    <button
                      type="button"
                      className="button button-small button-dark"
                      onClick={() => setSelection({ ...selection, date: getTomorrowDateStr(), time: '' })}
                    >
                      Book for Tomorrow ({humanDate(getTomorrowDateStr())}) →
                    </button>
                  </div>
                )}

                {restCheck.isRest && (
                  <div style={{
                    padding: '12px 14px',
                    background: '#fff9e6',
                    border: '1px solid #f0dfa8',
                    borderRadius: '8px',
                    color: '#805d15',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0, color: 'var(--gold)' }} />
                    <span>
                      <strong>Weekly Rest Day:</strong> {barber.name} has a scheduled weekly rest day on <strong>{restCheck.dayName}s</strong>. All slots on this day are unavailable. Please pick another date or select another barber.
                    </span>
                  </div>
                )}

                {leaveCheck.onLeave && (
                  <div style={{
                    padding: '12px 14px',
                    background: '#fef3f2',
                    border: '1px solid #fed7d2',
                    borderRadius: '8px',
                    color: '#b42318',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0, color: '#d92d20' }} />
                    <span>
                      <strong>Barber on Leave:</strong> {barber.name} is currently on {leaveCheck.reason}. Please select another barber.
                    </span>
                  </div>
                )}

                <div className="field-label">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span>Available times</span>
                    {barber && (
                      <span style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 500 }}>
                        {barber.name}’s Shift: {barber.schedule || 'Standard Hours'}
                      </span>
                    )}
                  </div>
                  <div className="slot-grid">
                    {slots.map((slot) => {
                      const slotCheck = getSlotAvailability(slot, totalDuration, barber, selection.date, demo.appointments);
                      const isSelected = selection.time === slot;
                      return (
                        <button
                          key={slot}
                          disabled={!slotCheck.available}
                          className={`slot-button ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelection({ ...selection, time: slot })}
                          title={!slotCheck.available ? `Unavailable: ${slotCheck.reason}` : 'Available'}
                        >
                          {slot}
                          {!slotCheck.available && (
                            <small style={{ color: slotCheck.reason === 'Break' ? '#b07823' : '#a6a39b' }}>
                              {slotCheck.reason}
                            </small>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          {step === 4 && (
            <div className="review-booking">
              <div className="review-summary">
                {bookingFor === 'other' && companionSuffix && (
                  <span style={{ gridColumn: '1 / -1', background: '#fffdf5', borderBottom: '1px solid var(--line)' }}>
                    <small>Booking Recipient</small>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                      <strong style={{ color: 'var(--gold)', fontSize: '14px' }}>{session?.name} ({companionSuffix})</strong>
                      <span style={{ fontSize: '10px', background: 'var(--gold-soft)', color: '#6d4e21', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                        Companion Booking ({companionSuffix})
                      </span>
                    </div>
                  </span>
                )}
                <span><small>Services Selected</small><strong>{combinedServiceName}</strong></span>
                <span>
                  <small>Barber</small>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                    {barber?.image ? (
                      <img
                        src={barber.image}
                        alt={barber.name}
                        style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--line)' }}
                      />
                    ) : null}
                    <strong>{barber?.name}</strong>
                  </div>
                </span>
                <span><small>Schedule</small><strong>{humanDate(selection.date)} · {selection.time}</strong></span>
                {appliedDiscount ? (
                  <>
                    <span><small>Subtotal</small><span>{currency(totalPrice)}</span></span>
                    <span><small>Promo ({appliedDiscount.code || appliedDiscount.title})</small><span style={{ color: '#16a34a', fontWeight: 600 }}>- {currency(discountAmount)}</span></span>
                    <span><small>Total after discount</small><strong>{currency(finalPrice)}</strong></span>
                  </>
                ) : (
                  <span><small>Total ({totalDuration} mins)</small><strong>{currency(totalPrice)}</strong></span>
                )}
              </div>

              {/* Promo & Discount Box */}
              <div style={{
                background: 'var(--paper)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '14px 16px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Tag size={15} style={{ color: 'var(--gold)' }} />
                  <strong style={{ fontSize: '13px' }}>Promo / Discount Code</strong>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    className="input"
                    style={{ textTransform: 'uppercase', flex: 1, padding: '7px 12px', fontSize: '13px' }}
                    placeholder="Enter code (e.g. WELCOME20)"
                    value={discountCode}
                    onChange={(e) => {
                      setDiscountCode(e.target.value);
                      if (discountError) setDiscountError('');
                    }}
                  />
                  {appliedDiscount ? (
                    <button
                      type="button"
                      className="button button-ghost button-small"
                      onClick={() => {
                        setAppliedDiscount(null);
                        setDiscountCode('');
                        setDiscountError('');
                      }}
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="button button-dark button-small"
                      onClick={() => handleApplyPromo()}
                    >
                      Apply
                    </button>
                  )}
                </div>
                {discountError && (
                  <p style={{ margin: '6px 0 0', color: '#d92d20', fontSize: '12px' }}>{discountError}</p>
                )}
                {appliedDiscount && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '6px 10px', borderRadius: '6px' }}>
                    <span><strong>{appliedDiscount.title}</strong> ({appliedDiscount.type === 'Percentage' ? `${appliedDiscount.value}% off` : `₱${appliedDiscount.value} off`})</span>
                    <span>- {currency(discountAmount)}</span>
                  </div>
                )}
                {(demo.promotions || []).filter((p) => p.active !== false && (!p.validTo || p.validTo >= today)).length > 0 && (
                  <div style={{ marginTop: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <small style={{ color: 'var(--muted)', fontSize: '11px' }}>Available promos:</small>
                    {(demo.promotions || []).filter((p) => p.active !== false && (!p.validTo || p.validTo >= today)).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        style={{
                          background: appliedDiscount?.id === p.id ? 'var(--gold)' : 'var(--white)',
                          color: appliedDiscount?.id === p.id ? '#fff' : 'var(--charcoal)',
                          border: '1px solid var(--line)',
                          borderRadius: '4px',
                          padding: '2px 8px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                        onClick={() => {
                          setDiscountCode(p.code || p.title);
                          handleApplyPromo(p.code || p.title);
                        }}
                      >
                        {p.code || p.title} ({p.type === 'Percentage' ? `${p.value}%` : `₱${p.value}`})
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <label className="field-label">
                Notes for your barber
                <textarea
                  className="input textarea"
                  placeholder="Anything we should know?"
                  value={selection.notes}
                  onChange={(event) => setSelection({ ...selection, notes: event.target.value })}
                />
              </label>
              {!session && (
                <div className="inline-alert">
                  <LockKeyhole size={17} />
                  <span>You’ll sign in before your booking is submitted. Your selection will be kept.</span>
                </div>
              )}
            </div>
          )}

          <div className="booking-actions">
            {step > 1 && (
              <button className="button button-ghost" onClick={() => setStep((current) => current - 1)}>
                <ChevronLeft size={16} /> Back
              </button>
            )}
            {step < 4 ? (
              <button className="button button-dark" onClick={nextStep}>
                Continue <ArrowRight size={16} />
              </button>
            ) : (
              <button className="button button-dark" onClick={confirm}>
                {session ? 'Confirm booking' : 'Sign in to confirm'} <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>

        <aside className="booking-aside">
          <span className="eyebrow">Your booking</span>
          <div className="aside-rule" />

          {allSelectedServices.length > 0 ? (
            <div className="aside-services-list">
              {allSelectedServices.map((svc) => (
                <div className="aside-service" key={svc.id}>
                  <span className="service-icon"><Scissors size={16} /></span>
                  <div>
                    <strong>{svc.name}</strong>
                    <small className="aside-cat-tag">{svc.category}</small>
                  </div>
                  <span className="aside-svc-price">{currency(svc.price)} · {svc.duration}m</span>
                </div>
              ))}

              <div className="aside-total-bar">
                <div>
                  <small>Total duration</small>
                  <strong>{totalDuration} mins</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <small>Estimated Total</small>
                  <strong>{currency(totalPrice)}</strong>
                </div>
              </div>
            </div>
          ) : (
            <p className="muted-copy">Select your haircut, shave, or treatments to see your summary.</p>
          )}

          {barber && (
            <div className="aside-person">
              {barber.image ? (
                <img
                  src={barber.image}
                  alt={barber.name}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--line)', flexShrink: 0 }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.style.display = 'inline-grid';
                    }
                  }}
                />
              ) : null}
              <span className="avatar avatar-sm" style={{ display: barber.image ? 'none' : 'inline-grid' }}>
                {barber.initials || (barber.name || '').slice(0, 2).toUpperCase()}
              </span>
              <span><small>With</small><strong>{barber.name}</strong></span>
            </div>
          )}

          {bookingFor === 'other' && companionSuffix && (
            <div style={{ marginTop: '12px', padding: '10px 12px', background: '#252525', border: '1px solid #444', borderRadius: '6px' }}>
              <span style={{ color: 'var(--gold)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
                Companion Booking
              </span>
              <strong style={{ color: '#fff', fontSize: '12px' }}>{session?.name} ({companionSuffix})</strong>
            </div>
          )}

          {selection.date && selection.time && (
            <div className="aside-time-summary">
              <small>Scheduled slot</small>
              <strong>{humanDate(selection.date)} at {selection.time}</strong>
            </div>
          )}

          <div className="aside-note">
            <Zap size={15} /> Availability is live data and respects existing bookings.
          </div>
        </aside>
      </div>

      {doubleBookingModalOpen && doubleBookingBarber && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setDoubleBookingModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <button className="modal-close" onClick={() => setDoubleBookingModalOpen(false)} aria-label="Close dialog">
              <X size={18} />
            </button>

            <div className="modal-heading">
              <div className="modal-mark" style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}>
                <Users size={22} />
              </div>
              <span className="eyebrow gold">Double Booking Verification</span>
              <h2>Booking With {doubleBookingBarber.name}</h2>
              <p>
                You already have an active appointment scheduled with <strong>{doubleBookingBarber.name}</strong>.
              </p>
            </div>

            <div style={{
              background: '#fffbf0',
              border: '1px solid #f2e3b6',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '18px',
              fontSize: '12px',
              color: '#7c5e10',
              lineHeight: 1.5
            }}>
              <strong>Are you double booking for yourself or are you booking for another person?</strong>
              <div style={{ marginTop: '4px', fontSize: '11px', opacity: 0.9 }}>
                To ensure fair chair availability, the same client cannot hold multiple simultaneous bookings with the same barber. You can, however, book chairs for companions!
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Option 1: Myself */}
              <div style={{
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '14px',
                background: 'var(--white)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: '#fee2e2',
                    color: '#dc2626',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0
                  }}>
                    <AlertTriangle size={14} />
                  </span>
                  <div>
                    <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>Booking for myself</strong>
                    <small style={{ display: 'block', color: 'var(--muted)', fontSize: '10px' }}>
                      Double booking not permitted for the same client
                    </small>
                  </div>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '0 0 10px', lineHeight: 1.5 }}>
                  You already have an active chair reserved with {doubleBookingBarber.name}. You cannot create a duplicate booking for yourself with this barber.
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="button button-ghost button-small"
                    onClick={() => {
                      setDoubleBookingModalOpen(false);
                      navigate('/my-appointments');
                    }}
                  >
                    View My Appointment
                  </button>
                  <button
                    type="button"
                    className="button button-ghost button-small"
                    onClick={() => {
                      setDoubleBookingModalOpen(false);
                      setSelection({ ...selection, barberId: '' });
                      setBookingFor('self');
                      setCompanionSuffix(null);
                    }}
                  >
                    Choose Another Barber
                  </button>
                </div>
              </div>

              {/* Option 2: Another Person */}
              {(() => {
                const nextNum = getNextCompanionSuffix(doubleBookingBarber.id, doubleBookingBarber.name);
                const companionName = `${session?.name || 'Customer'} (${nextNum})`;
                return (
                  <div style={{
                    border: '2px solid var(--gold)',
                    borderRadius: '8px',
                    padding: '14px',
                    background: '#fffdf9'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: 'var(--gold-soft)',
                        color: 'var(--gold)',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0
                      }}>
                        <UserPlus size={14} />
                      </span>
                      <div>
                        <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>Booking for another person</strong>
                        <span style={{
                          display: 'inline-block',
                          marginLeft: '6px',
                          background: 'var(--gold)',
                          color: '#fff',
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: '4px'
                        }}>
                          Allowed
                        </span>
                      </div>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '0 0 10px', lineHeight: 1.5 }}>
                      Reserve an additional chair for a friend, family member, or companion. This booking will be assigned to:
                    </p>
                    <div style={{
                      background: 'var(--white)',
                      border: '1px dashed var(--gold)',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Registered Name:</span>
                      <strong style={{ fontSize: '12px', color: 'var(--ink)' }}>{companionName}</strong>
                    </div>
                    <button
                      type="button"
                      className="button button-dark button-full"
                      onClick={() => {
                        setBookingFor('other');
                        setCompanionSuffix(nextNum);
                        setSelection({ ...selection, barberId: doubleBookingBarber.id });
                        setDoubleBookingModalOpen(false);
                        notify(`Booking set for ${companionName} with ${doubleBookingBarber.name}`);
                        if (step === 2) setStep(3);
                      }}
                    >
                      Continue as {companionName} <ArrowRight size={14} />
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </PageFrame>
  );
}

export function StaffAccessPage() {
  const { openModal } = useStore();
  return (
    <section className="access-page content-width">
      <div className="eyebrow"><ShieldCheck size={14} /> Staff access</div>
      <h1>Keep the shop moving.</h1>
      <p className="lead-copy">
        Choose a staff view to access the operational portal of Biglang Gwapo. These roles are reserved for authorized team members.
      </p>
      <div className="role-cards">
        {Object.entries(staffUsers).map(([role, user]) => (
          <button className="role-card" key={role} onClick={() => openModal('staff', { requestedRole: role })}>
            <span className="avatar avatar-lg">{user.initials}</span>
            <span>
              <strong>{user.role}</strong>
              <small>{role === 'receptionist' ? 'Bookings, queue, checkout' : role === 'barber' ? 'Chair, service, schedule' : 'People, settings, reports'}</small>
            </span>
            <ArrowUpRight size={18} />
          </button>
        ))}
      </div>
    </section>
  );
}
