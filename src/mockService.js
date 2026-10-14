import { appointments as seedAppointments, barbers, customers, inventory, promotions, queue as seedQueue, receptionists, reviews, services, settings, transactions } from './data';
import { getSlotAvailability, STANDARD_SCHEDULES } from './utils/scheduling';

const STORAGE_KEY = 'biglanggwapo-demo-v3';
const clone = (value) => JSON.parse(JSON.stringify(value));

export function getInitialDemoState() {
  return clone({ services, barbers, customers, receptionists, promotions, reviews, appointments: seedAppointments, queue: seedQueue, transactions, inventory, settings });
}

export function loadDemoState() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return getInitialDemoState();
    const parsed = JSON.parse(stored);
    const initial = getInitialDemoState();

    let currentInventory = parsed.inventory || initial.inventory;
    const hasRichCategories = currentInventory.some((item) => {
      const c = (item.category || '').toLowerCase();
      return c.includes('tool') || c.includes('furnitur') || c.includes('accessor') || c.includes('sale');
    });

    if (!hasRichCategories) {
      const existingNames = new Set(currentInventory.map((i) => i.name.toLowerCase()));
      const additional = initial.inventory.filter((i) => !existingNames.has(i.name.toLowerCase()));
      currentInventory = [...currentInventory, ...additional];
    }

    let currentReviews = parsed.reviews || initial.reviews;
    if (currentReviews.length < initial.reviews.length) {
      const existingIds = new Set(currentReviews.map((r) => r.id));
      const newReviews = initial.reviews.filter((r) => !existingIds.has(r.id));
      currentReviews = [...currentReviews, ...newReviews];
    }

    let currentReceptionists = parsed.receptionists || initial.receptionists;

    return { ...initial, ...parsed, inventory: currentInventory, reviews: currentReviews, receptionists: currentReceptionists };
  } catch {
    return getInitialDemoState();
  }
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
      const alreadyBooked = state.appointments.some((item) => item.barberId === payload.barberId && item.date === payload.date && item.time === payload.time && !['Cancelled', 'No-show'].includes(item.status));
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
    const assigned = state.queue.filter((item) => item.status !== 'Completed' && item.status !== 'Removed').length + 1;
    const entry = { id: id('queue'), number: `Q-${String(assigned + 14).padStart(3, '0')}`, customerId: appointment.customerId, customerName: appointment.customerName, barberId: appointment.barberId, barberName: appointment.barberName, serviceName: appointment.serviceName, status: 'Waiting', joinedAt: 'Just now', estimatedMinutes: 20, appointmentId, };
    return { ...state, appointments: state.appointments.map((item) => item.id === appointmentId ? { ...item, status: 'Arrived' } : item), queue: [entry, ...state.queue] };
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
      const conflict = state.appointments.some((item) => item.id !== appointmentId && item.barberId === existingApt.barberId && item.date === date && item.time === time && !['Cancelled', 'No-show'].includes(item.status));
      if (conflict) throw new Error('That barber is already booked for this time.');
    }
    return { ...state, appointments: state.appointments.map((item) => item.id === appointmentId ? { ...item, date, time, status: 'Pending' } : item) };
  },
  addWalkIn(state, payload) {
    const customerId = payload.customerId || id('cust');
    const customer = payload.customerId ? state.customers.find((item) => item.id === payload.customerId) : { id: customerId, name: payload.customerName, initials: payload.customerName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(), email: payload.email || 'walkin@example.com', phone: payload.phone || 'Not provided', status: 'Active', visits: 0, lastVisit: 'Today', preferences: '', notes: '' };
    const service = state.services.find((item) => item.id === payload.serviceId);
    const barber = state.barbers.find((item) => item.id === payload.barberId);
    const appointmentId = id('apt');
    const appointment = { id: appointmentId, customerId, customerName: customer.name, serviceId: service.id, serviceName: service.name, barberId: barber.id, barberName: barber.name, date: new Date().toISOString().slice(0, 10), time: 'Walk-in', duration: service.duration, price: service.price, status: 'Arrived', paymentStatus: 'Unpaid', source: 'Walk-in', notes: '' };
    const queueEntry = { id: id('queue'), number: `Q-${String(state.queue.length + 15).padStart(3, '0')}`, customerId, customerName: customer.name, barberId: barber.id, barberName: barber.name, serviceName: service.name, status: 'Waiting', joinedAt: 'Just now', estimatedMinutes: 25, appointmentId };
    return { ...state, customers: payload.customerId ? state.customers : [customer, ...state.customers], appointments: [appointment, ...state.appointments], queue: [queueEntry, ...state.queue] };
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
    const newRec = {
      id: id('rec'),
      name: payload.name,
      email: payload.email,
      phone: payload.phone || '',
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
