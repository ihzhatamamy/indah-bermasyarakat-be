const midtransClient = require('midtrans-client');
const config = require('../config/config');

// Inisialisasi Midtrans Snap API
const snap = new midtransClient.Snap({
  isProduction: config.MIDTRANS_IS_PRODUCTION,
  serverKey: config.MIDTRANS_SERVER_KEY,
  clientKey: config.MIDTRANS_CLIENT_KEY
});

// Inisialisasi Midtrans Core API untuk handling callback
const core = new midtransClient.CoreApi({
  isProduction: config.MIDTRANS_IS_PRODUCTION,
  serverKey: config.MIDTRANS_SERVER_KEY,
  clientKey: config.MIDTRANS_CLIENT_KEY
});

// Fungsi untuk membuat transaksi iuran
const createIuranTransaction = async (userId, iuranId, amount, name, email) => {
  try {
    const orderId = `IURAN-${userId}-${iuranId}-${Date.now()}`;
    
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount
      },
      customer_details: {
        first_name: name,
        email: email
      },
      item_details: [
        {
          id: `IURAN-${iuranId}`,
          price: amount,
          quantity: 1,
          name: 'Iuran Bulanan'
        }
      ],
      callbacks: {
        finish: `${process.env.FRONTEND_URL}/payment/finish`,
        error: `${process.env.FRONTEND_URL}/payment/error`,
        pending: `${process.env.FRONTEND_URL}/payment/pending`
      }
    };

    const transaction = await snap.createTransaction(parameter);
    return {
      success: true,
      orderId,
      token: transaction.token,
      redirectUrl: transaction.redirect_url
    };
  } catch (error) {
    console.error('Error creating transaction:', error);
    return { success: false, error: error.message };
  }
};

// Fungsi untuk membuat transaksi donasi
const createDonasiTransaction = async (userId, donasiId, amount, name, email, description) => {
  try {
    const orderId = `DONASI-${userId}-${donasiId}-${Date.now()}`;
    
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount
      },
      customer_details: {
        first_name: name,
        email: email
      },
      item_details: [
        {
          id: `DONASI-${donasiId}`,
          price: amount,
          quantity: 1,
          name: 'Donasi'
        }
      ],
      custom_field1: description,
      callbacks: {
        finish: `${process.env.FRONTEND_URL}/donation/finish`,
        error: `${process.env.FRONTEND_URL}/donation/error`,
        pending: `${process.env.FRONTEND_URL}/donation/pending`
      }
    };

    const transaction = await snap.createTransaction(parameter);
    return {
      success: true,
      orderId,
      token: transaction.token,
      redirectUrl: transaction.redirect_url
    };
  } catch (error) {
    console.error('Error creating donation transaction:', error);
    return { success: false, error: error.message };
  }
};

// Fungsi untuk memverifikasi status pembayaran
const checkTransactionStatus = async (orderId) => {
  try {
    const response = await core.transaction.status(orderId);
    return {
      success: true,
      orderId: response.order_id,
      transactionStatus: response.transaction_status,
      fraudStatus: response.fraud_status,
      paymentType: response.payment_type,
      statusMessage: getStatusMessage(response.transaction_status)
    };
  } catch (error) {
    console.error('Error checking transaction status:', error);
    return { success: false, error: error.message };
  }
};

// Helper untuk mendapatkan pesan status
const getStatusMessage = (status) => {
  switch (status) {
    case 'capture': return 'Pembayaran berhasil';
    case 'settlement': return 'Pembayaran berhasil';
    case 'pending': return 'Pembayaran sedang diproses';
    case 'deny': return 'Pembayaran ditolak';
    case 'cancel': return 'Pembayaran dibatalkan';
    case 'expire': return 'Pembayaran kedaluwarsa';
    case 'refund': return 'Pembayaran dikembalikan';
    default: return 'Status tidak diketahui';
  }
};

module.exports = {
  snap,
  core,
  createIuranTransaction,
  createDonasiTransaction,
  checkTransactionStatus
};