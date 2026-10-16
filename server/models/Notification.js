import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    recipientEmail: { type: String, default: '' },
    recipientRole: { type: String, default: 'customer' },
    recipientId: { type: String, default: '' },
    recipientName: { type: String, default: '' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: 'info' }, // 'queue-next', 'cancelled', 'confirmed', 'customer-arrived', 'in-service', 'info'
    read: { type: Boolean, default: false },
    actionUrl: { type: String, default: '' },
    actionLabel: { type: String, default: '' },
    urgent: { type: Boolean, default: false },
    appointmentId: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
  },
  {
    collection: 'notification', // Explicitly connects to the user's Atlas 'notification' collection
    timestamps: true
  }
);

export const Notification =
  mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
