import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, ArrowUpRight, Check, ChevronLeft, ChevronRight, CircleHelp,
  Clock, LockKeyhole, Scissors, ShieldCheck, Sparkles, Zap
} from 'lucide-react';
import { useStore, currency, today, humanDate, stars } from '../../context/StoreContext';
import { promotions, staffUsers } from '../../data';
import { demoApi } from '../../mockService';
import { saveAppointmentToAtlas } from '../../services/api';
import { getSlotAvailability, isRestDay, isBarberOnLeave, isSameDayBookingClosed, getTomorrowDateStr } from '../../utils/scheduling';
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
          <div className="hero-note">
            <span className="avatar-stack">
              <span className="avatar avatar-xs">MR</span>
              <span className="avatar avatar-xs">PS</span>
              <span className="avatar avatar-xs">ND</span>
            </span>
            <span>Trusted by 400+ local regulars</span>
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
            <span className="eyebrow gold">Limited demo offer</span>
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
            {demo.reviews && demo.reviews.length > 0 ? (
              demo.reviews.map((review) => (
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
            <span><strong>Address</strong>180 Cutcot National Highway, Pulilan, Bulacan</span>
            <span><strong>Hours</strong>Mon–Sun · 9:00 AM–8:00 PM</span>
            <span><strong>Contact</strong>+63 917 555 0100</span>
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
      <div className="notice-bar">
        <CircleHelp size={17} />
        <span>Prices are demo values in Philippine pesos. Final service details can be updated from Admin → Services.</span>
      </div>
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

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  // Selected services lookup
  const haircutService = demo.services.find((item) => item.id === selection.haircutId);
  const shaveService = demo.services.find((item) => item.id === selection.shaveId);
  const treatmentServices = demo.services.filter((item) => selection.treatmentIds.includes(item.id));

  const allSelectedServices = [
    ...(haircutService ? [haircutService] : []),
    ...(shaveService ? [shaveService] : []),
    ...treatmentServices
  ];

  const totalDuration = allSelectedServices.reduce((sum, item) => sum + (Number(item.duration) || 0), 0) || 45;
  const totalPrice = allSelectedServices.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const combinedServiceName = allSelectedServices.map((s) => s.name).join(' + ') || 'Service Booking';

  const barber = demo.barbers.find((item) => item.id === selection.barberId);
  const slots = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
    '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM',
    '7:00 PM'
  ];

  // Safeguard: Customer can only have 1 active appointment at a time with a specific barber
  const hasActiveBookingWithBarber = (targetBarberId) => {
    if (!session || !targetBarberId) return false;
    return demo.appointments.some((item) => {
      if (item.barberId !== targetBarberId) return false;
      const isFinished = ['Completed', 'Cancelled', 'No-show'].includes(item.status);
      if (isFinished) return false;

      const currentCustId = session.customerId;
      const currentName = session.name ? session.name.trim().toLowerCase() : '';
      const currentEmail = session.email ? session.email.trim().toLowerCase() : '';

      const aptCustId = item.customerId;
      const aptCustName = item.customerName ? item.customerName.trim().toLowerCase() : '';
      const aptCustEmail = item.customerEmail ? item.customerEmail.trim().toLowerCase() : '';

      return (
        (currentCustId && aptCustId && currentCustId === aptCustId) ||
        (currentName && aptCustName && currentName === aptCustName) ||
        (currentEmail && aptCustEmail && currentEmail === aptCustEmail)
      );
    });
  };

  const nextStep = () => {
    if (step === 1 && allSelectedServices.length === 0) {
      return notify('Please select at least one service (Haircut, Shave, or Treatment) to continue.', 'error');
    }
    if (step === 2) {
      if (!barber) return notify('Choose a barber to continue.', 'error');
      if (hasActiveBookingWithBarber(barber.id)) {
        return notify(`You already have an active appointment with ${barber.name}. You cannot book multiple times at once with the same barber.`, 'error');
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

    if (hasActiveBookingWithBarber(barber.id)) {
      return notify(`You already have an active appointment with ${barber.name}. You cannot book multiple times at once with the same barber.`, 'error');
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
      const newApt = {
        id: 'apt-' + Date.now(),
        ...selection,
        serviceId: primaryServiceId,
        customerId: session.customerId || 'cust-demo',
        customerName: session.name,
        customerEmail: session.email || '',
        serviceName: combinedServiceName,
        barberName: barber.name,
        barberImage: barber.image || '',
        duration: totalDuration,
        price: totalPrice,
        status: 'Pending',
        paymentStatus: 'Unpaid',
        source: 'Online',
        notes: selection.notes || ''
      };
      commit((state) => demoApi.createBooking(state, newApt));
      saveAppointmentToAtlas(newApt);
      setConfirmed({
        ...selection,
        serviceName: combinedServiceName,
        barberName: barber.name,
        barberImage: barber.image || '',
        price: totalPrice,
        duration: totalDuration,
        selectedServicesList: allSelectedServices
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
        description="This is a demo confirmation. Reception can now confirm the appointment and mark you arrived from the staff view."
      >
        <div className="confirmation-card">
          <div className="confirmation-icon"><Check size={24} /></div>
          <div>
            <span className="eyebrow gold">Booking reference · BG-DEMO</span>
            <h2>{confirmed.serviceName}</h2>
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
              onClick={() => {
                setConfirmed(null);
                setStep(1);
                setSelection({ serviceId: '', barberId: '', date: today, time: '', notes: '' });
              }}
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
                className={`subtle-cat-btn ${selection.treatmentIds.length > 0 ? 'has-pick' : ''}`}
                onClick={() => {
                  const container = document.querySelector('.services-categorized-container');
                  const target = document.getElementById('sec-treatments');
                  if (container && target) {
                    container.scrollTo({ top: target.offsetTop - container.offsetTop, behavior: 'smooth' });
                  }
                }}
              >
                {selection.treatmentIds.length > 0 ? <Check size={14} className="cat-btn-icon" /> : <Zap size={14} className="cat-btn-icon" />}
                <span>Treatment</span>
                {selection.treatmentIds.length > 0 && <span className="cat-btn-badge">{selection.treatmentIds.length}</span>}
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
                  {selection.treatmentIds.length > 0 && (
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
                    const isSelected = selection.treatmentIds.includes(item.id);
                    return (
                      <button
                        type="button"
                        className={`choice-card service-booking-card ${isSelected ? 'selected' : ''}`}
                        key={item.id}
                        onClick={() => {
                          const updated = isSelected
                            ? selection.treatmentIds.filter((id) => id !== item.id)
                            : [...selection.treatmentIds, item.id];
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
                  const isBlocked = hasActiveBookingWithBarber(item.id);
                  return (
                    <button
                      className={`choice-card barber-choice ${selection.barberId === item.id ? 'selected' : ''} ${isBlocked ? 'disabled-choice' : ''}`}
                      key={item.id}
                      onClick={() => {
                        if (isBlocked) {
                          notify(`You already have an active appointment with ${item.name}. Please select another barber or complete your current booking first.`, 'error');
                          return;
                        }
                        setSelection({ ...selection, barberId: item.id });
                      }}
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: selection.barberId === item.id ? '2px solid var(--gold)' : '2px solid var(--line)',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                            marginBottom: '6px'
                          }}
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
                      <strong>{item.name}</strong>
                      <small>{item.specialty}</small>
                      {isBlocked ? (
                        <span className="active-booking-badge">
                          ● Active booking exists
                        </span>
                      ) : (
                        <span className="rating-line">{stars(item.rating)} <em>{item.rating}</em></span>
                      )}
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
                <span><small>Total ({totalDuration} mins)</small><strong>{currency(totalPrice)}</strong></span>
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
                  <span>You’ll sign in before this demo booking is submitted. Your selection will be kept.</span>
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
    </PageFrame>
  );
}

export function StaffAccessPage() {
  const { openModal } = useStore();
  return (
    <section className="access-page content-width">
      <div className="eyebrow"><ShieldCheck size={14} /> Separate demo access</div>
      <h1>Keep the shop moving.</h1>
      <p className="lead-copy">
        Choose a staff view to explore the operational side of Biglang Gwapo. These roles are intentionally separate from customer login and are for demonstration only.
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
