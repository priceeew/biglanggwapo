import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, CalendarDays, Check, Download, Image as ImageIcon, Layers,
  Package, Pencil, Plus, RefreshCcw, Scissors, ShoppingBag, Tag,
  Trash2, TrendingUp, Upload, Users, X
} from 'lucide-react';
import { useStore, currency, humanDate } from '../../context/StoreContext';
import { demoApi } from '../../mockService';
import { saveAccount, deleteAccount, validatePassword, validatePhone } from '../../data';
import { sendInviteNotification, saveBarberToAtlas, deleteBarberFromAtlas, clearAllBarbersFromAtlas } from '../../services/api';
import { STANDARD_SCHEDULES, validateShiftWithinShopHours, findShiftConflicts } from '../../utils/scheduling';
import {
  BentoStats, SectionCard, Toolbar, DataTable, StatusBadge, EmptyState, MiniChart
} from '../../components/common/UIComponents';

export function AdminPage({ path }) {
  if (path === '/admin') return <AdminDashboard />;
  if (path === '/admin/reports') return <ReportsPage />;
  if (path === '/admin/inventory') return <InventoryPage />;
  if (path === '/admin/promotions') return <PromotionsPage />;
  if (path === '/admin/settings') return <SettingsPage />;
  const collection = path.split('/')[2];
  return <AdminManagementPage collection={collection} />;
}

export function AdminDashboard() {
  const { demo } = useStore();
  const revenue = demo.transactions.reduce((sum, item) => sum + item.amount, 0);

  return (
    <>
      <BentoStats
        items={[
          ["Revenue this month", currency(revenue + 4820), TrendingUp, '↑ 14.8% vs Sep'],
          ['Appointments', demo.appointments.length + 24, CalendarDays, '92% completion rate'],
          ['Active barbers', demo.barbers.filter((item) => item.working).length, Scissors, 'All shifts covered'],
          ['Customers', demo.customers.length + 126, Users, '↑ 18 this week']
        ]}
      />
      <div className="dashboard-grid two-thirds">
        <SectionCard title="Revenue trend" action={<Link to="/admin/reports" className="text-link">Full reports <ArrowRight size={14} /></Link>}>
          <MiniChart />
        </SectionCard>
        <SectionCard title="Queue overview">
          <div className="overview-ring">
            <div>
              <strong>{demo.queue.filter((item) => item.status === 'Waiting').length + 8}</strong>
              <small>in queue today</small>
            </div>
          </div>
          <div className="ring-legend">
            <span><i className="dot gold-dot" /> Waiting <b>8</b></span>
            <span><i className="dot dark-dot" /> In service <b>1</b></span>
            <span><i className="dot muted-dot" /> Completed <b>24</b></span>
          </div>
        </SectionCard>
      </div>
      <div className="dashboard-grid two-thirds">
        <SectionCard title="Recent transactions">
          <DataTable columns={['Customer', 'Service', 'Amount', 'Status']}>
            <tbody>
              {demo.transactions.slice(0, 4).map((item) => (
                <tr key={item.id}>
                  <td>{item.customerName}</td>
                  <td>{item.serviceName}</td>
                  <td><strong>{currency(item.amount)}</strong></td>
                  <td><StatusBadge status={item.status} /></td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </SectionCard>
        <SectionCard title="Popular services">
          <div className="rank-list">
            {demo.services.slice(0, 4).map((service, index) => (
              <div key={service.id}>
                <span className="rank">0{index + 1}</span>
                <span><strong>{service.name}</strong><small>{24 - index * 4} bookings</small></span>
                <strong>{index === 0 ? '32%' : `${21 - index * 4}%`}</strong>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </>
  );
}

const LEAVE_STATUS_OPTIONS = [
  { value: 'Active / On Duty', label: 'Active / On Duty (Available for bookings)', working: true, status: 'On shift' },
  { value: 'Sick Leave', label: 'Sick Leave (Unavailable / Rest period)', working: false, status: 'Sick Leave' },
  { value: 'Vacation Leave', label: 'Vacation Leave (Unavailable / Vacation)', working: false, status: 'Vacation Leave' },
  { value: 'Day Off', label: 'Day Off (Scheduled rest day)', working: false, status: 'Day Off' },
  { value: 'Inactive', label: 'Inactive / Deactivated', working: false, status: 'Inactive' }
];

export function AdminManagementPage({ collection }) {
  const { demo, commit, notify } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingBarber, setEditingBarber] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [editServiceData, setEditServiceData] = useState({
    name: '',
    category: 'Haircut',
    price: '',
    duration: '40',
    description: '',
    image: ''
  });
  const [editBarberData, setEditBarberData] = useState({
    name: '',
    specialty: '',
    phone: '',
    schedule: STANDARD_SCHEDULES[0],
    customSchedule: '',
    leaveStatus: 'Active / On Duty',
    leaveNotes: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    specialty: 'Fades & texture',
    schedule: STANDARD_SCHEDULES[0],
    customSchedule: '',
    status: 'On shift',
    preferences: '',
    notes: '',
    category: 'Cuts',
    price: '',
    duration: '30',
    description: '',
    image: ''
  });

  const config = {
    receptionists: {
      title: 'Manage receptionists',
      desc: 'Keep front-desk access current.',
      data: demo.receptionists || []
    },
    barbers: {
      title: 'Manage barbers',
      desc: 'Profiles, specialties, permanent shifts, and leave availability.',
      data: demo.barbers
    },
    customers: {
      title: 'Manage customers',
      desc: 'Search accounts, history, and status.',
      data: demo.customers
    },
    services: {
      title: 'Manage services',
      desc: 'Keep the menu, price, duration, and active state clear.',
      data: demo.services
    },
    appointments: {
      title: 'Manage appointments',
      desc: 'All bookings across the shop.',
      data: demo.appointments
    },
    schedules: {
      title: 'Manage schedules',
      desc: 'Working hours, breaks, days off, and available slots.',
      data: demo.barbers.map((b) => ({ ...b, schedule: b.schedule || STANDARD_SCHEDULES[0] }))
    },
    transactions: {
      title: 'Manage transactions',
      desc: 'All recorded payments and receipts.',
      data: demo.transactions
    }
  };

  const current = config[collection] || config.customers;
  const [query, setQuery] = useState('');
  const filtered = current.data.filter((item) => JSON.stringify(item).toLowerCase().includes(query.toLowerCase()));

  const toggle = (item) => {
    if (collection === 'barbers' || collection === 'services' || collection === 'customers') {
      if (window.confirm(`${item.active === false || item.status === 'Inactive' ? 'Activate' : 'Deactivate'} this record?`)) {
        const field = collection === 'customers' ? 'status' : collection === 'barbers' ? 'working' : 'active';
        commit((state) => demoApi.toggleActive(state, collection, item.id, field));
        notify('Record status updated.');
      }
    }
  };

  const handleDelete = (item) => {
    const itemName = item.name || item.customerName || item.serviceName || item.receipt || 'this record';
    if (window.confirm(`Delete "${itemName}"? This will permanently remove this record and its account.`)) {
      commit((state) => demoApi.deleteItem(state, collection, item.id));
      if (collection === 'barbers') {
        deleteBarberFromAtlas(item.id);
      }
      if (item.email) {
        deleteAccount(item.email);
      }
      notify(`"${itemName}" has been deleted.`, 'success');
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      specialty: 'Fades & texture',
      schedule: STANDARD_SCHEDULES[0],
      customSchedule: '',
      status: 'On shift',
      preferences: '',
      notes: '',
      category: 'Cuts',
      price: '',
      duration: '30',
      description: '',
      image: ''
    });
    setIsAdding(true);
  };

  const handleOpenEditService = (service) => {
    setEditingService(service);
    setEditServiceData({
      name: service.name || '',
      category: service.category || 'Haircut',
      price: service.price || '',
      duration: service.duration || '40',
      description: service.description || '',
      image: service.image || ''
    });
  };

  const handleSubmitEditService = (e) => {
    e.preventDefault();
    if (!editServiceData.name.trim() || !editServiceData.price || !editServiceData.duration || !editServiceData.description.trim()) {
      return notify('Please complete all required fields.', 'error');
    }
    const updated = {
      ...editingService,
      name: editServiceData.name.trim(),
      category: editServiceData.category || 'Haircut',
      price: Number(editServiceData.price),
      duration: Number(editServiceData.duration),
      description: editServiceData.description.trim(),
      image: editServiceData.image || ''
    };
    commit((state) => demoApi.updateItem(state, 'services', editingService.id, updated));
    notify(`Service "${updated.name}" updated successfully!`, 'success');
    setEditingService(null);
  };

  const handleOpenEditBarber = (barber) => {
    const isCustom = barber.schedule && !STANDARD_SCHEDULES.includes(barber.schedule);
    const existingLeave = barber.leaveStatus || (['Sick Leave', 'Vacation Leave', 'Day Off', 'Day off', 'Inactive'].includes(barber.status) ? barber.status : (barber.working === false ? 'Day Off' : 'Active / On Duty'));
    setEditingBarber(barber);
    setEditBarberData({
      name: barber.name || '',
      specialty: barber.specialty || '',
      phone: barber.phone || '',
      schedule: isCustom ? 'Custom' : (barber.schedule || STANDARD_SCHEDULES[0]),
      customSchedule: isCustom ? barber.schedule : '',
      leaveStatus: existingLeave,
      leaveNotes: barber.leaveNotes || ''
    });
  };

  const handleSubmitEditBarber = (e) => {
    e.preventDefault();
    if (!editBarberData.name.trim()) return notify('Barber name is required.', 'error');
    if (!editBarberData.specialty.trim()) return notify('Specialty is required.', 'error');
    if (!editBarberData.phone.trim()) return notify('Phone number is required.', 'error');
    const phoneErr = validatePhone(editBarberData.phone);
    if (phoneErr) return notify(phoneErr, 'error');

    const effectiveSchedule = editBarberData.schedule === 'Custom'
      ? (editBarberData.customSchedule.trim() || 'Custom Schedule')
      : editBarberData.schedule;

    // Validate shift times are within barbershop's configured opening and closing hours and include a weekly rest day
    const shopHours = demo.settings?.hours || 'Mon–Sun · 9:00 AM–8:00 PM';
    const valResult = validateShiftWithinShopHours(effectiveSchedule, shopHours);
    if (!valResult.valid) {
      return notify(valResult.error, 'error');
    }

    // Warn the admin if changing a shift affects existing active appointments
    if (editingBarber.schedule !== effectiveSchedule) {
      const conflicts = findShiftConflicts(editingBarber, effectiveSchedule, demo.appointments);
      if (conflicts.length > 0) {
        const conflictDetails = conflicts
          .slice(0, 5)
          .map((c) => `• ${c.apt.date} at ${c.apt.time} (${c.apt.customerName || 'Customer'} - ${c.apt.serviceName}): ${c.reason}`)
          .join('\n');
        const extra = conflicts.length > 5 ? `\n...and ${conflicts.length - 5} more` : '';
        const warnMessage = `WARNING: Changing ${editingBarber.name}'s shift affects ${conflicts.length} active appointment(s):\n\n${conflictDetails}${extra}\n\nDo you want to proceed with this shift change? Affected appointments may need to be rescheduled.`;
        if (!window.confirm(warnMessage)) {
          return;
        }
      }
    }

    const opt = LEAVE_STATUS_OPTIONS.find((o) => o.value === editBarberData.leaveStatus) || LEAVE_STATUS_OPTIONS[0];
    const isWorking = opt.working;
    const computedStatus = opt.status;

    const updatedBarber = {
      ...editingBarber,
      name: editBarberData.name.trim(),
      specialty: editBarberData.specialty.trim(),
      phone: editBarberData.phone.trim(),
      schedule: effectiveSchedule,
      leaveStatus: editBarberData.leaveStatus,
      leaveNotes: editBarberData.leaveNotes.trim(),
      status: computedStatus,
      working: isWorking
    };

    commit((state) => demoApi.updateBarber(state, editingBarber.id, updatedBarber));
    saveBarberToAtlas(updatedBarber);

    if (editingBarber.email) {
      try {
        const raw = window.localStorage.getItem('biglanggwapo-accounts');
        if (raw) {
          const list = JSON.parse(raw);
          const idx = list.findIndex((a) => a.email?.toLowerCase() === editingBarber.email.toLowerCase());
          if (idx !== -1) {
            list[idx].name = updatedBarber.name;
            list[idx].phone = updatedBarber.phone;
            window.localStorage.setItem('biglanggwapo-accounts', JSON.stringify(list));
          }
        }
      } catch {}
    }

    notify(`Barber "${updatedBarber.name}" profile & shift schedule updated!`, 'success');
    setEditingBarber(null);
  };

  const handleSubmitAdd = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return notify('Please enter a name.', 'error');

    if (collection === 'receptionists') {
      if (!formData.email.trim() || !formData.phone.trim() || !formData.password) {
        return notify('All fields (Name, Email, Phone, Password) are required.', 'error');
      }
      const phoneError = validatePhone(formData.phone);
      if (phoneError) return notify(phoneError, 'error');
      const pwdError = validatePassword(formData.password);
      if (pwdError) {
        return notify(pwdError, 'error');
      }
      const cleanEmail = formData.email.trim().toLowerCase();
      commit((state) => demoApi.addReceptionist(state, {
        name: formData.name.trim(),
        email: cleanEmail,
        phone: formData.phone.trim()
      }));
      saveAccount({
        email: cleanEmail,
        password: formData.password,
        role: 'receptionist',
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        initials: formData.name.trim().split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'RC',
        redirectPath: '/receptionist'
      });
      notify(`Receptionist "${formData.name}" created! Sending invitation...`);
      sendInviteNotification({
        to: cleanEmail,
        name: formData.name.trim(),
        role: 'receptionist',
        password: formData.password
      }).then((res) => {
        if (res.success) notify(res.previewUrl ? 'Email sent in TEST mode (Gmail not configured in .env).' : `Invitation email sent to ${cleanEmail}!`, res.previewUrl ? 'warning' : 'success');
        else notify(`Email failed: ${res.error || res.message}`, 'error');
      });
    } else if (collection === 'barbers') {
      if (!formData.email.trim() || !formData.phone.trim() || !formData.password || !formData.specialty.trim() || !formData.schedule) {
        return notify('All fields (Name, Email, Phone, Password, Specialty, Permanent schedule) are required.', 'error');
      }
      const phoneError = validatePhone(formData.phone);
      if (phoneError) return notify(phoneError, 'error');
      const pwdError = validatePassword(formData.password);
      if (pwdError) {
        return notify(pwdError, 'error');
      }
      const cleanEmail = formData.email.trim().toLowerCase();
      const newBarberId = 'bar-' + Date.now();
      const finalSchedule = formData.schedule === 'Custom'
        ? (formData.customSchedule?.trim() || 'Custom Schedule')
        : formData.schedule;

      // Validate shift times are within barbershop's configured opening and closing hours and include a weekly rest day
      const shopHours = demo.settings?.hours || 'Mon–Sun · 9:00 AM–8:00 PM';
      const valResult = validateShiftWithinShopHours(finalSchedule, shopHours);
      if (!valResult.valid) {
        return notify(valResult.error, 'error');
      }

      const newBarberObj = {
        id: newBarberId,
        name: formData.name.trim(),
        specialty: formData.specialty.trim(),
        email: cleanEmail,
        phone: formData.phone.trim(),
        schedule: finalSchedule,
        status: 'On shift',
        leaveStatus: 'Active / On Duty',
        leaveNotes: '',
        working: true
      };
      commit((state) => demoApi.addBarber(state, newBarberObj));
      saveBarberToAtlas(newBarberObj);
      saveAccount({
        email: cleanEmail,
        password: formData.password,
        role: 'barber',
        barberId: newBarberId,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        initials: formData.name.trim().split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'BR',
        redirectPath: '/barber'
      });
      notify(`Barber "${formData.name}" created! Sending invitation...`);
      sendInviteNotification({
        to: cleanEmail,
        name: formData.name.trim(),
        role: 'barber',
        password: formData.password
      }).then((res) => {
        if (res.success) notify(res.previewUrl ? 'Email sent in TEST mode (Gmail not configured in .env).' : `Invitation email sent to ${cleanEmail}!`, res.previewUrl ? 'warning' : 'success');
        else notify(`Email failed: ${res.error || res.message}`, 'error');
      });
    } else if (collection === 'customers') {
      if (!formData.email.trim() || !formData.phone.trim() || !formData.password) {
        return notify('All fields (Name, Email, Phone, Password) are required.', 'error');
      }
      const phoneError = validatePhone(formData.phone);
      if (phoneError) return notify(phoneError, 'error');
      const pwdError = validatePassword(formData.password);
      if (pwdError) {
        return notify(pwdError, 'error');
      }
      const cleanEmail = formData.email.trim().toLowerCase();
      const newCustId = 'cust-' + Date.now();
      commit((state) => demoApi.addCustomer(state, {
        id: newCustId,
        name: formData.name.trim(),
        email: cleanEmail,
        phone: formData.phone.trim(),
        preferences: formData.preferences.trim(),
        notes: formData.notes.trim()
      }));
      saveAccount({
        email: cleanEmail,
        password: formData.password,
        role: 'customer',
        customerId: newCustId,
        name: formData.name.trim(),
        initials: formData.name.trim().split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'CU',
        redirectPath: '/booking'
      });
      notify(`Customer "${formData.name}" added! Sending welcome email...`);
      sendInviteNotification({
        to: cleanEmail,
        name: formData.name.trim(),
        role: 'customer',
        password: formData.password
      }).then((res) => {
        if (res.success) notify(res.previewUrl ? 'Email sent in TEST mode (Gmail not configured in .env).' : `Welcome email sent to ${cleanEmail}!`, res.previewUrl ? 'warning' : 'success');
        else notify(`Email failed: ${res.error || res.message}`, 'error');
      });
    } else if (collection === 'services') {
      if (!formData.name.trim() || !formData.price || !formData.duration || !formData.description.trim()) {
        return notify('All fields (Name, Category, Price, Duration, Description) are required.', 'error');
      }
      commit((state) => demoApi.addItem(state, 'services', {
        name: formData.name.trim(),
        category: formData.category || 'Cuts',
        price: Number(formData.price),
        duration: Number(formData.duration),
        description: formData.description.trim(),
        image: formData.image.trim() || 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80',
        active: true
      }));
      notify(`Service "${formData.name}" added to menu!`);
    } else {
      notify(`Record for "${formData.name}" created.`);
    }

    setIsAdding(false);
  };

  return (
    <>
      <Toolbar
        title={current.title}
        description={current.desc}
        count={filtered.length}
        query={query}
        setQuery={setQuery}
        action={
          ['receptionists', 'barbers', 'customers', 'services'].includes(collection) ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {collection === 'barbers' && current.data.length > 0 && (
                <button
                  className="button button-ghost button-small"
                  style={{ color: '#d9534f', borderColor: 'rgba(217, 83, 79, 0.4)' }}
                  onClick={() => {
                    if (window.confirm('Clear all test barbers? This will delete all current barbers and their login accounts.')) {
                      current.data.forEach((b) => {
                        if (b.email) deleteAccount(b.email);
                      });
                      clearAllBarbersFromAtlas();
                      commit((state) => ({ ...state, barbers: [] }));
                      notify('All test barbers cleared.', 'success');
                    }
                  }}
                >
                  <Trash2 size={13} /> Clear all barbers
                </button>
              )}
              <button className="button button-dark button-small" onClick={handleOpenAdd}>
                <Plus size={15} /> Add new
              </button>
            </div>
          ) : null
        }
      />
      <SectionCard>
        <DataTable columns={
          collection === 'services' ? ['Service', 'Category', 'Price', 'Duration', 'Status', ''] :
          collection === 'appointments' ? ['Customer', 'Service', 'Date', 'Barber', 'Status', ''] :
          collection === 'transactions' ? ['Receipt', 'Customer', 'Method', 'Amount', 'Date', ''] :
          collection === 'barbers' ? ['Name / record', 'Phone & Specialty', 'Permanent Schedule', 'Status / Leave', ''] :
          ['Name / record', 'Details', 'Status', 'Last updated', '']
        }>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="table-person">
                    <span className="avatar avatar-xs">{(item.initials || item.name || item.customerName || item.receipt || 'BG').slice(0, 2).toUpperCase()}</span>
                    <span><strong>{item.name || item.customerName || item.receipt}</strong><small>{item.email || item.description || item.serviceName || item.category || item.access || ''}</small></span>
                  </div>
                </td>
                <td>{collection === 'services' ? item.category : collection === 'appointments' ? item.serviceName : collection === 'transactions' ? item.method : collection === 'schedules' ? item.schedule : collection === 'barbers' ? (
                  <div>
                    <strong>{item.phone || 'No phone'}</strong>
                    <small>{item.specialty || 'General cuts'}</small>
                  </div>
                ) : item.phone || item.specialty || item.email || '—'}</td>
                <td>{collection === 'services' ? currency(item.price) : collection === 'appointments' ? humanDate(item.date) : collection === 'transactions' ? currency(item.amount) : collection === 'barbers' ? (
                  <span style={{ fontSize: '11px', color: 'var(--ink)' }}>{item.schedule || STANDARD_SCHEDULES[0]}</span>
                ) : <StatusBadge status={item.status || (item.active || item.working ? 'Active' : 'Inactive')} />}</td>
                <td>{collection === 'services' ? `${item.duration} min` : collection === 'appointments' ? <StatusBadge status={item.status} /> : collection === 'transactions' ? humanDate(item.date) : collection === 'barbers' ? (
                  <StatusBadge status={item.leaveStatus || item.status || (item.working ? 'Active / On Duty' : 'Inactive')} />
                ) : item.lastVisit || 'Today'}</td>
                <td>
                  <div className="row-actions">
                    <button
                      className="icon-button"
                      title="Edit"
                      onClick={() => {
                        if (collection === 'barbers') {
                          handleOpenEditBarber(item);
                        } else if (collection === 'services') {
                          handleOpenEditService(item);
                        } else {
                          notify('Edit form opened in this demo build.');
                        }
                      }}
                    >
                      <Pencil size={16} />
                    </button>
                    {['barbers', 'services', 'customers'].includes(collection) && (
                      <button className="button button-soft button-small" onClick={() => toggle(item)}>
                        {item.active === false || item.status === 'Inactive' || item.working === false ? 'Activate' : 'Deactivate'}
                      </button>
                    )}
                    {['barbers', 'receptionists', 'customers', 'services'].includes(collection) && (
                      <button
                        className="icon-button icon-button-danger"
                        title="Delete record"
                        style={{ color: '#d9534f' }}
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        {!filtered.length && <EmptyState title="No records match" copy="Try a different search phrase." />}
      </SectionCard>

      {isAdding && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setIsAdding(false)}>
          <div className="modal-card">
            <button className="modal-close" onClick={() => setIsAdding(false)} aria-label="Close dialog">
              <X size={18} />
            </button>
            <div className="modal-heading">
              <span className="eyebrow gold">
                ADD NEW {collection === 'receptionists' ? 'RECEPTIONIST' : collection === 'barbers' ? 'BARBER' : collection === 'customers' ? 'CUSTOMER' : collection === 'services' ? 'SERVICE' : 'RECORD'}
              </span>
              <h2>
                {collection === 'receptionists' ? 'Add Receptionist' : collection === 'barbers' ? 'Add Barber' : collection === 'customers' ? 'Add Customer' : collection === 'services' ? 'Add Service' : 'Add Record'}
              </h2>
              <p>
                {['receptionists', 'barbers', 'customers'].includes(collection)
                  ? 'Enter the details below. Login credentials will be automatically enabled.'
                  : 'Enter the details to add this to the catalog.'}
              </p>
            </div>

            <form className="form-stack" onSubmit={handleSubmitAdd}>
              <label className="field-label">Full name
                <input
                  className="input"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={collection === 'receptionists' ? 'e.g. Bea Dizon' : collection === 'barbers' ? 'e.g. Marco Reyes' : collection === 'customers' ? 'e.g. Juan Dela Cruz' : 'e.g. Haircut Name'}
                  autoFocus
                />
              </label>

              {['receptionists', 'barbers', 'customers'].includes(collection) && (
                <>
                  <label className="field-label">Email address (for login)
                    <input
                      className="input"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@biglanggwapo.com"
                    />
                  </label>
                  <label className="field-label">Phone number
                    <input
                      className="input"
                      type="tel"
                      inputMode="numeric"
                      required
                      maxLength={11}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                      placeholder="09170000000"
                    />
                  </label>
                  <label className="field-label">Password
                    <input
                      className="input"
                      type="password"
                      required
                      minLength={8}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="*********"
                    />
                  </label>
                </>
              )}

              {collection === 'barbers' && (
                <>
                  <label className="field-label">Specialty
                    <input
                      className="input"
                      required
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                      placeholder="e.g. Fades & texture, Scissor cuts"
                    />
                  </label>
                  <label className="field-label">Permanent work schedule
                    <select
                      className="input"
                      required
                      value={formData.schedule}
                      onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    >
                      {STANDARD_SCHEDULES.map((sch) => (
                        <option key={sch} value={sch}>{sch}</option>
                      ))}
                      <option value="Custom">Custom schedule...</option>
                    </select>
                  </label>
                  {formData.schedule === 'Custom' && (
                    <div style={{ marginTop: '4px' }}>
                      <label className="field-label">Specify custom schedule
                        <input
                          className="input"
                          required
                          value={formData.customSchedule || ''}
                          onChange={(e) => setFormData({ ...formData, customSchedule: e.target.value })}
                          placeholder="e.g. Wed–Sun · 11:00 AM – 8:00 PM (Break: 2:30 PM – 3:30 PM · Rest: Tue)"
                        />
                      </label>
                      <small style={{ color: 'var(--muted)', fontSize: '10px', display: 'block', marginTop: '4px', lineHeight: 1.4 }}>
                        Must include a weekly rest day (e.g. Rest: Tue) and fit within shop hours ({demo.settings?.hours || '9:00 AM – 8:00 PM'}).
                      </small>
                    </div>
                  )}
                </>
              )}

              {collection === 'customers' && (
                <>
                  <label className="field-label">Preferences (optional)
                    <input
                      className="input"
                      value={formData.preferences}
                      onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
                      placeholder="e.g. Low taper fade, matte finish"
                    />
                  </label>
                  <label className="field-label">Notes (optional)
                    <input
                      className="input"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="e.g. Prefers afternoon appointments"
                    />
                  </label>
                </>
              )}

              {collection === 'services' && (
                <>
                  <div className="form-grid">
                    <label className="field-label">Category
                      <select
                        className="input"
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        <option value="Haircut">Haircut (Choose 1)</option>
                        <option value="Shave">Shave & Grooming (Choose 1)</option>
                        <option value="Treatment">Treatment & Add-on (Pick Many)</option>
                      </select>
                    </label>
                    <label className="field-label">Price (₱)
                      <input
                        className="input"
                        type="number"
                        required
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="420"
                      />
                    </label>
                  </div>
                  <label className="field-label">Duration (minutes)
                    <input
                      className="input"
                      type="number"
                      required
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="45"
                    />
                  </label>
                  <div className="field-label">
                    <span>Service Image (Local Upload from Device)</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px' }}>
                      {formData.image ? (
                        <img
                          src={formData.image}
                          alt="Service preview"
                          style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover', border: '1px solid var(--line)' }}
                        />
                      ) : (
                        <div style={{ width: '64px', height: '64px', borderRadius: '10px', background: '#f5f2eb', display: 'grid', placeItems: 'center', color: '#999', border: '1px solid var(--line)' }}>
                          <ImageIcon size={22} />
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label className="button button-soft button-small" style={{ margin: 0, cursor: 'pointer', display: 'inline-flex' }}>
                          <Upload size={14} /> Choose local photo
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 3 * 1024 * 1024) return notify('Image must be under 3MB', 'error');
                                const reader = new FileReader();
                                reader.onload = (evt) => {
                                  setFormData({ ...formData, image: evt.target.result });
                                  notify('Image selected from device!');
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        <small style={{ color: 'var(--muted)', fontSize: '10px' }}>Upload PNG, JPG, or WEBP from local files.</small>
                      </div>
                    </div>
                  </div>
                  <label className="field-label">Description
                    <textarea
                      className="input textarea"
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Service details and finish..."
                    />
                  </label>
                </>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="button button-ghost button-full" onClick={() => setIsAdding(false)}>
                  Cancel
                </button>
                <button type="submit" className="button button-dark button-full">
                  Create record <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingBarber && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setEditingBarber(null)}>
          <div className="modal-card">
            <button className="modal-close" onClick={() => setEditingBarber(null)} aria-label="Close dialog">
              <X size={18} />
            </button>
            <div className="modal-heading">
              <span className="eyebrow gold">EDIT BARBER PROFILE</span>
              <h2>Edit {editingBarber.name}</h2>
              <p>Update permanent work schedule, contact details, or set sick / vacation leave status.</p>
            </div>

            <form className="form-stack" onSubmit={handleSubmitEditBarber}>
              <label className="field-label">Full name
                <input
                  className="input"
                  required
                  value={editBarberData.name}
                  onChange={(e) => setEditBarberData({ ...editBarberData, name: e.target.value })}
                  placeholder="e.g. Marco Reyes"
                />
              </label>

              <label className="field-label">Specialty
                <input
                  className="input"
                  required
                  value={editBarberData.specialty}
                  onChange={(e) => setEditBarberData({ ...editBarberData, specialty: e.target.value })}
                  placeholder="e.g. Fades & texture, Scissor cuts"
                />
              </label>

              <label className="field-label">Phone number
                <input
                  className="input"
                  type="tel"
                  inputMode="numeric"
                  required
                  maxLength={11}
                  value={editBarberData.phone}
                  onChange={(e) => setEditBarberData({ ...editBarberData, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                  placeholder="09170000000"
                />
              </label>

              <label className="field-label">Permanent work schedule
                <select
                  className="input"
                  required
                  value={editBarberData.schedule}
                  onChange={(e) => setEditBarberData({ ...editBarberData, schedule: e.target.value })}
                >
                  {STANDARD_SCHEDULES.map((sch) => (
                    <option key={sch} value={sch}>{sch}</option>
                  ))}
                  <option value="Custom">Custom schedule...</option>
                </select>
              </label>

              {editBarberData.schedule === 'Custom' && (
                <div style={{ marginTop: '4px' }}>
                  <label className="field-label">Custom schedule details
                    <input
                      className="input"
                      required
                      value={editBarberData.customSchedule || ''}
                      onChange={(e) => setEditBarberData({ ...editBarberData, customSchedule: e.target.value })}
                      placeholder="e.g. Wed–Sun · 11:00 AM – 8:00 PM (Break: 2:30 PM – 3:30 PM · Rest: Tue)"
                    />
                  </label>
                  <small style={{ color: 'var(--muted)', fontSize: '10px', display: 'block', marginTop: '4px', lineHeight: 1.4 }}>
                    Must include a weekly rest day (e.g. Rest: Tue) and fit within shop hours ({demo.settings?.hours || '9:00 AM – 8:00 PM'}).
                  </small>
                </div>
              )}

              <div style={{ padding: '14px', background: 'var(--paper)', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <label className="field-label" style={{ marginBottom: '8px', color: 'var(--ink)' }}>
                  <strong>Leave / Availability status</strong>
                  <select
                    className="input"
                    required
                    value={editBarberData.leaveStatus}
                    onChange={(e) => setEditBarberData({ ...editBarberData, leaveStatus: e.target.value })}
                    style={{ marginTop: '6px' }}
                  >
                    {LEAVE_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
                <small style={{ color: 'var(--muted)', display: 'block', fontSize: '10px', lineHeight: 1.4 }}>
                  {editBarberData.leaveStatus === 'Active / On Duty'
                    ? '✓ Barber is marked on-duty and open for customer bookings.'
                    : '⚠ Barber is marked on leave/unavailable and hidden from online booking chair selection.'}
                </small>
              </div>

              {editBarberData.leaveStatus !== 'Active / On Duty' && (
                <label className="field-label">Leave notes / Return date (optional)
                  <input
                    className="input"
                    value={editBarberData.leaveNotes}
                    onChange={(e) => setEditBarberData({ ...editBarberData, leaveNotes: e.target.value })}
                    placeholder="e.g. On sick leave until Friday, returns Oct 18"
                  />
                </label>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="button button-ghost button-full" onClick={() => setEditingBarber(null)}>
                  Cancel
                </button>
                <button type="submit" className="button button-dark button-full">
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SERVICE MODAL WITH LOCAL IMAGE UPLOAD */}
      {editingService && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setEditingService(null)}>
          <div className="modal-card">
            <button className="modal-close" onClick={() => setEditingService(null)} aria-label="Close dialog">
              <X size={18} />
            </button>
            <div className="modal-heading">
              <span className="eyebrow gold">EDIT SERVICE MENU ITEM</span>
              <h2>Edit {editingService.name}</h2>
              <p>Update service details, price, duration, category, or choose a custom photo from your device.</p>
            </div>

            <form className="form-stack" onSubmit={handleSubmitEditService}>
              <label className="field-label">Service name
                <input
                  className="input"
                  required
                  value={editServiceData.name}
                  onChange={(e) => setEditServiceData({ ...editServiceData, name: e.target.value })}
                  placeholder="e.g. Signature Fade"
                />
              </label>

              <div className="form-grid">
                <label className="field-label">Category
                  <select
                    className="input"
                    required
                    value={editServiceData.category}
                    onChange={(e) => setEditServiceData({ ...editServiceData, category: e.target.value })}
                  >
                    <option value="Haircut">Haircut (Choose 1)</option>
                    <option value="Shave">Shave & Grooming (Choose 1)</option>
                    <option value="Treatment">Treatment & Add-on (Pick Many)</option>
                  </select>
                </label>
                <label className="field-label">Price (₱)
                  <input
                    className="input"
                    type="number"
                    required
                    value={editServiceData.price}
                    onChange={(e) => setEditServiceData({ ...editServiceData, price: e.target.value })}
                    placeholder="420"
                  />
                </label>
              </div>

              <label className="field-label">Duration (minutes)
                <input
                  className="input"
                  type="number"
                  required
                  value={editServiceData.duration}
                  onChange={(e) => setEditServiceData({ ...editServiceData, duration: e.target.value })}
                  placeholder="45"
                />
              </label>

              {/* LOCAL IMAGE UPLOAD / PREVIEW */}
              <div className="field-label">
                <span>Service Image (Local Upload from Device)</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px' }}>
                  {editServiceData.image ? (
                    <img
                      src={editServiceData.image}
                      alt="Service preview"
                      style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover', border: '1px solid var(--line)' }}
                    />
                  ) : (
                    <div style={{ width: '64px', height: '64px', borderRadius: '10px', background: '#f5f2eb', display: 'grid', placeItems: 'center', color: '#999', border: '1px solid var(--line)' }}>
                      <ImageIcon size={22} />
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="button button-soft button-small" style={{ margin: 0, cursor: 'pointer', display: 'inline-flex' }}>
                      <Upload size={14} /> Choose local photo
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 3 * 1024 * 1024) return notify('Image must be under 3MB', 'error');
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              setEditServiceData({ ...editServiceData, image: evt.target.result });
                              notify('Image selected from device!');
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <small style={{ color: 'var(--muted)', fontSize: '10px' }}>Upload PNG, JPG, or WEBP from local files.</small>
                  </div>
                </div>
              </div>

              <label className="field-label">Description
                <textarea
                  className="input textarea"
                  required
                  value={editServiceData.description}
                  onChange={(e) => setEditServiceData({ ...editServiceData, description: e.target.value })}
                  placeholder="Service details and finish..."
                />
              </label>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="button button-ghost button-full" onClick={() => setEditingService(null)}>
                  Cancel
                </button>
                <button type="submit" className="button button-dark button-full">
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function ReportsPage() {
  const { demo, notify } = useStore();
  return (
    <>
      <Toolbar
        title="Reports & analytics"
        description="A practical read on revenue, bookings, and the team."
        action={
          <button className="button button-dark button-small" onClick={() => notify('Mock CSV export downloaded.')}>
            <Download size={15} /> Export CSV
          </button>
        }
      />
      <div className="dashboard-grid two-thirds">
        <SectionCard title="Revenue trend"><MiniChart tall /></SectionCard>
        <SectionCard title="Payment method breakdown">
          <div className="donut-card">
            <div className="donut">
              <strong>₱{(demo.transactions.reduce((sum, item) => sum + item.amount, 0) / 1000).toFixed(1)}k</strong>
              <small>total demo sales</small>
            </div>
            <div className="donut-legend">
              <span><i className="dot gold-dot" /> Cash <b>48%</b></span>
              <span><i className="dot dark-dot" /> GCash <b>36%</b></span>
              <span><i className="dot muted-dot" /> Card <b>16%</b></span>
            </div>
          </div>
        </SectionCard>
      </div>
      <div className="dashboard-grid three">
        <SectionCard title="Appointment trends">
          <div className="big-metric">92%<small>completion rate</small></div>
          <div className="progress-line"><span style={{ width: '92%' }} /></div>
        </SectionCard>
        <SectionCard title="Popular service">
          <div className="big-metric">Fade<small>32% of bookings</small></div>
          <div className="progress-line"><span style={{ width: '74%' }} /></div>
        </SectionCard>
        <SectionCard title="Barber performance">
          <div className="big-metric">Marco<small>4.9 average rating</small></div>
          <div className="progress-line"><span style={{ width: '89%' }} /></div>
        </SectionCard>
      </div>
    </>
  );
}

export function InventoryPage() {
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

  const retailItems = demo.inventory.filter((item) => normalizeCat(item.category) === 'Products for Sale');
  const toolItems = demo.inventory.filter((item) => normalizeCat(item.category) === 'Barber Tools');
  const furnitureItems = demo.inventory.filter((item) => normalizeCat(item.category) === 'Shop Furniture');
  const accessoryItems = demo.inventory.filter((item) => normalizeCat(item.category) === 'Accessories');
  const consumableItems = demo.inventory.filter((item) => normalizeCat(item.category) === 'Consumable');
  const lowStockItems = demo.inventory.filter((item) => item.stock <= item.threshold);

  const retailTotalUnits = retailItems.reduce((sum, item) => sum + (Number(item.stock) || 0), 0);
  const toolsTotalUnits = toolItems.reduce((sum, item) => sum + (Number(item.stock) || 0), 0);
  const furnitureTotalUnits = furnitureItems.reduce((sum, item) => sum + (Number(item.stock) || 0), 0);

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

export function PromotionsPage() {
  const { demo, commit, notify } = useStore();
  return (
    <>
      <Toolbar
        title="Promotions & discounts"
        description="Active offers are automatically featured on the public homepage."
        action={
          <button className="button button-dark button-small" onClick={() => notify('Promotion form opened in this demo build.')}>
            <Plus size={15} /> Create promotion
          </button>
        }
      />
      <div className="promo-admin-grid">
        {demo.promotions.map((promo) => (
          <div className={`promo-admin-card ${promo.active ? 'active' : ''}`} key={promo.id}>
            <div className="promo-admin-top">
              <span className="promo-symbol"><Tag size={18} /></span>
              <StatusBadge status={promo.active ? 'Active' : 'Inactive'} />
            </div>
            <span className="eyebrow">{promo.type} discount</span>
            <h2>{promo.title}</h2>
            <p>{promo.description}</p>
            <div className="promo-admin-meta">
              <span><small>Value</small><strong>{promo.type === 'Percentage' ? `${promo.value}%` : currency(promo.value)}</strong></span>
              <span><small>Validity</small><strong>{promo.validFrom} → {promo.validTo}</strong></span>
            </div>
            <button
              className="button button-ghost button-small"
              onClick={() => {
                commit((state) => demoApi.toggleActive(state, 'promotions', promo.id));
                notify('Promotion status updated.');
              }}
            >
              {promo.active ? 'Deactivate' : 'Activate'} <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

export function SettingsPage() {
  const { demo, commit, notify } = useStore();
  const [form, setForm] = useState(demo.settings);

  const save = (e) => {
    e.preventDefault();
    commit((state) => demoApi.saveSettings(state, form));
    notify('System settings saved.');
  };

  return (
    <form className="settings-layout" onSubmit={save}>
      <SectionCard title="Shop details" description="The public site uses these settings for contact and hours.">
        <div className="form-grid">
          <label className="field-label">Shop name
            <input className="input" value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} />
          </label>
          <label className="field-label">Phone
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>
          <label className="field-label">Email
            <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="field-label">Opening hours
            <input className="input" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
          </label>
        </div>
        <label className="field-label">Address
          <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </label>
      </SectionCard>
      <SectionCard title="Booking & checkout">
        <div className="form-grid">
          <label className="field-label">Slot interval
            <select className="input" value={form.slotInterval} onChange={(e) => setForm({ ...form, slotInterval: Number(e.target.value) })}>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
            </select>
          </label>
          <label className="field-label">Payment methods
            <input className="input" value={form.paymentMethods.join(', ')} onChange={(e) => setForm({ ...form, paymentMethods: e.target.value.split(',').map((x) => x.trim()) })} />
          </label>
        </div>
        <label className="field-label">Cancellation policy
          <textarea className="input textarea" value={form.cancellationPolicy} onChange={(e) => setForm({ ...form, cancellationPolicy: e.target.value })} />
        </label>
        <div className="setting-row">
          <div>
            <strong>Commission tracking</strong>
            <small>Hide commission data when disabled.</small>
          </div>
          <button type="button" className={`toggle ${form.commissionTracking ? 'active' : ''}`} onClick={() => setForm({ ...form, commissionTracking: !form.commissionTracking })}>
            <span />
          </button>
        </div>
        <button className="button button-dark" type="submit">Save settings <Check size={16} /></button>
      </SectionCard>
    </form>
  );
}
