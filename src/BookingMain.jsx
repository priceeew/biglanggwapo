import { useMemo, useState } from 'react';
import { go } from './router.js';
import { useUser } from './auth.js';

const SERVICES = [
  { name: 'Signature cut', price: 40, mins: 45 },
  { name: 'Skin fade', price: 45, mins: 45 },
  { name: 'Beard sculpt', price: 25, mins: 25 },
  { name: 'Cut + beard', price: 60, mins: 60 },
  { name: 'Hot towel shave', price: 35, mins: 30 },
];
const BARBERS = ['Any available', 'Marcus Reed', 'Alex Rivera', 'Jamie Park'];
const STARTS = [600, 645, 690, 735, 840, 885, 930, 975, 1020]; // minutes from midnight
const hm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const taken = (d, m) => (d.getDate() * 3 + m / 15) % 4 === 0; // fake availability
const same = (a, b) => a && b && a.getTime() === b.getTime();

export default function BookingMain() {
  const user = useUser();
  const [b, setB] = useState({ service: SERVICES[0], barber: 'Alex Rivera', date: null, time: null, notes: '' });
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [view, setView] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const y = view.getFullYear(), m = view.getMonth();
  const cells = [...Array((view.getDay() + 6) % 7).fill(null), ...Array.from({ length: new Date(y, m + 1, 0).getDate() }, (_, i) => new Date(y, m, i + 1))];
  const closed = (d) => d < today || d.getDay() === 1; // Monday closed
  const ready = !!(b.date && b.time !== null);
  const done = [true, true, ready, false];
  const active = done.findIndex((x) => !x);
  const pick = (patch) => setB({ ...b, ...patch });

  return (
    <div className="bk">
      <p className="crumb">CUSTOMER / APPOINTMENT BOOKING ·</p>
      <h1 className="bk-title">YOUR NEXT GOOD HAIR DAY.</h1>
      <p className="sub">Choose your service, your person and a time that works.</p>

      <ol className="steps">
        {['Service', 'Barber', 'Date & time', 'Confirm'].map((s, i) => <li key={s} className={i === active ? 'on' : ''}>0{i + 1} / {s}{done[i] ? ' ✓' : ''}</li>)}
      </ol>

      <div className="cols">
        <div>
          <section className="panel">
            <h2>01 / Choose your service</h2>
            <div className="grid5">
              {SERVICES.map((s) => {
                const on = b.service.name === s.name;
                return (
                  <button key={s.name} className={'opt card' + (on ? ' sel' : '')} onClick={() => pick({ service: s, time: null })}>
                    <h3>{s.name}</h3><span>${s.price} / {s.mins} min</span><small>{on ? 'Selected ✓' : 'Select +'}</small>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="panel">
            <h2>02 / Pick your barber</h2>
            <div className="row">
              {BARBERS.map((n) => <button key={n} className={'opt' + (b.barber === n ? ' sel' : '')} onClick={() => pick({ barber: n })}>{n}{b.barber === n ? ' ✓' : ''}</button>)}
            </div>
          </section>

          <section className="panel">
            <h2>03 / Date &amp; time</h2>
            <div className="dt">
              <div>
                <div className="calhead">
                  <button className="opt" disabled={y === today.getFullYear() && m === today.getMonth()} onClick={() => setView(new Date(y, m - 1, 1))}>←</button>
                  <b>{view.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</b>
                  <button className="opt" onClick={() => setView(new Date(y, m + 1, 1))}>→</button>
                </div>
                <div className="days">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} className="dow">{d}</span>)}
                  {cells.map((d, i) => d
                    ? <button key={i} disabled={closed(d)} className={'opt day' + (same(b.date, d) ? ' sel lemon' : '')} onClick={() => pick({ date: d, time: b.time !== null && taken(d, b.time) ? null : b.time })}>{d.getDate()}</button>
                    : <span key={i} />)}
                </div>
                <p className="muted">Lemon: selected · Muted: unavailable</p>
              </div>
              <div>
                <h3 className="slothead">{b.date ? b.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: '2-digit' }) : 'Pick a date'}</h3>
                <p className="muted">{b.service.mins}-minute openings with {b.barber}. Allow a little time for your consultation.</p>
                <div className="slots">
                  {b.date && STARTS.map((s) => (
                    <button key={s} disabled={taken(b.date, s)} className={'opt slot' + (b.time === s ? ' sel lemon' : '')} onClick={() => pick({ time: s })}>{hm(s)}{b.time === s ? ' ✓' : ''}</button>
                  ))}
                </div>
              </div>
            </div>
            <p className="muted">Illustrative availability. Monday closed. Unavailable slots cannot be selected.</p>
          </section>

          <label className="notes">Anything your barber should know? (optional)
            <textarea rows={3} value={b.notes} onChange={(e) => pick({ notes: e.target.value })} placeholder="Keep some length on top; natural finish." />
          </label>
        </div>

        <aside>
          <div className="panel dark">
            <h2>YOUR CHAIR</h2>
            <h3 className="chair-svc">{b.service.name}</h3>
            <dl>
              <dt>Barber</dt><dd>{b.barber}</dd>
              <dt>Date</dt><dd>{b.date ? b.date.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).replace(',', '') : 'Pick a date'}</dd>
              <dt>Time</dt><dd>{b.time !== null ? `${hm(b.time)}–${hm(b.time + b.service.mins)}` : 'Pick a time'}</dd>
              <dt>Duration</dt><dd>{b.service.mins} minutes</dd>
              <dt>Customer</dt><dd>{user?.name}</dd>
              <dt>Service total</dt><dd className="total">${b.service.price}.00</dd>
            </dl>
            <p className="pay">Pay at the shop.</p>
            <button className="btn" disabled={!ready} onClick={() => go('/customer/confirmation')}>Confirm demo booking ↗</button>
            {!ready && <p className="pay">Pick a date and time to continue.</p>}
          </div>
          <div className="panel">
            <h2>Before you arrive</h2>
            <p>Arrive 5 minutes early. Need a different time? You can reschedule from My Appointments.</p>
            <p className="muted">By confirming, you agree to the sample booking policy. This screen does not create a real reservation.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
