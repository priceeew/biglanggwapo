import { connectDB } from '../../server/db.js';
import { Appointment } from '../../server/models/Appointment.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectDB();

    if (req.method === 'GET') {
      const appointments = await Appointment.find().lean();
      return res.status(200).json({ success: true, appointments });
    }

    if (req.method === 'POST') {
      const apt = req.body;
      if (!apt || !apt.id) {
        return res.status(400).json({ success: false, message: 'Missing appointment id' });
      }
      const saved = await Appointment.findOneAndUpdate(
        { id: apt.id },
        apt,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return res.status(200).json({ success: true, appointment: saved });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
