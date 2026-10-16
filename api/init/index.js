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
      transactions
    ] = await Promise.all([
      Account.find().lean(),
      Service.find().lean(),
      Barber.find().lean(),
      Queue.find().sort({ createdAt: 1 }).lean(),
      Appointment.find().sort({ createdAt: -1 }).lean(),
      Review.find().sort({ createdAt: -1 }).lean(),
      Inventory.find().lean(),
      Discount.find().lean(),
      Transaction.find().sort({ createdAt: -1 }).lean()
    ]);

    const accountsMap = {};
    for (const acc of accountsList) {
      if (acc.email) {
        accountsMap[acc.email.toLowerCase()] = acc;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        accounts: accountsMap,
        services,
        barbers,
        queue,
        appointments,
        reviews,
        inventory,
        promotions: discounts,
        transactions
      }
    });
  } catch (error) {
    console.error('Init bootstrap error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
