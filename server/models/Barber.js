import mongoose from 'mongoose';

const BarberSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  initials: { type: String, default: 'BR' },
  specialty: { type: String, default: 'All-around cuts' },
  rating: { type: Number, default: 5.0 },
  schedule: { type: String, default: 'Tue–Sun · 9:00 AM – 6:00 PM (Break: 1:00 PM – 2:00 PM · Rest: Mon)' },
  status: { type: String, default: 'On shift' },
  leaveStatus: { type: String, default: 'Active / On Duty' },
  leaveNotes: { type: String, default: '' },
  bio: { type: String, default: 'Skilled professional barber at Biglang Gwapo.' },
  image: { type: String, default: '' },
  working: { type: Boolean, default: true },
  email: { type: String, lowercase: true, trim: true },
  phone: { type: String, default: '' },
  isUnavailable: { type: Boolean, default: false },
  commissionEnabled: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const Barber = mongoose.models.Barber || mongoose.model('Barber', BarberSchema);
