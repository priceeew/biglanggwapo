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

const STORAGE_KEY = 'biglanggwapo-accounts-v3';

function loadStoredAccounts() {
  try {
    if (typeof window !== 'undefined') {
      try { window.localStorage.removeItem('biglanggwapo-accounts-v2'); } catch {}
    }
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

export function applyAccounts(newAccounts) {
  if (newAccounts && typeof newAccounts === 'object') {
    Object.assign(accounts, newAccounts);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
        window.dispatchEvent(new CustomEvent('biglanggwapo-accounts-updated', { detail: accounts }));
      } catch (err) {
        console.error('Failed to update accounts storage:', err);
      }
    }
  }
  return accounts;
}

// Asynchronously pull latest accounts from MongoDB Atlas into local cache (or apply pre-fetched map)
export async function syncAccountsFromAtlas(inboundAccounts = null) {
  if (inboundAccounts && typeof inboundAccounts === 'object') {
    return applyAccounts(inboundAccounts);
  }
  try {
    const res = await fetch('/api/accounts');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.accounts) {
        return applyAccounts(data.accounts);
      }
    }
  } catch {
    // Offline or server not ready, fallback to localStorage
  }
  return accounts;
}

if (typeof window !== 'undefined') {
  syncAccountsFromAtlas();
}

export function getAccounts() {
  return accounts;
}

export function revokeSession({ email, id, name, reason = 'deactivated' }) {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('biglanggwapo-revoked-session', JSON.stringify({
        email: email ? email.toLowerCase().trim() : undefined,
        id,
        name,
        reason,
        ts: Date.now()
      }));
    }
  } catch {}
}

export async function saveAccount(account) {
  if (!account || !account.email) return;
  const cleanEmail = account.email.trim().toLowerCase();
  accounts[cleanEmail] = { ...(accounts[cleanEmail] || {}), ...account, email: cleanEmail };
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
      window.dispatchEvent(new CustomEvent('biglanggwapo-accounts-updated', { detail: accounts }));
      if (account.status === 'Inactive' || account.active === false) {
        revokeSession({ email: cleanEmail, reason: 'deactivated' });
      }
    }
  } catch (err) {
    console.error('Failed to persist account:', err);
  }

  // Sync to MongoDB Atlas
  try {
    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(accounts[cleanEmail])
    });
    const data = await res.json().catch(() => ({}));
    if (data.success && data.account) {
      accounts[cleanEmail] = { ...accounts[cleanEmail], ...data.account };
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
      }
    } else if (res.status >= 400) {
      console.warn('[Accounts] Atlas save returned error:', data.message || res.statusText);
    }
  } catch (err) {
    console.warn('[Accounts] Could not reach server to sync account:', err.message);
  }

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
      window.dispatchEvent(new CustomEvent('biglanggwapo-accounts-updated', { detail: accounts }));
      revokeSession({ email: cleanEmail, reason: 'deleted' });
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

export function validatePhone(phone) {
  if (!phone || !phone.trim()) {
    return 'Phone number is required.';
  }
  let digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.startsWith('63') && digitsOnly.length === 12) {
    digitsOnly = '0' + digitsOnly.slice(2);
  }
  if (digitsOnly.length > 11) {
    return 'Phone number cannot exceed 11 digits.';
  }
  if (digitsOnly.length < 11) {
    return 'Phone number must be 11 digits (e.g. 09171234567).';
  }
  return null;
}


