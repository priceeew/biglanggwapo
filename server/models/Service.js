import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  duration: { type: Number, required: true, default: 30 },
  category: { type: String, default: 'Haircut' },
  image: { type: String, default: '' },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export const Service = mongoose.models.Service || mongoose.model('Service', ServiceSchema, 'services');
