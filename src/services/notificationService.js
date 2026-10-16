// Notification service supporting real-time alerts, cancellation notices, queue turn alerts, and MongoDB Atlas database storage

import { humanDate } from '../context/StoreContext.jsx';
import { saveNotificationToAtlas, markNotificationsReadInAtlas } from './api';

const NOTIF_STORAGE_KEY = 'biglanggwapo_system_notifications_v2';
const READ_STORAGE_KEY = 'biglanggwapo_read_notifications_v2';

export function getStoredNotifications() {
  try {
    const raw = window.localStorage.getItem(NOTIF_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredNotifications(list) {
  try {
    window.localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('biglanggwapo-notifications-updated'));
  } catch {}
}

export function addSystemNotification({
  title,
  message,
  type = 'info', // 'queue-next', 'cancelled', 'confirmed', 'customer-arrived', 'in-service', 'info'
  recipientRole = 'customer',
  recipientId = '',
  recipientEmail = '',
  recipientName = '',
  actionUrl = '',
  actionLabel = '',
  urgent = false
}) {
  const newNotif = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    message,
    type,
    recipientRole,
    recipientId,
    recipientEmail: (recipientEmail || '').toLowerCase().trim(),
    recipientName,
    actionUrl,
    actionLabel,
    urgent,
    read: false,
    createdAt: new Date().toISOString(),
    isStored: true
  };

  // 1. Immediately persist to MongoDB Atlas ('notification' collection)
  saveNotificationToAtlas(newNotif).catch((err) => {
    console.warn('Failed to save notification to MongoDB Atlas:', err);
  });

  // 2. Also keep in local cache for instantaneous UI feedback
  const current = getStoredNotifications();
  const updated = [newNotif, ...current.filter((n) => n.id !== newNotif.id)].slice(0, 50);
  saveStoredNotifications(updated);
  return newNotif;
}

export function getReadNotificationIds() {
  try {
    const raw = window.localStorage.getItem(READ_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function markNotificationAsRead(id) {
  try {
    const set = getReadNotificationIds();
    set.add(id);
    window.localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(set)));
    window.dispatchEvent(new CustomEvent('biglanggwapo-notifications-updated'));
  } catch {}

  // Update read status in MongoDB Atlas
  markNotificationsReadInAtlas(id).catch(() => {});
}

export function markAllNotificationsAsRead(ids = []) {
  try {
    const set = getReadNotificationIds();
    ids.forEach((id) => set.add(id));
    window.localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(set)));
    window.dispatchEvent(new CustomEvent('biglanggwapo-notifications-updated'));
  } catch {}

  // Update read status in MongoDB Atlas
  markNotificationsReadInAtlas(ids).catch(() => {});
}

export function getNotificationsForSession(session, demo) {
  if (!session) return [];
  const role = session.role || 'customer';
  const cleanEmail = (session.email || '').toLowerCase().trim();
  const userName = (session.name || '').trim().toLowerCase();
  const readSet = getReadNotificationIds();

  // 1. Merge Atlas database notifications with local cache
  const dbNotifications = Array.isArray(demo?.notifications) ? demo.notifications : [];
  const allStored = [...dbNotifications, ...getStoredNotifications()];

  const stored = allStored.filter((n) => {
    if (n.recipientRole && n.recipientRole !== role && n.recipientRole !== 'all') return false;
    if (role === 'customer') {
      if (n.recipientId && session.customerId && n.recipientId === session.customerId) return true;
      if (n.recipientEmail && cleanEmail && n.recipientEmail === cleanEmail) return true;
      if (n.recipientName && userName && n.recipientName.trim().toLowerCase() === userName) return true;
      // If no specific recipient target, broadcast to customer role
      return !n.recipientId && !n.recipientEmail && !n.recipientName;
    }
    if (role === 'barber') {
      if (n.recipientId && session.barberId && n.recipientId === session.barberId) return true;
      if (n.recipientEmail && cleanEmail && n.recipientEmail === cleanEmail) return true;
      return true;
    }
    return true; // receptionist & admin see role-wide notifications
  });

  // 2. Generate dynamic notifications based on live demo state
  const live = [];

  if (role === 'customer') {
    const customerId = session.customerId || 'cust-demo';
    const isUserAppointment = (item) =>
      item.customerId === customerId ||
      (cleanEmail && item.customerEmail && item.customerEmail.toLowerCase().trim() === cleanEmail) ||
      (userName && item.customerName && item.customerName.trim().toLowerCase() === userName);

    // Queue status checks
    const activeQueue = (demo?.queue || []).find(
      (item) =>
        (item.customerId === customerId ||
          (cleanEmail && item.customerEmail && item.customerEmail.toLowerCase().trim() === cleanEmail) ||
          (userName && item.customerName && item.customerName.trim().toLowerCase() === userName)) &&
        !['Completed', 'Removed', 'Skipped'].includes(item.status)
    );

    if (activeQueue) {
      if (activeQueue.status === 'In Service') {
        live.push({
          id: `live-queue-chair-${activeQueue.id}`,
          title: "You're in the Chair!",
          message: `Your service (${activeQueue.serviceName}) with ${activeQueue.barberName} is in progress. Relax and enjoy your haircut!`,
          type: 'in-service',
          time: 'Active now',
          actionUrl: '/queue-status',
          actionLabel: 'Queue Status',
          urgent: false
        });
      } else if (activeQueue.status === 'Called') {
        live.push({
          id: `live-queue-called-${activeQueue.id}`,
          title: 'You are Next! Chair is Ready!',
          message: `${activeQueue.barberName} is calling your ticket (#${activeQueue.number}). Please proceed to the barber chair!`,
          type: 'queue-next',
          time: 'Just now',
          actionUrl: '/queue-status',
          actionLabel: 'Go to Chair',
          urgent: true
        });
      } else if (activeQueue.status === 'Waiting') {
        // Calculate position in waiting queue
        const ahead = (demo?.queue || []).filter(
          (q) => q.status === 'Waiting' && q.id !== activeQueue.id && (q.barberId === activeQueue.barberId || !activeQueue.barberId)
        ).length;

        if (ahead === 0) {
          live.push({
            id: `live-queue-next-${activeQueue.id}`,
            title: 'You are Next in Line!',
            message: `You are next in queue (#${activeQueue.number}) for ${activeQueue.barberName}. Please stay near the chair, you will be called momentarily.`,
            type: 'queue-next',
            time: `~${activeQueue.estimatedMinutes || 5}m wait`,
            actionUrl: '/queue-status',
            actionLabel: 'View Queue',
            urgent: true
          });
        } else {
          live.push({
            id: `live-queue-ticket-${activeQueue.id}`,
            title: `Queue Ticket #${activeQueue.number} (${ahead + 1} in line)`,
            message: `You are #${ahead + 1} in line for ${activeQueue.barberName}. Estimated wait: ~${activeQueue.estimatedMinutes} minutes.`,
            type: 'queue-waiting',
            time: `~${activeQueue.estimatedMinutes}m`,
            actionUrl: '/queue-status',
            actionLabel: 'Live Board',
            urgent: false
          });
        }
      }
    }

    // Cancelled and Confirmed Appointments
    const userAppointments = (demo?.appointments || []).filter(isUserAppointment);
    userAppointments.forEach((apt) => {
      if (apt.status === 'Cancelled') {
        const reasonSnippet = apt.cancellationReason ? `Reason: ${apt.cancellationReason}` : '';
        const msgSnippet = apt.cancellationMessage ? `"${apt.cancellationMessage}"` : '';
        live.push({
          id: `live-apt-cancelled-${apt.id}`,
          title: 'Appointment Cancelled',
          message: `Your booking for ${apt.serviceName} with ${apt.barberName} on ${humanDate(apt.date)} at ${apt.time} was cancelled.${reasonSnippet ? ` ${reasonSnippet}.` : ''} ${msgSnippet}`.trim(),
          type: 'cancelled',
          time: humanDate(apt.date),
          actionUrl: '/service-history',
          actionLabel: 'Service History',
          rebookUrl: `/booking?service=${apt.serviceId || ''}&barber=${apt.barberId || ''}`,
          rebookLabel: 'Rebook Chair',
          urgent: true
        });
      } else if (apt.status === 'Confirmed') {
        live.push({
          id: `live-apt-confirmed-${apt.id}`,
          title: 'Appointment Confirmed',
          message: `Your appointment for ${apt.serviceName} with ${apt.barberName} on ${humanDate(apt.date)} at ${apt.time} has been confirmed. See you then!`,
          type: 'confirmed',
          time: `${humanDate(apt.date)} · ${apt.time}`,
          actionUrl: '/my-appointments',
          actionLabel: 'My Bookings',
          urgent: false
        });
      }
    });
  } else if (role === 'barber') {
    const matchedBarber = (demo?.barbers || []).find(
      (b) =>
        (session.barberId && b.id === session.barberId) ||
        (cleanEmail && b.email && b.email.toLowerCase().trim() === cleanEmail) ||
        (userName && b.name && b.name.toLowerCase().trim() === userName)
    );
    const bId = matchedBarber?.id || session.barberId;
    const bName = matchedBarber?.name || session.name;

    // Customer arrived in queue for this barber
    const waitingForBarber = (demo?.queue || []).filter(
      (q) => (q.barberId === bId || q.barberName === bName) && q.status === 'Waiting'
    );
    waitingForBarber.forEach((q, idx) => {
      live.push({
        id: `live-barber-queue-${q.id}`,
        title: idx === 0 ? `Next Customer Waiting: ${q.customerName}` : `Customer in Queue: ${q.customerName}`,
        message: `${q.customerName} has arrived and is waiting for ${q.serviceName} (Ticket #${q.number}).`,
        type: idx === 0 ? 'queue-next' : 'customer-arrived',
        time: idx === 0 ? 'Ready for call' : `~${q.estimatedMinutes}m`,
        actionUrl: '/barber/queue',
        actionLabel: 'Open Chair Queue',
        urgent: idx === 0
      });
    });

    // Cancelled appointments for this barber
    const barberApts = (demo?.appointments || []).filter(
      (a) => a.barberId === bId || a.barberName === bName
    );
    barberApts.forEach((apt) => {
      if (apt.status === 'Cancelled') {
        live.push({
          id: `live-barber-cancel-${apt.id}`,
          title: `Booking Cancelled: ${apt.customerName}`,
          message: `Appointment for ${apt.customerName} (${apt.serviceName}) on ${humanDate(apt.date)} at ${apt.time} was cancelled.${apt.cancellationReason ? ` (${apt.cancellationReason})` : ''}`,
          type: 'cancelled',
          time: humanDate(apt.date),
          actionUrl: '/barber/appointments',
          actionLabel: 'Schedule',
          urgent: false
        });
      }
    });
  } else if (role === 'receptionist') {
    // Pending appointments needing confirmation
    const pendingApts = (demo?.appointments || []).filter((a) => a.status === 'Pending');
    if (pendingApts.length > 0) {
      live.push({
        id: `live-rec-pending-${pendingApts.length}`,
        title: `${pendingApts.length} Booking${pendingApts.length > 1 ? 's' : ''} Pending Confirmation`,
        message: `There are ${pendingApts.length} appointment(s) awaiting front desk confirmation.`,
        type: 'pending-confirm',
        time: 'Action required',
        actionUrl: '/receptionist/appointments',
        actionLabel: 'Review Board',
        urgent: true
      });
    }

    // Customers currently waiting in queue
    const waitingQueue = (demo?.queue || []).filter((q) => q.status === 'Waiting');
    if (waitingQueue.length > 0) {
      live.push({
        id: `live-rec-queue-${waitingQueue.length}`,
        title: `${waitingQueue.length} Customer${waitingQueue.length > 1 ? 's' : ''} in Waiting Lounge`,
        message: `Live queue has ${waitingQueue.length} waiting client(s) queued for haircut chairs.`,
        type: 'queue-waiting',
        time: 'Live status',
        actionUrl: '/receptionist/queue',
        actionLabel: 'Manage Queue',
        urgent: false
      });
    }

    // Recent cancellations
    const cancelledApts = (demo?.appointments || []).filter((a) => a.status === 'Cancelled').slice(0, 3);
    cancelledApts.forEach((apt) => {
      live.push({
        id: `live-rec-cancel-${apt.id}`,
        title: `Cancelled: ${apt.customerName}`,
        message: `Appointment on ${humanDate(apt.date)} at ${apt.time} (${apt.serviceName} with ${apt.barberName}) was cancelled.${apt.cancellationReason ? ` Reason: ${apt.cancellationReason}` : ''}`,
        type: 'cancelled',
        time: humanDate(apt.date),
        actionUrl: '/receptionist/appointments',
        actionLabel: 'Appointments',
        urgent: false
      });
    });
  } else if (role === 'admin') {
    // Admin shop overview alerts
    const pendingCount = (demo?.appointments || []).filter((a) => a.status === 'Pending').length;
    if (pendingCount > 0) {
      live.push({
        id: `live-admin-pending-${pendingCount}`,
        title: `${pendingCount} Pending Bookings`,
        message: `Shop board has ${pendingCount} appointments waiting for confirmation.`,
        type: 'pending-confirm',
        time: 'Desk review',
        actionUrl: '/admin',
        actionLabel: 'Dashboard',
        urgent: true
      });
    }

    const waitingCount = (demo?.queue || []).filter((q) => q.status === 'Waiting').length;
    if (waitingCount > 0) {
      live.push({
        id: `live-admin-queue-${waitingCount}`,
        title: `Queue Volume: ${waitingCount} Waiting`,
        message: `There are currently ${waitingCount} clients queued across all barber chairs.`,
        type: 'queue-waiting',
        time: 'Live',
        actionUrl: '/admin',
        actionLabel: 'Admin Overview',
        urgent: false
      });
    }

    const cancelledCount = (demo?.appointments || []).filter((a) => a.status === 'Cancelled').length;
    if (cancelledCount > 0) {
      live.push({
        id: `live-admin-cancel-${cancelledCount}`,
        title: `${cancelledCount} Cancelled Bookings Logged`,
        message: `System ledger records ${cancelledCount} cancelled appointments with full reason tracking.`,
        type: 'cancelled',
        time: 'Ledger',
        actionUrl: '/admin',
        actionLabel: 'Appointments',
        urgent: false
      });
    }
  }

  // Combine live and stored, deduplicating IDs
  const combined = [];
  const seenIds = new Set();

  for (const item of [...live, ...stored]) {
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id);
      combined.push({
        ...item,
        read: Boolean(item.read === true || readSet.has(item.id))
      });
    }
  }

  return combined;
}
