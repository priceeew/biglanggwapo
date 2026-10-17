import { connectDB } from '../../server/db.js';
import { Account } from '../../server/models/Account.js';
import { Appointment } from '../../server/models/Appointment.js';
import { Barber } from '../../server/models/Barber.js';
import { Discount } from '../../server/models/Discount.js';
import { Inventory } from '../../server/models/Inventory.js';
import { Queue } from '../../server/models/Queue.js';
import { Review } from '../../server/models/Review.js';
import { Service } from '../../server/models/Service.js';
import { Transaction } from '../../server/models/Transaction.js';
import { Notification } from '../../server/models/Notification.js';
import { Settings } from '../../server/models/Settings.js';

function deduplicateQueue(rawList = []) {
  const seenApts = new Set();
  const seenIds = new Set();
  const result = [];
  for (const item of rawList) {
    if (!item || !item.id) continue;
    if (seenIds.has(item.id)) continue;
    seenIds.add(item.id);

    if (item.appointmentId && !['Completed', 'Removed', 'Skipped'].includes(item.status)) {
      if (seenApts.has(item.appointmentId)) {
        continue;
      }
      seenApts.add(item.appointmentId);
    }
    result.push(item);
  }
  return result;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectDB();

    const [
      accountsList,
      services,
      barbers,
      queue,
      appointments,
      reviews,
      inventory,
      discounts,
      transactions,
      notifications,
      dbSettings
    ] = await Promise.all([
      Account.find().lean(),
      Service.find().lean(),
      Barber.find().lean(),
      Queue.find().sort({ createdAt: 1 }).lean(),
      Appointment.find().sort({ date: 1, time: 1, createdAt: 1 }).lean(),
      Review.find().sort({ createdAt: -1 }).lean(),
      Inventory.find().lean(),
      Discount.find().lean(),
      Transaction.find().sort({ createdAt: -1 }).lean(),
      Notification.find().sort({ createdAt: -1 }).limit(100).lean(),
      Settings.findOne().lean()
    ]);

    const accountsMap = {};
    for (const acc of accountsList) {
      if (acc.email) {
        accountsMap[acc.email.toLowerCase()] = acc;
      }
    }

    const enrichedBarbers = barbers.map((b) => {
      const bReviews = reviews.filter((r) => 
        (r.barberId && r.barberId === b.id) ||
        (r.barber && b.name && r.barber.trim().toLowerCase() === b.name.trim().toLowerCase())
      );
      if (bReviews.length > 0) {
        const sum = bReviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
        const avg = Number((sum / bReviews.length).toFixed(1));
        return { ...b, rating: avg, reviewCount: bReviews.length };
      }
      return { ...b, rating: b.rating || 0, reviewCount: 0 };
    });

    return res.status(200).json({
      success: true,
      data: {
        accounts: accountsMap,
        services,
        barbers: enrichedBarbers,
        queue: deduplicateQueue(queue),
        appointments,
        reviews,
        inventory,
        promotions: discounts,
        transactions,
        notifications,
        settings: dbSettings || null
      }
    });
  } catch (error) {
    console.error('Init bootstrap error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
