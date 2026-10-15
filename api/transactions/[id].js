import { connectDB } from '../../server/db.js';
import { Transaction } from '../../server/models/Transaction.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'DELETE') {
    try {
      await connectDB();
      const id = req.query.id;
      await Transaction.deleteOne({ id });
      return res.status(200).json({ success: true, message: 'Transaction deleted' });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}
