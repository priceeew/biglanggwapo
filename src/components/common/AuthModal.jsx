import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Check, Eye, EyeOff, Send, X
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { accounts, saveAccount, validatePassword } from '../../data';
import { demoApi } from '../../mockService';
import { sendInviteNotification } from '../../services/api';

export function AuthModal() {
  const { modal, closeModal, login, notify, commit } = useStore();
  const navigate = useNavigate();
  const dialogRef = useRef(null);
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', role: 'customer' });
  const [regError, setRegError] = useState('');

  useEffect(() => {
    if (modal) {
      setMode(modal.type);
      setForm({ name: '', email: '', phone: '', password: '', confirm: '', role: modal.requestedRole || 'customer' });
      setRegError('');
      setTimeout(() => dialogRef.current?.focus(), 30);
    }
  }, [modal]);

  useEffect(() => {
    const key = (event) => {
      if (event.key === 'Escape' && modal && !modal.hideClose) closeModal();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [modal, closeModal]);

  if (!modal) return null;

  const handleLoginSubmit = (event) => {
    event.preventDefault();
    const cleanEmail = form.email.trim().toLowerCase();
    const cleanPassword = form.password;

    if (!cleanEmail || !cleanPassword) {
      return notify('Email and password are required.', 'error');
    }

    const matchedAccount = accounts[cleanEmail];
    if (!matchedAccount || matchedAccount.password !== cleanPassword) {
      return notify('Invalid email or password. Please check your credentials.', 'error');
    }

    // Role check if opened from a specific role gate
    if (modal.requestedRole && matchedAccount.role !== modal.requestedRole) {
      return notify(`This account has the role "${matchedAccount.role}", not "${modal.requestedRole}". Redirecting to its panel...`, 'warning');
    }

    login(matchedAccount);

    // Redirect to respective panel or original requested destination
    if (modal.targetPath && matchedAccount.role === 'customer') {
      navigate(modal.targetPath);
    } else {
      navigate(matchedAccount.redirectPath);
    }
  };

  const submitRegister = (event) => {
    event.preventDefault();
    setRegError('');
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password || !form.confirm) {
      const err = 'Please complete all registration fields.';
      setRegError(err);
      return notify(err, 'error');
    }
    const pwdError = validatePassword(form.password);
    if (pwdError) {
      setRegError(pwdError);
      return notify(pwdError, 'error');
    }
    if (form.password !== form.confirm) {
      const err = 'Passwords do not match.';
      setRegError(err);
      return notify(err, 'error');
    }
    const cleanEmail = form.email.trim().toLowerCase();
    const initials = form.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'CU';
    const newCustomer = {
      email: cleanEmail,
      password: form.password,
      role: 'customer',
      name: form.name.trim(),
      initials,
      customerId: `cust-${Date.now()}`,
      phone: form.phone.trim(),
      redirectPath: '/booking'
    };

    saveAccount(newCustomer);
    commit((state) => demoApi.addCustomer(state, {
      name: form.name.trim(),
      email: cleanEmail,
      phone: form.phone.trim()
    }));

    sendInviteNotification({
      to: cleanEmail,
      name: form.name.trim(),
      role: 'customer',
      password: form.password
    }).then((res) => {
      if (res.success) {
        notify(`Welcome email sent to ${cleanEmail}!`, 'success');
      }
    });

    login(newCustomer);
    if (modal.targetPath) {
      navigate(modal.targetPath);
    } else {
      navigate('/booking');
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !modal.hideClose) {
          closeModal();
        }
      }}
    >
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabIndex="-1" ref={dialogRef}>
        {!modal.hideClose && (
          <button className="modal-close" onClick={closeModal} aria-label="Close dialog">
            <X size={18} />
          </button>
        )}

        {mode === 'recovery' ? (
          <>
            <div className="modal-heading">
              <div className="modal-mark"><Send size={20} /></div>
              <span className="eyebrow gold">Password recovery</span>
              <h2 id="modal-title">We’ll keep it in the demo.</h2>
              <p>Demo credentials are preserved in the system.</p>
            </div>
            <form className="form-stack" onSubmit={(e) => { e.preventDefault(); notify('Demo recovery confirmed.'); closeModal(); }}>
              <label className="field-label">Email
                <input className="input" type="email" required placeholder="you@biglanggwapo.com" />
              </label>
              <button className="button button-dark button-full">Confirm recovery <Check size={16} /></button>
              <button type="button" className="text-button center-button" onClick={() => setMode('login')}>Back to login</button>
            </form>
          </>
        ) : mode === 'register' ? (
          <>
            <div className="modal-heading">
              <div className="modal-mark"><img src="/logo.png" alt="Biglang Gwapo Logo" className="modal-logo-img" /></div>
              <span className="eyebrow gold">Customer account</span>
              <h2 id="modal-title">Make the chair yours.</h2>
              <p>Create an account to hold your bookings and service history.</p>
            </div>
            <form className="form-stack" onSubmit={submitRegister}>
              <label className="field-label">Full name
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Juan Dela Cruz" />
              </label>
              <label className="field-label">Email
                <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="you@biglanggwapo.com" />
              </label>
              <label className="field-label">Phone number
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required placeholder="+63 917 000 0000" />
              </label>
              <label className="field-label">Password
                <div className="password-input">
                  <input
                    className="input"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => {
                      setForm({ ...form, password: e.target.value });
                      if (regError) setRegError('');
                    }}
                    required
                    minLength={8}
                    placeholder="Min. 8 characters + number + special"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px', fontSize: '10px' }}>
                  <span style={{ color: form.password.length >= 8 ? '#16a34a' : 'var(--muted)', fontWeight: form.password.length >= 8 ? '700' : 'normal' }}>
                    {form.password.length >= 8 ? '✓' : '○'} 8+ characters
                  </span>
                  <span style={{ color: /\d/.test(form.password) ? '#16a34a' : 'var(--muted)', fontWeight: /\d/.test(form.password) ? '700' : 'normal' }}>
                    {/\d/.test(form.password) ? '✓' : '○'} 1 number
                  </span>
                  <span style={{ color: /[!@#$%^&*(),.?":{}|<>_\-+=\\/\[\]~`]/.test(form.password) ? '#16a34a' : 'var(--muted)', fontWeight: /[!@#$%^&*(),.?":{}|<>_\-+=\\/\[\]~`]/.test(form.password) ? '700' : 'normal' }}>
                    {/[!@#$%^&*(),.?":{}|<>_\-+=\\/\[\]~`]/.test(form.password) ? '✓' : '○'} 1 special char
                  </span>
                </div>
              </label>
              <label className="field-label">Confirm password
                <input
                  className="input"
                  type="password"
                  value={form.confirm}
                  onChange={(e) => {
                    setForm({ ...form, confirm: e.target.value });
                    if (regError) setRegError('');
                  }}
                  required
                  minLength={8}
                  placeholder="Repeat password"
                />
                {form.confirm && (
                  <span style={{ color: form.password === form.confirm ? '#16a34a' : '#dc2626', fontSize: '10px', marginTop: '4px' }}>
                    {form.password === form.confirm ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </span>
                )}
              </label>
              {regError && (
                <div style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#991b1b', padding: '9px 12px', borderRadius: '6px', fontSize: '11px', marginTop: '2px' }}>
                  ⚠️ {regError}
                </div>
              )}
              <button className="button button-dark button-full" type="submit">Create customer account <ArrowRight size={16} /></button>
            </form>
            <div className="modal-links">
              <button className="text-button" onClick={() => setMode('login')}>Already have an account? Log in</button>
            </div>
          </>
        ) : (
          <>
            <div className="modal-heading">
              <div className="modal-mark">
                <img src="/logo.png" alt="Biglang Gwapo Logo" className="modal-logo-img" />
              </div>
              <span className="eyebrow gold">
                {modal.targetPath === '/booking'
                  ? 'PORTAL LOGIN'
                  : modal.requestedRole
                    ? `${modal.requestedRole.toUpperCase()} ACCESS`
                    : 'PORTAL LOGIN'}
              </span>
              <h2 id="modal-title">
                {modal.targetPath === '/booking' ? 'Sign in to book your chair' : 'Sign in to your panel'}
              </h2>
              <p>
                {modal.targetPath === '/booking'
                  ? 'Sign in with your customer account to choose your barber and reserve your slot.'
                  : 'Enter your email and password to open your respective panel.'}
              </p>
            </div>

            <form className="form-stack" onSubmit={handleLoginSubmit}>
              <label className="field-label">Email address
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="name@biglanggwapo.com"
                  autoFocus
                />
              </label>

              <label className="field-label">Password
                <div className="password-input">
                  <input
                    className="input"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>

              <button className="button button-dark button-full" type="submit">
                {modal.targetPath === '/booking' ? 'Sign in & Continue to Booking' : 'Sign in to panel'} <ArrowRight size={16} />
              </button>
            </form>

            <div className="modal-links">
              <button className="text-button" onClick={() => setMode('recovery')}>Forgot password?</button>
              <span>·</span>
              <button className="text-button" onClick={() => setMode('register')}>Create customer account</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
