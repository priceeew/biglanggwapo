import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scissors, ArrowRight, FileText, CheckCircle2, CircleHelp, Search, Filter
} from 'lucide-react';
import { currency, humanDate, stars } from '../../context/StoreContext';

export function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`toast ${toast.tone}`} role="status">
      <span>{toast.tone === 'error' ? <CircleHelp size={17} /> : <CheckCircle2 size={17} />}</span>
      {toast.message}
    </div>
  );
}

export function PageFrame({ eyebrow, title, description, children }) {
  return (
    <div className="page-frame content-width">
      <div className="page-heading">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export function SectionIntro({ eyebrow, title, action, inverse = false }) {
  return (
    <div className={`section-intro ${inverse ? 'inverse' : ''}`}>
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function ServiceCard({ service, index, detailed = false }) {
  const navigate = useNavigate();
  return (
    <article className={`service-card ${detailed ? 'detailed' : ''}`}>
      <div className="service-card-top">
        <span className="service-index">0{index + 1}</span>
        <span className="service-icon"><Scissors size={19} /></span>
      </div>
      <h3>{service.name}</h3>
      <p>{service.description}</p>
      <div className="service-meta">
        <strong>{currency(service.price)}</strong>
        <span>{service.duration} min</span>
      </div>
      {detailed && (
        <button
          className="button button-dark button-small"
          onClick={() => navigate(`/booking?service=${service.id}`)}
        >
          Book this service <ArrowRight size={15} />
        </button>
      )}
    </article>
  );
}

export function BarberCard({ barber, compact = false }) {
  const navigate = useNavigate();
  return (
    <article className={`barber-card ${compact ? 'compact' : ''}`}>
      <div className="barber-card-top">
        <span className="avatar avatar-lg">{barber.initials}</span>
        <span className={`availability ${barber.working ? 'online' : ''}`}>
          <i />{barber.status}
        </span>
      </div>
      <div className="barber-card-body">
        <h3>{barber.name}</h3>
        <p>{barber.specialty}</p>
        <div className="rating-line">
          <span className="stars">{stars(barber.rating)}</span>
          <strong>{barber.rating}</strong>
        </div>
      </div>
      {!compact && (
        <>
          <p className="barber-bio">{barber.bio}</p>
          <button className="text-link" onClick={() => navigate('/booking')}>
            Choose {barber.name.split(' ')[0]} <ArrowRight size={15} />
          </button>
        </>
      )}
    </article>
  );
}

export function ReviewCard({ review }) {
  return (
    <article className="review-card">
      <div className="review-top">
        <span className="avatar avatar-sm">{review.initials}</span>
        <div>
          <strong>{review.customer}</strong>
          <small>{review.barber ? `Barber: ${review.barber}` : ''}</small>
        </div>
        <span className="stars">{stars(review.rating)}</span>
      </div>
      <p>“{review.comment}”</p>
      <small className="review-date">{humanDate(review.date)}</small>
    </article>
  );
}

export function AppointmentCard({ appointment, onCancel, onReschedule }) {
  return (
    <article className="appointment-card">
      <div className="appointment-date">
        <strong>{new Date(`${appointment.date}T00:00:00`).getDate()}</strong>
        <span>{new Date(`${appointment.date}T00:00:00`).toLocaleDateString('en-PH', { month: 'short' })}</span>
      </div>
      <div className="appointment-main">
        <div className="appointment-title">
          <span className="eyebrow">{appointment.time}</span>
          <StatusBadge status={appointment.status} />
        </div>
        <h3>{appointment.serviceName}</h3>
        <p>with {appointment.barberName} · {appointment.duration} min</p>
      </div>
      <div className="appointment-price">
        <strong>{currency(appointment.price)}</strong>
        <small>{appointment.paymentStatus}</small>
      </div>
      {!['Completed', 'Cancelled'].includes(appointment.status) && (
        <div className="appointment-actions">
          <button className="button button-ghost button-small" onClick={onReschedule}>Reschedule</button>
          <button className="text-button danger-text" onClick={() => onCancel(appointment.id)}>Cancel</button>
        </div>
      )}
    </article>
  );
}

export function AppointmentRow({ appointment }) {
  return (
    <div className="compact-row">
      <span className="time-label">{appointment.time}</span>
      <span className="compact-row-main">
        <strong>{appointment.customerName}</strong>
        <small>{appointment.serviceName} · {appointment.barberName}</small>
      </span>
      <StatusBadge status={appointment.status} />
    </div>
  );
}

export function QueueMini({ queue }) {
  const activeQueue = queue.filter((item) => !['Completed', 'Removed', 'Skipped'].includes(item.status));
  return (
    <div className="compact-list">
      {activeQueue.slice(0, 4).map((item) => (
        <div className="compact-row" key={item.id}>
          <span className="queue-pill">{item.number}</span>
          <span className="compact-row-main">
            <strong>{item.customerName}</strong>
            <small>{item.serviceName} · {item.barberName}</small>
          </span>
          <StatusBadge status={item.status} />
        </div>
      ))}
      {!activeQueue.length && <EmptyState title="Queue is clear" copy="New arrivals will appear here." />}
    </div>
  );
}

export function SectionCard({ title, description, action, children }) {
  return (
    <section className="section-card">
      <div className="section-card-head">
        {title && (
          <div>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
        )}
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatCard({ label, value, icon: CardIcon, note }) {
  return (
    <div className="stat-card">
      <div className="stat-icon"><CardIcon size={18} /></div>
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}

export function BentoStats({ items }) {
  return (
    <div className="stats-row">
      {items.map(([label, value, icon, note]) => (
        <StatCard key={label} label={label} value={value} icon={icon} note={note} />
      ))}
    </div>
  );
}

export function Toolbar({ title, description, count, query, setQuery, filter, setFilter, filters, filterLabels = {}, action }) {
  return (
    <div className="toolbar">
      <div>
        <div className="eyebrow">Operations</div>
        <h2>{title}{typeof count === 'number' && <span className="count-badge">{count}</span>}</h2>
        {description && <p>{description}</p>}
      </div>
      <div className="toolbar-actions">
        {setQuery && (
          <div className="inline-search">
            <Search size={16} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" />
          </div>
        )}
        {setFilter && (
          <div className="filter-select">
            <Filter size={15} />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              {filters.map((item) => (
                <option key={item} value={item}>{filterLabels[item] || item}</option>
              ))}
            </select>
          </div>
        )}
        {action}
      </div>
    </div>
  );
}

export function DataTable({ columns, children }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        {children}
      </table>
    </div>
  );
}

export function StatusBadge({ status }) {
  const safe = String(status || 'Pending');
  const slug = safe.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return <span className={`status-badge ${slug}`}><i />{safe}</span>;
}

export function EmptyState({ icon: EmptyIcon = FileText, title, copy, action }) {
  return (
    <div className="empty-state">
      <div className="empty-illustration"><EmptyIcon size={21} /></div>
      <h3>{title}</h3>
      {copy && <p>{copy}</p>}
      {action}
    </div>
  );
}

export function MiniChart({ tall = false }) {
  return (
    <div className={`mini-chart ${tall ? 'tall' : ''}`}>
      <div className="chart-axis">
        <span>₱8k</span><span>₱4k</span><span>₱0</span>
      </div>
      <svg viewBox="0 0 640 220" preserveAspectRatio="none" aria-label="Revenue chart">
        <defs>
          <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#B88A44" stopOpacity=".26" />
            <stop offset="1" stopColor="#B88A44" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 185 C60 160 75 168 120 148 S190 152 220 120 S290 132 328 96 S385 112 420 79 S480 98 520 62 S590 70 640 25 V220 H0 Z" fill="url(#chartFill)" />
        <path d="M0 185 C60 160 75 168 120 148 S190 152 220 120 S290 132 328 96 S385 112 420 79 S480 98 520 62 S590 70 640 25" fill="none" stroke="#B88A44" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <div className="chart-labels">
        <span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span>
      </div>
    </div>
  );
}
