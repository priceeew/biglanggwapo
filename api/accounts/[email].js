import { connectDB } from '../../server/db.js';
import { Account } from '../../server/models/Account.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'DELETE') {
    try {
      await connectDB();
      const email = decodeURIComponent(req.query.email).trim().toLowerCase();
      if (email === 'admin@biglanggwapo.com') {
        return res.status(400).json({ success: false, message: 'Cannot delete default admin' });
      }
      await Account.deleteOne({ email });
      return res.status(200).json({ success: true, message: `Account ${email} deleted.` });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}
