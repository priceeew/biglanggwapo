import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, ArrowUpRight, BadgeCheck, CalendarDays, Camera, Check, ChevronLeft,
  ChevronRight, Clock3, Download, FileText, Globe, ListOrdered, Lock, Pencil, Plus,
  ReceiptText, Scissors, Send, ShieldCheck, Sparkles, Star, Trash2, Upload, UserRound,
  Users, WalletCards, X
} from 'lucide-react';
import { useStore, currency, today, humanDate } from '../../context/StoreContext';
import { demoApi } from '../../mockService';
import { saveAccount, getAccounts } from '../../data';
import { uploadImageFile, saveReviewToAtlas, saveAppointmentToAtlas, deleteQueueItemFromAtlas } from '../../services/api';
import { getSlotAvailability, isRestDay, isBarberOnLeave, isSameDayBookingClosed, getTomorrowDateStr, sortAppointmentsStably } from '../../utils/scheduling';
import {
  BentoStats, SectionCard, Toolbar, AppointmentCard, EmptyState,
  StatusBadge, QueueMini, ReviewCard, ReviewPhotoModal
} from '../../components/common/UIComponents';
import { ReceiptModal } from '../../components/common/ReceiptModal';
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
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const currentCustomerId = session?.customerId || 'cust-demo';
  const currentCustomerName = session?.name || '';
  const appointments = sortAppointmentsStably(demo.appointments || []).filter((item) => item.customerId === currentCustomerId || (currentCustomerName && item.customerName === currentCustomerName));
  const upcoming = appointments.find((item) => !['Completed', 'Cancelled'].includes(item.status));
  const completed = appointments.filter((item) => item.status === 'Completed');
  const queueEntry = demo.queue.find((item) => (item.customerId === currentCustomerId || (currentCustomerName && item.customerName === currentCustomerName)) && !['Completed', 'Removed', 'Skipped'].includes(item.status));

  const cancel = (id) => {
    const targetApt = demo.appointments.find((a) => a.id === id);
    if (targetApt?.status === 'In Service') {
      return notify('Haircut has already started! In-service appointments cannot be cancelled.', 'error');
    }
    const policy = demo.settings?.cancellationPolicy || 'Please cancel at least 2 hours before your appointment.';
    if (window.confirm(`Cancellation Policy: ${policy}\n\nDo you want to cancel this appointment?`)) {
      commit((state) => {
        const prevQueueItem = state.queue.find((q) => q.appointmentId === id);
        const next = demoApi.cancelAppointment(state, id);
        const apt = next.appointments.find((a) => a.id === id);
        if (apt) saveAppointmentToAtlas(apt);
        if (prevQueueItem) deleteQueueItemFromAtlas(prevQueueItem.id);
        return next;
      });
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StatusBadge status={item.status} />
                    <button
                      type="button"
                      className="button button-ghost button-small"
                      style={{ padding: '3px 8px', fontSize: '11px', height: '26px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => setViewingReceipt(item)}
                      title="View & Download Receipt"
                    >
                      <FileText size={12} /> Receipt
                    </button>
                  </div>
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

      {viewingReceipt && (
        <ReceiptModal
          item={viewingReceipt}
          onClose={() => setViewingReceipt(null)}
          settings={demo.settings}
          transactions={demo.transactions}
          notify={notify}
        />
      )}
    </>
  );
}

export function CustomerAppointments() {
  const { demo, commit, notify, session } = useStore();
  const [tab, setTab] = useState('Upcoming');
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const currentCustomerId = session?.customerId || 'cust-demo';
  const currentCustomerName = session?.name || '';
  const mine = sortAppointmentsStably(demo.appointments || []).filter((item) => item.customerId === currentCustomerId || (currentCustomerName && item.customerName === currentCustomerName));
  const upcomingList = mine.filter((item) => !['Completed', 'Cancelled'].includes(item.status));
  const completedList = mine.filter((item) => item.status === 'Completed');
  const cancelledList = mine.filter((item) => item.status === 'Cancelled');
  const list = tab === 'Upcoming' ? upcomingList : tab === 'Completed' ? completedList : cancelledList;
  const queueEntry = demo.queue.find((item) => (item.customerId === currentCustomerId || (currentCustomerName && item.customerName === currentCustomerName)) && !['Completed', 'Removed', 'Skipped'].includes(item.status));

  const cancel = (id) => {
    const targetApt = demo.appointments.find((a) => a.id === id);
    if (targetApt?.status === 'In Service') {
      return notify('Haircut has already started! In-service appointments cannot be cancelled.', 'error');
    }
    const policy = demo.settings?.cancellationPolicy || 'Please cancel at least 2 hours before your appointment.';
    if (window.confirm(`Cancellation Policy: ${policy}\n\nDo you want to cancel this appointment?`)) {
      commit((state) => {
        const prevQueueItem = state.queue.find((q) => q.appointmentId === id);
        const next = demoApi.cancelAppointment(state, id, 'Cancelled by customer', 'Appointment was cancelled by customer request.');
        const apt = next.appointments.find((a) => a.id === id);
        if (apt) saveAppointmentToAtlas(apt);
        if (prevQueueItem) deleteQueueItemFromAtlas(prevQueueItem.id);
        return next;
      });
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
          ['Cancelled visits', `${cancelledList.length} cancelled`, AlertTriangle, 'Past cancellations']
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
        <button className={tab === 'Cancelled' ? 'active' : ''} onClick={() => setTab('Cancelled')}>
          Cancelled <span>{cancelledList.length}</span>
        </button>
      </div>

      {demo.settings?.cancellationPolicy && (
        <div style={{ padding: '10px 16px', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '8px', marginBottom: '14px', fontSize: '11px', color: 'var(--muted)' }}>
          <strong style={{ color: 'var(--ink)' }}>Cancellation policy:</strong> {demo.settings.cancellationPolicy}
        </div>
      )}

      <SectionCard>
        {list.length ? (
          <div className="appointment-list" style={{ padding: '16px' }}>
            {list.map((item) => (
              <AppointmentCard
                key={item.id}
                appointment={item}
                onCancel={cancel}
                onReschedule={() => setRescheduleTarget(item)}
                onViewReceipt={setViewingReceipt}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CalendarDays}
            title={tab === 'Upcoming' ? 'No upcoming appointments' : tab === 'Completed' ? 'No completed appointments yet' : 'No cancelled appointments'}
            copy={tab === 'Upcoming' ? 'Book a chair and your next visit will land here.' : tab === 'Completed' ? 'Completed appointments will appear here after your session.' : 'You have no cancelled appointments on record.'}
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

      {viewingReceipt && (
        <ReceiptModal
          item={viewingReceipt}
          onClose={() => setViewingReceipt(null)}
          settings={demo.settings}
          transactions={demo.transactions}
          notify={notify}
        />
      )}
    </>
  );
}

export function CustomerQueue() {
  const { demo, session } = useStore();
  const currentCustomerId = session?.customerId || 'cust-demo';
  const currentCustomerName = session?.name || '';
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

            {(active?.status === 'Called' || active?.status === 'Pending' || active?.status === 'In Service') && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(184,138,68,0.18), rgba(28,28,28,0.05))',
                border: '1.5px solid var(--gold)',
                borderRadius: '8px',
                padding: '16px 20px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px'
              }}>
                <span style={{ fontSize: '24px' }}>💈</span>
                <div>
                  <strong style={{ color: 'var(--gold)', display: 'block', fontSize: '15px' }}>
                    {active.status === 'In Service' ? 'Kasalukuyang ginugupitan na po kayo!' : 'Kayo na po ang susunod na gugupitan!'}
                  </strong>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Handa na po ang barber chair ni <strong>{active.barberName}</strong> para sa inyong service. Nagpadala rin po kami ng email notification sa inyong inbox!
                  </span>
                </div>
              </div>
            )}

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
  const [tab, setTab] = useState('All');
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const currentCustomerId = session?.customerId || 'cust-demo';
  const currentCustomerName = session?.name || '';
  const userAppointments = sortAppointmentsStably(demo.appointments || []).filter(
    (item) => item.customerId === currentCustomerId || (currentCustomerName && item.customerName === currentCustomerName)
  );
  const completedList = userAppointments.filter((item) => item.status === 'Completed');
  const cancelledList = userAppointments.filter((item) => item.status === 'Cancelled');
  const allHistory = userAppointments.filter((item) => ['Completed', 'Cancelled'].includes(item.status));

  const list = tab === 'Completed' ? completedList : tab === 'Cancelled' ? cancelledList : allHistory;
  const filtered = list.filter((item) =>
    `${item.serviceName} ${item.barberName} ${item.cancellationReason || ''} ${item.cancellationMessage || ''} ${item.notes || ''}`.toLowerCase().includes(query.toLowerCase())
  );
  const totalSpent = completedList.reduce((sum, item) => sum + (item.price || 0), 0);

  const handleExportReceiptsCSV = () => {
    if (!completedList.length) {
      return notify('No completed visit receipts to export.', 'error');
    }
    const headers = 'Receipt,Customer,Service,Barber,Amount,Status,Date,Time\n';
    const rows = completedList.map((item) => {
      const matchedTxn = (demo.transactions || []).find(
        (t) => t.appointmentId === item.id || (t.customerName === item.customerName && t.date === item.date)
      );
      const receiptNo = matchedTxn?.receipt || item.receipt || `BG-${String(item.date).replaceAll('-', '')}-${String(item.id).slice(-4)}`;
      return `"${receiptNo}","${item.customerName || currentCustomerName}","${item.serviceName}","${item.barberName}",${item.price},"Paid","${item.date}","${item.time || ''}"`;
    }).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `service-history-receipts-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify('Service history receipts exported successfully!', 'success');
  };

  return (
    <>
      <BentoStats
        items={[
          ['Completed visits', `${completedList.length} services`, Scissors, 'All finished cuts'],
          ['Cancelled visits', `${cancelledList.length} cancelled`, AlertTriangle, 'Past cancellations'],
          ['Total spent', currency(totalSpent), WalletCards, 'Paid in full'],
          ['Favorite barber', completedList[0]?.barberName || allHistory[0]?.barberName || 'Marco Reyes', Star, 'Master Barber']
        ]}
      />

      <Toolbar
        title="Service history"
        count={filtered.length}
        description="Every finished service, receipt, barber note, and cancellation record in one place."
        query={query}
        setQuery={setQuery}
        action={
          <button className="button button-ghost button-small" onClick={handleExportReceiptsCSV}>
            <Download size={15} /> Export Receipts CSV
          </button>
        }
      />

      <div className="tabs">
        <button className={tab === 'All' ? 'active' : ''} onClick={() => setTab('All')}>
          All <span>{allHistory.length}</span>
        </button>
        <button className={tab === 'Completed' ? 'active' : ''} onClick={() => setTab('Completed')}>
          Completed <span>{completedList.length}</span>
        </button>
        <button className={tab === 'Cancelled' ? 'active' : ''} onClick={() => setTab('Cancelled')}>
          Cancelled <span>{cancelledList.length}</span>
        </button>
      </div>

      <SectionCard>
        {filtered.length ? (
          <div className="history-list" style={{ padding: '16px' }}>
            {filtered.map((item) => {
              const isCancelled = item.status === 'Cancelled';
              return (
                <div className={`history-card ${isCancelled ? 'cancelled' : ''}`} key={item.id}>
                  <div className="history-date">
                    <strong>{new Date(`${item.date}T00:00:00`).getDate()}</strong>
                    <span>{new Date(`${item.date}T00:00:00`).toLocaleDateString('en-PH', { month: 'short' })}</span>
                  </div>
                  <div className="history-main">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="eyebrow">{item.serviceName}</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <h3>{item.barberName}</h3>
                    {isCancelled ? (
                      <div className="cancellation-reason-box">
                        <strong>
                          <AlertTriangle size={13} />
                          Cancelled{item.cancellationReason ? `: ${item.cancellationReason}` : ''}
                        </strong>
                        {item.cancellationMessage ? (
                          <p>{item.cancellationMessage}</p>
                        ) : (
                          <p>This appointment was cancelled.</p>
                        )}
                      </div>
                    ) : (
                      <p>{item.notes || 'Service completed with a clean, tailored finish.'}</p>
                    )}
                  </div>
                  <div className="history-side">
                    {isCancelled ? (
                      <>
                        <span>
                          <small style={{ color: 'var(--red)', fontWeight: 700 }}>Cancelled</small>
                          <s style={{ color: 'var(--muted)', fontSize: '12px' }}>{currency(item.price)}</s>
                        </span>
                        <Link
                          to={`/booking?service=${item.serviceId || ''}&barber=${item.barberId || ''}`}
                          className="button button-dark button-small"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '6px' }}
                        >
                          <Scissors size={13} /> Rebook
                        </Link>
                      </>
                    ) : (
                      <>
                        <span>
                          <small>Paid</small>
                          <strong>{currency(item.price)}</strong>
                        </span>
                        <button
                          className="button button-ghost button-small"
                          onClick={() => setViewingReceipt(item)}
                          title="View & Download Official Receipt"
                        >
                          <FileText size={15} /> Receipt
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title={tab === 'Completed' ? 'No completed services yet' : tab === 'Cancelled' ? 'No cancelled appointments' : 'No service history yet'}
            copy={tab === 'Completed' ? 'Your finished visits and receipts will appear here once your service is marked complete.' : tab === 'Cancelled' ? 'You have no cancelled appointments.' : 'Your appointment records and receipts will appear here.'}
          />
        )}
      </SectionCard>

      {viewingReceipt && (
        <ReceiptModal
          item={viewingReceipt}
          onClose={() => setViewingReceipt(null)}
          settings={demo.settings}
          transactions={demo.transactions}
          notify={notify}
        />
      )}
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
  const [isPublic, setIsPublic] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [activePhotoModal, setActivePhotoModal] = useState(null);

  // Edit Review Modal State
  const [editingReview, setEditingReview] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [editUploading, setEditUploading] = useState(false);
  const [editUploadError, setEditUploadError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const openEditModal = (review) => {
    setEditingReview(review);
    setEditRating(review.rating || 5);
    setEditComment(review.comment || '');
    setEditImage(review.image || '');
    setEditIsPublic(review.public !== false);
    setEditUploadError('');
  };

  const handleEditImageSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setEditUploadError('');
    const validTypes = ['image/jpeg', 'image/png'];
    const validExt = /\.(jpe?g|png)$/i;
    if (file.type && !validTypes.includes(file.type) && !validExt.test(file.name)) {
      setEditUploadError('Only JPEG, JPG, and PNG files are allowed.');
      return;
    }
    setEditUploading(true);
    try {
      const res = await uploadImageFile(file);
      if (res.success && res.url) {
        setEditImage(res.url);
      } else {
        setEditUploadError(res.error || 'Failed to upload photo.');
      }
    } catch {
      setEditUploadError('Failed to process image file.');
    } finally {
      setEditUploading(false);
    }
  };

  const saveEditedReview = async (e) => {
    if (e) e.preventDefault();
    if (!editingReview) return;
    if (!editRating || !editComment.trim()) {
      return notify('Please choose a rating and add your feedback.', 'error');
    }

    setSavingEdit(true);
    const updatedReview = {
      ...editingReview,
      rating: editRating,
      comment: editComment.trim(),
      image: editImage || '',
      public: editIsPublic
    };

    // Optimistic store update
    commit((state) => ({
      ...state,
      reviews: (state.reviews || []).map((r) => (r.id === updatedReview.id ? updatedReview : r))
    }));

    try {
      const res = await saveReviewToAtlas(updatedReview);
      if (res && res.success === false) {
        notify('Failed to save updated review in database.', 'error');
      } else {
        notify('Your review and photo have been updated successfully!', 'success');
        setEditingReview(null);
      }
    } catch (err) {
      notify(`Failed to update review: ${err.message}`, 'error');
    } finally {
      setSavingEdit(false);
    }
  };

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
  const currentCustomerPhoto = session?.photoUrl || session?.image || (session?.email ? getAccounts()[session.email.toLowerCase()]?.photoUrl : '') || '';
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
        customerImage: review.customerImage || currentCustomerPhoto,
        initials: currentInitials
      };
    }
    return {
      ...review,
      customerImage: review.customerImage || (review.customer === currentCustomerName ? currentCustomerPhoto : '')
    };
  });

  const toggleReviewPrivacy = async (review) => {
    const currentIsPublic = review.public !== false;
    const newPublic = !currentIsPublic;
    const updated = { ...review, public: newPublic };

    // Optimistic update
    commit((state) => ({
      ...state,
      reviews: (state.reviews || []).map((r) => (r.id === review.id ? updated : r))
    }));

    try {
      const res = await saveReviewToAtlas(updated);
      if (res && res.success === false) {
        notify('Failed to update review visibility in database.', 'error');
      } else {
        notify(
          newPublic
            ? 'Your review is now public on the shop website.'
            : 'Your review is now private (visible only to shop staff).',
          'success'
        );
      }
    } catch (err) {
      notify(`Failed to update review visibility: ${err.message}`, 'error');
    }
  };

  const submit = (event) => {
    event.preventDefault();
    if (!eligible) return notify('Reviews are available after a completed demo service.', 'error');
    if (!rating || !comment.trim()) return notify('Choose a rating and add feedback.', 'error');
    const customerImg = session?.photoUrl || session?.image || (session?.email ? getAccounts()[session.email.toLowerCase()]?.photoUrl : '') || '';
    const newReview = {
      id: `rev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      customer: currentCustomerName,
      customerImage: customerImg,
      initials: currentInitials,
      customerId: currentCustomerId,
      barber: eligible.barberName,
      barberId: eligible.barberId || '',
      serviceName: eligible.serviceName,
      service: eligible.serviceName,
      rating,
      comment,
      image: image || undefined,
      appointmentId: eligible.id,
      date: new Date().toISOString().slice(0, 10),
      public: isPublic
    };
    saveReviewToAtlas(newReview).catch((err) => console.warn('Failed saving review to Atlas:', err));
    commit((state) => demoApi.addReview(state, newReview));
    setRating(0);
    setComment('');
    setImage('');
    setIsPublic(true);
    notify(isPublic ? 'Thanks for sharing your review! It is now public.' : 'Thanks for sharing your feedback! It is saved privately for shop staff.');
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

                <div style={{ marginTop: '14px', marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                    Review visibility
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setIsPublic(true)}
                      disabled={!eligible}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: isPublic ? '1.5px solid var(--gold, #d4af37)' : '1px solid rgba(255,255,255,0.15)',
                        background: isPublic ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255,255,255,0.04)',
                        color: '#fff',
                        textAlign: 'left',
                        cursor: eligible ? 'pointer' : 'not-allowed',
                        opacity: eligible ? 1 : 0.6,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Globe size={18} style={{ color: isPublic ? 'var(--gold, #d4af37)' : '#888', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: isPublic ? 'var(--gold, #d4af37)' : '#fff' }}>
                          Public Review
                        </div>
                        <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px', lineHeight: 1.35 }}>
                          Display on website testimonials and public ratings.
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPublic(false)}
                      disabled={!eligible}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: !isPublic ? '1.5px solid var(--gold, #d4af37)' : '1px solid rgba(255,255,255,0.15)',
                        background: !isPublic ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255,255,255,0.04)',
                        color: '#fff',
                        textAlign: 'left',
                        cursor: eligible ? 'pointer' : 'not-allowed',
                        opacity: eligible ? 1 : 0.6,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Lock size={18} style={{ color: !isPublic ? 'var(--gold, #d4af37)' : '#888', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: !isPublic ? 'var(--gold, #d4af37)' : '#fff' }}>
                          Private Review
                        </div>
                        <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px', lineHeight: 1.35 }}>
                          Visible only to barbershop staff and manager.
                        </div>
                      </div>
                    </button>
                  </div>
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
              {myReviews.map((review) => {
                const isReviewPublic = review.public !== false;
                return (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    onImageClick={(img, rev) => setActivePhotoModal({ image: img, review: rev })}
                  >
                    <div
                      style={{
                        marginTop: '12px',
                        paddingTop: '10px',
                        borderTop: '1px solid var(--line, rgba(0,0,0,0.08))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isReviewPublic ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: '#15803d',
                              background: 'rgba(34, 197, 94, 0.1)',
                              padding: '3px 8px',
                              borderRadius: '12px',
                              border: '1px solid rgba(34, 197, 94, 0.25)'
                            }}
                          >
                            <Globe size={11} /> Public (Visible on website)
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: '#64748b',
                              background: 'rgba(100, 116, 139, 0.1)',
                              padding: '3px 8px',
                              borderRadius: '12px',
                              border: '1px solid rgba(100, 116, 139, 0.25)'
                            }}
                          >
                            <Lock size={11} /> Private (Only shop staff)
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => openEditModal(review)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--line)',
                            background: 'var(--white)',
                            color: 'var(--ink)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          title="Edit your review details or photo"
                        >
                          <Pencil size={12} /> Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleReviewPrivacy(review)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--line)',
                            background: 'var(--white)',
                            color: 'var(--ink)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          title={isReviewPublic ? 'Change to private so only staff can see it' : 'Change to public to display on website'}
                        >
                          {isReviewPublic ? (
                            <>
                              <Lock size={12} /> Make Private
                            </>
                          ) : (
                            <>
                              <Globe size={12} /> Make Public
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </ReviewCard>
                );
              })}
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

      {/* Edit Review Modal */}
      {editingReview && (
        <div
          className="modal-backdrop"
          style={{ zIndex: 90 }}
          onMouseDown={(e) => e.target === e.currentTarget && !savingEdit && setEditingReview(null)}
        >
          <div className="modal-card" style={{ maxWidth: '500px', width: '100%', textAlign: 'left' }}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setEditingReview(null)}
              disabled={savingEdit || editUploading}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div style={{ marginBottom: '18px' }}>
              <span className="eyebrow gold">Edit Review</span>
              <h2 style={{ fontSize: '20px', margin: '6px 0 2px' }}>
                {editingReview.serviceName || editingReview.service || 'Haircut Review'}
              </h2>
              <p style={{ fontSize: '11.5px', color: 'var(--muted)', margin: 0 }}>
                Barber: <strong>{editingReview.barber || 'Barber'}</strong>
              </p>
            </div>

            <form onSubmit={saveEditedReview}>
              {/* Star Rating Picker */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>
                  Rating
                </label>
                <div className="star-picker" style={{ display: 'flex', gap: '4px' }}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      type="button"
                      key={value}
                      className={value <= editRating ? 'active' : ''}
                      onClick={() => setEditRating(value)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        color: value <= editRating ? 'var(--gold, #d4af37)' : '#ccc',
                        transition: 'transform 0.1s ease'
                      }}
                      aria-label={`${value} stars`}
                    >
                      <Star size={24} fill={value <= editRating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback comment textarea */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>
                  Your Feedback
                </label>
                <textarea
                  className="input textarea"
                  style={{ minHeight: '80px', fontSize: '12.5px' }}
                  placeholder="Update your feedback about the haircut and barber..."
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  required
                />
              </div>

              {/* Haircut Photo Upload / Change / Remove */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>
                  Haircut Photo (Stored in Database)
                </label>

                {editImage ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={editImage}
                        alt="Haircut preview"
                        style={{
                          width: '76px',
                          height: '76px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1.5px solid var(--gold, #d4af37)',
                          display: 'block'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setEditImage('')}
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

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label
                        className="button button-ghost button-small"
                        style={{ cursor: editUploading ? 'not-allowed' : 'pointer', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        <Camera size={13} />
                        <span>{editUploading ? 'Uploading...' : 'Change Photo'}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/jpg"
                          disabled={editUploading}
                          style={{ display: 'none' }}
                          onChange={handleEditImageSelect}
                        />
                      </label>
                      <span style={{ fontSize: '10.5px', color: 'var(--muted)' }}>
                        JPEG or PNG. Saved directly to MongoDB Atlas.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label
                      className="button button-ghost button-small"
                      style={{ cursor: editUploading ? 'not-allowed' : 'pointer', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Camera size={14} />
                      <span>{editUploading ? 'Uploading...' : 'Upload Haircut Photo'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        disabled={editUploading}
                        style={{ display: 'none' }}
                        onChange={handleEditImageSelect}
                      />
                    </label>
                  </div>
                )}

                {editUploadError && (
                  <div style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '6px' }}>
                    {editUploadError}
                  </div>
                )}
              </div>

              {/* Visibility choice */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>
                  Visibility
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setEditIsPublic(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: editIsPublic ? '1.5px solid var(--gold, #d4af37)' : '1px solid var(--line)',
                      background: editIsPublic ? 'rgba(212, 175, 55, 0.12)' : 'var(--paper)',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <Globe size={15} style={{ color: editIsPublic ? 'var(--gold, #d4af37)' : 'var(--muted)' }} />
                    <div>
                      <strong style={{ display: 'block', fontSize: '11.5px' }}>Public</strong>
                      <small style={{ fontSize: '9.5px', color: 'var(--muted)' }}>Visible on website</small>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditIsPublic(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: !editIsPublic ? '1.5px solid var(--gold, #d4af37)' : '1px solid var(--line)',
                      background: !editIsPublic ? 'rgba(212, 175, 55, 0.12)' : 'var(--paper)',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <Lock size={15} style={{ color: !editIsPublic ? 'var(--gold, #d4af37)' : 'var(--muted)' }} />
                    <div>
                      <strong style={{ display: 'block', fontSize: '11.5px' }}>Private</strong>
                      <small style={{ fontSize: '9.5px', color: 'var(--muted)' }}>Only shop staff</small>
                    </div>
                  </button>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="button button-ghost button-small"
                  disabled={savingEdit || editUploading}
                  onClick={() => setEditingReview(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button-dark button-small"
                  disabled={savingEdit || editUploading}
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function CustomerProfile() {
  const { session, updateSession, notify, reset, commit } = useStore();
  const [editing, setEditing] = useState(false);
  const currentInitials = session?.initials || (session?.name ? session.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'CU');
  const [name, setName] = useState(session?.name || 'Customer');
  const [phone, setPhone] = useState(session?.phone || '+63 917 555 0142');

  const getInitialPhoto = () => {
    const acc = session?.email ? getAccounts()[session.email.toLowerCase()] : null;
    return session?.photoUrl || session?.image || acc?.photoUrl || acc?.image || '';
  };

  const [photoUrl, setPhotoUrl] = useState(getInitialPhoto);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (session) {
      if (session.name) setName(session.name);
      if (session.phone) setPhone(session.phone);
      const acc = session.email ? getAccounts()[session.email.toLowerCase()] : null;
      const latestPhoto = session.photoUrl || session.image || acc?.photoUrl || acc?.image || '';
      setPhotoUrl(latestPhoto);
    }
  }, [session]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png'];
    const validExt = /\.(jpe?g|png)$/i;
    if (!validTypes.includes(file.type) && !validExt.test(file.name)) {
      e.target.value = '';
      return notify('Only JPEG, JPG, and PNG files are allowed.', 'error');
    }

    if (file.size > 10 * 1024 * 1024) {
      e.target.value = '';
      return notify('Image must be under 10MB', 'error');
    }

    // Immediate optimistic local preview for instant UI update without refresh
    const localPreview = URL.createObjectURL(file);
    setPhotoUrl(localPreview);
    if (updateSession) {
      updateSession({ photoUrl: localPreview, image: localPreview });
    }

    setIsUploadingPhoto(true);
    notify('Uploading profile picture to cloud...');

    try {
      const res = await uploadImageFile(file);
      setIsUploadingPhoto(false);
      e.target.value = '';

      if (res && res.success && res.url) {
        const newPhoto = res.url;
        setPhotoUrl(newPhoto);

        if (updateSession) {
          updateSession({ photoUrl: newPhoto, image: newPhoto });
        }

        if (session?.email) {
          saveAccount({
            email: session.email,
            photoUrl: newPhoto,
            image: newPhoto,
            name: name.trim(),
            phone: phone.trim()
          });
        }

        commit((state) => {
          const cleanEmail = (session?.email || '').toLowerCase().trim();
          const updatedCusts = (state.customers || []).map((c) => {
            if ((c.email && c.email.toLowerCase().trim() === cleanEmail) || (session?.customerId && c.id === session.customerId)) {
              return { ...c, image: newPhoto, photoUrl: newPhoto };
            }
            return c;
          });
          return { ...state, customers: updatedCusts };
        });

        notify('Profile picture updated successfully!', 'success');
      } else {
        notify(res?.error || 'Failed to upload profile picture.', 'error');
      }
    } catch (err) {
      setIsUploadingPhoto(false);
      e.target.value = '';
      notify(`Upload failed: ${err.message}`, 'error');
    }
  };

  const handlePhotoRemove = () => {
    setPhotoUrl('');
    if (updateSession) {
      updateSession({ photoUrl: '', image: '' });
    }
    if (session?.email) {
      saveAccount({
        email: session.email,
        photoUrl: '',
        image: '',
        name: name.trim(),
        phone: phone.trim()
      });
    }
    commit((state) => {
      const cleanEmail = (session?.email || '').toLowerCase().trim();
      const updatedCusts = (state.customers || []).map((c) => {
        if ((c.email && c.email.toLowerCase().trim() === cleanEmail) || (session?.customerId && c.id === session.customerId)) {
          return { ...c, image: '', photoUrl: '' };
        }
        return c;
      });
      return { ...state, customers: updatedCusts };
    });
    notify('Profile picture removed.', 'success');
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
            <div className="profile-avatar-wrapper">
              {photoUrl ? (
                <img
                  key={photoUrl}
                  src={photoUrl}
                  alt={name}
                  className="profile-avatar-img"
                  onLoad={(e) => {
                    e.currentTarget.style.display = 'block';
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.style.display = 'none';
                    }
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.style.display = 'inline-grid';
                    }
                  }}
                />
              ) : null}
              <span
                className="avatar avatar-xl"
                style={{
                  display: photoUrl ? 'none' : 'inline-grid',
                  width: 78,
                  height: 78,
                  fontSize: '20px'
                }}
              >
                {currentInitials}
              </span>

              <label
                className="profile-avatar-camera-btn"
                title={photoUrl ? 'Change profile picture' : 'Upload profile picture'}
                style={{ opacity: isUploadingPhoto ? 0.7 : 1, cursor: isUploadingPhoto ? 'wait' : 'pointer' }}
              >
                <Camera size={14} />
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  disabled={isUploadingPhoto}
                  style={{ display: 'none' }}
                  onChange={handlePhotoUpload}
                />
              </label>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h2>{name}</h2>
              <p>{session?.email || 'customer@biglanggwapo.com'} · Member since 2026</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                <label
                  className="button button-soft button-small"
                  style={{ cursor: isUploadingPhoto ? 'wait' : 'pointer', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Upload size={13} />
                  {isUploadingPhoto ? 'Uploading photo...' : photoUrl ? 'Change photo' : 'Upload photo'}
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    disabled={isUploadingPhoto}
                    style={{ display: 'none' }}
                    onChange={handlePhotoUpload}
                  />
                </label>
                {photoUrl && (
                  <button
                    type="button"
                    className="button button-ghost button-small"
                    onClick={handlePhotoRemove}
                    style={{ color: 'var(--red)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                )}
              </div>
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
                const updatedCustomerData = {
                  name: name.trim() || session?.name || 'Customer',
                  phone: phone.trim() || session?.phone || '',
                  photoUrl,
                  image: photoUrl
                };
                if (updateSession) {
                  updateSession(updatedCustomerData);
                }
                if (session?.email) {
                  saveAccount({
                    email: session.email,
                    ...updatedCustomerData
                  });
                }
                commit((state) => {
                  const cleanEmail = (session?.email || '').toLowerCase().trim();
                  const updatedCusts = (state.customers || []).map((c) => {
                    if ((c.email && c.email.toLowerCase().trim() === cleanEmail) || (session?.customerId && c.id === session.customerId)) {
                      return { ...c, name: updatedCustomerData.name, phone: updatedCustomerData.phone, image: photoUrl, photoUrl };
                    }
                    return c;
                  });
                  return { ...state, customers: updatedCusts };
                });
                notify('Profile details updated successfully!');
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
