import mongoose from 'mongoose';

const BarberSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  initials: { type: String, default: 'BR' },
  specialty: { type: String, default: 'All-around cuts' },
  rating: { type: Number, default: 5.0 },
  status: { type: String, default: 'On shift' },
  bio: { type: String, default: 'Skilled professional barber at Biglang Gwapo.' },
  working: { type: Boolean, default: true },
  email: { type: String, lowercase: true, trim: true },
  phone: { type: String, default: '' },
  commissionEnabled: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const Barber = mongoose.models.Barber || mongoose.model('Barber', BarberSchema);
