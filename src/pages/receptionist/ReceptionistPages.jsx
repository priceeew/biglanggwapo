import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronRight, Download,
  FileText, ListOrdered, MoreHorizontal, Plus, Search, ShoppingBag, UserPlus,
  WalletCards, X, Zap
} from 'lucide-react';
import { useStore, currency, today, humanDate } from '../../context/StoreContext';
import { demoApi } from '../../mockService';
import { saveAccount, validatePassword, validatePhone } from '../../data';
import { sendInviteNotification, saveAppointmentToAtlas } from '../../services/api';
import {
  BentoStats, SectionCard, Toolbar, AppointmentRow, QueueMini, DataTable,
  StatusBadge, EmptyState, StatCard
} from '../../components/common/UIComponents';

export function ReceptionistPage({ path }) {
  if (path === '/receptionist') return <ReceptionistDashboard />;
  if (path === '/receptionist/appointments') return <ReceptionistAppointments />;
  if (path === '/receptionist/walk-ins') return <WalkInPage />;
  if (path === '/receptionist/queue') return <QueueManagement />;
  if (path === '/receptionist/customers') return <CustomerManagement />;
  if (path === '/receptionist/payments') return <PaymentPage />;
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
            {(demo.appointments || []).slice(0, 4).map((item) => (
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

  const filtered = demo.appointments.filter(
    (item) => `${item.customerName} ${item.serviceName} ${item.barberName}`.toLowerCase().includes(query.toLowerCase()) && (status === 'All' || item.status === status)
  );

  const act = (id, action) => {
    const updater = action === 'confirm' ? demoApi.confirmAppointment : action === 'arrived' ? demoApi.markArrived : demoApi.cancelAppointment;
    if (action === 'cancel' && !window.confirm('Cancel this appointment?')) return;
    commit((state) => {
      const next = updater(state, id);
      const updatedApt = next.appointments.find((a) => a.id === id);
      if (updatedApt) {
        saveAppointmentToAtlas(updatedApt);
      }
      return next;
    });
    notify(action === 'arrived' ? 'Customer marked arrived and added to the queue.' : `Appointment ${action}ed.`);
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
        <DataTable columns={['Customer', 'Service', 'Schedule', 'Barber', 'Status', 'Actions']}>
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
                    <span>{item.barberName}</span>
                  </div>
                </td>
                <td><StatusBadge status={item.status} /></td>
                <td>
                  <div className="row-actions">
                    {item.status === 'Pending' && (
                      <button className="button button-soft button-small" onClick={() => act(item.id, 'confirm')}>
                        Confirm
                      </button>
                    )}
                    {['Confirmed', 'Arrived'].includes(item.status) && (
                      <button className="button button-soft button-small" onClick={() => act(item.id, 'arrived')}>
                        Mark arrived
                      </button>
                    )}
                    {!['Completed', 'Cancelled'].includes(item.status) && (
                      <button className="icon-button" title="Cancel" onClick={() => act(item.id, 'cancel')}>
                        <X size={16} />
                      </button>
                    )}
                    <button className="icon-button" title="View details"><MoreHorizontal size={17} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        {!filtered.length && <EmptyState title="No bookings match" copy="Try a different search or status filter." />}
      </SectionCard>
    </>
  );
}

export function WalkInPage() {
  const { demo, commit, notify } = useStore();
  const [form, setForm] = useState({
    customerId: '',
    customerName: '',
    phone: '',
    serviceId: demo.services[0]?.id || '',
    barberId: demo.barbers[0]?.id || ''
  });
  const [created, setCreated] = useState(null);

  const submit = (event) => {
    event.preventDefault();
    if (!form.customerId && !form.customerName.trim()) {
      return notify('Choose an existing customer or enter a name.', 'error');
    }
    if (!form.barberId) {
      return notify('Please select a barber (or add a barber to the shop first).', 'error');
    }
    let assignedNumber = '';
    commit((state) => {
      const next = demoApi.addWalkIn(state, form);
      const newApt = next.appointments[0];
      const newQueue = next.queue[0];
      if (newApt) {
        saveAppointmentToAtlas(newApt);
      }
      if (newQueue) {
        assignedNumber = newQueue.number;
      }
      return next;
    });
    setCreated(assignedNumber || 'Q-001');
    notify(`Walk-in added to the queue (${assignedNumber || 'Q-001'}).`);
    setForm({
      customerId: '',
      customerName: '',
      phone: '',
      serviceId: demo.services[0]?.id || '',
      barberId: demo.barbers[0]?.id || ''
    });
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
                  {demo.barbers.filter((b) => b.working).map((barber) => (
                    <option key={barber.id} value={barber.id}>{barber.name}</option>
                  ))}
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
          <button className="button button-dark" type="submit">Add to queue <ArrowRight size={16} /></button>
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

  const active = demo.queue.filter(
    (item) => !['Completed', 'Removed', 'Skipped'].includes(item.status) && (barber === 'All' || item.barberId === barber)
  );

  const act = (id, type) => {
    if (type === 'remove' && !window.confirm('Remove this queue entry?')) return;
    const api = type === 'start' ? demoApi.startService : type === 'skip' ? demoApi.skipQueue : demoApi.removeQueue;
    commit((state) => {
      const next = api(state, id);
      const queueItem = next.queue.find((q) => q.id === id);
      if (queueItem?.appointmentId) {
        const apt = next.appointments.find((a) => a.id === queueItem.appointmentId);
        if (apt) saveAppointmentToAtlas(apt);
      }
      return next;
    });
    notify(type === 'start' ? 'Customer called into service.' : `Queue entry ${type}ped.`);
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
            <span className="queue-wait">{item.status === 'In Service' ? 'In chair' : `~${item.estimatedMinutes} min`}</span>
            <div className="row-actions">
              {item.status === 'Waiting' && (
                <button className="button button-soft button-small" onClick={() => act(item.id, 'start')}>
                  Call next
                </button>
              )}
              {item.status === 'Waiting' && (
                <button className="icon-button" title="Skip" onClick={() => act(item.id, 'skip')}>
                  <ChevronRight size={16} />
                </button>
              )}
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
    </>
  );
}

export function CustomerManagement() {
  const { demo, commit, notify } = useStore();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(demo.customers[0]);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', preferences: '', notes: '' });

  const filtered = demo.customers.filter((item) =>
    `${item.name} ${item.email} ${item.phone}`.toLowerCase().includes(query.toLowerCase())
  );

  const handleCreateCustomer = (e) => {
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
    saveAccount({
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
              <span className="avatar avatar-sm">{customer.initials}</span>
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
              <span className="avatar avatar-lg">{selected.initials}</span>
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
                <input
                  className="input"
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="*********"
                />
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
      commit((state) => demoApi.recordPayment(state, item.id, method, cash));
      notify('Payment recorded and receipt generated.');
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

export function TransactionsPage() {
  const { demo } = useStore();
  const [query, setQuery] = useState('');

  const filtered = demo.transactions.filter((item) =>
    `${item.customerName} ${item.serviceName} ${item.receipt}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <Toolbar
        title="Daily transactions"
        count={filtered.length}
        query={query}
        setQuery={setQuery}
        action={
          <button className="button button-ghost button-small">
            <Download size={15} /> Export CSV
          </button>
        }
      />
      <div className="stats-row small-stats">
        <StatCard label="Gross sales" value={currency(demo.transactions.reduce((sum, item) => sum + item.amount, 0))} icon={WalletCards} />
        <StatCard label="Cash" value={currency(demo.transactions.filter((item) => item.method === 'Cash').reduce((sum, item) => sum + item.amount, 0))} icon={ShoppingBag} />
        <StatCard label="Digital" value={currency(demo.transactions.filter((item) => item.method !== 'Cash').reduce((sum, item) => sum + item.amount, 0))} icon={Zap} />
      </div>
      <SectionCard>
        <DataTable columns={['Receipt', 'Customer', 'Service', 'Method', 'Amount', 'Date']}>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                <td><strong>{item.receipt}</strong></td>
                <td>{item.customerName}</td>
                <td>{item.serviceName}</td>
                <td><span className="method-label">{item.method}</span></td>
                <td><strong>{currency(item.amount)}</strong></td>
                <td>{humanDate(item.date)}<small className="table-sub">{item.time}</small></td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </SectionCard>
    </>
  );
}
