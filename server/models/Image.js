import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  filename: { type: String, default: 'image.jpg' },
  contentType: { type: String, required: true, default: 'image/jpeg' },
  data: { type: Buffer, required: true },
  size: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'images' });

export const Image = mongoose.models.Image || mongoose.model('Image', imageSchema);
