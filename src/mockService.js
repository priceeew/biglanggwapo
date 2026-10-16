import { appointments as seedAppointments, barbers, customers, inventory, promotions, queue as seedQueue, receptionists, reviews, services, settings, transactions } from './data';
import { getSlotAvailability, STANDARD_SCHEDULES } from './utils/scheduling';

const STORAGE_KEY = 'biglanggwapo-demo-v12';
const clone = (value) => JSON.parse(JSON.stringify(value));

export function getInitialDemoState() {
  return clone({
    services,
    barbers,
    customers: [],
    receptionists,
    promotions,
    reviews: [],
    appointments: [],
    queue: [],
    transactions: [],
    inventory,
    settings
  });
}

export function loadDemoState() {
  try {
    let stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Clear legacy localStorage keys that held old mock records
      ['biglanggwapo-demo-v11', 'biglanggwapo-demo-v10', 'biglanggwapo-demo-v9', 'biglanggwapo-demo-v8', 'biglanggwapo-demo-v7', 'biglanggwapo-demo-v6', 'biglanggwapo-demo-v5', 'biglanggwapo-demo-v4', 'biglanggwapo-accounts-v2'].forEach((k) => {
        try { window.localStorage.removeItem(k); } catch {}
      });
      const fresh = getInitialDemoState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    const parsed = JSON.parse(stored);
    const initial = getInitialDemoState();

    let currentInventory = parsed.inventory || initial.inventory;
    let currentReviews = Array.isArray(parsed.reviews) ? parsed.reviews : [];
    let currentReceptionists = Array.isArray(parsed.receptionists) ? parsed.receptionists : [];
    let currentBarbers = Array.isArray(parsed.barbers) ? parsed.barbers : [];
    let currentCustomers = Array.isArray(parsed.customers) ? parsed.customers : [];
    let currentAppointments = Array.isArray(parsed.appointments) ? parsed.appointments : [];
    let currentQueue = Array.isArray(parsed.queue) ? parsed.queue : [];
    let currentTransactions = Array.isArray(parsed.transactions) ? parsed.transactions : [];
    let currentServices = Array.isArray(parsed.services) ? parsed.services : [];

    const baseState = {
      ...initial,
      ...parsed,
      services: currentServices,
      inventory: currentInventory,
      reviews: currentReviews,
      receptionists: currentReceptionists,
      barbers: currentBarbers,
      customers: currentCustomers,
      appointments: currentAppointments,
      queue: currentQueue,
      transactions: currentTransactions
    };

    try {
      const storedAcc = typeof window !== 'undefined' ? window.localStorage.getItem('biglanggwapo-accounts-v2') : null;
      if (storedAcc) {
        return syncAccountsIntoDemoState(baseState, JSON.parse(storedAcc));
      }
    } catch {}

    return baseState;
  } catch {
    return getInitialDemoState();
  }
}

export function syncAccountsIntoDemoState(state, accountsMap) {
  if (!state) return state;
  const accountsList = Object.values(accountsMap || {}).filter(Boolean);

  // 1. Receptionists (from accounts with role: 'receptionist')
  const recAccounts = accountsList.filter((a) => a.role === 'receptionist');
  const existingRecs = Array.isArray(state.receptionists) ? [...state.receptionists] : [];
  const updatedRecs = recAccounts.map((acc) => {
    const cleanEmail = (acc.email || '').toLowerCase().trim();
    const existing = existingRecs.find(
      (r) => (r.email && r.email.toLowerCase().trim() === cleanEmail) || r.id === acc._id || r.id === acc.id
    );
    const initials = acc.initials || (acc.name ? acc.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() : 'RC');
    return {
      id: existing?.id || acc._id || acc.id || ('rec-' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '')),
      name: acc.name || existing?.name || 'Receptionist',
      initials,
      email: cleanEmail,
      phone: acc.phone || existing?.phone || '',
      image: acc.image || acc.photoUrl || existing?.image || existing?.photoUrl || '',
      photoUrl: acc.photoUrl || acc.image || existing?.photoUrl || existing?.image || '',
      status: acc.status || existing?.status || (acc.active === false ? 'Inactive' : 'Active'),
      access: 'Receptionist',
      lastVisit: acc.createdAt ? new Date(acc.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : (existing?.lastVisit || 'Today')
    };
  });
  existingRecs.forEach((r) => {
    if (!r.email) updatedRecs.push(r);
  });

  // 2. Customers (from accounts with role: 'customer')
  const custAccounts = accountsList.filter((a) => a.role === 'customer');
  const existingCusts = Array.isArray(state.customers) ? [...state.customers] : [];
  const updatedCusts = custAccounts.map((acc) => {
    const cleanEmail = (acc.email || '').toLowerCase().trim();
    const existing = existingCusts.find(
      (c) => (c.email && c.email.toLowerCase().trim() === cleanEmail) || c.id === acc.customerId || c.id === acc._id
    );
    const initials = acc.initials || (acc.name ? acc.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() : 'CU');
    return {
      id: existing?.id || acc.customerId || acc._id || acc.id || ('cust-' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '')),
      name: acc.name || existing?.name || 'Customer',
      initials,
      email: cleanEmail,
      phone: acc.phone || existing?.phone || '',
      preferences: acc.preferences || existing?.preferences || '',
      notes: acc.notes || existing?.notes || '',
      status: acc.status || existing?.status || (acc.active === false ? 'Inactive' : 'Active'),
      image: acc.image || acc.photoUrl || existing?.image || existing?.photoUrl || '',
      photoUrl: acc.photoUrl || acc.image || existing?.photoUrl || existing?.image || '',
      lastVisit: acc.createdAt ? new Date(acc.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : (existing?.lastVisit || 'Today')
    };
  });
  existingCusts.forEach((c) => {
    if (!c.email) updatedCusts.push(c);
  });

  // 3. Barbers (from accounts with role: 'barber')
  const barberAccounts = accountsList.filter((a) => a.role === 'barber');
  const existingBarbers = Array.isArray(state.barbers) ? [...state.barbers] : [];
  const updatedBarbers = [...existingBarbers];

  barberAccounts.forEach((acc) => {
    const cleanEmail = (acc.email || '').toLowerCase().trim();
    const idx = updatedBarbers.findIndex(
      (b) => (b.email && b.email.toLowerCase().trim() === cleanEmail) || (acc.barberId && b.id === acc.barberId) || (acc.name && b.name.toLowerCase() === acc.name.toLowerCase())
    );
    const initials = acc.initials || (acc.name ? acc.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() : 'BR');
    if (idx >= 0) {
      updatedBarbers[idx] = {
        ...updatedBarbers[idx],
        name: acc.name || updatedBarbers[idx].name,
        email: cleanEmail,
        phone: acc.phone || updatedBarbers[idx].phone,
        image: acc.image || acc.photoUrl || updatedBarbers[idx].image || '',
        photoUrl: acc.photoUrl || acc.image || updatedBarbers[idx].photoUrl || updatedBarbers[idx].image || '',
        status: acc.status || updatedBarbers[idx].status,
        working: acc.status ? acc.status !== 'Inactive' : updatedBarbers[idx].working
      };
    } else {
      updatedBarbers.push({
        id: acc.barberId || acc._id || acc.id || ('bar-' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '')),
        name: acc.name || 'Barber',
        initials,
        email: cleanEmail,
        phone: acc.phone || '',
        image: acc.image || acc.photoUrl || '',
        photoUrl: acc.photoUrl || acc.image || '',
        specialty: acc.specialty || 'All-around cuts',
        rating: acc.rating || 5.0,
        schedule: acc.schedule || STANDARD_SCHEDULES[0],
        status: acc.status || 'On shift',
        leaveStatus: acc.leaveStatus || 'Active / On Duty',
        leaveNotes: acc.leaveNotes || '',
        bio: acc.bio || 'Skilled professional barber at Biglang Gwapo.',
        working: acc.status !== 'Inactive' && acc.active !== false,
        commissionEnabled: false
      });
    }
  });

  return {
    ...state,
    receptionists: updatedRecs,
    customers: updatedCusts,
    barbers: updatedBarbers
  };
}

export function persistDemoState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The UI remains usable if browser storage is unavailable.
  }
  return state;
}

export function resetDemoState() {
  const fresh = getInitialDemoState();
  persistDemoState(fresh);
  return fresh;
}

const id = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export const demoApi = {
  createBooking(state, payload) {
    const barber = state.barbers.find((b) => b.id === payload.barberId);
    if (barber) {
      const slotAvail = getSlotAvailability(
        payload.time,
        payload.duration,
        barber,
        payload.date,
        state.appointments
      );
      if (!slotAvail.available) {
        if (slotAvail.reason === 'Closed') {
          throw new Error('Same-day booking is closed after 9:00 PM. Please select tomorrow or a later date.');
        } else if (slotAvail.reason === 'Past time') {
          throw new Error('This time slot has already passed for today. Please select a future time.');
        } else if (slotAvail.reason === 'Past date') {
          throw new Error('Cannot book an appointment for a past date.');
        } else if (slotAvail.reason === 'Rest day') {
          throw new Error(`${barber.name} is on scheduled weekly rest day on this date. Please choose another date or barber.`);
        } else if (slotAvail.reason === 'Break') {
          throw new Error(`The selected slot overlaps ${barber.name}'s scheduled break. Please pick another time.`);
        } else if (slotAvail.reason === 'Exceeds shift') {
          throw new Error(`This service duration exceeds ${barber.name}'s shift end time. Please select an earlier start time.`);
        } else if (slotAvail.reason === 'Before shift') {
          throw new Error(`The selected slot is before ${barber.name}'s shift begins.`);
        } else if (slotAvail.reason === 'Booked') {
          throw new Error('That slot was just taken. Please choose another time.');
        } else {
          throw new Error(`${barber.name} is unavailable (${slotAvail.reason}). Please select another barber.`);
        }
      }
    } else {
      const alreadyBooked = state.appointments.some((item) => item.barberId === payload.barberId && item.date === payload.date && item.time === payload.time && !['Completed', 'Cancelled', 'No-show'].includes(item.status));
      if (alreadyBooked) throw new Error('That slot was just taken. Please choose another time.');
    }

    // Prevent duplicate active booking with the same barber for this customer
    const activeConflict = state.appointments.some((item) =>
      item.barberId === payload.barberId &&
      !['Completed', 'Cancelled', 'No-show'].includes(item.status) &&
      (
        (payload.customerId && item.customerId === payload.customerId) ||
        (payload.customerName && item.customerName && item.customerName.trim().toLowerCase() === payload.customerName.trim().toLowerCase()) ||
        (payload.customerEmail && item.customerEmail && item.customerEmail.trim().toLowerCase() === payload.customerEmail.trim().toLowerCase())
      )
    );
    if (activeConflict) {
      throw new Error(`You already have an active appointment with ${payload.barberName || 'this barber'}. Customers can only book one appointment at a time per barber.`);
    }

    const appointment = { id: payload.id || id('apt'), ...payload, status: 'Pending', paymentStatus: 'Unpaid', source: 'Online', notes: payload.notes || '' };
    return { ...state, appointments: [appointment, ...state.appointments] };
  },
  confirmAppointment(state, appointmentId) {
    return { ...state, appointments: state.appointments.map((item) => item.id === appointmentId ? { ...item, status: 'Confirmed' } : item) };
  },
  markArrived(state, appointmentId) {
    const appointment = state.appointments.find((item) => item.id === appointmentId);
    if (!appointment) return state;
    const exists = state.queue.some((item) => item.appointmentId === appointmentId && !['Removed', 'Completed', 'Skipped'].includes(item.status));
    if (exists) return { ...state, appointments: state.appointments.map((item) => item.id === appointmentId ? { ...item, status: 'Arrived' } : item) };
    const maxNum = (state.queue || []).reduce((max, q) => {
      const n = parseInt((q.number || '').replace(/\D/g, ''), 10);
      return !isNaN(n) && n > max ? n : max;
    }, 0);
    const nextNum = maxNum > 0 ? maxNum + 1 : 1;
    const entry = {
      id: id('queue'),
      number: `Q-${String(nextNum).padStart(3, '0')}`,
      customerId: appointment.customerId,
      customerName: appointment.customerName,
      customerEmail: appointment.customerEmail || '',
      barberId: appointment.barberId,
      barberName: appointment.barberName,
      serviceName: appointment.serviceName,
      status: 'Waiting',
      joinedAt: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      estimatedMinutes: appointment.duration || 30,
      appointmentId
    };
    return {
      ...state,
      appointments: state.appointments.map((item) => item.id === appointmentId ? { ...item, status: 'Arrived' } : item),
      queue: [entry, ...state.queue]
    };
  },
  cancelAppointment(state, appointmentId) {
    return { ...state, appointments: state.appointments.map((item) => item.id === appointmentId ? { ...item, status: 'Cancelled' } : item), queue: state.queue.filter((item) => item.appointmentId !== appointmentId) };
  },
  rescheduleAppointment(state, appointmentId, date, time) {
    const existingApt = state.appointments.find((a) => a.id === appointmentId);
    if (!existingApt) return state;
    const barber = state.barbers.find((b) => b.id === existingApt.barberId);
    if (barber) {
      const slotAvail = getSlotAvailability(
        time,
        existingApt.duration,
        barber,
        date,
        state.appointments,
        appointmentId
      );
      if (!slotAvail.available) {
        if (slotAvail.reason === 'Closed') {
          throw new Error('Same-day rescheduling is closed after 9:00 PM. Please select tomorrow or another day.');
        } else if (slotAvail.reason === 'Past time') {
          throw new Error('This time slot has already passed for today. Please select a future time.');
        } else if (slotAvail.reason === 'Past date') {
          throw new Error('Cannot reschedule to a past date.');
        } else if (slotAvail.reason === 'Rest day') {
          throw new Error(`${barber.name} is on scheduled weekly rest day on this date.`);
        } else if (slotAvail.reason === 'Break') {
          throw new Error(`That time overlaps ${barber.name}'s scheduled break.`);
        } else if (slotAvail.reason === 'Exceeds shift') {
          throw new Error(`This service exceeds ${barber.name}'s shift end time.`);
        } else {
          throw new Error(`That time slot is unavailable (${slotAvail.reason}).`);
        }
      }
    } else {
      const conflict = state.appointments.some((item) => item.id !== appointmentId && item.barberId === existingApt.barberId && item.date === date && item.time === time && !['Completed', 'Cancelled', 'No-show'].includes(item.status));
      if (conflict) throw new Error('That barber is already booked for this time.');
    }
    return { ...state, appointments: state.appointments.map((item) => item.id === appointmentId ? { ...item, date, time, status: 'Pending' } : item) };
  },
  addWalkIn(state, payload) {
    const customerId = payload.customerId || id('cust');
    const customer = payload.customerId
      ? state.customers.find((item) => item.id === payload.customerId)
      : {
          id: customerId,
          name: payload.customerName,
          initials: (payload.customerName || 'CU').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
          email: payload.email || 'walkin@example.com',
          phone: payload.phone || 'Not provided',
          status: 'Active',
          visits: 1,
          lastVisit: 'Today',
          preferences: '',
          notes: ''
        };
    const customerName = customer?.name || payload.customerName || 'Walk-in Guest';
    const service = state.services.find((item) => item.id === payload.serviceId) || state.services[0] || { id: 'ser-default', name: 'Standard Cut', duration: 30, price: 350 };
    const barber = state.barbers.find((item) => item.id === payload.barberId) || state.barbers[0] || { id: 'bar-default', name: 'On-Duty Barber' };
    const appointmentId = id('apt');
    const appointment = {
      id: appointmentId,
      customerId,
      customerName,
      serviceId: service.id,
      serviceName: service.name,
      barberId: barber.id,
      barberName: barber.name,
      barberImage: barber.image || '',
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      duration: service.duration || 30,
      price: service.price || 0,
      status: 'Arrived',
      paymentStatus: 'Unpaid',
      source: 'Walk-in',
      notes: ''
    };
    const maxNum = (state.queue || []).reduce((max, q) => {
      const n = parseInt((q.number || '').replace(/\D/g, ''), 10);
      return !isNaN(n) && n > max ? n : max;
    }, 0);
    const nextNum = maxNum > 0 ? maxNum + 1 : 1;
    const queueEntry = {
      id: id('queue'),
      number: `Q-${String(nextNum).padStart(3, '0')}`,
      customerId,
      customerName,
      customerEmail: customer?.email || payload.email || '',
      barberId: barber.id,
      barberName: barber.name,
      serviceName: service.name,
      status: 'Waiting',
      joinedAt: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      estimatedMinutes: service.duration || 30,
      appointmentId
    };
    return {
      ...state,
      customers: payload.customerId ? state.customers : [customer, ...state.customers],
      appointments: [appointment, ...state.appointments],
      queue: [queueEntry, ...state.queue]
    };
  },
  callNext(state, queueId) {
    const entry = state.queue.find((item) => item.id === queueId);
    if (!entry) return state;
    return {
      ...state,
      queue: state.queue.map((item) => item.id === queueId ? { ...item, status: 'Called', calledAt: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) } : item),
      appointments: state.appointments.map((item) => item.id === entry.appointmentId ? { ...item, status: 'Called' } : item)
    };
  },
  startService(state, queueId) {
    const entry = state.queue.find((item) => item.id === queueId);
    if (!entry) return state;
    return { ...state, queue: state.queue.map((item) => item.id === queueId ? { ...item, status: 'In Service', startedAt: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) } : item), appointments: state.appointments.map((item) => item.id === entry.appointmentId ? { ...item, status: 'In Service' } : item) };
  },
  completeService(state, queueId, notes = '') {
    const entry = state.queue.find((item) => item.id === queueId);
    if (!entry) return state;
    return { ...state, queue: state.queue.map((item) => item.id === queueId ? { ...item, status: 'Completed', completedAt: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), notes } : item), appointments: state.appointments.map((item) => item.id === entry.appointmentId ? { ...item, status: 'Completed', notes } : item) };
  },
  skipQueue(state, queueId) {
    const entry = state.queue.find((item) => item.id === queueId);
    return { ...state, queue: state.queue.map((item) => item.id === queueId ? { ...item, status: 'Skipped' } : item), appointments: state.appointments.map((item) => item.id === entry?.appointmentId ? { ...item, status: 'No-show' } : item) };
  },
  removeQueue(state, queueId) {
    const entry = state.queue.find((item) => item.id === queueId);
    return { ...state, queue: state.queue.map((item) => item.id === queueId ? { ...item, status: 'Removed' } : item), appointments: state.appointments.map((item) => item.id === entry?.appointmentId ? { ...item, status: 'Cancelled' } : item) };
  },
  recordPayment(state, appointmentId, method, cashReceived = 0) {
    const appointment = state.appointments.find((item) => item.id === appointmentId);
    if (!appointment || appointment.paymentStatus === 'Paid' || state.transactions.some((item) => item.appointmentId === appointmentId)) throw new Error('Payment has already been recorded for this service.');
    const transaction = { id: id('txn'), appointmentId, customerName: appointment.customerName, serviceName: appointment.serviceName, amount: appointment.price, method, status: 'Paid', date: new Date().toISOString().slice(0, 10), time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), receipt: `BG-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${Math.floor(Math.random() * 900 + 100)}`, cashReceived: method === 'Cash' ? Number(cashReceived) : undefined, change: method === 'Cash' ? Math.max(0, Number(cashReceived) - appointment.price) : undefined };
    return { ...state, appointments: state.appointments.map((item) => item.id === appointmentId ? { ...item, paymentStatus: 'Paid' } : item), transactions: [transaction, ...state.transactions] };
  },
  addReview(state, payload) {
    return { ...state, reviews: [{ id: id('rev'), ...payload, date: new Date().toISOString().slice(0, 10), public: true }, ...state.reviews] };
  },
  saveSettings(state, changes) { return { ...state, settings: { ...state.settings, ...changes } }; },
  toggleActive(state, collection, itemId, field = 'active') { return { ...state, [collection]: state[collection].map((item) => item.id === itemId ? { ...item, [field]: !item[field] } : item) }; },
  addItem(state, collection, item) { return { ...state, [collection]: [{ id: id(collection.slice(0, 3)), ...item }, ...state[collection]] }; },
  addReceptionist(state, payload) {
    const initials = payload.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'RC';
    const newRec = {
      id: payload.id || id('rec'),
      name: payload.name,
      initials,
      email: payload.email,
      phone: payload.phone || '',
      image: payload.image || '',
      status: 'Active',
      access: 'Receptionist'
    };
    return { ...state, receptionists: [newRec, ...(state.receptionists || [])] };
  },
  addBarber(state, payload) {
    const initials = payload.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'BR';
    const newBarber = {
      id: payload.id || id('bar'),
      name: payload.name,
      initials,
      specialty: payload.specialty || 'All-around cuts',
      rating: payload.rating || 5.0,
      schedule: payload.schedule || STANDARD_SCHEDULES[0],
      status: payload.status || 'On shift',
      leaveStatus: payload.leaveStatus || 'Active / On Duty',
      leaveNotes: payload.leaveNotes || '',
      bio: payload.bio || 'Skilled professional barber at Biglang Gwapo.',
      working: payload.working !== undefined ? payload.working : true,
      email: payload.email,
      phone: payload.phone || '',
      image: payload.image || '',
      commissionEnabled: false
    };
    return { ...state, barbers: [newBarber, ...(state.barbers || [])] };
  },
  updateBarber(state, barberId, updates) {
    return {
      ...state,
      barbers: (state.barbers || []).map((b) => (b.id === barberId ? { ...b, ...updates } : b))
    };
  },
  addCustomer(state, payload) {
    const initials = payload.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'CU';
    const newCust = {
      id: id('cust'),
      name: payload.name,
      initials,
      email: payload.email,
      phone: payload.phone || '',
      status: 'Active',
      visits: 0,
      lastVisit: 'Never',
      preferences: payload.preferences || '',
      notes: payload.notes || ''
    };
    return { ...state, customers: [newCust, ...(state.customers || [])] };
  },
  updateItem(state, collection, itemId, changes) { return { ...state, [collection]: state[collection].map((item) => item.id === itemId ? { ...item, ...changes } : item) }; },
  deleteItem(state, collection, itemId) { return { ...state, [collection]: state[collection].filter((item) => item.id !== itemId) }; }
};
