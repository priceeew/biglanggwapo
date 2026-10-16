import { sendInvitationEmail, sendTurnNotificationEmail, sendCancellationEmail } from '../server/services/emailService.js';

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { type, to, name, role, password, portalUrl, barberName, serviceName, queueNumber } = req.body || {};
    if (!to || !name) {
      return res.status(400).json({ success: false, message: 'Missing recipient email or name.' });
    }

    if (type === 'turn-notification' || type === 'chair-call') {
      const result = await sendTurnNotificationEmail({
        to,
        customerName: name,
        barberName: barberName || 'Your Barber',
        serviceName: serviceName || 'Haircut & Styling',
        queueNumber: queueNumber || '',
        portalUrl: portalUrl || 'https://biglanggwapo.vercel.app'
      });

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: 'Turn notification email sent successfully!',
          previewUrl: result.previewUrl
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to send turn notification email.',
        error: result.error
      });
    }

    if (type === 'cancellation' || type === 'cancel-appointment') {
      const result = await sendCancellationEmail({
        to,
        customerName: name,
        barberName: barberName || 'Your Barber',
        serviceName: serviceName || 'Haircut & Styling',
        date: req.body?.date || '',
        time: req.body?.time || '',
        reason: req.body?.reason || 'Schedule update',
        message: req.body?.message || '',
        portalUrl: portalUrl || 'https://biglanggwapo.vercel.app'
      });

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: 'Cancellation email sent successfully!',
          previewUrl: result.previewUrl
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to send cancellation email.',
        error: result.error
      });
    }

    const result = await sendInvitationEmail({
      to,
      name,
      role,
      password,
      portalUrl: portalUrl || 'http://localhost:3000'
    });

    if (result.success) {
      return res.status(200).json({
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
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
