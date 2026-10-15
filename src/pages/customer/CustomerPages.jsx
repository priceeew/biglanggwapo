import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, ArrowUpRight, BadgeCheck, CalendarDays, Camera, Check, ChevronLeft,
  ChevronRight, Clock3, Download, FileText, ListOrdered, Pencil, Plus,
  ReceiptText, Scissors, Send, ShieldCheck, Sparkles, Star, Upload, UserRound,
  Users, WalletCards, X
} from 'lucide-react';
import { useStore, currency, today, humanDate } from '../../context/StoreContext';
import { demoApi } from '../../mockService';
import { uploadImageFile, saveReviewToAtlas } from '../../services/api';
import { getSlotAvailability, isRestDay, isBarberOnLeave, isSameDayBookingClosed, getTomorrowDateStr } from '../../utils/scheduling';
import {
  BentoStats, SectionCard, Toolbar, AppointmentCard, EmptyState,
  StatusBadge, QueueMini, ReviewCard, ReviewPhotoModal
} from '../../components/common/UIComponents';
import { BookingPage } from '../public/PublicPages';

export function CustomerPage({ path }) {
  if (path === '/customer') return <CustomerDashboard />;
  if (path === '/booking') return <BookingPage />;
  if (path === '/my-appointments') return <CustomerAppointments />;
  if (path === '/queue-status') return <CustomerQueue />;
  if (path === '/service-history') return <CustomerHistory />;
  if (path === '/reviews') return <CustomerReviews />;
  return <CustomerProfile />;
}

function RescheduleModal({ appointment, onClose }) {
  const { demo, commit, notify } = useStore();
  const isSameDayClosed = isSameDayBookingClosed();
  const earliestDate = isSameDayClosed ? getTomorrowDateStr() : today;
  const initialDate = appointment.date && appointment.date >= earliestDate ? appointment.date : earliestDate;

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedTime, setSelectedTime] = useState(
    appointment.date === initialDate ? (appointment.time || '') : ''
  );

  const barber = demo.barbers.find((b) => b.id === appointment.barberId);

  // Month navigation state initialized to selected date
  const [viewDate, setViewDate] = useState(() => {
    const parts = initialDate.split('-');
    return new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
  });

  const slots = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
    '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM',
    '7:00 PM'
  ];

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };
  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const todayParts = today.split('-');
  const todayYear = Number(todayParts[0]);
  const todayMonth = Number(todayParts[1]) - 1;
  const isPastMonth = year < todayYear || (year === todayYear && month <= todayMonth);

  const restCheck = barber ? isRestDay(barber, selectedDate) : { isRest: false };
  const leaveCheck = barber ? isBarberOnLeave(barber) : { onLeave: false };

  // Quick dates (next 5 days starting from earliest valid date)
  const quickDates = [];
  const baseDate = new Date(`${today}T00:00:00`);
  const startOffset = isSameDayClosed ? 1 : 0;
  for (let i = startOffset; i < startOffset + 5; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' });
    quickDates.push({ dateStr, label });
  }

  // Calendar cells calculation
  const calendarCells = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarCells.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      dateString: ''
    });
  }
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isPast = dateString < earliestDate;
    const isSelected = dateString === selectedDate;
    const isToday = dateString === today;
    calendarCells.push({
      day,
      isCurrentMonth: true,
      dateString,
      isPast,
      isSelected,
      isToday
    });
  }
  const remaining = (7 - (calendarCells.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    calendarCells.push({
      day: i,
      isCurrentMonth: false,
      dateString: ''
    });
  }

  const handleSelectDate = (dateStr) => {
    if (!dateStr || dateStr < earliestDate) return;
    setSelectedDate(dateStr);

    // If currently chosen time slot is unavailable on this new date, reset time
    if (selectedTime) {
      if (barber) {
        const avail = getSlotAvailability(selectedTime, appointment.duration, barber, dateStr, demo.appointments, appointment.id);
        if (!avail.available) {
          setSelectedTime('');
        }
      }
    }

    // Keep calendar view in sync with chosen month
    const parts = dateStr.split('-');
    const newY = Number(parts[0]);
    const newM = Number(parts[1]) - 1;
    if (newY !== year || newM !== month) {
      setViewDate(new Date(newY, newM, 1));
    }
  };

  const isSameAsCurrent = selectedDate === appointment.date && selectedTime === appointment.time;
  const canConfirm = selectedDate && selectedTime && !isSameAsCurrent;

  const handleConfirm = () => {
    if (!canConfirm) return;
    if (selectedDate === today && isSameDayClosed) {
      return notify('Same-day rescheduling is closed after 9:00 PM. Please select tomorrow or another date.', 'error');
    }
    if (barber) {
      const avail = getSlotAvailability(selectedTime, appointment.duration, barber, selectedDate, demo.appointments, appointment.id);
      if (!avail.available) {
        return notify(`Cannot reschedule to this slot (${avail.reason}). Please select an available slot.`, 'error');
      }
    }
    try {
      commit((state) => demoApi.rescheduleAppointment(state, appointment.id, selectedDate, selectedTime));
      notify(`Appointment successfully rescheduled to ${humanDate(selectedDate)} at ${selectedTime}.`);
      onClose();
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card reschedule-modal-card">
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        <div className="modal-heading" style={{ marginBottom: '18px' }}>
          <div className="modal-mark">
            <CalendarDays size={22} />
          </div>
          <span className="eyebrow gold">Modify Schedule</span>
          <h2>Reschedule Chair</h2>
          <p>Select a new date and available time slot with your barber.</p>
        </div>

        {/* Current appointment info box */}
        <div style={{
          background: 'var(--paper)',
          border: '1px solid var(--line)',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--ink)' }}>{appointment.serviceName}</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
              with <strong>{appointment.barberName}</strong> · {appointment.duration} min
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="eyebrow" style={{ fontSize: '9px', justifyContent: 'flex-end', marginBottom: '2px' }}>Current</span>
            <div style={{ fontWeight: '700', fontSize: '12px', color: 'var(--gold)' }}>
              {humanDate(appointment.date)} · {appointment.time}
            </div>
          </div>
        </div>

        {/* Calendar widget */}
        <div className="calendar-widget">
          <div className="calendar-header">
            <button
              type="button"
              className="calendar-nav-btn"
              onClick={handlePrevMonth}
              disabled={isPastMonth}
              title="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="calendar-month-title">
              {monthNames[month]} {year}
            </span>
            <button
              type="button"
              className="calendar-nav-btn"
              onClick={handleNextMonth}
              title="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="calendar-weekdays">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <span key={d} className="calendar-weekday">{d}</span>
            ))}
          </div>

          <div className="calendar-days-grid">
            {calendarCells.map((cell, idx) => {
              if (!cell.isCurrentMonth) {
                return (
                  <span key={idx} className="calendar-day-cell other-month">
                    {cell.day}
                  </span>
                );
              }
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={cell.isPast}
                  onClick={() => handleSelectDate(cell.dateString)}
                  className={`calendar-day-cell ${cell.isSelected ? 'selected' : ''} ${cell.isToday ? 'today' : ''} ${cell.isPast ? 'disabled' : ''}`}
                  title={cell.isPast ? 'Past date' : cell.dateString}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {/* Quick Date Pills */}
          <div className="calendar-quick-dates">
            {quickDates.map((item) => (
              <button
                key={item.dateStr}
                type="button"
                className={`quick-date-btn ${selectedDate === item.dateStr ? 'active' : ''}`}
                onClick={() => handleSelectDate(item.dateStr)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Same-day closed after 9 PM notice */}
        {selectedDate === today && isSameDayClosed && (
          <div style={{
            marginTop: '14px',
            padding: '10px 12px',
            background: '#fff9e6',
            border: '1px solid #f0dfa8',
            borderRadius: '6px',
            color: '#805d15',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={15} style={{ flexShrink: 0, color: 'var(--gold)' }} />
            <span>
              <strong>Same-Day Rescheduling Closed:</strong> We stop accepting bookings for today after 9:00 PM. All slots for today are grayed out. Please select tomorrow or another day.
            </span>
          </div>
        )}

        {/* Rest day or leave notice */}
        {restCheck.isRest && (
          <div style={{
            marginTop: '14px',
            padding: '10px 12px',
            background: '#fff9e6',
            border: '1px solid #f0dfa8',
            borderRadius: '6px',
            color: '#805d15',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={15} style={{ flexShrink: 0, color: 'var(--gold)' }} />
            <span>
              <strong>Weekly Rest Day:</strong> {barber?.name || 'Barber'} is on scheduled rest day every <strong>{restCheck.dayName}</strong>. Please pick another date.
            </span>
          </div>
        )}

        {leaveCheck.onLeave && (
          <div style={{
            marginTop: '14px',
            padding: '10px 12px',
            background: '#fef3f2',
            border: '1px solid #fed7d2',
            borderRadius: '6px',
            color: '#b42318',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={15} style={{ flexShrink: 0, color: '#d92d20' }} />
            <span>
              <strong>Barber on Leave:</strong> {barber?.name || 'Barber'} is currently on {leaveCheck.reason}.
            </span>
          </div>
        )}

        {/* Time slots */}
        <div style={{ marginTop: '18px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label className="field-label" style={{ margin: 0, fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Select Available Time
          </label>
          <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
            {selectedDate ? humanDate(selectedDate) : ''}
          </span>
        </div>

        <div className="slot-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
          {slots.map((slot) => {
            const isCurrent = appointment.date === selectedDate && appointment.time === slot;
            const isSelected = selectedTime === slot;
            const slotCheck = barber
              ? getSlotAvailability(slot, appointment.duration || 45, barber, selectedDate, demo.appointments, appointment.id)
              : { available: true, reason: 'Available' };
            const disabled = !isCurrent && !slotCheck.available;

            return (
              <button
                key={slot}
                type="button"
                disabled={disabled}
                className={`slot-button ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedTime(slot)}
                style={isCurrent && !isSelected ? { borderColor: 'var(--gold)' } : {}}
                title={!slotCheck.available ? `Unavailable: ${slotCheck.reason}` : isCurrent ? 'Current booked time' : 'Available'}
              >
                {slot}
                {!slotCheck.available && !isCurrent && (
                  <small style={{ color: slotCheck.reason === 'Break' ? '#b07823' : '#a6a39b' }}>
                    {slotCheck.reason}
                  </small>
                )}
                {isCurrent && <small style={{ color: isSelected ? 'var(--white)' : 'var(--gold)' }}>Current</small>}
              </button>
            );
          })}
        </div>

        {/* Action footer */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
          {isSameAsCurrent ? (
            <div style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'center', marginBottom: '14px' }}>
              ℹ️ Current booking time selected. Pick a different date or time slot to reschedule.
            </div>
          ) : selectedDate && selectedTime ? (
            <div style={{
              fontSize: '12px',
              textAlign: 'center',
              marginBottom: '14px',
              padding: '8px 12px',
              background: 'var(--gold-soft)',
              borderRadius: '6px',
              color: '#6d4e21',
              fontWeight: '500'
            }}>
              New schedule: <strong>{humanDate(selectedDate)} at {selectedTime}</strong>
            </div>
          ) : (
            <div style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'center', marginBottom: '14px' }}>
              Select a date and an available time slot above.
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="button button-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="button button-dark"
              disabled={!canConfirm}
              onClick={handleConfirm}
            >
              Confirm Reschedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CustomerDashboard() {
  const { demo, commit, notify, session } = useStore();
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const currentCustomerId = session?.customerId || 'cust-demo';
  const currentCustomerName = session?.name;
  const appointments = demo.appointments.filter((item) => item.customerId === currentCustomerId || (currentCustomerName && item.customerName === currentCustomerName));
  const upcoming = appointments.find((item) => !['Completed', 'Cancelled'].includes(item.status));
  const completed = appointments.filter((item) => item.status === 'Completed');
  const queueEntry = demo.queue.find((item) => (item.customerId === currentCustomerId || (currentCustomerName && item.customerName === currentCustomerName)) && !['Completed', 'Removed', 'Skipped'].includes(item.status));

  const cancel = (id) => {
    if (window.confirm('Cancel this appointment? This demo action cannot be undone.')) {
      commit((state) => demoApi.cancelAppointment(state, id));
      notify('Appointment cancelled.');
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
              <AppointmentCard appointment={upcoming} onCancel={cancel} onReschedule={() => setRescheduleTarget(upcoming)} />
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

      {rescheduleTarget && (
        <RescheduleModal
          appointment={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
        />
      )}
    </>
  );
}

export function CustomerAppointments() {
  const { demo, commit, notify, session } = useStore();
  const [tab, setTab] = useState('Upcoming');
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const currentCustomerId = session?.customerId || 'cust-demo';
  const currentCustomerName = session?.name;
  const mine = demo.appointments.filter((item) => item.customerId === currentCustomerId || (currentCustomerName && item.customerName === currentCustomerName));
  const upcomingList = mine.filter((item) => !['Completed', 'Cancelled'].includes(item.status));
  const completedList = mine.filter((item) => item.status === 'Completed');
  const list = tab === 'Upcoming' ? upcomingList : completedList;
  const queueEntry = demo.queue.find((item) => (item.customerId === currentCustomerId || (currentCustomerName && item.customerName === currentCustomerName)) && !['Completed', 'Removed', 'Skipped'].includes(item.status));

  const cancel = (id) => {
    if (window.confirm('Cancel this appointment? This demo action cannot be undone.')) {
      commit((state) => demoApi.cancelAppointment(state, id));
      notify('Appointment cancelled.');
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
                onReschedule={() => setRescheduleTarget(item)}
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

      {rescheduleTarget && (
        <RescheduleModal
          appointment={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
        />
      )}
    </>
  );
}

export function CustomerQueue() {
  const { demo, session } = useStore();
  const currentCustomerId = session?.customerId || 'cust-demo';
  const currentCustomerName = session?.name;
  const active = demo.queue.find((item) => (item.customerId === currentCustomerId || (currentCustomerName && item.customerName === currentCustomerName)) && !['Completed', 'Removed', 'Skipped'].includes(item.status));
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

export function CustomerHistory() {
  const { demo, notify, session } = useStore();
  const [query, setQuery] = useState('');
  const currentCustomerId = session?.customerId || 'cust-demo';
  const currentCustomerName = session?.name;
  const history = demo.appointments.filter((item) => (item.customerId === currentCustomerId || (currentCustomerName && item.customerName === currentCustomerName)) && item.status === 'Completed');
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

export function CustomerReviews() {
  const { demo, commit, notify, session } = useStore();

  const currentCustomerName = session?.name || 'Customer';
  const currentInitials = session?.initials || (session?.name ? session.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'CU');
  const currentCustomerId = session?.customerId || 'cust-demo';

  // Automatically update any review tied to this session/customer that previously used placeholder Miguel Santos
  useEffect(() => {
    if (session?.name && session.name !== 'Miguel Santos') {
      const needsUpdate = demo.reviews.some((r) => 
        (r.customer === 'Miguel Santos' && (r.appointmentId === 'apt-complete' || r.comment === 'solid pag kalbo'))
      );
      if (needsUpdate) {
        commit((state) => ({
          ...state,
          reviews: state.reviews.map((r) => 
            (r.customer === 'Miguel Santos' && (r.appointmentId === 'apt-complete' || r.comment === 'solid pag kalbo'))
              ? { ...r, customer: session.name, initials: currentInitials, customerId: currentCustomerId }
              : r
          )
        }));
      }
    }
  }, [session?.name, demo.reviews, currentInitials, currentCustomerId, commit]);

  const eligible = demo.appointments.find((item) => 
    (item.customerId === currentCustomerId || (session?.name && item.customerName === session.name) || item.customerId === 'cust-demo') && 
    item.status === 'Completed' && 
    !demo.reviews.some((review) => review.appointmentId === item.id)
  );
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [image, setImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [activePhotoModal, setActivePhotoModal] = useState(null);

  const handleImageSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError('');
    const validTypes = ['image/jpeg', 'image/png'];
    const validExt = /\.(jpe?g|png)$/i;
    if (file.type && !validTypes.includes(file.type) && !validExt.test(file.name)) {
      setUploadError('Only JPEG, JPG, and PNG files are allowed.');
      return;
    }
    setUploading(true);
    try {
      const res = await uploadImageFile(file);
      if (res.success && res.url) {
        setImage(res.url);
      } else {
        setUploadError(res.error || 'Failed to upload photo.');
      }
    } catch {
      setUploadError('Failed to process image file.');
    } finally {
      setUploading(false);
    }
  };

  // Show reviews submitted by the currently logged-in customer
  const myReviews = demo.reviews.filter((review) => 
    (review.customerId && review.customerId === currentCustomerId) ||
    review.customer === currentCustomerName ||
    (review.appointmentId === 'apt-complete' && currentCustomerName) ||
    (!session?.name && review.customer === 'Miguel Santos')
  ).map((review) => {
    if (currentCustomerName && (review.customer === 'Miguel Santos' || review.appointmentId === 'apt-complete')) {
      return {
        ...review,
        customer: currentCustomerName,
        initials: currentInitials
      };
    }
    return review;
  });

  const submit = (event) => {
    event.preventDefault();
    if (!eligible) return notify('Reviews are available after a completed demo service.', 'error');
    if (!rating || !comment.trim()) return notify('Choose a rating and add feedback.', 'error');
    const newReview = {
      id: `rev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      customer: currentCustomerName,
      initials: currentInitials,
      customerId: currentCustomerId,
      barber: eligible.barberName,
      serviceName: eligible.serviceName,
      service: eligible.serviceName,
      rating,
      comment,
      image: image || undefined,
      appointmentId: eligible.id,
      date: new Date().toISOString().slice(0, 10),
      public: true
    };
    saveReviewToAtlas(newReview);
    commit((state) => demoApi.addReview(state, newReview));
    setRating(0);
    setComment('');
    setImage('');
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
                    <button
                      type="button"
                      key={value}
                      className={value <= rating ? 'active' : ''}
                      onClick={() => setRating(value)}
                      aria-label={`${value} stars`}
                    >
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

                <div style={{ marginTop: '12px', marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Add haircut photo (optional)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 13px',
                        borderRadius: '8px',
                        background: 'var(--surface-sunken, rgba(255,255,255,0.06))',
                        border: '1px dashed var(--line, rgba(255,255,255,0.25))',
                        cursor: eligible && !uploading ? 'pointer' : 'not-allowed',
                        opacity: eligible ? 1 : 0.6,
                        fontSize: '12.5px'
                      }}
                    >
                      <Camera size={15} />
                      <span>{uploading ? 'Uploading...' : image ? 'Change Photo' : 'Upload Local Image'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        disabled={!eligible || uploading}
                        style={{ display: 'none' }}
                        onChange={handleImageSelect}
                      />
                    </label>
                    <span style={{ fontSize: '11.5px', color: 'var(--muted, rgba(255,255,255,0.5))' }}>
                      Only JPEG, JPG, and PNG are allowed.
                    </span>
                  </div>

                  {uploadError && (
                    <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>
                      {uploadError}
                    </div>
                  )}

                  {image && (
                    <div style={{ position: 'relative', display: 'inline-block', marginTop: '10px' }}>
                      <img
                        src={image}
                        alt="Preview"
                        style={{
                          width: '72px',
                          height: '72px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1.5px solid var(--gold, #d4af37)'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setImage('')}
                        style={{
                          position: 'absolute',
                          top: -6,
                          right: -6,
                          background: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          padding: 0
                        }}
                        title="Remove photo"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>

                <button className="button button-dark" disabled={!eligible || uploading}>
                  {uploading ? 'Uploading photo...' : 'Submit review'} <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Your submitted reviews" description="Feedback you provided">
          <div style={{ padding: '20px' }}>
            <div className="submitted-reviews" style={{ maxWidth: '100%' }}>
              {myReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onImageClick={(img, rev) => setActivePhotoModal({ image: img, review: rev })}
                />
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

      <ReviewPhotoModal
        modalData={activePhotoModal}
        onClose={() => setActivePhotoModal(null)}
      />
    </>
  );
}

export function CustomerProfile() {
  const { session, updateSession, notify, reset } = useStore();
  const [editing, setEditing] = useState(false);
  const currentInitials = session?.initials || (session?.name ? session.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'CU');
  const [name, setName] = useState(session?.name || 'Customer');
  const [phone, setPhone] = useState(session?.phone || '+63 917 555 0142');
  const [photoUrl, setPhotoUrl] = useState(session?.photoUrl || '');

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        return notify('Image size must be under 2MB', 'error');
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target.result;
        setPhotoUrl(result);
        if (updateSession) {
          updateSession({ photoUrl: result });
        }
        notify('Profile picture updated successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

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
              <input
                className="input"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                disabled={!editing}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label className="field-label">
              Email
              <input className="input" disabled value={session?.email || 'customer@biglanggwapo.com'} readOnly />
            </label>
            <label className="field-label">
              Phone number
              <input
                className="input"
                type="tel"
                inputMode="numeric"
                maxLength={11}
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                disabled={!editing}
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="09170000000"
              />
            </label>
          </div>
          {editing && (
            <button
              className="button button-dark"
              onClick={() => {
                setEditing(false);
                if (updateSession) {
                  updateSession({ name, phone, photoUrl });
                }
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
              <small>Manage and update your account password.</small>
            </div>
            <button className="button button-ghost button-small" onClick={() => notify('Password update interface.')}>
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
