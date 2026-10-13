export async function sendInviteNotification({ to, name, role, password }) {
  try {
    const res = await fetch('http://localhost:5000/api/send-invite', {
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
    console.warn('Backend email API unreachable (is server running on port 5000?):', err.message);
    return { success: false, error: 'Email server is not running. Start it with "npm run dev".' };
  }
}
