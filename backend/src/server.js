const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');
const seedInitialData = require('./utils/seedData');

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION] Shutting down...', err);
  process.exit(1);
});

// Connect Database & Start Server
const startServer = async () => {
  const dbConn = await connectDB();
  if (dbConn) {
    await seedInitialData();
  }

  const server = app.listen(env.port, () => {
    console.log(`[IELTS Backend] Server running in ${env.nodeEnv} mode on port ${env.port}`);
    console.log(`[Health Endpoint] http://localhost:${env.port}/api/v1/health`);
  });

  // Handle Unhandled Promise Rejections
  process.on('unhandledRejection', (err) => {
    console.error('[UNHANDLED REJECTION] Shutting down gracefully...', err);
    server.close(() => {
      process.exit(1);
    });
  });

  // Handle SIGTERM
  process.on('SIGTERM', () => {
    console.log('[SIGTERM RECEIVED] Shutting down gracefully.');
    server.close(() => {
      console.log('Process terminated.');
    });
  });
};

startServer();
