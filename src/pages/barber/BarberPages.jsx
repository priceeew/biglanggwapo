import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, CalendarClock, CalendarDays, Check, CheckCircle2, Clock3,
  ListOrdered, Mail, Scissors, Star, TrendingUp, UserRound, Users, WalletCards,
  Eye, EyeOff, KeyRound, BadgeCheck, Camera, Upload, Trash2, Pencil, Plus, LockKeyhole
} from 'lucide-react';
import { useStore, currency, humanDate, today, stars } from '../../context/StoreContext';
import { demoApi } from '../../mockService';
import { saveAccount, getAccounts, validatePassword, validatePhone } from '../../data';
import { STANDARD_SCHEDULES } from '../../utils/scheduling';
import {
  saveAppointmentToAtlas, saveQueueItemToAtlas, notifyCustomerTurn,
  saveBarberToAtlas, uploadImageFile
} from '../../services/api';
import {
  BentoStats, SectionCard, Toolbar, DataTable, StatusBadge, EmptyState,
  getCustomerPhoto
} from '../../components/common/UIComponents';
import { ReviewsManagement } from '../../components/common/ReviewsManagement';

export function useCurrentBarber() {
  const { demo, session } = useStore();

  // Find barber record matching the logged-in session (by barberId, email, or name)
  const matched = (demo.barbers || []).find((b) =>
    (session?.barberId && b.id === session.barberId) ||
    (session?.email && b.email && b.email.toLowerCase() === session.email.toLowerCase()) ||
    (session?.name && b.name && b.name.toLowerCase() === session.name.toLowerCase())
  );

  // Fallback to session details or first barber in store
  const barberId = session?.barberId || matched?.id || demo.barbers?.[0]?.id || 'bar-marco';
  const barberName = session?.name || matched?.name || demo.barbers?.[0]?.name || 'Barber';
  const barber = matched || demo.barbers?.[0] || null;

  // Matcher for appointments or queue items assigned to this barber
  const matchesBarber = (item) => {
    if (!item) return false;
    if (barberId && item.barberId === barberId) return true;
    if (matched?.id && item.barberId === matched.id) return true;
    if (session?.barberId && item.barberId === session.barberId) return true;
    if (barberName && item.barberName && item.barberName.toLowerCase() === barberName.toLowerCase()) return true;
    if (session?.name && item.barberName && item.barberName.toLowerCase() === session.name.toLowerCase()) return true;
    if (matched?.name && item.barberName && item.barberName.toLowerCase() === matched.name.toLowerCase()) return true;
    return false;
  };

  return { barber, barberId, barberName, matchesBarber };
}

export function BarberPage({ path }) {
  if (path === '/barber') return <BarberDashboard />;
  if (path === '/barber/appointments') return <BarberAppointments />;
  if (path === '/barber/queue') return <BarberQueue />;
  if (path === '/barber/customer-details') return <BarberCustomerDetails />;
  if (path === '/barber/service-session') return <ServiceSession />;
  if (path === '/barber/schedule') return <BarberSchedule />;
  if (path === '/barber/reviews') return <BarberReviewsPage />;
  if (path === '/barber/profile') return <BarberProfile />;
  return <BarberPerformance />;
}

export function BarberDashboard() {
  const { demo, commit, notify } = useStore();
  const { barberName, matchesBarber, barber } = useCurrentBarber();

  const myQueue = (demo.queue || []).filter((item) => matchesBarber(item) && !['Completed', 'Removed', 'Skipped'].includes(item.status));
  const current = myQueue.find((item) => item.status === 'In Service');
  const next = myQueue.find((item) => item.status === 'Called') || myQueue.find((item) => item.status === 'Waiting');

  const callNextClient = (item) => {
    commit((state) => {
      const nextState = demoApi.callNext(state, item.id);
      const updatedQueue = nextState.queue.find((q) => q.id === item.id);
      if (updatedQueue) saveQueueItemToAtlas(updatedQueue);
      const apt = nextState.appointments.find((a) => a.id === item.appointmentId);
      if (apt) saveAppointmentToAtlas(apt);
      return nextState;
    });
    notify(`Called ${item.customerName} to the chair!`);
    notifyCustomerTurn(item, demo, notify);
  };

  const startClient = (item) => {
    commit((state) => {
      const nextState = demoApi.startService(state, item.id);
      const updatedQueue = nextState.queue.find((q) => q.id === item.id);
      if (updatedQueue) saveQueueItemToAtlas(updatedQueue);
      const apt = nextState.appointments.find((a) => a.id === item.appointmentId);
      if (apt) saveAppointmentToAtlas(apt);
      return nextState;
    });
    notify(`Service session started for ${item.customerName}!`);
    notifyCustomerTurn(item, demo, notify);
  };

  const myAppointments = (demo.appointments || []).filter(matchesBarber);
  const activeApts = myAppointments.filter((item) => !['Cancelled', 'No-show'].includes(item.status));
  const completed = myAppointments.filter((item) => item.status === 'Completed').length;

  const myReviews = (demo.reviews || []).filter(
    (r) => r.barber && barberName && r.barber.toLowerCase().includes(barberName.toLowerCase())
  );
  const avgRating = myReviews.length > 0
    ? (myReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / myReviews.length).toFixed(1)
    : '—';

  return (
    <>
      <BentoStats
        items={[
          ["Today's appointments", `${activeApts.length} booked`, CalendarDays, next ? `Next: ${next.customerName}` : 'Schedule is open'],
          ['Current customer', current?.customerName || 'No one yet', UserRound, current ? `In chair (${current.number})` : 'Chair is ready'],
          ['Next in line', next?.customerName || 'Queue is clear', ListOrdered, next ? `${next.serviceName} · ${next.number}` : 'Ready for next arrival'],
          ['Completed services', `${completed} finished`, CheckCircle2, 'Logged in system']
        ]}
      />
      <div className="dashboard-grid two-thirds">
        <SectionCard
          title="Chair focus"
          action={
            <Link to="/barber/service-session" className="button button-dark button-small">
              Open session <ArrowRight size={15} />
            </Link>
          }
        >
          <div className="chair-focus">
            {current ? (
              <>
                {((demo.customers || []).find((c) => (current.customerId && c.id === current.customerId) || (current.customerName && c.name && c.name.toLowerCase() === current.customerName.toLowerCase()))?.image) ? (
                  <img
                    src={(demo.customers || []).find((c) => (current.customerId && c.id === current.customerId) || (current.customerName && c.name && c.name.toLowerCase() === current.customerName.toLowerCase())).image}
                    alt={current.customerName}
                    style={{ width: 58, height: 58, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold)', flexShrink: 0 }}
                  />
                ) : (
                  <span className="avatar avatar-lg">
                    {(current.customerName || 'CU').split(' ').map((p) => p[0]).join('').slice(0, 2)}
                  </span>
                )}
                <div className="chair-focus-info">
                  <span className="eyebrow gold">In service · {current.number}</span>
                  <h2>{current.customerName}</h2>
                  <p>{current.serviceName} · {current.estimatedMinutes || 30} min</p>
                </div>
                <Link
                  to="/barber/service-session"
                  className="button button-dark button-small"
                  style={{ marginLeft: 'auto', alignSelf: 'center', whiteSpace: 'nowrap' }}
                >
                  In service
                </Link>
              </>
            ) : next ? (
              <>
                {((demo.customers || []).find((c) => (next.customerId && c.id === next.customerId) || (next.customerName && c.name && c.name.toLowerCase() === next.customerName.toLowerCase()))?.image) ? (
                  <img
                    src={(demo.customers || []).find((c) => (next.customerId && c.id === next.customerId) || (next.customerName && c.name && c.name.toLowerCase() === next.customerName.toLowerCase())).image}
                    alt={next.customerName}
                    style={{ width: 58, height: 58, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold)', flexShrink: 0 }}
                  />
                ) : (
                  <span className="avatar avatar-lg" style={{ background: 'var(--paper)', border: '1px solid var(--line)' }}>
                    {(next.customerName || 'CU').split(' ').map((p) => p[0]).join('').slice(0, 2)}
                  </span>
                )}
                <div className="chair-focus-info">
                  <span className="eyebrow gold">{next.status === 'Called' ? `Called to chair · ${next.number}` : `Next in line · ${next.number}`}</span>
                  <h2>{next.customerName} {next.status === 'Called' ? 'called' : 'is waiting'}</h2>
                  <p>{next.serviceName} · {next.status === 'Called' ? 'Ready to begin service' : 'Ready to call to chair'}</p>
                </div>
                <button
                  className="button button-dark button-small"
                  style={{ marginLeft: 'auto', alignSelf: 'center', whiteSpace: 'nowrap' }}
                  onClick={() => (next.status === 'Called' ? startClient(next) : callNextClient(next))}
                >
                  {next.status === 'Called' ? 'Start service' : 'Call to chair'}
                </button>
              </>
            ) : (
              <>
                <span className="avatar avatar-lg chair-focus-avatar" style={{ background: 'var(--paper)', border: '1.5px solid var(--gold)', color: 'var(--gold)' }}>
                  <Scissors size={26} />
                </span>
                <div className="chair-focus-info">
                  <span className="eyebrow gold">Chair is ready</span>
                  <h2>Chair is open for {barberName}</h2>
                  <p>When reception marks an appointment as arrived or adds a walk-in, they appear here live.</p>
                </div>
              </>
            )}
          </div>
        </SectionCard>
        <SectionCard title="Today at a glance">
          <div className="mini-metrics">
            <span><strong>{activeApts.length > 0 ? (activeApts[0].time || '—') : '—'}</strong><small>First chair</small></span>
            <span><strong>{activeApts.length}</strong><small>Booked today</small></span>
            <span><strong>{avgRating}</strong><small>Rating</small></span>
          </div>
          <div className="progress-line">
            <span style={{ width: activeApts.length > 0 ? `${Math.min(100, Math.round((completed / activeApts.length) * 100))}%` : '0%' }} />
          </div>
          <small className="muted-copy">
            {activeApts.length > 0
              ? `${Math.round((completed / activeApts.length) * 100)}% of today’s scheduled appointments completed.`
              : 'No appointments on the board yet.'}
          </small>
        </SectionCard>
      </div>
      <SectionCard title="Upcoming chair list">
        <DataTable columns={['Time', 'Customer', 'Service', 'Status', '']}>
          <tbody>
            {activeApts.map((item) => (
              <tr key={item.id}>
                <td><strong>{item.time}</strong><small className="table-sub">{humanDate(item.date)}</small></td>
                <td>{item.customerName}</td>
                <td>{item.serviceName}</td>
                <td><StatusBadge status={item.status} /></td>
                <td>
                  <Link className="text-link" to={item.status === 'Arrived' ? '/barber/queue' : '/barber/appointments'}>
                    {item.status === 'Arrived' ? 'In queue →' : 'Details →'}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        {!activeApts.length && (
          <EmptyState title="No bookings yet" copy="Appointments booked with your chair will appear here." />
        )}
      </SectionCard>
    </>
  );
}

export function BarberAppointments() {
  const { demo, commit, notify } = useStore();
  const { barberName, matchesBarber, barber } = useCurrentBarber();
  const list = (demo.appointments || []).filter(matchesBarber);
  const isUnavail = Boolean(barber && (barber.isUnavailable || barber.status === 'Unavailable'));



  return (
    <>
      {isUnavail && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#991b1b',
            fontSize: '13px'
          }}
        >
          <span style={{ fontSize: '16px' }}>⚠️</span>
          <span>
            <strong>Your chair is currently marked as Unavailable.</strong> Customers cannot select your chair for new online bookings. An administrator can toggle your status back to available from Admin → Barbers.
          </span>
        </div>
      )}
      <Toolbar
        title={`${barberName}’s Bookings`}
        count={list.length}
        action={<Link className="button button-ghost button-small" to="/barber/schedule"><CalendarClock size={15} /> View schedule</Link>}
      />
      <SectionCard>
        <DataTable columns={['Time', 'Customer', 'Service', 'Status', 'Action']}>
          <tbody>
            {list.map((item) => (
              <tr key={item.id}>
                <td><strong>{item.time}</strong><small className="table-sub">{humanDate(item.date)}</small></td>
                <td>
                  <div className="table-person">
                    <span className="avatar avatar-xs">{(item.customerName || 'CU').split(' ').map((p) => p[0]).join('').slice(0, 2)}</span>
                    <strong>{item.customerName}</strong>
                  </div>
                </td>
                <td>{item.serviceName}</td>
                <td><StatusBadge status={item.status} /></td>
                <td>
                  {item.status === 'Arrived' ? (
                    <Link className="button button-dark button-small" to="/barber/queue">Call chair</Link>
                  ) : item.status === 'In Service' ? (
                    <Link className="button button-dark button-small" to="/barber/service-session">In service</Link>
                  ) : (
                    <Link className="button button-soft button-small" to="/barber/customer-details">Details</Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        {!list.length && <EmptyState title="No appointments found" copy="Online bookings for your chair will appear here." />}
      </SectionCard>
    </>
  );
}

export function BarberQueue() {
  const { demo, commit, notify } = useStore();
  const { barberName, matchesBarber } = useCurrentBarber();
  const list = (demo.queue || []).filter((item) => matchesBarber(item) && !['Completed', 'Removed', 'Skipped'].includes(item.status));

  const callNextClient = (item) => {
    commit((state) => {
      const next = demoApi.callNext(state, item.id);
      const updatedQueue = next.queue.find((q) => q.id === item.id);
      if (updatedQueue) saveQueueItemToAtlas(updatedQueue);
      const apt = next.appointments.find((a) => a.id === item.appointmentId);
      if (apt) saveAppointmentToAtlas(apt);
      return next;
    });
    notify(`Called ${item.customerName} to the chair!`);
    notifyCustomerTurn(item, demo, notify);
  };

  const start = (item) => {
    commit((state) => {
      const next = demoApi.startService(state, item.id);
      const updatedQueue = next.queue.find((q) => q.id === item.id);
      if (updatedQueue) saveQueueItemToAtlas(updatedQueue);
      const apt = next.appointments.find((a) => a.id === item.appointmentId);
      if (apt) saveAppointmentToAtlas(apt);
      return next;
    });
    notify(`Service started for ${item.customerName}!`);
    notifyCustomerTurn(item, demo, notify);
  };

  return (
    <>
      <div className="queue-callout">
        <div>
          <span className="eyebrow gold">{barberName}’s Queue</span>
          <h2>{list.length ? `${list.length} customer${list.length > 1 ? 's' : ''} in line.` : 'No one is waiting.'}</h2>
          <p>Real-time queue synchronized directly with reception check-in.</p>
        </div>
        <Link to="/barber/service-session" className="button button-dark">Open service session <ArrowRight size={16} /></Link>
      </div>
      <div className="barber-queue-list">
        {list.map((item, index) => (
          <div className={`barber-queue-card ${item.status === 'In Service' ? 'current' : ''}`} key={item.id}>
            <span className="queue-number-small">{item.number}</span>
            <span className="avatar avatar-md">{(item.customerName || 'CU').split(' ').map((p) => p[0]).join('').slice(0, 2)}</span>
            <div>
              <span className="eyebrow">{item.status === 'In Service' ? 'Current in chair' : item.status === 'Called' ? 'Called to chair' : index === 0 ? 'Now / next' : `In line · position ${index + 1}`}</span>
              <h3>{item.customerName}</h3>
              <p>{item.serviceName} · Joined {item.joinedAt || 'recently'}</p>
            </div>
            <StatusBadge status={item.status} />
            {item.status === 'Waiting' && (
              <button className="button button-soft button-small" onClick={() => callNextClient(item)}>Call next</button>
            )}
            {item.status === 'Called' && (
              <button className="button button-dark button-small" onClick={() => start(item)}>Start service</button>
            )}
            {item.status === 'In Service' && (
              <Link to="/barber/service-session" className="button button-dark button-small">In service</Link>
            )}
            <button
              className="icon-button"
              title="Send email alert: Kayo na po ang gugupitan!"
              onClick={() => notifyCustomerTurn(item, demo, notify)}
            >
              <Mail size={16} />
            </button>
          </div>
        ))}
        {!list.length && <EmptyState title="The queue is clear" copy="When reception marks a customer as arrived or registers a walk-in, they appear here live." />}
      </div>
    </>
  );
}

export function BarberCustomerDetails() {
  const { demo } = useStore();
  const { matchesBarber } = useCurrentBarber();
  const current = (demo.queue || []).find((item) => matchesBarber(item) && !['Completed', 'Removed', 'Skipped'].includes(item.status));
  const activeApt = (demo.appointments || []).find((item) => matchesBarber(item) && ['Arrived', 'In Service', 'Pending', 'Confirmed'].includes(item.status));

  const targetCustomerId = current?.customerId || activeApt?.customerId;
  const targetCustomerName = current?.customerName || activeApt?.customerName;
  const customer = (demo.customers || []).find((item) => (targetCustomerId && item.id === targetCustomerId) || (targetCustomerName && item.name === targetCustomerName)) || demo.customers?.[0];

  const customerHistory = (demo.appointments || []).filter((item) =>
    (customer && item.customerId === customer.id) || (targetCustomerName && item.customerName === targetCustomerName)
  );

  return (
    <div className="detail-page">
      <div className="detail-hero">
        {customer?.image ? (
          <img
            src={customer.image}
            alt={customer?.name || 'Customer'}
            style={{ width: 78, height: 78, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold)', flexShrink: 0 }}
          />
        ) : (
          <span className="avatar avatar-xl">{customer?.initials || (customer?.name || 'CU').slice(0, 2).toUpperCase()}</span>
        )}
        <div>
          <span className="eyebrow gold">Customer profile</span>
          <h2>{customer?.name || targetCustomerName || 'Guest Customer'}</h2>
          <p>{customer?.phone || 'No phone'} · {customer?.email || 'No email'}</p>
        </div>
        <Link to="/barber/service-session" className="button button-dark">Service session <ArrowRight size={16} /></Link>
      </div>
      <div className="detail-columns">
        <SectionCard title="Current requested service">
          <div className="requested-service">
            <span className="service-icon"><Scissors size={19} /></span>
            <div>
              <strong>{current?.serviceName || activeApt?.serviceName || 'No active service'}</strong>
              <small>{current ? `${current.number} · In your queue (${current.status})` : activeApt ? `Scheduled for ${humanDate(activeApt.date)} at ${activeApt.time}` : 'No active queue item'}</small>
            </div>
          </div>
        </SectionCard>
        <SectionCard title="Preferences & notes">
          <p className="detail-quote">“{customer?.preferences || 'No styling preferences specified.'}”</p>
          <p className="muted-copy">{customer?.notes || 'No internal notes on file for this client.'}</p>
        </SectionCard>
      </div>
      <SectionCard title="Customer service history">
        <DataTable columns={['Date', 'Service', 'Barber', 'Amount', 'Status']}>
          <tbody>
            {customerHistory.map((item) => (
              <tr key={item.id}>
                <td>{humanDate(item.date)}</td>
                <td>{item.serviceName}</td>
                <td>{item.barberName}</td>
                <td>{currency(item.price)}</td>
                <td><StatusBadge status={item.status} /></td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        {!customerHistory.length && (
          <EmptyState title="No prior history" copy="Past completed services for this client will appear here." />
        )}
      </SectionCard>
    </div>
  );
}

export function ServiceSession() {
  const { demo, commit, notify } = useStore();
  const { matchesBarber, barberName } = useCurrentBarber();

  const myQueue = (demo.queue || []).filter((item) => matchesBarber(item) && !['Completed', 'Removed', 'Skipped'].includes(item.status));
  const current = myQueue.find((item) => item.status === 'In Service') || myQueue[0];
  const [notes, setNotes] = useState(current?.notes || '');

  const act = () => {
    if (!current) return notify('No active customer in your queue.', 'error');
    if (current.status === 'Waiting') {
      commit((state) => {
        const next = demoApi.callNext(state, current.id);
        const updatedQueue = next.queue.find((q) => q.id === current.id);
        if (updatedQueue) saveQueueItemToAtlas(updatedQueue);
        const apt = next.appointments.find((a) => a.id === current.appointmentId);
        if (apt) saveAppointmentToAtlas(apt);
        return next;
      });
      notify(`Called ${current.customerName} to the chair!`);
      notifyCustomerTurn(current, demo, notify);
    } else if (current.status === 'Called') {
      commit((state) => {
        const next = demoApi.startService(state, current.id);
        const updatedQueue = next.queue.find((q) => q.id === current.id);
        if (updatedQueue) saveQueueItemToAtlas(updatedQueue);
        const apt = next.appointments.find((a) => a.id === current.appointmentId);
        if (apt) saveAppointmentToAtlas(apt);
        return next;
      });
      notify(`Service session started for ${current.customerName}!`);
      notifyCustomerTurn(current, demo, notify);
    } else if (current.status === 'In Service') {
      commit((state) => {
        const next = demoApi.completeService(state, current.id, notes);
        const updatedQueue = next.queue.find((q) => q.id === current.id);
        if (updatedQueue) saveQueueItemToAtlas(updatedQueue);
        const apt = next.appointments.find((a) => a.id === current.appointmentId);
        if (apt) saveAppointmentToAtlas(apt);
        return next;
      });
      notify(`Service completed for ${current.customerName}! Sent to front desk for checkout.`);
    }
  };

  return (
    <div className="session-layout">
      <div className="session-stage">
        <div className="session-top">
          <span className="eyebrow gold">Live service session · {barberName}</span>
          <StatusBadge status={current?.status || 'Waiting'} />
        </div>
        {current ? (
          <>
            <div className="session-client">
              <span className="avatar avatar-xl">{(current.customerName || 'CU').split(' ').map((p) => p[0]).join('').slice(0, 2)}</span>
              <span>
                <small>{current.number} · {current.barberName}</small>
                <h2>{current.customerName}</h2>
                <p>{current.serviceName}</p>
              </span>
            </div>
            <div className="session-timer">
              <Clock3 size={20} />
              <span>
                {current.status === 'In Service'
                  ? 'Service is in progress'
                  : current.status === 'Called'
                  ? 'Customer called to chair — ready to begin haircut'
                  : 'Customer arrived — please call next before starting service'}
              </span>
            </div>
            <label className="field-label">Service notes & finish
              <textarea
                className="input textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add finish details, cut notes, or checkout instructions..."
              />
            </label>
            <button className="button button-dark button-large button-full" onClick={act}>
              {current.status === 'Waiting' ? 'Call next' : current.status === 'Called' ? 'Start service' : 'Complete service'} <CheckCircle2 size={18} />
            </button>
          </>
        ) : (
          <EmptyState
            title="Chair is ready"
            copy="No customer is currently waiting in your queue. When reception marks an appointment as arrived, they will appear here."
            action={<Link className="button button-dark" to="/barber/queue">Open queue</Link>}
          />
        )}
      </div>
      <aside className="session-aside">
        <span className="eyebrow">Session checklist</span>
        <div className={`checklist-row ${current?.status ? 'done' : ''}`}>
          <span><Check size={14} /></span>
          <div>
            <strong>Customer arrived</strong>
            <small>Checked in at front desk.</small>
          </div>
        </div>
        <div className={`checklist-row ${current?.status === 'Called' || current?.status === 'In Service' || current?.status === 'Completed' ? 'done' : ''}`}>
          <span><Clock3 size={14} /></span>
          <div>
            <strong>Customer called</strong>
            <small>Called to your barber station.</small>
          </div>
        </div>
        <div className={`checklist-row ${current?.status === 'In Service' || current?.status === 'Completed' ? 'done' : ''}`}>
          <span><Scissors size={14} /></span>
          <div>
            <strong>Service in progress</strong>
            <small>Customer in chair at your station.</small>
          </div>
        </div>
        <div className={`checklist-row ${current?.status === 'Completed' ? 'done' : ''}`}>
          <span><WalletCards size={14} /></span>
          <div>
            <strong>Reception checkout</strong>
            <small>Front desk collects payment & generates receipt.</small>
          </div>
        </div>
      </aside>
    </div>
  );
}

export function BarberSchedule() {
  const { demo } = useStore();
  const { barber, barberName, matchesBarber } = useCurrentBarber();
  const myAppointments = (demo.appointments || []).filter(matchesBarber);

  return (
    <>
      <div className="schedule-header">
        <div>
          <span className="eyebrow gold">{barberName}’s Schedule</span>
          <h2>Work shift & booked chairs</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '12px' }}>
            Permanent Schedule: <strong>{barber?.schedule || 'Mon–Sun · 9:00 AM–8:00 PM'}</strong> · Status: <strong>{barber?.leaveStatus || barber?.status || 'Active / On Duty'}</strong>
          </p>
        </div>
      </div>

      <SectionCard title="Booked appointments on your schedule">
        <DataTable columns={['Date', 'Time', 'Customer', 'Service', 'Duration', 'Status']}>
          <tbody>
            {myAppointments.map((apt) => (
              <tr key={apt.id}>
                <td><strong>{humanDate(apt.date)}</strong></td>
                <td>{apt.time}</td>
                <td>{apt.customerName}</td>
                <td>{apt.serviceName}</td>
                <td>{apt.duration || 30} mins</td>
                <td><StatusBadge status={apt.status} /></td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        {!myAppointments.length && (
          <EmptyState title="No bookings scheduled" copy="Appointments booked with your chair will appear here." />
        )}
      </SectionCard>
    </>
  );
}

export function BarberPerformance() {
  const { demo } = useStore();
  const { barber, barberName, matchesBarber } = useCurrentBarber();

  const myAppointments = (demo.appointments || []).filter(matchesBarber);
  const completed = myAppointments.filter((a) => a.status === 'Completed');
  const uniqueClients = new Set(myAppointments.map((a) => a.customerName || a.customerId)).size;
  const totalRevenue = completed.reduce((sum, a) => sum + (Number(a.price) || 0), 0);

  const myReviews = (demo.reviews || []).filter(
    (r) => r.barber && barberName && r.barber.toLowerCase().includes(barberName.toLowerCase())
  );
  const avgRating = myReviews.length > 0
    ? (myReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / myReviews.length).toFixed(1)
    : '0.0';

  return (
    <>
      <BentoStats
        items={[
          ['Completed services', `${completed.length} finished`, CheckCircle2, completed.length > 0 ? 'All-time verified' : 'No cuts finished yet'],
          ['Customers served', `${uniqueClients} clients`, Users, `${myAppointments.length} total visits`],
          ['Average rating', myReviews.length > 0 ? avgRating : 'No reviews', Star, myReviews.length > 0 ? `From ${myReviews.length} client review${myReviews.length > 1 ? 's' : ''}` : 'No reviews received yet'],
          ['Revenue generated', currency(totalRevenue), TrendingUp, 'Paid services']
        ]}
      />
      <div className="dashboard-grid two-thirds">
        <SectionCard title="Service breakdown">
          <div className="compact-list" style={{ padding: '16px 22px' }}>
            {completed.slice(0, 5).map((item) => (
              <div className="compact-row" key={item.id}>
                <span className="time-label">{humanDate(item.date)}</span>
                <div className="compact-row-main">
                  <strong>{item.serviceName}</strong>
                  <small>{item.customerName} · {currency(item.price)}</small>
                </div>
                <StatusBadge status={item.paymentStatus || 'Paid'} />
              </div>
            ))}
            {!completed.length && (
              <EmptyState title="No completed cuts yet" copy="Services you complete in your chair will be tracked here." />
            )}
          </div>
        </SectionCard>
        <SectionCard title="Client feedback">
          <div className="rating-summary">
            <strong>{myReviews.length > 0 ? avgRating : '—'}</strong>
            <div>
              <span className="stars">{myReviews.length > 0 ? stars(Number(avgRating)) : '☆☆☆☆☆'}</span>
              <small>{myReviews.length ? `${myReviews.length} client review${myReviews.length > 1 ? 's' : ''}` : 'No client reviews yet'}</small>
            </div>
          </div>
          <div style={{ padding: '0 22px 18px' }}>
            <p className="muted-copy" style={{ margin: 0 }}>
              {myReviews[0]?.comment ? `“${myReviews[0].comment}” — ${myReviews[0].customer}` : 'Client reviews submitted after completed appointments will display here.'}
            </p>
          </div>
        </SectionCard>
      </div>

      <SectionCard title={`All Client Reviews & Ratings (${myReviews.length})`} description="Feedback and ratings left by clients who sat in your chair.">
        <DataTable columns={['Client & Date', 'Service', 'Rating', 'Feedback']}>
          <tbody>
            {myReviews.map((r) => {
              const custPhoto = getCustomerPhoto(r, demo);
              return (
                <tr key={r.id}>
                  <td>
                    <div className="table-person">
                      {custPhoto ? (
                        <>
                          <img
                            key={custPhoto}
                            src={custPhoto}
                            alt={r.customer || 'Customer'}
                            className="avatar avatar-xs"
                            style={{
                              width: 26,
                              height: 26,
                              objectFit: 'cover',
                              borderRadius: '50%',
                              border: '1px solid var(--gold)',
                              flexShrink: 0,
                              display: 'block'
                            }}
                            onLoad={(e) => {
                              e.currentTarget.style.display = 'block';
                              if (e.currentTarget.nextElementSibling) e.currentTarget.nextElementSibling.style.display = 'none';
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextElementSibling) e.currentTarget.nextElementSibling.style.display = 'inline-grid';
                            }}
                          />
                          <span className="avatar avatar-xs" style={{ display: 'none' }}>
                            {(r.customer || 'CU').slice(0, 2).toUpperCase()}
                          </span>
                        </>
                      ) : (
                        <span className="avatar avatar-xs">{(r.customer || 'CU').slice(0, 2).toUpperCase()}</span>
                      )}
                      <div>
                        <strong>{r.customer || 'Anonymous'}</strong>
                        <small className="table-sub">{humanDate(r.date)}</small>
                      </div>
                    </div>
                  </td>
                <td>{r.service || 'Haircut'}</td>
                <td>
                  <span style={{ color: 'var(--gold)', letterSpacing: '1px' }}>{stars(r.rating || 5)}</span>
                  <small className="table-sub">{Number(r.rating || 5).toFixed(1)} / 5.0</small>
                </td>
                <td style={{ maxWidth: '320px' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--charcoal)', lineHeight: '1.4' }}>
                    {r.comment ? `“${r.comment}”` : 'No written feedback.'}
                  </p>
                  {r.image && (
                    <img
                      src={r.image}
                      alt="Customer review photo"
                      style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', marginTop: '6px', border: '1px solid var(--line)' }}
                    />
                  )}
                </td>
              </tr>
            );
          })}
          </tbody>
        </DataTable>
        {!myReviews.length && (
          <EmptyState
            icon={Star}
            title="No client reviews yet"
            copy="When clients leave reviews and ratings for your haircuts, they will appear here in real time."
          />
        )}
      </SectionCard>
    </>
  );
}

export function BarberReviewsPage() {
  const { barber, barberName } = useCurrentBarber();
  return <ReviewsManagement role="barber" barberFilter={barber || { name: barberName }} />;
}

const POPULAR_SPECIALTIES = [
  'Fade Specialist',
  'Beard Sculpting',
  'Taper & Edge Up',
  'Classic Pompadour',
  'Razor Shave',
  'Scissor Mastery',
  'Hair Art & Designs',
  'Hot Towel Treatment',
  'Kids Haircut'
];

export function BarberProfile() {
  const { session, updateSession, notify, commit, demo } = useStore();
  const { barber, barberId, barberName, matchesBarber } = useCurrentBarber();

  const getInitialPhoto = () => {
    const acc = session?.email ? getAccounts()[session.email.toLowerCase()] : null;
    return barber?.image || barber?.photoUrl || acc?.image || acc?.photoUrl || session?.photoUrl || session?.image || '';
  };

  const [editing, setEditing] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(getInitialPhoto);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [name, setName] = useState(barber?.name || session?.name || 'Barber');
  const [phone, setPhone] = useState(barber?.phone || session?.phone || '');
  const [specialty, setSpecialty] = useState(barber?.specialty || session?.specialty || 'Classic Fades, Beard Grooming');
  const [bio, setBio] = useState(barber?.bio || session?.bio || 'Skilled professional barber at Biglang Gwapo.');
  const [schedule, setSchedule] = useState(barber?.schedule || session?.schedule || STANDARD_SCHEDULES[0]);
  const [leaveStatus, setLeaveStatus] = useState(barber?.leaveStatus || 'Active / On Duty');
  const [leaveNotes, setLeaveNotes] = useState(barber?.leaveNotes || '');

  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);

  // Preference alerts state
  const prefKey = `biglanggwapo-barber-prefs-${session?.email || 'default'}`;
  const loadPrefs = () => {
    try {
      const saved = window.localStorage.getItem(prefKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { appointmentAlerts: true, queueChimes: true, breakReminders: false };
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
    if (barber || session) {
      if (barber?.name || session?.name) setName(barber?.name || session?.name || '');
      if (barber?.phone || session?.phone) setPhone(barber?.phone || session?.phone || '');
      if (barber?.specialty || session?.specialty) setSpecialty(barber?.specialty || session?.specialty || '');
      if (barber?.bio || session?.bio) setBio(barber?.bio || session?.bio || '');
      if (barber?.schedule || session?.schedule) setSchedule(barber?.schedule || session?.schedule || STANDARD_SCHEDULES[0]);
      if (barber?.leaveStatus) setLeaveStatus(barber.leaveStatus);
      if (barber?.leaveNotes) setLeaveNotes(barber.leaveNotes);
      const latestPhoto = barber?.image || barber?.photoUrl || getInitialPhoto();
      setPhotoUrl(latestPhoto);
    }
  }, [barber, session]);

  const initials = barber?.initials || (name ? name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() : 'BR');

  const toggleSpecialtyChip = (chip) => {
    if (!editing) return;
    const currentList = specialty ? specialty.split(',').map((s) => s.trim()).filter(Boolean) : [];
    if (currentList.some((s) => s.toLowerCase() === chip.toLowerCase())) {
      const next = currentList.filter((s) => s.toLowerCase() !== chip.toLowerCase());
      setSpecialty(next.join(', '));
    } else {
      const next = [...currentList, chip];
      setSpecialty(next.join(', '));
    }
  };

  const isSpecialtySelected = (chip) => {
    if (!specialty) return false;
    const currentList = specialty.split(',').map((s) => s.trim().toLowerCase());
    return currentList.includes(chip.toLowerCase());
  };

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

        const bId = barber?.id || session?.barberId || barberId;
        commit((state) => {
          const updatedBarbers = (state.barbers || []).map((b) => {
            if (b.id === bId || (b.email && b.email.toLowerCase() === (session?.email || '').toLowerCase())) {
              return { ...b, image: newPhoto, photoUrl: newPhoto };
            }
            return b;
          });
          return { ...state, barbers: updatedBarbers };
        });

        if (barber) {
          saveBarberToAtlas({ ...barber, image: newPhoto, photoUrl: newPhoto }).catch(() => {});
        }

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
    const bId = barber?.id || session?.barberId || barberId;
    commit((state) => {
      const updatedBarbers = (state.barbers || []).map((b) => {
        if (b.id === bId || (b.email && b.email.toLowerCase() === (session?.email || '').toLowerCase())) {
          return { ...b, image: '', photoUrl: '' };
        }
        return b;
      });
      return { ...state, barbers: updatedBarbers };
    });
    if (barber) {
      saveBarberToAtlas({ ...barber, image: '', photoUrl: '' }).catch(() => {});
    }
    notify('Profile picture removed.', 'success');
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      return notify('Barber name cannot be empty.', 'error');
    }
    if (phone.trim()) {
      const phoneError = validatePhone(phone);
      if (phoneError) return notify(phoneError, 'error');
    }

    setEditing(false);
    const bId = barber?.id || session?.barberId || barberId;
    const computedStatus = leaveStatus === 'On Leave' ? 'On Leave' : leaveStatus === 'On Break' ? 'On Break' : 'On shift';
    const updatedBarberData = {
      name: name.trim(),
      phone: phone.trim(),
      specialty: specialty.trim() || 'All-around cuts',
      bio: bio.trim(),
      schedule,
      leaveStatus,
      leaveNotes: leaveNotes.trim(),
      status: computedStatus,
      photoUrl,
      image: photoUrl
    };

    if (updateSession) {
      updateSession({
        ...updatedBarberData,
        barberId: bId
      });
    }

    if (session?.email) {
      saveAccount({
        email: session.email,
        name: updatedBarberData.name,
        phone: updatedBarberData.phone,
        specialty: updatedBarberData.specialty,
        bio: updatedBarberData.bio,
        schedule: updatedBarberData.schedule,
        image: photoUrl,
        photoUrl,
        role: 'barber',
        barberId: bId
      });
    }

    commit((state) => {
      const cleanEmail = (session?.email || '').toLowerCase().trim();
      const updatedBarbers = (state.barbers || []).map((b) => {
        if (b.id === bId || (cleanEmail && b.email && b.email.toLowerCase() === cleanEmail)) {
          return { ...b, ...updatedBarberData };
        }
        return b;
      });

      const updatedApts = (state.appointments || []).map((a) => {
        if (a.barberId === bId || (a.barberName && a.barberName.toLowerCase() === (barber?.name || '').toLowerCase())) {
          return { ...a, barberName: updatedBarberData.name };
        }
        return a;
      });

      const updatedQueue = (state.queue || []).map((q) => {
        if (q.barberId === bId || (q.barberName && q.barberName.toLowerCase() === (barber?.name || '').toLowerCase())) {
          return { ...q, barberName: updatedBarberData.name };
        }
        return q;
      });

      return {
        ...state,
        barbers: updatedBarbers,
        appointments: updatedApts,
        queue: updatedQueue
      };
    });

    try {
      const fullBarberPayload = {
        ...(barber || {}),
        id: bId,
        ...updatedBarberData
      };
      await saveBarberToAtlas(fullBarberPayload);
    } catch (err) {
      console.warn('Failed to sync barber to Atlas:', err);
    }

    notify('Barber profile & shift customization saved successfully!', 'success');
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

  const myAppointments = (demo.appointments || []).filter(matchesBarber);
  const completedCount = myAppointments.filter((a) => a.status === 'Completed').length;
  const myReviews = (demo.reviews || []).filter(
    (r) => r.barber && barberName && r.barber.toLowerCase().includes(barberName.toLowerCase())
  );
  const avgRating = myReviews.length > 0
    ? (myReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / myReviews.length).toFixed(1)
    : (barber?.rating ? Number(barber.rating).toFixed(1) : '5.0');

  // Password requirements real-time check
  const hasEightChars = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=\\/\[\]~`]/.test(newPassword);
  const passwordsMatch = newPassword && newPassword === confirmPassword;

  return (
    <>
      <BentoStats
        items={[
          ['Barber chair', name, Scissors, specialty || 'All-around cuts'],
          ['Phone number', phone || 'Not registered', BadgeCheck, 'SMS booking updates'],
          ['Duty status', leaveStatus, Clock3, schedule.split('·')[0].trim() || 'Working shift'],
          ['Client rating', `${avgRating} ★`, Star, `${myReviews.length} client review${myReviews.length === 1 ? '' : 's'}`]
        ]}
      />

      <Toolbar
        title="Barber Profile & Settings"
        description="Customize your professional barber profile, specialization, working hours, and security settings."
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
                  <i /> {leaveStatus}
                </span>
              </div>
              <p style={{ marginTop: '4px' }}>
                {session?.email || barber?.email || 'barber@biglanggwapo.com'} · {completedCount} haircuts completed
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
                placeholder="e.g. Marco Reyes"
              />
            </label>

            <label className="field-label">
              Email address
              <input
                className="input"
                disabled
                value={session?.email || barber?.email || 'barber@biglanggwapo.com'}
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
              Specialties & cuts
              <input
                className="input"
                disabled={!editing}
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="e.g. Fade Specialist, Beard Sculpting, Classic Pompadour"
              />
              <span style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>
                {editing ? 'Click chips below to toggle popular haircut specialties:' : 'Popular specialties offered:'}
              </span>
              <div className="profile-tag-group">
                {POPULAR_SPECIALTIES.map((spec) => {
                  const active = isSpecialtySelected(spec);
                  return (
                    <button
                      key={spec}
                      type="button"
                      className={`profile-tag-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleSpecialtyChip(spec)}
                      disabled={!editing}
                    >
                      {active ? <Check size={11} /> : <Plus size={11} />}
                      {spec}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="field-label">
              Barber public bio & greeting
              <textarea
                className="input textarea"
                disabled={!editing}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your grooming philosophy and experience..."
                rows={3}
              />
            </label>

            <hr className="profile-section-divider" />
            <div className="profile-section-heading">
              <Clock3 size={15} color="var(--gold)" /> Shift Schedule & Duty Availability
            </div>

            <label className="field-label">
              Permanent working shift
              <select
                className="input"
                disabled={!editing}
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
              >
                {STANDARD_SCHEDULES.map((sch) => (
                  <option key={sch} value={sch}>
                    {sch}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <label className="field-label">
                Duty availability status
                <select
                  className="input"
                  disabled={!editing}
                  value={leaveStatus}
                  onChange={(e) => setLeaveStatus(e.target.value)}
                >
                  <option value="Active / On Duty">Active / On Duty</option>
                  <option value="On Break">On Break</option>
                  <option value="On Leave">On Leave / Unavailable</option>
                </select>
              </label>

              <label className="field-label">
                Duty / Break note
                <input
                  className="input"
                  disabled={!editing}
                  value={leaveNotes}
                  onChange={(e) => setLeaveNotes(e.target.value)}
                  placeholder="e.g. Lunch break until 2:00 PM"
                />
              </label>
            </div>
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
          <span className="eyebrow gold">Notification Preferences</span>

          <div className="setting-row">
            <div>
              <strong>Queue Chair Alerts</strong>
              <small>Audio chime and visual prompt when client is assigned.</small>
            </div>
            <button
              type="button"
              className={`toggle ${prefs.queueChimes ? 'active' : ''}`}
              onClick={() => togglePref('queueChimes')}
              aria-label="Toggle queue alerts"
            >
              <span />
            </button>
          </div>

          <div className="setting-row">
            <div>
              <strong>Appointment Reminders</strong>
              <small>15-minute advance notification for upcoming bookings.</small>
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
              <strong>Break Time Alerts</strong>
              <small>Reminder prompts when break period begins and ends.</small>
            </div>
            <button
              type="button"
              className={`toggle ${prefs.breakReminders ? 'active' : ''}`}
              onClick={() => togglePref('breakReminders')}
              aria-label="Toggle break alerts"
            >
              <span />
            </button>
          </div>

          <hr className="profile-section-divider" />
          <div style={{ background: '#fcfaf6', border: '1px solid #ebdcc5', borderRadius: '8px', padding: '14px', fontSize: '11px', color: '#684a1e' }}>
            <strong style={{ display: 'block', color: 'var(--ink)', marginBottom: '4px' }}>
              Biglang Gwapo Barber Shop · Pulilan Branch
            </strong>
            Station: <strong>Chair #{barber?.id ? barber.id.replace('bar-', '').toUpperCase() : '1'}</strong> · Assigned Desk
            <p style={{ margin: '6px 0 0', fontSize: '10.5px', color: 'var(--muted)' }}>
              Profile changes synchronize in real-time across the booking calendar, walk-in register, and customer search.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

