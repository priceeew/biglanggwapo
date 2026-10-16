import { connectDB } from '../../server/db.js';
import { Notification } from '../../server/models/Notification.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PATCH,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectDB();

    if (req.method === 'GET') {
      const { email, role, customerId, barberId } = req.query || {};
      let filter = {};
      if (email || role || customerId || barberId) {
        const orClauses = [];
        if (role) {
          orClauses.push({ recipientRole: role }, { recipientRole: 'all' }, { recipientRole: '' }, { recipientRole: { $exists: false } });
        }
        if (email) {
          orClauses.push({ recipientEmail: email.toLowerCase().trim() });
        }
        if (customerId) {
          orClauses.push({ recipientId: customerId });
        }
        if (barberId) {
          orClauses.push({ recipientId: barberId });
        }
        filter = { $or: orClauses };
      }
      const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(100).lean();
      return res.status(200).json({ success: true, notifications });
    }

    if (req.method === 'POST') {
      const notif = req.body;
      if (!notif || !notif.id) {
        return res.status(400).json({ success: false, message: 'Missing notification id' });
      }
      const { _id, ...cleanNotif } = notif;
      if (cleanNotif.recipientEmail) {
        cleanNotif.recipientEmail = cleanNotif.recipientEmail.toLowerCase().trim();
      }
      const saved = await Notification.findOneAndUpdate(
        { id: notif.id },
        { $set: cleanNotif },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return res.status(200).json({ success: true, notification: saved });
    }

    if (req.method === 'PATCH') {
      const { id, ids } = req.body || {};
      if (id) {
        await Notification.updateOne({ id }, { $set: { read: true } });
      } else if (Array.isArray(ids) && ids.length > 0) {
        await Notification.updateMany({ id: { $in: ids } }, { $set: { read: true } });
      }
      return res.status(200).json({ success: true, message: 'Notifications marked as read' });
    }

    if (req.method === 'DELETE') {
      const id = req.query.id;
      if (id) {
        await Notification.deleteOne({ id });
        return res.status(200).json({ success: true, message: 'Notification deleted' });
      }
      await Notification.deleteMany({});
      return res.status(200).json({ success: true, message: 'All notifications cleared' });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
