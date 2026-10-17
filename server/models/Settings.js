import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  shopName: { type: String, default: 'Biglang Gwapo Barber Shop' },
  phone: { type: String, default: '+63 917 555 0100' },
  email: { type: String, default: 'hello@biglanggwapo.demo' },
  address: { type: String, default: '180 Cutcot National Highway, Pulilan, Bulacan' },
  hours: { type: String, default: 'Mon–Sun · 9:00 AM–8:00 PM' },
  slotInterval: { type: Number, default: 15 },
  cancellationPolicy: { type: String, default: 'Please cancel at least 2 hours before your appointment.' },
  paymentMethods: { type: [String], default: ['Cash', 'GCash', 'Card only'] },
  commissionTracking: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now }
});

export const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema, 'settings');
