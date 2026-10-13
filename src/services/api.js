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
    await fetch('/api/barbers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(barber)
    });
  } catch {}
}

export async function deleteBarberFromAtlas(id) {
  try {
    await fetch(`/api/barbers/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  } catch {}
}

export async function clearAllBarbersFromAtlas() {
  try {
    await fetch('/api/barbers', {
      method: 'DELETE'
    });
  } catch {}
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
    await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointment)
    });
  } catch {}
}
