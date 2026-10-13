import { connectDB } from '../../server/db.js';
import { Account } from '../../server/models/Account.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectDB();

    if (req.method === 'GET') {
      const accountsList = await Account.find().lean();
      const accountsMap = {};
      for (const acc of accountsList) {
        accountsMap[acc.email.toLowerCase()] = acc;
      }
      return res.status(200).json({ success: true, accounts: accountsMap });
    }

    if (req.method === 'POST') {
      const payload = req.body;
      if (!payload || !payload.email) {
        return res.status(400).json({ success: false, message: 'Missing account email' });
      }
      const cleanEmail = payload.email.trim().toLowerCase();
      const saved = await Account.findOneAndUpdate(
        { email: cleanEmail },
        { ...payload, email: cleanEmail },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return res.status(200).json({ success: true, account: saved });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
