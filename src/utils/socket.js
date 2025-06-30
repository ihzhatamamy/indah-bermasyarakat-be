const socketIO = require('socket.io');
const config = require('../config/config');

let io;

// Inisialisasi Socket.IO
const initSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: config.SOCKET_CORS_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Middleware untuk autentikasi socket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    // Implementasi validasi token di sini
    // Contoh sederhana, sebaiknya gunakan JWT verification yang sama dengan API
    socket.user = { id: 'user_id_from_token' };
    next();
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Join room berdasarkan user ID untuk notifikasi personal
    if (socket.user && socket.user.id) {
      socket.join(`user:${socket.user.id}`);
    }
    
    // Join room untuk broadcast umum
    socket.join('broadcast');

    // Handle panic button
    socket.on('panic', (data) => {
      // Broadcast ke semua admin dan petugas keamanan
      io.to('admin').emit('panic_alert', {
        userId: socket.user.id,
        location: data.location,
        timestamp: new Date(),
        message: data.message || 'Tombol panik diaktifkan!'
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

// Fungsi untuk mengirim notifikasi ke user tertentu
const notifyUser = (userId, event, data) => {
  if (!io) {
    return { success: false, error: 'Socket.IO belum diinisialisasi' };
  }
  
  io.to(`user:${userId}`).emit(event, data);
  return { success: true };
};

// Fungsi untuk broadcast ke semua user
const broadcastToAll = (event, data) => {
  if (!io) {
    return { success: false, error: 'Socket.IO belum diinisialisasi' };
  }
  
  io.to('broadcast').emit(event, data);
  return { success: true };
};

module.exports = {
  initSocket,
  notifyUser,
  broadcastToAll,
  getIO: () => io
};