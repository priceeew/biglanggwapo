import { connectDB } from '../../server/db.js';
import { Barber } from '../../server/models/Barber.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectDB();

    if (req.method === 'GET') {
      const barbers = await Barber.find().lean();
      return res.status(200).json({ success: true, barbers });
    }

    if (req.method === 'POST') {
      const barber = req.body;
      if (!barber || !barber.id) {
        return res.status(400).json({ success: false, message: 'Missing barber id' });
      }
      const saved = await Barber.findOneAndUpdate(
        { id: barber.id },
        barber,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return res.status(200).json({ success: true, barber: saved });
    }

    if (req.method === 'DELETE') {
      await Barber.deleteMany({});
      return res.status(200).json({ success: true, message: 'All barbers cleared' });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
