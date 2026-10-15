import { connectDB } from '../../server/db.js';
import { Transaction } from '../../server/models/Transaction.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectDB();

    if (req.method === 'GET') {
      const transactions = await Transaction.find().sort({ createdAt: -1 }).lean();
      return res.status(200).json({ success: true, transactions });
    }

    if (req.method === 'POST') {
      const txn = req.body;
      if (!txn || !txn.id) {
        return res.status(400).json({ success: false, message: 'Missing transaction id' });
      }
      const { _id, ...cleanTxn } = txn;
      const saved = await Transaction.findOneAndUpdate(
        { id: txn.id },
        { $set: cleanTxn },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return res.status(200).json({ success: true, transaction: saved });
    }

    if (req.method === 'DELETE') {
      await Transaction.deleteMany({});
      return res.status(200).json({ success: true, message: 'All transactions cleared' });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
