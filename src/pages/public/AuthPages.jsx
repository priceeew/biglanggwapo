import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Send, Check } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { accounts, saveAccount, validatePassword, validatePhone } from '../../data';
import { demoApi } from '../../mockService';

export function RegisterPage() {
  const { login, notify, commit } = useStore();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [regError, setRegError] = useState('');

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
    login(newCustomer);
    navigate('/booking');
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-standalone-card">
        <div className="modal-heading">
          <div className="modal-mark">
            <img src="/logo.png" alt="Biglang Gwapo Logo" className="modal-logo-img" />
          </div>
          <span className="eyebrow gold">Customer account</span>
          <h2 id="modal-title">Make the chair yours.</h2>
          <p>Create an account to hold your bookings and service history.</p>
        </div>

        <form className="form-stack" onSubmit={submitRegister}>
          <label className="field-label">Full name
            <input
              className="input"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                if (regError) setRegError('');
              }}
              required
              placeholder="Juan Dela Cruz"
              autoFocus
            />
          </label>
          <label className="field-label">Email
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => {
                setForm({ ...form, email: e.target.value });
                if (regError) setRegError('');
              }}
              required
              placeholder="you@biglanggwapo.com"
            />
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
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
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
          <button className="button button-dark button-full" type="submit">
            Create customer account <ArrowRight size={16} />
          </button>
        </form>

        <div className="modal-links">
          <Link to="/booking" className="text-button">Already have an account? Sign in</Link>
          <span>·</span>
          <Link to="/" className="text-button">Back to home</Link>
        </div>
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  const { notify } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleRecovery = (e) => {
    e.preventDefault();
    if (!email) return notify('Please enter your email.', 'error');
    setSent(true);
    notify('Demo recovery instructions sent.');
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-standalone-card">
        <div className="modal-heading">
          <div className="modal-mark">
            <Send size={22} />
          </div>
          <span className="eyebrow gold">Password recovery</span>
          <h2 id="modal-title">{sent ? 'Check your demo inbox' : 'Reset your password'}</h2>
          <p>
            {sent
              ? `We have processed a password reset request for ${email}.`
              : 'Enter the email linked to your account to recover your access.'}
          </p>
        </div>

        {!sent ? (
          <form className="form-stack" onSubmit={handleRecovery}>
            <label className="field-label">Email address
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@biglanggwapo.com"
                autoFocus
              />
            </label>
            <button className="button button-dark button-full" type="submit">
              Confirm recovery <Check size={16} />
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <button
              className="button button-dark button-full"
              onClick={() => navigate('/booking')}
            >
              Return to Sign in <ArrowRight size={16} />
            </button>
          </div>
        )}

        <div className="modal-links">
          <Link to="/booking" className="text-button">Back to login</Link>
          <span>·</span>
          <Link to="/" className="text-button">Back to home</Link>
        </div>
      </div>
    </div>
  );
}
