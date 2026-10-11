import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, CalendarClock, CalendarDays, Check, CheckCircle2, Clock3,
  ListOrdered, Scissors, Star, TrendingUp, UserRound, Users, WalletCards
} from 'lucide-react';
import { useStore, currency, humanDate } from '../../context/StoreContext';
import { demoApi } from '../../mockService';
import {
  BentoStats, SectionCard, Toolbar, DataTable, StatusBadge, EmptyState
} from '../../components/common/UIComponents';

export function BarberPage({ path }) {
  if (path === '/barber') return <BarberDashboard />;
  if (path === '/barber/appointments') return <BarberAppointments />;
  if (path === '/barber/queue') return <BarberQueue />;
  if (path === '/barber/customer-details') return <BarberCustomerDetails />;
  if (path === '/barber/service-session') return <ServiceSession />;
  if (path === '/barber/schedule') return <BarberSchedule />;
  return <BarberPerformance />;
}

export function BarberDashboard() {
  const { demo } = useStore();
  const current = demo.queue.find((item) => item.barberId === 'bar-marco' && item.status === 'In Service');
  const next = demo.queue.find((item) => item.barberId === 'bar-marco' && item.status === 'Waiting');
  const completed = demo.appointments.filter((item) => item.barberId === 'bar-marco' && item.status === 'Completed').length;

  return (
    <>
      <BentoStats
        items={[
          ["Today's appointments", demo.appointments.filter((item) => item.barberId === 'bar-marco').length + 2, CalendarDays, 'Next at 10:30 AM'],
          ['Current customer', current?.customerName || 'No one yet', UserRound, current ? 'In service' : 'Chair is ready'],
          ['Next customer', next?.customerName || 'Queue is clear', ListOrdered, next?.serviceName || 'Take a short reset'],
          ['Completed services', completed + 5, CheckCircle2, '↑ 12% this month']
        ]}
      />
      <div className="dashboard-grid two-thirds">
        <SectionCard title="Chair focus" action={<Link to="/barber/service-session" className="button button-dark button-small">Open session <ArrowRight size={15} /></Link>}>
          <div className="chair-focus">
            {current ? (
              <>
                <span className="avatar avatar-lg">{current.customerName.split(' ').map((p) => p[0]).join('').slice(0, 2)}</span>
                <div>
                  <span className="eyebrow gold">In service · {current.number}</span>
                  <h2>{current.customerName}</h2>
                  <p>{current.serviceName} · {current.estimatedMinutes || 45} min</p>
                </div>
              </>
            ) : (
              <>
                <div className="empty-illustration"><Scissors size={24} /></div>
                <div>
                  <span className="eyebrow">Chair is ready</span>
                  <h2>Open the queue</h2>
                  <p>The next customer will appear when reception calls them in.</p>
                </div>
              </>
            )}
          </div>
        </SectionCard>
        <SectionCard title="Today at a glance">
          <div className="mini-metrics">
            <span><strong>09:00</strong><small>First chair</small></span>
            <span><strong>6</strong><small>Booked today</small></span>
            <span><strong>4.9</strong><small>Rating</small></span>
          </div>
          <div className="progress-line"><span style={{ width: '68%' }} /></div>
          <small className="muted-copy">68% of today’s scheduled chair time completed.</small>
        </SectionCard>
      </div>
      <SectionCard title="Upcoming chair list">
        <DataTable columns={['Time', 'Customer', 'Service', 'Status', '']}>
          <tbody>
            {demo.appointments.filter((item) => item.barberId === 'bar-marco').map((item) => (
              <tr key={item.id}>
                <td><strong>{item.time}</strong></td>
                <td>{item.customerName}</td>
                <td>{item.serviceName}</td>
                <td><StatusBadge status={item.status} /></td>
                <td><Link className="text-link" to="/barber/customer-details">Details <ArrowRight size={14} /></Link></td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </SectionCard>
    </>
  );
}

export function BarberAppointments() {
  const { demo } = useStore();
  return (
    <>
      <Toolbar
        title="Your bookings"
        count={demo.appointments.filter((item) => item.barberId === 'bar-marco').length}
        action={<Link className="button button-ghost button-small" to="/barber/schedule"><CalendarClock size={15} /> View schedule</Link>}
      />
      <SectionCard>
        <DataTable columns={['Time', 'Customer', 'Service', 'Status', 'Action']}>
          <tbody>
            {demo.appointments.filter((item) => item.barberId === 'bar-marco').map((item) => (
              <tr key={item.id}>
                <td><strong>{item.time}</strong><small className="table-sub">{humanDate(item.date)}</small></td>
                <td><div className="table-person"><span className="avatar avatar-xs">{item.customerName.split(' ').map((p) => p[0]).join('').slice(0, 2)}</span><strong>{item.customerName}</strong></div></td>
                <td>{item.serviceName}</td>
                <td><StatusBadge status={item.status} /></td>
                <td><Link className="button button-soft button-small" to="/barber/customer-details">Customer details</Link></td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </SectionCard>
    </>
  );
}

export function BarberQueue() {
  const { demo, commit, notify } = useStore();
  const list = demo.queue.filter((item) => item.barberId === 'bar-marco' && !['Completed', 'Removed', 'Skipped'].includes(item.status));

  const start = (item) => {
    commit((state) => demoApi.startService(state, item.id));
    notify('Service session started.');
  };

  return (
    <>
      <div className="queue-callout">
        <div>
          <span className="eyebrow gold">Your queue</span>
          <h2>{list.length ? `${list.length} customer${list.length > 1 ? 's' : ''} in line.` : 'No one is waiting.'}</h2>
          <p>Keep each service moving with clear handoffs from reception.</p>
        </div>
        <Link to="/barber/service-session" className="button button-dark">Open service session <ArrowRight size={16} /></Link>
      </div>
      <div className="barber-queue-list">
        {list.map((item, index) => (
          <div className={`barber-queue-card ${item.status === 'In Service' ? 'current' : ''}`} key={item.id}>
            <span className="queue-number-small">{item.number}</span>
            <span className="avatar avatar-md">{item.customerName.split(' ').map((p) => p[0]).join('').slice(0, 2)}</span>
            <div>
              <span className="eyebrow">{index === 0 ? 'Now / next' : `In line · ${index}`}</span>
              <h3>{item.customerName}</h3>
              <p>{item.serviceName}</p>
            </div>
            <StatusBadge status={item.status} />
            {item.status === 'Waiting' && (
              <button className="button button-dark button-small" onClick={() => start(item)}>Start</button>
            )}
          </div>
        ))}
        {!list.length && <EmptyState title="The queue is clear" copy="Reception will add customers here as they arrive." />}
      </div>
    </>
  );
}

export function BarberCustomerDetails() {
  const { demo } = useStore();
  const customer = demo.customers.find((item) => item.id === 'cust-demo');
  const current = demo.queue.find((item) => item.barberId === 'bar-marco' && !['Completed', 'Removed', 'Skipped'].includes(item.status));

  return (
    <div className="detail-page">
      <div className="detail-hero">
        <span className="avatar avatar-xl">{customer?.initials}</span>
        <div>
          <span className="eyebrow gold">Customer profile</span>
          <h2>{customer?.name}</h2>
          <p>{customer?.phone} · {customer?.email}</p>
        </div>
        <Link to="/barber/service-session" className="button button-dark">Service session <ArrowRight size={16} /></Link>
      </div>
      <div className="detail-columns">
        <SectionCard title="Current requested service">
          <div className="requested-service">
            <span className="service-icon"><Scissors size={19} /></span>
            <div>
              <strong>{current?.serviceName || 'Signature Fade'}</strong>
              <small>{current ? `${current.number} · Waiting in your queue` : 'No active queue item'}</small>
            </div>
          </div>
        </SectionCard>
        <SectionCard title="Preferences & notes">
          <p className="detail-quote">“{customer?.preferences || 'No preferences added.'}”</p>
          <p className="muted-copy">{customer?.notes || 'No notes added for this customer.'}</p>
        </SectionCard>
      </div>
      <SectionCard title="Previous services">
        <DataTable columns={['Date', 'Service', 'Amount', 'Status']}>
          <tbody>
            {demo.appointments.filter((item) => item.customerId === customer?.id).map((item) => (
              <tr key={item.id}>
                <td>{humanDate(item.date)}</td>
                <td>{item.serviceName}</td>
                <td>{currency(item.price)}</td>
                <td><StatusBadge status={item.status} /></td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </SectionCard>
    </div>
  );
}

export function ServiceSession() {
  const { demo, commit, notify } = useStore();
  const current = demo.queue.find((item) => item.barberId === 'bar-marco' && !['Completed', 'Removed', 'Skipped'].includes(item.status));
  const [notes, setNotes] = useState(current?.notes || '');

  const act = () => {
    if (!current) return notify('No active queue customer.', 'error');
    if (current.status === 'Waiting') {
      commit((state) => demoApi.startService(state, current.id));
      notify('Service started.');
    } else if (current.status === 'In Service') {
      commit((state) => demoApi.completeService(state, current.id, notes));
      notify('Service completed and sent to checkout.');
    }
  };

  return (
    <div className="session-layout">
      <div className="session-stage">
        <div className="session-top">
          <span className="eyebrow gold">Live service session</span>
          <StatusBadge status={current?.status || 'Waiting'} />
        </div>
        {current ? (
          <>
            <div className="session-client">
              <span className="avatar avatar-xl">{current.customerName.split(' ').map((p) => p[0]).join('').slice(0, 2)}</span>
              <span>
                <small>{current.number} · {current.barberName}</small>
                <h2>{current.customerName}</h2>
                <p>{current.serviceName}</p>
              </span>
            </div>
            <div className="session-timer">
              <Clock3 size={20} />
              <span>{current.status === 'In Service' ? 'Service is in progress' : 'Ready to start the service'}</span>
            </div>
            <label className="field-label">Service notes
              <textarea
                className="input textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add finish, preferences, or handoff notes..."
              />
            </label>
            <button className="button button-dark button-large button-full" onClick={act}>
              {current.status === 'Waiting' ? 'Start service' : 'Complete service'} <CheckCircle2 size={18} />
            </button>
          </>
        ) : (
          <EmptyState
            title="No service selected"
            copy="Open a customer from your queue to begin."
            action={<Link className="button button-dark" to="/barber/queue">Open queue</Link>}
          />
        )}
      </div>
      <aside className="session-aside">
        <span className="eyebrow">Session checklist</span>
        <div className={`checklist-row ${current?.status !== 'Waiting' ? 'done' : ''}`}>
          <span><Check size={14} /></span>
          <div>
            <strong>Customer called</strong>
            <small>Confirm the requested service.</small>
          </div>
        </div>
        <div className={`checklist-row ${current?.status === 'In Service' || current?.status === 'Completed' ? 'done' : ''}`}>
          <span><Scissors size={14} /></span>
          <div>
            <strong>Service in progress</strong>
            <small>Keep finish notes in the handoff.</small>
          </div>
        </div>
        <div className="checklist-row">
          <span><WalletCards size={14} /></span>
          <div>
            <strong>Reception checkout</strong>
            <small>Payment appears after completion.</small>
          </div>
        </div>
      </aside>
    </div>
  );
}

export function BarberSchedule() {
  return (
    <>
      <div className="schedule-header">
        <div>
          <span className="eyebrow">Week of October 12</span>
          <h2>My schedule</h2>
        </div>
        <div className="segmented">
          <button className="active">Agenda</button>
          <button>Week</button>
        </div>
      </div>
      <div className="agenda-list">
        {['Monday, Oct 12', 'Tuesday, Oct 13', 'Wednesday, Oct 14'].map((day, index) => (
          <div className="agenda-day" key={day}>
            <div className="agenda-date">
              <strong>{day.split(',')[0]}</strong>
              <span>{day.split(',')[1]}</span>
            </div>
            <div className="agenda-events">
              <div className="agenda-event">
                <span className="event-time">9:00 AM</span>
                <span>
                  <strong>{index === 0 ? 'Open chair' : 'Working hours'}</strong>
                  <small>{index === 0 ? 'Available for walk-ins' : '9:00 AM – 8:00 PM'}</small>
                </span>
                <span className="event-status available">Available</span>
              </div>
              <div className="agenda-event booked">
                <span className="event-time">10:30 AM</span>
                <span>
                  <strong>{index === 0 ? 'Miguel Santos' : 'Reserved slot'}</strong>
                  <small>{index === 0 ? 'Signature Fade' : 'Online booking'}</small>
                </span>
                <span className="event-status">Booked</span>
              </div>
              <div className="agenda-event break">
                <span className="event-time">1:00 PM</span>
                <span><strong>Break</strong><small>Chair reset</small></span>
                <span className="event-status">Unavailable</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function BarberPerformance() {
  return (
    <>
      <BentoStats
        items={[
          ["Completed services", 36, CheckCircle2, '↑ 8% vs last month'],
          ['Customers served', 31, Users, '24 returning clients'],
          ['Average rating', '4.9', Star, 'From 18 reviews'],
          ['Chair utilization', '78%', TrendingUp, 'Healthy pace']
        ]}
      />
      <div className="dashboard-grid two-thirds">
        <SectionCard title="Service mix">
          <div className="chart-bars">
            <span style={{ height: '82%' }}><i />Fades</span>
            <span style={{ height: '62%' }}><i />Classic</span>
            <span style={{ height: '48%' }}><i />Beard</span>
            <span style={{ height: '35%' }}><i />Combos</span>
          </div>
        </SectionCard>
        <SectionCard title="Customer signal">
          <div className="rating-summary">
            <strong>4.9</strong>
            <div>
              <span className="stars">★★★★★</span>
              <small>18 submitted reviews</small>
            </div>
          </div>
          <div className="rating-line-item">
            <span>5 stars</span>
            <div><i style={{ width: '88%' }} /></div>
            <b>16</b>
          </div>
          <div className="rating-line-item">
            <span>4 stars</span>
            <div><i style={{ width: '36%' }} /></div>
            <b>2</b>
          </div>
        </SectionCard>
      </div>
    </>
  );
}
