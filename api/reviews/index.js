import { connectDB } from '../../server/db.js';
import { Review } from '../../server/models/Review.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectDB();

    if (req.method === 'GET') {
      const reviews = await Review.find().sort({ createdAt: -1 }).lean();
      return res.status(200).json({ success: true, reviews });
    }

    if (req.method === 'POST') {
      const review = req.body;
      if (!review || !review.id) {
        return res.status(400).json({ success: false, message: 'Missing review id' });
      }
      const { _id, ...cleanReview } = review;
      const saved = await Review.findOneAndUpdate(
        { id: review.id },
        { $set: cleanReview },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return res.status(200).json({ success: true, review: saved });
    }

    if (req.method === 'DELETE') {
      await Review.deleteMany({});
      return res.status(200).json({ success: true, message: 'All reviews cleared' });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
