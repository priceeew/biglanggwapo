import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronRight, Download,
  FileText, ListOrdered, Mail, MoreHorizontal, Package, Plus, Search, ShoppingBag, Star,
  Tag, Trash2, UserPlus, WalletCards, X, Zap, Eye, EyeOff, KeyRound,
  BadgeCheck, Camera, Upload, Pencil, Clock3, LockKeyhole, UserRound
} from 'lucide-react';
import { useStore, currency, today, humanDate, stars } from '../../context/StoreContext';
import { demoApi } from '../../mockService';
import { saveAccount, getAccounts, validatePassword, validatePhone } from '../../data';
import {
  sendInviteNotification, notifyCustomerTurn, saveAppointmentToAtlas, saveQueueItemToAtlas, deleteQueueItemFromAtlas,
  saveTransactionToAtlas, deleteTransactionFromAtlas, saveInventoryToAtlas, deleteReviewFromAtlas,
  sendCancellationNotification
} from '../../services/api';
import {
  BentoStats, SectionCard, Toolbar, AppointmentRow, QueueMini, DataTable,
  StatusBadge, EmptyState, StatCard, ServiceValidationModal
} from '../../components/common/UIComponents';
import { ReviewsManagement } from '../../components/common/ReviewsManagement';
import { isRestDay, sortAppointmentsStably } from '../../utils/scheduling';
import { addSystemNotification } from '../../services/notificationService';

export function ReceptionistPage({ path }) {
  if (path === '/receptionist') return <ReceptionistDashboard />;
  if (path === '/receptionist/appointments') return <ReceptionistAppointments />;
  if (path === '/receptionist/walk-ins') return <WalkInPage />;
  if (path === '/receptionist/queue') return <QueueManagement />;
  if (path === '/receptionist/customers') return <CustomerManagement />;
  if (path === '/receptionist/payments') return <PaymentPage />;
  if (path === '/receptionist/products') return <ReceptionistProductsPage />;
  if (path === '/receptionist/reviews') return <ReceptionistReviewsPage />;
  if (path === '/receptionist/profile') return <ReceptionistProfile />;
  return <TransactionsPage />;
}

export function ReceptionistDashboard() {
  const { demo } = useStore();
  const todayAppointments = (demo.appointments || []).filter((item) => item.date === today);
  const pendingConfirmCount = todayAppointments.filter((item) => item.status === 'Pending').length;
  const waitingQueueCount = (demo.queue || []).filter((item) => item.status === 'Waiting').length;
  const inServiceQueueCount = (demo.queue || []).filter((item) => item.status === 'In Service').length;
  const todayWalkIns = (demo.appointments || []).filter((item) => item.date === today && item.source === 'Walk-in').length;
  const todayTransactions = (demo.transactions || []).filter((item) => item.date === today);
  const sales = todayTransactions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <>
      <BentoStats
        items={[
          ["Today's appointments", todayAppointments.length, CalendarDays, todayAppointments.length > 0 ? `${pendingConfirmCount} waiting confirmation` : 'No bookings today'],
          ['Current queue', waitingQueueCount, ListOrdered, inServiceQueueCount > 0 ? `${inServiceQueueCount} in service` : 'No one in chair'],
          ['Walk-ins', todayWalkIns, UserPlus, todayWalkIns > 0 ? `${todayWalkIns} walk-in customer${todayWalkIns > 1 ? 's' : ''}` : 'No walk-ins today'],
          ["Today's sales", currency(sales), WalletCards, todayTransactions.length > 0 ? `${todayTransactions.length} paid transaction${todayTransactions.length > 1 ? 's' : ''}` : 'No sales recorded today']
        ]}
      />
      <div className="dashboard-grid two-thirds">
        <SectionCard
          title="Upcoming appointments"
          action={<Link to="/receptionist/appointments" className="text-link">View all <ArrowRight size={14} /></Link>}
        >
          <div className="compact-list">
            {sortAppointmentsStably(demo.appointments || []).slice(0, 4).map((item) => (
              <AppointmentRow key={item.id} appointment={item} />
            ))}
            {(!demo.appointments || demo.appointments.length === 0) && (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                No appointments on the board yet.
              </div>
            )}
          </div>
        </SectionCard>
        <SectionCard title="Quick actions">
          <div className="quick-actions">
            <Link to="/receptionist/walk-ins">
              <UserPlus size={19} />
              <span><strong>Register walk-in</strong><small>Put a guest in the queue.</small></span>
              <ArrowUpRight size={16} />
            </Link>
            <Link to="/receptionist/queue">
              <ListOrdered size={19} />
              <span><strong>Manage queue</strong><small>Call, skip, or remove.</small></span>
              <ArrowUpRight size={16} />
            </Link>
            <Link to="/receptionist/payments">
              <WalletCards size={19} />
              <span><strong>Open checkout</strong><small>Record a mock payment.</small></span>
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </SectionCard>
      </div>
      <div className="dashboard-grid two-thirds">
        <SectionCard
          title="Current queue"
          action={<Link to="/receptionist/queue" className="text-link">Open queue <ArrowRight size={14} /></Link>}
        >
          <QueueMini queue={demo.queue} />
        </SectionCard>
        <SectionCard title="Shift note">
          <div className="shift-note">
            <span className="note-mark">“</span>
            <p>Keep the 1:00 PM slot open for walk-ins. Marco is ready for the next fade.</p>
            <small>Bea · Front desk note</small>
          </div>
        </SectionCard>
      </div>
    </>
  );
}

export function ReceptionistAppointments() {
  const { demo, commit, notify } = useStore();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [actionModal, setActionModal] = useState(null);

  const [cancelModalApt, setCancelModalApt] = useState(null);
  const [cancelReason, setCancelReason] = useState('Barber unavailable');
  const [cancelMessage, setCancelMessage] = useState('');
  const [cancelEmail, setCancelEmail] = useState('');
  const [sendEmailNotice, setSendEmailNotice] = useState(true);
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  const sorted = sortAppointmentsStably(demo.appointments || []);
  const filtered = sorted.filter(
    (item) => `${item.customerName} ${item.serviceName} ${item.barberName}`.toLowerCase().includes(query.toLowerCase()) && (status === 'All' || item.status === status)
  );

  const resolveCustomerEmail = (apt) => {
    if (apt?.customerEmail && apt.customerEmail.includes('@') && !apt.customerEmail.includes('example.com')) {
      return apt.customerEmail;
    }
    const cust = (demo.customers || []).find(
      (c) => (apt?.customerId && c.id === apt.customerId) || (apt?.customerName && c.name?.trim().toLowerCase() === apt.customerName.trim().toLowerCase())
    );
    if (cust?.email && cust.email.includes('@') && !cust.email.includes('example.com')) {
      return cust.email;
    }
    try {
      const raw = window.localStorage.getItem('biglanggwapo-accounts-v2');
      if (raw) {
        const list = Object.values(JSON.parse(raw));
        const matched = list.find((acc) => acc?.email && acc.email.includes('@') && !acc.email.includes('example.com') && acc.name?.trim().toLowerCase() === apt?.customerName?.trim().toLowerCase());
        if (matched?.email) return matched.email;
      }
    } catch {}
    return apt?.customerEmail || '';
  };

  const openCancelModal = (apt) => {
    const email = resolveCustomerEmail(apt);
    setCancelModalApt(apt);
    setCancelEmail(email);
    setCancelReason('Barber unavailable');
    setCancelMessage(`Dear ${apt.customerName},\n\nWe regret to inform you that your appointment for ${apt.serviceName} with ${apt.barberName} on ${humanDate(apt.date)} at ${apt.time} has been cancelled due to barber unavailability. Please feel free to reschedule your visit on our website at your convenience. We apologize for any inconvenience.`);
    setSendEmailNotice(Boolean(email));
  };

  const act = (id, action, cancelInfo = null) => {
    const updater = action === 'confirm' ? demoApi.confirmAppointment : action === 'arrived' ? demoApi.markArrived : demoApi.cancelAppointment;
    let aptToSave = null;
    let queueToSave = null;
    let queueToDeleteId = null;

    commit((state) => {
      const prevQueueItem = (state.queue || []).find((q) => q.appointmentId === id);
      const next = updater(state, id, cancelInfo?.reason, cancelInfo?.message);
      const updatedApt = next.appointments.find((a) => a.id === id || a._id === id);
      if (updatedApt) {
        if (cancelInfo) {
          updatedApt.cancellationReason = cancelInfo.reason || '';
          updatedApt.cancellationMessage = cancelInfo.message || '';
          updatedApt.cancelledAt = new Date().toISOString();
          updatedApt.cancelledBy = 'Receptionist';
        }
        aptToSave = updatedApt;
      }
      if (action === 'arrived') {
        const queueEntry = next.queue.find((q) => q.appointmentId === id || q.appointmentId === updatedApt?.id || q.appointmentId === updatedApt?._id || q.id === `queue-${id}`);
        if (queueEntry) {
          queueToSave = queueEntry;
        }
      } else if (action === 'cancel' && prevQueueItem) {
        queueToDeleteId = prevQueueItem.id;
      }
      return next;
    });

    if (aptToSave) {
      saveAppointmentToAtlas(aptToSave);
      if (action === 'confirm') {
        const targetBarber = (demo.barbers || []).find((b) => 
          (aptToSave.barberId && b.id === aptToSave.barberId) ||
          (b.name && aptToSave.barberName && b.name.trim().toLowerCase() === aptToSave.barberName.trim().toLowerCase())
        );
        // 1. Notify the barber of the confirmed booking
        addSystemNotification({
          title: `New Appointment Confirmed: ${aptToSave.customerName}`,
          message: `Front desk confirmed ${aptToSave.customerName} for ${aptToSave.serviceName} on ${humanDate(aptToSave.date)} at ${aptToSave.time}.`,
          type: 'confirmed',
          recipientRole: 'barber',
          recipientId: aptToSave.barberId || targetBarber?.id || '',
          recipientEmail: targetBarber?.email || '',
          recipientName: aptToSave.barberName,
          actionUrl: '/barber/appointments',
          actionLabel: 'Schedule',
          urgent: true
        });

        // 2. Notify the customer that front desk confirmed their booking
        addSystemNotification({
          title: 'Appointment Confirmed!',
          message: `Your booking for ${aptToSave.serviceName} with ${aptToSave.barberName} on ${humanDate(aptToSave.date)} at ${aptToSave.time} is officially confirmed.`,
          type: 'confirmed',
          recipientRole: 'customer',
          recipientId: aptToSave.customerId,
          recipientEmail: aptToSave.customerEmail,
          recipientName: aptToSave.customerName,
          actionUrl: '/my-appointments',
          actionLabel: 'My Bookings',
          urgent: false
        });
      }
    }
    if (queueToSave) {
      saveQueueItemToAtlas(queueToSave);
    }
    if (queueToDeleteId) {
      deleteQueueItemFromAtlas(queueToDeleteId);
    }

    notify(action === 'arrived' ? 'Customer marked arrived and added to the queue.' : `Appointment ${action}ed.`);
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalApt) return;
    const apt = cancelModalApt;
    setIsSubmittingCancel(true);

    // Cancel in local store and Atlas with reason and message
    act(apt.id, 'cancel', { reason: cancelReason, message: cancelMessage });

    // Store a persistent system notification targeted to this customer
    addSystemNotification({
      title: 'Appointment Cancelled',
      message: `Your booking for ${apt.serviceName} with ${apt.barberName} on ${humanDate(apt.date)} at ${apt.time} was cancelled by front desk.${cancelReason ? ` Reason: ${cancelReason}.` : ''}${cancelMessage ? ` "${cancelMessage}"` : ''}`,
      type: 'cancelled',
      recipientRole: 'customer',
      recipientId: apt.customerId,
      recipientEmail: cancelEmail || apt.customerEmail,
      recipientName: apt.customerName,
      actionUrl: '/service-history',
      actionLabel: 'Service History',
      urgent: true
    });

    // Deliver email if requested
    if (sendEmailNotice && cancelEmail) {
      try {
        const res = await sendCancellationNotification({
          appointment: apt,
          recipientEmail: cancelEmail,
          reason: cancelReason,
          message: cancelMessage
        });
        if (res && res.success) {
          notify(`Appointment cancelled and email notification sent to ${cancelEmail}!`, 'success');
        } else {
          notify(`Appointment cancelled, but email could not be delivered: ${res?.error || 'Service error'}`, 'warning');
        }
      } catch (err) {
        notify(`Appointment cancelled, but email could not be delivered: ${err.message}`, 'warning');
      }
    } else {
      notify(`Appointment for ${apt.customerName} cancelled.`);
    }

    setIsSubmittingCancel(false);
    setCancelModalApt(null);
  };

  return (
    <>
      <Toolbar
        title="Bookings on the board"
        count={filtered.length}
        query={query}
        setQuery={setQuery}
        filter={status}
        setFilter={setStatus}
        filters={['All', 'Pending', 'Confirmed', 'Arrived', 'Completed', 'Cancelled']}
      />
      <SectionCard>
        <DataTable className="appointments-table" columns={['Customer', 'Service', 'Schedule', 'Barber', 'Status', 'Actions']}>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="table-person">
                    <span className="avatar avatar-xs">{item.customerName.split(' ').map((p) => p[0]).join('').slice(0, 2)}</span>
                    <span><strong>{item.customerName}</strong><small>{item.source}</small></span>
                  </div>
                </td>
                <td>{item.serviceName}<small className="table-sub">{currency(item.price)} · {item.duration}m</small></td>
                <td>{humanDate(item.date)}<small className="table-sub">{item.time}</small></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {(() => {
                      const bObj = (demo.barbers || []).find((b) => b.id === item.barberId || b.name === item.barberName);
                      const bImg = item.barberImage || bObj?.image;
                      return bImg ? (
                        <img
                          src={bImg}
                          alt={item.barberName}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '1px solid var(--line)',
                            flexShrink: 0
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextElementSibling) {
                              e.currentTarget.nextElementSibling.style.display = 'inline-grid';
                            }
                          }}
                        />
                      ) : null;
                    })()}
                    <span
                      className="avatar avatar-xs"
                      style={{
                        display: (item.barberImage || (demo.barbers || []).find((b) => b.id === item.barberId || b.name === item.barberName)?.image) ? 'none' : 'inline-grid',
                        width: '28px',
                        height: '28px',
                        fontSize: '11px',
                        flexShrink: 0
                      }}
                    >
                      {(item.barberName || 'BR').slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <span><strong>{item.barberName}</strong></span>
                      {(() => {
                        const bObj = (demo.barbers || []).find((b) => b.id === item.barberId || b.name === item.barberName);
                        if (bObj && (bObj.isUnavailable || bObj.status === 'Unavailable')) {
                          return (
                            <div style={{ marginTop: '2px' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  color: '#b91c1c',
                                  background: '#fee2e2',
                                  border: '1px solid #fca5a5',
                                  borderRadius: '4px',
                                  padding: '1px 5px'
                                }}
                              >
                                ● Unavailable
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </td>
                <td><StatusBadge status={item.status} /></td>
                <td>
                  <div className="row-actions">
                    {item.status === 'Pending' && (
                      <button
                        className="button button-soft button-small"
                        onClick={() => setActionModal({ type: 'confirm', apt: item })}
                      >
                        Confirm
                      </button>
                    )}
                    {item.status === 'Confirmed' && (
                      <button
                        className="button button-dark button-small"
                        onClick={() => setActionModal({ type: 'arrived', apt: item })}
                      >
                        Mark arrived
                      </button>
                    )}
                    {item.status === 'Arrived' && (
                      <Link to="/receptionist/queue" className="button button-soft button-small" style={{ color: 'var(--gold)' }}>
                        In queue →
                      </Link>
                    )}
                    {!['Completed', 'Cancelled'].includes(item.status) && (
                      <button
                        className="icon-button"
                        title="Cancel appointment"
                        onClick={() => openCancelModal(item)}
                      >
                        <X size={16} />
                      </button>
                    )}
                    <button
                      className="icon-button"
                      title="View details"
                      onClick={() => setActionModal({ type: item.status === 'Pending' ? 'confirm' : 'arrived', apt: item })}
                    >
                      <MoreHorizontal size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        {!filtered.length && <EmptyState title="No bookings match" copy="Try a different search or status filter." />}
      </SectionCard>

      {actionModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setActionModal(null)}
        >
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <button
              className="modal-close"
              onClick={() => setActionModal(null)}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>

            {actionModal.type === 'confirm' ? (
              <>
                <div className="modal-heading">
                  <div className="modal-mark">
                    <BadgeCheck size={22} />
                  </div>
                  <h2>Confirm Appointment</h2>
                  <p>Verify booking schedule and barber availability before confirming.</p>
                </div>

                <div
                  style={{
                    background: 'var(--paper)',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span className="eyebrow gold">Customer</span>
                      <strong style={{ fontSize: '15px' }}>{actionModal.apt.customerName}</strong>
                      <small style={{ display: 'block', color: 'var(--muted)', fontSize: '11px' }}>
                        {actionModal.apt.source || 'Online Booking'}
                      </small>
                    </div>
                    <span className="status-badge pending">
                      <i></i>Pending
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                      borderTop: '1px solid var(--line)',
                      paddingTop: '10px'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--muted)', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>
                        Service
                      </span>
                      <strong style={{ fontSize: '12px' }}>{actionModal.apt.serviceName}</strong>
                      <small style={{ display: 'block', color: 'var(--muted)', fontSize: '11px' }}>
                        {currency(actionModal.apt.price)} · {actionModal.apt.duration}m
                      </small>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--muted)', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>
                        Schedule
                      </span>
                      <strong style={{ fontSize: '12px' }}>{humanDate(actionModal.apt.date)}</strong>
                      <small style={{ display: 'block', color: 'var(--gold)', fontWeight: 600, fontSize: '11px' }}>
                        {actionModal.apt.time}
                      </small>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--line)', paddingTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', fontFamily: 'var(--mono)', minWidth: '50px' }}>
                      Barber:
                    </span>
                    <strong style={{ fontSize: '12px' }}>{actionModal.apt.barberName}</strong>
                  </div>
                </div>

                {/* Validation Checks */}
                {(() => {
                  const barber = (demo.barbers || []).find(
                    (b) => b.id === actionModal.apt.barberId || b.name === actionModal.apt.barberName
                  );
                  const isUnavail = Boolean(barber && (barber.isUnavailable || barber.status === 'Unavailable'));
                  const onRest = barber ? isRestDay(barber, actionModal.apt.date) : false;

                  const existingConflict = (demo.appointments || []).find(
                    (a) =>
                      a.id !== actionModal.apt.id &&
                      (a.barberId === actionModal.apt.barberId || a.barberName === actionModal.apt.barberName) &&
                      a.date === actionModal.apt.date &&
                      a.time === actionModal.apt.time &&
                      ['Confirmed', 'Arrived', 'In Service'].includes(a.status)
                  );

                  return (
                    <div style={{ marginBottom: '20px' }}>
                      <span className="eyebrow" style={{ marginBottom: '8px' }}>
                        Booking Validation
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {isUnavail ? (
                          <div
                            style={{
                              padding: '9px 12px',
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              color: '#991b1b',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                            <span>
                              <strong>Warning:</strong> Barber {actionModal.apt.barberName} is currently marked unavailable.
                            </span>
                          </div>
                        ) : onRest ? (
                          <div
                            style={{
                              padding: '9px 12px',
                              background: '#fffbeb',
                              border: '1px solid #fef3c7',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              color: '#92400e',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                            <span>
                              <strong>Rest Day:</strong> {humanDate(actionModal.apt.date)} is a scheduled rest day for {actionModal.apt.barberName}.
                            </span>
                          </div>
                        ) : (
                          <div
                            style={{
                              padding: '8px 12px',
                              background: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              color: '#166534',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            <Check size={15} style={{ flexShrink: 0 }} />
                            <span>Barber {actionModal.apt.barberName} is available and active on schedule.</span>
                          </div>
                        )}

                        {existingConflict ? (
                          <div
                            style={{
                              padding: '9px 12px',
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              color: '#991b1b',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                            <span>
                              <strong>Slot Conflict:</strong> Another active booking ({existingConflict.customerName}) is already set for {actionModal.apt.time}.
                            </span>
                          </div>
                        ) : (
                          <div
                            style={{
                              padding: '8px 12px',
                              background: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              color: '#166534',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            <Check size={15} style={{ flexShrink: 0 }} />
                            <span>Schedule slot ({actionModal.apt.time}) is clear and ready to confirm.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="button button-ghost button-small"
                    onClick={() => setActionModal(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="button button-dark button-small"
                    onClick={() => {
                      const targetId = actionModal.apt.id;
                      setActionModal(null);
                      act(targetId, 'confirm');
                    }}
                  >
                    Confirm Appointment
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="modal-heading">
                  <div className="modal-mark">
                    <Check size={22} />
                  </div>
                  <h2>Mark Customer Arrived</h2>
                  <p>Check in customer and place into live barber queue.</p>
                </div>

                <div
                  style={{
                    background: 'var(--paper)',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span className="eyebrow gold">Customer</span>
                      <strong style={{ fontSize: '15px' }}>{actionModal.apt.customerName}</strong>
                    </div>
                    <span className="status-badge confirmed">
                      <i></i>Confirmed
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                      borderTop: '1px solid var(--line)',
                      paddingTop: '10px'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--muted)', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>
                        Service
                      </span>
                      <strong style={{ fontSize: '12px' }}>{actionModal.apt.serviceName}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--muted)', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>
                        Barber Chair
                      </span>
                      <strong style={{ fontSize: '12px' }}>{actionModal.apt.barberName}</strong>
                    </div>
                  </div>
                </div>

                {/* Queue & Schedule Validation */}
                {(() => {
                  const isToday = actionModal.apt.date === today;
                  const waitingCount = (demo.queue || []).filter(
                    (q) =>
                      (q.barberId === actionModal.apt.barberId || q.barberName === actionModal.apt.barberName) &&
                      !['Completed', 'Removed', 'Skipped'].includes(q.status)
                  ).length;

                  return (
                    <div style={{ marginBottom: '20px' }}>
                      <span className="eyebrow" style={{ marginBottom: '8px' }}>
                        Queue Validation
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div
                          style={{
                            padding: '8px 12px',
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            color: '#166534',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <Check size={15} style={{ flexShrink: 0 }} />
                          <span>Booking is confirmed and validated for check-in.</span>
                        </div>

                        {!isToday ? (
                          <div
                            style={{
                              padding: '9px 12px',
                              background: '#fffbeb',
                              border: '1px solid #fef3c7',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              color: '#92400e',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                            <span>
                              <strong>Note:</strong> Booked for {humanDate(actionModal.apt.date)}, not today. Check-in will queue them today.
                            </span>
                          </div>
                        ) : (
                          <div
                            style={{
                              padding: '8px 12px',
                              background: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              color: '#166534',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            <Check size={15} style={{ flexShrink: 0 }} />
                            <span>Scheduled for today ({actionModal.apt.time}).</span>
                          </div>
                        )}

                        <div
                          style={{
                            padding: '8px 12px',
                            background: 'var(--paper)',
                            border: '1px solid var(--line)',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            color: 'var(--ink)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <ListOrdered size={15} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                          <span>
                            {waitingCount === 0
                              ? `${actionModal.apt.barberName}'s chair is currently open (next in chair)!`
                              : `${waitingCount} client(s) currently ahead in ${actionModal.apt.barberName}'s queue.`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {(() => {
                  const isAlreadyInQueue = (demo.queue || []).some(
                    (q) => (q.appointmentId === actionModal.apt.id || q.appointmentId === actionModal.apt._id || q.id === `queue-${actionModal.apt.id}`) &&
                           !['Removed', 'Completed', 'Skipped'].includes(q.status)
                  );
                  return (
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="button button-ghost button-small"
                        onClick={() => setActionModal(null)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isAlreadyInQueue}
                        className="button button-dark button-small"
                        onClick={() => {
                          if (isAlreadyInQueue) return;
                          const targetId = actionModal.apt.id;
                          setActionModal(null);
                          act(targetId, 'arrived');
                        }}
                      >
                        {isAlreadyInQueue ? 'Already in Queue' : 'Mark Arrived & Add to Queue'}
                      </button>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      )}
      {cancelModalApt && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && !isSubmittingCancel && setCancelModalApt(null)}
        >
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <button
              className="modal-close"
              disabled={isSubmittingCancel}
              onClick={() => setCancelModalApt(null)}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>

            <div className="modal-heading">
              <div className="modal-mark" style={{ background: '#fee2e2', color: '#dc2626' }}>
                <X size={22} />
              </div>
              <h2>Cancel Appointment</h2>
              <p>Send a message and cancellation notice to the customer via email.</p>
            </div>

            {/* Summary Box */}
            <div
              style={{
                background: 'var(--paper)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '14px 16px',
                marginBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="eyebrow gold">Customer</span>
                  <strong style={{ fontSize: '14px' }}>{cancelModalApt.customerName}</strong>
                </div>
                <span className="status-badge pending">
                  <i></i>{cancelModalApt.status}
                </span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  borderTop: '1px solid var(--line)',
                  paddingTop: '8px',
                  fontSize: '12px'
                }}
              >
                <div>
                  <span style={{ color: 'var(--muted)', fontSize: '10px', textTransform: 'uppercase', display: 'block', fontFamily: 'var(--mono)' }}>
                    Service & Barber
                  </span>
                  <strong>{cancelModalApt.serviceName}</strong> · <span>{cancelModalApt.barberName}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--muted)', fontSize: '10px', textTransform: 'uppercase', display: 'block', fontFamily: 'var(--mono)' }}>
                    Scheduled Time
                  </span>
                  <strong>{humanDate(cancelModalApt.date)}</strong> · <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{cancelModalApt.time}</span>
                </div>
              </div>
            </div>

            {/* Reason & Message Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Cancellation Reason
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    'Barber unavailable',
                    'Emergency leave',
                    'Schedule conflict',
                    'Customer requested',
                    'Shop maintenance'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setCancelReason(preset);
                        setCancelMessage(`Dear ${cancelModalApt.customerName},\n\nWe regret to inform you that your appointment for ${cancelModalApt.serviceName} with ${cancelModalApt.barberName} on ${humanDate(cancelModalApt.date)} at ${cancelModalApt.time} has been cancelled due to ${preset.toLowerCase()}. Please feel free to reschedule your visit on our website. We apologize for any inconvenience.`);
                      }}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        border: cancelReason === preset ? '1.5px solid var(--gold, #d4af37)' : '1px solid var(--line)',
                        background: cancelReason === preset ? 'var(--gold-soft)' : 'var(--white)',
                        color: cancelReason === preset ? '#704d20' : 'var(--ink)',
                        cursor: 'pointer'
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Message to Customer (Included in Email)
                </label>
                <textarea
                  className="input textarea"
                  rows={4}
                  value={cancelMessage}
                  onChange={(e) => setCancelMessage(e.target.value)}
                  placeholder="Write a message explaining the cancellation to the customer..."
                  style={{ fontSize: '12.5px', lineHeight: '1.5', minHeight: '90px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Recipient Email
                </label>
                <input
                  className="input"
                  type="email"
                  value={cancelEmail}
                  onChange={(e) => setCancelEmail(e.target.value)}
                  placeholder="customer@email.com"
                  style={{ fontSize: '12.5px' }}
                />
                {!cancelEmail && (
                  <small style={{ color: '#b91c1c', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                    ⚠️ Enter the customer's email address to deliver this cancellation message.
                  </small>
                )}
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={sendEmailNotice}
                  onChange={(e) => setSendEmailNotice(e.target.checked)}
                />
                <span>Send email notification with this message to the customer</span>
              </label>
            </div>

            {/* Modal Footer Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
              <button
                type="button"
                className="button button-ghost button-small"
                disabled={isSubmittingCancel}
                onClick={() => setCancelModalApt(null)}
              >
                Keep Appointment
              </button>
              <button
                type="button"
                className="button button-danger button-small"
                disabled={isSubmittingCancel || (sendEmailNotice && !cancelEmail)}
                onClick={handleConfirmCancel}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {isSubmittingCancel ? 'Cancelling & Sending...' : sendEmailNotice ? 'Cancel & Send Email' : 'Cancel Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function WalkInPage() {
  const { demo, commit, notify } = useStore();
  const defaultBarber = demo.barbers?.find((b) => b.working && !b.isUnavailable && b.status !== 'Unavailable') || demo.barbers?.[0];
  const [form, setForm] = useState({
    customerId: '',
    customerName: '',
    phone: '',
    serviceId: demo.services[0]?.id || '',
    barberId: defaultBarber?.id || ''
  });
  const [created, setCreated] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (!form.customerId && !form.customerName.trim()) {
      return notify('Choose an existing customer or enter a name.', 'error');
    }
    if (!form.barberId) {
      return notify('Please select a barber (or add a barber to the shop first).', 'error');
    }
    setIsSubmitting(true);
    let assignedNumber = '';
    let aptToSave = null;
    let queueToSave = null;

    commit((state) => {
      const next = demoApi.addWalkIn(state, form);
      const newApt = next.appointments[0];
      const newQueue = next.queue[0];
      if (newApt) {
        aptToSave = newApt;
      }
      if (newQueue) {
        assignedNumber = newQueue.number;
        queueToSave = newQueue;
      }
      return next;
    });

    if (aptToSave) {
      saveAppointmentToAtlas(aptToSave);
    }
    if (queueToSave) {
      saveQueueItemToAtlas(queueToSave);
    }

    setCreated(assignedNumber || 'Q-001');
    notify(`Walk-in added to the queue (${assignedNumber || 'Q-001'}).`);
    setForm({
      customerId: '',
      customerName: '',
      phone: '',
      serviceId: demo.services[0]?.id || '',
      barberId: defaultBarber?.id || demo.barbers[0]?.id || ''
    });
    setIsSubmitting(false);
  };

  return (
    <div className="split-layout">
      <SectionCard title="Register a walk-in" description="Create a queue entry without an online booking.">
        <form className="form-stack" onSubmit={submit}>
          <label className="field-label">Existing customer
            <select className="input" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value, customerName: '' })}>
              <option value="">New walk-in</option>
              {demo.customers.filter((c) => c.status === 'Active').map((customer) => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </select>
          </label>
          {!form.customerId && (
            <>
              <label className="field-label">Customer name
                <input className="input" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="e.g. Sam Rivera" required />
              </label>
              <label className="field-label">Phone number
                <input
                  className="input"
                  type="tel"
                  inputMode="numeric"
                  maxLength={11}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                  placeholder="09170000000"
                />
              </label>
            </>
          )}
          <div className="form-grid">
            <label className="field-label">Service
              <select className="input" value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })}>
                {demo.services.filter((s) => s.active).map((service) => (
                  <option key={service.id} value={service.id}>{service.name} · {currency(service.price)}</option>
                ))}
              </select>
            </label>
            <label className="field-label">Preferred barber
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select className="input" style={{ flex: 1 }} value={form.barberId} onChange={(e) => setForm({ ...form, barberId: e.target.value })}>
                  {demo.barbers.filter((b) => b.working).map((barber) => {
                    const isUnavail = Boolean(barber.isUnavailable || barber.status === 'Unavailable');
                    return (
                      <option key={barber.id} value={barber.id} disabled={isUnavail}>
                        {barber.name} {isUnavail ? '(Unavailable)' : ''}
                      </option>
                    );
                  })}
                </select>
                {(() => {
                  const selBarber = demo.barbers?.find((b) => b.id === form.barberId);
                  return selBarber?.image ? (
                    <img
                      src={selBarber.image}
                      alt={selBarber.name}
                      style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--line)', flexShrink: 0 }}
                    />
                  ) : null;
                })()}
              </div>
            </label>
          </div>
          <button className="button button-dark" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add to queue'} <ArrowRight size={16} />
          </button>
        </form>
      </SectionCard>
      <SectionCard title="Assigned queue number">
        <div className="queue-result">
          {created ? (
            <>
              <span className="queue-result-number">{created}</span>
              <strong>Guest is in line.</strong>
              <p>Keep this number visible so the front desk can call them next.</p>
              <Link to="/receptionist/queue" className="button button-ghost">Open queue</Link>
            </>
          ) : (
            <>
              <div className="empty-illustration"><UserPlus size={23} /></div>
              <strong>Ready for the next walk-in</strong>
              <p>After submission, the assigned number and barber will appear here.</p>
            </>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

export function QueueManagement() {
  const { demo, commit, notify } = useStore();
  const [barber, setBarber] = useState('All');
  const [validationModal, setValidationModal] = useState(null);

  const seenAptIds = new Set();
  const seenIds = new Set();
  const active = (demo.queue || []).filter((item) => {
    if (!item) return false;
    if (['Completed', 'Removed', 'Skipped'].includes(item.status)) return false;
    if (barber !== 'All' && item.barberId !== barber) return false;
    const itemId = String(item.id || item._id || '');
    if (itemId && seenIds.has(itemId)) return false;
    if (item.appointmentId) {
      const aptKey = String(item.appointmentId);
      if (seenAptIds.has(aptKey)) return false;
      seenAptIds.add(aptKey);
    }
    if (itemId) seenIds.add(itemId);
    return true;
  });

  const act = (id, type, notes = '') => {
    if (type === 'remove' && !window.confirm('Remove this queue entry?')) return;
    const targetItem = demo.queue.find((q) => q.id === id);
    const api = type === 'call'
      ? (state, qId) => {
          const entry = state.queue.find((item) => item.id === qId);
          if (!entry) return state;
          return {
            ...state,
            queue: state.queue.map((item) => item.id === qId ? { ...item, status: 'Pending', calledAt: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) } : item),
            appointments: state.appointments.map((item) => item.id === entry.appointmentId ? { ...item, status: 'Called' } : item)
          };
        }
      : type === 'start'
      ? demoApi.startService
      : type === 'complete'
      ? (s, qId) => demoApi.completeService(s, qId, notes)
      : type === 'skip'
      ? demoApi.skipQueue
      : demoApi.removeQueue;
    let queueToSave = null;
    let aptToSave = null;
    commit((state) => {
      const next = api(state, id);
      const queueItem = next.queue.find((q) => q.id === id);
      if (queueItem) {
        queueToSave = queueItem;
      }
      if (queueItem?.appointmentId) {
        const apt = next.appointments.find((a) => a.id === queueItem.appointmentId);
        if (apt) aptToSave = apt;
      }
      return next;
    });
    if (queueToSave) {
      saveQueueItemToAtlas(queueToSave);
    }
    if (aptToSave) {
      saveAppointmentToAtlas(aptToSave);
    }
    notify(
      type === 'call'
        ? `Called ${targetItem?.customerName || 'customer'} to chair. Status is now pending for barber to start.`
        : type === 'start'
        ? `Service session started for ${targetItem?.customerName || 'customer'}!`
        : type === 'complete'
        ? `Service completed for ${targetItem?.customerName || 'customer'}! Sent to front desk for checkout.`
        : `Queue entry ${type}ped.`
    );
    if (type === 'call' && targetItem) {
      notifyCustomerTurn(targetItem, demo, notify);
      // Notify the barber that a customer has been called and is pending at their chair
      addSystemNotification({
        title: `Customer Pending at Chair: ${targetItem.customerName}`,
        message: `${targetItem.customerName} (Ticket #${targetItem.number}) has been called to your chair for ${targetItem.serviceName}. Ready for you to start service.`,
        type: 'queue-next',
        recipientRole: 'barber',
        recipientId: targetItem.barberId || '',
        recipientName: targetItem.barberName || '',
        actionUrl: '/barber/queue',
        actionLabel: 'Start Service',
        urgent: true
      });
    }
  };

  return (
    <>
      <Toolbar
        title="Keep chairs moving"
        count={active.length}
        filter={barber}
        setFilter={setBarber}
        filters={['All', ...demo.barbers.map((b) => b.id)]}
        filterLabels={{ All: 'All barbers', ...Object.fromEntries(demo.barbers.map((b) => [b.id, b.name])) }}
        action={
          <Link to="/receptionist/walk-ins" className="button button-dark button-small">
            <Plus size={15} /> Add walk-in
          </Link>
        }
      />
      <div className="queue-board">
        {active.map((item, index) => (
          <div className={`queue-row ${item.status === 'In Service' ? 'current' : ''}`} key={item.id}>
            <div className="queue-rank">{index === 0 ? <Zap size={15} /> : index + 1}</div>
            <div className="queue-main">
              <strong>{item.number} · {item.customerName}</strong>
              <span>{item.serviceName} · {item.barberName}</span>
            </div>
            <StatusBadge status={item.status} />
            <span className="queue-wait">
              {item.status === 'In Service' ? 'In chair · with barber' : (item.status === 'Called' || item.status === 'Pending') ? 'Pending · barber starting' : `~${item.estimatedMinutes} min`}
            </span>
            <div className="row-actions">
              {item.status === 'Waiting' && (
                <button className="button button-soft button-small" onClick={() => act(item.id, 'call')}>
                  Call next
                </button>
              )}
              {(item.status === 'Called' || item.status === 'Pending') && (
                <span className="status-badge pending" style={{ padding: '5px 9px', fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <i />Pending barber
                </span>
              )}
              {item.status === 'In Service' && (
                <span className="status-badge in-service" style={{ padding: '5px 9px', fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <i />In Service
                </span>
              )}
              {item.status === 'Waiting' && (
                <button className="icon-button" title="Skip" onClick={() => act(item.id, 'skip')}>
                  <ChevronRight size={16} />
                </button>
              )}
              <button
                className="icon-button"
                title="Send email alert: Kayo na po ang gugupitan!"
                onClick={() => notifyCustomerTurn(item, demo, notify)}
              >
                <Mail size={16} />
              </button>
              <button className="icon-button" title="Remove" onClick={() => act(item.id, 'remove')}>
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
        {!active.length && (
          <EmptyState
            title="Queue is clear"
            copy="Walk-ins and arrived appointments will land here."
            action={<Link className="button button-dark" to="/receptionist/walk-ins">Add walk-in</Link>}
          />
        )}
      </div>

      {validationModal && (
        <ServiceValidationModal
          isOpen={Boolean(validationModal)}
          type={validationModal.type}
          item={validationModal.item}
          onClose={() => setValidationModal(null)}
          onConfirm={(item, notes) => {
            const modalType = validationModal.type;
            setValidationModal(null);
            act(item.id, modalType, notes);
          }}
        />
      )}
    </>
  );
}

export function CustomerManagement() {
  const { demo, commit, notify } = useStore();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(demo.customers[0]);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', preferences: '', notes: '' });
  const [showPassword, setShowPassword] = useState(false);

  const filtered = demo.customers.filter((item) =>
    `${item.name} ${item.email} ${item.phone}`.toLowerCase().includes(query.toLowerCase())
  );

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password) {
      return notify('All fields (Name, Email, Phone, Password) are required.', 'error');
    }
    const phoneError = validatePhone(form.phone);
    if (phoneError) {
      return notify(phoneError, 'error');
    }
    const pwdError = validatePassword(form.password);
    if (pwdError) {
      return notify(pwdError, 'error');
    }
    const cleanEmail = form.email.trim().toLowerCase();
    const initials = form.name.trim().split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'CU';
    const newCustId = 'cust-' + Date.now();

    const createdCustomer = {
      id: newCustId,
      name: form.name.trim(),
      initials,
      email: cleanEmail,
      phone: form.phone.trim(),
      status: 'Active',
      visits: 0,
      lastVisit: 'Never',
      preferences: form.preferences.trim(),
      notes: form.notes.trim()
    };

    commit((state) => demoApi.addCustomer(state, createdCustomer));
    await saveAccount({
      email: cleanEmail,
      password: form.password,
      role: 'customer',
      customerId: newCustId,
      name: form.name.trim(),
      initials,
      redirectPath: '/booking'
    });

    setSelected(createdCustomer);
    setIsAdding(false);
    setForm({ name: '', email: '', phone: '', password: '', preferences: '', notes: '' });
    notify(`Customer "${form.name}" created! Sending welcome email...`);
    sendInviteNotification({
      to: cleanEmail,
      name: form.name.trim(),
      role: 'customer',
      password: form.password
    }).then((res) => {
      if (res.success) notify(res.previewUrl ? 'Email sent in TEST mode (Gmail not configured in .env).' : `Welcome email sent to ${cleanEmail}!`, res.previewUrl ? 'warning' : 'success');
      else notify(`Email failed: ${res.error || res.message}`, 'error');
    });
  };

  return (
    <div className="split-layout customer-management">
      <SectionCard
        title="Customers"
        description="Search profiles, appointment history, and service notes."
        action={
          <button className="button button-dark button-small" onClick={() => setIsAdding(true)}>
            <Plus size={14} /> Add customer
          </button>
        }
      >
        <div className="inline-search">
          <Search size={16} />
          <input placeholder="Search by name, email, or phone" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="customer-list">
          {filtered.map((customer) => (
            <button
              key={customer.id}
              className={`customer-list-row ${selected?.id === customer.id ? 'selected' : ''}`}
              onClick={() => setSelected(customer)}
            >
              {customer.image ? (
                <img
                  src={customer.image}
                  alt={customer.name}
                  style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--line)', flexShrink: 0 }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) e.currentTarget.nextElementSibling.style.display = 'inline-grid';
                  }}
                />
              ) : null}
              <span className="avatar avatar-sm" style={{ display: customer.image ? 'none' : 'inline-grid' }}>{customer.initials}</span>
              <span><strong>{customer.name}</strong><small>{customer.email}</small></span>
              <StatusBadge status={customer.status} />
            </button>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Customer detail" action={<button className="icon-button"><MoreHorizontal size={17} /></button>}>
        {selected ? (
          <div className="customer-detail">
            <div className="customer-detail-head">
              {selected.image ? (
                <img
                  src={selected.image}
                  alt={selected.name}
                  style={{ width: 58, height: 58, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold)', flexShrink: 0 }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) e.currentTarget.nextElementSibling.style.display = 'inline-grid';
                  }}
                />
              ) : null}
              <span className="avatar avatar-lg" style={{ display: selected.image ? 'none' : 'inline-grid' }}>{selected.initials}</span>
              <div>
                <h2>{selected.name}</h2>
                <p>{selected.email} · {selected.phone}</p>
              </div>
            </div>
            <div className="detail-facts">
              <span><small>Visits</small><strong>{selected.visits}</strong></span>
              <span><small>Last visit</small><strong>{selected.lastVisit}</strong></span>
              <span><small>Status</small><strong>{selected.status}</strong></span>
            </div>
            <div className="detail-block">
              <span className="eyebrow">Preferences</span>
              <p>{selected.preferences || 'No preferences added.'}</p>
            </div>
            <div className="detail-block">
              <span className="eyebrow">Notes</span>
              <p>{selected.notes || 'No notes added.'}</p>
            </div>
            <div className="detail-block">
              <span className="eyebrow">Recent bookings</span>
              {demo.appointments.filter((item) => item.customerId === selected.id).slice(0, 3).map((item) => (
                <AppointmentRow key={item.id} appointment={item} />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState title="Select a customer" copy="Choose a profile from the list." />
        )}
      </SectionCard>

      {isAdding && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setIsAdding(false)}>
          <div className="modal-card">
            <button className="modal-close" onClick={() => setIsAdding(false)} aria-label="Close dialog">
              <X size={18} />
            </button>
            <div className="modal-heading">
              <span className="eyebrow gold">Front Desk Client Registration</span>
              <h2>Add New Customer</h2>
              <p>Register a client account for booking and front-desk visits.</p>
            </div>

            <form className="form-stack" onSubmit={handleCreateCustomer}>
              <label className="field-label">Full name
                <input
                  className="input"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Juan Dela Cruz"
                  autoFocus
                />
              </label>
              <label className="field-label">Email address
                <input
                  className="input"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@email.com"
                />
              </label>
              <label className="field-label">Phone number
                <input
                  className="input"
                  type="tel"
                  inputMode="numeric"
                  required
                  maxLength={11}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                  placeholder="09170000000"
                />
              </label>
              <label className="field-label">Login password
                <div className="password-input">
                  <input
                    className="input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="*********"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
              <label className="field-label">Hair preferences (optional)
                <input
                  className="input"
                  value={form.preferences}
                  onChange={(e) => setForm({ ...form, preferences: e.target.value })}
                  placeholder="e.g. Mid taper fade, scissor on top"
                />
              </label>
              <label className="field-label">Internal notes (optional)
                <input
                  className="input"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. Regular weekend client"
                />
              </label>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="button button-ghost button-full" onClick={() => setIsAdding(false)}>
                  Cancel
                </button>
                <button type="submit" className="button button-dark button-full">
                  Create customer <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function PaymentPage() {
  const { demo, commit, notify } = useStore();
  const [selected, setSelected] = useState('');
  const [method, setMethod] = useState('Cash');
  const [cash, setCash] = useState('');

  const unpaid = demo.appointments.filter((item) => item.status === 'Completed' && item.paymentStatus === 'Unpaid');
  const item = demo.appointments.find((appointment) => appointment.id === selected);
  const change = method === 'Cash' ? Math.max(0, Number(cash || 0) - Number(item?.price || 0)) : 0;

  const pay = () => {
    if (!item) return notify('Choose a completed service to check out.', 'error');
    if (method === 'Cash' && Number(cash) < item.price) return notify('Cash received must cover the total.', 'error');
    try {
      commit((state) => {
        const next = demoApi.recordPayment(state, item.id, method, cash);
        const apt = next.appointments.find((a) => a.id === item.id);
        if (apt) saveAppointmentToAtlas(apt);
        const newTxn = next.transactions?.[0];
        if (newTxn) saveTransactionToAtlas(newTxn);
        return next;
      });
      notify('Payment recorded and transaction saved to database.');
      setSelected('');
      setCash('');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  return (
    <div className="split-layout">
      <SectionCard title="Completed services awaiting payment" description="Only completed services can be checked out.">
        <div className="checkout-list">
          {unpaid.map((appointment) => (
            <button
              className={`checkout-row ${selected === appointment.id ? 'selected' : ''}`}
              key={appointment.id}
              onClick={() => setSelected(appointment.id)}
            >
              <span className="avatar avatar-sm">{appointment.customerName.split(' ').map((p) => p[0]).join('').slice(0, 2)}</span>
              <span><strong>{appointment.customerName}</strong><small>{appointment.serviceName} · {appointment.barberName}</small></span>
              <b>{currency(appointment.price)}</b>
            </button>
          ))}
          {!unpaid.length && <EmptyState title="Nothing to check out" copy="Completed unpaid services will appear here." />}
        </div>
      </SectionCard>
      <SectionCard title="Checkout" description="GCash and Card are mock recording methods only.">
        {item ? (
          <div className="checkout-panel">
            <div className="checkout-total">
              <span>Total due</span>
              <strong>{currency(item.price)}</strong>
            </div>
            <div className="method-tabs">
              {['Cash', 'GCash', 'Card (demo)'].map((itemMethod) => (
                <button key={itemMethod} className={method === itemMethod ? 'active' : ''} onClick={() => setMethod(itemMethod)}>
                  {itemMethod}
                </button>
              ))}
            </div>
            {method === 'Cash' && (
              <label className="field-label">Cash received
                <input className="input" type="number" min={item.price} value={cash} onChange={(e) => setCash(e.target.value)} placeholder={item.price} />
                <small className="change-hint">Change: {currency(change)}</small>
              </label>
            )}
            <button className="button button-dark button-full" onClick={pay}>Record payment <Check size={16} /></button>
            <button className="button button-ghost button-full" onClick={() => notify('Receipt preview is ready for printing in the demo.')}>Preview printable receipt <FileText size={16} /></button>
          </div>
        ) : (
          <EmptyState title="Select a service" copy="Choose a completed service from the left." />
        )}
      </SectionCard>
    </div>
  );
}

export function ReceptionistProductsPage() {
  const { demo, commit, notify } = useStore();
  const [query, setQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [method, setMethod] = useState('Cash');
  const [cashReceived, setCashReceived] = useState('');

  // Retail products for sale
  const products = (demo.inventory || []).filter((item) =>
    (item.category || '').toLowerCase().includes('sale') ||
    (item.category || '').toLowerCase().includes('product') ||
    (item.category || '').toLowerCase().includes('retail')
  );

  const displayList = products.length > 0 ? products : (demo.inventory || []);

  const filtered = displayList.filter((item) =>
    `${item.name} ${item.category} ${item.notes || ''}`.toLowerCase().includes(query.toLowerCase())
  );

  const totalCost = selectedProduct ? (Number(selectedProduct.cost) || 0) * Number(quantity) : 0;
  const change = method === 'Cash' ? Math.max(0, Number(cashReceived || 0) - totalCost) : 0;

  const handleOpenSale = (prod) => {
    if (Number(prod.stock) <= 0) {
      return notify(`"${prod.name}" is out of stock!`, 'error');
    }
    setSelectedProduct(prod);
    setQuantity(1);
    setCustomerName('Walk-in Customer');
    setMethod('Cash');
    setCashReceived(String(prod.cost || ''));
  };

  const handleCompleteSale = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const qty = Number(quantity);
    if (qty <= 0 || qty > Number(selectedProduct.stock)) {
      return notify(`Quantity must be between 1 and ${selectedProduct.stock}.`, 'error');
    }
    if (method === 'Cash' && Number(cashReceived) < totalCost) {
      return notify('Cash received must cover the purchase total.', 'error');
    }

    const newStock = Number(selectedProduct.stock) - qty;
    const updatedProduct = { ...selectedProduct, stock: newStock };

    const newTxn = {
      id: 'txn-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
      receipt: `BG-RET-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${Math.floor(Math.random() * 900 + 100)}`,
      customerName: customerName.trim() || 'Walk-in Customer',
      serviceName: `${selectedProduct.name} (x${qty})`,
      amount: totalCost,
      method,
      status: 'Paid',
      type: 'Retail',
      date: today,
      time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      cashReceived: method === 'Cash' ? Number(cashReceived) : undefined,
      change: method === 'Cash' ? change : undefined,
      items: [{ id: selectedProduct.id, name: selectedProduct.name, quantity: qty, price: selectedProduct.cost }]
    };

    // Update local state immediately
    commit((state) => ({
      ...state,
      inventory: (state.inventory || []).map((p) => p.id === selectedProduct.id ? updatedProduct : p),
      transactions: [newTxn, ...(state.transactions || [])]
    }));

    // Synchronize to Atlas
    await Promise.all([
      saveInventoryToAtlas(updatedProduct).catch((err) => console.error('Failed to update inventory:', err)),
      saveTransactionToAtlas(newTxn).catch((err) => console.error('Failed to save transaction:', err))
    ]);

    notify(`Sold ${qty}x ${selectedProduct.name}! Stock updated to ${newStock} and transaction logged to database.`);
    setSelectedProduct(null);
  };

  return (
    <>
      <BentoStats
        items={[
          ['Retail Products', `${displayList.length} items`, ShoppingBag, 'Products available for onsite purchase'],
          ['Total in Stock', `${displayList.reduce((sum, p) => sum + (Number(p.stock) || 0), 0)} units`, Package, 'Across all retail items'],
          ['Low Stock Alerts', `${displayList.filter((p) => Number(p.stock) <= Number(p.threshold || 5)).length} items`, Tag, 'At or below restock threshold'],
          ["Today's Retail Sales", currency((demo.transactions || []).filter((t) => t.date === today && t.type === 'Retail').reduce((sum, t) => sum + (Number(t.amount) || 0), 0)), WalletCards, 'Collected onsite today']
        ]}
      />

      <Toolbar
        title="Products & Retail (Onsite Sales)"
        count={filtered.length}
        query={query}
        setQuery={setQuery}
        description="Sell hair care products, pomades, and grooming goods directly to customers onsite."
      />

      <div className="choice-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {filtered.map((item) => {
          const isOut = Number(item.stock) <= 0;
          const isLow = Number(item.stock) <= Number(item.threshold || 5);
          return (
            <div
              key={item.id}
              className="choice-card retail-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'stretch',
                width: '100%',
                padding: '20px',
                border: isOut ? '1px solid #fee2e2' : '1px solid var(--line)',
                background: isOut ? '#fef2f2' : 'var(--white)',
                borderRadius: '10px'
              }}
            >
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>
                  <span className="eyebrow gold" style={{ fontSize: '10px' }}>{item.category}</span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 9px',
                    borderRadius: '20px',
                    whiteSpace: 'nowrap',
                    background: isOut ? '#fee2e2' : isLow ? '#fef3c7' : '#ecfdf5',
                    color: isOut ? '#b91c1c' : isLow ? '#b45309' : '#047857'
                  }}>
                    {isOut ? 'Out of stock' : `${item.stock} ${item.unit || 'units'} left`}
                  </span>
                </div>
                <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: 'var(--ink)' }}>{item.name}</h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)', lineHeight: 1.45 }}>{item.notes || 'Premium salon-grade shop merchandise.'}</p>
              </div>

              <div style={{
                marginTop: '18px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--line)',
                paddingTop: '14px',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flexShrink: 0 }}>
                  <small style={{ color: 'var(--muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Price</small>
                  <strong style={{ fontSize: '18px', color: 'var(--charcoal)', fontWeight: 800, whiteSpace: 'nowrap' }}>{currency(item.cost)}</strong>
                </div>
                <button
                  type="button"
                  disabled={isOut}
                  className={`button button-small ${isOut ? 'button-ghost' : 'button-dark'}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: isOut ? 'not-allowed' : 'pointer'
                  }}
                  onClick={() => handleOpenSale(item)}
                >
                  <ShoppingBag size={14} />
                  <span>{isOut ? 'Out of stock' : 'Sell Onsite'}</span>
                </button>
              </div>
            </div>
          );
        })}
        {!filtered.length && (
          <div style={{ gridColumn: '1 / -1' }}>
            <EmptyState
              icon={ShoppingBag}
              title="No retail products found"
              copy="Add items under category 'Products for Sale' in Admin → Inventory to sell them at the front desk."
            />
          </div>
        )}
      </div>

      {selectedProduct && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setSelectedProduct(null)}>
          <div className="modal-card">
            <button className="modal-close" onClick={() => setSelectedProduct(null)} aria-label="Close dialog">
              <X size={18} />
            </button>
            <div className="modal-heading">
              <div className="modal-mark"><ShoppingBag size={20} /></div>
              <span className="eyebrow gold">Front Desk Retail Checkout</span>
              <h2>Sell Product Onsite</h2>
              <p>Decrements stock from Atlas and logs transaction directly to database.</p>
            </div>

            <form className="form-stack" onSubmit={handleCompleteSale}>
              <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', padding: '14px', borderRadius: '8px' }}>
                <span className="eyebrow">{selectedProduct.category}</span>
                <h3 style={{ margin: '2px 0 4px', fontSize: '16px' }}>{selectedProduct.name}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>Price per unit: <strong>{currency(selectedProduct.cost)}</strong></span>
                  <span style={{ color: 'var(--gold)', fontWeight: 600 }}>Available: {selectedProduct.stock} {selectedProduct.unit}</span>
                </div>
              </div>

              <div className="form-grid">
                <label className="field-label">Quantity to sell
                  <input
                    className="input"
                    type="number"
                    min="1"
                    max={selectedProduct.stock}
                    required
                    value={quantity}
                    onChange={(e) => {
                      const val = Math.min(Number(selectedProduct.stock), Math.max(1, Number(e.target.value)));
                      setQuantity(val);
                      if (method === 'Cash') setCashReceived(String(val * Number(selectedProduct.cost)));
                    }}
                  />
                </label>
                <label className="field-label">Customer name
                  <input
                    className="input"
                    required
                    placeholder="e.g. Walk-in Guest / Juan"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </label>
              </div>

              <div className="field-label">Payment Method
                <div className="method-tabs" style={{ marginTop: '6px' }}>
                  {['Cash', 'GCash', 'Card'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={method === m ? 'active' : ''}
                      onClick={() => setMethod(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {method === 'Cash' && (
                <label className="field-label">Cash received (₱)
                  <input
                    className="input"
                    type="number"
                    min={totalCost}
                    required
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder={totalCost}
                  />
                  <small className="change-hint" style={{ display: 'block', marginTop: '4px', color: '#166534', fontWeight: 600 }}>
                    Change due: {currency(change)}
                  </small>
                </label>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'var(--charcoal)', color: '#fff', borderRadius: '8px', marginTop: '10px' }}>
                <span style={{ fontSize: '13px', opacity: 0.9 }}>Total Amount</span>
                <strong style={{ fontSize: '20px', color: 'var(--gold)' }}>{currency(totalCost)}</strong>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="button button-ghost button-full" onClick={() => setSelectedProduct(null)}>
                  Cancel
                </button>
                <button type="submit" className="button button-dark button-full">
                  Confirm & Print Receipt <Check size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function ReceptionistReviewsPage() {
  return <ReviewsManagement role="receptionist" />;
}

export function TransactionsPage() {
  const { demo, commit, notify } = useStore();
  const [query, setQuery] = useState('');

  const filtered = (demo.transactions || []).filter((item) =>
    `${item.customerName || ''} ${item.serviceName || ''} ${item.receipt || ''} ${item.type || ''}`.toLowerCase().includes(query.toLowerCase())
  );

  const handleDelete = async (id, receipt) => {
    if (window.confirm(`Delete transaction ${receipt} from database?`)) {
      commit((state) => ({
        ...state,
        transactions: (state.transactions || []).filter((t) => t.id !== id)
      }));
      await deleteTransactionFromAtlas(id);
      notify('Transaction removed from database.');
    }
  };

  return (
    <>
      <Toolbar
        title="Daily transactions"
        count={filtered.length}
        query={query}
        setQuery={setQuery}
        action={
          <button
            className="button button-ghost button-small"
            onClick={() => {
              const headers = 'Receipt,Customer,Service/Product,Type,Method,Amount,Date,Time\n';
              const rows = filtered.map((t) => `"${t.receipt || ''}","${t.customerName || ''}","${t.serviceName || ''}","${t.type || 'Service'}","${t.method || 'Cash'}",${t.amount},"${t.date}","${t.time || ''}"`).join('\n');
              const blob = new Blob([headers + rows], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `transactions-${today}.csv`;
              a.click();
            }}
          >
            <Download size={15} /> Export CSV
          </button>
        }
      />
      <div className="stats-row small-stats">
        <StatCard label="Gross sales" value={currency((demo.transactions || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0))} icon={WalletCards} />
        <StatCard label="Cash" value={currency((demo.transactions || []).filter((item) => item.method === 'Cash').reduce((sum, item) => sum + (Number(item.amount) || 0), 0))} icon={ShoppingBag} />
        <StatCard label="Digital" value={currency((demo.transactions || []).filter((item) => item.method !== 'Cash').reduce((sum, item) => sum + (Number(item.amount) || 0), 0))} icon={Zap} />
      </div>
      <SectionCard>
        <DataTable columns={['Receipt', 'Customer', 'Service / Item', 'Type', 'Method', 'Amount', 'Date & Time', 'Action']}>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                <td><strong>{item.receipt}</strong></td>
                <td>{item.customerName}</td>
                <td>{item.serviceName}</td>
                <td>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: item.type === 'Retail' ? 'rgba(197, 160, 89, 0.15)' : 'var(--paper)',
                    color: item.type === 'Retail' ? 'var(--gold)' : 'var(--charcoal)'
                  }}>
                    {item.type || 'Service'}
                  </span>
                </td>
                <td><span className="method-label">{item.method}</span></td>
                <td><strong>{currency(item.amount)}</strong></td>
                <td>{humanDate(item.date)}<small className="table-sub">{item.time}</small></td>
                <td>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#d92d20', cursor: 'pointer', padding: '4px' }}
                    onClick={() => handleDelete(item.id, item.receipt)}
                    title="Delete transaction"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        {!filtered.length && (
          <EmptyState
            icon={WalletCards}
            title="No transactions found"
            copy="Completed service payments and retail onsite sales will be recorded here live into MongoDB Atlas."
          />
        )}
      </SectionCard>
    </>
  );
}

export function useCurrentReceptionist() {
  const { demo, session } = useStore();

  const cleanEmail = (session?.email || '').toLowerCase().trim();
  const matched = (demo.receptionists || []).find((r) =>
    (session?.receptionistId && r.id === session.receptionistId) ||
    (cleanEmail && r.email && r.email.toLowerCase().trim() === cleanEmail) ||
    (session?.name && r.name && r.name.toLowerCase().trim() === session.name.toLowerCase().trim())
  );

  const receptionistId = session?.receptionistId || matched?.id || demo.receptionists?.[0]?.id || 'rec-1';
  const receptionistName = session?.name || matched?.name || demo.receptionists?.[0]?.name || 'Receptionist';
  const receptionist = matched || demo.receptionists?.[0] || null;

  return { receptionist, receptionistId, receptionistName };
}

const DESK_TITLE_PRESETS = [
  'Front Desk Officer',
  'Lead Cashier & Host',
  'Queue & Booking Specialist',
  'Customer Experience Lead',
  'Store Shift Supervisor'
];

const RECEPTION_SCHEDULES = [
  'Morning Shift · 8:30 AM – 5:30 PM (Break: 12:00 PM – 1:00 PM)',
  'Mid Shift · 10:00 AM – 7:00 PM (Break: 1:30 PM – 2:30 PM)',
  'Closing Shift · 11:30 AM – 8:30 PM (Break: 2:30 PM – 3:30 PM)',
  'Full Day Weekend · 9:00 AM – 8:00 PM (Break: 1:00 PM – 2:00 PM)'
];

export function ReceptionistProfile() {
  const { session, updateSession, notify, commit, demo } = useStore();
  const { receptionist, receptionistId, receptionistName } = useCurrentReceptionist();

  const getInitialPhoto = () => {
    const acc = session?.email ? getAccounts()[session.email.toLowerCase()] : null;
    return session?.photoUrl || session?.image || receptionist?.photoUrl || receptionist?.image || acc?.photoUrl || acc?.image || '';
  };

  const [editing, setEditing] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(getInitialPhoto);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [name, setName] = useState(receptionist?.name || session?.name || 'Receptionist');
  const [phone, setPhone] = useState(receptionist?.phone || session?.phone || '');
  const [deskTitle, setDeskTitle] = useState(receptionist?.deskTitle || session?.deskTitle || 'Front Desk Officer');
  const [deskNotes, setDeskNotes] = useState(receptionist?.deskNotes || session?.deskNotes || 'Station 1 · Active & Ready');
  const [shiftSchedule, setShiftSchedule] = useState(receptionist?.shiftSchedule || session?.shiftSchedule || RECEPTION_SCHEDULES[0]);
  const [dailyGreeting, setDailyGreeting] = useState(receptionist?.dailyGreeting || session?.dailyGreeting || 'Welcome to Biglang Gwapo! Please take a seat or check in at the counter.');

  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);

  // Preference alerts state
  const prefKey = `biglanggwapo-receptionist-prefs-${session?.email || 'default'}`;
  const loadPrefs = () => {
    try {
      const saved = window.localStorage.getItem(prefKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { walkInAlerts: true, appointmentAlerts: true, checkoutSound: false };
  };
  const [prefs, setPrefs] = useState(loadPrefs);

  const togglePref = (key) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try { window.localStorage.setItem(prefKey, JSON.stringify(next)); } catch {}
      notify('Alert preferences updated.');
      return next;
    });
  };

  useEffect(() => {
    if (receptionist || session) {
      if (receptionist?.name || session?.name) setName(receptionist?.name || session?.name || '');
      if (receptionist?.phone || session?.phone) setPhone(receptionist?.phone || session?.phone || '');
      if (receptionist?.deskTitle || session?.deskTitle) setDeskTitle(receptionist?.deskTitle || session?.deskTitle || 'Front Desk Officer');
      if (receptionist?.deskNotes || session?.deskNotes) setDeskNotes(receptionist?.deskNotes || session?.deskNotes || 'Station 1 · Active & Ready');
      if (receptionist?.shiftSchedule || session?.shiftSchedule) setShiftSchedule(receptionist?.shiftSchedule || session?.shiftSchedule || RECEPTION_SCHEDULES[0]);
      if (receptionist?.dailyGreeting || session?.dailyGreeting) setDailyGreeting(receptionist?.dailyGreeting || session?.dailyGreeting || '');
      const latestPhoto = getInitialPhoto();
      setPhotoUrl(latestPhoto);
    }
  }, [receptionist, session]);

  const initials = receptionist?.initials || (name ? name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() : 'RC');

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

        const rId = receptionist?.id || session?.receptionistId || receptionistId;
        commit((state) => {
          const cleanEmail = (session?.email || '').toLowerCase().trim();
          const updatedRecs = (state.receptionists || []).map((r) => {
            if (r.id === rId || (r.email && r.email.toLowerCase().trim() === cleanEmail)) {
              return { ...r, image: newPhoto, photoUrl: newPhoto };
            }
            return r;
          });
          return { ...state, receptionists: updatedRecs };
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
    const rId = receptionist?.id || session?.receptionistId || receptionistId;
    commit((state) => {
      const cleanEmail = (session?.email || '').toLowerCase().trim();
      const updatedRecs = (state.receptionists || []).map((r) => {
        if (r.id === rId || (r.email && r.email.toLowerCase().trim() === cleanEmail)) {
          return { ...r, image: '', photoUrl: '' };
        }
        return r;
      });
      return { ...state, receptionists: updatedRecs };
    });
    notify('Profile picture removed.', 'success');
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      return notify('Receptionist name cannot be empty.', 'error');
    }
    if (phone.trim()) {
      const phoneError = validatePhone(phone);
      if (phoneError) return notify(phoneError, 'error');
    }

    setEditing(false);
    const rId = receptionist?.id || session?.receptionistId || receptionistId;
    const updatedRecData = {
      name: name.trim(),
      phone: phone.trim(),
      deskTitle: deskTitle.trim() || 'Front Desk Officer',
      deskNotes: deskNotes.trim(),
      shiftSchedule,
      dailyGreeting: dailyGreeting.trim(),
      photoUrl,
      image: photoUrl
    };

    if (updateSession) {
      updateSession({
        ...updatedRecData,
        receptionistId: rId
      });
    }

    if (session?.email) {
      saveAccount({
        email: session.email,
        name: updatedRecData.name,
        phone: updatedRecData.phone,
        deskTitle: updatedRecData.deskTitle,
        deskNotes: updatedRecData.deskNotes,
        shiftSchedule: updatedRecData.shiftSchedule,
        image: photoUrl,
        photoUrl,
        role: 'receptionist',
        receptionistId: rId
      });
    }

    commit((state) => {
      const cleanEmail = (session?.email || '').toLowerCase().trim();
      const updatedRecs = (state.receptionists || []).map((r) => {
        if (r.id === rId || (cleanEmail && r.email && r.email.toLowerCase() === cleanEmail)) {
          return { ...r, ...updatedRecData };
        }
        return r;
      });
      return {
        ...state,
        receptionists: updatedRecs
      };
    });

    notify('Receptionist profile & front-desk customization saved successfully!', 'success');
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!newPassword) {
      return notify('Please enter a new password.', 'error');
    }
    const pwdErr = validatePassword(newPassword);
    if (pwdErr) {
      return notify(pwdErr, 'error');
    }
    if (newPassword !== confirmPassword) {
      return notify('Passwords do not match.', 'error');
    }

    setIsUpdatingPwd(true);
    if (session?.email) {
      saveAccount({
        email: session.email,
        password: newPassword
      });
      notify('Password updated successfully!', 'success');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } else {
      notify('Unable to update password: No logged in session email found.', 'error');
    }
    setIsUpdatingPwd(false);
  };

  // Password requirements real-time check
  const hasEightChars = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=\\/\[\]~`]/.test(newPassword);
  const passwordsMatch = newPassword && newPassword === confirmPassword;

  const todayAppointments = (demo.appointments || []).filter((item) => item.date === today);
  const todayTransactions = (demo.transactions || []).filter((item) => item.date === today);
  const sales = todayTransactions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <>
      <BentoStats
        items={[
          ['Front Desk Lead', name, UserRound, deskTitle || 'Front Desk Officer'],
          ['Contact phone', phone || 'Not registered', BadgeCheck, 'Station phone & SMS'],
          ['Front Desk Shift', shiftSchedule.split('·')[0].trim() || 'Day Shift', Clock3, 'Station 1 Active'],
          ["Today's Sales", currency(sales), WalletCards, `${todayTransactions.length} transaction${todayTransactions.length === 1 ? '' : 's'} verified`]
        ]}
      />

      <Toolbar
        title="Receptionist Profile & Settings"
        description="Customize your front-desk identity, shift schedule, daily announcements, and account security."
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
                {initials}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0 }}>{name}</h2>
                <span className="status-badge active" style={{ fontSize: '10px' }}>
                  <i /> Station 1 Active
                </span>
              </div>
              <p style={{ marginTop: '4px' }}>
                {session?.email || receptionist?.email || 'receptionist@biglanggwapo.com'} · {deskTitle}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
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

            <button
              type="button"
              className="button button-ghost button-small"
              onClick={() => setEditing(!editing)}
            >
              <Pencil size={14} /> {editing ? 'Cancel' : 'Edit profile'}
            </button>
          </div>

          <div className="profile-fields">
            <label className="field-label">
              Full name
              <input
                className="input"
                autoComplete="off"
                disabled={!editing}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maria Santos"
              />
            </label>

            <label className="field-label">
              Email address
              <input
                className="input"
                disabled
                value={session?.email || receptionist?.email || 'receptionist@biglanggwapo.com'}
                readOnly
              />
            </label>

            <label className="field-label">
              Contact mobile number
              <input
                className="input"
                type="tel"
                inputMode="numeric"
                maxLength={11}
                disabled={!editing}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="09170000000"
              />
            </label>

            <div className="field-label">
              Front desk title & position
              <input
                className="input"
                disabled={!editing}
                value={deskTitle}
                onChange={(e) => setDeskTitle(e.target.value)}
                placeholder="e.g. Front Desk Officer"
              />
              <span style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>
                {editing ? 'Quick select preset role title:' : 'Standard desk positions:'}
              </span>
              <div className="profile-tag-group">
                {DESK_TITLE_PRESETS.map((preset) => {
                  const active = deskTitle.toLowerCase() === preset.toLowerCase();
                  return (
                    <button
                      key={preset}
                      type="button"
                      className={`profile-tag-chip ${active ? 'active' : ''}`}
                      onClick={() => editing && setDeskTitle(preset)}
                      disabled={!editing}
                    >
                      {active ? <Check size={11} /> : <Plus size={11} />}
                      {preset}
                    </button>
                  );
                })}
              </div>
            </div>

            <hr className="profile-section-divider" />
            <div className="profile-section-heading">
              <Clock3 size={15} color="var(--gold)" /> Front Desk Shift & Operating Schedule
            </div>

            <label className="field-label">
              Assigned desk shift
              <select
                className="input"
                disabled={!editing}
                value={shiftSchedule}
                onChange={(e) => setShiftSchedule(e.target.value)}
              >
                {RECEPTION_SCHEDULES.map((sch) => (
                  <option key={sch} value={sch}>
                    {sch}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-label">
              Station status note
              <input
                className="input"
                disabled={!editing}
                value={deskNotes}
                onChange={(e) => setDeskNotes(e.target.value)}
                placeholder="e.g. Station 1 · Register Ready & Checked"
              />
            </label>

            <label className="field-label">
              Daily greeting & shift handover notice
              <textarea
                className="input textarea"
                disabled={!editing}
                value={dailyGreeting}
                onChange={(e) => setDailyGreeting(e.target.value)}
                placeholder="Greeting message or handover instructions for team members..."
                rows={3}
              />
            </label>
          </div>

          {editing && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                className="button button-dark"
                onClick={handleSaveProfile}
              >
                Save changes <Check size={15} />
              </button>
              <button
                type="button"
                className="button button-ghost"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="settings-card">
          <span className="eyebrow gold">Account & Security</span>

          <div className="setting-row">
            <div>
              <strong>Account Password</strong>
              <small>Manage and update your staff login password.</small>
            </div>
            <button
              type="button"
              className="button button-ghost button-small"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
            >
              <KeyRound size={13} /> {showPasswordSection ? 'Hide' : 'Change password'}
            </button>
          </div>

          {showPasswordSection && (
            <form onSubmit={handleUpdatePassword} style={{ background: 'var(--paper)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label className="field-label">
                  New Password
                  <div className="password-input">
                    <input
                      className="input"
                      type={showPwd ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 chars, 1 number, 1 special"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      tabIndex={-1}
                      title={showPwd ? 'Hide' : 'Show'}
                    >
                      {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </label>

                <label className="field-label">
                  Confirm New Password
                  <div className="password-input">
                    <input
                      className="input"
                      type={showPwd ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      tabIndex={-1}
                      title={showPwd ? 'Hide' : 'Show'}
                    >
                      {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </label>

                <div className="password-req-box">
                  <div className={`password-req-item ${hasEightChars ? 'met' : ''}`}>
                    {hasEightChars ? <Check size={12} /> : <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#999' }} />}
                    At least 8 characters
                  </div>
                  <div className={`password-req-item ${hasNumber ? 'met' : ''}`}>
                    {hasNumber ? <Check size={12} /> : <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#999' }} />}
                    At least one number (0–9)
                  </div>
                  <div className={`password-req-item ${hasSpecial ? 'met' : ''}`}>
                    {hasSpecial ? <Check size={12} /> : <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#999' }} />}
                    At least one special character (!@#$%^&*...)
                  </div>
                  {confirmPassword && (
                    <div className={`password-req-item ${passwordsMatch ? 'met' : ''}`}>
                      {passwordsMatch ? <Check size={12} /> : <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)' }} />}
                      {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="submit"
                    className="button button-dark button-small"
                    disabled={isUpdatingPwd || !hasEightChars || !hasNumber || !hasSpecial || !passwordsMatch}
                  >
                    Update Password <LockKeyhole size={13} />
                  </button>
                  <button
                    type="button"
                    className="button button-ghost button-small"
                    onClick={() => {
                      setShowPasswordSection(false);
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          <hr className="profile-section-divider" />
          <span className="eyebrow gold">Front Desk Preferences</span>

          <div className="setting-row">
            <div>
              <strong>Walk-in Arrival Alerts</strong>
              <small>Play alert chime when a new walk-in customer is added.</small>
            </div>
            <button
              type="button"
              className={`toggle ${prefs.walkInAlerts ? 'active' : ''}`}
              onClick={() => togglePref('walkInAlerts')}
              aria-label="Toggle walk-in alerts"
            >
              <span />
            </button>
          </div>

          <div className="setting-row">
            <div>
              <strong>Appointment Check-in Reminders</strong>
              <small>Notify front desk when scheduled booking window opens.</small>
            </div>
            <button
              type="button"
              className={`toggle ${prefs.appointmentAlerts ? 'active' : ''}`}
              onClick={() => togglePref('appointmentAlerts')}
              aria-label="Toggle appointment reminders"
            >
              <span />
            </button>
          </div>

          <div className="setting-row">
            <div>
              <strong>Cash Register Sound</strong>
              <small>Chime confirmation on successful checkout completion.</small>
            </div>
            <button
              type="button"
              className={`toggle ${prefs.checkoutSound ? 'active' : ''}`}
              onClick={() => togglePref('checkoutSound')}
              aria-label="Toggle checkout sound"
            >
              <span />
            </button>
          </div>

          <hr className="profile-section-divider" />
          <div style={{ background: '#fcfaf6', border: '1px solid #ebdcc5', borderRadius: '8px', padding: '14px', fontSize: '11px', color: '#684a1e' }}>
            <strong style={{ display: 'block', color: 'var(--ink)', marginBottom: '4px' }}>
              Biglang Gwapo Barber Shop · Front Counter
            </strong>
            Station: <strong>Front Desk 1</strong> · Reception & POS Register
            <p style={{ margin: '6px 0 0', fontSize: '10.5px', color: 'var(--muted)' }}>
              Authorized to register walk-ins, manage appointments, collect payments, and manage retail product stock.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

