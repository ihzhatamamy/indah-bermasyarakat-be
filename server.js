const { app, server } = require('./src/app');
const config = require('./src/config/config');
const { logger } = require('./src/utils/logger');

const PORT = config.PORT || 3000;

server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📝 Environment: ${config.NODE_ENV}`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${config.NODE_ENV}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', err);
  console.error(err);
  
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  console.error(err);
  
  // Exit process
  process.exit(1);
});