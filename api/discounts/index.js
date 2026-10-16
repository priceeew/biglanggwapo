import { connectDB } from '../../server/db.js';
import { Discount } from '../../server/models/Discount.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectDB();

    if (req.method === 'GET') {
      const discounts = await Discount.find().sort({ createdAt: -1 }).lean();
      return res.status(200).json({ success: true, discounts });
    }

    if (req.method === 'POST') {
      const discount = req.body;
      if (!discount || !discount.id) {
        return res.status(400).json({ success: false, message: 'Missing discount id' });
      }
      const { _id, ...cleanDiscount } = discount;
      const saved = await Discount.findOneAndUpdate(
        { id: discount.id },
        { $set: cleanDiscount },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return res.status(200).json({ success: true, discount: saved });
    }

    if (req.method === 'DELETE') {
      const id = req.query.id;
      if (id) {
        await Discount.deleteOne({ id });
        return res.status(200).json({ success: true, message: 'Discount deleted' });
      }
      await Discount.deleteMany({});
      return res.status(200).json({ success: true, message: 'All discounts cleared' });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
