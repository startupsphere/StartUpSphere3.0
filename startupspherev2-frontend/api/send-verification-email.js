/* global process */
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, companyName, otpCode, secret } = req.body || {};

  // Simple authentication check using shared secret
  const validSecret = process.env.API_SECRET || "M3c5aDRlZzcyYTZiOGQ5ZTBmMWMyZDNlNGY1ZzZoN2k=";
  if (secret && secret !== validSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!to || !otpCode) {
    return res.status(400).json({ error: 'Missing required fields: to, otpCode' });
  }

  const displayName = companyName && companyName.trim() ? companyName : 'there';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>StartupSphere Verification Code</title></head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background: linear-gradient(135deg, #1D3557 0%, #2563eb 100%); padding: 32px 32px 28px 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">StartupSphere</h1>
              <p style="color: #93c5fd; margin: 6px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Business Email Verification</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="color: #0f172a; margin: 0 0 12px 0; font-size: 20px; font-weight: 600;">Hello ${displayName},</h2>
              <p style="color: #475569; font-size: 15px; line-height: 24px; margin: 0 0 24px 0;">
                Thank you for submitting your business details. Please use the verification code below to verify your business email address and complete your submission:
              </p>
              <div style="background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px 0;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1D3557; display: inline-block;">
                  ${otpCode}
                </span>
                <p style="color: #64748b; font-size: 12px; margin: 8px 0 0 0;">This code is valid for 10 minutes</p>
              </div>
              <p style="color: #64748b; font-size: 13px; line-height: 20px; margin: 0 0 8px 0;">
                If you did not request this verification, please safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                &copy; 2026 StartupSphere. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textContent = `Hello ${displayName},\n\nYour one-time verification code for StartupSphere is: ${otpCode}\n\nPlease enter this code in StartupSphere to verify your business email address.\nThis code is valid for 10 minutes.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nStartupSphere Team`;

  const brevoApiKey = process.env.BREVO_API_KEY;
  if (!brevoApiKey) {
    console.error('BREVO_API_KEY environment variable is not configured.');
    return res.status(500).json({ error: 'Email service configuration error: missing BREVO_API_KEY.' });
  }
  const senderEmail = process.env.MAIL_USERNAME || "startupsphere2026@gmail.com";

  try {
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoApiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'StartupSphere', email: senderEmail },
        to: [{ email: to, name: displayName }],
        subject: 'Verify Your Business Email - StartupSphere',
        htmlContent: htmlContent,
        textContent: textContent
      })
    });

    const data = await brevoResponse.json();

    if (!brevoResponse.ok) {
      console.error('Brevo API error:', data);
      return res.status(brevoResponse.status).json({
        error: data.message || 'Failed to send verification email via Brevo'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Verification email sent successfully via Brevo.',
      messageId: data.messageId
    });
  } catch (error) {
    console.error('Brevo unexpected error:', error);
    return res.status(500).json({
      error: 'Failed to send verification email: ' + (error.message || 'Unknown error'),
    });
  }
}
