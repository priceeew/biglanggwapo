import mongoose from 'mongoose';

const DiscountSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  code: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  type: { type: String, enum: ['Percentage', 'Fixed'], default: 'Percentage' },
  value: { type: Number, required: true, default: 10 },
  validFrom: { type: String, default: () => new Date().toISOString().slice(0, 10) },
  validTo: { type: String, default: '2026-12-31' },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export const Discount = mongoose.models.Discount || mongoose.model('Discount', DiscountSchema, 'discounts');
