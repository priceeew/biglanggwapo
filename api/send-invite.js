import { sendInvitationEmail } from '../server/services/emailService.js';

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
    const { to, name, role, password, portalUrl } = req.body || {};
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
