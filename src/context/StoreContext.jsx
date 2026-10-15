import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadDemoState, persistDemoState, resetDemoState, syncAccountsIntoDemoState } from '../mockService';
import {
  fetchBarbersFromAtlas, fetchAppointmentsFromAtlas, fetchServicesFromAtlas,
  fetchReviewsFromAtlas, fetchInventoryFromAtlas, fetchQueueFromAtlas
} from '../services/api';
import { getLocalDateStr, getTomorrowDateStr } from '../utils/scheduling';
import { getAccounts, syncAccountsFromAtlas } from '../data';

const StoreContext = createContext(null);

export const currency = (value) => `₱${Number(value || 0).toLocaleString('en-PH')}`;
export const today = getLocalDateStr();
export const humanDate = (value) => {
  if (!value) return '';
  const currentToday = getLocalDateStr();
  if (value === currentToday) return 'Today';
  if (value === getTomorrowDateStr()) return 'Tomorrow';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
};
export const stars = (rating) => '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
export const rolePath = (role) => `/${role}`;

export function StoreProvider({ children }) {
  const [demo, setDemo] = useState(loadDemoState);
  const [session, setSession] = useState(() => {
    try {
      window.localStorage.removeItem('biglanggwapo-session');
      return JSON.parse(window.sessionStorage.getItem('biglanggwapo-session') || 'null');
    } catch {
      return null;
    }
  });
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchBarbersFromAtlas().then((barbers) => {
      if (barbers && Array.isArray(barbers)) {
        setDemo((prev) => {
          const updated = { ...prev, barbers };
          persistDemoState(updated);
          return updated;
        });
      }
    });

    fetchServicesFromAtlas().then((services) => {
      if (services && Array.isArray(services)) {
        setDemo((prev) => {
          const updated = { ...prev, services };
          persistDemoState(updated);
          return updated;
        });
      }
    });

    fetchAppointmentsFromAtlas().then((appointments) => {
      if (appointments && Array.isArray(appointments)) {
        setDemo((prev) => {
          const updated = { ...prev, appointments };
          persistDemoState(updated);
          return updated;
        });
      }
    });

    fetchReviewsFromAtlas().then((reviews) => {
      if (reviews && Array.isArray(reviews)) {
        setDemo((prev) => {
          const updated = { ...prev, reviews };
          persistDemoState(updated);
          return updated;
        });
      }
    });

    fetchQueueFromAtlas().then((queue) => {
      if (queue && Array.isArray(queue)) {
        setDemo((prev) => {
          const updated = { ...prev, queue };
          persistDemoState(updated);
          return updated;
        });
      }
    });

    fetchInventoryFromAtlas().then((inventory) => {
      if (inventory && Array.isArray(inventory) && inventory.length > 0) {
        setDemo((prev) => {
          const updated = { ...prev, inventory };
          persistDemoState(updated);
          return updated;
        });
      }
    });

    syncAccountsFromAtlas().then((latestAccounts) => {
      const accMap = latestAccounts || getAccounts();
      if (accMap && typeof accMap === 'object') {
        setDemo((prev) => {
          const updated = syncAccountsIntoDemoState(prev, accMap);
          persistDemoState(updated);
          return updated;
        });
      }
    });

    const handleAccountsUpdated = (e) => {
      const accMap = e.detail || getAccounts();
      setDemo((prev) => {
        const updated = syncAccountsIntoDemoState(prev, accMap);
        persistDemoState(updated);
        return updated;
      });
    };
    window.addEventListener('biglanggwapo-accounts-updated', handleAccountsUpdated);

    // Periodic synchronization across devices for accounts, queue, reviews, and appointments
    const syncAtlasData = async () => {
      try {
        const [latestAccounts, latestQueue, latestReviews, latestAppointments] = await Promise.all([
          syncAccountsFromAtlas().catch(() => null),
          fetchQueueFromAtlas().catch(() => null),
          fetchReviewsFromAtlas().catch(() => null),
          fetchAppointmentsFromAtlas().catch(() => null)
        ]);

        setDemo((prev) => {
          let updated = { ...prev };
          let changed = false;

          if (latestAccounts && typeof latestAccounts === 'object') {
            updated = syncAccountsIntoDemoState(updated, latestAccounts);
            changed = true;
          }
          if (latestQueue && Array.isArray(latestQueue)) {
            updated.queue = latestQueue;
            changed = true;
          }
          if (latestReviews && Array.isArray(latestReviews)) {
            updated.reviews = latestReviews;
            changed = true;
          }
          if (latestAppointments && Array.isArray(latestAppointments)) {
            updated.appointments = latestAppointments;
            changed = true;
          }

          if (changed) {
            persistDemoState(updated);
          }
          return updated;
        });
      } catch (err) {
        console.warn('Atlas periodic sync error:', err);
      }
    };

    const handleWindowFocus = () => {
      syncAtlasData();
    };
    window.addEventListener('focus', handleWindowFocus);

    const syncInterval = setInterval(() => {
      syncAtlasData();
    }, 8000);

    const handleStorageChange = (e) => {
      if (e.key === 'biglanggwapo-revoked-session') {
        try {
          const revoked = JSON.parse(e.newValue || '{}');
          const storedSession = JSON.parse(window.sessionStorage.getItem('biglanggwapo-session') || 'null');
          if (storedSession) {
            const currentEmail = (storedSession.email || '').toLowerCase().trim();
            const isMatch =
              (revoked.email && currentEmail && revoked.email === currentEmail) ||
              (revoked.id && (storedSession.barberId === revoked.id || storedSession.customerId === revoked.id || storedSession.receptionistId === revoked.id)) ||
              (revoked.name && storedSession.name && revoked.name.toLowerCase() === storedSession.name.toLowerCase());

            if (isMatch) {
              logout();
              notify(`Your account has been ${revoked.reason || 'deactivated'}. You have been signed out.`, 'error');
              return;
            }
          }
        } catch {}
      }

      if (!e.key || e.key === 'biglanggwapo-demo-v10' || e.key === 'biglanggwapo-accounts-v2') {
        const rawAccounts = getAccounts();
        setDemo((prev) => syncAccountsIntoDemoState(loadDemoState(), rawAccounts));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('biglanggwapo-accounts-updated', handleAccountsUpdated);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  // Proactive check: automatically sign out if logged-in account was deleted or deactivated
  useEffect(() => {
    if (!session) return;
    if (session.role === 'admin' && session.email === 'admin@biglanggwapo.com') return;

    const email = (session.email || '').toLowerCase().trim();
    const storedAccounts = getAccounts();

    // 1. Account was removed from accounts registry
    if (email && !storedAccounts[email]) {
      logout();
      notify('Your account has been deleted. You have been signed out.', 'error');
      return;
    }

    // 2. Account marked Inactive in accounts registry
    if (email && (storedAccounts[email]?.status === 'Inactive' || storedAccounts[email]?.active === false)) {
      logout();
      notify('Your account has been deactivated. You have been signed out.', 'error');
      return;
    }

    // 3. Barber checks
    if (session.role === 'barber') {
      const barber = (demo.barbers || []).find((b) =>
        (session.barberId && b.id === session.barberId) ||
        (email && b.email && b.email.toLowerCase() === email) ||
        (session.name && b.name && b.name.toLowerCase() === session.name.toLowerCase())
      );
      if (!barber) {
        logout();
        notify('Your barber account has been removed. You have been signed out.', 'error');
        return;
      }
      if (barber.status === 'Inactive' || barber.leaveStatus === 'Inactive' || barber.active === false) {
        logout();
        notify('Your barber account has been deactivated. You have been signed out.', 'error');
        return;
      }
    }

    // 4. Customer checks
    if (session.role === 'customer') {
      const customer = (demo.customers || []).find((c) =>
        (session.customerId && c.id === session.customerId) ||
        (email && c.email && c.email.toLowerCase() === email) ||
        (session.name && c.name && c.name.toLowerCase() === session.name.toLowerCase())
      );
      if (customer && customer.status === 'Inactive') {
        logout();
        notify('Your customer account has been deactivated. You have been signed out.', 'error');
        return;
      }
    }

    // 5. Receptionist checks
    if (session.role === 'receptionist') {
      const rec = (demo.receptionists || []).find((r) =>
        (session.receptionistId && r.id === session.receptionistId) ||
        (email && r.email && r.email.toLowerCase() === email) ||
        (session.name && r.name && r.name.toLowerCase() === session.name.toLowerCase())
      );
      if (!rec || rec.status === 'Inactive') {
        logout();
        notify('Your receptionist account has been deactivated or removed. You have been signed out.', 'error');
        return;
      }
    }
  }, [session, demo.barbers, demo.customers, demo.receptionists]);

  const notify = (message, tone = 'success') => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3200);
  };

  const commit = (recipe) => setDemo((prev) => {
    const next = typeof recipe === 'function' ? recipe(prev) : recipe;
    persistDemoState(next);
    return next;
  });

  const login = (nextSession) => {
    setSession(nextSession);
    try { window.sessionStorage.setItem('biglanggwapo-session', JSON.stringify(nextSession)); } catch {}
    setModal(null);
    notify(`Signed in as ${nextSession.name}.`);
  };

  const logout = () => {
    setSession(null);
    try {
      window.sessionStorage.removeItem('biglanggwapo-session');
      window.localStorage.removeItem('biglanggwapo-session');
    } catch {}
    notify('You have been signed out.');
  };

  const updateSession = (updater) => {
    setSession((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      try { window.sessionStorage.setItem('biglanggwapo-session', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const reset = () => {
    commit(resetDemoState());
    notify('Demo data has been reset.');
  };

  const openModal = (type, options = {}) => setModal({ type, ...options });
  const closeModal = () => setModal(null);

  const value = { demo, session, modal, toast, notify, commit, login, logout, reset, updateSession, openModal, closeModal };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}
