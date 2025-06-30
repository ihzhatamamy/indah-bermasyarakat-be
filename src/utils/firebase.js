const admin = require('firebase-admin');
const config = require('../config/config');

// Inisialisasi Firebase Admin SDK
let serviceAccount;
try {
  serviceAccount = require('../../firebase-service-account.json');
} catch (error) {
  console.warn('Firebase service account file tidak ditemukan, menggunakan environment variables');
  serviceAccount = null;
}

// Inisialisasi Firebase Admin dengan credential
if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Alternatif menggunakan environment variable
    const serviceAccountFromEnv = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountFromEnv)
    });
  } else {
    console.warn('Firebase credentials tidak tersedia, push notification tidak akan berfungsi');
  }
}

// Fungsi untuk mengirim notifikasi ke device tertentu
const sendNotification = async (token, title, body, data = {}) => {
  try {
    if (!admin.apps.length) {
      return { success: false, error: 'Firebase belum diinisialisasi' };
    }

    const message = {
      notification: {
        title,
        body,
      },
      data,
      token,
    };

    const response = await admin.messaging().send(message);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error: error.message };
  }
};

// Fungsi untuk mengirim notifikasi ke multiple devices
const sendMulticastNotification = async (tokens, title, body, data = {}) => {
  try {
    if (!admin.apps.length) {
      return { success: false, error: 'Firebase belum diinisialisasi' };
    }

    const message = {
      notification: {
        title,
        body,
      },
      data,
      tokens,
    };

    const response = await admin.messaging().sendMulticast(message);
    return { 
      success: true, 
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error('Error sending multicast notification:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  admin,
  sendNotification,
  sendMulticastNotification
};