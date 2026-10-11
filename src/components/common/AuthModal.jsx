import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Check, Eye, EyeOff, Send, X
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { accounts } from '../../data';

export function AuthModal() {
  const { modal, closeModal, login, notify } = useStore();
  const navigate = useNavigate();
  const dialogRef = useRef(null);
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', role: 'receptionist' });

  useEffect(() => {
    if (modal) {
      setMode(modal.type);
      if (modal.type === 'staff') {
        const defaultRole = modal.requestedRole || 'admin';
        const staffAcc = Object.values(accounts).find((a) => a.role === defaultRole) || accounts['admin@biglanggwapo.com'];
        setForm({ name: '', email: staffAcc.email, phone: '', password: staffAcc.password, confirm: '', role: defaultRole });
      } else if (modal.targetPath === '/booking' || modal.requestedRole === 'customer') {
        const custAcc = accounts['customer@biglanggwapo.com'];
        setForm({ name: '', email: custAcc ? custAcc.email : '', phone: '', password: custAcc ? custAcc.password : '', confirm: '', role: 'customer' });
      } else {
        setForm({ name: '', email: '', phone: '', password: '', confirm: '', role: modal.requestedRole || 'customer' });
      }
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
    if (!form.name || !form.email || !form.phone || !form.password) {
      return notify('Please complete all registration fields.', 'error');
    }
    if (form.password !== form.confirm) {
      return notify('Passwords do not match.', 'error');
    }
    const cleanEmail = form.email.trim().toLowerCase();
    const newCustomer = {
      email: cleanEmail,
      password: form.password,
      role: 'customer',
      name: form.name,
      initials: form.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'CU',
      customerId: `cust-${Date.now()}`,
      phone: form.phone,
      redirectPath: '/booking'
    };
    accounts[cleanEmail] = newCustomer;
    login(newCustomer);
    if (modal.targetPath) {
      navigate(modal.targetPath);
    } else {
      navigate('/booking');
    }
  };

  const fillQuickAccount = (email) => {
    const acc = accounts[email];
    if (acc) {
      setForm((prev) => ({ ...prev, email: acc.email, password: acc.password }));
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
                  <input className="input" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>
              <label className="field-label">Confirm password
                <input className="input" type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required placeholder="Repeat password" />
              </label>
              <button className="button button-dark button-full">Create customer account <ArrowRight size={16} /></button>
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

            <div className="demo-accounts-box" style={{ marginTop: '20px', padding: '14px', background: '#f8f6f2', borderRadius: '8px', border: '1px solid #e7e4dc' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888', marginBottom: '8px' }}>
                Quick Fill Demo Accounts:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {Object.entries(accounts).map(([emailKey, acc]) => {
                  const isRecommended = modal.targetPath === '/booking' && acc.role === 'customer';
                  return (
                    <button
                      key={emailKey}
                      type="button"
                      onClick={() => fillQuickAccount(emailKey)}
                      className={`button button-ghost button-small ${isRecommended ? 'button-soft' : ''}`}
                      style={{
                        textAlign: 'left',
                        justifyContent: 'flex-start',
                        padding: '6px 8px',
                        fontSize: '11px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        borderColor: isRecommended ? 'var(--gold)' : undefined
                      }}
                    >
                      <span style={{ fontWeight: '700', textTransform: 'capitalize' }}>
                        {acc.role} {isRecommended && '★ (Booking)'}
                      </span>
                      <small style={{ color: isRecommended ? '#6d4e21' : '#777', fontSize: '10px' }}>{acc.email}</small>
                    </button>
                  );
                })}
              </div>
            </div>

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
