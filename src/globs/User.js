const defaultAdminAccount = {
  'admin@biglanggwapo.com': {
    email: 'admin@biglanggwapo.com',
    password: 'admin123',
    role: 'admin',
    name: 'Admin Desk',
    initials: 'AD',
    redirectPath: '/admin'
  }
};

const STORAGE_KEY = 'biglanggwapo-accounts-v2';

function loadStoredAccounts() {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultAdminAccount, ...parsed };
    }
  } catch (err) {
    console.error('Failed to load accounts:', err);
  }
  return { ...defaultAdminAccount };
}

export const accounts = loadStoredAccounts();

// Asynchronously pull latest accounts from MongoDB Atlas into local cache
export async function syncAccountsFromAtlas() {
  try {
    const res = await fetch('/api/accounts');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.accounts) {
        Object.assign(accounts, data.accounts);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
        }
      }
    }
  } catch {
    // Offline or server not ready, fallback to localStorage
  }
}

if (typeof window !== 'undefined') {
  syncAccountsFromAtlas();
}

export function saveAccount(account) {
  if (!account || !account.email) return;
  const cleanEmail = account.email.trim().toLowerCase();
  accounts[cleanEmail] = { ...account, email: cleanEmail };
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    }
  } catch (err) {
    console.error('Failed to persist account:', err);
  }

  // Sync to MongoDB Atlas
  try {
    fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(accounts[cleanEmail])
    }).catch(() => {});
  } catch {}

  return accounts[cleanEmail];
}

export function deleteAccount(email) {
  if (!email) return;
  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail === 'admin@biglanggwapo.com') return;
  delete accounts[cleanEmail];
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    }
  } catch (err) {
    console.error('Failed to delete account:', err);
  }

  // Delete from MongoDB Atlas
  try {
    fetch(`/api/accounts/${encodeURIComponent(cleanEmail)}`, {
      method: 'DELETE'
    }).catch(() => {});
  } catch {}
}

export function validatePassword(password) {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/\d/.test(password)) {
    return 'Password must contain at least one number (0-9).';
  }
  const specialCharRegex = /[!@#$%^&*(),.?":{}|<>_\-+=\\/\[\]~`]/;
  if (!specialCharRegex.test(password)) {
    return 'Password must contain at least one special character (e.g. !@#$%^&*).';
  }
  return null;
}

