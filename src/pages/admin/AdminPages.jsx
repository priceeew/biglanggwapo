import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, CalendarDays, Check, Download, FileText, Image as ImageIcon, Layers,
  Package, Pencil, Plus, RefreshCcw, Scissors, ShoppingBag, Star, Tag,
  Trash2, TrendingUp, Upload, Users, X, Eye, EyeOff
} from 'lucide-react';
import { useStore, currency, humanDate, stars } from '../../context/StoreContext';
import { demoApi, syncAccountsIntoDemoState, deduplicateTransactions, cleanCustomerName } from '../../mockService';
import { saveAccount, deleteAccount, validatePassword, validatePhone, revokeSession, syncAccountsFromAtlas } from '../../data';
import {
  sendInviteNotification, saveBarberToAtlas, deleteBarberFromAtlas, clearAllBarbersFromAtlas,
  saveServiceToAtlas, deleteServiceFromAtlas, clearAllServicesFromAtlas, uploadImageFile,
  saveInventoryToAtlas, deleteInventoryFromAtlas, saveDiscountToAtlas, deleteDiscountFromAtlas,
  deleteReviewFromAtlas, deleteTransactionFromAtlas, saveSettingsToAtlas
} from '../../services/api';
import { STANDARD_SCHEDULES, validateShiftWithinShopHours, findShiftConflicts, parseSchedule } from '../../utils/scheduling';
import {
  BentoStats, SectionCard, Toolbar, DataTable, StatusBadge, EmptyState, MiniChart
} from '../../components/common/UIComponents';
import { ReviewsManagement } from '../../components/common/ReviewsManagement';
import { ReceiptModal } from '../../components/common/ReceiptModal';

export function AdminPage({ path }) {
  if (path === '/admin') return <AdminDashboard />;
  if (path === '/admin/reports') return <ReportsPage />;
  if (path === '/admin/inventory') return <InventoryPage />;
  if (path === '/admin/promotions') return <PromotionsPage />;
  if (path === '/admin/reviews') return <AdminReviewsPage />;
  if (path === '/admin/settings') return <SettingsPage />;
  const collection = path.split('/')[2];
  return <AdminManagementPage collection={collection} />;
}

export function AdminDashboard() {
  const { demo } = useStore();
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const cleanTransactions = deduplicateTransactions(demo.transactions || []);
  const revenue = cleanTransactions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalAppointments = (demo.appointments || []).length;
  const completedAppointments = (demo.appointments || []).filter((item) => item.status === 'Completed').length;
  const activeBarbersCount = (demo.barbers || []).filter((item) => item.working).length;
  const totalCustomers = (demo.customers || []).length;

  const waitingCount = (demo.queue || []).filter((item) => item.status === 'Waiting').length;
  const inServiceCount = (demo.queue || []).filter((item) => item.status === 'In Service').length;
  const completedTodayCount = (demo.appointments || []).filter((item) => item.status === 'Completed').length;
  const totalInQueue = waitingCount + inServiceCount;

  // Real popular services ranked by actual appointment bookings
  const serviceBookingCounts = {};
  (demo.appointments || []).forEach((apt) => {
    const key = apt.serviceName || apt.serviceId;
    if (key) {
      serviceBookingCounts[key] = (serviceBookingCounts[key] || 0) + 1;
    }
  });

  const rankedServices = (demo.services || [])
    .map((service) => {
      const count = serviceBookingCounts[service.name] || serviceBookingCounts[service.id] || 0;
      const pct = totalAppointments > 0 ? Math.round((count / totalAppointments) * 100) : 0;
      return { ...service, bookingCount: count, pct };
    })
    .sort((a, b) => b.bookingCount - a.bookingCount);

  return (
    <>
      <BentoStats
        items={[
          ["Revenue this month", currency(revenue), TrendingUp, cleanTransactions.length > 0 ? `${cleanTransactions.length} transactions recorded` : 'No transactions yet'],
          ['Appointments', totalAppointments, CalendarDays, totalAppointments > 0 ? `${completedAppointments} completed` : 'No appointments yet'],
          ['Active barbers', activeBarbersCount, Scissors, (demo.barbers || []).length > 0 ? `${demo.barbers.length} on roster` : 'No barbers added yet'],
          ['Customers', totalCustomers, Users, totalCustomers > 0 ? `${totalCustomers} registered` : 'No customers yet']
        ]}
      />
      <div className="dashboard-grid two-thirds">
        <SectionCard title="Revenue trend" action={<Link to="/admin/reports" className="text-link">Full reports <ArrowRight size={14} /></Link>}>
          <MiniChart transactions={cleanTransactions} />
        </SectionCard>
        <SectionCard title="Queue overview">
          <div className="overview-ring">
            <div>
              <strong>{totalInQueue}</strong>
              <small>in queue today</small>
            </div>
          </div>
          <div className="ring-legend">
            <span><i className="dot gold-dot" /> Waiting <b>{waitingCount}</b></span>
            <span><i className="dot dark-dot" /> In service <b>{inServiceCount}</b></span>
            <span><i className="dot muted-dot" /> Completed <b>{completedTodayCount}</b></span>
          </div>
        </SectionCard>
      </div>
      <div className="dashboard-grid two-thirds">
        <SectionCard title="Recent transactions">
          <DataTable columns={['Customer', 'Service', 'Amount', 'Status', 'Receipt']}>
            <tbody>
              {cleanTransactions && cleanTransactions.length > 0 ? (
                cleanTransactions.slice(0, 4).map((item) => {
                  const displayName = cleanCustomerName(item.customerName || 'Walk-in Customer');
                  return (
                    <tr key={item.id}>
                      <td><strong>{displayName}</strong></td>
                      <td>{item.serviceName}</td>
                      <td><strong>{currency(item.amount)}</strong></td>
                      <td><StatusBadge status={item.status} /></td>
                      <td>
                        <button
                          type="button"
                          className="button button-ghost button-small"
                          style={{ padding: '2px 8px', fontSize: '11px', height: '26px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => setViewingReceipt(item)}
                          title="View & Download Receipt"
                        >
                          <FileText size={12} /> Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--muted)', fontSize: '13px' }}>
                    No transactions recorded yet. Transactions will appear here as bookings are checked out.
                  </td>
                </tr>
              )}
            </tbody>
          </DataTable>
        </SectionCard>
        <SectionCard title="Popular services">
          <div className="rank-list">
            {totalAppointments > 0 && rankedServices.some((s) => s.bookingCount > 0) ? (
              rankedServices.slice(0, 4).map((service, index) => (
                <div key={service.id}>
                  <span className="rank">0{index + 1}</span>
                  <span><strong>{service.name}</strong><small>{service.bookingCount} {service.bookingCount === 1 ? 'booking' : 'bookings'}</small></span>
                  <strong>{service.pct}%</strong>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--muted)', fontSize: '13px', padding: '24px 16px', textAlign: 'center' }}>
                No booking data yet. Popular services will be ranked here as appointments are booked.
              </div>
            )}
          </div>
        </SectionCard>
      </div>

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

const LEAVE_STATUS_OPTIONS = [
  { value: 'Active / On Duty', label: 'Active / On Duty (Available for bookings)', working: true, status: 'On shift' },
  { value: 'Sick Leave', label: 'Sick Leave (Unavailable / Rest period)', working: false, status: 'Sick Leave' },
  { value: 'Vacation Leave', label: 'Vacation Leave (Unavailable / Vacation)', working: false, status: 'Vacation Leave' },
  { value: 'Day Off', label: 'Day Off (Scheduled rest day)', working: false, status: 'Day Off' },
  { value: 'Inactive', label: 'Inactive / Deactivated', working: false, status: 'Inactive' }
];

export function AdminManagementPage({ collection }) {
  const { demo, commit, notify } = useStore();
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingBarber, setEditingBarber] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingReceptionist, setEditingReceptionist] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
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
    leaveNotes: '',
    image: ''
  });
  const [editCustomerData, setEditCustomerData] = useState({
    name: '',
    phone: '',
    preferences: '',
    notes: '',
    status: 'Active'
  });
  const [editReceptionistData, setEditReceptionistData] = useState({
    name: '',
    phone: '',
    status: 'Active',
    image: ''
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
  const [showPassword, setShowPassword] = useState(false);

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
    if (collection === 'barbers' || collection === 'services' || collection === 'customers' || collection === 'receptionists') {
      if (window.confirm(`${item.active === false || item.status === 'Inactive' ? 'Activate' : 'Deactivate'} this record?`)) {
        const field = (collection === 'customers' || collection === 'receptionists') ? 'status' : collection === 'barbers' ? 'working' : 'active';
        const willBeInactive = (collection === 'customers' || collection === 'receptionists') ? item.status !== 'Inactive' : collection === 'barbers' ? item.working : item.active;
        commit((state) => demoApi.toggleActive(state, collection, item.id, field));
        if (collection === 'services') {
          saveServiceToAtlas({ ...item, [field]: !item[field] });
        }
        if (willBeInactive && (collection === 'barbers' || collection === 'customers' || collection === 'receptionists')) {
          revokeSession({ email: item.email, id: item.id, name: item.name, reason: 'deactivated' });
          if (item.email) {
            saveAccount({ email: item.email, status: 'Inactive', active: false });
          }
        } else if (!willBeInactive && item.email) {
          saveAccount({ email: item.email, status: 'Active', active: true });
        }
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
      if (collection === 'services') {
        deleteServiceFromAtlas(item.id);
      }
      if (item.email) {
        deleteAccount(item.email);
      }
      revokeSession({ email: item.email, id: item.id, name: item.name || item.customerName, reason: 'deleted' });
      notify(`"${itemName}" has been deleted.`, 'success');
    }
  };

  const handleToggleUnavailable = async (barber) => {
    const isCurrentlyUnavailable = Boolean(barber.isUnavailable || barber.status === 'Unavailable');
    const actionText = isCurrentlyUnavailable ? 'set as available' : 'mark as unavailable';
    if (!window.confirm(`Are you sure you want to ${actionText} for barber "${barber.name}"?`)) {
      return;
    }
    const updated = {
      ...barber,
      isUnavailable: !isCurrentlyUnavailable,
      status: !isCurrentlyUnavailable ? 'Unavailable' : (barber.working ? 'Available' : 'Inactive'),
      leaveStatus: !isCurrentlyUnavailable ? 'Unavailable' : 'On shift'
    };
    commit((state) => demoApi.updateItem(state, 'barbers', barber.id, updated));
    try {
      await saveBarberToAtlas(updated);
      notify(`Barber "${barber.name}" is now marked as ${!isCurrentlyUnavailable ? 'Unavailable' : 'Available'}.`, 'success');
    } catch (err) {
      notify(`Error updating barber: ${err.message}`, 'error');
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
      category: 'Haircut',
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

  const handleSubmitEditService = async (e) => {
    e.preventDefault();
    if (!editServiceData.name.trim() || !editServiceData.price || !editServiceData.duration || !editServiceData.description.trim()) {
      return notify('Please complete all required fields.', 'error');
    }
    setIsSavingEdit(true);
    const updated = {
      ...editingService,
      name: editServiceData.name.trim(),
      category: editServiceData.category || 'Haircut',
      price: Number(editServiceData.price),
      duration: Number(editServiceData.duration),
      description: editServiceData.description.trim(),
      image: editServiceData.image || ''
    };

    try {
      const res = await saveServiceToAtlas(updated);
      if (res && res.success === false) {
        notify(`Failed to save to database: ${res.error || 'Server error'}`, 'error');
        setIsSavingEdit(false);
        return;
      }
      const saved = res?.service || updated;
      commit((state) => demoApi.updateItem(state, 'services', editingService.id, saved));
      notify(`Service "${saved.name}" updated in database!`, 'success');
      setEditingService(null);
    } catch (err) {
      notify(`Error updating service: ${err.message}`, 'error');
    } finally {
      setIsSavingEdit(false);
    }
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
      leaveNotes: barber.leaveNotes || '',
      image: barber.image || ''
    });
  };

  const handleSubmitEditBarber = async (e) => {
    e.preventDefault();
    if (!editBarberData.name.trim()) return notify('Barber name is required.', 'error');
    if (collection !== 'schedules') {
      if (!editBarberData.specialty.trim()) return notify('Specialty is required.', 'error');
      if (editBarberData.phone.trim()) {
        const phoneErr = validatePhone(editBarberData.phone);
        if (phoneErr) return notify(phoneErr, 'error');
      }
    } else {
      if (editBarberData.phone.trim()) {
        const phoneErr = validatePhone(editBarberData.phone);
        if (phoneErr) return notify(phoneErr, 'error');
      }
    }

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
      working: isWorking,
      image: editBarberData.image || ''
    };

    setIsSavingEdit(true);
    commit((state) => demoApi.updateBarber(state, editingBarber.id, updatedBarber));
    try {
      const res = await saveBarberToAtlas(updatedBarber);
      if (res?.barber) {
        commit((state) => demoApi.updateBarber(state, editingBarber.id, res.barber));
      }

      if (editingBarber.email) {
        saveAccount({
          email: editingBarber.email,
          name: updatedBarber.name,
          phone: updatedBarber.phone,
          image: updatedBarber.image || '',
          photoUrl: updatedBarber.image || '',
          role: 'barber',
          barberId: editingBarber.id,
          status: computedStatus
        });
      }

      if (computedStatus === 'Inactive' || !isWorking && computedStatus === 'Inactive') {
        revokeSession({ email: editingBarber.email, id: editingBarber.id, name: updatedBarber.name, reason: 'deactivated' });
      }

      notify(`Barber "${updatedBarber.name}" profile & shift schedule updated!`, 'success');
      setEditingBarber(null);
    } catch (err) {
      console.warn('Atlas barber sync failed, stored in local state:', err);
      notify(`Barber "${updatedBarber.name}" schedule updated locally.`, 'success');
      setEditingBarber(null);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleOpenEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setEditCustomerData({
      name: customer.name || '',
      phone: customer.phone || '',
      preferences: customer.preferences || '',
      notes: customer.notes || '',
      status: customer.status || 'Active'
    });
  };

  const handleSubmitEditCustomer = async (e) => {
    e.preventDefault();
    if (!editCustomerData.name.trim()) return notify('Customer name is required.', 'error');
    if (editCustomerData.phone) {
      const phoneErr = validatePhone(editCustomerData.phone);
      if (phoneErr) return notify(phoneErr, 'error');
    }
    setIsSavingEdit(true);
    const updatedCustomer = {
      ...editingCustomer,
      name: editCustomerData.name.trim(),
      phone: editCustomerData.phone.trim(),
      preferences: editCustomerData.preferences.trim(),
      notes: editCustomerData.notes.trim(),
      status: editCustomerData.status
    };
    commit((state) => demoApi.updateItem(state, 'customers', editingCustomer.id, updatedCustomer));
    if (editingCustomer.email) {
      saveAccount({
        email: editingCustomer.email,
        name: updatedCustomer.name,
        phone: updatedCustomer.phone,
        role: 'customer',
        customerId: editingCustomer.id,
        status: updatedCustomer.status
      });
    }
    if (updatedCustomer.status === 'Inactive') {
      revokeSession({ email: editingCustomer.email, id: editingCustomer.id, name: updatedCustomer.name, reason: 'deactivated' });
    }
    setIsSavingEdit(false);
    notify(`Customer "${updatedCustomer.name}" updated successfully in database!`, 'success');
    setEditingCustomer(null);
  };

  const handleOpenEditReceptionist = (rec) => {
    setEditingReceptionist(rec);
    setEditReceptionistData({
      name: rec.name || '',
      phone: rec.phone || '',
      status: rec.status || 'Active',
      image: rec.image || ''
    });
  };

  const handleSubmitEditReceptionist = async (e) => {
    e.preventDefault();
    if (!editReceptionistData.name.trim()) return notify('Receptionist name is required.', 'error');
    if (editReceptionistData.phone) {
      const phoneErr = validatePhone(editReceptionistData.phone);
      if (phoneErr) return notify(phoneErr, 'error');
    }
    setIsSavingEdit(true);
    const updatedRec = {
      ...editingReceptionist,
      name: editReceptionistData.name.trim(),
      phone: editReceptionistData.phone.trim(),
      status: editReceptionistData.status,
      image: editReceptionistData.image || ''
    };
    commit((state) => demoApi.updateItem(state, 'receptionists', editingReceptionist.id, updatedRec));
    if (editingReceptionist.email) {
      saveAccount({
        email: editingReceptionist.email,
        name: updatedRec.name,
        phone: updatedRec.phone,
        image: updatedRec.image || '',
        role: 'receptionist',
        status: updatedRec.status
      });
    }
    if (updatedRec.status === 'Inactive') {
      revokeSession({ email: editingReceptionist.email, id: editingReceptionist.id, name: updatedRec.name, reason: 'deactivated' });
    }
    setIsSavingEdit(false);
    notify(`Receptionist "${updatedRec.name}" updated successfully in database!`, 'success');
    setEditingReceptionist(null);
  };

  const handleSubmitAdd = async (e) => {
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
        phone: formData.phone.trim(),
        image: formData.image || ''
      }));
      await saveAccount({
        email: cleanEmail,
        password: formData.password,
        role: 'receptionist',
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        image: formData.image || '',
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
      setIsAdding(false);
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
        working: true,
        image: formData.image || ''
      };
      commit((state) => demoApi.addBarber(state, newBarberObj));
      saveBarberToAtlas(newBarberObj);
      await saveAccount({
        email: cleanEmail,
        password: formData.password,
        role: 'barber',
        barberId: newBarberId,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        image: formData.image || '',
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
      setIsAdding(false);
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
      await saveAccount({
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
      setIsAdding(false);
    } else if (collection === 'services') {
      if (!formData.name.trim() || !formData.price || !formData.duration || !formData.description.trim()) {
        return notify('All fields (Name, Category, Price, Duration, Description) are required.', 'error');
      }
      const rawImage = (formData.image || '').trim();
      const newService = {
        id: `ser-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        name: formData.name.trim(),
        category: formData.category || 'Haircut',
        price: Number(formData.price),
        duration: Number(formData.duration),
        description: formData.description.trim(),
        image: rawImage || 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80',
        active: true
      };
      setIsSavingEdit(true);
      try {
        const res = await saveServiceToAtlas(newService);
        if (res && res.success === false) {
          notify(`Failed to save to database: ${res.error || 'Server error'}`, 'error');
          setIsSavingEdit(false);
          return;
        }
        const savedService = res?.service || newService;
        commit((state) => ({ ...state, services: [savedService, ...state.services.filter(s => s.id !== savedService.id)] }));
        notify(`Service "${savedService.name}" saved to database menu!`, 'success');
        setIsAdding(false);
      } catch (err) {
        notify(`Error saving service: ${err.message}`, 'error');
      } finally {
        setIsSavingEdit(false);
      }
    } else {
      notify(`Record for "${formData.name}" created.`);
      setIsAdding(false);
    }
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
              {collection === 'services' && current.data.length > 0 && (
                <button
                  className="button button-ghost button-small"
                  style={{ color: '#d9534f', borderColor: 'rgba(217, 83, 79, 0.4)' }}
                  onClick={() => {
                    if (window.confirm('Clear all services? This will remove all services from the database and menu.')) {
                      clearAllServicesFromAtlas();
                      commit((state) => ({ ...state, services: [] }));
                      notify('All services cleared.', 'success');
                    }
                  }}
                >
                  <Trash2 size={13} /> Clear all services
                </button>
              )}
              <button
                className="button button-ghost button-small"
                title="Sync and refresh latest database records"
                onClick={async () => {
                  try {
                    const latest = await syncAccountsFromAtlas();
                    if (latest) {
                      commit((state) => syncAccountsIntoDemoState(state, latest));
                    }
                    notify('Synchronized latest accounts from database!', 'success');
                  } catch (err) {
                    notify('Sync failed: ' + err.message, 'error');
                  }
                }}
              >
                <RefreshCcw size={13} /> Refresh
              </button>
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
          collection === 'appointments' ? ['Customer', 'Service', 'Date & time', 'Barber', 'Status', ''] :
          collection === 'transactions' ? ['Receipt', 'Customer', 'Method', 'Amount', 'Date', ''] :
          collection === 'barbers' ? ['Name / record', 'Phone & Specialty', 'Permanent Schedule', 'Status / Leave', ''] :
          collection === 'schedules' ? ['Barber / Staff', 'Permanent Schedule', 'Break & Rest Day', 'Duty Status', 'Actions'] :
          ['Name / record', 'Details', 'Status', 'Last updated', '']
        }>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                <td>
                  {collection === 'transactions' ? (
                    <div>
                      <button
                        type="button"
                        onClick={() => setViewingReceipt(item)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                        title="Click to view & download official receipt"
                      >
                        <strong style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--gold)' }}>
                          {item.receipt || item.id}
                        </strong>
                      </button>
                      <small style={{ color: 'var(--muted)', display: 'block', fontSize: '10px' }}>{item.serviceName || item.type || 'Service'}</small>
                    </div>
                  ) : (
                    <div className="table-person">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name || 'Thumbnail'}
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: collection === 'services' ? '8px' : '50%',
                            objectFit: 'cover',
                            border: '1px solid var(--line)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                            flexShrink: 0,
                            background: '#f5f2eb'
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling;
                            if (fallback) fallback.style.display = 'inline-grid';
                          }}
                        />
                      ) : null}
                      <span
                        className="avatar avatar-xs"
                        style={{
                          display: item.image ? 'none' : 'inline-grid',
                          width: collection === 'services' ? '44px' : undefined,
                          height: collection === 'services' ? '44px' : undefined,
                          borderRadius: collection === 'services' ? '8px' : undefined
                        }}
                      >
                        {(item.initials || item.name || item.customerName || item.receipt || 'BG').slice(0, 2).toUpperCase()}
                      </span>
                      <span><strong>{item.name || item.customerName || item.receipt}</strong><small>{item.email || item.description || item.serviceName || item.category || item.access || ''}</small></span>
                    </div>
                  )}
                </td>
                <td>{collection === 'services' ? item.category : collection === 'appointments' ? item.serviceName : collection === 'transactions' ? (
                  <strong>{item.customerName || 'Walk-in Customer'}</strong>
                ) : collection === 'schedules' ? (
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink)' }}>{item.schedule || STANDARD_SCHEDULES[0]}</span>
                ) : collection === 'barbers' ? (
                  <div>
                    <strong>{item.phone || 'No phone'}</strong>
                    <small>{item.specialty || 'General cuts'}</small>
                  </div>
                ) : item.phone || item.specialty || item.email || '—'}</td>
                <td>{collection === 'services' ? currency(item.price) : collection === 'appointments' ? `${humanDate(item.date)} · ${item.time}` : collection === 'transactions' ? (
                  <span className="method-label">{item.method || 'Cash'}</span>
                ) : collection === 'schedules' ? (
                  <div style={{ fontSize: '11px' }}>
                    <span style={{ color: 'var(--ink)' }}>{parseSchedule(item.schedule).breakText}</span>
                    <small style={{ color: 'var(--muted)', display: 'block', fontSize: '10px' }}>
                      Rest: {parseSchedule(item.schedule).restDayNames.join(', ') || 'None'}
                    </small>
                  </div>
                ) : collection === 'barbers' ? (
                  <span style={{ fontSize: '11px', color: 'var(--ink)' }}>{item.schedule || STANDARD_SCHEDULES[0]}</span>
                ) : <StatusBadge status={item.status || (item.active || item.working ? 'Active' : 'Inactive')} />}</td>
                {collection === 'appointments' ? (
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
                              width: '32px',
                              height: '32px',
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
                          width: '32px',
                          height: '32px',
                          fontSize: '11px',
                          flexShrink: 0
                        }}
                      >
                        {(item.barberName || 'BR').slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <strong>{item.barberName}</strong>
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
                ) : collection === 'transactions' ? (
                  <td>
                    <strong>{currency(item.amount)}</strong>
                  </td>
                ) : null}
                <td>{collection === 'services' ? `${item.duration} min` : collection === 'appointments' ? <StatusBadge status={item.status} /> : collection === 'transactions' ? humanDate(item.date) : collection === 'barbers' || collection === 'schedules' ? (
                  <StatusBadge status={item.isUnavailable || item.status === 'Unavailable' ? 'Unavailable' : (item.leaveStatus || item.status || (item.working ? 'Active / On Duty' : 'Inactive'))} />
                ) : item.lastVisit || 'Today'}</td>
                <td>
                  <div className="row-actions">
                    {collection === 'transactions' ? (
                      <button
                        className="button button-ghost button-small"
                        style={{ padding: '2px 8px', fontSize: '11px', height: '26px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title="View & Download Official Receipt"
                        onClick={() => setViewingReceipt(item)}
                      >
                        <FileText size={13} /> Receipt
                      </button>
                    ) : (
                      <button
                        className="icon-button"
                        title={collection === 'schedules' ? 'Edit Barber Schedule' : 'Edit'}
                        onClick={() => {
                          if (collection === 'barbers' || collection === 'schedules') {
                            handleOpenEditBarber(item);
                          } else if (collection === 'services') {
                            handleOpenEditService(item);
                          } else if (collection === 'customers') {
                            handleOpenEditCustomer(item);
                          } else if (collection === 'receptionists') {
                            handleOpenEditReceptionist(item);
                          } else {
                            notify('Edit is not available for this record type.');
                          }
                        }}
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                    {['barbers', 'schedules'].includes(collection) && (
                      <button
                        className="button button-small"
                        style={
                          item.isUnavailable || item.status === 'Unavailable'
                            ? { background: '#ef4444', borderColor: '#dc2626', color: '#fff', fontWeight: 600 }
                            : { background: '#fff', borderColor: '#fca5a5', color: '#b91c1c', fontWeight: 600 }
                        }
                        onClick={() => handleToggleUnavailable(item)}
                        title={item.isUnavailable || item.status === 'Unavailable' ? 'Click to make this barber available' : 'Click to mark this barber unavailable'}
                      >
                        {item.isUnavailable || item.status === 'Unavailable' ? 'Set Available' : 'Unavailable'}
                      </button>
                    )}
                    {['barbers', 'services', 'customers', 'receptionists'].includes(collection) && (
                      <button className="button button-soft button-small" onClick={() => toggle(item)}>
                        {item.active === false || item.status === 'Inactive' || item.working === false ? 'Activate' : 'Deactivate'}
                      </button>
                    )}
                    {['barbers', 'receptionists', 'customers', 'services', 'transactions'].includes(collection) && (
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
        {!filtered.length && (
          <EmptyState
            title={query ? "No records match" : `No ${collection} added yet`}
            copy={query ? "Try a different search phrase." : `Click "Add new" above to add your first ${collection === 'services' ? 'service' : 'entry'}.`}
          />
        )}
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
                    <div className="password-input">
                      <input
                        className="input"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

                  {['barbers', 'receptionists'].includes(collection) && (
                    <div className="field-label">
                      <span>Profile Photo (Local Upload from Device)</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px' }}>
                        {formData.image ? (
                          <img
                            src={formData.image}
                            alt="Profile preview"
                            style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--line)' }}
                          />
                        ) : (
                          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f5f2eb', display: 'grid', placeItems: 'center', color: '#999', border: '1px solid var(--line)' }}>
                            <ImageIcon size={22} />
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label className="button button-soft button-small" style={{ margin: 0, cursor: isUploadingImage ? 'wait' : 'pointer', display: 'inline-flex', opacity: isUploadingImage ? 0.7 : 1 }}>
                            <Upload size={14} /> {isUploadingImage ? 'Uploading photo...' : 'Choose local photo'}
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                              disabled={isUploadingImage}
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
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
                                  setIsUploadingImage(true);
                                  notify('Uploading photo to cloud...');
                                  uploadImageFile(file).then((result) => {
                                    setIsUploadingImage(false);
                                    e.target.value = '';
                                    if (result.success && result.url) {
                                      setFormData({ ...formData, image: result.url });
                                      notify(result.provider === 'imgbb' ? 'Photo uploaded to ImgBB cloud URL!' : 'Photo uploaded successfully!');
                                    } else {
                                      notify(result.error || 'Failed to upload photo', 'error');
                                    }
                                  });
                                }
                              }}
                            />
                          </label>
                          <small style={{ color: 'var(--muted)', fontSize: '11px', lineHeight: 1.3 }}>
                            <strong>Notice:</strong> Only JPEG, JPG, and PNG allowed (max 10MB).
                          </small>
                        </div>
                      </div>
                    </div>
                  )}
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
                        <label className="button button-soft button-small" style={{ margin: 0, cursor: isUploadingImage ? 'wait' : 'pointer', display: 'inline-flex', opacity: isUploadingImage ? 0.7 : 1 }}>
                          <Upload size={14} /> {isUploadingImage ? 'Uploading image...' : 'Choose local photo'}
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                            disabled={isUploadingImage}
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
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
                                setIsUploadingImage(true);
                                notify('Uploading image to cloud...');
                                uploadImageFile(file).then((result) => {
                                  setIsUploadingImage(false);
                                  e.target.value = '';
                                  if (result.success && result.url) {
                                    setFormData({ ...formData, image: result.url });
                                    notify(result.provider === 'imgbb' ? 'Image uploaded to ImgBB cloud URL!' : 'Image optimized and uploaded successfully!');
                                  } else {
                                    notify(result.error || 'Failed to upload image', 'error');
                                  }
                                });
                              }
                            }}
                          />
                        </label>
                        <small style={{ color: 'var(--muted)', fontSize: '11px', lineHeight: 1.3 }}>
                          <strong>Notice:</strong> Only JPEG, JPG, and PNG allowed (max 10MB).
                        </small>
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
                <button type="button" className="button button-ghost button-full" onClick={() => setIsAdding(false)} disabled={isSavingEdit}>
                  Cancel
                </button>
                <button type="submit" className="button button-dark button-full" disabled={isSavingEdit}>
                  {isSavingEdit ? 'Saving...' : (collection === 'services' ? 'Save Service' : 'Create record')} <ArrowRight size={16} />
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
              <span className="eyebrow gold">{collection === 'schedules' ? 'EDIT BARBER SCHEDULE & SHIFT' : 'EDIT BARBER PROFILE'}</span>
              <h2>{collection === 'schedules' ? `Edit Schedule – ${editingBarber.name}` : `Edit ${editingBarber.name}`}</h2>
              <p>{collection === 'schedules' ? 'Update permanent work schedule, daily shift hours, breaks, rest day, or duty/leave status.' : 'Update permanent work schedule, contact details, or set sick / vacation leave status.'}</p>
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

              {/* LOCAL BARBER PHOTO UPLOAD / PREVIEW */}
              <div className="field-label">
                <span>Profile Photo (Local Upload from Device)</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px' }}>
                  {editBarberData.image ? (
                    <img
                      src={editBarberData.image}
                      alt="Barber preview"
                      style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--line)' }}
                    />
                  ) : (
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f5f2eb', display: 'grid', placeItems: 'center', color: '#999', border: '1px solid var(--line)' }}>
                      <ImageIcon size={22} />
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="button button-soft button-small" style={{ margin: 0, cursor: isUploadingImage ? 'wait' : 'pointer', display: 'inline-flex', opacity: isUploadingImage ? 0.7 : 1 }}>
                      <Upload size={14} /> {isUploadingImage ? 'Uploading photo...' : 'Choose local photo'}
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                        disabled={isUploadingImage}
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
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
                            setIsUploadingImage(true);
                            notify('Uploading photo to cloud...');
                            uploadImageFile(file).then((result) => {
                              setIsUploadingImage(false);
                              e.target.value = '';
                              if (result.success && result.url) {
                                setEditBarberData({ ...editBarberData, image: result.url });
                                notify(result.provider === 'imgbb' ? 'Photo uploaded to ImgBB cloud URL!' : 'Photo uploaded successfully!');
                              } else {
                                notify(result.error || 'Failed to upload photo', 'error');
                              }
                            });
                          }
                        }}
                      />
                    </label>
                    <small style={{ color: 'var(--muted)', fontSize: '11px', lineHeight: 1.3 }}>
                      <strong>Notice:</strong> Only JPEG, JPG, and PNG allowed (max 10MB).
                    </small>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="button button-ghost button-full" onClick={() => setEditingBarber(null)} disabled={isSavingEdit}>
                  Cancel
                </button>
                <button type="submit" className="button button-dark button-full" disabled={isSavingEdit}>
                  {isSavingEdit ? 'Saving changes...' : 'Save changes'}
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
                    <label className="button button-soft button-small" style={{ margin: 0, cursor: isUploadingImage ? 'wait' : 'pointer', display: 'inline-flex', opacity: isUploadingImage ? 0.7 : 1 }}>
                      <Upload size={14} /> {isUploadingImage ? 'Uploading image...' : 'Choose local photo'}
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                        disabled={isUploadingImage}
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
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
                            setIsUploadingImage(true);
                            notify('Uploading image to cloud...');
                            uploadImageFile(file).then((result) => {
                              setIsUploadingImage(false);
                              e.target.value = '';
                              if (result.success && result.url) {
                                setEditServiceData({ ...editServiceData, image: result.url });
                                notify(result.provider === 'imgbb' ? 'Image uploaded to ImgBB cloud URL!' : 'Image optimized and uploaded successfully!');
                              } else {
                                notify(result.error || 'Failed to upload image', 'error');
                              }
                            });
                          }
                        }}
                      />
                    </label>
                    <small style={{ color: 'var(--muted)', fontSize: '11px', lineHeight: 1.3 }}>
                      <strong>Notice:</strong> Only JPEG, JPG, and PNG allowed (max 10MB).
                    </small>
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
                <button type="button" className="button button-ghost button-full" onClick={() => setEditingService(null)} disabled={isSavingEdit}>
                  Cancel
                </button>
                <button type="submit" className="button button-dark button-full" disabled={isSavingEdit}>
                  {isSavingEdit ? 'Saving changes...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER MODAL */}
      {editingCustomer && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setEditingCustomer(null)}>
          <div className="modal-card">
            <button className="modal-close" onClick={() => setEditingCustomer(null)} aria-label="Close dialog">
              <X size={18} />
            </button>
            <div className="modal-heading">
              <span className="eyebrow gold">EDIT CUSTOMER</span>
              <h2>Edit {editingCustomer.name}</h2>
              <p>Update customer details, phone number, styling preferences, or account status.</p>
            </div>

            <form className="form-stack" onSubmit={handleSubmitEditCustomer}>
              <label className="field-label">Full name
                <input
                  className="input"
                  required
                  value={editCustomerData.name}
                  onChange={(e) => setEditCustomerData({ ...editCustomerData, name: e.target.value })}
                  placeholder="e.g. Juan Dela Cruz"
                />
              </label>

              <label className="field-label">Phone number
                <input
                  className="input"
                  type="tel"
                  inputMode="numeric"
                  maxLength={11}
                  value={editCustomerData.phone}
                  onChange={(e) => setEditCustomerData({ ...editCustomerData, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                  placeholder="09170000000"
                />
              </label>

              <label className="field-label">Haircut & Styling preferences
                <input
                  className="input"
                  value={editCustomerData.preferences}
                  onChange={(e) => setEditCustomerData({ ...editCustomerData, preferences: e.target.value })}
                  placeholder="e.g. Low skin fade, scissors on top, matte finish"
                />
              </label>

              <label className="field-label">Internal notes
                <textarea
                  className="input textarea"
                  value={editCustomerData.notes}
                  onChange={(e) => setEditCustomerData({ ...editCustomerData, notes: e.target.value })}
                  placeholder="Customer notes, appointment habits..."
                />
              </label>

              <label className="field-label">Account status
                <select
                  className="input"
                  value={editCustomerData.status}
                  onChange={(e) => setEditCustomerData({ ...editCustomerData, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="button button-ghost button-full" onClick={() => setEditingCustomer(null)} disabled={isSavingEdit}>
                  Cancel
                </button>
                <button type="submit" className="button button-dark button-full" disabled={isSavingEdit}>
                  {isSavingEdit ? 'Saving changes...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT RECEPTIONIST MODAL */}
      {editingReceptionist && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setEditingReceptionist(null)}>
          <div className="modal-card">
            <button className="modal-close" onClick={() => setEditingReceptionist(null)} aria-label="Close dialog">
              <X size={18} />
            </button>
            <div className="modal-heading">
              <span className="eyebrow gold">EDIT RECEPTIONIST</span>
              <h2>Edit {editingReceptionist.name}</h2>
              <p>Update front-desk staff details, contact information, or status.</p>
            </div>

            <form className="form-stack" onSubmit={handleSubmitEditReceptionist}>
              <label className="field-label">Full name
                <input
                  className="input"
                  required
                  value={editReceptionistData.name}
                  onChange={(e) => setEditReceptionistData({ ...editReceptionistData, name: e.target.value })}
                  placeholder="e.g. Bea Dizon"
                />
              </label>

              <label className="field-label">Phone number
                <input
                  className="input"
                  type="tel"
                  inputMode="numeric"
                  maxLength={11}
                  value={editReceptionistData.phone}
                  onChange={(e) => setEditReceptionistData({ ...editReceptionistData, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                  placeholder="09170000000"
                />
              </label>

              <label className="field-label">Status
                <select
                  className="input"
                  value={editReceptionistData.status}
                  onChange={(e) => setEditReceptionistData({ ...editReceptionistData, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>

              {/* LOCAL RECEPTIONIST PHOTO UPLOAD / PREVIEW */}
              <div className="field-label">
                <span>Profile Photo (Local Upload from Device)</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px' }}>
                  {editReceptionistData.image ? (
                    <img
                      src={editReceptionistData.image}
                      alt="Receptionist preview"
                      style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--line)' }}
                    />
                  ) : (
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f5f2eb', display: 'grid', placeItems: 'center', color: '#999', border: '1px solid var(--line)' }}>
                      <ImageIcon size={22} />
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="button button-soft button-small" style={{ margin: 0, cursor: isUploadingImage ? 'wait' : 'pointer', display: 'inline-flex', opacity: isUploadingImage ? 0.7 : 1 }}>
                      <Upload size={14} /> {isUploadingImage ? 'Uploading photo...' : 'Choose local photo'}
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                        disabled={isUploadingImage}
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
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
                            setIsUploadingImage(true);
                            notify('Uploading photo to cloud...');
                            uploadImageFile(file).then((result) => {
                              setIsUploadingImage(false);
                              e.target.value = '';
                              if (result.success && result.url) {
                                setEditReceptionistData({ ...editReceptionistData, image: result.url });
                                notify(result.provider === 'imgbb' ? 'Photo uploaded to ImgBB cloud URL!' : 'Photo uploaded successfully!');
                              } else {
                                notify(result.error || 'Failed to upload photo', 'error');
                              }
                            });
                          }
                        }}
                      />
                    </label>
                    <small style={{ color: 'var(--muted)', fontSize: '11px', lineHeight: 1.3 }}>
                      <strong>Notice:</strong> Only JPEG, JPG, and PNG allowed (max 10MB).
                    </small>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="button button-ghost button-full" onClick={() => setEditingReceptionist(null)} disabled={isSavingEdit}>
                  Cancel
                </button>
                <button type="submit" className="button button-dark button-full" disabled={isSavingEdit}>
                  {isSavingEdit ? 'Saving changes...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
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

export function ReportsPage() {
  const { demo, notify } = useStore();

  const totalTxnAmount = (demo.transactions || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalTxnCount = (demo.transactions || []).length;

  const cashAmount = (demo.transactions || []).filter((t) => (t.method || '').toLowerCase() === 'cash').reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const gcashAmount = (demo.transactions || []).filter((t) => (t.method || '').toLowerCase() === 'gcash').reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const cardAmount = (demo.transactions || []).filter((t) => (t.method || '').toLowerCase().includes('card')).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const cashPct = totalTxnAmount > 0 ? Math.round((cashAmount / totalTxnAmount) * 100) : 0;
  const gcashPct = totalTxnAmount > 0 ? Math.round((gcashAmount / totalTxnAmount) * 100) : 0;
  const cardPct = totalTxnAmount > 0 ? Math.round((cardAmount / totalTxnAmount) * 100) : 0;

  const totalApts = (demo.appointments || []).length;
  const completedApts = (demo.appointments || []).filter((a) => a.status === 'Completed').length;
  const completionRate = totalApts > 0 ? Math.round((completedApts / totalApts) * 100) : 0;

  // Real popular service
  const serviceBookingCounts = {};
  (demo.appointments || []).forEach((apt) => {
    const key = apt.serviceName || apt.serviceId;
    if (key) {
      serviceBookingCounts[key] = (serviceBookingCounts[key] || 0) + 1;
    }
  });
  const sortedServices = Object.entries(serviceBookingCounts).sort((a, b) => b[1] - a[1]);
  const topService = sortedServices.length > 0 ? {
    name: sortedServices[0][0],
    count: sortedServices[0][1],
    pct: totalApts > 0 ? Math.round((sortedServices[0][1] / totalApts) * 100) : 0
  } : { name: 'None yet', count: 0, pct: 0 };

  // Real top barber
  let topBarber = { name: 'None yet', avg: '0.0', pct: 0, count: 0 };
  if (demo.barbers && demo.barbers.length > 0) {
    const barberRatings = demo.barbers.map((b) => {
      const bReviews = (demo.reviews || []).filter((r) => r.barber === b.name || r.barberId === b.id);
      const avg = bReviews.length > 0
        ? (bReviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) / bReviews.length)
        : 0;
      return {
        name: b.name,
        avg: avg > 0 ? avg.toFixed(1) : 'No reviews',
        pct: Math.min(100, Math.round((avg / 5) * 100)),
        count: bReviews.length
      };
    }).sort((a, b) => b.count - a.count || Number(b.pct) - Number(a.pct));

    if (barberRatings.length > 0 && barberRatings[0].count > 0) {
      topBarber = barberRatings[0];
    }
  }

  // Functional CSV Export
  const handleExportCSV = () => {
    const headers = ['Receipt', 'Customer', 'Service', 'Amount', 'Payment Method', 'Date', 'Status'];
    const rows = (demo.transactions && demo.transactions.length > 0)
      ? demo.transactions.map((t) => [
          `"${t.receipt || t.id}"`,
          `"${t.customerName || ''}"`,
          `"${t.serviceName || ''}"`,
          `"${t.amount || 0}"`,
          `"${t.method || ''}"`,
          `"${t.date || ''}"`,
          `"${t.status || ''}"`
        ])
      : [
          ['"SHOP REPORT"', `"${new Date().toLocaleDateString()}"`, `""`, `""`, `""`, `""`, `""`],
          ['"Total Revenue"', `"${currency(totalTxnAmount)}"`, `""`, `""`, `""`, `""`, `""`],
          ['"Total Appointments"', `"${totalApts}"`, `""`, `""`, `""`, `""`, `""`],
          ['"Completion Rate"', `"${completionRate}%"`, `""`, `""`, `""`, `""`, `""`],
          ['"Registered Barbers"', `"${(demo.barbers || []).length}"`, `""`, `""`, `""`, `""`, `""`],
          ['"Registered Services"', `"${(demo.services || []).length}"`, `""`, `""`, `""`, `""`, `""`]
        ];

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `biglanggwapo_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify('Report CSV successfully generated and downloaded!', 'success');
  };

  return (
    <>
      <Toolbar
        title="Reports & analytics"
        description="A practical read on revenue, bookings, and the team."
        action={
          <button className="button button-dark button-small" onClick={handleExportCSV}>
            <Download size={15} /> Export CSV
          </button>
        }
      />
      <div className="dashboard-grid two-thirds">
        <SectionCard title="Revenue trend">
          <MiniChart tall transactions={demo.transactions} />
        </SectionCard>
        <SectionCard title="Payment method breakdown">
          <div className="donut-card">
            <div className="donut">
              <strong>{currency(totalTxnAmount)}</strong>
              <small>{totalTxnCount > 0 ? `${totalTxnCount} transactions` : 'No sales yet'}</small>
            </div>
            <div className="donut-legend">
              <span><i className="dot gold-dot" /> Cash <b>{cashPct}%</b></span>
              <span><i className="dot dark-dot" /> GCash <b>{gcashPct}%</b></span>
              <span><i className="dot muted-dot" /> Card <b>{cardPct}%</b></span>
            </div>
          </div>
        </SectionCard>
      </div>
      <div className="dashboard-grid three">
        <SectionCard title="Appointment trends">
          <div className="big-metric">{completionRate}%<small>{totalApts > 0 ? `${completedApts} of ${totalApts} completed` : 'completion rate'}</small></div>
          <div className="progress-line"><span style={{ width: `${completionRate}%` }} /></div>
        </SectionCard>
        <SectionCard title="Popular service">
          <div className="big-metric">{topService.name}<small>{topService.count > 0 ? `${topService.pct}% (${topService.count} bookings)` : 'No bookings yet'}</small></div>
          <div className="progress-line"><span style={{ width: `${topService.pct}%` }} /></div>
        </SectionCard>
        <SectionCard title="Barber performance">
          <div className="big-metric">{topBarber.name}<small>{topBarber.name !== 'None yet' ? `${topBarber.avg} average rating` : 'No performance data'}</small></div>
          <div className="progress-line"><span style={{ width: `${topBarber.pct}%` }} /></div>
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
    saveInventoryToAtlas(newItem);
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

    const updatedStock = targetItem.stock + qty;
    commit((state) => demoApi.updateItem(state, 'inventory', targetItem.id, { stock: updatedStock }));
    saveInventoryToAtlas({ ...targetItem, stock: updatedStock });
    notify(`Stock updated: +${qty} ${targetItem.unit} added to ${targetItem.name}.`);
    setIsStockingIn(false);
  };

  const submitEdit = (e) => {
    e.preventDefault();
    if (!editingItem) return;
    const updatedFields = {
      name: editingItem.name,
      category: editingItem.category,
      cost: Number(editingItem.cost),
      stock: Number(editingItem.stock),
      unit: editingItem.unit,
      threshold: Number(editingItem.threshold),
      notes: editingItem.notes
    };
    commit((state) => demoApi.updateItem(state, 'inventory', editingItem.id, updatedFields));
    saveInventoryToAtlas({ ...editingItem, ...updatedFields });
    notify(`Updated "${editingItem.name}".`);
    setEditingItem(null);
  };

  const deleteItem = (item) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}" from inventory?`)) {
      commit((state) => demoApi.deleteItem(state, 'inventory', item.id));
      deleteInventoryFromAtlas(item.id);
      notify(`Deleted "${item.name}" from inventory.`);
    }
  };

  const quickStockIn = (item, amount = 5) => {
    const nextStock = item.stock + amount;
    commit((state) => demoApi.updateItem(state, 'inventory', item.id, { stock: nextStock }));
    saveInventoryToAtlas({ ...item, stock: nextStock });
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
                Add item to inventory
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
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({
    code: '',
    title: '',
    description: '',
    type: 'Percentage',
    value: 15,
    validFrom: new Date().toISOString().slice(0, 10),
    validTo: '2026-12-31',
    active: true
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.code || !form.title) {
      return notify('Please enter a promo code and title.', 'error');
    }
    const newPromo = {
      id: 'promo-' + Date.now().toString(36),
      code: form.code.trim().toUpperCase(),
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      value: Number(form.value) || 10,
      validFrom: form.validFrom,
      validTo: form.validTo,
      active: true
    };

    commit((state) => ({
      ...state,
      promotions: [newPromo, ...(state.promotions || [])]
    }));

    const res = await saveDiscountToAtlas(newPromo);
    if (res?.success) {
      notify(`Promotion "${newPromo.code}" saved to database!`);
    } else {
      notify(`Saved locally (Database sync: ${res?.error || 'queued'})`, 'warning');
    }

    setIsAdding(false);
    setForm({
      code: '',
      title: '',
      description: '',
      type: 'Percentage',
      value: 15,
      validFrom: new Date().toISOString().slice(0, 10),
      validTo: '2026-12-31',
      active: true
    });
  };

  const handleToggle = async (promo) => {
    const updated = { ...promo, active: !promo.active };
    commit((state) => ({
      ...state,
      promotions: (state.promotions || []).map((p) => p.id === promo.id ? updated : p)
    }));
    await saveDiscountToAtlas(updated);
    notify(`Promotion "${promo.title}" is now ${updated.active ? 'active' : 'inactive'}.`);
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Delete promotion "${title}" from the database?`)) {
      commit((state) => ({
        ...state,
        promotions: (state.promotions || []).filter((p) => p.id !== id)
      }));
      await deleteDiscountFromAtlas(id);
      notify(`Promotion deleted from database.`);
    }
  };

  return (
    <>
      <Toolbar
        title="Promotions & discounts"
        description="Active offers saved in MongoDB Atlas are automatically featured and redeemable during booking."
        action={
          <button className="button button-dark button-small" onClick={() => setIsAdding(true)}>
            <Plus size={15} /> Create promotion
          </button>
        }
      />
      <div className="promo-admin-grid">
        {(demo.promotions || []).map((promo) => (
          <div className={`promo-admin-card ${promo.active ? 'active' : ''}`} key={promo.id}>
            <div className="promo-admin-top">
              <span className="promo-symbol"><Tag size={18} /></span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <StatusBadge status={promo.active ? 'Active' : 'Inactive'} />
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#d92d20', cursor: 'pointer', padding: '4px' }}
                  onClick={() => handleDelete(promo.id, promo.title)}
                  title="Delete promotion"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <span className="eyebrow gold">CODE: <strong>{promo.code || promo.title}</strong></span>
            <h2>{promo.title}</h2>
            <p>{promo.description || 'Applies discount to total haircut service bill.'}</p>
            <div className="promo-admin-meta">
              <span><small>Value</small><strong>{promo.type === 'Percentage' ? `${promo.value}% OFF` : `${currency(promo.value)} OFF`}</strong></span>
              <span><small>Validity</small><strong>{promo.validFrom} → {promo.validTo}</strong></span>
            </div>
            <button
              className="button button-ghost button-small"
              onClick={() => handleToggle(promo)}
            >
              {promo.active ? 'Deactivate' : 'Activate'} <ArrowRight size={14} />
            </button>
          </div>
        ))}
        {(!demo.promotions || demo.promotions.length === 0) && (
          <div style={{ gridColumn: '1 / -1' }}>
            <EmptyState
              icon={Tag}
              title="No discounts or promotions found"
              copy="Click 'Create promotion' to add promotional offers to your MongoDB Atlas database."
              action={
                <button className="button button-dark" onClick={() => setIsAdding(true)}>
                  <Plus size={15} /> Add first promo
                </button>
              }
            />
          </div>
        )}
      </div>

      {isAdding && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setIsAdding(false)}>
          <div className="modal-card">
            <button className="modal-close" onClick={() => setIsAdding(false)} aria-label="Close dialog">
              <X size={18} />
            </button>
            <div className="modal-heading">
              <div className="modal-mark"><Tag size={20} /></div>
              <span className="eyebrow gold">Atlas Promotion Record</span>
              <h2>Create New Discount</h2>
              <p>Add a functional promo code that customers can apply during booking.</p>
            </div>
            <form className="form-stack" onSubmit={handleCreate}>
              <div className="form-grid">
                <label className="field-label">Promo code (uppercase)
                  <input
                    className="input"
                    required
                    style={{ textTransform: 'uppercase' }}
                    placeholder="e.g. SUMMER20"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    autoFocus
                  />
                </label>
                <label className="field-label">Discount type
                  <select
                    className="input"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Fixed">Fixed Amount (₱)</option>
                  </select>
                </label>
              </div>

              <div className="form-grid">
                <label className="field-label">Discount title
                  <input
                    className="input"
                    required
                    placeholder="e.g. Summer Fade Special"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </label>
                <label className="field-label">{form.type === 'Percentage' ? 'Discount Value (%)' : 'Discount Value (₱)'}
                  <input
                    className="input"
                    type="number"
                    min="1"
                    max={form.type === 'Percentage' ? '100' : '10000'}
                    required
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                  />
                </label>
              </div>

              <label className="field-label">Description (optional)
                <input
                  className="input"
                  placeholder="e.g. Enjoy 20% off all haircuts this season."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </label>

              <div className="form-grid">
                <label className="field-label">Valid From
                  <input
                    className="input"
                    type="date"
                    required
                    value={form.validFrom}
                    onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                  />
                </label>
                <label className="field-label">Valid Until
                  <input
                    className="input"
                    type="date"
                    required
                    value={form.validTo}
                    onChange={(e) => setForm({ ...form, validTo: e.target.value })}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="button button-ghost button-full" onClick={() => setIsAdding(false)}>
                  Cancel
                </button>
                <button type="submit" className="button button-dark button-full">
                  Save to Database <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function AdminReviewsPage() {
  return <ReviewsManagement role="admin" />;
}

export function SettingsPage() {
  const { demo, commit, notify } = useStore();
  const [form, setForm] = useState(() => {
    const raw = demo?.settings || {};
    const rawMethods = Array.isArray(raw.paymentMethods) ? raw.paymentMethods : ['Cash', 'GCash', 'Card only'];
    const cleanMethods = rawMethods.map((m) => m === 'Card (demo)' ? 'Card only' : m);
    return {
      shopName: raw.shopName || 'Biglang Gwapo Barber Shop',
      phone: raw.phone || '+63 917 555 0100',
      email: raw.email || 'hello@biglanggwapo.demo',
      address: raw.address || '180 Cutcot National Highway, Pulilan, Bulacan',
      hours: raw.hours || 'Mon–Sun · 9:00 AM–8:00 PM',
      slotInterval: Number(raw.slotInterval) || 15,
      cancellationPolicy: raw.cancellationPolicy || 'Please cancel at least 2 hours before your appointment.',
      paymentMethods: cleanMethods,
      commissionTracking: !!raw.commissionTracking
    };
  });
  const [isSaving, setIsSaving] = useState(false);
  const [customMethodInput, setCustomMethodInput] = useState('');

  useEffect(() => {
    if (demo?.settings) {
      setForm((prev) => {
        const raw = demo.settings;
        const rawMethods = Array.isArray(raw.paymentMethods) ? raw.paymentMethods : prev.paymentMethods;
        const cleanMethods = rawMethods.map((m) => m === 'Card (demo)' ? 'Card only' : m);
        return {
          ...prev,
          ...raw,
          paymentMethods: cleanMethods
        };
      });
    }
  }, [demo?.settings]);

  const toggleMethod = (methodName) => {
    const currentMethods = form.paymentMethods || [];
    if (currentMethods.includes(methodName)) {
      if (currentMethods.length === 1) {
        return notify('At least one payment method must remain active.', 'error');
      }
      setForm({ ...form, paymentMethods: currentMethods.filter((m) => m !== methodName) });
    } else {
      setForm({ ...form, paymentMethods: [...currentMethods, methodName] });
    }
  };

  const addCustomMethod = (e) => {
    e.preventDefault();
    const trimmed = customMethodInput.trim();
    if (!trimmed) return;
    if ((form.paymentMethods || []).includes(trimmed)) {
      return notify(`"${trimmed}" is already added.`, 'error');
    }
    setForm({ ...form, paymentMethods: [...(form.paymentMethods || []), trimmed] });
    setCustomMethodInput('');
    notify(`Added "${trimmed}" to payment methods.`);
  };

  const save = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      commit((state) => demoApi.saveSettings(state, form));
      const res = await saveSettingsToAtlas(form);
      setIsSaving(false);
      if (res && res.success) {
        notify('System settings saved and synchronized to database!', 'success');
      } else {
        notify('System settings saved to session.', 'success');
      }
    } catch (err) {
      setIsSaving(false);
      notify('Failed to save settings: ' + err.message, 'error');
    }
  };

  const standardMethods = ['Cash', 'GCash', 'Card only'];

  return (
    <form className="settings-layout" onSubmit={save}>
      <SectionCard title="Shop details" description="The public site and customer receipts use these settings for contact and operating hours.">
        <div className="form-grid">
          <label className="field-label">Shop name
            <input className="input" value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} required />
          </label>
          <label className="field-label">Phone
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          </label>
          <label className="field-label">Email
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </label>
          <label className="field-label">Opening hours
            <input className="input" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} placeholder="e.g. Mon–Sun · 9:00 AM–8:00 PM" required />
          </label>
        </div>
        <label className="field-label">Address
          <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
        </label>
      </SectionCard>

      <SectionCard title="Booking & checkout" description="Configure online appointment slot intervals and supported checkout payment methods.">
        <div className="form-grid">
          <label className="field-label">Slot interval
            <select className="input" value={form.slotInterval} onChange={(e) => setForm({ ...form, slotInterval: Number(e.target.value) })}>
              <option value="15">15 minutes (Standard)</option>
              <option value="30">30 minutes</option>
            </select>
          </label>
          <div className="field-label">
            <span>Accepted Payment Methods</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
              {standardMethods.map((m) => {
                const isActive = (form.paymentMethods || []).includes(m);
                return (
                  <button
                    type="button"
                    key={m}
                    className={`button button-small ${isActive ? 'button-dark' : 'button-ghost'}`}
                    style={isActive ? { background: 'var(--ink)', color: 'var(--white)' } : {}}
                    onClick={() => toggleMethod(m)}
                  >
                    {isActive ? <Check size={13} /> : null} {m}
                  </button>
                );
              })}
              {(form.paymentMethods || [])
                .filter((m) => !standardMethods.includes(m))
                .map((m) => (
                  <span
                    key={m}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'var(--paper)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: 600
                    }}
                  >
                    {m}
                    <button
                      type="button"
                      style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', color: 'var(--muted)' }}
                      onClick={() => toggleMethod(m)}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
              <input
                className="input"
                style={{ height: '32px', padding: '4px 8px', fontSize: '11px' }}
                placeholder="Add other payment method..."
                value={customMethodInput}
                onChange={(e) => setCustomMethodInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomMethod(e))}
              />
              <button type="button" className="button button-ghost button-small" onClick={addCustomMethod}>
                Add
              </button>
            </div>
          </div>
        </div>

        <label className="field-label">Cancellation policy
          <textarea className="input textarea" value={form.cancellationPolicy} onChange={(e) => setForm({ ...form, cancellationPolicy: e.target.value })} />
        </label>

        <div className="setting-row">
          <div>
            <strong>Barber Commission Tracking</strong>
            <small>Enable performance commission calculations across barber dashboards.</small>
          </div>
          <button type="button" className={`toggle ${form.commissionTracking ? 'active' : ''}`} onClick={() => setForm({ ...form, commissionTracking: !form.commissionTracking })}>
            <span />
          </button>
        </div>

        <div style={{ marginTop: '14px' }}>
          <button className="button button-dark" type="submit" disabled={isSaving}>
            {isSaving ? 'Saving to Database...' : 'Save Settings'} <Check size={16} />
          </button>
        </div>
      </SectionCard>
    </form>
  );
}
