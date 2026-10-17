import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadDemoState, persistDemoState, resetDemoState, syncAccountsIntoDemoState, deduplicateQueue, deduplicateTransactions } from '../mockService';
import {
  fetchBarbersFromAtlas, fetchAppointmentsFromAtlas, fetchServicesFromAtlas,
  fetchReviewsFromAtlas, fetchInventoryFromAtlas, fetchQueueFromAtlas,
  fetchDiscountsFromAtlas, fetchTransactionsFromAtlas, fetchShopInitFromAtlas,
  fetchNotificationsFromAtlas, fetchSettingsFromAtlas, saveSettingsToAtlas
} from '../services/api';
import { getLocalDateStr, getTomorrowDateStr, sortAppointmentsStably } from '../utils/scheduling';
import { getAccounts, syncAccountsFromAtlas, applyAccounts } from '../data';

function areEntityListsEqual(listA, listB, keys = ['id', 'status', 'time', 'date']) {
  if (listA === listB) return true;
  if (!Array.isArray(listA) || !Array.isArray(listB)) return false;
  if (listA.length !== listB.length) return false;
  for (let i = 0; i < listA.length; i++) {
    const a = listA[i];
    const b = listB[i];
    if (!a || !b) return false;
    for (const k of keys) {
      if (a[k] !== b[k]) return false;
    }
  }
  return true;
}

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
export const stars = (rating) => {
  const num = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return '★'.repeat(num) + '☆'.repeat(5 - num);
};
export const rolePath = (role) => `/${role}`;

export function StoreProvider({ children }) {
  const [demo, setDemo] = useState(loadDemoState);
  const [session, setSession] = useState(() => {
    try {
      window.localStorage.removeItem('biglanggwapo-session');
      const raw = JSON.parse(window.sessionStorage.getItem('biglanggwapo-session') || 'null');
      if (raw) {
        if (raw.photoUrl && !raw.image) raw.image = raw.photoUrl;
        if (raw.image && !raw.photoUrl) raw.photoUrl = raw.image;
      }
      return raw;
    } catch {
      return null;
    }
  });
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const applyFullSyncData = (data) => {
      if (!data || typeof data !== 'object') return false;
      if (data.accounts && typeof data.accounts === 'object') {
        applyAccounts(data.accounts);
      }
      setDemo((prev) => {
        let updated = { ...prev };
        if (Array.isArray(data.barbers) && data.barbers.length > 0) updated.barbers = data.barbers;
        if (Array.isArray(data.services) && data.services.length > 0) updated.services = data.services;
        if (Array.isArray(data.queue)) updated.queue = deduplicateQueue(data.queue);
        if (Array.isArray(data.appointments)) updated.appointments = sortAppointmentsStably(data.appointments);
        if (Array.isArray(data.reviews)) updated.reviews = data.reviews;
        if (Array.isArray(data.inventory)) updated.inventory = data.inventory;
        if (Array.isArray(data.promotions)) updated.promotions = data.promotions;
        if (Array.isArray(data.transactions)) updated.transactions = deduplicateTransactions(data.transactions);
        if (Array.isArray(data.notifications)) updated.notifications = data.notifications;
        if (data.settings && typeof data.settings === 'object') {
          updated.settings = { ...updated.settings, ...data.settings };
        }
        if (data.accounts && typeof data.accounts === 'object') {
          updated = syncAccountsIntoDemoState(updated, data.accounts);
        }
        persistDemoState(updated);
        return updated;
      });

      // Automatically sync updated barber profile photo to active barber session
      if (Array.isArray(data.barbers) && data.barbers.length > 0) {
        setSession((prevSession) => {
          if (!prevSession || prevSession.role !== 'barber') return prevSession;
          const cleanEmail = (prevSession.email || '').toLowerCase().trim();
          const matched = data.barbers.find((b) =>
            (prevSession.barberId && b.id === prevSession.barberId) ||
            (cleanEmail && b.email && b.email.toLowerCase().trim() === cleanEmail) ||
            (prevSession.name && b.name && b.name.toLowerCase().trim() === prevSession.name.toLowerCase().trim())
          );
          if (matched && (matched.image || matched.photoUrl)) {
            const freshImg = matched.image || matched.photoUrl;
            if (prevSession.photoUrl !== freshImg || prevSession.image !== freshImg) {
              const updatedSession = { ...prevSession, photoUrl: freshImg, image: freshImg };
              try {
                window.sessionStorage.setItem('biglanggwapo-session', JSON.stringify(updatedSession));
              } catch {}
              return updatedSession;
            }
          }
          return prevSession;
        });
      }

      return true;
    };

    // Fast bootstrap: Single roundtrip fetch for all collections from Atlas
    fetchShopInitFromAtlas().then((data) => {
      if (data && applyFullSyncData(data)) {
        return;
      }
      // Fallback if /api/init is unavailable
      fetchBarbersFromAtlas().then((b) => b && Array.isArray(b) && setDemo(p => ({ ...p, barbers: b })));
      fetchServicesFromAtlas().then((s) => s && Array.isArray(s) && setDemo(p => ({ ...p, services: s })));
      fetchAppointmentsFromAtlas().then((a) => a && Array.isArray(a) && setDemo(p => ({ ...p, appointments: sortAppointmentsStably(a) })));
      fetchReviewsFromAtlas().then((r) => r && Array.isArray(r) && setDemo(p => ({ ...p, reviews: r })));
      fetchQueueFromAtlas().then((q) => q && Array.isArray(q) && setDemo(p => ({ ...p, queue: deduplicateQueue(q) })));
      fetchInventoryFromAtlas().then((i) => i && Array.isArray(i) && setDemo(p => ({ ...p, inventory: i })));
      fetchDiscountsFromAtlas().then((d) => d && Array.isArray(d) && setDemo(p => ({ ...p, promotions: d })));
      fetchTransactionsFromAtlas().then((t) => t && Array.isArray(t) && setDemo(p => ({ ...p, transactions: deduplicateTransactions(t) })));
      fetchSettingsFromAtlas().then((s) => s && setDemo(p => ({ ...p, settings: { ...p.settings, ...s } })));
      syncAccountsFromAtlas().then((acc) => {
        if (acc) setDemo(p => syncAccountsIntoDemoState(p, acc));
      });
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

    // Intelligent periodic synchronization with concurrency overlap guard
    let isSyncing = false;
    let syncCycle = 0;

    const syncAtlasData = async (forceFull = false) => {
      if (isSyncing) return;
      isSyncing = true;
      syncCycle++;

      try {
        const isFullSync = forceFull || syncCycle % 4 === 0;

        if (isFullSync) {
          // Consolidated full sync in 1 single request
          const fullData = await fetchShopInitFromAtlas().catch(() => null);
          if (fullData && applyFullSyncData(fullData)) {
            return;
          }
        }

        // Operational high-priority sync: Queue, Appointments & Notifications
        const [latestQueue, latestAppointments, latestNotifications] = await Promise.all([
          fetchQueueFromAtlas().catch(() => null),
          fetchAppointmentsFromAtlas().catch(() => null),
          fetchNotificationsFromAtlas().catch(() => null)
        ]);

        setDemo((prev) => {
          let updated = { ...prev };
          let changed = false;

          if (latestQueue && Array.isArray(latestQueue)) {
            const cleanQueue = deduplicateQueue(latestQueue);
            if (!areEntityListsEqual(prev.queue, cleanQueue, ['id', 'status', 'number', 'estimatedMinutes'])) {
              updated.queue = cleanQueue;
              changed = true;
            }
          }
          if (latestAppointments && Array.isArray(latestAppointments)) {
            const sorted = sortAppointmentsStably(latestAppointments);
            if (!areEntityListsEqual(prev.appointments, sorted, ['id', 'status', 'time', 'date', 'barberId', 'cancellationReason', 'paymentStatus'])) {
              updated.appointments = sorted;
              changed = true;
            }
          }
          if (latestNotifications && Array.isArray(latestNotifications)) {
            if (!areEntityListsEqual(prev.notifications, latestNotifications, ['id', 'read', 'title'])) {
              updated.notifications = latestNotifications;
              changed = true;
            }
          }

          if (changed) {
            persistDemoState(updated);
            return updated;
          }
          return prev;
        });
      } catch (err) {
        console.warn('Atlas periodic sync error:', err);
      } finally {
        isSyncing = false;
      }
    };

    const handleWindowFocus = () => {
      syncAtlasData(true);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncAtlasData(true);
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Controlled 6-second polling interval for operational data with overlap and visibility guard
    const syncInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      syncAtlasData(false);
    }, 6000);

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

      if (!e.key || e.key === 'biglanggwapo-demo-v12' || e.key === 'biglanggwapo-demo-v10' || e.key === 'biglanggwapo-accounts-v2') {
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
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
      if (barber.image && (!session.image || !session.photoUrl)) {
        updateSession({ image: barber.image, photoUrl: barber.image, barberId: barber.id });
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
      if (customer && customer.image && (!session.image || !session.photoUrl)) {
        updateSession({ image: customer.image, photoUrl: customer.image, customerId: customer.id });
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
      if (rec.image && (!session.image || !session.photoUrl)) {
        updateSession({ image: rec.image, photoUrl: rec.image, receptionistId: rec.id });
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
    const s = { ...nextSession };
    if (s.photoUrl && !s.image) s.image = s.photoUrl;
    if (s.image && !s.photoUrl) s.photoUrl = s.image;
    setSession(s);
    try { window.sessionStorage.setItem('biglanggwapo-session', JSON.stringify(s)); } catch {}
    setModal(null);
    notify(`Signed in as ${s.name}.`);
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
      const partial = typeof updater === 'function' ? updater(prev) : updater;
      const next = { ...prev, ...partial };
      if (next.photoUrl && !next.image) next.image = next.photoUrl;
      if (next.image && !next.photoUrl) next.photoUrl = next.image;
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
