import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Send, Check } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { accounts } from '../../data';

export function RegisterPage() {
  const { login, notify } = useStore();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });

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
              onChange={(e) => setForm({ ...form, name: e.target.value })}
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
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              placeholder="you@biglanggwapo.com"
            />
          </label>
          <label className="field-label">Phone number
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
              placeholder="+63 917 000 0000"
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
          <label className="field-label">Confirm password
            <input
              className="input"
              type="password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              required
              placeholder="Repeat password"
            />
          </label>
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
