import { connectDB } from '../server/db.js';
import { Image } from '../server/models/Image.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { image, filename } = req.body || {};
    if (!image) {
      return res.status(400).json({ success: false, message: 'No image data provided' });
    }

    await connectDB();

    let contentType = 'image/jpeg';
    const extMatch = image.match(/^data:image\/([a-zA-Z0-9+]+);base64,/);
    if (extMatch) {
      const rawExt = extMatch[1].toLowerCase();
      if (rawExt === 'png') contentType = 'image/png';
      else if (rawExt === 'jpeg' || rawExt === 'jpg') contentType = 'image/jpeg';
      else if (rawExt === 'webp') contentType = 'image/webp';
    }

    const cleanBase64 = image.includes('base64,') ? image.split('base64,')[1] : image;
    const buffer = Buffer.from(cleanBase64, 'base64');
    const imageId = `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const safeFilename = filename || `${imageId}.${contentType === 'image/png' ? 'png' : 'jpg'}`;

    await Image.create({
      id: imageId,
      filename: safeFilename,
      contentType,
      data: buffer,
      size: buffer.length
    });

    const imageUrl = `/api/images/${imageId}`;
    return res.status(200).json({ success: true, url: imageUrl, id: imageId, provider: 'mongodb' });
  } catch (error) {
    console.error('Serverless upload error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
