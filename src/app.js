const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { connectDB } = require('./config/database');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { logger, Sentry } = require('./utils/logger');
const { initSocket } = require('./utils/socket');
const { verifyConnection: verifyEmailConnection } = require('./utils/email');
const config = require('./config/config');

const app = express();
const server = http.createServer(app);

// Connect to Database
connectDB();

// Verifikasi koneksi email
try {
  verifyEmailConnection();
} catch (error) {
  console.warn('Email connection could not be verified:', error.message);
}

// Inisialisasi Socket.IO
initSocket(server);

// Sentry request handler
if (config.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler());
}

// Security Middleware
app.use(helmet());
app.use(cors());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files untuk uploads - pastikan path ada dan terdefinisi
const uploadPath = config.UPLOAD_PATH || 'uploads';
const absoluteUploadPath = path.join(__dirname, '..', uploadPath);

// Pastikan direktori upload ada
if (!fs.existsSync(absoluteUploadPath)) {
  try {
    fs.mkdirSync(absoluteUploadPath, { recursive: true });
    console.log(`Created upload directory: ${absoluteUploadPath}`);
  } catch (error) {
    console.warn(`Could not create upload directory: ${error.message}`);
  }
}

// Gunakan path absolut untuk static files
app.use('/uploads', express.static(absoluteUploadPath));

// Routes
app.use('/api', routes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Sentry error handler
if (config.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

// Error Handler Middleware
app.use(errorHandler);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Export app dan server untuk digunakan di server.js
module.exports = { app, server };