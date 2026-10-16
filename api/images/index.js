import { connectDB } from '../../server/db.js';
import { Image } from '../../server/models/Image.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await connectDB();
    const id = req.query.id;
    if (!id) {
      return res.status(400).send('Missing image id');
    }

    const img = await Image.findOne({ id });
    if (!img || !img.data) {
      return res.status(404).send('Image not found');
    }

    res.setHeader('Content-Type', img.contentType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Length', img.data.length);
    return res.end(img.data);
  } catch (error) {
    console.error('Error serving image on serverless:', error);
    return res.status(500).send('Server error');
  }
}
