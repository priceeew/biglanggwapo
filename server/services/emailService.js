import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Helper to create transport
async function getTransporter() {
  dotenv.config({ override: true });
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (user && pass) {
    console.log(`[Email Transporter] Using Gmail SMTP (${user})`);
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });
  }

  // Fallback to test/ethereal account if Gmail credentials are not yet configured in .env
  console.log('NOTE: EMAIL_USER/EMAIL_PASS not found in .env. Creating test email transporter...');
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });
}

export async function sendInvitationEmail({ to, name, role, password, portalUrl = 'http://localhost:3000' }) {
  try {
    const transporter = await getTransporter();
    const roleCapitalized = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Staff';
    const isCustomer = role === 'customer';

    const subject = isCustomer
      ? `Welcome to Biglang Gwapo Barbershop, ${name}!`
      : `Welcome to the Team! Your Biglang Gwapo ${roleCapitalized} Account`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f6f2; margin: 0; padding: 24px; color: #1a1a1a; }
        .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e6e2d8; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .header { background: #1c1c1c; padding: 32px 24px; text-align: center; border-bottom: 3px solid #b88a44; }
        .logo-title { color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.03em; margin: 0; text-transform: uppercase; }
        .logo-subtitle { color: #b88a44; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; margin-top: 6px; }
        .content { padding: 32px 28px; line-height: 1.6; }
        .greeting { font-size: 20px; font-weight: 700; color: #1c1c1c; margin-top: 0; margin-bottom: 12px; }
        .card { background: #fdfbf7; border: 1px solid #ede8dc; border-radius: 8px; padding: 20px; margin: 24px 0; }
        .card-row { margin-bottom: 10px; font-size: 14px; }
        .card-row:last-child { margin-bottom: 0; }
        .label { color: #88857d; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; display: block; margin-bottom: 2px; }
        .value { color: #1c1c1c; font-weight: 600; font-size: 15px; }
        .password-badge { font-family: 'Courier New', Courier, monospace; background: #f0ede6; padding: 3px 8px; border-radius: 4px; color: #b88a44; font-weight: 700; }
        .button-wrapper { text-align: center; margin: 30px 0 20px; }
        .btn { display: inline-block; background: #1c1c1c; color: #ffffff !important; text-decoration: none; padding: 13px 28px; border-radius: 6px; font-weight: 700; font-size: 14px; letter-spacing: -0.01em; }
        .footer { background: #f9f8f5; border-top: 1px solid #ede8dc; padding: 20px 24px; text-align: center; font-size: 12px; color: #8c8980; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="logo-title">BIGLANG GWAPO</h1>
          <div class="logo-subtitle">Barbershop · Pulilan, Bulacan</div>
        </div>
        <div class="content">
          <h2 class="greeting">Hello, ${name}!</h2>
          <p>
            ${isCustomer
              ? 'Your customer account has been created successfully. You can now easily book appointments, track your queue status, and view your haircut history.'
              : `You have been added as a <strong>${roleCapitalized}</strong> at Biglang Gwapo Barbershop. Here are your portal login credentials:`
            }
          </p>

          <div class="card">
            <div class="card-row">
              <span class="label">Assigned Role</span>
              <span class="value">${roleCapitalized}</span>
            </div>
            <div class="card-row">
              <span class="label">Login Email</span>
              <span class="value">${to}</span>
            </div>
            <div class="card-row">
              <span class="label">Temporary Password</span>
              <span class="value password-badge">${password}</span>
            </div>
          </div>

          <p style="font-size: 13px; color: #666;">
            For security, please sign in and keep your credentials confidential.
          </p>

          <div class="button-wrapper">
            <a href="${portalUrl}" class="btn" target="_blank">Access Portal & Sign In &rarr;</a>
          </div>
        </div>

        <div class="footer">
          <strong>Biglang Gwapo Barbershop</strong><br>
          180 Cutcot National Highway, Pulilan, Bulacan<br>
          Operating Hours: Mon–Sun · 9:00 AM–8:00 PM
        </div>
      </div>
    </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from: `"Biglang Gwapo Barbershop" <${process.env.EMAIL_USER || 'no-reply@biglanggwapo.com'}>`,
      to,
      subject,
      html: htmlContent
    });

    console.log(`[Email Sent] To: ${to} | MessageId: ${info.messageId}`);
    
    let previewUrl = null;
    if (nodemailer.getTestMessageUrl(info)) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[Test Email Preview URL]: ${previewUrl}`);
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendTurnNotificationEmail({
  to,
  customerName,
  barberName = 'Your Barber',
  serviceName = 'Haircut & Styling',
  queueNumber = '',
  portalUrl = 'https://biglanggwapo.vercel.app'
}) {
  try {
    const transporter = await getTransporter();
    const subject = `💈 Kayo na po ang gugupitan! It's your turn at Biglang Gwapo Barbershop`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f6f2; margin: 0; padding: 24px; color: #1a1a1a; }
        .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e6e2d8; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .header { background: #1c1c1c; padding: 32px 24px; text-align: center; border-bottom: 3px solid #b88a44; }
        .logo-title { color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.03em; margin: 0; text-transform: uppercase; }
        .logo-subtitle { color: #b88a44; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; margin-top: 6px; }
        .content { padding: 32px 28px; line-height: 1.6; }
        .greeting { font-size: 22px; font-weight: 700; color: #1c1c1c; margin-top: 0; margin-bottom: 12px; }
        .highlight-banner { background: #1c1c1c; color: #b88a44; border-radius: 8px; padding: 16px 20px; text-align: center; font-weight: 800; font-size: 16px; margin: 20px 0; border: 1px solid #b88a44; }
        .highlight-banner span { color: #ffffff; display: block; font-size: 13px; font-weight: 400; margin-top: 4px; }
        .card { background: #fdfbf7; border: 1px solid #ede8dc; border-radius: 8px; padding: 20px; margin: 24px 0; }
        .card-row { margin-bottom: 10px; font-size: 14px; border-bottom: 1px dashed #ede8dc; padding-bottom: 8px; }
        .card-row:last-child { margin-bottom: 0; border-bottom: none; padding-bottom: 0; }
        .label { color: #88857d; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; display: block; margin-bottom: 2px; }
        .value { color: #1c1c1c; font-weight: 600; font-size: 15px; }
        .queue-badge { display: inline-block; background: #b88a44; color: #ffffff; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 14px; letter-spacing: 0.05em; }
        .instruction { background: #faf8f5; border-left: 4px solid #b88a44; padding: 14px 18px; margin: 20px 0; font-size: 14px; color: #444; border-radius: 0 6px 6px 0; }
        .button-wrapper { text-align: center; margin: 30px 0 20px; }
        .btn { display: inline-block; background: #1c1c1c; color: #ffffff !important; text-decoration: none; padding: 13px 28px; border-radius: 6px; font-weight: 700; font-size: 14px; letter-spacing: -0.01em; border: 1px solid #b88a44; }
        .footer { background: #f9f8f5; border-top: 1px solid #ede8dc; padding: 20px 24px; text-align: center; font-size: 12px; color: #8c8980; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="logo-title">BIGLANG GWAPO</h1>
          <div class="logo-subtitle">Barbershop · Pulilan, Bulacan</div>
        </div>
        <div class="content">
          <h2 class="greeting">Hello, ${customerName}! 👋</h2>
          
          <div class="highlight-banner">
            💈 KAYO NA PO ANG GUGUPITAN!
            <span>Your barber chair is ready for your haircut session.</span>
          </div>

          <p>
            Magandang araw! Handa na po si <strong>${barberName}</strong> para sa inyong service. Maari na po kayong lumapit sa styling chair para simulan ang inyong gupit.
          </p>

          <div class="card">
            ${queueNumber ? `
            <div class="card-row">
              <span class="label">Queue Number</span>
              <span class="value queue-badge">${queueNumber}</span>
            </div>` : ''}
            <div class="card-row">
              <span class="label">Customer Name</span>
              <span class="value">${customerName}</span>
            </div>
            <div class="card-row">
              <span class="label">Assigned Barber</span>
              <span class="value">${barberName}</span>
            </div>
            <div class="card-row">
              <span class="label">Service</span>
              <span class="value">${serviceName}</span>
            </div>
          </div>

          <div class="instruction">
            <strong>Paalala:</strong> Kung kayo ay nasa waiting lounge o malapit sa shop, mangyaring lumapit na po sa barber station ni <strong>${barberName}</strong>. Maraming salamat!
          </div>

          <div class="button-wrapper">
            <a href="${portalUrl}" class="btn" target="_blank">View Live Queue & Portal &rarr;</a>
          </div>
        </div>

        <div class="footer">
          <strong>Biglang Gwapo Barbershop</strong><br>
          180 Cutcot National Highway, Pulilan, Bulacan<br>
          Operating Hours: Mon–Sun · 9:00 AM–8:00 PM
        </div>
      </div>
    </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from: `"Biglang Gwapo Barbershop" <${process.env.EMAIL_USER || 'no-reply@biglanggwapo.com'}>`,
      to,
      subject,
      html: htmlContent
    });

    console.log(`[Turn Notification Email Sent] To: ${to} | Customer: ${customerName} | MessageId: ${info.messageId}`);
    
    let previewUrl = null;
    if (nodemailer.getTestMessageUrl(info)) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[Test Email Preview URL]: ${previewUrl}`);
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error('Error sending turn notification email:', error);
    return { success: false, error: error.message };
  }
}

