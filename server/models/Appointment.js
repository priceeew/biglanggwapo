import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customerId: { type: String },
  customerName: { type: String, required: true },
  serviceId: { type: String },
  serviceName: { type: String, required: true },
  barberId: { type: String, required: true },
  barberName: { type: String, required: true },
  barberImage: { type: String, default: '' },
  date: { type: String, required: true },
  time: { type: String, required: true },
  duration: { type: Number, default: 30 },
  price: { type: Number, default: 0 },
  status: { type: String, default: 'Pending' },
  paymentStatus: { type: String, default: 'Unpaid' },
  source: { type: String, default: 'Online' },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

export const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);
