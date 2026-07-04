const nodemailer = require('nodemailer');

// Create transporter from env vars
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
});

async function sendMail({ to, subject, text, html, attachments = [] }) {
  if (!process.env.SMTP_USER) {
    // In dev, fallback to logging
    console.log('Email disabled (no SMTP configured). Mail would be sent to:', to, subject);
    return;
  }

  const msg = {
    from: process.env.EMAIL_FROM || 'no-reply@example.com',
    to,
    subject,
    text,
    html,
    attachments,
  };

  return transporter.sendMail(msg);
}

module.exports = { sendMail };
