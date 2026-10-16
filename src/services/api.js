export async function sendInviteNotification({ to, name, role, password }) {
  try {
    const res = await fetch('/api/send-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        name,
        role,
        password,
        portalUrl: window.location.origin
      })
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Backend email API unreachable:', err.message);
    return { success: false, error: 'Email service unreachable: ' + err.message };
  }
}

export async function sendTurnNotification({ to, customerName, barberName, serviceName, queueNumber }) {
  try {
    const res = await fetch('/api/send-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'turn-notification',
        to,
        name: customerName,
        barberName,
        serviceName,
        queueNumber,
        portalUrl: window.location.origin
      })
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Backend turn email notification API unreachable:', err.message);
    return { success: false, error: 'Email service unreachable: ' + err.message };
  }
}

export async function sendCancellationNotification({
  appointment,
  recipientEmail,
  reason,
  message
}) {
  if (!recipientEmail || !recipientEmail.includes('@') || recipientEmail.includes('example.com')) {
    console.warn('[Cancellation Email] No valid recipient email provided:', recipientEmail);
    return { success: false, error: 'No valid customer email' };
  }

  const payload = {
    type: 'cancellation',
    to: recipientEmail,
    name: appointment?.customerName || 'Customer',
    barberName: appointment?.barberName || 'Barber',
    serviceName: appointment?.serviceName || 'Haircut Service',
    date: appointment?.date || '',
    time: appointment?.time || '',
    reason: reason || 'Schedule update',
    message: message || '',
    portalUrl: window.location.origin
  };

  try {
    const res = await fetch('/api/send-cancellation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      if (data.previewUrl) {
        console.log('[Cancellation Email Preview URL]:', data.previewUrl);
      }
      return data;
    }
    // Fallback to /api/send-invite
    const fallbackRes = await fetch('/api/send-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await fallbackRes.json();
  } catch (err) {
    try {
      const fallbackRes = await fetch('/api/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await fallbackRes.json();
    } catch (fallbackErr) {
      console.warn('Backend cancellation email notification API unreachable:', fallbackErr.message);
      return { success: false, error: 'Email service unreachable: ' + fallbackErr.message };
    }
  }
}

// In-memory set to prevent duplicate email alerts within a session for the same queue item
const notifiedTurns = new Set();

export async function notifyCustomerTurn(queueItem, state, notify) {
  if (!queueItem) return false;

  const dedupeKey = `${queueItem.id || queueItem.appointmentId || queueItem.customerName}-${queueItem.number || ''}`;
  if (notifiedTurns.has(dedupeKey)) {
    console.log('[Turn Notification] Already notified for', dedupeKey);
    return false;
  }

  // 1. Check direct queueItem customerEmail
  let email = queueItem.customerEmail;

  // 2. Check linked appointment
  if (!email || !email.includes('@') || email.includes('example.com')) {
    const apt = state?.appointments?.find(
      (a) => a.id === queueItem.appointmentId || a.id === queueItem.id
    );
    if (apt?.customerEmail && apt.customerEmail.includes('@') && !apt.customerEmail.includes('example.com')) {
      email = apt.customerEmail;
    }
  }

  // 3. Check customers list in state
  if (!email || !email.includes('@') || email.includes('example.com')) {
    const cust = state?.customers?.find(
      (c) =>
        (queueItem.customerId && c.id === queueItem.customerId) ||
        (queueItem.customerName && c.name && c.name.trim().toLowerCase() === queueItem.customerName.trim().toLowerCase())
    );
    if (cust?.email && cust.email.includes('@') && !cust.email.includes('example.com')) {
      email = cust.email;
    }
  }

  // 4. Check accounts stored in localStorage
  if (!email || !email.includes('@') || email.includes('example.com')) {
    try {
      const rawAccounts = window.localStorage.getItem('biglanggwapo-accounts-v2');
      if (rawAccounts) {
        const accountsList = Object.values(JSON.parse(rawAccounts));
        const matched = accountsList.find(
          (acc) =>
            acc &&
            acc.email &&
            acc.email.includes('@') &&
            !acc.email.includes('example.com') &&
            acc.name &&
            queueItem.customerName &&
            acc.name.trim().toLowerCase() === queueItem.customerName.trim().toLowerCase()
        );
        if (matched?.email) {
          email = matched.email;
        }
      }
    } catch {}
  }

  if (!email || !email.includes('@') || email.includes('example.com')) {
    console.log('[Turn Notification] No valid customer email found for', queueItem.customerName);
    return false;
  }

  notifiedTurns.add(dedupeKey);

  const customerName = queueItem.customerName || 'Valued Customer';
  const barberName = queueItem.barberName || 'Your Barber';
  const serviceName = queueItem.serviceName || 'Haircut & Styling';
  const queueNumber = queueItem.number || '';

  try {
    const res = await sendTurnNotification({
      to: email,
      customerName,
      barberName,
      serviceName,
      queueNumber
    });

    if (res && res.success) {
      if (notify) {
        notify(`📧 Email sent to ${customerName} (${email}): Kayo na po ang gugupitan!`);
      }
      return true;
    } else {
      console.warn('[Turn Notification] Email dispatch failed:', res?.error);
      return false;
    }
  } catch (err) {
    console.error('[Turn Notification] Error calling email API:', err);
    return false;
  }
}


export async function fetchAccountsFromAtlas() {
  try {
    const res = await fetch('/api/accounts');
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.accounts : null;
  } catch {
    return null;
  }
}

export async function fetchBarbersFromAtlas() {
  try {
    const res = await fetch('/api/barbers');
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.barbers : null;
  } catch {
    return null;
  }
}

export async function saveBarberToAtlas(barber) {
  try {
    const res = await fetch('/api/barbers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(barber)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || data.message || `Server error (${res.status})` };
    }
    return { success: true, barber: data.barber };
  } catch (err) {
    console.error('Failed to save barber to database:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteBarberFromAtlas(id) {
  try {
    const res = await fetch(`/api/barbers/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return await res.json().catch(() => ({ success: res.ok }));
  } catch (err) {
    console.error('Failed to delete barber from database:', err);
    return { success: false, error: err.message };
  }
}

export async function clearAllBarbersFromAtlas() {
  try {
    const res = await fetch('/api/barbers', {
      method: 'DELETE'
    });
    return await res.json().catch(() => ({ success: res.ok }));
  } catch (err) {
    console.error('Failed to clear barbers:', err);
    return { success: false, error: err.message };
  }
}

export async function fetchAppointmentsFromAtlas() {
  try {
    const res = await fetch('/api/appointments');
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.appointments : null;
  } catch {
    return null;
  }
}

export async function saveAppointmentToAtlas(appointment) {
  try {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointment)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || data.message || `Server error (${res.status})` };
    }
    return { success: true, appointment: data.appointment };
  } catch (err) {
    console.error('Failed to save appointment to database:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteAppointmentFromAtlas(id) {
  try {
    const res = await fetch(`/api/appointments/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return await res.json().catch(() => ({ success: res.ok }));
  } catch (err) {
    console.error('Failed to delete appointment from database:', err);
    return { success: false, error: err.message };
  }
}

export async function clearAllAppointmentsInAtlas() {
  try {
    const res = await fetch('/api/appointments', {
      method: 'DELETE'
    });
    return await res.json().catch(() => ({ success: res.ok }));
  } catch (err) {
    console.error('Failed to clear appointments:', err);
    return { success: false, error: err.message };
  }
}

export async function fetchServicesFromAtlas() {
  try {
    const res = await fetch('/api/services');
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.services : null;
  } catch {
    return null;
  }
}

export async function saveServiceToAtlas(service) {
  try {
    const res = await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || data.message || `Server error (${res.status})` };
    }
    return { success: true, service: data.service };
  } catch (err) {
    console.error('Failed to save service to database:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteServiceFromAtlas(id) {
  try {
    const res = await fetch(`/api/services/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return await res.json().catch(() => ({ success: res.ok }));
  } catch (err) {
    console.error('Failed to delete service from database:', err);
    return { success: false, error: err.message };
  }
}

export async function clearAllServicesFromAtlas() {
  try {
    const res = await fetch('/api/services', {
      method: 'DELETE'
    });
    return await res.json().catch(() => ({ success: res.ok }));
  } catch (err) {
    console.error('Failed to clear services:', err);
    return { success: false, error: err.message };
  }
}

// Reviews Atlas integration
export async function fetchReviewsFromAtlas() {
  try {
    const res = await fetch('/api/reviews');
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.reviews : null;
  } catch {
    return null;
  }
}

export async function saveReviewToAtlas(review) {
  try {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || data.message || `Server error (${res.status})` };
    }
    return { success: true, review: data.review };
  } catch (err) {
    console.error('Failed to save review to database:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteReviewFromAtlas(id) {
  try {
    const res = await fetch(`/api/reviews/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return await res.json().catch(() => ({ success: res.ok }));
  } catch (err) {
    console.error('Failed to delete review from database:', err);
    return { success: false, error: err.message };
  }
}

export async function clearReviewsInAtlas() {
  try {
    const res = await fetch('/api/reviews', { method: 'DELETE' });
    return await res.json().catch(() => ({ success: res.ok }));
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Inventory Atlas integration
export async function fetchInventoryFromAtlas() {
  try {
    const res = await fetch('/api/inventory');
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.inventory : null;
  } catch {
    return null;
  }
}

export async function saveInventoryToAtlas(item) {
  try {
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || data.message || `Server error (${res.status})` };
    }
    return { success: true, item: data.item };
  } catch (err) {
    console.error('Failed to save inventory to database:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteInventoryFromAtlas(id) {
  try {
    const res = await fetch(`/api/inventory/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return await res.json().catch(() => ({ success: res.ok }));
  } catch (err) {
    console.error('Failed to delete inventory from database:', err);
    return { success: false, error: err.message };
  }
}

export async function clearInventoryInAtlas() {
  try {
    const res = await fetch('/api/inventory', { method: 'DELETE' });
    return await res.json().catch(() => ({ success: res.ok }));
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Queue Atlas integration
export async function fetchQueueFromAtlas() {
  try {
    const res = await fetch('/api/queue');
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.queue : null;
  } catch {
    return null;
  }
}

export async function saveQueueItemToAtlas(item) {
  try {
    const res = await fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || data.message || `Server error (${res.status})` };
    }
    return { success: true, queueItem: data.queueItem };
  } catch (err) {
    console.error('Failed to save queue item to database:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteQueueItemFromAtlas(id) {
  try {
    const res = await fetch(`/api/queue/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return await res.json().catch(() => ({ success: res.ok }));
  } catch (err) {
    console.error('Failed to delete queue item from database:', err);
    return { success: false, error: err.message };
  }
}

export async function clearQueueInAtlas() {
  try {
    const res = await fetch('/api/queue', { method: 'DELETE' });
    return await res.json().catch(() => ({ success: res.ok }));
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function uploadImageFile(file) {
  return new Promise((resolve) => {
    if (!file) return resolve({ success: false, error: 'No file selected' });
    const validTypes = ['image/jpeg', 'image/png'];
    const validExt = /\.(jpe?g|png)$/i;
    if (file.type && !validTypes.includes(file.type) && !validExt.test(file.name)) {
      return resolve({ success: false, error: 'Only JPEG, JPG, and PNG files are allowed.' });
    }
    const reader = new FileReader();
    reader.onerror = () => resolve({ success: false, error: 'Could not read file' });
    reader.onload = async (e) => {
      let dataUrl = e.target.result;

      // Optimize image dimensions and compression to keep MongoDB lightweight
      try {
        const img = new Image();
        img.src = dataUrl;
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = rej;
        });

        const maxDim = 1200;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      } catch (optErr) {
        // Fall back to original dataUrl if canvas optimization fails
      }

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUrl, filename: file.name })
        });
        const data = await res.json().catch(() => ({}));
        if (data.success && data.url) {
          return resolve({ success: true, url: data.url, id: data.id, provider: data.provider });
        }
        return resolve({ success: true, url: dataUrl, provider: 'base64' });
      } catch (err) {
        console.warn('Upload API fallback to local dataURL:', err);
        return resolve({ success: true, url: dataUrl, provider: 'base64' });
      }
    };
    reader.readAsDataURL(file);
  });
}

export async function fetchDiscountsFromAtlas() {
  try {
    const res = await fetch('/api/discounts');
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.discounts : null;
  } catch {
    return null;
  }
}

export async function saveDiscountToAtlas(item) {
  try {
    const res = await fetch('/api/discounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || data.message || `Server error (${res.status})` };
    }
    return { success: true, discount: data.discount };
  } catch (err) {
    console.error('Failed to save discount to database:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteDiscountFromAtlas(id) {
  try {
    const res = await fetch(`/api/discounts/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return await res.json().catch(() => ({ success: res.ok }));
  } catch (err) {
    console.error('Failed to delete discount from database:', err);
    return { success: false, error: err.message };
  }
}

export async function clearDiscountsInAtlas() {
  try {
    const res = await fetch('/api/discounts', { method: 'DELETE' });
    return await res.json().catch(() => ({ success: res.ok }));
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function fetchTransactionsFromAtlas() {
  try {
    const res = await fetch('/api/transactions');
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.transactions : null;
  } catch {
    return null;
  }
}

export async function saveTransactionToAtlas(item) {
  try {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || data.message || `Server error (${res.status})` };
    }
    return { success: true, transaction: data.transaction };
  } catch (err) {
    console.error('Failed to save transaction to database:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteTransactionFromAtlas(id) {
  try {
    const res = await fetch(`/api/transactions/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return await res.json().catch(() => ({ success: res.ok }));
  } catch (err) {
    console.error('Failed to delete transaction from database:', err);
    return { success: false, error: err.message };
  }
}

export async function clearTransactionsInAtlas() {
  try {
    const res = await fetch('/api/transactions', { method: 'DELETE' });
    return await res.json().catch(() => ({ success: res.ok }));
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Consolidated initial load from MongoDB Atlas (1 single network roundtrip)
export async function fetchShopInitFromAtlas() {
  try {
    const res = await fetch('/api/init');
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (err) {
    console.warn('[Bootstrap] /api/init unreachable:', err.message);
    return null;
  }
}

// Notifications API (MongoDB Atlas - collection: 'notification')
export async function fetchNotificationsFromAtlas(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`/api/notifications${query ? `?${query}` : ''}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.success ? data.notifications : [];
  } catch (err) {
    console.warn('Failed to fetch notifications from Atlas:', err);
    return [];
  }
}

export async function saveNotificationToAtlas(notification) {
  try {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification)
    });
    const data = await res.json().catch(() => ({}));
    return { success: res.ok && data.success, notification: data.notification };
  } catch (err) {
    console.error('Failed to save notification to database:', err);
    return { success: false, error: err.message };
  }
}

export async function markNotificationsReadInAtlas(idOrIds) {
  try {
    const payload = Array.isArray(idOrIds) ? { ids: idOrIds } : { id: idOrIds };
    const res = await fetch('/api/notifications/mark-read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json().catch(() => ({ success: res.ok }));
  } catch (err) {
    console.error('Failed to mark notifications read in Atlas:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteNotificationFromAtlas(id) {
  try {
    const res = await fetch(`/api/notifications/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return await res.json().catch(() => ({ success: res.ok }));
  } catch (err) {
    return { success: false, error: err.message };
  }
}



