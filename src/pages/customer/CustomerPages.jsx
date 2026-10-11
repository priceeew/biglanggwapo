import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, BadgeCheck, CalendarDays, Check, Clock3, Download,
  FileText, ListOrdered, Pencil, Plus, ReceiptText, Scissors, Send, ShieldCheck,
  Sparkles, Star, UserRound, Users, WalletCards
} from 'lucide-react';
import { useStore, currency, today, humanDate } from '../../context/StoreContext';
import { demoApi } from '../../mockService';
import {
  BentoStats, SectionCard, Toolbar, AppointmentCard, EmptyState,
  StatusBadge, QueueMini, ReviewCard
} from '../../components/common/UIComponents';
import { BookingPage } from '../public/PublicPages';

export function CustomerPage({ path }) {
  if (path === '/customer') return <CustomerDashboard />;
  if (path === '/booking') return <BookingPage />;
  if (path === '/my-appointments') return <CustomerAppointments />;
  if (path === '/queue-status') return <CustomerQueue />;
  if (path === '/service-history') return <CustomerHistory />;
  if (path === '/reviews') return <CustomerReviews />;
  return <CustomerProfile />;
}

export function CustomerDashboard() {
  const { demo, commit, notify } = useStore();
  const appointments = demo.appointments.filter((item) => item.customerId === 'cust-demo');
  const upcoming = appointments.find((item) => !['Completed', 'Cancelled'].includes(item.status));
  const completed = appointments.filter((item) => item.status === 'Completed');
  const queueEntry = demo.queue.find((item) => item.customerId === 'cust-demo' && !['Completed', 'Removed', 'Skipped'].includes(item.status));

  const cancel = (id) => {
    if (window.confirm('Cancel this appointment? This demo action cannot be undone.')) {
      commit((state) => demoApi.cancelAppointment(state, id));
      notify('Appointment cancelled.');
    }
  };

  const reschedule = (id) => {
    const date = window.prompt('New date (YYYY-MM-DD)', today);
    const time = date && window.prompt('New time (for example, 2:00 PM)', '2:00 PM');
    if (!date || !time) return;
    try {
      commit((state) => demoApi.rescheduleAppointment(state, id, date, time));
      notify('Appointment rescheduled and returned to Pending.');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  return (
    <>
      <BentoStats
        items={[
          ['Next appointment', upcoming ? `${humanDate(upcoming.date)} · ${upcoming.time}` : 'None scheduled', CalendarDays, upcoming ? upcoming.serviceName : 'Book your next visit'],
          ['Queue status', queueEntry ? `${queueEntry.number} (${queueEntry.status})` : 'Not in queue', ListOrdered, queueEntry ? `~${queueEntry.estimatedMinutes}m estimated wait` : 'Ready when you arrive'],
          ['Total visits', `${completed.length} completed`, Scissors, 'Recorded in shop ledger'],
          ['Preferred barber', upcoming?.barberName || 'Marco Reyes', Star, 'Master Barber']
        ]}
      />

      <div className="dashboard-grid two-thirds">
        <SectionCard
          title="Upcoming appointment"
          description="Your scheduled session in the barber chair."
          action={<Link to="/my-appointments" className="text-link">View all <ArrowRight size={14} /></Link>}
        >
          {upcoming ? (
            <div style={{ padding: '20px' }}>
              <AppointmentCard appointment={upcoming} onCancel={cancel} onReschedule={() => reschedule(upcoming.id)} />
            </div>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="No upcoming bookings"
              copy="Ready for your next fresh cut? Select a service and barber."
              action={<Link to="/booking" className="button button-dark">Book a chair <ArrowRight size={15} /></Link>}
            />
          )}
        </SectionCard>

        <SectionCard title="Quick actions">
          <div className="quick-actions">
            <Link to="/booking">
              <Scissors size={19} />
              <span><strong>Book a chair</strong><small>Choose service, barber & slot.</small></span>
              <ArrowUpRight size={16} />
            </Link>
            <Link to="/queue-status">
              <ListOrdered size={19} />
              <span><strong>Check live queue</strong><small>See wait time & position in line.</small></span>
              <ArrowUpRight size={16} />
            </Link>
            <Link to="/reviews">
              <Star size={19} />
              <span><strong>Rate your barber</strong><small>Leave feedback for your recent cut.</small></span>
              <ArrowUpRight size={16} />
            </Link>
            <Link to="/profile">
              <UserRound size={19} />
              <span><strong>My profile</strong><small>Update phone & preferences.</small></span>
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </SectionCard>
      </div>

      <div className="dashboard-grid two-thirds">
        <SectionCard
          title="Recent completed cuts"
          description="Your past services at Biglang Gwapo."
          action={<Link to="/service-history" className="text-link">Full history <ArrowRight size={14} /></Link>}
        >
          {completed.length ? (
            <div className="compact-list">
              {completed.slice(0, 3).map((item) => (
                <div className="compact-row" key={item.id}>
                  <span className="time-label">{humanDate(item.date)}</span>
                  <div className="compact-row-main">
                    <strong>{item.serviceName}</strong>
                    <small>with {item.barberName} · {currency(item.price)}</small>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No past visits yet" copy="Completed services will be logged here with digital receipts." />
          )}
        </SectionCard>

        <SectionCard title="Shop bulletin">
          <div className="shift-note">
            <span className="note-mark">“</span>
            <p>Welcome back, Miguel! Free cold brew & espresso at the lounge while waiting for your chair.</p>
            <small>Front Desk · Biglang Gwapo Pulilan</small>
          </div>
        </SectionCard>
      </div>
    </>
  );
}

export function CustomerAppointments() {
  const { demo, commit, notify } = useStore();
  const [tab, setTab] = useState('Upcoming');
  const mine = demo.appointments.filter((item) => item.customerId === 'cust-demo');
  const upcomingList = mine.filter((item) => !['Completed', 'Cancelled'].includes(item.status));
  const completedList = mine.filter((item) => item.status === 'Completed');
  const list = tab === 'Upcoming' ? upcomingList : completedList;
  const queueEntry = demo.queue.find((item) => item.customerId === 'cust-demo' && !['Completed', 'Removed', 'Skipped'].includes(item.status));

  const cancel = (id) => {
    if (window.confirm('Cancel this appointment? This demo action cannot be undone.')) {
      commit((state) => demoApi.cancelAppointment(state, id));
      notify('Appointment cancelled.');
    }
  };

  const reschedule = (id) => {
    const date = window.prompt('New date (YYYY-MM-DD)', today);
    const time = date && window.prompt('New time (for example, 2:00 PM)', '2:00 PM');
    if (!date || !time) return;
    try {
      commit((state) => demoApi.rescheduleAppointment(state, id, date, time));
      notify('Appointment rescheduled and returned to Pending.');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  return (
    <>
      <BentoStats
        items={[
          ['Upcoming visits', `${upcomingList.length} booked`, CalendarDays, upcomingList[0] ? `${humanDate(upcomingList[0].date)} · ${upcomingList[0].time}` : 'No upcoming bookings'],
          ['Queue status', queueEntry ? `${queueEntry.number} (${queueEntry.status})` : 'Not in queue', ListOrdered, queueEntry ? `~${queueEntry.estimatedMinutes}m wait` : 'Ready when you arrive'],
          ['Completed visits', `${completedList.length} finished`, Scissors, 'Logged in history'],
          ['Preferred barber', upcomingList[0]?.barberName || 'Marco Reyes', Star, 'Master Barber']
        ]}
      />

      <Toolbar
        title="My appointments"
        count={list.length}
        description="Keep your next visit close, without losing the history behind it."
        action={
          <Link to="/booking" className="button button-dark button-small">
            <Plus size={15} /> Book new chair
          </Link>
        }
      />

      <div className="tabs">
        <button className={tab === 'Upcoming' ? 'active' : ''} onClick={() => setTab('Upcoming')}>
          Upcoming <span>{upcomingList.length}</span>
        </button>
        <button className={tab === 'Completed' ? 'active' : ''} onClick={() => setTab('Completed')}>
          Completed <span>{completedList.length}</span>
        </button>
      </div>

      <SectionCard>
        {list.length ? (
          <div className="appointment-list" style={{ padding: '16px' }}>
            {list.map((item) => (
              <AppointmentCard
                key={item.id}
                appointment={item}
                onCancel={cancel}
                onReschedule={() => reschedule(item.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CalendarDays}
            title={tab === 'Upcoming' ? 'No upcoming appointments' : 'No completed appointments yet'}
            copy={tab === 'Upcoming' ? 'Book a chair and your next visit will land here.' : 'Completed appointments will appear here after your session.'}
            action={
              tab === 'Upcoming' && (
                <Link className="button button-dark" to="/booking">
                  Book now
                </Link>
              )
            }
          />
        )}
      </SectionCard>
    </>
  );
}

export function CustomerQueue() {
  const { demo } = useStore();
  const active = demo.queue.find((item) => item.customerId === 'cust-demo' && !['Completed', 'Removed', 'Skipped'].includes(item.status));
  const ahead = active ? demo.queue.filter((item) => item.status === 'Waiting' && item.id !== active.id).length : 0;

  return (
    <>
      <BentoStats
        items={[
          ['Your queue #', active?.number || '—', ListOrdered, active?.status || 'No active queue entry'],
          ['Assigned barber', active?.barberName || 'Not assigned', Scissors, 'On-duty barber'],
          ['Customers ahead', `${ahead} in line`, Users, 'Before your chair'],
          ['Estimated wait', active ? `~${Math.max(5, ahead * 15)} min` : '—', Clock3, 'Real-time estimate']
        ]}
      />

      <Toolbar
        title="Live queue status"
        description="Waiting times are estimates. Your barber or reception team can update the live state."
        action={
          <Link to="/booking" className="button button-ghost button-small">
            <Plus size={15} /> Book appointment
          </Link>
        }
      />

      <div className="split-layout">
        <SectionCard title="Your active queue ticket">
          <div style={{ padding: '20px' }}>
            <div className="queue-hero" style={{ marginBottom: '16px' }}>
              <div className="queue-number">
                <small>Your queue number</small>
                <strong>{active?.number || '—'}</strong>
                <span>{active?.status || 'No active queue entry'}</span>
              </div>
              <div className="queue-details">
                <span>
                  <small>Assigned barber</small>
                  <strong>{active?.barberName || 'Not assigned'}</strong>
                </span>
                <span>
                  <small>Customers ahead</small>
                  <strong>{ahead}</strong>
                </span>
                <span>
                  <small>Estimated wait</small>
                  <strong>{active ? `${Math.max(5, ahead * 15)} min` : '—'}</strong>
                </span>
              </div>
            </div>

            <div className="notice-bar">
              <Clock3 size={17} />
              <span>All wait times are dynamic estimates and update as barbers finish clients.</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Queue progression" description="What happens next">
          <div style={{ padding: '24px' }}>
            <div className="timeline">
              <div className="timeline-item done">
                <span><Check size={15} /></span>
                <div>
                  <strong>1. Booking / Walk-in registered</strong>
                  <small>Your session is on the shop schedule.</small>
                </div>
              </div>
              <div className={`timeline-item ${active ? 'done' : ''}`}>
                <span>{active ? <Check size={15} /> : '2'}</span>
                <div>
                  <strong>2. Join the assigned queue</strong>
                  <small>Reception marks you arrived and assigns your queue ticket.</small>
                </div>
              </div>
              <div className={`timeline-item ${active?.status === 'In Service' ? 'done' : ''}`}>
                <span>{active?.status === 'In Service' ? <Check size={15} /> : '3'}</span>
                <div>
                  <strong>3. Chair call</strong>
                  <small>Your barber calls your number to the styling chair.</small>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <div style={{ marginTop: '16px' }}>
        <SectionCard title="Shop queue overview" description="Live line at Pulilan branch">
          <QueueMini queue={demo.queue} />
        </SectionCard>
      </div>
    </>
  );
}

export function CustomerHistory() {
  const { demo, notify } = useStore();
  const [query, setQuery] = useState('');
  const history = demo.appointments.filter((item) => item.customerId === 'cust-demo' && item.status === 'Completed');
  const filtered = history.filter((item) => `${item.serviceName} ${item.barberName} ${item.notes || ''}`.toLowerCase().includes(query.toLowerCase()));
  const totalSpent = history.reduce((sum, item) => sum + (item.price || 0), 0);

  return (
    <>
      <BentoStats
        items={[
          ['Completed visits', `${history.length} services`, Scissors, 'All finished cuts'],
          ['Total spent', currency(totalSpent), WalletCards, 'Paid in full'],
          ['Favorite barber', history[0]?.barberName || 'Marco Reyes', Star, 'Master Barber'],
          ['Last visit', history[0] ? humanDate(history[0].date) : 'None', CalendarDays, 'Up to date']
        ]}
      />

      <Toolbar
        title="Service history"
        count={filtered.length}
        description="Every finished service, receipt, and barber note in one place."
        query={query}
        setQuery={setQuery}
        action={
          <button className="button button-ghost button-small" onClick={() => notify('Receipt export downloaded.')}>
            <Download size={15} /> Export
          </button>
        }
      />

      <SectionCard>
        {filtered.length ? (
          <div className="history-list" style={{ padding: '16px' }}>
            {filtered.map((item) => (
              <div className="history-card" key={item.id}>
                <div className="history-date">
                  <strong>{new Date(`${item.date}T00:00:00`).getDate()}</strong>
                  <span>{new Date(`${item.date}T00:00:00`).toLocaleDateString('en-PH', { month: 'short' })}</span>
                </div>
                <div className="history-main">
                  <span className="eyebrow">{item.serviceName}</span>
                  <h3>{item.barberName}</h3>
                  <p>{item.notes || 'Service completed with a clean, tailored finish.'}</p>
                </div>
                <div className="history-side">
                  <span>
                    <small>Paid</small>
                    <strong>{currency(item.price)}</strong>
                  </span>
                  <button
                    className="button button-ghost button-small"
                    onClick={() => notify(`Receipt for ${item.serviceName} (${currency(item.price)}) downloaded.`)}
                  >
                    <FileText size={15} /> Receipt
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No completed services yet"
            copy="Your finished visits and receipts will appear here once your service is marked complete."
          />
        )}
      </SectionCard>
    </>
  );
}

export function CustomerReviews() {
  const { demo, commit, notify } = useStore();
  const eligible = demo.appointments.find((item) => item.customerId === 'cust-demo' && item.status === 'Completed' && !demo.reviews.some((review) => review.appointmentId === item.id));
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const myReviews = demo.reviews.filter((review) => review.customer === 'Miguel Santos');

  const submit = (event) => {
    event.preventDefault();
    if (!eligible) return notify('Reviews are available after a completed demo service.', 'error');
    if (!rating || !comment.trim()) return notify('Choose a rating and add feedback.', 'error');
    commit((state) => demoApi.addReview(state, {
      customer: 'Miguel Santos',
      initials: 'MS',
      barber: eligible.barberName,
      rating,
      comment,
      appointmentId: eligible.id
    }));
    setRating(0);
    setComment('');
    notify('Thanks for sharing your review.');
  };

  return (
    <>
      <BentoStats
        items={[
          ['Eligible for review', eligible ? '1 service' : '0 pending', Star, eligible ? `With ${eligible.barberName}` : 'All caught up'],
          ['Your reviews', `${myReviews.length} submitted`, ReceiptText, 'Shared with shop'],
          ['Shop average', '4.9 ★', Sparkles, 'Community rating'],
          ['Recent barber', eligible?.barberName || myReviews[0]?.barber || 'Marco Reyes', Scissors, 'Master Barber']
        ]}
      />

      <Toolbar
        title="Reviews & ratings"
        count={myReviews.length}
        description="Leave a little signal for the next person choosing their chair."
      />

      <div className="split-layout">
        <SectionCard title="Write a review" description="Share feedback for your recent completed visit.">
          <div style={{ padding: '20px' }}>
            <div className="review-write" style={{ margin: 0 }}>
              <div>
                <span className="eyebrow gold">Eligible service</span>
                <h2>{eligible ? eligible.serviceName : 'No pending review'}</h2>
                <p>{eligible ? `Your completed visit with ${eligible.barberName} is ready for feedback.` : 'Complete another demo service to unlock a review.'}</p>
              </div>
              <form onSubmit={submit}>
                <div className="star-picker" aria-label="Choose a rating">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      type="button"
                      key={value}
                      className={value <= rating ? 'active' : ''}
                      onClick={() => setRating(value)}
                      aria-label={`${value} stars`}
                    >
                      <Star size={25} fill="currentColor" />
                    </button>
                  ))}
                </div>
                <textarea
                  className="input textarea"
                  disabled={!eligible}
                  placeholder="What stood out about the cut and barber?"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                />
                <button className="button button-dark" disabled={!eligible}>
                  Submit review <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Your submitted reviews" description="Feedback you provided">
          <div style={{ padding: '20px' }}>
            <div className="submitted-reviews" style={{ maxWidth: '100%' }}>
              {myReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
              {!myReviews.length && (
                <EmptyState
                  icon={Star}
                  title="No reviews yet"
                  copy="Reviews you write after your cuts will be listed here."
                />
              )}
            </div>
          </div>
        </SectionCard>
      </div>
    </>
  );
}

export function CustomerProfile() {
  const { session, notify, reset } = useStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(session?.name || 'Miguel Santos');
  const [phone, setPhone] = useState(session?.phone || '+63 917 555 0142');

  return (
    <>
      <BentoStats
        items={[
          ['Member profile', name, UserRound, 'Active customer'],
          ['Phone number', phone, BadgeCheck, 'SMS booking updates'],
          ['Account role', 'Customer', ShieldCheck, 'Biglang Gwapo regular'],
          ['Member since', 'October 2026', CalendarDays, 'Pulilan regular']
        ]}
      />

      <Toolbar
        title="My profile & settings"
        description="Keep your details ready for a smoother visit."
      />

      <div className="profile-layout">
        <div className="profile-card">
          <div className="profile-header">
            <span className="avatar avatar-xl">{session?.initials || 'MS'}</span>
            <div>
              <h2>{name}</h2>
              <p>{session?.email || 'customer@biglanggwapo.com'} · Member since 2026</p>
            </div>
            <button className="button button-ghost button-small" onClick={() => setEditing(!editing)}>
              <Pencil size={15} /> {editing ? 'Cancel' : 'Edit profile'}
            </button>
          </div>
          <div className="profile-fields">
            <label className="field-label">
              Full name
              <input className="input" disabled={!editing} value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label className="field-label">
              Email
              <input className="input" disabled value={session?.email || 'customer@biglanggwapo.com'} readOnly />
            </label>
            <label className="field-label">
              Phone number
              <input className="input" disabled={!editing} value={phone} onChange={(event) => setPhone(event.target.value)} />
            </label>
          </div>
          {editing && (
            <button
              className="button button-dark"
              onClick={() => {
                setEditing(false);
                notify('Profile details updated for this session.');
              }}
            >
              Save changes <Check size={16} />
            </button>
          )}
        </div>

        <div className="settings-card">
          <span className="eyebrow">Account settings</span>
          <div className="setting-row">
            <div>
              <strong>Booking notifications</strong>
              <small>Receive updates when queue moves or status changes.</small>
            </div>
            <button className="toggle active" aria-label="Booking notifications enabled">
              <span />
            </button>
          </div>
          <div className="setting-row">
            <div>
              <strong>Change password</strong>
              <small>Manage and update your account password.</small>
            </div>
            <button className="button button-ghost button-small" onClick={() => notify('Password update interface.')}>
              Open <ArrowRight size={14} />
            </button>
          </div>
          <div className="setting-row">
            <div>
              <strong>Reset demo data</strong>
              <small>Restore default appointments, queue and reviews.</small>
            </div>
            <button
              className="button button-danger button-small"
              onClick={() => window.confirm('Reset all demo data?') && reset()}
            >
              Reset data
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
