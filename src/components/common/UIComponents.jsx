import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Scissors, ArrowRight, FileText, CheckCircle2, CircleHelp, Search, Filter, TrendingUp,
  ZoomIn, X, AlertTriangle
} from 'lucide-react';
import { useStore, currency, humanDate, stars } from '../../context/StoreContext';
import { getAccounts } from '../../data';

export function getCustomerPhoto(review, demo) {
  if (!review) return '';
  if (review.customerImage) return review.customerImage;
  if (review.customerPhoto) return review.customerPhoto;

  const cleanName = (review.customer || '').toLowerCase().trim();
  const cId = review.customerId;

  // 1. Look up in demo.customers
  const cust = (demo?.customers || []).find((c) =>
    (cId && c.id === cId) ||
    (cleanName && c.name && c.name.toLowerCase().trim() === cleanName)
  );
  if (cust?.photoUrl) return cust.photoUrl;
  if (cust?.image) return cust.image;

  // 2. Look up in registered accounts
  const accounts = typeof getAccounts === 'function' ? getAccounts() : {};
  const matchedAcc = Object.values(accounts || {}).find((a) =>
    (cId && (a.customerId === cId || a._id === cId || a.id === cId)) ||
    (cleanName && a.name && a.name.toLowerCase().trim() === cleanName)
  );
  if (matchedAcc?.photoUrl) return matchedAcc.photoUrl;
  if (matchedAcc?.image) return matchedAcc.image;

  return '';
}

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
      {service.image && (
        <div className="service-card-media">
          <img src={service.image} alt={service.name} className="service-img" loading="lazy" />
        </div>
      )}
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
        {barber.image ? (
          <img
            src={barber.image}
            alt={barber.name}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--line)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.nextElementSibling) {
                e.currentTarget.nextElementSibling.style.display = 'inline-grid';
              }
            }}
          />
        ) : null}
        <span className="avatar avatar-lg" style={{ display: barber.image ? 'none' : 'inline-grid' }}>
          {barber.initials || (barber.name || '').slice(0, 2).toUpperCase()}
        </span>
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

export function ReviewPhotoModal({ modalData, onClose }) {
  if (!modalData) return null;
  const { image, review } = modalData;
  const { demo } = useStore();
  const appointment = demo?.appointments?.find((a) => a.id === review?.appointmentId);
  const serviceName = review?.serviceName || review?.service || appointment?.serviceName;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          backgroundColor: '#161616',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            background: 'rgba(0, 0, 0, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            color: '#fff',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'background 0.2s'
          }}
          aria-label="Close photo preview"
        >
          <X size={18} />
        </button>

        <div
          style={{
            flex: 1,
            backgroundColor: '#0a0a0a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            maxHeight: '65vh',
            minHeight: '260px',
            overflow: 'hidden'
          }}
        >
          <img
            src={image}
            alt={review?.customer ? `${review.customer}'s haircut` : 'Customer haircut review photo'}
            style={{
              maxWidth: '100%',
              maxHeight: '65vh',
              objectFit: 'contain',
              display: 'block'
            }}
          />
        </div>

        {review && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div>
                <strong style={{ fontSize: '15px', color: '#fff', display: 'block' }}>{review.customer}</strong>
                <small style={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '3px' }}>
                  {serviceName && (
                    <span style={{ color: 'var(--gold, #d4af37)', fontWeight: 600, background: 'rgba(212,175,55,0.12)', padding: '1px 7px', borderRadius: '4px', border: '1px solid rgba(212,175,55,0.3)' }}>
                      {serviceName}
                    </span>
                  )}
                  {review.barber ? <span>Barber: {review.barber}</span> : null}
                  {review.date ? <span>• {humanDate(review.date)}</span> : null}
                </small>
              </div>
              <div style={{ display: 'flex', color: 'var(--gold, #d4af37)' }}>
                {stars(review.rating || 5)}
              </div>
            </div>
            {review.comment && (
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)', fontSize: '13.5px', fontStyle: 'italic', lineHeight: 1.4, marginTop: '8px' }}>
                “{review.comment}”
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ReviewCard({ review, onImageClick, children }) {
  const { demo } = useStore();
  const appointment = demo?.appointments?.find((a) => a.id === review.appointmentId);
  const serviceName = review.serviceName || review.service || appointment?.serviceName;
  const customerPhoto = getCustomerPhoto(review, demo);

  return (
    <article className="review-card">
      <div className="review-top">
        {customerPhoto ? (
          <>
            <img
              key={customerPhoto}
              src={customerPhoto}
              alt={review.customer}
              className="avatar avatar-sm"
              style={{
                width: 34,
                height: 34,
                objectFit: 'cover',
                borderRadius: '50%',
                border: '1.5px solid var(--gold)',
                flexShrink: 0,
                display: 'block'
              }}
              onLoad={(e) => {
                e.currentTarget.style.display = 'block';
                if (e.currentTarget.nextElementSibling) e.currentTarget.nextElementSibling.style.display = 'none';
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextElementSibling) e.currentTarget.nextElementSibling.style.display = 'inline-grid';
              }}
            />
            <span className="avatar avatar-sm" style={{ display: 'none' }}>
              {review.initials || (review.customer ? review.customer.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() : 'CU')}
            </span>
          </>
        ) : (
          <span className="avatar avatar-sm">
            {review.initials || (review.customer ? review.customer.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() : 'CU')}
          </span>
        )}
        <div>
          <strong>{review.customer}</strong>
          <small style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
            {serviceName && (
              <span style={{ color: 'var(--gold, #d4af37)', fontWeight: 600, fontSize: '12px' }}>
                {serviceName}
              </span>
            )}
            {review.barber ? <span>Barber: {review.barber}</span> : null}
          </small>
        </div>
        <span className="stars">{stars(review.rating)}</span>
      </div>
      <p>“{review.comment}”</p>
      {review.image && (
        <div style={{ marginTop: '10px', marginBottom: '8px' }}>
          <div
            onClick={() => onImageClick?.(review.image, review)}
            style={{
              display: 'inline-flex',
              position: 'relative',
              cursor: onImageClick ? 'pointer' : 'default',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1.5px solid var(--gold, #d4af37)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.18)'
            }}
            title={onImageClick ? 'Click to view full image' : undefined}
          >
            <img
              src={review.image}
              alt="Haircut review thumbnail"
              style={{
                width: '68px',
                height: '68px',
                objectFit: 'cover',
                display: 'block',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => { if (onImageClick) e.currentTarget.style.transform = 'scale(1.08)'; }}
              onMouseLeave={(e) => { if (onImageClick) e.currentTarget.style.transform = 'scale(1)'; }}
            />
            {onImageClick && (
              <span
                style={{
                  position: 'absolute',
                  bottom: 2,
                  right: 2,
                  background: 'rgba(0,0,0,0.7)',
                  color: '#fff',
                  borderRadius: '4px',
                  padding: '2px 4px',
                  fontSize: '9.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  pointerEvents: 'none'
                }}
              >
                <ZoomIn size={10} /> View
              </span>
            )}
          </div>
        </div>
      )}
      <small className="review-date">{humanDate(review.date)}</small>
      {children}
    </article>
  );
}

export function AppointmentCard({ appointment, onCancel, onReschedule }) {
  const { demo } = useStore();
  const matchedBarber = demo?.barbers?.find((b) => b.id === appointment.barberId || b.name === appointment.barberName);
  const barberPhoto = appointment.barberImage || matchedBarber?.image;

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
        <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {barberPhoto ? (
            <img
              src={barberPhoto}
              alt={appointment.barberName}
              style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--line)', flexShrink: 0 }}
            />
          ) : (
            <span className="avatar avatar-xs" style={{ width: '22px', height: '22px', fontSize: '9px', flexShrink: 0 }}>
              {(appointment.barberName || 'BR').slice(0, 2).toUpperCase()}
            </span>
          )}
          <span>with {appointment.barberName} · {appointment.duration} min</span>
        </p>
      </div>
      <div className="appointment-price">
        <strong>{currency(appointment.price)}</strong>
        <small>{appointment.paymentStatus}</small>
      </div>
      {appointment.status === 'In Service' ? (
        <div className="appointment-actions">
          <span style={{ fontSize: '12px', padding: '6px 12px', background: 'rgba(197, 160, 89, 0.15)', color: 'var(--gold)', fontWeight: 600, borderRadius: '6px', border: '1px solid rgba(197, 160, 89, 0.3)' }}>
            In Chair · Haircut in progress
          </span>
        </div>
      ) : appointment.status === 'Cancelled' ? (
        <div style={{ gridColumn: '2 / -1', marginTop: '6px' }}>
          <div className="cancellation-reason-box">
            <strong>
              <AlertTriangle size={13} />
              Cancelled{appointment.cancellationReason ? `: ${appointment.cancellationReason}` : ''}
            </strong>
            {appointment.cancellationMessage ? (
              <p>{appointment.cancellationMessage}</p>
            ) : (
              <p>This appointment has been cancelled.</p>
            )}
          </div>
          <div className="appointment-actions" style={{ marginTop: '10px' }}>
            <Link
              to={`/booking?service=${appointment.serviceId || ''}&barber=${appointment.barberId || ''}`}
              className="button button-dark button-small"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Scissors size={13} /> Rebook Chair
            </Link>
          </div>
        </div>
      ) : !['Completed', 'Cancelled'].includes(appointment.status) && (
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

export function MiniChart({ tall = false, transactions = [] }) {
  const hasData = transactions && transactions.length > 0;

  if (!hasData) {
    return (
      <div className={`mini-chart ${tall ? 'tall' : ''}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: tall ? '240px' : '180px', textAlign: 'center', padding: '24px' }}>
        <TrendingUp size={26} style={{ color: 'var(--muted)', opacity: 0.5, marginBottom: '8px' }} />
        <span style={{ color: 'var(--muted)', fontSize: '13px', fontWeight: 500 }}>No revenue recorded yet</span>
        <small style={{ color: 'var(--muted)', fontSize: '11px', opacity: 0.75, marginTop: '4px', maxWidth: '300px' }}>
          Revenue trends will plot automatically as transactions are completed.
        </small>
      </div>
    );
  }

  const maxVal = Math.max(...transactions.map((t) => Number(t.amount) || 0), 1000);
  const yMaxText = `₱${maxVal >= 1000 ? (maxVal / 1000).toFixed(1) + 'k' : maxVal}`;
  const yMidText = `₱${(maxVal / 2) >= 1000 ? (maxVal / 2000).toFixed(1) + 'k' : Math.round(maxVal / 2)}`;

  const points = transactions.slice(-7).map((t, i, arr) => {
    const x = arr.length > 1 ? (i / (arr.length - 1)) * 600 + 20 : 320;
    const y = 200 - Math.min(170, Math.max(20, ((Number(t.amount) || 0) / maxVal) * 160));
    return { x, y, label: t.date ? t.date.slice(5) : `T${i + 1}`, amount: t.amount };
  });

  const pathD = points.length === 1
    ? `M0 ${points[0].y} L640 ${points[0].y}`
    : points.reduce((acc, pt, i) => (i === 0 ? `M${pt.x} ${pt.y}` : `${acc} L${pt.x} ${pt.y}`), '');

  const areaD = points.length === 1
    ? `M0 ${points[0].y} L640 ${points[0].y} V220 H0 Z`
    : `${pathD} V220 H${points[0].x} Z`;

  return (
    <div className={`mini-chart ${tall ? 'tall' : ''}`}>
      <div className="chart-axis">
        <span>{yMaxText}</span><span>{yMidText}</span><span>₱0</span>
      </div>
      <svg viewBox="0 0 640 220" preserveAspectRatio="none" aria-label="Revenue chart">
        <defs>
          <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#B88A44" stopOpacity=".26" />
            <stop offset="1" stopColor="#B88A44" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#chartFill)" />
        <path d={pathD} fill="none" stroke="#B88A44" strokeWidth="3" strokeLinecap="round" />
        {points.map((pt, i) => (
          <circle key={i} cx={pt.x} cy={pt.y} r="4" fill="#B88A44" />
        ))}
      </svg>
      <div className="chart-labels">
        {points.map((pt, i) => (
          <span key={i}>{pt.label}</span>
        ))}
      </div>
    </div>
  );
}
