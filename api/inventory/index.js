import { connectDB } from '../../server/db.js';
import { Inventory } from '../../server/models/Inventory.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectDB();

    if (req.method === 'GET') {
      const inventory = await Inventory.find().lean();
      return res.status(200).json({ success: true, inventory });
    }

    if (req.method === 'POST') {
      const item = req.body;
      if (!item || !item.id) {
        return res.status(400).json({ success: false, message: 'Missing inventory id' });
      }
      const { _id, ...cleanItem } = item;
      const saved = await Inventory.findOneAndUpdate(
        { id: item.id },
        { $set: cleanItem },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return res.status(200).json({ success: true, item: saved });
    }

    if (req.method === 'DELETE') {
      await Inventory.deleteMany({});
      return res.status(200).json({ success: true, message: 'All inventory cleared' });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
