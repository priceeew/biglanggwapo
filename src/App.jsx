import { Component, useEffect, useLayoutEffect, useState } from 'react';
import { go, usePath } from './router.js';
import { HOME, logout, useUser } from './auth.js';
import { screens } from './screens/index.jsx';
import Auth from './Auth.jsx';
import { doLogout } from './LogoutButton.jsx';

const roleOf = (p) => (p.startsWith('/receptionist') ? 'receptionist' : p.startsWith('/barber') ? 'barber' : p.startsWith('/admin') ? 'admin' : 'customer');

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('Screen crashed:', error, info?.componentStack); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="crash">
        <h2>Something went wrong on this page</h2>
        <pre>{String(this.state.error?.message || this.state.error)}</pre>
        <div className="row">
          <button className="btn" onClick={() => this.setState({ error: null })}>Try again</button>
          <button className="btn" onClick={doLogout}>Log out</button>
        </div>
      </div>
    );
  }
}

const useWindowWidth = () => {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const on = () => setW(window.innerWidth);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return w;
};

function Page({ screen: { Component: Screen, width, height, path } }) {
  const vw = useWindowWidth();
  useEffect(() => { window.scrollTo(0, 0); }, [path]);
  const zoom = Math.min(vw / width, 1.5);
  return (
    <div className="page">
      <div style={{ zoom, width, height: height || undefined, position: 'relative' }}>
        <Screen />
      </div>
    </div>
  );
}

export default function App() {
  const path = usePath();
  const user = useUser();

  useEffect(() => { if (path === '/login') logout(); }, [path]); // /login = log out

  const onLogin = path === '/login';
  const requested = screens.find((s) => s.path === path);
  const allowed = !!(user && requested && roleOf(path) === user.role); // roles stay in their own area
  const screen = user ? (allowed ? requested : screens.find((s) => s.path === HOME[user.role])) : null;

  useLayoutEffect(() => {
    if (user && !onLogin && screen && !allowed) go(screen.path, { replace: true });
  }, [user, onLogin, allowed, screen]);

  if (!user || onLogin || !screen) return <Auth />;
  return (
    <ErrorBoundary key={screen.path}>
      <Page screen={screen} />
    </ErrorBoundary>
  );
}
