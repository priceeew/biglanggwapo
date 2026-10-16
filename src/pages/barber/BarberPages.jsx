import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, CalendarClock, CalendarDays, Check, CheckCircle2, Clock3,
  ListOrdered, Mail, Scissors, Star, TrendingUp, UserRound, Users, WalletCards
} from 'lucide-react';
import { useStore, currency, humanDate, today, stars } from '../../context/StoreContext';
import { demoApi } from '../../mockService';
import { saveAppointmentToAtlas, saveQueueItemToAtlas, notifyCustomerTurn } from '../../services/api';
import {
  BentoStats, SectionCard, Toolbar, DataTable, StatusBadge, EmptyState
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
  return <BarberPerformance />;
}

export function BarberDashboard() {
  const { demo, commit, notify } = useStore();
  const { barberName, matchesBarber, barber } = useCurrentBarber();

  const myQueue = (demo.queue || []).filter((item) => matchesBarber(item) && !['Completed', 'Removed', 'Skipped'].includes(item.status));
  const current = myQueue.find((item) => item.status === 'In Service');
  const next = myQueue.find((item) => item.status === 'Waiting');

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
                  <span className="eyebrow gold">Next in line · {next.number}</span>
                  <h2>{next.customerName} is waiting</h2>
                  <p>{next.serviceName} · Ready to call to chair</p>
                </div>
                <button
                  className="button button-dark button-small"
                  style={{ marginLeft: 'auto', alignSelf: 'center', whiteSpace: 'nowrap' }}
                  onClick={() => callNextClient(next)}
                >
                  Call to chair
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
  const { demo } = useStore();
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
                    <Link className="button button-soft button-small" to="/barber/customer-details">Customer details</Link>
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
              <Link to="/barber/service-session" className="button button-soft button-small">Open chair</Link>
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
            {myReviews.map((r) => (
              <tr key={r.id}>
                <td>
                  <div className="table-person">
                    <span className="avatar avatar-xs">{(r.customer || 'CU').slice(0, 2).toUpperCase()}</span>
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
            ))}
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
