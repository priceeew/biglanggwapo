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
}
