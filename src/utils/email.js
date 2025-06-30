const nodemailer = require('nodemailer');
const config = require('../config/config');

// Konfigurasi transporter
const transporter = nodemailer.createTransport({
  host: config.EMAIL_HOST,
  port: config.EMAIL_PORT,
  secure: config.EMAIL_PORT === 465, // true untuk port 465, false untuk port lainnya
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASS
  }
});

// Verifikasi koneksi SMTP
const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log('📧 Email server ready');
    return true;
  } catch (error) {
    console.error('❌ Email server error:', error);
    return false;
  }
};

// Fungsi untuk mengirim email
const sendEmail = async (to, subject, html, attachments = []) => {
  try {
    const mailOptions = {
      from: `Indah Bermasyarakat <${config.EMAIL_FROM}>`,
      to,
      subject,
      html,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Template email untuk notifikasi iuran
const sendPaymentReminder = async (to, name, amount, dueDate) => {
  const subject = 'Pengingat Pembayaran Iuran';
  const html = `
    <h2>Pengingat Pembayaran Iuran</h2>
    <p>Halo ${name},</p>
    <p>Kami ingin mengingatkan bahwa Anda memiliki iuran yang perlu dibayarkan:</p>
    <ul>
      <li><strong>Jumlah:</strong> Rp ${amount.toLocaleString('id-ID')}</li>
      <li><strong>Batas Waktu:</strong> ${new Date(dueDate).toLocaleDateString('id-ID')}</li>
    </ul>
    <p>Silakan melakukan pembayaran melalui aplikasi Indah Bermasyarakat.</p>
    <p>Terima kasih,<br>Tim Indah Bermasyarakat</p>
  `;
  
  return await sendEmail(to, subject, html);
};

module.exports = {
  transporter,
  verifyConnection,
  sendEmail,
  sendPaymentReminder
};