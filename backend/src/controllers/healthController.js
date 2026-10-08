const mongoose = require('mongoose');
const { sendSuccess } = require('../utils/apiResponse');

const getHealthStatus = (req, res) => {
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const dbState = dbStateMap[mongoose.connection.readyState] || 'unknown';

  const healthData = {
    status: 'UP',
    service: 'IELTS Adaptive Learning API',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      status: dbState,
      name: mongoose.connection.name || 'unconnected'
    }
  };

  return sendSuccess(res, 200, healthData, 'System is healthy and operational');
};

module.exports = {
  getHealthStatus
};
