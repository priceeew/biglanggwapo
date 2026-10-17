import { connectDB } from '../../server/db.js';
import { Settings } from '../../server/models/Settings.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();

    if (req.method === 'GET') {
      const settings = await Settings.findOne().lean();
      return res.status(200).json({ success: true, settings });
    }

    if (req.method === 'POST') {
      const newSettings = req.body;
      const { _id, ...cleanSettings } = newSettings || {};
      cleanSettings.updatedAt = new Date();

      const existing = await Settings.findOne();
      let saved;
      if (existing) {
        saved = await Settings.findByIdAndUpdate(existing._id, { $set: cleanSettings }, { new: true }).lean();
      } else {
        saved = await Settings.create(cleanSettings);
      }
      return res.status(200).json({ success: true, settings: saved });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('Settings API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
