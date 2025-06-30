const winston = require('winston');
const Sentry = require('@sentry/node');
const config = require('../config/config');

// Konfigurasi Sentry
if (config.SENTRY_DSN) {
  Sentry.init({
    dsn: config.SENTRY_DSN,
    environment: config.NODE_ENV,
    tracesSampleRate: 1.0, // Capture 100% of transactions
  });
}

// Format log Winston
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Konfigurasi Winston logger
const logger = winston.createLogger({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'indah-bermasyarakat-api' },
  transports: [
    // Menulis semua log ke console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          return `${timestamp} ${level}: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
          }`;
        })
      ),
    }),
    // Menulis log error ke file
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Menulis semua log ke file
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Fungsi untuk logging error ke Sentry
const captureException = (error, context = {}) => {
  if (config.SENTRY_DSN) {
    Sentry.withScope((scope) => {
      Object.keys(context).forEach((key) => {
        scope.setExtra(key, context[key]);
      });
      Sentry.captureException(error);
    });
  }
  
  // Log juga ke Winston
  logger.error(error.message, { 
    error: error.stack,
    ...context
  });
};

// Fungsi untuk logging info
const info = (message, meta = {}) => {
  logger.info(message, meta);
};

// Fungsi untuk logging warning
const warn = (message, meta = {}) => {
  logger.warn(message, meta);
};

// Fungsi untuk logging debug
const debug = (message, meta = {}) => {
  logger.debug(message, meta);
};

module.exports = {
  logger,
  captureException,
  info,
  warn,
  debug,
  Sentry
};