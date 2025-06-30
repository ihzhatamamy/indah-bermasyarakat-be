const User = require('../models/User');
const { sendEmail } = require('../utils/email');
const { captureException, info } = require('../utils/logger');
const config = require('../config/config');

// Register user
exports.register = async (req, res) => {
  try {
    const { nama, email, password, no_hp, alamat, role, kode_referensi } = req.body;

    // Cek apakah email sudah terdaftar
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar'
      });
    }

    let referensiAdminId = null;

    // Jika user mendaftar sebagai warga dan memberikan kode referensi
    if (role === 'warga' && kode_referensi) {
      // Cari admin berdasarkan kode referensi
      const admin = await User.findByReferenceCode(kode_referensi);
      if (!admin || admin.role !== 'admin') {
        return res.status(400).json({
          success: false,
          message: 'Kode referensi tidak valid'
        });
      }
      
      referensiAdminId = admin.id;
    }

    // Buat user baru
    const newUser = await User.create({
      nama,
      email,
      password,
      no_hp: no_hp || null,
      alamat: alamat || null,
      role: role || 'warga',
      referensi_admin_id: referensiAdminId,
      kode_referensi: role === 'admin' ? null : kode_referensi
    });

    // Kirim email verifikasi
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${newUser.verification_token}`;
    await sendEmail(
      email,
      'Verifikasi Email Anda',
      `
        <h2>Selamat Datang di Indah Bermasyarakat</h2>
        <p>Halo ${nama},</p>
        <p>Terima kasih telah mendaftar. Silakan klik tombol di bawah untuk memverifikasi email Anda:</p>
        <p>
          <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Verifikasi Email
          </a>
        </p>
        <p>Atau kunjungi link berikut: <a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>Link ini akan kedaluwarsa dalam 24 jam.</p>
        <p>Jika Anda tidak mendaftar, abaikan email ini.</p>
        <p>Terima kasih,<br>Tim Indah Bermasyarakat</p>
      `
    );

    // Buat token
    const token = User.generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil. Silakan verifikasi email Anda.',
      token,
      user: {
        id: newUser.id,
        nama: newUser.nama,
        email: newUser.email,
        role: newUser.role,
        is_verified: !!newUser.email_verified_at
      }
    });
  } catch (error) {
    captureException(error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat registrasi',
      error: error.message
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Cek apakah user ada
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    // Cek password
    const isMatch = await User.matchPassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    // Buat token
    const token = User.generateToken(user);

    info(`User ${user.email} logged in`);

    res.status(200).json({
      success: true,
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
        is_verified: !!user.email_verified_at
      }
    });
  } catch (error) {
    captureException(error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat login',
      error: error.message
    });
  }
};

// Verifikasi email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Cari user berdasarkan token verifikasi
    const user = await User.findByVerificationToken(token);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token verifikasi tidak valid atau sudah kedaluwarsa'
      });
    }

    // Update status verifikasi
    await User.verifyEmail(user.id);

    res.status(200).json({
      success: true,
      message: 'Email berhasil diverifikasi'
    });
  } catch (error) {
    captureException(error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat verifikasi email',
      error: error.message
    });
  }
};

// Kirim ulang email verifikasi
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    // Cari user berdasarkan email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email tidak terdaftar'
      });
    }

    // Cek apakah email sudah diverifikasi
    if (user.email_verified_at) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah diverifikasi'
      });
    }

    // Generate token verifikasi baru
    const token = crypto.randomBytes(20).toString('hex');
    await User.update(user.id, { verification_token: token });

    // Kirim email verifikasi
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
    await sendEmail(
      email,
      'Verifikasi Email Anda',
      `
        <h2>Verifikasi Email</h2>
        <p>Halo ${user.nama},</p>
        <p>Silakan klik tombol di bawah untuk memverifikasi email Anda:</p>
        <p>
          <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Verifikasi Email
          </a>
        </p>
        <p>Atau kunjungi link berikut: <a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>Link ini akan kedaluwarsa dalam 24 jam.</p>
        <p>Jika Anda tidak meminta verifikasi ulang, abaikan email ini.</p>
        <p>Terima kasih,<br>Tim Indah Bermasyarakat</p>
      `
    );

    res.status(200).json({
      success: true,
      message: 'Email verifikasi telah dikirim ulang'
    });
  } catch (error) {
    captureException(error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengirim ulang email verifikasi',
      error: error.message
    });
  }
};

// Lupa password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Cari user berdasarkan email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email tidak terdaftar'
      });
    }

    // Generate reset token
    const resetToken = await User.generateResetPasswordToken(user.id);

    // Kirim email reset password
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendEmail(
      email,
      'Reset Password',
      `
        <h2>Reset Password</h2>
        <p>Halo ${user.nama},</p>
        <p>Anda menerima email ini karena Anda (atau seseorang) telah meminta reset password.</p>
        <p>Silakan klik tombol di bawah untuk melanjutkan:</p>
        <p>
          <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
        </p>
        <p>Atau kunjungi link berikut: <a href="${resetUrl}">${resetUrl}</a></p>
        <p>Link ini akan kedaluwarsa dalam 1 jam.</p>
        <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
        <p>Terima kasih,<br>Tim Indah Bermasyarakat</p>
      `
    );

    res.status(200).json({
      success: true,
      message: 'Email reset password telah dikirim'
    });
  } catch (error) {
    captureException(error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memproses permintaan reset password',
      error: error.message
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Cari user berdasarkan token reset password
    const user = await User.findByResetPasswordToken(token);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token reset password tidak valid atau sudah kedaluwarsa'
      });
    }

    // Update password dan hapus token reset
    await User.update(user.id, {
      password,
      reset_password_token: null,
      reset_password_expires: null
    });

    res.status(200).json({
      success: true,
      message: 'Password berhasil diubah'
    });
  } catch (error) {
    captureException(error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat reset password',
      error: error.message
    });
  }
};

// Get user profile
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Jika user adalah warga, dapatkan informasi admin referensi
    let adminReferensi = null;
    if (user.role === 'warga' && user.referensi_admin_id) {
      adminReferensi = await User.findById(user.referensi_admin_id);
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        no_hp: user.no_hp,
        alamat: user.alamat,
        role: user.role,
        is_verified: !!user.email_verified_at,
        kode_referensi: user.kode_referensi,
        admin_referensi: adminReferensi ? {
          id: adminReferensi.id,
          nama: adminReferensi.nama
        } : null
      }
    });
  } catch (error) {
    captureException(error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil profil',
      error: error.message
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { nama, no_hp, alamat } = req.body;
    
    const updatedUser = await User.update(req.user.id, {
      nama,
      no_hp,
      alamat
    });

    res.status(200).json({
      success: true,
      message: 'Profil berhasil diperbarui',
      data: {
        id: updatedUser.id,
        nama: updatedUser.nama,
        email: updatedUser.email,
        no_hp: updatedUser.no_hp,
        alamat: updatedUser.alamat,
        role: updatedUser.role
      }
    });
  } catch (error) {
    captureException(error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui profil',
      error: error.message
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get user
    const user = await User.findById(req.user.id);
    
    // Check current password
    const isMatch = await User.matchPassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password saat ini salah'
      });
    }
    
    // Update password
    await User.update(user.id, { password: newPassword });
    
    res.status(200).json({
      success: true,
      message: 'Password berhasil diubah'
    });
  } catch (error) {
    captureException(error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengubah password',
      error: error.message
    });
  }
};

// Get admin reference code
exports.getAdminReferenceCode = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Hanya admin yang dapat mengakses kode referensi'
      });
    }
    
    // Jika admin belum memiliki kode referensi, generate kode baru
    if (!user.kode_referensi) {
      const kodeReferensi = User.generateReferenceCode();
      await User.update(user.id, { kode_referensi });
      
      return res.status(200).json({
        success: true,
        kode_referensi: kodeReferensi
      });
    }
    
    res.status(200).json({
      success: true,
      kode_referensi: user.kode_referensi
    });
  } catch (error) {
    captureException(error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil kode referensi',
      error: error.message
    });
  }
};

// Get warga by admin
exports.getWargaByAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Hanya admin yang dapat mengakses daftar warga'
      });
    }
    
    const warga = await User.getWargaByAdminId(user.id);
    
    res.status(200).json({
      success: true,
      count: warga.length,
      data: warga.map(w => ({
        id: w.id,
        nama: w.nama,
        email: w.email,
        no_hp: w.no_hp,
        alamat: w.alamat,
        is_verified: !!w.email_verified_at
      }))
    });
  } catch (error) {
    captureException(error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil daftar warga',
      error: error.message
    });
  }
};