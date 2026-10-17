import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  appointmentId: { type: String, default: '' },
  customerName: { type: String, required: true },
  serviceName: { type: String, default: '' },
  barberName: { type: String, default: '' },
  amount: { type: Number, required: true, default: 0 },
  method: { type: String, default: 'Cash' },
  paymentDetails: { type: String, default: '' },
  status: { type: String, default: 'Paid' },
  date: { type: String, default: () => new Date().toISOString().slice(0, 10) },
  time: { type: String, default: '' },
  receipt: { type: String, default: '' },
  cashReceived: { type: Number },
  change: { type: Number },
  type: { type: String, default: 'Service' }, // 'Service' or 'Retail'
  items: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now }
});

export const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema, 'transactions');
