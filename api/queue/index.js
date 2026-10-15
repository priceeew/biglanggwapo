import { connectDB } from '../../server/db.js';
import { Queue } from '../../server/models/Queue.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectDB();

    if (req.method === 'GET') {
      const queue = await Queue.find().sort({ createdAt: 1 }).lean();
      return res.status(200).json({ success: true, queue });
    }

    if (req.method === 'POST') {
      const entry = req.body;
      if (!entry || !entry.id) {
        return res.status(400).json({ success: false, message: 'Missing queue id' });
      }
      const { _id, ...cleanEntry } = entry;
      const saved = await Queue.findOneAndUpdate(
        { id: entry.id },
        { $set: cleanEntry },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return res.status(200).json({ success: true, queueItem: saved });
    }

    if (req.method === 'DELETE') {
      await Queue.deleteMany({});
      return res.status(200).json({ success: true, message: 'All queue cleared' });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
