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
      const dataUrl = e.target.result;
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUrl, filename: file.name })
        });
        const data = await res.json().catch(() => ({}));
        if (data.success && data.url) {
          return resolve({ success: true, url: data.url, provider: data.provider });
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

