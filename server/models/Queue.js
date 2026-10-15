import mongoose from 'mongoose';

const QueueSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  number: { type: String, required: true },
  customerId: { type: String, default: '' },
  customerName: { type: String, required: true },
  barberId: { type: String, required: true },
  barberName: { type: String, required: true },
  serviceName: { type: String, required: true },
  status: {
    type: String,
    enum: ['Waiting', 'Called', 'In Service', 'Completed', 'Skipped', 'Removed'],
    default: 'Waiting'
  },
  joinedAt: { type: String, default: '' },
  startedAt: { type: String, default: '' },
  completedAt: { type: String, default: '' },
  estimatedMinutes: { type: Number, default: 30 },
  appointmentId: { type: String, default: '' },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

export const Queue = mongoose.models.Queue || mongoose.model('Queue', QueueSchema, 'queue');
