import { useSyncExternalStore } from 'react';

export const ACCOUNTS = [
  { email: 'customer@biglangguapo.test', password: 'customer123', role: 'customer', name: 'Daniel Morgan' },
  { email: 'barber@biglangguapo.test', password: 'barber123', role: 'barber', name: 'Alex Rivera' },
  { email: 'reception@biglangguapo.test', password: 'reception123', role: 'receptionist', name: 'Front Desk' },
  { email: 'admin@biglangguapo.test', password: 'admin123', role: 'admin', name: 'Shop Admin' },
];

export const HOME = { customer: '/', receptionist: '/receptionist/dashboard', barber: '/barber/dashboard', admin: '/admin/dashboard' };

const KEY = 'bg-user';
const listeners = new Set();
let user = null;
try {
  const saved = JSON.parse(sessionStorage.getItem(KEY) || 'null');
  if (saved && HOME[saved.role]) user = saved; 
} catch { /* ignore */ }

const notify = () => listeners.forEach((f) => f());
export const login = (u) => { user = u; try { sessionStorage.setItem(KEY, JSON.stringify(u)); } catch { /* ignore */ } notify(); };
export const logout = () => { user = null; try { sessionStorage.removeItem(KEY); } catch { /* ignore */ } notify(); };
export const register = (a) => ACCOUNTS.push(a);

const subscribe = (cb) => { listeners.add(cb); return () => listeners.delete(cb); };
const getUser = () => user;
export const useUser = () => useSyncExternalStore(subscribe, getUser);
