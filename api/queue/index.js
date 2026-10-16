import { connectDB } from '../../server/db.js';
import { Queue } from '../../server/models/Queue.js';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectDB();

    if (req.method === 'GET') {
      const rawQueue = await Queue.find().sort({ createdAt: 1 }).lean();
      return res.status(200).json({ success: true, queue: deduplicateQueue(rawQueue) });
    }

    if (req.method === 'POST') {
      const entry = req.body;
      if (!entry || !entry.id) {
        return res.status(400).json({ success: false, message: 'Missing queue id' });
      }
      const { _id, ...cleanEntry } = entry;

      let filter = { id: entry.id };
      if (entry.appointmentId && !['Completed', 'Removed', 'Skipped'].includes(entry.status)) {
        const activeExisting = await Queue.findOne({
          appointmentId: entry.appointmentId,
          status: { $nin: ['Completed', 'Removed', 'Skipped'] }
        });
        if (activeExisting) {
          filter = { id: activeExisting.id };
          await Queue.deleteMany({
            appointmentId: entry.appointmentId,
            id: { $ne: activeExisting.id }
          });
        }
      }

      const saved = await Queue.findOneAndUpdate(
        filter,
        { $set: cleanEntry },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return res.status(200).json({ success: true, queueItem: saved });
    }

    if (req.method === 'DELETE') {
      const id = req.query.id;
      if (id) {
        await Queue.deleteOne({ id });
        return res.status(200).json({ success: true, message: 'Queue item deleted' });
      }
      await Queue.deleteMany({});
      return res.status(200).json({ success: true, message: 'All queue cleared' });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
