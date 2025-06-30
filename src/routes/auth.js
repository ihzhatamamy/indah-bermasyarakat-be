const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateRegister, validateLogin, validatePassword } = require('../middleware/validation');

// Register
router.post('/register', validateRegister, authController.register);

// Login
router.post('/login', validateLogin, authController.login);

// Verifikasi email
router.get('/verify-email/:token', authController.verifyEmail);

// Kirim ulang email verifikasi
router.post('/resend-verification', authController.resendVerification);

// Lupa password
router.post('/forgot-password', authController.forgotPassword);

// Reset password
router.post('/reset-password/:token', validatePassword, authController.resetPassword);

// Get user profile (protected)
router.get('/me', protect, authController.getMe);

// Update user profile (protected)
router.put('/update-profile', protect, authController.updateProfile);

// Change password (protected)
router.put('/change-password', protect, validatePassword, authController.changePassword);

// Get admin reference code (protected, admin only)
router.get('/reference-code', protect, authController.getAdminReferenceCode);

// Get warga by admin (protected, admin only)
router.get('/warga', protect, authController.getWargaByAdmin);

module.exports = router;