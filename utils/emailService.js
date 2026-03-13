/**
 * Simple email sender. Uses nodemailer if SMTP is configured in .env.
 * If not configured, logs the message (e.g. password) for development.
 */

let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  nodemailer = null;
}

const sendPasswordEmail = async (toEmail, userName, temporaryPassword) => {
  const subject = 'Your account and password';
  const text = `Hello ${userName || 'there'},\n\nYour account has been created. You can log in with this email and the following temporary password:\n\n${temporaryPassword}\n\nPlease change your password after first login if possible.\n\nBest regards`;
  const html = `<p>Hello ${userName || 'there'},</p><p>Your account has been created. You can log in with this email and the following temporary password:</p><p><strong>${temporaryPassword}</strong></p><p>Please change your password after first login if possible.</p><p>Best regards</p>`;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log('[Email] SMTP not configured. Password for new user:', toEmail, '->', temporaryPassword);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: toEmail,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error('[Email] Failed to send password email:', err.message);
    console.log('[Email] Password for', toEmail, '->', temporaryPassword);
  }
};

module.exports = { sendPasswordEmail };
