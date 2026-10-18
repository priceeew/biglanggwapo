import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Check, Eye, EyeOff, Send, X
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { accounts, saveAccount, validatePassword, validatePhone } from '../../data';
import { demoApi } from '../../mockService';
import { sendInviteNotification } from '../../services/api';

export function AuthModal() {
  const { demo, modal, closeModal, login, notify, commit } = useStore();
  const navigate = useNavigate();
  const dialogRef = useRef(null);
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    if (matchedAccount.status === 'Inactive' || matchedAccount.active === false) {
      return notify('This account has been deactivated. Please contact the administrator.', 'error');
    }

    if (matchedAccount.role === 'barber') {
      const barber = demo?.barbers?.find((b) => b.id === matchedAccount.barberId || (b.email && b.email.toLowerCase() === cleanEmail));
      if (barber && (barber.status === 'Inactive' || barber.leaveStatus === 'Inactive' || (barber.working === false && barber.status === 'Inactive'))) {
        return notify('This barber account has been deactivated. Please contact the administrator.', 'error');
      }
    }

    if (matchedAccount.role === 'customer') {
      const customer = demo?.customers?.find((c) => c.id === matchedAccount.customerId || (c.email && c.email.toLowerCase() === cleanEmail));
      if (customer && customer.status === 'Inactive') {
        return notify('This customer account has been deactivated. Please contact the administrator.', 'error');
      }
    }

    if (matchedAccount.role === 'receptionist') {
      const rec = demo?.receptionists?.find((r) => r.id === matchedAccount.receptionistId || (r.email && r.email.toLowerCase() === cleanEmail));
      if (rec && rec.status === 'Inactive') {
        return notify('This receptionist account has been deactivated. Please contact the administrator.', 'error');
      }
    }

    const isEmployeeModal = modal.type === 'employeeLogin' || modal.portal === 'employee';

    // Rule: Employee/Staff/Admin CANNOT log in through the Customer portal
    if (!isEmployeeModal && matchedAccount.role !== 'customer') {
      return notify('This login is for customers only. Staff and admins must log in via the Staff & Employee Portal at the bottom of the page.', 'error');
    }

    // Rule: Customer accounts CANNOT log in through the Employee portal
    if (isEmployeeModal && matchedAccount.role === 'customer') {
      return notify('Customer accounts cannot access the Employee & Staff Portal. Please use the Customer Login at the top.', 'error');
    }

    // Role check if opened from a specific role gate (e.g. /admin, /barber, /receptionist)
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

  const submitRegister = async (event) => {
    event.preventDefault();
    setRegError('');
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password || !form.confirm) {
      const err = 'Please complete all registration fields.';
      setRegError(err);
      return notify(err, 'error');
    }
    const phoneError = validatePhone(form.phone);
    if (phoneError) {
      setRegError(phoneError);
      return notify(phoneError, 'error');
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

    await saveAccount(newCustomer);
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
              <h2 id="modal-title">Reset your password</h2>
              <p>Enter your account email to receive recovery instructions.</p>
            </div>
            <form className="form-stack" onSubmit={(e) => { e.preventDefault(); notify('Password recovery instructions sent.'); closeModal(); }}>
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
                <input
                  className="input"
                  type="tel"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 11);
                    setForm({ ...form, phone: clean });
                    if (regError) setRegError('');
                  }}
                  maxLength={11}
                  required
                  placeholder="09170000000"
                />
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
                    placeholder="*********"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>
              <label className="field-label">Confirm password
                <div className="password-input">
                  <input
                    className="input"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirm}
                    onChange={(e) => {
                      setForm({ ...form, confirm: e.target.value });
                      if (regError) setRegError('');
                    }}
                    required
                    minLength={8}
                    placeholder="*********"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {form.confirm && (
                  <span style={{ color: form.password === form.confirm ? '#16a34a' : '#dc2626', fontSize: '10px', marginTop: '4px' }}>
                    {form.password === form.confirm ? 'Passwords match' : 'Passwords do not match'}
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
                {modal.type === 'employeeLogin' || modal.portal === 'employee'
                  ? 'STAFF & EMPLOYEE ACCESS'
                  : modal.targetPath === '/booking'
                    ? 'CUSTOMER BOOKING LOGIN'
                    : modal.requestedRole
                      ? `${modal.requestedRole.toUpperCase()} ACCESS`
                      : 'CUSTOMER LOGIN'}
              </span>
              <h2 id="modal-title">
                {modal.type === 'employeeLogin' || modal.portal === 'employee'
                  ? 'Staff & Employee Portal'
                  : modal.targetPath === '/booking'
                    ? 'Sign in to book your chair'
                    : 'Customer Sign In'}
              </h2>
              <p>
                {modal.type === 'employeeLogin' || modal.portal === 'employee'
                  ? 'Authorized staff login for Barbers, Receptionists, and Administrators.'
                  : modal.targetPath === '/booking'
                    ? 'Sign in with your customer account to choose your barber and reserve your slot.'
                    : 'Enter your customer email and password to access your account.'}
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
              {!(modal.type === 'employeeLogin' || modal.portal === 'employee') && (
                <>
                  <span>·</span>
                  <button className="text-button" onClick={() => setMode('register')}>Create customer account</button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
