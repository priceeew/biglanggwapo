import { useSyncExternalStore } from 'react';

const subscribe = (cb) => {
  window.addEventListener('popstate', cb);
  window.addEventListener('nav', cb);
  return () => { window.removeEventListener('popstate', cb); window.removeEventListener('nav', cb); };
};


const clean = (p) => (p.length > 1 ? p.replace(/\/+$/, '') || '/' : p);

export function go(to, { replace = false } = {}) {
  if (clean(to) === clean(window.location.pathname)) return; 
  window.history[replace ? 'replaceState' : 'pushState']({}, '', to);
  window.dispatchEvent(new Event('nav'));
}
export const usePath = () => useSyncExternalStore(subscribe, () => clean(window.location.pathname));
