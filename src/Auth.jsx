import { useState } from 'react';
import { ACCOUNTS, HOME, login, register } from './auth.js';
import { go } from './router.js';

export default function Auth() {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setErr(''); };

  const enter = (a) => { login(a); go(HOME[a.role], { replace: true }); };

  const submit = (e) => {
    e.preventDefault();
    const email = f.email.trim().toLowerCase();
    if (mode === 'signup') {
      if (!f.name.trim() || !email || f.password.length < 4) return setErr('Enter your name, an email and a password (4+ characters).');
      if (ACCOUNTS.some((a) => a.email === email)) return setErr('That email already has an account.');
      const a = { email, password: f.password, role: 'customer', name: f.name.trim() };
      register(a);
      return enter(a);
    }
    const a = ACCOUNTS.find((x) => x.email === email && x.password === f.password);
    return a ? enter(a) : setErr('Wrong email or password.');
  };

  return (
    <div className="auth">
      <form className="auth-card" onSubmit={submit}>
        <img className="auth-logo" src="/logo.png" alt="Biglang Guapo Barbershop" />
        <h1>BIGLANG GUAPO</h1>
        <p className="auth-sub">BARBERSHOP · EST. 2024</p>
        <div className="seg">
          <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>Log In</button>
          <button type="button" className={mode === 'signup' ? 'on' : ''} onClick={() => setMode('signup')}>Sign Up</button>
        </div>
        {mode === 'signup' && <label className="field">Full name<input value={f.name} onChange={set('name')} placeholder="Your name" /></label>}
        <label className="field">Email address<input type="email" value={f.email} onChange={set('email')} placeholder="you@email.com" /></label>
        <label className="field">Password<input type="password" value={f.password} onChange={set('password')} placeholder="••••••••" /></label>
        {err && <p className="err">{err}</p>}
        <button className="btn wide" type="submit">{mode === 'login' ? 'Log In' : 'Create account'}</button>
        <div className="demo">
          <p>Demo accounts</p>
          {ACCOUNTS.slice(0, 4).map((a) => (
            <button type="button" key={a.email} onClick={() => { setMode('login'); setF({ ...f, email: a.email, password: a.password }); setErr(''); }}>
              <b>{a.role}</b><span>{a.email}</span>
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
