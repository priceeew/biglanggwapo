import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns';
import fs from 'fs';
import path from 'path';
import { connectDB } from './db.js';
import { Account } from './models/Account.js';
import { Barber } from './models/Barber.js';
import { Appointment } from './models/Appointment.js';
import { Service } from './models/Service.js';
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
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Statically serve uploads folder for uploaded images
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

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
    if (payload.password) {
      if (
        payload.password.length < 8 ||
        !/\d/.test(payload.password) ||
        !/[!@#$%^&*(),.?":{}|<>_\-+=\\/\[\]~`]/.test(payload.password)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long and contain at least one number and one special character.'
        });
      }
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
    const { _id, ...cleanBarber } = barber;
    const saved = await Barber.findOneAndUpdate(
      { id: barber.id },
      { $set: cleanBarber },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, barber: saved });
  } catch (err) {
    console.error('Error saving barber:', err);
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

// Services API (MongoDB Atlas)
app.get('/api/services', async (req, res) => {
  try {
    await connectDB();
    const services = await Service.find().lean();
    res.json({ success: true, services });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/services', async (req, res) => {
  try {
    await connectDB();
    const service = req.body;
    if (!service || !service.id) {
      return res.status(400).json({ success: false, message: 'Missing service id' });
    }
    const { _id, ...cleanService } = service;
    const saved = await Service.findOneAndUpdate(
      { id: service.id },
      { $set: cleanService },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, service: saved });
  } catch (err) {
    console.error('Error saving service:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/services/:id', async (req, res) => {
  try {
    await connectDB();
    await Service.deleteOne({ id: req.params.id });
    res.json({ success: true, message: 'Service deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/services', async (req, res) => {
  try {
    await connectDB();
    await Service.deleteMany({});
    res.json({ success: true, message: 'All services cleared' });
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
    const { _id, ...cleanApt } = apt;
    const saved = await Appointment.findOneAndUpdate(
      { id: apt.id },
      { $set: cleanApt },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, appointment: saved });
  } catch (err) {
    console.error('Error saving appointment:', err);
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

// Image Upload Endpoint (ImgBB Cloud with local static storage fallback)
app.post('/api/upload', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, message: 'No image data provided' });
    }

    // Validate image format - only JPEG, JPG, and PNG allowed
    const extMatch = image.match(/^data:image\/([a-zA-Z0-9+]+);base64,/);
    if (extMatch) {
      const rawExt = extMatch[1].toLowerCase();
      if (!['jpeg', 'jpg', 'png'].includes(rawExt)) {
        return res.status(400).json({ success: false, message: 'Invalid format. Only JPEG, JPG, and PNG files are allowed.' });
      }
    }

    // Attempt ImgBB cloud upload if API key exists
    const apiKey = process.env.IMGBB_API_KEY || 'b5f603fbcbfc780cdf47ec7b318b8b38';
    if (apiKey) {
      try {
        const rawBase64 = image.includes('base64,') ? image.split('base64,')[1] : image;
        const form = new URLSearchParams();
        form.append('image', rawBase64);
        const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
          method: 'POST',
          body: form,
          signal: AbortSignal.timeout(5000)
        });
        const imgbbData = await imgbbRes.json();
        if (imgbbData?.data?.url) {
          console.log('[ImgBB] Image successfully uploaded to cloud:', imgbbData.data.url);
          return res.json({ success: true, url: imgbbData.data.url, provider: 'imgbb' });
        }
      } catch (err) {
        console.warn('[ImgBB] Cloud upload not reachable or timed out, saving locally:', err.message);
      }
    }

    // Fallback: Save directly to public/uploads directory
    const ext = extMatch ? (extMatch[1] === 'jpeg' ? 'jpg' : extMatch[1]) : 'png';
    const cleanBase64 = image.includes('base64,') ? image.split('base64,')[1] : image;
    const safeName = `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const filePath = path.join(uploadsDir, safeName);

    await fs.promises.writeFile(filePath, Buffer.from(cleanBase64, 'base64'));
    const localUrl = `/uploads/${safeName}`;
    console.log('[Upload] Saved image to local storage:', localUrl);
    return res.json({ success: true, url: localUrl, provider: 'local' });
  } catch (error) {
    console.error('Upload handler error:', error);
    res.status(500).json({ success: false, error: error.message });
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
