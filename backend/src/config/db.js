const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: env.nodeEnv !== 'production'
    });
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error(`[MongoDB Connection Error] ${err.message}`);
    if (env.nodeEnv === 'production') {
      process.exit(1);
    }
    console.warn('[MongoDB] Running in offline / unlinked mode for development.');
    return null;
  }
};

module.exports = connectDB;
