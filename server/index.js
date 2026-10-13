import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns';
import { sendInvitationEmail } from './services/emailService.js';

// Fix for Windows / ISP DNS SRV resolution issues (e.g. ECONNREFUSED _mongodb._tcp)
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Biglang Gwapo API is running smoothly!',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

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
    await mongoose.connect(MONGODB_URI);
    console.log('Successfully connected to MongoDB Atlas!');

    const server = app.listen(PORT, () => {
      console.log(`Express server is running on http://localhost:${PORT}`);
    });

    return server;
  } catch (error) {
    console.error('Failed to connect to MongoDB Atlas:', error.message);
  }
}

startServer();
