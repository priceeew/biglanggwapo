import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns';
import { connectDB } from './db.js';
import { Account } from './models/Account.js';
import { Barber } from './models/Barber.js';
import { Appointment } from './models/Appointment.js';
import { sendInvitationEmail } from './services/emailService.js';

// Fix for Windows / ISP DNS SRV resolution issues (e.g. ECONNREFUSED _mongodb._tcp)
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {
  // Ignored in restricted environments
}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Seed default admin in Atlas if not present
async function seedDefaultAdmin() {
  try {
    const adminExists = await Account.findOne({ email: 'admin@biglanggwapo.com' });
    if (!adminExists) {
      await Account.create({
        email: 'admin@biglanggwapo.com',
        password: 'admin123',
        role: 'admin',
        name: 'Admin Desk',
        initials: 'AD',
        redirectPath: '/admin'
      });
      console.log('[Atlas] Default admin account seeded: admin@biglanggwapo.com');
    }
  } catch (err) {
    console.error('Failed to seed default admin:', err.message);
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Biglang Gwapo API is running smoothly!',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Accounts API (MongoDB Atlas)
app.get('/api/accounts', async (req, res) => {
  try {
    await connectDB();
    const accountsList = await Account.find().lean();
    const accountsMap = {};
    for (const acc of accountsList) {
      accountsMap[acc.email.toLowerCase()] = acc;
    }
    res.json({ success: true, accounts: accountsMap });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/accounts', async (req, res) => {
  try {
    await connectDB();
    const payload = req.body;
    if (!payload || !payload.email) {
      return res.status(400).json({ success: false, message: 'Missing account email' });
    }
    const cleanEmail = payload.email.trim().toLowerCase();
    const saved = await Account.findOneAndUpdate(
      { email: cleanEmail },
      { ...payload, email: cleanEmail },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, account: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/accounts/:email', async (req, res) => {
  try {
    await connectDB();
    const email = decodeURIComponent(req.params.email).trim().toLowerCase();
    if (email === 'admin@biglanggwapo.com') {
      return res.status(400).json({ success: false, message: 'Cannot delete default admin' });
    }
    await Account.deleteOne({ email });
    res.json({ success: true, message: `Account ${email} deleted.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Barbers API (MongoDB Atlas)
app.get('/api/barbers', async (req, res) => {
  try {
    await connectDB();
    const barbers = await Barber.find().lean();
    res.json({ success: true, barbers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/barbers', async (req, res) => {
  try {
    await connectDB();
    const barber = req.body;
    if (!barber || !barber.id) {
      return res.status(400).json({ success: false, message: 'Missing barber id' });
    }
    const saved = await Barber.findOneAndUpdate(
      { id: barber.id },
      barber,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, barber: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/barbers/:id', async (req, res) => {
  try {
    await connectDB();
    await Barber.deleteOne({ id: req.params.id });
    res.json({ success: true, message: 'Barber deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/barbers', async (req, res) => {
  try {
    await connectDB();
    await Barber.deleteMany({});
    res.json({ success: true, message: 'All barbers cleared' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Appointments API (MongoDB Atlas)
app.get('/api/appointments', async (req, res) => {
  try {
    await connectDB();
    const appointments = await Appointment.find().lean();
    res.json({ success: true, appointments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    await connectDB();
    const apt = req.body;
    if (!apt || !apt.id) {
      return res.status(400).json({ success: false, message: 'Missing appointment id' });
    }
    const saved = await Appointment.findOneAndUpdate(
      { id: apt.id },
      apt,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, appointment: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Email Invitation endpoint
app.post('/api/send-invite', async (req, res) => {
  try {
    const { to, name, role, password, portalUrl } = req.body;
    if (!to || !name) {
      return res.status(400).json({ success: false, message: 'Missing recipient email or name.' });
    }

    const result = await sendInvitationEmail({
      to,
      name,
      role,
      password,
      portalUrl: portalUrl || 'http://localhost:3000'
    });

    if (result.success) {
      return res.json({
        success: true,
        message: 'Invitation email sent successfully!',
        previewUrl: result.previewUrl
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to send email.',
      error: result.error
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

async function startServer() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await connectDB();
    await seedDefaultAdmin();

    const server = app.listen(PORT, () => {
      console.log(`Express server is running on http://localhost:${PORT}`);
    });

    return server;
  } catch (error) {
    console.error('Failed to connect to MongoDB Atlas:', error.message);
  }
}

startServer();
