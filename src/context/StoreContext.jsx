import React, { createContext, useContext, useState } from 'react';
import { loadDemoState, persistDemoState, resetDemoState } from '../mockService';

const StoreContext = createContext(null);

export const currency = (value) => `₱${Number(value || 0).toLocaleString('en-PH')}`;
export const today = '2026-10-12';
export const humanDate = (value) => value === today ? 'Today' : new Date(`${value}T00:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
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

  const reset = () => {
    commit(resetDemoState());
    notify('Demo data has been reset.');
  };

  const openModal = (type, options = {}) => setModal({ type, ...options });
  const closeModal = () => setModal(null);

  const value = { demo, session, modal, toast, notify, commit, login, logout, reset, openModal, closeModal };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}
