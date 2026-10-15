import { connectDB } from '../../server/db.js';
import { Service } from '../../server/models/Service.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectDB();

    if (req.method === 'GET') {
      const services = await Service.find().lean();
      return res.status(200).json({ success: true, services });
    }

    if (req.method === 'POST') {
      const service = req.body;
      if (!service || !service.id) {
        return res.status(400).json({ success: false, message: 'Missing service id' });
      }
      const { _id, ...cleanService } = service;
      const saved = await Service.findOneAndUpdate(
        { id: service.id },
        { $set: cleanService },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return res.status(200).json({ success: true, service: saved });
    }

    if (req.method === 'DELETE') {
      await Service.deleteMany({});
      return res.status(200).json({ success: true, message: 'All services cleared' });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
