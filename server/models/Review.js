import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customer: { type: String, required: true },
  initials: { type: String, default: 'CU' },
  customerId: { type: String, default: '' },
  customerImage: { type: String, default: '' },
  barber: { type: String, default: '' },
  barberId: { type: String, default: '' },
  service: { type: String, default: '' },
  serviceName: { type: String, default: '' },
  rating: { type: Number, required: true, default: 5 },
  comment: { type: String, default: '' },
  image: { type: String, default: '' },
  appointmentId: { type: String, default: '' },
  date: { type: String, default: () => new Date().toISOString().slice(0, 10) },
  public: { type: Boolean, default: true },
  hidden: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema, 'reviews');
