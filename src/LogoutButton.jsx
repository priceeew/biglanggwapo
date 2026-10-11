import { go } from './router.js';
import { logout } from './auth.js';

export function doLogout() {
  logout();
  go('/login', { replace: true });
}

export default function LogoutButton({ style, variant = 'light' }) {
  return (
    <button type="button" data-name="Log out" className={'logout-btn ' + variant} onClick={(e) => { e.stopPropagation(); doLogout(); }} style={{ position: 'absolute', ...style }}>
      Log out
    </button>
  );
}
