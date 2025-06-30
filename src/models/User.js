const { db } = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

class User {
  // Mencari user berdasarkan ID
  static async findById(id) {
    return await db('users').where({ id }).first();
  }

  // Mencari user berdasarkan email
  static async findByEmail(email) {
    return await db('users').where({ email }).first();
  }

  // Mencari user berdasarkan kode referensi
  static async findByReferenceCode(kodeReferensi) {
    return await db('users').where({ kode_referensi: kodeReferensi }).first();
  }

  // Mencari user berdasarkan verification token
  static async findByVerificationToken(token) {
    return await db('users').where({ verification_token: token }).first();
  }

  // Mencari user berdasarkan reset password token
  static async findByResetPasswordToken(token) {
    return await db('users')
      .where({ 
        reset_password_token: token,
        reset_password_expires: db.raw('> NOW()')
      })
      .first();
  }
  // Membuat user baru
  static async create(userData) {
    // Hash password sebelum menyimpan
    const salt = await bcrypt.genSalt(10);
    userData.password = await bcrypt.hash(userData.password, salt);
    
    // Generate kode referensi unik jika user adalah admin
    if (userData.role === 'admin' && !userData.kode_referensi) {
      userData.kode_referensi = this.generateReferenceCode();
    }

    // Generate verification token
    userData.verification_token = crypto.randomBytes(20).toString('hex');
    
    const [id] = await db('users').insert(userData);
    return await this.findById(id);
  }

  // Update user
  static async update(id, userData) {
    // Jika password diubah, hash password baru
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }

    await db('users').where({ id }).update(userData);
    return await this.findById(id);
  }

  // Hapus user
  static async delete(id) {
    return await db('users').where({ id }).delete();
  }

  // Metode untuk memeriksa password
  static async matchPassword(inputPassword, hashedPassword) {
    return await bcrypt.compare(inputPassword, hashedPassword);
  }

  // Generate JWT token
  static generateToken(user) {
    return jwt.sign(
      { 
        id: user.id,
        email: user.email,
        role: user.role 
      }, 
      config.JWT_SECRET, 
      { expiresIn: config.JWT_EXPIRE }
    );
  }

  // Generate kode referensi
  static generateReferenceCode() {
    // Format: REF-XXXX-XXXX (X = alfanumerik)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'REF-';
    
    // Generate 4 karakter pertama
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    code += '-';
    
    // Generate 4 karakter kedua
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return code;
  }

  // Generate reset password token
  static async generateResetPasswordToken(userId) {
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Set token dan expiry date (1 jam)
    await db('users')
      .where({ id: userId })
      .update({
        reset_password_token: resetToken,
        reset_password_expires: db.raw('DATE_ADD(NOW(), INTERVAL 1 HOUR)')
      });
    
    return resetToken;
  }

  // Verifikasi email user
  static async verifyEmail(userId) {
    return await db('users')
      .where({ id: userId })
      .update({
        email_verified_at: db.raw('NOW()'),
        verification_token: null
      });
  }

  // Mendapatkan semua admin
  static async getAllAdmins() {
    return await db('users').where({ role: 'admin' });
  }

  // Mendapatkan semua warga berdasarkan referensi admin
  static async getWargaByAdminId(adminId) {
    return await db('users').where({ referensi_admin_id: adminId, role: 'warga' });
  }
}

module.exports = User;