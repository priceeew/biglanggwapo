import { connectDB } from '../db.js';
import { Image } from '../models/Image.js';

export async function ensureHostedImageCloud(img, filename = 'image.jpg') {
  if (!img || typeof img !== 'string' || !img.startsWith('data:image/')) {
    return img;
  }

  try {
    await connectDB();

    let contentType = 'image/jpeg';
    const extMatch = img.match(/^data:image\/([a-zA-Z0-9+]+);base64,/);
    if (extMatch) {
      const rawExt = extMatch[1].toLowerCase();
      if (rawExt === 'png') contentType = 'image/png';
      else if (rawExt === 'jpeg' || rawExt === 'jpg') contentType = 'image/jpeg';
      else if (rawExt === 'webp') contentType = 'image/webp';
    }

    const cleanBase64 = img.includes('base64,') ? img.split('base64,')[1] : img;
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

    return `/api/images/${imageId}`;
  } catch (err) {
    console.warn('[Images Collection] Failed to save hosted image to MongoDB:', err.message);
    return img;
  }
}
