import mongoose from 'mongoose';

const AccountSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['admin', 'barber', 'receptionist', 'customer'], default: 'customer' },
  name: { type: String, required: true },
  initials: { type: String, default: '' },
  phone: { type: String, default: '' },
  image: { type: String, default: '' },
  barberId: { type: String },
  customerId: { type: String },
  redirectPath: { type: String, default: '/' },
  createdAt: { type: Date, default: Date.now }
});

export const Account = mongoose.models.Account || mongoose.model('Account', AccountSchema);
